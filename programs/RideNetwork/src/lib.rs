mod error;
mod processor;
mod state;
mod validator;

use anchor_lang::prelude::*;
use processor::country_processor::*;
use processor::customer_infra_processor::*;
use processor::customer_processor::*;
use processor::driver_infra_processor::*;
use processor::driver_processor::*;
use processor::global_processor::*;
use processor::passenger_processor::*;
use processor::service_processor::*;
use processor::vehicle_processor::*;
use state::*;
use validator::country_validator::*;
use validator::customer_infra_validator::*;
use validator::customer_validator::*;
use validator::driver_infra_validator::*;
use validator::driver_validator::*;
use validator::global_validator::*;
use validator::passenger_validator::*;
use validator::service_validator::*;
use validator::vehicle_validator::*;

declare_id!("AdzUEnPqSShvbkMyEsPuz1AZGaKdb6x9kH3hbbtEvKym");

#[program]
pub mod ride_network {

    use super::*;

    // GLOBAL
    pub fn init_or_update_global(
        ctx: Context<InitOrUpdateGlobal>,
        platform_fee_basis_point: Option<u16>,
        new_vehicle_or_pax_fee: Option<u64>,
    ) -> Result<()> {
        process_init_or_update_global(ctx, platform_fee_basis_point, new_vehicle_or_pax_fee)?;
        Ok(())
    }
    pub fn change_gobal_authority(ctx: Context<ChangeGlobalAuthority>) -> Result<()> {
        process_change_gobal_authority(ctx)?;
        Ok(())
    }

    // COUNTRY
    pub fn init_or_update_country(
        ctx: Context<InitOrUpdateCountry>,
        alpha3_country_code: String,
        params: InitOrUpdateCountryParam,
    ) -> Result<()> {
        process_init_or_update_country(ctx, alpha3_country_code, params)?;
        Ok(())
    }
    pub fn update_new_country_authority(
        ctx: Context<ChangeCountryAuthority>,
        _alpha3_country_code: String,
    ) -> Result<()> {
        process_change_country_authority(ctx)?;
        Ok(())
    }

    // INIT DRIVER INFRA
    pub fn init_driver_infra(
        ctx: Context<InitDriverInfra>,
        alpha3_country_code: String,
        params: InitDriverInfraParam,
    ) -> Result<()> {
        process_init_driver_infra(ctx, alpha3_country_code, params)?;
        Ok(())
    }
    // UPDATE DRIVER INFRA COMPANY INFO
    pub fn update_driver_infra_company(
        ctx: Context<UpdateDriverInfraCompany>,
        _alpha3_country_code: String,
        params: UpdateInfraCompanyParam,
    ) -> Result<()> {
        process_update_driver_infra_company(ctx, params)?;
        Ok(())
    }

    // UPDATE DRIVER INFRA BASIS POINT
    pub fn update_driver_infra_basis_point(
        ctx: Context<UpdateDriverInfraBasisPoint>,
        _alpha3_country_code: String,
        basis_point: u16,
    ) -> Result<()> {
        process_update_driver_infra_basis_point(ctx, basis_point)?;
        Ok(())
    }

    // CREATE OR UPDATE SERVICE
    pub fn init_or_update_service(
        ctx: Context<InitOrUpdateService>,
        _alpha3_country_code: String,
        _service_count: u64,
        service_name: String,
    ) -> Result<()> {
        process_init_or_update_service(ctx, service_name)?;
        Ok(())
    }
    // CREATE OR UPDATE PASSENGER TYPE
    pub fn init_or_update_passenger(
        ctx: Context<InitOrUpdatePassengerTypes>,
        passenger_type_name: String,
        passenger_type_count: u64,
    ) -> Result<()> {
        process_init_or_update_passenger(ctx, passenger_type_name, passenger_type_count)?;
        Ok(())
    }

