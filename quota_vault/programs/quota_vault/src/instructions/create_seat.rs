use anchor_lang::prelude::*;

use crate::constants::SEAT_SEED;
use crate::state::seat::SeatAccount;
use crate::state::vault::VaultAccount;

#[derive(Accounts)]
#[instruction(seat_id: u64)]
pub struct CreateSeat<'info> {
    #[account(
        init,
        payer = owner,
        space = SeatAccount::SPACE,
        // seeds = [SEAT_SEED, owner.key().as_ref()],
        seeds = [SEAT_SEED, vault.key().as_ref(), &seat_id.to_le_bytes()],
        // seeds = [SEAT_SEED, vault.key().as_ref(), &holder.as_ref()],
        bump
    )]
    pub seat: Account<'info, SeatAccount>,

    #[account(mut, has_one = owner)]
    pub vault: Account<'info, VaultAccount>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn seat_handler(ctx: Context<CreateSeat>, holder: Pubkey, seat_id: u64) -> Result<()> {
    let seat = &mut ctx.accounts.seat;

    seat.vault = ctx.accounts.vault.key();
    seat.holder = holder;
    seat.active = true;

    seat.consumed = 0;
    seat.limit = 0;
    seat.seat_id = seat_id;

    seat.period_start = Clock::get()?.unix_timestamp;

    seat.bump = ctx.bumps.seat;

    Ok(())
}
