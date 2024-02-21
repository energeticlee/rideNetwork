use anchor_lang::__private::ZeroCopyAccessor;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer};
use anchor_spl::{associated_token::AssociatedToken, token::*};

use crate::state::*;

// INITIALIZE
#[derive(Accounts)]
#[instruction(alpha3_country_code: String, params: InitDriverInfraParam)]
pub struct InitDriverInfra<'info> {
    #[account(
        mut, seeds=[b"country", alpha3_country_code.as_ref()], bump,
        constraint = country_state.driver_infra_counter == params.driver_infra_count
    )]
    pub country_state: Box<Account<'info, Country>>,
    #[account(
        init, seeds=[b"driver_infra".as_ref(), alpha3_country_code.as_ref(), &params.driver_infra_count.to_le_bytes()], bump, payer = driver_infra_owner, space = DriverInfra::len(),
        constraint = driver_infra.is_initialized == false
    )]
    pub driver_infra: Box<Account<'info, DriverInfra>>,
    #[account(init, seeds=[b"company_info".as_ref(), driver_infra.key().as_ref(), 0_u64.to_le_bytes().as_ref()], bump, payer = driver_infra_owner, space = CompanyInfo::len(&params.company_name, &params.entity_registry_id, &params.website))]
    pub company_info: Box<Account<'info, CompanyInfo>>,
    #[account(
        mut,
        constraint = driver_infra_owner_stable.mint == mint.key(), // SGD Stables
        constraint = driver_infra_owner_stable.owner == driver_infra_owner.key(),
        constraint = driver_infra_owner_stable.amount >= country_state.min_driver_infra_deposit,
    )]
    pub driver_infra_owner: Signer<'info>,
    #[account(
        mut,
        constraint = driver_infra_owner_stable.owner == driver_infra_owner.key(),
        constraint = driver_infra_owner_stable.mint == mint.key()
    )]
    pub driver_infra_owner_stable: Box<Account<'info, TokenAccount>>,
    #[account(
        init_if_needed,
        payer = driver_infra_owner,
        associated_token::mint = mint, // SGD Stables
        associated_token::authority = driver_infra
    )]
    pub driver_infra_stable: Box<Account<'info, TokenAccount>>,
    pub mint: Box<Account<'info, Mint>>, // SGD Stables
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// UPDATE COMPANY INFO
#[derive(Accounts)]
#[instruction(alpha3_country_code: String, driver_infra_count: u64, params: UpdateInfraCompanyParam)]
pub struct UpdateDriverInfraCompany<'info> {
    #[account(
    mut, seeds=[b"driver_infra".as_ref(), alpha3_country_code.as_ref(), &driver_infra_count.to_le_bytes()], bump,
    constraint = driver_infra.update_authority == driver_infra_owner.key()
    )]
    pub driver_infra: Account<'info, DriverInfra>,
    #[account(mut, seeds=[b"company_info".as_ref(), driver_infra.key().as_ref(), &params.old_company_info_count.to_le_bytes()], bump, close = driver_infra_owner)]
    pub old_company_info: Account<'info, CompanyInfo>,
    #[account(init, seeds=[b"company_info".as_ref(), driver_infra.key().as_ref(), &(params.old_company_info_count + 1).to_le_bytes()], bump, payer = driver_infra_owner, space = CompanyInfo::len(&params.company_name, &params.entity_registry_id, &params.website))]
    pub new_company_info: Account<'info, CompanyInfo>,
    #[account(mut)]
    pub driver_infra_owner: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// UPDATE BASIS POINT
#[derive(Accounts)]
#[instruction(alpha3_country_code: String, driver_infra_count: u64)]
pub struct UpdateDriverInfraBasisPoint<'info> {
    #[account(
    mut, seeds=[b"driver_infra".as_ref(), alpha3_country_code.as_ref(), &driver_infra_count.to_le_bytes()], bump,
    constraint = driver_infra.update_authority == driver_infra_owner.key()
    )]
    pub driver_infra: Account<'info, DriverInfra>,
    #[account(mut)]
    pub driver_infra_owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, ZeroCopyAccessor)]
pub struct InitDriverInfraParam {
    pub driver_infra_count: u64,
    pub company_name: String,
    pub entity_registry_id: String,
    pub website: String,
    pub driver_infra_fee_basis_point: u16,
}
#[derive(AnchorSerialize, AnchorDeserialize, Clone, ZeroCopyAccessor)]
pub struct UpdateInfraCompanyParam {
    pub company_name: String,
    pub entity_registry_id: String,
    pub website: String,
    pub infra_count: u64,
    pub old_company_info_count: u64,
}
pub fn process_transfer_driver_deposit(ctx: Context<InitDriverInfra>) -> Result<()> {
    // Transfer token customer_stable_account to country_token_account
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_accounts = Transfer {
        from: ctx.accounts.driver_infra_owner_stable.to_account_info(),
        to: ctx.accounts.driver_infra_stable.to_account_info(),
        authority: ctx.accounts.driver_infra_owner.to_account_info(),
    };
    let token_transfer_context = CpiContext::new(cpi_program, cpi_accounts);

    token::transfer(
        token_transfer_context,
        ctx.accounts.country_state.min_driver_infra_deposit,
    )?;
    Ok(())
}
