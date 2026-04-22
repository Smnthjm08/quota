use anchor_lang::prelude::*;
use anchor_spl::token::{transfer, Token, TokenAccount, Transfer};

use crate::{constants::VAULT_SEED, error::QuotaError, state::vault::VaultAccount};

#[derive(Accounts)]
pub struct Deposit<'info> {
    // #[account(mut, has_one = owner)]
    #[account(
    mut,
    has_one = owner,
    seeds = [VAULT_SEED, vault.owner.as_ref()],
    bump = vault.bump
    )]
    pub vault: Account<'info, VaultAccount>,

    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
    mut,
    constraint = from_token_account.owner == owner.key(),
    constraint = from_token_account.mint == vault_token_account.mint
    )]
    pub from_token_account: Account<'info, TokenAccount>,

    #[account(mut, constraint = vault_token_account.owner == vault.key())]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn deposit_to_vault_handler(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    require!(amount > 0, QuotaError::InvalidDepositAmount);

    let vault = &mut ctx.accounts.vault;

    require!(vault.active, QuotaError::VaultInactive);

    // Transfer USDC from user → vault
    let cpi_accounts = Transfer {
        from: ctx.accounts.from_token_account.to_account_info(),
        to: ctx.accounts.vault_token_account.to_account_info(),
        authority: ctx.accounts.owner.to_account_info(),
    };

    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);

    transfer(cpi_ctx, amount)?;

    // vault.total_deposited += amount;
    vault.total_deposited = vault
        .total_deposited
        .checked_add(amount)
        .ok_or(QuotaError::MathOverflow)?;

    Ok(())
}
