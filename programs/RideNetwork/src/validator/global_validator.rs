use anchor_lang::__private::ZeroCopyAccessor;
use anchor_lang::prelude::*;

use crate::error::ErrorCode;
use crate::state::*;

// INITIALIZE
#[derive(Accounts)]
pub struct InitOrUpdateGlobal<'info> {
    #[account(init_if_needed, seeds=[b"global"], bump, payer = initializer, space = Global::len())]
    pub global_state: Account<'info, Global>,
    #[account(mut)]
    pub initializer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// NEW AUTHORITY
#[derive(Accounts)]
pub struct ChangeGlobalAuthority<'info> {
    #[account(mut, seeds=[b"global"], bump)]
    pub global_state: Account<'info, Country>,
    #[account(
        mut,
        constraint = global_state.update_authority == current_authority.key()
        )]
    pub current_authority: Signer<'info>,
    /// CHECK: Can be another pubkey
    pub new_authority: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, ZeroCopyAccessor)]
pub struct InitOrUpdateGlobalParam {
    pub platform_fee_basis_point: Option<u16>,
    pub proposal_interval: Option<u64>,
}

impl InitOrUpdateGlobalParam {
    pub fn init_new(&self, global_state: &mut Global) -> Result<()> {
        if self.platform_fee_basis_point.is_none()
            || self.platform_fee_basis_point.is_none()
            || self.proposal_interval.is_none()
        {
            return err!(ErrorCode::InvalidCreateGlobalParams);
        };

        global_state.platform_fee_basis_point = self.platform_fee_basis_point.unwrap();
        global_state.proposal_interval = self.proposal_interval.unwrap();
        Ok(())
    }
    pub fn update_or_same(&self, global_state: &mut Global) -> Result<()> {
        global_state.platform_fee_basis_point = self
            .platform_fee_basis_point
            .unwrap_or(global_state.platform_fee_basis_point);
        global_state.proposal_interval = self
            .proposal_interval
            .unwrap_or(global_state.proposal_interval);

        Ok(())
    }
}
