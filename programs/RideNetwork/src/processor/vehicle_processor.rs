use crate::error::ErrorCode;
use crate::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, transfer, Transfer};

pub fn process_init_vehicle(
    ctx: Context<InitVehicle>,
    brand: String,
    model: String,
    number_of_seats: u8,
) -> Result<()> {
    let global_state = &mut ctx.accounts.global_state;
    let vehicle_state = &mut ctx.accounts.vehicle;

    vehicle_state.initializer = ctx.accounts.initializer.key();
    vehicle_state.number_of_seats = number_of_seats;
    global_state.vehicle_counter = global_state.vehicle_counter.checked_add(1).unwrap();
    vehicle_state.brand = brand;
    vehicle_state.model = model;
    vehicle_state.is_valid = false;

    // TRANSFER FEES TO ESCROW
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_accounts = Transfer {
        from: ctx.accounts.initializer_token_account.to_account_info(),
        to: ctx.accounts.vehicle_escrow_account.to_account_info(),
        authority: ctx.accounts.initializer.to_account_info(),
    };
    let token_transfer_context = CpiContext::new(cpi_program, cpi_accounts);
    transfer(
        token_transfer_context,
        global_state.new_vehicle_or_pax_fee_cent,
    )?;

    Ok(())
}
