use anchor_lang::__private::ZeroCopyAccessor;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer};
use anchor_spl::{associated_token::AssociatedToken, token::*};

use crate::state::*;

// INITIALIZE
#[derive(Accounts)]
#[instruction(params: InitDriverInfraParam)]
pub struct InitDriverInfra<'info> {
    #[account(mut, seeds=[b"country"], bump)]
    pub country_state: Box<Account<'info, Country>>,
    #[account(mut)]
    pub driver_infra_owner: Signer<'info>,
    #[account(init, seeds=[b"driver_infra".as_ref(), driver_infra_owner.key().as_ref()], bump, payer = driver_infra_owner, space = DriverInfra::len())]
    pub driver_infra: Box<Account<'info, DriverInfra>>,
    #[account(init, seeds=[b"company_info".as_ref(), driver_infra.key().as_ref(), 0_u64.to_le_bytes().as_ref()], bump, payer = driver_infra_owner, space = CompanyInfo::len(&params.company_name, &params.uen, &params.website))]
    pub company_info: Box<Account<'info, CompanyInfo>>,
    #[account(
        mut,
        constraint = driver_infra_owner_stable.mint == mint.key(), // SGD Stables
        constraint = driver_infra_owner_stable.owner == driver_infra_owner.key(),
        constraint = driver_infra_owner_stable.amount >= country_state.min_driver_infra_deposit,
    )]
    pub driver_infra_owner_stable: Box<Account<'info, TokenAccount>>,
    #[account(
        init_if_needed,
        payer = driver_infra_owner,
        associated_token::mint = mint, // SGD Stables
        associated_token::authority = driver_infra
    )]
    pub driver_infra_stable: Box<Account<'info, TokenAccount>>,
    #[account(
        constraint = mint.key() == country_state.stable_mint
    )]
    pub mint: Box<Account<'info, Mint>>, // SGD Stables
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// UPDATE COMPANY INFO
#[derive(Accounts)]
#[instruction(params: UpdateInfraCompanyParam)]
pub struct UpdateDriverInfraCompany<'info> {
    #[account(mut)]
    pub driver_infra_owner: Signer<'info>,
    #[account(
    mut, seeds=[b"driver_infra".as_ref(), driver_infra_owner.key().as_ref()], bump,
    constraint = driver_infra.update_authority == driver_infra_owner.key()
    )]
    pub driver_infra: Account<'info, DriverInfra>,
    #[account(mut, seeds=[b"company_info".as_ref(), driver_infra.key().as_ref(), &params.old_company_info_count.to_le_bytes()], bump, close = driver_infra_owner)]
    pub old_company_info: Account<'info, CompanyInfo>,
    #[account(init, seeds=[b"company_info".as_ref(), driver_infra.key().as_ref(), &(params.old_company_info_count + 1).to_le_bytes()], bump, payer = driver_infra_owner, space = CompanyInfo::len(&params.company_name, &params.uen, &params.website))]
    pub new_company_info: Account<'info, CompanyInfo>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// UPDATE BASIS POINT
#[derive(Accounts)]
pub struct UpdateDriverInfraBasisPoint<'info> {
    #[account(mut)]
    pub driver_infra_owner: Signer<'info>,
    #[account(
    mut, seeds=[b"driver_infra".as_ref(), driver_infra_owner.key().as_ref()], bump,
    constraint = driver_infra.update_authority == driver_infra_owner.key()
    )]
    pub driver_infra: Account<'info, DriverInfra>,
    pub system_program: Program<'info, System>,
}

// DRIVER START OR UPDATE
#[derive(Accounts)]
#[instruction(uuid: String)]
pub struct DriverStartOrUpdate<'info> {
    #[account(mut, seeds=[b"driver_infra".as_ref(), driver_infra_owner.key().as_ref()], bump)]
    pub driver_infra: Account<'info, DriverInfra>,
    #[account(init_if_needed, seeds=[b"driver".as_ref(), uuid.as_ref()], bump, payer = driver_infra_owner, space = Driver::len()+ 200)]
    pub driver: Account<'info, Driver>,
    #[account(
        mut,
        constraint = driver_infra.update_authority == driver_infra_owner.key()
    )]
    pub driver_infra_owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// DRIVER END JOB
