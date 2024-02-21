use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token::*};

use crate::state::*;

// INITIALIZE
#[derive(Accounts)]
pub struct InitOrUpdateGlobal<'info> {
    #[account(init_if_needed, seeds=[b"global"], bump, payer = update_authority, space = std::mem::size_of::<Global>())]
    pub global_state: Account<'info, Global>,
    #[account(mut)]
    pub update_authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// NEW AUTHORITY
#[derive(Accounts)]
pub struct ChangeGlobalAuthority<'info> {
    #[account(mut, seeds=[b"global"], bump)]
    pub global_state: Account<'info, Global>,
    #[account(
        mut,
        constraint = global_state.update_authority == current_authority.key()
        )]
    pub current_authority: Signer<'info>,
    /// CHECK: Can be another pubkey
    pub new_authority: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}
