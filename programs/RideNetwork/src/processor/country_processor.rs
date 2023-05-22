use crate::error::ErrorCode;
use crate::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer};

pub fn process_init_or_update_country(
    ctx: Context<InitOrUpdateCountry>,
    params: InitOrUpdateCountryParam,
    alpha3_country_code: String,
) -> Result<()> {
    let country_state = &mut ctx.accounts.country_state;

    msg!(
        "country_state.is_initialized: {}",
        country_state.is_initialized
    );
    if !country_state.is_initialized {
        msg!("Init Country");
        country_state.is_initialized = true;
        country_state.alpha3_country_code = alpha3_country_code;
        country_state.update_authority = ctx.accounts.initializer.key();
        country_state.stable_mint = ctx.accounts.mint.key();
        params.init_new(country_state)?;
    } else {
        msg!("Updating Country");
        if country_state.update_authority != ctx.accounts.initializer.key() {
            return err!(ErrorCode::InvalidUpdateAuthority);
        }

        params.update_or_same(country_state)?;
    }

    Ok(())
}

pub fn process_change_country_authority(ctx: Context<ChangeCountryAuthority>) -> Result<()> {
    ctx.accounts.country_state.update_authority = ctx.accounts.new_authority.key();
    Ok(())
}

pub fn process_approve_rider_infra(ctx: Context<ApproveRiderInfra>) -> Result<()> {
    ctx.accounts.rider_infra.is_verified = true;
    Ok(())
}
pub fn process_approve_driver_infra(ctx: Context<ApproveDriverInfra>) -> Result<()> {
    ctx.accounts.driver_infra.is_verified = true;
    Ok(())
}
pub fn process_driver_infra_suspension(ctx: Context<DriverInfraSuspension>) -> Result<()> {
    ctx.accounts.driver_infra.is_frozen = false;
    Ok(())
}
pub fn process_rider_infra_suspension(ctx: Context<RiderInfraSuspension>) -> Result<()> {
    ctx.accounts.rider_infra.is_frozen = false;
    Ok(())
}
pub fn process_driver_infra_slash(
    ctx: Context<DriverInfraSlash>,
    driver_infra_count: u64,
    base_slash_multiplier: f32,
) -> Result<()> {
    // Transfer token driver_stable_account to country_token_account
    let auth_bump = *ctx.bumps.get("driver_infra").unwrap();
    let seeds = &[
        b"driver_infra".as_ref(),
        &driver_infra_count.to_le_bytes(),
        &[auth_bump],
    ];
    let signer = &[&seeds[..]];
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_accounts = Transfer {
        from: ctx.accounts.driver_stable_account.to_account_info(),
        to: ctx.accounts.country_stable_account.to_account_info(),
        authority: ctx.accounts.driver_infra.to_account_info(),
    };
    let token_transfer_context = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    let amount_to_slash = (ctx.accounts.country_state.base_slash_amount as f32
        * base_slash_multiplier)
        .round() as u64;

    token::transfer(token_transfer_context, amount_to_slash)?;
    Ok(())
}
pub fn process_rider_infra_slash(
    ctx: Context<RiderInfraSlash>,
    rider_infra_count: u64,
    base_slash_multiplier: f32,
) -> Result<()> {
    // Transfer token rider_stable_account to country_token_account
    let auth_bump = *ctx.bumps.get("rider_infra").unwrap();
    let seeds = &[
        b"rider_infra".as_ref(),
        &rider_infra_count.to_le_bytes(),
        &[auth_bump],
    ];
    let signer = &[&seeds[..]];
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_accounts = Transfer {
        from: ctx.accounts.rider_stable_account.to_account_info(),
        to: ctx.accounts.country_stable_account.to_account_info(),
        authority: ctx.accounts.rider_infra.to_account_info(),
    };
    let token_transfer_context = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    let amount_to_slash = (ctx.accounts.country_state.base_slash_amount as f32
        * base_slash_multiplier)
        .round() as u64;

    token::transfer(token_transfer_context, amount_to_slash)?;
    Ok(())
}
