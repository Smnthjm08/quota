use anchor_lang::prelude::*;

pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

declare_id!("HZ9sQe6snr7g1FrnKftH6xijKWCx3JdJF9XRy1JQuHGC");

#[program]
pub mod quota_vault {
    use super::*;

    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        crate::instructions::handler(ctx)
    }
}

