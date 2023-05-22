use anchor_lang::__private::ZeroCopyAccessor;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer};
use anchor_spl::{associated_token::AssociatedToken, token::*};

use crate::error::ErrorCode;
use crate::state::*;

use super::driver_validator::UpdateInfraCompanyParam;

// INITIALIZE
#[derive(Accounts)]
#[instruction(params: InitRiderInfraParam)]
pub struct InitRiderInfra<'info> {
    #[account(mut, seeds=[b"country"], bump)]
    pub country_state: Box<Account<'info, Country>>,
    #[account(mut)]
    pub rider_infra_owner: Signer<'info>,
    #[account(init, seeds=[b"rider_infra".as_ref(), rider_infra_owner.key().as_ref()], bump, payer = rider_infra_owner, space = RiderInfra::len())]
    pub rider_infra: Box<Account<'info, RiderInfra>>,
    #[account(init, seeds=[b"company_info".as_ref(), rider_infra.key().as_ref(), 0_u64.to_le_bytes().as_ref()], bump, payer = rider_infra_owner, space = CompanyInfo::len(&params.company_name, &params.uen, &params.website))]
    pub company_info: Box<Account<'info, CompanyInfo>>,
    #[account(
        mut,
        constraint = rider_infra_owner_stable.mint == mint.key(), // SGD Stables
        constraint = rider_infra_owner_stable.owner == rider_infra_owner.key(),
        constraint = rider_infra_owner_stable.amount >= country_state.min_rider_infra_deposit,
    )]
    pub rider_infra_owner_stable: Box<Account<'info, TokenAccount>>,
    #[account(
        init_if_needed,
        payer = rider_infra_owner,
        associated_token::mint = mint, // SGD Stables
        associated_token::authority = rider_infra
    )]
    pub rider_infra_stable: Account<'info, TokenAccount>,
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
#[instruction(params: UpdateInfraCompanyParam)]
pub struct UpdateRiderInfraCompany<'info> {
    #[account(mut)]
    pub rider_infra_owner: Signer<'info>,
    #[account(
    mut, seeds=[b"rider_infra".as_ref(), rider_infra_owner.key().as_ref()], bump,
    constraint = rider_infra.update_authority == rider_infra_owner.key()
    )]
    pub rider_infra: Account<'info, RiderInfra>,
    #[account(mut, seeds=[b"company_info".as_ref(), rider_infra.key().as_ref(), &params.old_company_info_count.to_le_bytes()], bump, close = rider_infra_owner)]
    pub old_company_info: Account<'info, CompanyInfo>,
    #[account(init, seeds=[b"company_info".as_ref(), rider_infra.key().as_ref(), &(params.old_company_info_count + 1).to_le_bytes()], bump, payer = rider_infra_owner, space = CompanyInfo::len(&params.company_name, &params.uen, &params.website))]
    pub new_company_info: Account<'info, CompanyInfo>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// UPDATE BASIS POINT
#[derive(Accounts)]
pub struct UpdateRiderInfraBasisPoint<'info> {
    #[account(mut)]
    pub rider_infra_owner: Signer<'info>,
    #[account(
    mut, seeds=[b"rider_infra".as_ref(), rider_infra_owner.key().as_ref()], bump,
    constraint = rider_infra.update_authority == rider_infra_owner.key()
    )]
    pub rider_infra: Account<'info, RiderInfra>,
    pub system_program: Program<'info, System>,
}

