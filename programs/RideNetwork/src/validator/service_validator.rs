use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token::*};

use crate::state::*;

// INITIALIZE
#[derive(Accounts)]
#[instruction(alpha3_country_code: String, service_type_count: u64, service_type_name: String)]
pub struct InitOrUpdateService<'info> {
    #[account(seeds=[b"global"], bump)]
    pub global_state: Box<Account<'info, Global>>,
    #[account(mut, seeds=[b"country".as_ref(), alpha3_country_code.as_ref()], bump)]
    pub country_state: Box<Account<'info, Country>>,
    #[account(init, seeds=[b"offered_service".as_ref(), &service_type_count.to_le_bytes()], bump, payer = initializer, space = OfferedService::len(&service_type_name))]
    pub service_type: Box<Account<'info, OfferedService>>,
    #[account(
        init,
        payer = initializer,
        associated_token::mint = mint, // USDC Stables
        associated_token::authority = service_type
    )]
    pub service_type_escrow_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        constraint = initializer_token_account.mint == mint.key(), // USDC Stables
        constraint = initializer_token_account.owner == initializer.key()
    )]
    pub initializer_token_account: Box<Account<'info, TokenAccount>>,
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
#[instruction(alpha3_country_code: String, service_count: u64)]
pub struct ServiceVerification<'info> {
    #[account(
        seeds=[b"global"], bump,
        constraint = global_state.update_authority == global_authority.key()
    )]
    pub global_state: Account<'info, Global>,
    #[account(seeds=[b"country".as_ref(), alpha3_country_code.as_ref()], bump)]
    pub country_state: Account<'info, Country>,
    #[account(seeds=[b"offered_service".as_ref(), alpha3_country_code.as_ref(), &service_count.to_le_bytes()], bump)]
    pub service: Account<'info, OfferedService>,
    #[account(
        constraint = service_escrow_account.mint == mint.key(), // USDC Stables
        constraint = service_escrow_account.owner == service.key()
    )]
    pub service_escrow_account: Account<'info, TokenAccount>,
    #[account(
        constraint = country_token_account.mint == mint.key(), // USDC Stables
        constraint = country_token_account.owner == country_state.key()
    )]
    pub country_token_account: Account<'info, TokenAccount>,
    #[account(
        constraint = initializer_token_account.mint == mint.key(), // USDC Stables
        constraint = initializer_token_account.owner == service.initializer
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
