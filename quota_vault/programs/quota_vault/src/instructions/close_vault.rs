use anchor_lang::prelude::*;

use crate::{constants::VAULT_SEED, error::QuotaError, state::vault::VaultAccount};

#[derive(Accounts)]
pub struct CloseVault<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        close = owner,
        seeds = [VAULT_SEED, owner.key().as_ref()],
        bump = vault.bump,
        constraint = vault.owner == owner.key()
            @ QuotaError::UnauthorizedSigner
    )]
    pub vault: Account<'info, VaultAccount>,
}

pub fn close_vault(ctx: Context<CloseVault>) -> Result<()> {
    require!(
        ctx.accounts.vault.total_deposited == 0,
        QuotaError::VaultNotEmpty
    );

    require!(!ctx.accounts.vault.active, QuotaError::VaultStillActive);

    Ok(())
}
