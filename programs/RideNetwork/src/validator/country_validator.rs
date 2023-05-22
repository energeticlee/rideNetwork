use anchor_lang::__private::ZeroCopyAccessor;
use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token::*};

use crate::error::ErrorCode;
use crate::state::*;

// INITIALIZE
#[derive(Accounts)]
pub struct InitOrUpdateCountry<'info> {
    #[account(init_if_needed, seeds=[b"country"], bump, payer = initializer, space = Country::len())]
    pub country_state: Account<'info, Country>,
    #[account(mut)]
    pub initializer: Signer<'info>,
    #[account(
        init_if_needed,
        payer = initializer,
        associated_token::mint = mint, // SGD Stables
        associated_token::authority = country_state
    )]
    pub country_stable_account: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>, // SGD Stables
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// NEW AUTHORITY
#[derive(Accounts)]
pub struct ChangeCountryAuthority<'info> {
    #[account(mut, seeds=[b"country"], bump)]
    pub country_state: Account<'info, Country>,
    #[account(
        mut,
        constraint = country_state.update_authority == current_authority.key()
        )]
    pub current_authority: Signer<'info>,
    /// CHECK: Can be another pubkey
    pub new_authority: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

// Add or update jobs
#[derive(Accounts)]
#[instruction(job_count: u64, job_name: String)]
pub struct InitOrUpdateJob<'info> {
    #[account(init_if_needed, seeds=[b"job".as_ref(), country_state.key().as_ref(), &job_count.to_le_bytes()], bump, payer = update_authority, space = JobType::len(&job_name))]
    pub job_type: Account<'info, JobType>,
    #[account(mut, seeds=[b"country"], bump)]
    pub country_state: Account<'info, Country>,
    #[account(
        mut,
        constraint = country_state.update_authority == update_authority.key()
    )]
    pub update_authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// APPROVE DRIVER APPLICATION
#[derive(Accounts)]
#[instruction(driver_infra_count: u64)]
pub struct ApproveDriverInfra<'info> {
    #[account(
        seeds=[b"country"], bump,
        constraint = country_state.update_authority == country_authority.key()
    )]
    pub country_state: Account<'info, Country>,
    #[account(mut)]
    pub country_authority: Signer<'info>,
    #[account(
        mut,
        seeds = [b"driver_infra".as_ref(), &driver_infra_count.to_le_bytes()],
        bump,
        constraint = !driver_infra.is_verified
    )]
    pub driver_infra: Account<'info, DriverInfra>,
    pub system_program: Program<'info, System>,
}

// APPROVE RIDER APPLICATION
#[derive(Accounts)]
#[instruction(rider_infra_count: u64)]
pub struct ApproveRiderInfra<'info> {
    #[account(
        seeds=[b"country"], bump,
        constraint = country_state.update_authority == country_authority.key()
    )]
    pub country_state: Account<'info, Country>,
    #[account(mut)]
    pub country_authority: Signer<'info>,
    #[account(
        mut,
        seeds = [b"rider_infra".as_ref(), &rider_infra_count.to_le_bytes()],
        bump,
        constraint = !rider_infra.is_verified
    )]
    pub rider_infra: Account<'info, RiderInfra>,
    pub system_program: Program<'info, System>,
}

// SUSPEND DRIVER INFRASTRUCTURE
#[derive(Accounts)]
#[instruction(driver_infra_count: u64)]
pub struct DriverInfraSuspension<'info> {
    #[account(
        seeds=[b"country"], bump,
        constraint = country_state.update_authority == country_authority.key()
    )]
    pub country_state: Account<'info, Country>,
    #[account(mut)]
    pub country_authority: Signer<'info>,
    #[account(
        mut,
        seeds = [b"driver_infra".as_ref(), &driver_infra_count.to_le_bytes()],
        bump,
        constraint = driver_infra.is_verified,
        constraint = !driver_infra.is_frozen
    )]
    pub driver_infra: Account<'info, DriverInfra>,
    pub system_program: Program<'info, System>,
}
// SUSPEND RIDER INFRASTRUCTURE
#[derive(Accounts)]
#[instruction(rider_infra_count: u64)]
pub struct RiderInfraSuspension<'info> {
    #[account(
        seeds=[b"country"], bump,
        constraint = country_state.update_authority == country_authority.key()
    )]
    pub country_state: Account<'info, Country>,
    #[account(mut)]
    pub country_authority: Signer<'info>,
    #[account(
        mut,
        seeds = [b"rider_infra".as_ref(), &rider_infra_count.to_le_bytes()],
        bump,
        constraint = rider_infra.is_verified,
        constraint = !rider_infra.is_frozen,
    )]
    pub rider_infra: Account<'info, RiderInfra>,
    pub system_program: Program<'info, System>,
}

