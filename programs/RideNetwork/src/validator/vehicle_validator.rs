use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token::*};

use crate::state::*;

// INITIALIZE
#[derive(Accounts)]
#[instruction(vehicle_count: u64, brand: String, model: String)]
pub struct InitVehicle<'info> {
    #[account(mut, seeds=[b"global"], bump)]
    pub global_state: Account<'info, Global>,
    #[account(init, seeds=[b"vehicle".as_ref(), &vehicle_count.to_le_bytes()], bump, payer = initializer, space = Vehicle::len(&brand, &model))]
    pub vehicle: Account<'info, Vehicle>,
    #[account(
        init,
        payer = initializer,
        associated_token::mint = mint, // USDC Stables
        associated_token::authority = vehicle
    )]
    pub vehicle_escrow_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = initializer_token_account.mint == mint.key(), // USDC Stables
        constraint = initializer_token_account.owner == initializer.key()
    )]
    pub initializer_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub initializer: Signer<'info>,
    pub mint: Account<'info, Mint>, // SGD Stables
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// APPROVAL
#[derive(Accounts)]
#[instruction(vehicle_count: u64, brand: String, model: String)]
pub struct VehicleVerification<'info> {
    #[account(
        seeds=[b"global"], bump,
        constraint = global_state.update_authority == global_authority.key()
    )]
    pub global_state: Account<'info, Global>,
    #[account(seeds=[b"vehicle".as_ref(), &vehicle_count.to_le_bytes()], bump)]
    pub vehicle: Account<'info, Vehicle>,
    #[account(
        constraint = vehicle_escrow_account.mint == mint.key(), // USDC Stables
        constraint = vehicle_escrow_account.owner == vehicle.key()
    )]
    pub vehicle_escrow_account: Account<'info, TokenAccount>,
    #[account(
        constraint = global_token_account.mint == mint.key(), // USDC Stables
        constraint = global_token_account.owner == global_state.key()
    )]
    pub global_token_account: Account<'info, TokenAccount>,
    #[account(
        constraint = initializer_token_account.mint == mint.key(), // USDC Stables
        constraint = initializer_token_account.owner == vehicle.initializer
    )]
    pub initializer_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub global_authority: Signer<'info>,
    pub mint: Account<'info, Mint>, // SGD Stables
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
