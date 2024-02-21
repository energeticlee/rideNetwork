use crate::{error::ErrorCode, state::*, *};

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer};

pub fn process_init_driver_infra(
    ctx: Context<InitDriverInfra>,
    alpha3_country_code: String,
    params: InitDriverInfraParam,
) -> Result<()> {
    let country_state = &mut ctx.accounts.country_state;
    let driver_infra = &mut ctx.accounts.driver_infra;
    let company_info = &mut ctx.accounts.company_info;

    // Company Info
    company_info.company_name = params.company_name;
    company_info.entity_registry_id = params.entity_registry_id;
    company_info.website = params.website;

    // Driver Infra
    driver_infra.alpha3_country_code = alpha3_country_code;
    driver_infra.update_authority = ctx.accounts.driver_infra_owner.key();
    driver_infra.job_counter = 0;
    driver_infra.driver_infra_count = country_state.driver_infra_counter;
    driver_infra.is_initialized = true;
    driver_infra.is_verified = false;
    driver_infra.is_frozen = false;
    driver_infra.driver_infra_fee_basis_point = params.driver_infra_fee_basis_point;
    driver_infra.company_info_current_count = 0;
    driver_infra.matched_ride = 0;
    driver_infra.cancellation = 0;
    driver_infra.dispute_cases = 0;
    driver_infra.cases_lost_in_dispute = 0;

    country_state.driver_infra_counter = country_state.driver_infra_counter.checked_add(1).unwrap();

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
    new_company_info.entity_registry_id = params.entity_registry_id;
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
