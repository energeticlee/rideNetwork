use crate::{error::ErrorCode, state::*, *};

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer};

pub fn process_driver_start_work(
    ctx: Context<DriverStartWork>,
    driver_uuid: String,
    rsa_pem_pubkey: String,
    services: Vec<u64>,
    passenger_types: Vec<u64>,
    current_location: Coordinates,
) -> Result<()> {
    let driver = &mut ctx.accounts.driver;

    let valid_lat = is_valid_coordinate(current_location.lat);
    let valid_long = is_valid_coordinate(current_location.long);

    if !valid_lat && !valid_long {
        return err!(ErrorCode::InvalidCoordinatesValid);
    }

    if driver.is_initialized {
        return err!(ErrorCode::DriverAlreadyInitialized);
    }

    driver.is_initialized = true;
    driver.driver_uuid = driver_uuid;
    driver.rsa_pem_pubkey = rsa_pem_pubkey;
    driver.infra_authority = ctx.accounts.driver_infra.key();
    driver.last_location = current_location;
    driver.next_location = None;
    driver.country_key = ctx.accounts.country_state.key();
    driver.offered_service = services;
    driver.passenger_types = passenger_types;
    driver.vehicle = ctx.accounts.vehicle.key();
    driver.number_of_seats = ctx.accounts.vehicle.number_of_seats;
    driver.location_update_authority = ctx.accounts.location_update_authority.key();

    Ok(())
}

pub fn process_driver_update_location(
    ctx: Context<DriverUpdateLocation>,
    current_location: Coordinates,
    next_location: Option<Coordinates>,
) -> Result<()> {
    let driver = &mut ctx.accounts.driver;

    let valid_lat = is_valid_coordinate(current_location.lat);
    let valid_long = is_valid_coordinate(current_location.long);

    if !valid_lat && !valid_long {
        return err!(ErrorCode::InvalidCoordinatesValid);
    }

    if driver.next_location.is_some() {
        let valid_next_lat = is_valid_coordinate(next_location.clone().unwrap().lat);
        let valid_next_long = is_valid_coordinate(next_location.clone().unwrap().long);
        if !valid_next_lat && !valid_next_long {
            return err!(ErrorCode::InvalidCoordinatesValid);
        }
        driver.next_location = next_location;
    }

    driver.last_location = current_location;

    Ok(())
}

pub fn process_driver_end_work(ctx: Context<DriverEndWork>) -> Result<()> {
    let driver = &mut ctx.accounts.driver;
    driver.is_initialized = false;
    driver.next_location = None;

    Ok(())
}

pub fn process_driver_complete_job(ctx: Context<DriverCompleteJob>, job_count: u64) -> Result<()> {
    let customer_infra = &mut ctx.accounts.customer_infra;
    let driver_infra = &mut ctx.accounts.driver_infra;
    let driver = &mut ctx.accounts.driver;
    let job = &mut ctx.accounts.job;
    let country_state = &mut ctx.accounts.country_state;

    if job.status == Status::Init {
        return err!(ErrorCode::JobNotYetStarted);
    }

    // This occur when dispute status is marked as completed before ride ended
    if job.status == Status::DisputeByCustomer {
        return err!(ErrorCode::JobDisputeByCustomer);
    }
    if job.status == Status::CancelledByCustomer {
        return err!(ErrorCode::CancelledByCustomer);
    }
    if job.status == Status::CancelledByDriver {
        return err!(ErrorCode::CancelledByDriver);
    }

    // End trip without funds approval, update status to complete
    // Only run the first time
    if job.status != Status::Completed {
        job.job_end_time = Some(Clock::get().unwrap().unix_timestamp as u64);
    }

    // status complete & finalize_duration_sec over, approve fund
    let current_time_sec = Clock::get().unwrap().unix_timestamp as u64;
    let valid_claim_time = job.job_end_time.unwrap() + country_state.finalize_duration_sec;

    if job.status == Status::Completed && current_time_sec > valid_claim_time {
        // Transfer funds from escrow to driver_infra_owner and customer_infra_owner
        let auth_bump = *ctx.bumps.get("job").unwrap();
        let seeds = &[
            b"job".as_ref(),
            &driver_infra.key().to_bytes(),
            &job_count.to_le_bytes(),
            &[auth_bump],
        ];
        let signer = &[&seeds[..]];
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts_to_driver_infra = Transfer {
            from: ctx.accounts.job_esrow_stable.to_account_info(),
            to: ctx.accounts.driver_infra_stable.to_account_info(),
            authority: job.to_account_info(),
        };
        let token_transfer_context_to_driver_infra =
            CpiContext::new_with_signer(cpi_program.clone(), cpi_accounts_to_driver_infra, signer);

        let cpi_accounts_to_customer_infra = Transfer {
            from: ctx.accounts.job_esrow_stable.to_account_info(),
            to: ctx.accounts.customer_infra_stable.to_account_info(),
            authority: job.to_account_info(),
        };
        let token_transfer_context_to_customer_infra =
            CpiContext::new_with_signer(cpi_program, cpi_accounts_to_customer_infra, signer);

        let driver_distribution = job
            .distribution
            .iter()
            .find(|item| item.provider == driver_infra.key())
            .unwrap();

        let customer_distribution = job
            .distribution
            .iter()
            .find(|item| item.provider == customer_infra.key())
            .unwrap();

        let amount_to_driver =
            job.total_fee_cent / 10_000 * driver_distribution.basis_point_payout as u64;
        let amount_to_customer =
            job.total_fee_cent / 10_000 * customer_distribution.basis_point_payout as u64;

        token::transfer(token_transfer_context_to_driver_infra, amount_to_driver)?;
        token::transfer(token_transfer_context_to_customer_infra, amount_to_customer)?;

        // Close job account
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
    }
    job.status = Status::Completed;

    Ok(())
}

