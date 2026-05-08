use anchor_lang::prelude::*;

use crate::{
    constants::VAULT_SEED,
    error::QuotaError,
    state::vault::VaultAccount,
};

#[derive(Accounts)]
pub struct CloseVault<'info> {

    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        close = owner,
        seeds = [VAULT_SEED, owner.key().as_ref()],
        bump = vault.bump,
        constraint =
            vault.owner == owner.key()
            @ QuotaError::UnauthorizedSigner
    )]
    pub vault: Account<'info, VaultAccount>,
}

pub fn close_vault(
    ctx: Context<CloseVault>
) -> Result<()> {

    let vault = &ctx.accounts.vault;

    require!(
        !vault.active,
        QuotaError::VaultStillActive
    );

    require!(
        vault.total_assigned == 0,
        QuotaError::VaultNotEmpty
    );

    Ok(())
}