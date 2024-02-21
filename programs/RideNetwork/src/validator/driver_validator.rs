use anchor_lang::prelude::*;
use anchor_spl::token::*;

use crate::state::*;

// DRIVER START WORK
#[derive(Accounts)]
#[instruction(alpha3_country_code: String, driver_infra_count: u64, driver_uuid: String, rsa_pem_pubkey: String, services: Vec<u64>, passengers: Vec<u64>, vehicle_count: u64)]
pub struct DriverStartWork<'info> {
    #[account(seeds=[b"country".as_ref(), alpha3_country_code.as_ref()], bump)]
    pub country_state: Account<'info, Country>,
    #[account(
        mut, seeds=[b"driver_infra".as_ref(), alpha3_country_code.as_ref(), &driver_infra_count.to_le_bytes()], bump,
        constraint = driver_infra.alpha3_country_code == alpha3_country_code
    )]
    pub driver_infra: Account<'info, DriverInfra>,
    #[account(init, seeds=[b"driver".as_ref(), driver_uuid.as_ref()], bump, payer = driver_infra_authority, space = Driver::len(&driver_uuid, &rsa_pem_pubkey, &services, &passengers))]
    pub driver: Account<'info, Driver>,
    #[account(seeds=[b"vehicle".as_ref(), &vehicle_count.to_le_bytes()], bump)]
    pub vehicle: Account<'info, Vehicle>,
    #[account(
        mut,
        constraint = driver_infra.update_authority == driver_infra_authority.key()
    )]
    pub driver_infra_authority: Signer<'info>,
    /// CHECK: Optional update authority, if null, set to infra
    pub location_update_authority: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

// DRIVER UPDATE LOCATION
#[derive(Accounts)]
#[instruction(driver_uuid: String)]
pub struct DriverUpdateLocation<'info> {
    #[account(mut, seeds = [b"driver".as_ref(), driver_uuid.as_ref()], bump)]
    pub driver: Account<'info, Driver>,
    #[account(constraint = driver.location_update_authority == location_update_authority.key())]
    pub location_update_authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// DRIVER END JOB
#[derive(Accounts)]
#[instruction(alpha3_country_code: String, driver_uuid: String, driver_infra_count: u64)]
pub struct DriverEndWork<'info> {
    #[account(mut, seeds=[b"driver_infra".as_ref(), alpha3_country_code.as_ref(), &driver_infra_count.to_le_bytes()], bump)]
    pub driver_infra: Account<'info, DriverInfra>,
    #[account(mut, seeds=[b"driver".as_ref(), driver_uuid.as_ref()], bump, close = driver_infra_owner)]
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
#[instruction(alpha3_country_code: String, driver_uuid: String, driver_infra_count: u64, customer_infra_count: u64, job_count: u64)]
pub struct DriverCompleteJob<'info> {
    #[account(mut, seeds=[b"country", alpha3_country_code.as_ref()], bump)]
    pub country_state: Box<Account<'info, Country>>,
    #[account(
        mut, seeds=[b"driver_infra".as_ref(), alpha3_country_code.as_ref(), &driver_infra_count.to_le_bytes()], bump,
        constraint = driver_infra.alpha3_country_code == alpha3_country_code
    )]
    pub driver_infra: Box<Account<'info, DriverInfra>>,
    #[account(mut, seeds=[b"customer_infra".as_ref(), alpha3_country_code.as_ref(), &customer_infra_count.to_le_bytes()], bump)]
    pub customer_infra: Box<Account<'info, CustomerInfra>>,
    #[account(mut, seeds=[b"driver".as_ref(), driver_uuid.as_ref()], bump)]
    pub driver: Box<Account<'info, Driver>>,
    #[account(
        mut, seeds=[b"job".as_ref(), driver_infra.key().as_ref(), &job_count.to_le_bytes()], bump,
        constraint = job.driver_infra == driver_infra.key(),
        constraint = job.customer_infra == customer_infra.key()
    )]
    pub job: Box<Account<'info, Job>>,
    #[account(
        mut,
        constraint = driver_infra.update_authority == driver_infra_owner.key()
    )]
    pub driver_infra_owner: Signer<'info>,
    #[account(
        mut,
        constraint = job_esrow_stable.mint == mint.key(), // SGD Stables
        constraint = job_esrow_stable.owner == job.key(),
    )]
    pub job_esrow_stable: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = driver_infra_stable.mint == mint.key(), // SGD Stables
        constraint = driver_infra_stable.owner == driver_infra.key(),
    )]
    pub driver_infra_stable: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = customer_infra_stable.mint == mint.key(), // SGD Stables
        constraint = customer_infra_stable.owner == customer_infra.key(),
    )]
    pub customer_infra_stable: Account<'info, TokenAccount>,
    #[account(constraint = mint.key() == country_state.stable_mint)]
    pub mint: Account<'info, Mint>, // SGD Stables
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

