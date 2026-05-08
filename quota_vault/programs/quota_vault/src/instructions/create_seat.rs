use anchor_lang::prelude::*;

use crate::{
    constants::SEAT_SEED,
    error::QuotaError,
    state::{seat::SeatAccount, vault::VaultAccount},
};

#[derive(Accounts)]
#[instruction(
    holder: Pubkey,
    seat_id: u64,
    seat_type: u8,
    limit: u64
)]
pub struct CreateSeat<'info> {
    #[account(
        init,
        payer = owner,
        space = SeatAccount::SPACE,
        seeds = [
            SEAT_SEED,
            vault.key().as_ref(),
            &seat_id.to_le_bytes()
        ],
        bump
    )]
    pub seat: Account<'info, SeatAccount>,

    #[account(
        mut,
        has_one = owner
    )]
    pub vault: Account<'info, VaultAccount>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn seat_handler(
    ctx: Context<CreateSeat>,
    holder: Pubkey,
    seat_id: u64,
    seat_type: u8,
    limit: u64,
) -> Result<()> {
    let vault = &mut ctx.accounts.vault;

    require!(vault.active, QuotaError::VaultInactive);

    require!(
        seat_type == 1 || seat_type == 2,
        QuotaError::InvalidSeatType
    );

    require!(limit > 0, QuotaError::InvalidAmount);

    require!(
        vault
            .total_assigned
            .checked_add(limit)
            .ok_or(QuotaError::MathOverflow)?
            <= vault.total_deposited,
        QuotaError::InsufficientFunds
    );

    let seat = &mut ctx.accounts.seat;

    vault.total_assigned = vault
        .total_assigned
        .checked_add(limit)
        .ok_or(QuotaError::MathOverflow)?;

    seat.vault = vault.key();

    seat.holder = holder;

    seat.consumed = 0;

    seat.limit = limit;

    seat.seat_id = seat_id;

    seat.seat_type = seat_type;

    seat.bump = ctx.bumps.seat;

    seat.active = true;

    seat.created_at = Clock::get()?.unix_timestamp;

    Ok(())
}
