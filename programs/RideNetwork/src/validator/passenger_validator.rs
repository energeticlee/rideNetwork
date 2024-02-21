use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token::*};

use crate::state::*;

// INITIALIZE
#[derive(Accounts)]
#[instruction(passenger_type_name: String, passenger_type_count: u64)]
pub struct InitOrUpdatePassengerTypes<'info> {
    #[account(seeds=[b"global"], bump)]
    pub global_state: Account<'info, Global>,
    #[account(init, seeds=[b"passenger_type".as_ref(), &passenger_type_count.to_le_bytes()], bump, payer = initializer, space = PassengerTypes::len(&passenger_type_name))]
    pub passenger_type: Account<'info, PassengerTypes>,
    #[account(
        init,
        payer = initializer,
        associated_token::mint = mint, // USDC Stables
        associated_token::authority = passenger_type
    )]
    pub passenger_type_escrow_account: Account<'info, TokenAccount>,
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
#[instruction(passenger_type_count: u64)]
pub struct PassengerTypeVerification<'info> {
    #[account(
        seeds=[b"global"], bump,
        constraint = global_state.update_authority == global_authority.key()
    )]
    pub global_state: Account<'info, Global>,
    #[account(seeds=[b"passenger_type".as_ref(), &passenger_type_count.to_le_bytes()], bump)]
    pub passenger_type: Account<'info, PassengerTypes>,
    #[account(
        constraint = passenger_type_escrow_account.mint == mint.key(), // USDC Stables
        constraint = passenger_type_escrow_account.owner == passenger_type.key()
    )]
    pub passenger_type_escrow_account: Account<'info, TokenAccount>,
    #[account(
        constraint = global_token_account.mint == mint.key(), // USDC Stables
        constraint = global_token_account.owner == global_state.key()
    )]
    pub global_token_account: Account<'info, TokenAccount>,
    #[account(
        constraint = initializer_token_account.mint == mint.key(), // USDC Stables
        constraint = initializer_token_account.owner == passenger_type.initializer
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
