use crate::error::ErrorCode;
use crate::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, transfer, Transfer};

pub fn process_init_or_update_service(
    ctx: Context<InitOrUpdateService>,
    service_type_name: String,
) -> Result<()> {
    let global_state = &mut ctx.accounts.global_state;
    let country_state = &mut ctx.accounts.country_state;
    let service_type = &mut ctx.accounts.service_type;

    if !service_type.is_initialized {
        service_type.country_key = country_state.key();
        service_type.initializer = ctx.accounts.initializer.key();
        service_type.is_initialized = true;
        global_state.service_type_counter =
            global_state.service_type_counter.checked_add(1).unwrap();
    }
    service_type.name = service_type_name;
    service_type.is_valid = false;

    // TRANSFER FEES TO ESCROW
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_accounts = Transfer {
        from: ctx.accounts.initializer_token_account.to_account_info(),
        to: ctx.accounts.service_type_escrow_account.to_account_info(),
        authority: ctx.accounts.initializer.to_account_info(),
    };
    let token_transfer_context = CpiContext::new(cpi_program, cpi_accounts);
    transfer(
        token_transfer_context,
        global_state.new_vehicle_or_pax_fee_cent,
    )?;

    Ok(())
}
