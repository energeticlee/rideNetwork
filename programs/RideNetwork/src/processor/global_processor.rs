use crate::error::ErrorCode;
use crate::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer};

pub fn process_init_or_update_global(
    ctx: Context<InitOrUpdateGlobal>,
    params: InitOrUpdateGlobalParam,
) -> Result<()> {
    let global_state = &mut ctx.accounts.global_state;

    msg!(
        "global_state.is_initialized: {}",
        global_state.is_initialized
    );
    if !global_state.is_initialized {
        msg!("Init Global");
        global_state.is_initialized = true;
        global_state.update_authority = ctx.accounts.initializer.key();
        params.init_new(global_state)?;
    } else {
        msg!("Updating Global");
        if global_state.update_authority != ctx.accounts.initializer.key() {
            return err!(ErrorCode::InvalidUpdateAuthority);
        }

        params.update_or_same(global_state)?;
    }
    global_state.last_update = Clock::get().unwrap().unix_timestamp as u64;

    Ok(())
}

pub fn process_change_gobal_authority(ctx: Context<ChangeGlobalAuthority>) -> Result<()> {
    ctx.accounts.global_state.update_authority = ctx.accounts.new_authority.key();
    ctx.accounts.global_state.last_update = Clock::get().unwrap().unix_timestamp as u64;
    Ok(())
}
