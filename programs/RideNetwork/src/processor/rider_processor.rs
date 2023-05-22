use crate::{error::ErrorCode, state::*, *};

use anchor_lang::prelude::*;
use anchor_spl::token::{self, transfer, Transfer};

pub fn process_init_rider_infra(
    ctx: Context<InitRiderInfra>,
    params: InitRiderInfraParam,
) -> Result<()> {
    let rider_infra = &mut ctx.accounts.rider_infra;
    let country_state = &mut ctx.accounts.country_state;
    let company_info = &mut ctx.accounts.company_info;

    if params.rider_infra_count != country_state.rider_infra_counter + 1 {
        return err!(ErrorCode::IncorrectInitRiderInfraCount);
    }

    // Company Info
    company_info.company_name = params.company_name;
    company_info.uen = params.uen;
    company_info.website = params.website;

    // Driver Infra
    rider_infra.creator = ctx.accounts.rider_infra_owner.key();
    rider_infra.update_authority = ctx.accounts.rider_infra_owner.key();
    rider_infra.rider_infra_count = country_state.rider_infra_counter + 1;
    rider_infra.is_initialized = true;
    rider_infra.is_verified = false;
    rider_infra.is_frozen = false;
    rider_infra.rider_infra_fee_basis_point = params.rider_infra_fee_basis_point;
    rider_infra.company_info_current_count = 0;

    process_transfer_rider_deposit(ctx)?;
    Ok(())
}

pub fn process_update_rider_infra_company(
    ctx: Context<UpdateRiderInfraCompany>,
    params: UpdateInfraCompanyParam,
) -> Result<()> {
    let infra = &mut ctx.accounts.rider_infra;
    let new_company_info = &mut ctx.accounts.new_company_info;

    new_company_info.company_name = params.company_name;
    new_company_info.uen = params.uen;
    new_company_info.website = params.website;

    infra.company_info_current_count = params.old_company_info_count + 1;
    infra.is_frozen = true;

    Ok(())
}

pub fn process_update_rider_infra_basis_point(
    ctx: Context<UpdateRiderInfraBasisPoint>,
    basis_point: u16,
) -> Result<()> {
    ctx.accounts.rider_infra.rider_infra_fee_basis_point = basis_point;

    Ok(())
}

pub fn process_rider_request_ride(
    ctx: Context<RiderRequestRide>,
    uuid: String,
    encrypted_data_size: String,
    total_fees: u64,
) -> Result<()> {
    let rider_infra = &mut ctx.accounts.rider_infra;
    let job = &mut ctx.accounts.job;

    if !job.is_initialized {
        job.driver_infra = ctx.accounts.driver_infra.key();
        job.driver_uuid = uuid;
        job.rider_infra = rider_infra.key();
        job.job_initialized_time = Clock::get().unwrap().unix_timestamp as u64;
        job.total_fee_cent = total_fees;
        let driver_share = Distribution {
            provider: ctx.accounts.driver_infra.key(),
            basis_point_payout: ctx.accounts.driver_infra.driver_infra_fee_basis_point,
        };
        let rider_share = Distribution {
            provider: rider_infra.key(),
            basis_point_payout: rider_infra.rider_infra_fee_basis_point,
        };

        job.distribution.push(driver_share);
        job.distribution.push(rider_share);

        job.status = Status::Init;
        job.is_initialized = true;
        job.data = encrypted_data_size;

        // Transfer funds to Escrow
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts = Transfer {
            from: ctx.accounts.rider_infra_owner_stable.to_account_info(),
            to: ctx.accounts.job_escrow_stable.to_account_info(),
            authority: ctx.accounts.rider_infra_owner.to_account_info(),
        };
        let token_transfer_context = CpiContext::new(cpi_program, cpi_accounts);
        transfer(token_transfer_context, total_fees)?;
    } else {
        return err!(ErrorCode::JobAlreadyInitialized);
    }
    Ok(())
}

pub fn process_rider_cancel_ride(
    ctx: Context<RiderCancelRide>,
    rider_infra_count: u64,
) -> Result<()> {
    let driver = &mut ctx.accounts.driver;
    let job = &mut ctx.accounts.job;
    let country_state = &mut ctx.accounts.country_state;

    // Driver already cancelled
    if job.status == Status::CancelledByDriver {
        return err!(ErrorCode::CancelledByDriver);
    }
    // Dispute raised by driver, settle off-chain
    if job.status == Status::JobAccepted {
        return err!(ErrorCode::JobDisputeByDriver);
    }

    // Lifecycle requirement
    // Driver found, else proceed to close accounts
    if job.status == Status::JobAccepted && job.job_start_time.is_some() {
        job.status = Status::CancelledByRider;

        let current_time = Clock::get().unwrap().unix_timestamp as u64;
        if current_time - country_state.rider_cancellation_fee_sec > job.job_start_time.unwrap() {
            // Process to transfer rider_infra to driver_infra
            let auth_bump = *ctx.bumps.get("rider_infra").unwrap();
            let seeds = &[
                b"rider_infra".as_ref(),
                &rider_infra_count.to_le_bytes(),
                &[auth_bump],
            ];
            let signer = &[&seeds[..]];
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_accounts = Transfer {
                from: ctx.accounts.rider_infra_stable.to_account_info(),
                to: ctx.accounts.driver_infra_stable.to_account_info(),
                authority: ctx.accounts.rider_infra.to_account_info(),
            };
            let token_transfer_context =
                CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

            token::transfer(token_transfer_context, country_state.cancellation_fee_cent)?;
        }
    }

    // Close job account
    job.is_initialized = false;
    job.job_start_time = None;
    job.job_end_time = None;
    job.total_fee_cent = 0;
    job.distribution = vec![];
    job.data = "".to_owned();
    job.close(ctx.accounts.rider_infra.to_account_info())?;

    // Close driver account
    driver.uuid = "".to_owned();
    driver.is_initialized = false;
    driver.next_location = None;
    driver.close(ctx.accounts.driver_infra.to_account_info())?;

    Ok(())
}

pub fn process_rider_raise_issue(ctx: Context<RiderRaiseIssue>) -> Result<()> {
    let job = &mut ctx.accounts.job;

    // Ride already cancelled by driver
    if job.status == Status::CancelledByDriver {
        return err!(ErrorCode::CancelledByDriver);
    }
    // Driver raised issue, settle off-chain
    if job.status == Status::DisputeByDriver {
        return err!(ErrorCode::JobDisputeByDriver);
    }

    job.status = Status::DisputeByRider;

    Ok(())
}
