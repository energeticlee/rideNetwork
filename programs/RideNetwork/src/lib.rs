mod error;
mod processor;
mod state;
mod validator;

use crate::state::JobType;
use anchor_lang::prelude::*;
use processor::country_processor::*;
use processor::driver_processor::*;
use processor::global_processor::*;
use processor::rider_processor::*;
use state::*;
use validator::country_validator::*;
use validator::driver_validator::*;
use validator::global_validator::*;
use validator::rider_validator::*;

declare_id!("AdzUEnPqSShvbkMyEsPuz1AZGaKdb6x9kH3hbbtEvKym");

#[program]
pub mod ride_network {

    use super::*;

    // GLOBAL
    pub fn init_or_update_global(
        ctx: Context<InitOrUpdateGlobal>,
        params: InitOrUpdateGlobalParam,
    ) -> Result<()> {
        process_init_or_update_global(ctx, params)?;
        Ok(())
    }
    pub fn change_gobal_authority(ctx: Context<ChangeGlobalAuthority>) -> Result<()> {
        process_change_gobal_authority(ctx)?;
        Ok(())
    }

    // COUNTRY
    pub fn init_or_update_country(
        ctx: Context<InitOrUpdateCountry>,
        params: InitOrUpdateCountryParam,
        alpha3_country_code: String,
    ) -> Result<()> {
        process_init_or_update_country(ctx, params, alpha3_country_code)?;
        Ok(())
    }
    pub fn update_new_country_authority(ctx: Context<ChangeCountryAuthority>) -> Result<()> {
        process_change_country_authority(ctx)?;
        Ok(())
    }

    // Add and update country jobs
    pub fn add_new_country_job(
        ctx: Context<InitOrUpdateJob>,
        _job_count: u64,
        job_name: String,
    ) -> Result<()> {
        process_add_new_country_job(ctx, job_name)?;
        Ok(())
    }

    // Verify driver and rider infra
    pub fn approve_driver_infra(
        ctx: Context<ApproveDriverInfra>,
        _driver_infra_count: u64,
    ) -> Result<()> {
        process_approve_driver_infra(ctx)?;
        Ok(())
    }
    pub fn approve_rider_infra(
        ctx: Context<ApproveRiderInfra>,
        _rider_infra_count: u64,
    ) -> Result<()> {
        process_approve_rider_infra(ctx)?;
        Ok(())
    }
    pub fn driver_infra_suspension(
        ctx: Context<DriverInfraSuspension>,
        _driver_count: u64,
    ) -> Result<()> {
        process_driver_infra_suspension(ctx)?;
        Ok(())
    }
    pub fn rider_infra_suspension(
        ctx: Context<RiderInfraSuspension>,
        _rider_count: u64,
    ) -> Result<()> {
        process_rider_infra_suspension(ctx)?;
        Ok(())
    }
    pub fn driver_infra_slash(
        ctx: Context<DriverInfraSlash>,
        driver_infra_count: u64,
        base_slash_multiplier: f32,
    ) -> Result<()> {
        process_driver_infra_slash(ctx, driver_infra_count, base_slash_multiplier)?;
        Ok(())
    }
    pub fn rider_infra_slash(
        ctx: Context<RiderInfraSlash>,
        rider_infra_count: u64,
        base_slash_multiplier: f32,
    ) -> Result<()> {
        process_rider_infra_slash(ctx, rider_infra_count, base_slash_multiplier)?;
        Ok(())
    }

    // INIT DRIVER INFRA
    pub fn init_driver_infra(
        ctx: Context<InitDriverInfra>,
        params: InitDriverInfraParam,
    ) -> Result<()> {
        process_init_driver_infra(ctx, params)?;
        Ok(())
    }
    // UPDATE DRIVER INFRA COMPANY INFO
    pub fn update_driver_infra_company(
        ctx: Context<UpdateDriverInfraCompany>,
        params: UpdateInfraCompanyParam,
    ) -> Result<()> {
        process_update_driver_infra_company(ctx, params)?;
        Ok(())
    }

    // UPDATE DRIVER INFRA BASIS POINT
    pub fn update_driver_infra_basis_point(
        ctx: Context<UpdateDriverInfraBasisPoint>,
        basis_point: u16,
    ) -> Result<()> {
        process_update_driver_infra_basis_point(ctx, basis_point)?;
        Ok(())
    }

