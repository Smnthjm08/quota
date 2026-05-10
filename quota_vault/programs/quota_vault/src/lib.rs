use anchor_lang::prelude::*;

pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("4Yq5pVNmQGrVovK7kKwwETTGU2WcLdjbjjQAK8VXfziH");

#[program]
pub mod quota_vault {

    use super::*;

    // Vault
    pub fn initialize_vault(
        ctx: Context<InitializeVault>,
        api_signer: Pubkey,
        plan: u8,
    ) -> Result<()> {

        instructions::initialize_vault_handler(
            ctx,
            api_signer,
            plan,
        )
    }

    pub fn deposit_to_vault(
        ctx: Context<Deposit>,
        amount: u64,
    ) -> Result<()> {

        instructions::deposit_to_vault_handler(
            ctx,
            amount,
        )
    }

    pub fn topup_vault(
        ctx: Context<TopupVault>,
        amount: u64,
    ) -> Result<()> {

        instructions::topup_vault_handler(
            ctx,
            amount,
        )
    }

    pub fn reclaim_treasury(
        ctx: Context<ReclaimTreasury>,
        amount: u64,
    ) -> Result<()> {

        instructions::reclaim_treasury(
            ctx,
            amount,
        )
    }

    pub fn close_vault(
        ctx: Context<CloseVault>
    ) -> Result<()> {

        instructions::close_vault(ctx)
    }

    // Seat
    pub fn create_seat(
        ctx: Context<CreateSeat>,
        holder: Pubkey,
        seat_id: u64,
        seat_type: u8,
        limit: u64,
    ) -> Result<()> {

        instructions::seat_handler(
            ctx,
            holder,
            seat_id,
            seat_type,
            limit,
        )
    }

    pub fn update_seat_handler(
        ctx: Context<UpdateSeat>,
        new_limit: u64,
    ) -> Result<()> {

        instructions::update_seat(
            ctx,
            new_limit,
        )
    }

    pub fn toggle_seat_handler(
        ctx: Context<ToggleSeat>
    ) -> Result<()> {

        instructions::toggle_seat(ctx)
    }

    // Consume
    pub fn consume(
        ctx: Context<Consume>,
        amount: u64,
    ) -> Result<()> {

        instructions::consume_handler(
            ctx,
            amount,
        )
    }
}