    // CREATE OR UPDATE VEHICLE
    pub fn init_vehicle(
        ctx: Context<InitVehicle>,
        _vehicle_count: u64,
        brand: String,
        model: String,
        number_of_seats: u8,
    ) -> Result<()> {
        process_init_vehicle(ctx, brand, model, number_of_seats)?;
        Ok(())
    }

    // Verify driver and CUSTOMER infra
    pub fn approve_driver_infra(
        ctx: Context<ApproveDriverInfra>,
        _alpha3_country_code: String,
        _driver_infra_count: u64,
    ) -> Result<()> {
        process_approve_driver_infra(ctx)?;
        Ok(())
    }
    pub fn approve_customer_infra(
        ctx: Context<ApproveCustomerInfra>,
        _alpha3_country_code: String,
        _customer_infra_count: u64,
    ) -> Result<()> {
        process_approve_customer_infra(ctx)?;
        Ok(())
    }
    pub fn driver_infra_suspension(
        ctx: Context<DriverInfraSuspension>,
        _alpha3_country_code: String,
        _driver_count: u64,
    ) -> Result<()> {
        process_driver_infra_suspension(ctx)?;
        Ok(())
    }
    pub fn customer_infra_suspension(
        ctx: Context<CustomerInfraSuspension>,
        _alpha3_country_code: String,
        _customer_count: u64,
    ) -> Result<()> {
        process_customer_infra_suspension(ctx)?;
        Ok(())
    }
    pub fn driver_infra_slash(
        ctx: Context<DriverInfraSlash>,
        _alpha3_country_code: String,
        driver_infra_count: u64,
        base_slash_multiplier: f32,
    ) -> Result<()> {
        process_driver_infra_slash(ctx, driver_infra_count, base_slash_multiplier)?;
        Ok(())
    }
    pub fn customer_infra_slash(
        ctx: Context<CustomerInfraSlash>,
        _alpha3_country_code: String,
        customer_infra_count: u64,
        base_slash_multiplier: f32,
    ) -> Result<()> {
        process_customer_infra_slash(ctx, customer_infra_count, base_slash_multiplier)?;
        Ok(())
    }

    // DRIVER START WORK
    pub fn driver_start_work(
        ctx: Context<DriverStartWork>,
        _alpha3_country_code: String,
        _driver_infra_count: u64,
        driver_uuid: String,
        rsa_pem_pubkey: String,
        services: Vec<u64>,
        passengers: Vec<u64>,
        _vehicle_count: u64,
        current_location: Coordinates,
    ) -> Result<()> {
        process_driver_start_work(
            ctx,
            driver_uuid,
            rsa_pem_pubkey,
            services,
            passengers,
            current_location,
        )?;
        Ok(())
    }
    // DRIVER UPDATE LOCATION
    pub fn driver_update_location(
        ctx: Context<DriverUpdateLocation>,
        _driver_uuid: String,
        current_location: Coordinates,
        next_location: Option<Coordinates>,
    ) -> Result<()> {
        process_driver_update_location(ctx, current_location, next_location)?;
        Ok(())
    }
    // DRIVER END WORK
    pub fn driver_end_work(ctx: Context<DriverEndWork>, _driver_uuid: String) -> Result<()> {
        process_driver_end_work(ctx)?;
        Ok(())
    }
    // DRIVER COMPLETE JOB
    pub fn driver_complete_job(
        ctx: Context<DriverCompleteJob>,
        _alpha3_country_code: String,
        _driver_uuid: String,
        _driver_infra_count: u64,
        _customer_infra_count: u64,
        job_count: u64,
    ) -> Result<()> {
        process_driver_complete_job(ctx, job_count)?;
        Ok(())
    }
    // DRIVER ACCEPTED JOB TRIGGERED BY CUSTOMER INFRA
    pub fn driver_accepted_job(
        ctx: Context<DriverAcceptedJob>,
        _alpha3_country_code: String,
        _customer_infra_count: u64,
        _driver_infra_count: u64,
        _driver_uuid: String,
        _job_count: u64,
        next_location: Coordinates,
    ) -> Result<()> {
        process_driver_accepted_job(ctx, next_location)?;
        Ok(())
    }

