use anchor_lang::prelude::*;

use anchor_spl::token_interface::{
    transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
};

use crate::{constants::VAULT_SEED, error::QuotaError, state::vault::VaultAccount};

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        mut,
        seeds = [VAULT_SEED, vault.owner.as_ref()],
        bump = vault.bump
    )]
    pub vault: Account<'info, VaultAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        constraint = from_token_account.owner == authority.key(),
        constraint = from_token_account.mint == mint.key()
    )]
    pub from_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        constraint = vault_token_account.owner == vault.key(),
        constraint = vault_token_account.mint == mint.key()
    )]
    pub vault_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
}

pub fn deposit_to_vault_handler(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    require!(amount > 0, QuotaError::InvalidDepositAmount);

    let vault = &mut ctx.accounts.vault;

    require!(vault.active, QuotaError::VaultInactive);

    require!(
        ctx.accounts.authority.key() == vault.api_signer,
        QuotaError::UnauthorizedSigner
    );

    let cpi_accounts = TransferChecked {
        from: ctx.accounts.from_token_account.to_account_info(),

        mint: ctx.accounts.mint.to_account_info(),

        to: ctx.accounts.vault_token_account.to_account_info(),

        authority: ctx.accounts.authority.to_account_info(),
    };

    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);

    transfer_checked(cpi_ctx, amount, ctx.accounts.mint.decimals)?;

    vault.total_deposited = vault
        .total_deposited
        .checked_add(amount)
        .ok_or(QuotaError::MathOverflow)?;

    Ok(())
}
