use anchor_lang::prelude::*;
use anchor_spl::token::{transfer, Token, TokenAccount, Transfer};

use crate::{constants::VAULT_SEED, error::QuotaError, state::vault::VaultAccount};

#[derive(Accounts)]
pub struct WithdrawFromVault<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [VAULT_SEED, owner.key().as_ref()],
        bump = vault.bump,
        constraint = vault.owner == owner.key()
            @ QuotaError::UnauthorizedSigner
    )]
    pub vault: Account<'info, VaultAccount>,

    #[account(
        mut,
        constraint = vault_token_account.owner == vault.key()
            @ QuotaError::UnauthorizedSigner
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = owner_token_account.owner == owner.key()
            @ QuotaError::UnauthorizedSigner
    )]
    pub owner_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn withdraw_from_vault(ctx: Context<WithdrawFromVault>, amount: u64) -> Result<()> {
    let owner_key = ctx.accounts.vault.owner;
    let bump = ctx.accounts.vault.bump;

    require!(
        ctx.accounts.vault.total_deposited >= amount,
        QuotaError::InsufficientFunds
    );

    let seeds = &[VAULT_SEED, owner_key.as_ref(), &[bump]];

    let signer_seeds = &[&seeds[..]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.vault_token_account.to_account_info(),
        to: ctx.accounts.owner_token_account.to_account_info(),
        authority: ctx.accounts.vault.to_account_info(),
    };

    transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        ),
        amount,
    )?;

    ctx.accounts.vault.total_deposited = ctx
        .accounts
        .vault
        .total_deposited
        .checked_sub(amount)
        .ok_or(QuotaError::MathOverflow)?;

    Ok(())
}
