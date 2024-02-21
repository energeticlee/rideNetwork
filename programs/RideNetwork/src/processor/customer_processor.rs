use crate::{error::ErrorCode, state::*, *};

use anchor_lang::prelude::*;
use anchor_spl::token::{self, transfer, Transfer};

pub fn process_customer_request_ride(
    ctx: Context<CustomerRequestRide>,
    job_count: u64,
    driver_uuid: String,
    encrypted_data: String,
    encrypted_combined_rand_base64: String,
    total_fees: u64,
) -> Result<()> {
    let customer_infra = &mut ctx.accounts.customer_infra;
    let job = &mut ctx.accounts.job;
    let driver_infra = &mut ctx.accounts.driver_infra;

    job.driver_infra = driver_infra.key();
    job.job_count = job_count;
    job.driver_uuid = driver_uuid;
    job.customer_infra = customer_infra.key();
    job.job_initialized_time = Clock::get().unwrap().unix_timestamp as u64;
    job.total_fee_cent = total_fees;
    let driver_share = Distribution {
        provider: driver_infra.key(),
        basis_point_payout: driver_infra.driver_infra_fee_basis_point,
    };
    let customer_share = Distribution {
        provider: customer_infra.key(),
        basis_point_payout: customer_infra.customer_infra_fee_basis_point,
    };

    job.distribution.push(driver_share);
    job.distribution.push(customer_share);

    job.status = Status::Init;
    job.encrypted_data = encrypted_data;
    job.encrypted_combined_rand_base64 = encrypted_combined_rand_base64;

    // Transfer funds to Escrow
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_accounts = Transfer {
        from: ctx.accounts.customer_infra_owner_stable.to_account_info(),
        to: ctx.accounts.job_escrow_stable.to_account_info(),
        authority: ctx.accounts.customer_infra_owner.to_account_info(),
    };
    let token_transfer_context = CpiContext::new(cpi_program, cpi_accounts);
    transfer(token_transfer_context, total_fees)?;

    Ok(())
}

pub fn process_driver_accepted_job(
    ctx: Context<DriverAcceptedJob>,
    next_location: Coordinates,
) -> Result<()> {
    let driver = &mut ctx.accounts.driver;
    let job = &mut ctx.accounts.job;

    // This shouldn't happen => Job account should be closed
    if job.status == Status::CancelledByCustomer {
        return err!(ErrorCode::CancelledByCustomer);
    }

    if job.status == Status::JobAccepted {
        return err!(ErrorCode::JobAlreadyAccepted);
    }

    if job.status == Status::Init {
        driver.next_location = Some(next_location);
        job.status = Status::JobAccepted;
        job.job_start_time = Some(Clock::get().unwrap().unix_timestamp as u64);
        let driver_share = Distribution {
            provider: ctx.accounts.driver_infra.key(),
            basis_point_payout: ctx.accounts.driver_infra.driver_infra_fee_basis_point,
        };

        let is_matching = job.distribution.iter().any(|item| {
            item.provider == driver_share.provider
                && item.basis_point_payout == driver_share.basis_point_payout
        });

        if !is_matching {
            return err!(ErrorCode::MismatchDriverPayout);
        }
    }

    Ok(())
}

pub fn process_customer_cancel_ride(
    ctx: Context<CustomerCancelRide>,
    customer_infra_count: u64,
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
        job.status = Status::CancelledByCustomer;

        let current_time = Clock::get().unwrap().unix_timestamp as u64;
        if current_time - country_state.customer_cancellation_fee_sec > job.job_start_time.unwrap()
        {
            // Process to transfer customer_infra to driver_infra
            let auth_bump = *ctx.bumps.get("customer_infra").unwrap();
            let seeds = &[
                b"customer_infra".as_ref(),
                &customer_infra_count.to_le_bytes(),
                &[auth_bump],
            ];
            let signer = &[&seeds[..]];
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_accounts = Transfer {
                from: ctx.accounts.customer_infra_stable.to_account_info(),
                to: ctx.accounts.driver_infra_stable.to_account_info(),
                authority: ctx.accounts.customer_infra.to_account_info(),
            };
            let token_transfer_context =
                CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

            token::transfer(token_transfer_context, country_state.cancellation_fee_cent)?;
        }
    }

    // Close job account
    job.job_start_time = None;
    job.job_end_time = None;
    job.total_fee_cent = 0;
    job.distribution = vec![];
    job.encrypted_data = "".to_owned();
    job.encrypted_combined_rand_base64 = "".to_owned();
    job.close(ctx.accounts.customer_infra.to_account_info())?;

    // Close driver account
    driver.driver_uuid = "".to_owned();
    driver.is_initialized = false;
    driver.next_location = None;
    driver.close(ctx.accounts.driver_infra.to_account_info())?;

    Ok(())
}

pub fn process_customer_raise_issue(ctx: Context<CustomerRaiseIssue>) -> Result<()> {
    let job = &mut ctx.accounts.job;

    // Ride already cancelled by driver
    if job.status == Status::CancelledByDriver {
        return err!(ErrorCode::CancelledByDriver);
    }
    // Driver raised issue, settle off-chain
    if job.status == Status::DisputeByDriver {
        return err!(ErrorCode::JobDisputeByDriver);
    }

    job.status = Status::DisputeByCustomer;

    Ok(())
}
