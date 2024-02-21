use crate::error::ErrorCode;
use crate::*;
use anchor_lang::prelude::*;

pub fn process_init_or_update_global(
    ctx: Context<InitOrUpdateGlobal>,
    platform_fee_basis_point: Option<u16>,
    new_vehicle_or_pax_fee_cent: Option<u64>,
) -> Result<()> {
    let global_state = &mut ctx.accounts.global_state;

    if !global_state.is_initialized {
        global_state.is_initialized = true;
        global_state.update_authority = ctx.accounts.update_authority.key();
        global_state.service_type_counter = 0;
        global_state.vehicle_counter = 0;
        global_state.passengers_type_counter = 0;
    }

    if platform_fee_basis_point.is_some() {
        global_state.platform_fee_basis_point = platform_fee_basis_point.unwrap();
    }
    if new_vehicle_or_pax_fee_cent.is_some() {
        global_state.new_vehicle_or_pax_fee_cent = new_vehicle_or_pax_fee_cent.unwrap();
    }

    Ok(())
}

pub fn process_change_gobal_authority(ctx: Context<ChangeGlobalAuthority>) -> Result<()> {
    ctx.accounts.global_state.update_authority = ctx.accounts.new_authority.key();
    Ok(())
}
