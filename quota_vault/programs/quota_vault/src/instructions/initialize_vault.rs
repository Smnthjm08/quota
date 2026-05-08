use anchor_lang::prelude::*;

use crate::constants::VAULT_SEED;
use crate::error::QuotaError;
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

pub fn initialize_vault_handler(ctx: Context<InitializeVault>, api_signer: Pubkey, plan: u8) -> Result<()> {
    require!(plan <= 2, QuotaError::InvalidPlan);

    let vault = &mut ctx.accounts.vault;

    vault.owner = ctx.accounts.owner.key();
    vault.api_signer = api_signer;

    vault.total_deposited = 0;
    vault.total_assigned = 0;
    vault.total_spent = 0;

    vault.bump = ctx.bumps.vault;
    vault.active = true;

    vault.plan = plan;

    vault.created_at = Clock::get()?.unix_timestamp;

    Ok(())
}
