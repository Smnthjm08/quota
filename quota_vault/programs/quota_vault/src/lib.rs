use anchor_lang::prelude::*;

declare_id!("HZ9sQe6snr7g1FrnKftH6xijKWCx3JdJF9XRy1JQuHGC");

#[program]
pub mod quota_vault {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
