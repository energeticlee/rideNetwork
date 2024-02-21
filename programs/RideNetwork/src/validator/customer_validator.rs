use anchor_lang::__private::ZeroCopyAccessor;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer};
use anchor_spl::{associated_token::AssociatedToken, token::*};

use crate::state::*;

// CUSTOMER REQUEST RIDE
#[derive(Accounts)]
#[instruction(alpha3_country_code: String, driver_uuid: String, job_count: u64, customer_infra_count: u64, driver_infra_count: u64, distribution_len: u8, encrypted_data: String, encrypted_combined_rand_base64: String, total_fees: u64)]
pub struct CustomerRequestRide<'info> {
    #[account(seeds=[b"global".as_ref()], bump)]
    pub global_state: Box<Account<'info, Global>>,
    #[account(mut, seeds=[b"customer_infra".as_ref(), alpha3_country_code.as_ref(), &customer_infra_count.to_le_bytes()], bump)]
    pub customer_infra: Box<Account<'info, CustomerInfra>>,
    #[account(
        mut, seeds=[b"driver_infra".as_ref(), alpha3_country_code.as_ref(), &driver_infra_count.to_le_bytes()], bump,
    )]
    pub driver_infra: Box<Account<'info, DriverInfra>>,
    #[account(init, seeds=[b"job".as_ref(), driver_infra.key().as_ref(), &job_count.to_le_bytes()], bump, payer = customer_infra_owner, space = Job::len(&driver_uuid, &distribution_len, &encrypted_data, &encrypted_combined_rand_base64))]
    pub job: Box<Account<'info, Job>>,
    #[account(
        mut,
        constraint = customer_infra.update_authority == customer_infra_owner.key()
    )]
    pub customer_infra_owner: Signer<'info>,
    #[account(
        mut,
        constraint = customer_infra_owner_stable.mint == mint.key(), // SGD Stables
        constraint = customer_infra_owner_stable.owner == customer_infra_owner.key(),
        constraint = customer_infra_owner_stable.amount >= total_fees,
    )]
    pub customer_infra_owner_stable: Box<Account<'info, TokenAccount>>,
    #[account(
        init_if_needed,
        payer = customer_infra_owner,
        associated_token::mint = mint, // SGD Stables
        associated_token::authority = job
    )]
    pub job_escrow_stable: Box<Account<'info, TokenAccount>>,
    #[account(
        constraint = mint.key() == customer_infra.stable_mint
    )]
    pub mint: Account<'info, Mint>, // SGD Stables
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// DRIVER ACCEPTED JOB
#[derive(Accounts)]
#[instruction(alpha3_country_code: String, customer_infra_count: u64, driver_infra_count: u64, driver_uuid: String, job_count: u64)]
pub struct DriverAcceptedJob<'info> {
    #[account(mut, seeds=[b"driver".as_ref(), driver_uuid.as_ref()], bump)]
    pub driver: Account<'info, Driver>,
    #[account(mut, seeds=[b"driver_infra".as_ref(), alpha3_country_code.as_ref(), &driver_infra_count.to_le_bytes()], bump)]
    pub driver_infra: Account<'info, DriverInfra>,
    #[account(mut, seeds=[b"customer_infra".as_ref(), alpha3_country_code.as_ref(), &customer_infra_count.to_le_bytes()], bump)]
    pub customer_infra: Account<'info, CustomerInfra>,
    #[account(
        mut, seeds=[b"job".as_ref(), driver_infra.key().as_ref(), &job_count.to_le_bytes()], bump,
        constraint = job.driver_infra == driver_infra.key()
    )]
    pub job: Account<'info, Job>,
    #[account(
        mut,
        constraint = customer_infra.update_authority == customer_infra_owner.key()
    )]
    pub customer_infra_owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// Customer CANCEL RIDE
#[derive(Accounts)]
#[instruction(alpha3_country_code: String, driver_uuid: String, customer_infra_count: u64, driver_infra_count: u64, job_counter: u64)]
pub struct CustomerCancelRide<'info> {
    #[account(mut, seeds=[b"country".as_ref(), alpha3_country_code.as_ref()], bump)]
    pub country_state: Box<Account<'info, Country>>,
    #[account(mut, seeds=[b"customer_infra".as_ref(), alpha3_country_code.as_ref(), &customer_infra_count.to_le_bytes()], bump)]
    pub customer_infra: Box<Account<'info, CustomerInfra>>,
    #[account(
        mut, seeds=[b"driver_infra".as_ref(), alpha3_country_code.as_ref(), &driver_infra_count.to_le_bytes()], bump,
    )]
    pub driver_infra: Box<Account<'info, DriverInfra>>,
    #[account(
        mut, seeds=[b"driver".as_ref(), driver_uuid.as_ref()], bump,
        constraint = driver.infra_authority == driver_infra.key()
    )]
    pub driver: Box<Account<'info, Driver>>,
    #[account(mut, seeds=[b"job".as_ref(), driver_infra.key().as_ref(), &job_counter.to_le_bytes()], bump)]
    pub job: Box<Account<'info, Job>>,
    #[account(
        mut,
        constraint = customer_infra.update_authority == customer_infra_owner.key()
    )]
    pub customer_infra_owner: Signer<'info>,
    #[account(
        mut,
        constraint = customer_infra_stable.mint == mint.key(), // SGD Stables
        constraint = customer_infra_stable.owner == customer_infra.key(),
    )]
    pub customer_infra_stable: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = driver_infra_stable.mint == mint.key(), // SGD Stables
        constraint = driver_infra_stable.owner == driver_infra.key(),
    )]
    pub driver_infra_stable: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>, // SGD Stables
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

// Customer RAISE ISSUE
#[derive(Accounts)]
#[instruction(customer_infra_count: u64, driver_infra_count: u64, job_counter: u64)]
pub struct CustomerRaiseIssue<'info> {
    #[account(
        seeds=[b"customer_infra".as_ref(), &customer_infra_count.to_le_bytes()], bump,
        constraint = customer_infra.update_authority == customer_infra_owner.key()
    )]
    pub customer_infra: Account<'info, CustomerInfra>,
    #[account(mut)]
    pub customer_infra_owner: Signer<'info>,
    #[account(seeds=[b"driver_infra".as_ref(), &driver_infra_count.to_le_bytes()], bump)]
    pub driver_infra: Account<'info, DriverInfra>,
    #[account(
        mut, seeds=[b"job".as_ref(), driver_infra.key().as_ref(), &job_counter.to_le_bytes()], bump,
        constraint = job.driver_infra == driver_infra.key(),
        constraint = job.customer_infra == customer_infra.key(),
    )]
    pub job: Account<'info, Job>,
    pub system_program: Program<'info, System>,
}