// DRIVER PICKUP CUSTOMER
#[derive(Accounts)]
#[instruction(alpha3_country_code: String, driver_infra_count: u64, customer_infra_count: u64, job_count: u64)]
pub struct DriverPickupCustomer<'info> {
    #[account(mut, seeds=[b"country", alpha3_country_code.as_ref()], bump)]
    pub country_state: Box<Account<'info, Country>>,
    #[account(
        seeds=[b"driver_infra".as_ref(), driver_infra.key().as_ref()], bump,
        constraint = driver_infra.alpha3_country_code == alpha3_country_code
    )]
    pub driver_infra: Box<Account<'info, DriverInfra>>,
    #[account(mut, seeds=[b"customer_infra".as_ref(), &customer_infra_count.to_le_bytes()], bump)]
    pub customer_infra: Box<Account<'info, CustomerInfra>>,
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
        constraint = customer_infra_stable.mint == mint.key(), // SGD Stables
        constraint = customer_infra_stable.owner == customer_infra.key(),
    )]
    pub customer_infra_stable: Account<'info, TokenAccount>,
    #[account(
        constraint = mint.key() == country_state.stable_mint
    )]
    pub mint: Account<'info, Mint>, // SGD Stables
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

// DRIVER CANCEL JOB
#[derive(Accounts)]
#[instruction(alpha3_country_code: String, driver_uuid: String, driver_infra_count: u64, customer_infra_count: u64, job_count: u64)]
pub struct DriverCancelJob<'info> {
    #[account(mut, seeds=[b"country", alpha3_country_code.as_ref()], bump)]
    pub country_state: Box<Account<'info, Country>>,
    #[account(
        mut,
        seeds=[b"driver_infra".as_ref(), alpha3_country_code.as_ref(), &driver_infra_count.to_le_bytes()], bump,
        constraint = driver_infra.alpha3_country_code == alpha3_country_code
    )]
    pub driver_infra: Box<Account<'info, DriverInfra>>,
    #[account(mut, seeds=[b"customer_infra".as_ref(), alpha3_country_code.as_ref(), &customer_infra_count.to_le_bytes()], bump)]
    pub customer_infra: Box<Account<'info, CustomerInfra>>,
    #[account(mut, seeds=[b"driver".as_ref(), driver_uuid.as_ref()], bump)]
    pub driver: Box<Account<'info, Driver>>,
    #[account(
        mut, seeds=[b"job".as_ref(), driver_infra.key().as_ref(), &job_count.to_le_bytes()], bump,
        constraint = job.driver_infra == driver_infra.key(),
        constraint = job.customer_infra == customer_infra.key()
    )]
    pub job: Box<Account<'info, Job>>,
    #[account(
        mut,
        constraint = driver_infra.update_authority == driver_infra_owner.key()
    )]
    pub driver_infra_owner: Signer<'info>,
    #[account(
        mut,
        constraint = job_esrow_stable.mint == mint.key(), // SGD Stables
        constraint = job_esrow_stable.owner == job.key(),
    )]
    pub job_esrow_stable: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = driver_infra_stable.mint == mint.key(), // SGD Stables
        constraint = driver_infra_stable.owner == driver_infra.key(),
    )]
    pub driver_infra_stable: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = customer_infra_stable.mint == mint.key(), // SGD Stables
        constraint = customer_infra_stable.owner == customer_infra.key(),
    )]
    pub customer_infra_stable: Account<'info, TokenAccount>,
    #[account(constraint = mint.key() == country_state.stable_mint)]
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