    // DRIVER PICKUP CUSTOMER
    pub fn driver_pickup_customer(
        ctx: Context<DriverPickupCustomer>,
        _alpha3_country_code: String,
        _driver_infra_count: u64,
        customer_infra_count: u64,
        _service_count: u64,
    ) -> Result<()> {
        process_driver_pickup_customer(ctx, customer_infra_count)?;
        Ok(())
    }

    // DRIVER CANCEL JOB
    pub fn driver_cancel_job(
        ctx: Context<DriverCancelJob>,
        _alpha3_country_code: String,
        _driver_uuid: String,
        driver_infra_count: u64,
        _customer_infra_count: u64,
        job_count: u64,
    ) -> Result<()> {
        process_driver_cancel_job(ctx, driver_infra_count, job_count)?;
        Ok(())
    }

    // DRIVER RAISE ISSUE
    pub fn driver_raise_issue(
        ctx: Context<DriverRaiseIssue>,
        _driver_infra_count: u64,
        _job_count: u64,
    ) -> Result<()> {
        process_driver_raise_issue(ctx)?;
        Ok(())
    }

    // INIT CUSTOMER INFRA
    pub fn init_customer_infra(
        ctx: Context<InitCustomerInfra>,
        alpha3_country_code: String,
        params: InitCustomerInfraParam,
    ) -> Result<()> {
        process_init_customer_infra(ctx, alpha3_country_code, params)?;
        Ok(())
    }

    // UPDATE DRIVER INFRA COMPANY INFO
    pub fn update_customer_infra_company(
        ctx: Context<UpdateCustomerInfraCompany>,
        _alpha3_country_code: String,
        params: UpdateInfraCompanyParam,
    ) -> Result<()> {
        process_update_customer_infra_company(ctx, params)?;
        Ok(())
    }

    // INIT CUSTOMER INFRA
    pub fn update_customer_infra_basis_point(
        ctx: Context<UpdateCustomerInfraBasisPoint>,
        _alpha3_country_code: String,
        _customer_infra_count: u64,
        basis_point: u16,
    ) -> Result<()> {
        process_update_customer_infra_basis_point(ctx, basis_point)?;
        Ok(())
    }

    // CUSTOMER START OR UPDATE
    pub fn customer_request_ride(
        ctx: Context<CustomerRequestRide>,
        _alpha3_country_code: String,
        driver_uuid: String,
        job_count: u64,
        _customer_infra_count: u64,
        _driver_infra_count: u64,
        _distribution_len: u8,
        encrypted_data: String,
        encrypted_combined_rand_base64: String,
        total_fees: u64,
    ) -> Result<()> {
        process_customer_request_ride(
            ctx,
            job_count,
            driver_uuid,
            encrypted_data,
            encrypted_combined_rand_base64,
            total_fees,
        )?;
        Ok(())
    }

    // CUSTOMER CANCEL RIDE
    pub fn customer_cancel_ride(
        ctx: Context<CustomerCancelRide>,
        _alpha3_country_code: String,
        _driver_uuid: String,
        customer_infra_count: u64,
        _driver_infra_count: u64,
        _job_counter: u64,
    ) -> Result<()> {
        process_customer_cancel_ride(ctx, customer_infra_count)?;
        Ok(())
    }

    // CUSTOMER CANCEL RIDE
    pub fn customer_raise_issue(
        ctx: Context<CustomerRaiseIssue>,
        _customer_infra_count: u64,
        _driver_infra_count: u64,
        _job_counter: u64,
    ) -> Result<()> {
        process_customer_raise_issue(ctx)?;
        Ok(())
    }
}

fn is_valid_coordinate(coordinate: f64) -> bool {
    coordinate >= -90.0 && coordinate <= 90.0
}
