use anchor_lang::prelude::*;

use crate::constants::VAULT_SEED;
use crate::state::vault::VaultAccount;

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = owner,
        space = VaultAccount::SPACE,
        seeds = [VAULT_SEED, owner.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, VaultAccount>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn vault_handler(ctx: Context<InitializeVault>) -> Result<()> {
    let vault = &mut ctx.accounts.vault;

    vault.owner = ctx.accounts.owner.key();
    vault.bump = ctx.bumps.vault;
    vault.total_deposited = 0;
    vault.total_allocated = 0;

    Ok(())
}