pub fn process_driver_pickup_customer(
    ctx: Context<DriverPickupCustomer>,
    customer_infra_count: u64,
) -> Result<()> {
    let job = &mut ctx.accounts.job;
    let country_state = &mut ctx.accounts.country_state;

    if job.status == Status::CancelledByCustomer {
        return err!(ErrorCode::CancelledByCustomer);
    }
    if job.status == Status::DisputeByCustomer {
        return err!(ErrorCode::JobDisputeByCustomer);
    }
    if job.status != Status::Arrived {
        return err!(ErrorCode::IncorrectLifecycleArrived);
    }

    job.status = Status::Started;

    // WAITING FEES
    let current_time = Clock::get().unwrap().unix_timestamp as u64;
    if current_time - country_state.waiting_fee_sec > job.arrival_time.unwrap() {
        // Process to charge customer_infra waiting time
        // Transfer fees to driver_infra
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
        let token_transfer_context = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        token::transfer(token_transfer_context, country_state.waiting_fee_cent)?;
    }

    Ok(())
}

pub fn process_driver_cancel_job(
    ctx: Context<DriverCancelJob>,
    driver_infra_count: u64,
    job_count: u64,
) -> Result<()> {
    let driver = &mut ctx.accounts.driver;
    let job = &mut ctx.accounts.job;
    let country_state = &mut ctx.accounts.country_state;

    if job.status == Status::CancelledByCustomer {
        return err!(ErrorCode::CancelledByCustomer);
    }
    if job.status == Status::DisputeByCustomer {
        return err!(ErrorCode::JobDisputeByCustomer);
    }

    // Lifecycle Requirement
    if job.status == Status::JobAccepted || job.status == Status::Init {
        job.status = Status::RejectedByDriver;

        if job.status == Status::JobAccepted {
            job.status = Status::CancelledByDriver;

            // Charge driver_infra if driver cancel job after driver_cancellation_fee_sec
            let current_time = Clock::get().unwrap().unix_timestamp as u64;
            if current_time - country_state.driver_cancellation_fee_sec
                > job.job_start_time.unwrap()
            {
                // Process to transfer driver_infra to customer_infra
                let auth_bump = *ctx.bumps.get("driver_infra").unwrap();
                let seeds = &[
                    b"driver_infra".as_ref(),
                    &driver_infra_count.to_le_bytes(),
                    &[auth_bump],
                ];
                let signer = &[&seeds[..]];
                let cpi_program = ctx.accounts.token_program.to_account_info();
                let cpi_accounts = Transfer {
                    from: ctx.accounts.driver_infra_stable.to_account_info(),
                    to: ctx.accounts.customer_infra_stable.to_account_info(),
                    authority: ctx.accounts.driver_infra.to_account_info(),
                };
                let token_transfer_context =
                    CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

                token::transfer(token_transfer_context, country_state.cancellation_fee_cent)?;
            }

            // Transfer funds back to customer_infra
            let auth_bump = *ctx.bumps.get("job").unwrap();
            let seeds = &[
                b"job".as_ref(),
                &ctx.accounts.driver_infra.key().to_bytes(),
                &job_count.to_le_bytes(),
                &[auth_bump],
            ];
            let signer = &[&seeds[..]];
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_accounts = Transfer {
                from: ctx.accounts.job_esrow_stable.to_account_info(),
                to: ctx.accounts.customer_infra_stable.to_account_info(),
                authority: job.to_account_info(),
            };
            let token_transfer_context =
                CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

            token::transfer(token_transfer_context, job.total_fee_cent)?;
        }
    } else {
        msg!("job.status, {:?}", job.status);
        return err!(ErrorCode::IncorrectLifecycleJobAccepted);
    }

    // Close job account
    job.job_end_time = None;
    job.job_start_time = None;
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

pub fn process_driver_raise_issue(ctx: Context<DriverRaiseIssue>) -> Result<()> {
    let job = &mut ctx.accounts.job;

    if job.status == Status::CancelledByCustomer {
        return err!(ErrorCode::CancelledByCustomer);
    }
    if job.status == Status::DisputeByCustomer {
        return err!(ErrorCode::JobDisputeByCustomer);
    }

    job.status = Status::DisputeByDriver;

    Ok(())
}