// SLASH DRIVER INFRASTRUCTURE
#[derive(Accounts)]
#[instruction(driver_infra_count: u64)]
pub struct DriverInfraSlash<'info> {
    #[account(
        seeds=[b"country"], bump,
        constraint = country_state.update_authority == country_authority.key()
    )]
    pub country_state: Account<'info, Country>,
    #[account(mut)]
    pub country_authority: Signer<'info>,
    #[account(
        mut,
        seeds = [b"driver_infra".as_ref(), &driver_infra_count.to_le_bytes()],
        bump,
        constraint = driver_infra.is_verified
    )]
    pub driver_infra: Account<'info, DriverInfra>,
    #[account(
        mut,
        constraint = driver_stable_account.mint == mint.key(), // SGD Stables
        constraint = driver_stable_account.owner == country_state.key(),
    )]
    pub country_stable_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = driver_stable_account.mint == mint.key(), // SGD Stables
        constraint = driver_stable_account.owner == driver_infra.key(),
        constraint = driver_stable_account.amount >= country_state.base_slash_amount,
    )]
    pub driver_stable_account: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>, // SGD Stables
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
// SLASH RIDER INFRASTRUCTURE
#[derive(Accounts)]
#[instruction(rider_infra_count: u64)]
pub struct RiderInfraSlash<'info> {
    #[account(
        seeds=[b"country"], bump,
        constraint = country_state.update_authority == country_authority.key()
    )]
    pub country_state: Account<'info, Country>,
    #[account(mut)]
    pub country_authority: Signer<'info>,
    #[account(
        mut,
        seeds = [b"rider_infra".as_ref(), &rider_infra_count.to_le_bytes()],
        bump,
        constraint = rider_infra.is_verified
    )]
    pub rider_infra: Account<'info, RiderInfra>,
    #[account(
        mut,
        constraint = rider_stable_account.mint == mint.key(), // SGD Stables
        constraint = rider_stable_account.owner == country_state.key(),
    )]
    pub country_stable_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = rider_stable_account.mint == mint.key(), // SGD Stables
        constraint = rider_stable_account.owner == rider_infra.key(),
        constraint = rider_stable_account.amount >= country_state.base_slash_amount,
    )]
    pub rider_stable_account: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>, // SGD Stables
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, ZeroCopyAccessor)]
pub struct InitOrUpdateCountryParam {
    pub platform_fee_basis_point: Option<u16>,
    pub waiting_fee_sec: Option<u64>,
    pub waiting_fee_cent: Option<u64>,
    pub driver_cancellation_fee_sec: Option<u64>,
    pub rider_cancellation_fee_sec: Option<u64>,
    pub cancellation_fee_cent: Option<u64>,
    pub base_rate_cent: Option<u64>,
    pub min_km_rate_cent: Option<u64>,
    pub min_min_fee_cent: Option<u64>,
    pub finalize_duration_sec: Option<u64>,
    pub min_driver_infra_deposit: Option<u64>,
    pub min_rider_infra_deposit: Option<u64>,
    pub base_slash_amount: Option<u64>,
    pub epoch_duration_days: Option<u16>,
}