// RIDER REQUEST RIDE
#[derive(Accounts)]
#[instruction(uuid: String, job_counter: u64, distribution_len: u8, encrypted_data_size: String, total_fees: u64)]
pub struct RiderRequestRide<'info> {
    #[account(seeds=[b"country"], bump)]
    pub country_state: Box<Account<'info, Country>>,
    #[account(mut, seeds=[b"rider_infra".as_ref(), rider_infra_owner.key().as_ref()], bump)]
    pub rider_infra: Box<Account<'info, RiderInfra>>,
    /// CHECK: To update distribution
    #[account(mut)]
    pub driver_infra_owner: AccountInfo<'info>,
    #[account(
        mut, seeds=[b"driver_infra".as_ref(), driver_infra_owner.key().as_ref()], bump,
        constraint = driver_infra.update_authority == driver_infra_owner.key()
    )]
    pub driver_infra: Box<Account<'info, DriverInfra>>,
    #[account(
        mut, seeds=[b"driver".as_ref(), uuid.as_ref()], bump,
        constraint = driver.infra_authority == driver_infra.key()
    )]
    pub driver: Box<Account<'info, Driver>>,
    #[account(init, seeds=[b"job".as_ref(), driver_infra.key().as_ref(), &job_counter.to_le_bytes()], bump, payer = rider_infra_owner, space = Job::len(&distribution_len, &encrypted_data_size.len()))]
    pub job: Box<Account<'info, Job>>,
    #[account(
        mut,
        constraint = rider_infra.update_authority == rider_infra_owner.key()
    )]
    pub rider_infra_owner: Signer<'info>,
    #[account(
        mut,
        constraint = rider_infra_owner_stable.mint == mint.key(), // SGD Stables
        constraint = rider_infra_owner_stable.owner == rider_infra_owner.key(),
        constraint = rider_infra_owner_stable.amount >= total_fees,
    )]
    pub rider_infra_owner_stable: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = rider_infra_owner,
        associated_token::mint = mint, // SGD Stables
        associated_token::authority = job
    )]
    pub job_escrow_stable: Account<'info, TokenAccount>,
    #[account(
        constraint = mint.key() == country_state.stable_mint
    )]
    pub mint: Account<'info, Mint>, // SGD Stables
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// RIDER CANCEL RIDE
#[derive(Accounts)]
#[instruction(uuid: String, rider_infra_count: u64, driver_infra_count: u64, job_counter: u64)]
pub struct RiderCancelRide<'info> {
    #[account(mut, seeds=[b"country"], bump)]
    pub country_state: Box<Account<'info, Country>>,
    #[account(mut, seeds=[b"rider_infra".as_ref(), &rider_infra_count.to_le_bytes()], bump)]
    pub rider_infra: Box<Account<'info, RiderInfra>>,
    #[account(
        mut, seeds=[b"driver_infra".as_ref(), &driver_infra_count.to_le_bytes()], bump,
        constraint = driver_infra.update_authority == driver_infra.key()
    )]
    pub driver_infra: Box<Account<'info, DriverInfra>>,
    #[account(
        mut, seeds=[b"driver".as_ref(), uuid.as_ref()], bump,
        constraint = driver.infra_authority == driver_infra.key()
    )]
    pub driver: Box<Account<'info, Driver>>,
    #[account(seeds=[b"job".as_ref(), driver_infra.key().as_ref(), &job_counter.to_le_bytes()], bump)]
    pub job: Box<Account<'info, Job>>,
    #[account(
        mut,
        constraint = rider_infra.update_authority == rider_infra_owner.key()
    )]
    pub rider_infra_owner: Signer<'info>,
    #[account(
        constraint = rider_infra_stable.mint == mint.key(), // SGD Stables
        constraint = rider_infra_stable.owner == rider_infra.key(),
    )]
    pub rider_infra_stable: Account<'info, TokenAccount>,
    #[account(
        constraint = driver_infra_stable.mint == mint.key(), // SGD Stables
        constraint = driver_infra_stable.owner == driver_infra.key(),
    )]
    pub driver_infra_stable: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>, // SGD Stables
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

// RIDER RAISE ISSUE
#[derive(Accounts)]
#[instruction(rider_infra_count: u64, driver_infra_count: u64, job_counter: u64)]
pub struct RiderRaiseIssue<'info> {
    #[account(
        seeds=[b"rider_infra".as_ref(), &rider_infra_count.to_le_bytes()], bump,
        constraint = rider_infra.update_authority == rider_infra_owner.key()
    )]
    pub rider_infra: Account<'info, RiderInfra>,
    #[account(mut)]
    pub rider_infra_owner: Signer<'info>,
    #[account(seeds=[b"driver_infra".as_ref(), &driver_infra_count.to_le_bytes()], bump)]
    pub driver_infra: Account<'info, DriverInfra>,
    #[account(
        mut, seeds=[b"job".as_ref(), driver_infra.key().as_ref(), &job_counter.to_le_bytes()], bump,
        constraint = job.driver_infra == driver_infra.key(),
        constraint = job.rider_infra == rider_infra.key(),
    )]
    pub job: Account<'info, Job>,
    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, ZeroCopyAccessor)]
pub struct InitRiderInfraParam {
    pub rider_infra_count: u64,
    pub company_name: String,
    pub uen: String,
    pub website: String,
    pub rider_infra_fee_basis_point: u16,
}
#[derive(AnchorSerialize, AnchorDeserialize, Clone, ZeroCopyAccessor)]
pub struct UpdateRiderInfraCompanyParam {
    pub company_name: String,
    pub uen: String,
    pub website: String,
    pub rider_infra_count: u64,
    pub old_company_info_count: u64,
}

pub fn process_transfer_rider_deposit(ctx: Context<InitRiderInfra>) -> Result<()> {
    // Transfer token rider_stable_account to global_token_account
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_accounts = Transfer {
        from: ctx.accounts.rider_infra_owner_stable.to_account_info(),
        to: ctx.accounts.rider_infra_stable.to_account_info(),
        authority: ctx.accounts.rider_infra_owner.to_account_info(),
    };
    let token_transfer_context = CpiContext::new(cpi_program, cpi_accounts);

    token::transfer(
        token_transfer_context,
        ctx.accounts.country_state.min_rider_infra_deposit,
    )?;
    Ok(())
}