#[derive(Accounts)]
#[instruction(uuid: String)]
pub struct DriverEndWork<'info> {
    #[account(mut, seeds=[b"driver_infra".as_ref(), driver_infra_owner.key().as_ref()], bump)]
    pub driver_infra: Account<'info, DriverInfra>,
    #[account(mut, seeds=[b"driver".as_ref(), uuid.as_ref()], bump, close = driver_infra_owner)]
    pub driver: Account<'info, Driver>,
    #[account(
        mut,
        constraint = driver_infra.update_authority == driver_infra_owner.key()
    )]
    pub driver_infra_owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// DRIVER COMPLETE JOB
#[derive(Accounts)]
#[instruction(uuid: String, driver_infra_count: u64, rider_infra_count: u64, job_count: u64)]
pub struct DriverCompleteJob<'info> {
    #[account(mut, seeds=[b"country"], bump)]
    pub country_state: Box<Account<'info, Country>>,
    #[account(mut, seeds=[b"driver_infra".as_ref(), driver_infra_owner.key().as_ref()], bump)]
    pub driver_infra: Box<Account<'info, DriverInfra>>,
    #[account(mut, seeds=[b"rider_infra".as_ref(), &rider_infra_count.to_le_bytes()], bump)]
    pub rider_infra: Box<Account<'info, RiderInfra>>,
    #[account(mut, seeds=[b"driver".as_ref(), uuid.as_ref()], bump)]
    pub driver: Box<Account<'info, Driver>>,
    #[account(
        mut, seeds=[b"job".as_ref(), driver_infra.key().as_ref(), &job_count.to_le_bytes()], bump,
        constraint = job.driver_infra == driver_infra.key(),
        constraint = job.rider_infra == rider_infra.key()
    )]
    pub job: Box<Account<'info, Job>>,
    #[account(
        mut,
        constraint = driver_infra.update_authority == driver_infra_owner.key()
    )]
    pub driver_infra_owner: Signer<'info>,
    #[account(
        constraint = job_esrow_stable.mint == mint.key(), // SGD Stables
        constraint = job_esrow_stable.owner == job.key(),
    )]
    pub job_esrow_stable: Account<'info, TokenAccount>,
    #[account(
        constraint = driver_infra_stable.mint == mint.key(), // SGD Stables
        constraint = driver_infra_stable.owner == driver_infra.key(),
    )]
    pub driver_infra_stable: Account<'info, TokenAccount>,
    #[account(
        constraint = rider_infra_stable.mint == mint.key(), // SGD Stables
        constraint = rider_infra_stable.owner == rider_infra.key(),
    )]
    pub rider_infra_stable: Account<'info, TokenAccount>,
    #[account(
        constraint = mint.key() == country_state.stable_mint
    )]
    pub mint: Account<'info, Mint>, // SGD Stables
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

// DRIVER ACCEPT JOB
#[derive(Accounts)]
#[instruction(uuid: String, driver_infra_count: u64, job_count: u64)]
pub struct DriverAcceptJob<'info> {
    #[account(mut, seeds=[b"driver_infra".as_ref(), driver_infra_owner.key().as_ref()], bump)]
    pub driver_infra: Account<'info, DriverInfra>,
    #[account(mut, seeds=[b"driver".as_ref(), uuid.as_ref()], bump)]
    pub driver: Account<'info, Driver>,
    #[account(
        mut, seeds=[b"job".as_ref(), driver_infra.key().as_ref(), &job_count.to_le_bytes()], bump,
        constraint = job.driver_infra == driver_infra.key()
    )]
    pub job: Account<'info, Job>,
    #[account(
        mut,
        constraint = driver_infra.update_authority == driver_infra_owner.key()
    )]
    pub driver_infra_owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// DRIVER PICKUP RIDER
#[derive(Accounts)]
#[instruction(driver_infra_count: u64, rider_infra_count: u64, job_count: u64)]
pub struct DriverPickupRider<'info> {
    #[account(mut, seeds=[b"country"], bump)]
    pub country_state: Box<Account<'info, Country>>,
    #[account(seeds=[b"driver_infra".as_ref(), driver_infra.key().as_ref()], bump)]
    pub driver_infra: Box<Account<'info, DriverInfra>>,
    #[account(mut, seeds=[b"rider_infra".as_ref(), &rider_infra_count.to_le_bytes()], bump)]
    pub rider_infra: Box<Account<'info, RiderInfra>>,
    #[account(
        mut, seeds=[b"job".as_ref(), driver_infra.key().as_ref(), &job_count.to_le_bytes()], bump,
        constraint = job.driver_infra == driver_infra.key()
    )]
    pub job: Box<Account<'info, Job>>,
    #[account(
        constraint = driver_infra.update_authority == driver_infra_owner.key()
    )]
    pub driver_infra_owner: Signer<'info>,
    #[account(
        constraint = driver_infra_stable.mint == mint.key(), // SGD Stables
        constraint = driver_infra_stable.owner == driver_infra.key(),
    )]
    pub driver_infra_stable: Account<'info, TokenAccount>,
    #[account(
        constraint = rider_infra_stable.mint == mint.key(), // SGD Stables
        constraint = rider_infra_stable.owner == rider_infra.key(),
    )]
    pub rider_infra_stable: Account<'info, TokenAccount>,
    #[account(
        constraint = mint.key() == country_state.stable_mint
    )]
    pub mint: Account<'info, Mint>, // SGD Stables
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

