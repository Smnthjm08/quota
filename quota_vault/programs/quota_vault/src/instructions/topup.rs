use anchor_lang::prelude::*;

use anchor_spl::token_interface::{
    transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
};

use crate::{constants::VAULT_SEED, error::QuotaError, state::vault::VaultAccount};

#[derive(Accounts)]
pub struct TopupVault<'info> {
    #[account(
        mut,
        seeds = [VAULT_SEED, vault.owner.as_ref()],
        bump = vault.bump,
        constraint = vault.active @ QuotaError::VaultInactive
    )]
    pub vault: Account<'info, VaultAccount>,

    #[account(
        mut,
        constraint = vault_owner.key() == vault.owner @ QuotaError::UnauthorizedSigner
    )]
    pub vault_owner: Signer<'info>,

    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        constraint = owner_token_account.owner == vault_owner.key(),
        constraint = owner_token_account.mint == mint.key()
    )]
    pub owner_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        constraint = vault_token_account.owner == vault.key(),
        constraint = vault_token_account.mint == mint.key()
    )]
    pub vault_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
}

pub fn topup_vault_handler(ctx: Context<TopupVault>, amount: u64) -> Result<()> {
    require!(amount > 0, QuotaError::InvalidDepositAmount);

    let vault = &mut ctx.accounts.vault;

    let cpi_accounts = TransferChecked {
        from: ctx.accounts.owner_token_account.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.vault_token_account.to_account_info(),
        authority: ctx.accounts.vault_owner.to_account_info(),
    };

    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);

    transfer_checked(cpi_ctx, amount, ctx.accounts.mint.decimals)?;

    vault.total_deposited = vault
        .total_deposited
        .checked_add(amount)
        .ok_or(QuotaError::MathOverflow)?;

    emit!(TopupEvent {
        vault: vault.key(),
        owner: ctx.accounts.vault_owner.key(),
        amount,
        new_total_deposited: vault.total_deposited,
    });

    Ok(())
}

#[event]
pub struct TopupEvent {
    pub vault: Pubkey,
    pub owner: Pubkey,
    pub amount: u64,
    pub new_total_deposited: u64,
}
