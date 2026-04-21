use anchor_lang::prelude::*;

pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

pub use instructions::*;

declare_id!("HZ9sQe6snr7g1FrnKftH6xijKWCx3JdJF9XRy1JQuHGC");

#[program]
pub mod quota_vault {
    use super::*;

    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        instructions::vault_handler(ctx)
    }

    pub fn create_seat(ctx: Context<CreateSeat>, seat_id: u64) -> Result<()>{
        instructions::seat_handler(ctx, seat_id)
    }
}
