use anchor_lang::prelude::*;

pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("CjMHzbSLp1riwY4QPbBSgpjE8jzawFZV86X6sYvMH58Y");

#[program]
pub mod quota_vault {

    use super::*;

    pub fn initialize_vault(
        ctx: Context<InitializeVault>,
        api_signer: Pubkey,
        plan: u8,
    ) -> Result<()> {
        instructions::vault_handler(ctx, api_signer, plan)
    }

    pub fn create_seat(
        ctx: Context<CreateSeat>,
        holder: Pubkey,
        seat_id: u64,
        seat_type: u8,
        monthly_limit: u64,
    ) -> Result<()> {
        instructions::seat_handler(ctx, holder, seat_id, seat_type, monthly_limit)
    }

    pub fn deposit_handler(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        instructions::deposit_to_vault_handler(ctx, amount)
    }

    pub fn consume(ctx: Context<Consume>, credits: u64) -> Result<()> {
        instructions::consume_handler(ctx, credits)
    }

    pub fn toggle_seat_handler(ctx: Context<ToggleSeat>) -> Result<()> {
        instructions::toggle_seat(ctx)
    }

    pub fn update_seat_handler(ctx: Context<UpdateSeat>, new_limit: u64) -> Result<()> {
        instructions::update_seat(ctx, new_limit)
    }

    pub fn withdraw_from_vault(ctx: Context<WithdrawFromVault>, amount: u64) -> Result<()> {
        instructions::withdraw_from_vault(ctx, amount)
    }

    pub fn close_vault(ctx: Context<CloseVault>) -> Result<()> {
        instructions::close_vault(ctx)
    }
}