// DRIVER CANCEL JOB
#[derive(Accounts)]
#[instruction(uuid: String, driver_infra_count: u64, rider_infra_count: u64, job_count: u64)]
pub struct DriverCancelJob<'info> {
    #[account(mut, seeds=[b"country"], bump)]
    pub country_state: Box<Account<'info, Country>>,
    #[account(seeds=[b"driver_infra".as_ref(), driver_infra.key().as_ref()], bump)]
    pub driver_infra: Box<Account<'info, DriverInfra>>,
    #[account(mut, seeds=[b"rider_infra".as_ref(), &rider_infra_count.to_le_bytes()], bump)]
    pub rider_infra: Box<Account<'info, RiderInfra>>,
    #[account(mut, seeds=[b"driver".as_ref(), uuid.as_ref()], bump)]
    pub driver: Box<Account<'info, Driver>>,
    #[account(
        mut, seeds=[b"job".as_ref(), driver_infra.key().as_ref(), &job_count.to_le_bytes()], bump,
        constraint = job.driver_infra == driver_infra.key(),
        constraint = job.rider_infra == rider_infra.key()
    )]
    pub job: Box<Account<'info, Job>>,
    #[account(
        constraint = driver_infra.update_authority == driver_infra_owner.key()
    )]
    pub driver_infra_owner: Signer<'info>,
    #[account(
        constraint = job_esrow_stable.mint == mint.key(), // SGD Stables
        constraint = job_esrow_stable.owner == job.key(),
    )]
    pub job_esrow_stable: Account<'info, TokenAccount>,
    #[account(
        constraint = driver_infra_stable.mint == mint.key(), // SGD Stables
        constraint = driver_infra_stable.owner == driver_infra.key(),
    )]
    pub driver_infra_stable: Account<'info, TokenAccount>,
    #[account(
        constraint = rider_infra_stable.mint == mint.key(), // SGD Stables
        constraint = rider_infra_stable.owner == rider_infra.key(),
    )]
    pub rider_infra_stable: Account<'info, TokenAccount>,
    #[account(
        constraint = mint.key() == country_state.stable_mint
    )]
    pub mint: Account<'info, Mint>, // SGD Stables
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

// DRIVER RAISE ISSUE
#[derive(Accounts)]
#[instruction(driver_infra_count: u64, job_count: u64)]
pub struct DriverRaiseIssue<'info> {
    #[account(
        seeds=[b"driver_infra".as_ref(), driver_infra.key().as_ref()], bump,
        constraint = driver_infra.update_authority == driver_infra_owner.key()
    )]
    pub driver_infra: Account<'info, DriverInfra>,
    #[account(mut)]
    pub driver_infra_owner: Signer<'info>,
    #[account(
        mut, seeds=[b"job".as_ref(), driver_infra.key().as_ref(), &job_count.to_le_bytes()], bump,
        constraint = job.driver_infra == driver_infra.key(),
    )]
    pub job: Account<'info, Job>,
    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, ZeroCopyAccessor)]
pub struct InitDriverInfraParam {
    pub driver_infra_count: u64,
    pub company_name: String,
    pub uen: String,
    pub website: String,
    pub driver_infra_fee_basis_point: u16,
}
#[derive(AnchorSerialize, AnchorDeserialize, Clone, ZeroCopyAccessor)]
pub struct UpdateInfraCompanyParam {
    pub company_name: String,
    pub uen: String,
    pub website: String,
    pub infra_count: u64,
    pub old_company_info_count: u64,
}

pub fn process_transfer_driver_deposit(ctx: Context<InitDriverInfra>) -> Result<()> {
    // Transfer token rider_stable_account to country_token_account
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
