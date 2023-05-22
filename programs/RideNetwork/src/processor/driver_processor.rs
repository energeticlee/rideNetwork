use crate::{error::ErrorCode, state::*, *};

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer};

pub fn process_init_driver_infra(
    ctx: Context<InitDriverInfra>,
    params: InitDriverInfraParam,
) -> Result<()> {
    let country_state = &mut ctx.accounts.country_state;
    let driver_infra = &mut ctx.accounts.driver_infra;
    let company_info = &mut ctx.accounts.company_info;

    if params.driver_infra_count != country_state.driver_infra_counter + 1 {
        return err!(ErrorCode::IncorrectInitDriverInfraCount);
    }
    // Company Info
    company_info.company_name = params.company_name;
    company_info.uen = params.uen;
    company_info.website = params.website;

    // Driver Infra
    driver_infra.creator = ctx.accounts.driver_infra_owner.key();
    driver_infra.update_authority = ctx.accounts.driver_infra_owner.key();
    driver_infra.job_counter = 0;
    driver_infra.driver_infra_count = country_state.driver_infra_counter + 1;
    driver_infra.is_initialized = true;
    driver_infra.is_verified = false;
    driver_infra.is_frozen = false;
    driver_infra.driver_infra_fee_basis_point = params.driver_infra_fee_basis_point;
    driver_infra.company_info_current_count = 0;

    // Proceed to transfer deposit
    process_transfer_driver_deposit(ctx)?;

    Ok(())
}

pub fn process_update_driver_infra_company(
    ctx: Context<UpdateDriverInfraCompany>,
    params: UpdateInfraCompanyParam,
) -> Result<()> {
    let driver_infra = &mut ctx.accounts.driver_infra;
    let new_company_info = &mut ctx.accounts.new_company_info;

    new_company_info.company_name = params.company_name;
    new_company_info.uen = params.uen;
    new_company_info.website = params.website;

    driver_infra.company_info_current_count = params.old_company_info_count + 1;
    driver_infra.is_frozen = true;

    Ok(())
}

pub fn process_update_driver_infra_basis_point(
    ctx: Context<UpdateDriverInfraBasisPoint>,
    basis_point: u16,
) -> Result<()> {
    ctx.accounts.driver_infra.driver_infra_fee_basis_point = basis_point;

    Ok(())
}