impl InitOrUpdateCountryParam {
    pub fn init_new(&self, country_state: &mut Country) -> Result<()> {
        if self.platform_fee_basis_point.is_none()
            || self.waiting_fee_sec.is_none()
            || self.waiting_fee_cent.is_none()
            || self.driver_cancellation_fee_sec.is_none()
            || self.rider_cancellation_fee_sec.is_none()
            || self.cancellation_fee_cent.is_none()
            || self.base_rate_cent.is_none()
            || self.min_km_rate_cent.is_none()
            || self.min_min_fee_cent.is_none()
            || self.finalize_duration_sec.is_none()
            || self.min_driver_infra_deposit.is_none()
            || self.min_rider_infra_deposit.is_none()
            || self.epoch_duration_days.is_none()
        {
            return err!(ErrorCode::InvalidCreateCountryParams);
        };

        country_state.platform_fee_basis_point = self.platform_fee_basis_point.unwrap();
        country_state.driver_infra_counter = 0;
        country_state.rider_infra_counter = 0;
        country_state.waiting_fee_sec = self.waiting_fee_sec.unwrap();
        country_state.waiting_fee_cent = self.waiting_fee_cent.unwrap();
        country_state.driver_cancellation_fee_sec = self.driver_cancellation_fee_sec.unwrap();
        country_state.rider_cancellation_fee_sec = self.rider_cancellation_fee_sec.unwrap();
        country_state.cancellation_fee_cent = self.cancellation_fee_cent.unwrap();
        country_state.base_rate_cent = self.base_rate_cent.unwrap();
        country_state.min_km_rate_cent = self.min_km_rate_cent.unwrap();
        country_state.min_min_fee_cent = self.min_min_fee_cent.unwrap();
        country_state.finalize_duration_sec = self.finalize_duration_sec.unwrap();
        country_state.min_driver_infra_deposit = self.min_driver_infra_deposit.unwrap();
        country_state.min_rider_infra_deposit = self.min_rider_infra_deposit.unwrap();
        country_state.base_slash_amount = self.base_slash_amount.unwrap();
        country_state.epoch_duration_days = self.epoch_duration_days.unwrap();
        Ok(())
    }
    pub fn update_or_same(&self, country_state: &mut Country) -> Result<()> {
        country_state.platform_fee_basis_point = self
            .platform_fee_basis_point
            .unwrap_or(country_state.platform_fee_basis_point);
        country_state.waiting_fee_sec = self
            .waiting_fee_sec
            .unwrap_or(country_state.waiting_fee_sec);
        country_state.waiting_fee_cent = self
            .waiting_fee_cent
            .unwrap_or(country_state.waiting_fee_cent);
        country_state.driver_cancellation_fee_sec = self
            .driver_cancellation_fee_sec
            .unwrap_or(country_state.driver_cancellation_fee_sec);
        country_state.rider_cancellation_fee_sec = self
            .rider_cancellation_fee_sec
            .unwrap_or(country_state.rider_cancellation_fee_sec);
        country_state.cancellation_fee_cent = self
            .cancellation_fee_cent
            .unwrap_or(country_state.cancellation_fee_cent);
        country_state.base_rate_cent = self.base_rate_cent.unwrap_or(country_state.base_rate_cent);
        country_state.min_km_rate_cent = self
            .min_km_rate_cent
            .unwrap_or(country_state.min_km_rate_cent);
        country_state.min_min_fee_cent = self
            .min_min_fee_cent
            .unwrap_or(country_state.min_min_fee_cent);
        country_state.finalize_duration_sec = self
            .finalize_duration_sec
            .unwrap_or(country_state.finalize_duration_sec);
        country_state.min_driver_infra_deposit = self
            .min_driver_infra_deposit
            .unwrap_or(country_state.min_driver_infra_deposit);
        country_state.min_rider_infra_deposit = self
            .min_rider_infra_deposit
            .unwrap_or(country_state.min_rider_infra_deposit);
        country_state.base_slash_amount = self
            .base_slash_amount
            .unwrap_or(country_state.base_slash_amount);
        country_state.epoch_duration_days = self
            .epoch_duration_days
            .unwrap_or(country_state.epoch_duration_days);

        Ok(())
    }
}