    // DRIVER START OR UPDATE
    pub fn driver_start_or_update(
        ctx: Context<DriverStartOrUpdate>,
        uuid: String,
        current_location: Coordinates,
        job_type: JobType,
        next_location: Option<Coordinates>,
    ) -> Result<()> {
        process_driver_start_or_update(ctx, uuid, current_location, job_type, next_location)?;
        Ok(())
    }
    // DRIVER END WORK
    pub fn driver_end_work(ctx: Context<DriverEndWork>, _uuid: String) -> Result<()> {
        process_driver_end_work(ctx)?;
        Ok(())
    }
    // DRIVER COMPLETE JOB
    pub fn driver_complete_job(
        ctx: Context<DriverCompleteJob>,
        uuid: String,
        driver_infra_count: u64,
        rider_infra_count: u64,
        job_count: u64,
    ) -> Result<()> {
        process_driver_complete_job(ctx, job_count)?;
        Ok(())
    }
    // DRIVER ACCEPT JOB
    pub fn driver_accept_job(
        ctx: Context<DriverAcceptJob>,
        uuid: String,
        driver_infra_count: u64,
        job_count: u64,
        next_location: Coordinates,
    ) -> Result<()> {
        process_driver_accept_job(ctx, next_location)?;
        Ok(())
    }

    // DRIVER PICKUP RIDER
    pub fn driver_pickup_rider(
        ctx: Context<DriverPickupRider>,
        driver_infra_count: u64,
        rider_infra_count: u64,
        job_count: u64,
    ) -> Result<()> {
        process_driver_pickup_rider(ctx, rider_infra_count)?;
        Ok(())
    }

    // DRIVER CANCEL JOB
    pub fn driver_reject_job(
        ctx: Context<DriverCancelJob>,
        uuid: String,
        driver_infra_count: u64,
        rider_infra_count: u64,
        job_count: u64,
    ) -> Result<()> {
        process_driver_cancel_job(ctx, driver_infra_count, job_count)?;
        Ok(())
    }

    // DRIVER RAISE ISSUE
    pub fn driver_raise_issue(
        ctx: Context<DriverRaiseIssue>,
        driver_infra_count: u64,
        job_count: u64,
    ) -> Result<()> {
        process_driver_raise_issue(ctx)?;
        Ok(())
    }

    // INIT RIDER INFRA
    pub fn init_rider_infra(
        ctx: Context<InitRiderInfra>,
        params: InitRiderInfraParam,
    ) -> Result<()> {
        process_init_rider_infra(ctx, params)?;
        Ok(())
    }

    // UPDATE DRIVER INFRA COMPANY INFO
    pub fn update_rider_infra_company(
        ctx: Context<UpdateRiderInfraCompany>,
        params: UpdateInfraCompanyParam,
    ) -> Result<()> {
        process_update_rider_infra_company(ctx, params)?;
        Ok(())
    }

    // INIT RIDER INFRA
    pub fn update_rider_infra_basis_point(
        ctx: Context<UpdateRiderInfraBasisPoint>,
        basis_point: u16,
    ) -> Result<()> {
        process_update_rider_infra_basis_point(ctx, basis_point)?;
        Ok(())
    }

    // RIDER START OR UPDATE
    pub fn rider_request_ride(
        ctx: Context<RiderRequestRide>,
        uuid: String,
        _job_counter: u64,
        distribution_len: u8,
        encrypted_data_size: String,
        total_fees: u64,
    ) -> Result<()> {
        process_rider_request_ride(ctx, uuid, encrypted_data_size, total_fees)?;
        Ok(())
    }

    // RIDER CANCEL RIDE
    pub fn rider_cancel_ride(
        ctx: Context<RiderCancelRide>,
        uuid: String,
        rider_infra_count: u64,
        driver_infra_count: u64,
    ) -> Result<()> {
        process_rider_cancel_ride(ctx, rider_infra_count)?;
        Ok(())
    }

    // RIDER CANCEL RIDE
    pub fn rider_raise_issue(
        ctx: Context<RiderRaiseIssue>,
        rider_infra_count: u64,
        driver_infra_count: u64,
        job_counter: u64,
    ) -> Result<()> {
        process_rider_raise_issue(ctx)?;
        Ok(())
    }
}

fn is_valid_coordinate(coordinate: f64) -> bool {
    coordinate >= -90.0 && coordinate <= 90.0
}