pub fn process_driver_start_or_update(
    ctx: Context<DriverStartOrUpdate>,
    uuid: String,
    current_location: Coordinates,
    job_type: JobType,
    next_location: Option<Coordinates>,
) -> Result<()> {
    let driver = &mut ctx.accounts.driver;

    let valid_lat = is_valid_coordinate(current_location.lat);
    let valid_long = is_valid_coordinate(current_location.long);

    if !valid_lat && !valid_long {
        return err!(ErrorCode::InvalidCoordinatesValid);
    }

    if !driver.is_initialized {
        driver.uuid = uuid;
        driver.is_initialized = true;
        driver.infra_authority = ctx.accounts.driver_infra.key();
        driver.next_location = None;
        driver.job_type = job_type;
    } else if driver.next_location.is_some() {
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
    let rider_infra = &mut ctx.accounts.rider_infra;
    let driver_infra = &mut ctx.accounts.driver_infra;
    let driver = &mut ctx.accounts.driver;
    let job = &mut ctx.accounts.job;
    let country_state = &mut ctx.accounts.country_state;

    if job.status == Status::Init || job.status == Status::JobAccepted {
        return err!(ErrorCode::JobNotYetStarted);
    }
    // job status dispute: error
    // This occur when dispute status is marked as completed before ride ended
    if job.status == Status::DisputeByRider {
        return err!(ErrorCode::JobDisputeByRider);
    }
    if job.status == Status::CancelledByRider {
        return err!(ErrorCode::CancelledByRider);
    }
    if job.status == Status::CancelledByDriver {
        return err!(ErrorCode::CancelledByDriver);
    }

    // End trip without funds approval, update status to complete
    job.status = Status::Completed;

    // status complete & finalize_duration_sec over, approve fund
    let current_time = Clock::get().unwrap().unix_timestamp as u64;
    let time_pass = current_time - country_state.finalize_duration_sec;
    if job.status == Status::Completed && time_pass > job.job_end_time.unwrap() {
        // Transfer funds from escrow to driver_infra_owner and rider_infra_owner
        let auth_bump = *ctx.bumps.get("job").unwrap();
        let seeds = &[b"job".as_ref(), &job_count.to_le_bytes(), &[auth_bump]];
        let signer = &[&seeds[..]];
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts_to_driver_infra = Transfer {
            from: ctx.accounts.job_esrow_stable.to_account_info(),
            to: ctx.accounts.driver_infra_stable.to_account_info(),
            authority: job.to_account_info(),
        };
        let token_transfer_context_to_driver_infra =
            CpiContext::new_with_signer(cpi_program.clone(), cpi_accounts_to_driver_infra, signer);

        let cpi_accounts_to_rider_infra = Transfer {
            from: ctx.accounts.job_esrow_stable.to_account_info(),
            to: ctx.accounts.rider_infra_stable.to_account_info(),
            authority: job.to_account_info(),
        };
        let token_transfer_context_to_rider_infra =
            CpiContext::new_with_signer(cpi_program, cpi_accounts_to_rider_infra, signer);

        let driver_distribution = job
            .distribution
            .iter()
            .find(|item| item.provider == driver_infra.key())
            .unwrap();

        let rider_distribution = job
            .distribution
            .iter()
            .find(|item| item.provider == rider_infra.key())
            .unwrap();

        let amount_to_driver =
            (job.total_fee_cent * driver_distribution.basis_point_payout as u64) / 10_000;
        let amount_to_rider =
            (job.total_fee_cent * rider_distribution.basis_point_payout as u64) / 10_000;

        token::transfer(token_transfer_context_to_driver_infra, amount_to_driver)?;
        token::transfer(token_transfer_context_to_rider_infra, amount_to_rider)?;

        // Close job account
        job.is_initialized = false;
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
    }

    Ok(())
}

pub fn process_driver_accept_job(
    ctx: Context<DriverAcceptJob>,
    next_location: Coordinates,
) -> Result<()> {
    let driver = &mut ctx.accounts.driver;
    let job = &mut ctx.accounts.job;

    // This shouldn't happen => Job account should be closed
    if job.status == Status::CancelledByRider {
        return err!(ErrorCode::CancelledByRider);
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

pub fn process_driver_pickup_rider(
    ctx: Context<DriverPickupRider>,
    rider_infra_count: u64,
) -> Result<()> {
    let job = &mut ctx.accounts.job;
    let country_state = &mut ctx.accounts.country_state;

    if job.status == Status::CancelledByRider {
        return err!(ErrorCode::CancelledByRider);
    }
    if job.status == Status::DisputeByRider {
        return err!(ErrorCode::JobDisputeByRider);
    }
    if job.status != Status::Arrived {
        return err!(ErrorCode::IncorrectLifecycleArrived);
    }

    job.status = Status::Started;

    // WAITING FEES
    let current_time = Clock::get().unwrap().unix_timestamp as u64;
    if current_time - country_state.waiting_fee_sec > job.arrival_time.unwrap() {
        // Process to charge rider_infra waiting time
        // Transfer fees to driver_infra
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

    if job.status == Status::CancelledByRider {
        return err!(ErrorCode::CancelledByRider);
    }
    if job.status == Status::DisputeByRider {
        return err!(ErrorCode::JobDisputeByRider);
    }

    // Lifecycle Requirement
    if job.status != Status::JobAccepted {
        return err!(ErrorCode::IncorrectLifecycleJobAccepted);
    }

    job.status = Status::CancelledByDriver;

    // Charge driver_infra if driver cancel job after driver_cancellation_fee_sec
    let current_time = Clock::get().unwrap().unix_timestamp as u64;
    if current_time - country_state.driver_cancellation_fee_sec > job.job_start_time.unwrap() {
        // Process to transfer driver_infra to rider_infra
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
            to: ctx.accounts.rider_infra_stable.to_account_info(),
            authority: ctx.accounts.driver_infra.to_account_info(),
        };
        let token_transfer_context = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        token::transfer(token_transfer_context, country_state.cancellation_fee_cent)?;
    }

    // Transfer funds back to rider_infra
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
        to: ctx.accounts.rider_infra_stable.to_account_info(),
        authority: job.to_account_info(),
    };
    let token_transfer_context = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    token::transfer(token_transfer_context, job.total_fee_cent)?;

    // Close job account
    job.is_initialized = false;
    job.job_end_time = None;
    job.job_start_time = None;
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

pub fn process_driver_raise_issue(ctx: Context<DriverRaiseIssue>) -> Result<()> {
    let job = &mut ctx.accounts.job;

    if job.status == Status::CancelledByRider {
        return err!(ErrorCode::CancelledByRider);
    }
    if job.status == Status::DisputeByRider {
        return err!(ErrorCode::JobDisputeByRider);
    }

    job.status = Status::DisputeByDriver;

    Ok(())
}
