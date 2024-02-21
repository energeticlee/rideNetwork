use crate::{error::ErrorCode, state::*, *};

use anchor_lang::prelude::*;
use anchor_spl::token::{self, transfer, Transfer};

pub fn process_init_customer_infra(
    ctx: Context<InitCustomerInfra>,
    alpha3_country_code: String,
    params: InitCustomerInfraParam,
) -> Result<()> {
    let customer_infra = &mut ctx.accounts.customer_infra;
    let country_state = &mut ctx.accounts.country_state;
    let company_info = &mut ctx.accounts.company_info;

    // Company Info
    company_info.company_name = params.company_name;
    company_info.entity_registry_id = params.entity_registry_id;
    company_info.website = params.website;

    // Driver Infra
    customer_infra.alpha3_country_code = alpha3_country_code;
    customer_infra.update_authority = ctx.accounts.customer_infra_owner.key();
    customer_infra.stable_mint = ctx.accounts.mint.key();
    customer_infra.customer_infra_count = country_state.customer_infra_counter;
    customer_infra.is_initialized = true;
    customer_infra.is_verified = false;
    customer_infra.is_frozen = false;
    customer_infra.customer_infra_fee_basis_point = params.customer_infra_fee_basis_point;
    customer_infra.company_info_current_count = 0;
    customer_infra.matched_ride = 0;
    customer_infra.cancellation = 0;
    customer_infra.dispute_cases = 0;
    customer_infra.cases_lost_in_dispute = 0;

    country_state.customer_infra_counter =
        country_state.customer_infra_counter.checked_add(1).unwrap();

    process_transfer_rider_deposit(ctx)?;
    Ok(())
}

pub fn process_update_customer_infra_company(
    ctx: Context<UpdateCustomerInfraCompany>,
    params: UpdateInfraCompanyParam,
) -> Result<()> {
    let infra = &mut ctx.accounts.customer_infra;
    let new_company_info = &mut ctx.accounts.new_company_info;

    new_company_info.company_name = params.company_name;
    new_company_info.entity_registry_id = params.entity_registry_id;
    new_company_info.website = params.website;

    infra.company_info_current_count = params.old_company_info_count + 1;
    infra.is_frozen = true;

    Ok(())
}

pub fn process_update_customer_infra_basis_point(
    ctx: Context<UpdateCustomerInfraBasisPoint>,
    basis_point: u16,
) -> Result<()> {
    ctx.accounts.customer_infra.customer_infra_fee_basis_point = basis_point;

    Ok(())
}
