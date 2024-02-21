use anchor_lang::__private::ZeroCopyAccessor;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer};
use anchor_spl::{associated_token::AssociatedToken, token::*};

use crate::state::*;

use super::driver_infra_validator::UpdateInfraCompanyParam;

// INITIALIZE
#[derive(Accounts)]
#[instruction(alpha3_country_code: String, params: InitCustomerInfraParam)]
pub struct InitCustomerInfra<'info> {
    #[account(mut, seeds=[b"country", alpha3_country_code.as_ref()], bump)]
    pub country_state: Box<Account<'info, Country>>,
    #[account(mut)]
    pub customer_infra_owner: Signer<'info>,
    #[account(
        init, seeds=[b"customer_infra".as_ref(), alpha3_country_code.as_ref(), &params.customer_infra_count.to_le_bytes()], bump, payer = customer_infra_owner, space = CustomerInfra::len(),
        constraint = customer_infra.is_initialized == false
    )]
    pub customer_infra: Box<Account<'info, CustomerInfra>>,
    #[account(init, seeds=[b"company_info".as_ref(), customer_infra.key().as_ref(), 0_u64.to_le_bytes().as_ref()], bump, payer = customer_infra_owner, space = CompanyInfo::len(&params.company_name, &params.entity_registry_id, &params.website))]
    pub company_info: Box<Account<'info, CompanyInfo>>,
    #[account(
        mut,
        constraint = customer_infra_owner_stable.mint == mint.key(), // SGD Stables
        constraint = customer_infra_owner_stable.owner == customer_infra_owner.key(),
        constraint = customer_infra_owner_stable.amount >= country_state.min_customer_infra_deposit,
    )]
    pub customer_infra_owner_stable: Box<Account<'info, TokenAccount>>,
    #[account(
        init_if_needed,
        payer = customer_infra_owner,
        associated_token::mint = mint, // SGD Stables
        associated_token::authority = customer_infra
    )]
    pub customer_infra_stable: Account<'info, TokenAccount>,
    #[account(
        constraint = mint.key() == country_state.stable_mint
    )]
    pub mint: Account<'info, Mint>, // SGD Stables
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// UPDATE COMPANY INFO
#[derive(Accounts)]
#[instruction(alpha3_country_code: String, params: UpdateInfraCompanyParam)]
pub struct UpdateCustomerInfraCompany<'info> {
    #[account(mut)]
    pub customer_infra_owner: Signer<'info>,
    #[account(
    mut, seeds=[b"customer_infra".as_ref(), alpha3_country_code.as_ref(), &params.infra_count.to_le_bytes()], bump,
    constraint = customer_infra.update_authority == customer_infra_owner.key()
    )]
    pub customer_infra: Account<'info, CustomerInfra>,
    #[account(mut, seeds=[b"company_info".as_ref(), customer_infra.key().as_ref(), &params.old_company_info_count.to_le_bytes()], bump, close = customer_infra_owner)]
    pub old_company_info: Account<'info, CompanyInfo>,
    #[account(init, seeds=[b"company_info".as_ref(), customer_infra.key().as_ref(), &(params.old_company_info_count + 1).to_le_bytes()], bump, payer = customer_infra_owner, space = CompanyInfo::len(&params.company_name, &params.entity_registry_id, &params.website))]
    pub new_company_info: Account<'info, CompanyInfo>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// UPDATE BASIS POINT
#[derive(Accounts)]
#[instruction(alpha3_country_code: String, customer_infra_count: u64)]
pub struct UpdateCustomerInfraBasisPoint<'info> {
    #[account(mut)]
    pub customer_infra_owner: Signer<'info>,
    #[account(
    mut, seeds=[b"customer_infra".as_ref(), alpha3_country_code.as_ref(), &customer_infra_count.to_le_bytes()], bump,
    constraint = customer_infra.update_authority == customer_infra_owner.key()
    )]
    pub customer_infra: Account<'info, CustomerInfra>,
    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, ZeroCopyAccessor)]
pub struct InitCustomerInfraParam {
    pub customer_infra_count: u64,
    pub company_name: String,
    pub entity_registry_id: String,
    pub website: String,
    pub customer_infra_fee_basis_point: u16,
}
#[derive(AnchorSerialize, AnchorDeserialize, Clone, ZeroCopyAccessor)]
pub struct UpdateCustomerInfraCompanyParam {
    pub company_name: String,
    pub entity_registry_id: String,
    pub website: String,
    pub customer_infra_count: u64,
    pub old_company_info_count: u64,
}

pub fn process_transfer_rider_deposit(ctx: Context<InitCustomerInfra>) -> Result<()> {
    // Transfer token rider_stable_account to global_token_account
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_accounts = Transfer {
        from: ctx.accounts.customer_infra_owner_stable.to_account_info(),
        to: ctx.accounts.customer_infra_stable.to_account_info(),
        authority: ctx.accounts.customer_infra_owner.to_account_info(),
    };
    let token_transfer_context = CpiContext::new(cpi_program, cpi_accounts);

    token::transfer(
        token_transfer_context,
        ctx.accounts.country_state.min_customer_infra_deposit,
    )?;
    Ok(())
}
