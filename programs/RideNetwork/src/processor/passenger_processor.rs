use crate::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{transfer, Transfer};

pub fn process_init_or_update_passenger(
    ctx: Context<InitOrUpdatePassengerTypes>,
    passenger_type_name: String,
    passenger_type_count: u64,
) -> Result<()> {
    let global_state = &mut ctx.accounts.global_state;
    let passenger_type = &mut ctx.accounts.passenger_type;

    if !passenger_type.is_initialized {
        passenger_type.initializer = ctx.accounts.initializer.key();
        passenger_type.is_initialized = true;
        global_state.passengers_type_counter.checked_add(1).unwrap();
    }
    passenger_type.name = passenger_type_name;
    passenger_type.is_valid = false;

    // TRANSFER FEES TO ESCROW
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_accounts = Transfer {
        from: ctx.accounts.initializer_token_account.to_account_info(),
        to: ctx.accounts.passenger_type_escrow_account.to_account_info(),
        authority: ctx.accounts.initializer.to_account_info(),
    };
    let token_transfer_context = CpiContext::new(cpi_program, cpi_accounts);
    transfer(
        token_transfer_context,
        global_state.new_vehicle_or_pax_fee_cent,
    )?;

    Ok(())
}
