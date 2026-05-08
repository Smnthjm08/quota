use anchor_lang::prelude::*;

use anchor_spl::token_interface::{
    transfer_checked,
    Mint,
    TokenAccount,
    TokenInterface,
    TransferChecked,
};

use crate::{
    constants::VAULT_SEED,
    error::QuotaError,
    state::vault::VaultAccount,
};

#[derive(Accounts)]
pub struct ReclaimTreasury<'info> {

    #[account(
        constraint =
            authority.key() == vault.api_signer
            @ QuotaError::UnauthorizedSigner
    )]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [VAULT_SEED, vault.owner.as_ref()],
        bump = vault.bump
    )]
    pub vault: Account<'info, VaultAccount>,

    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        constraint =
            vault_token_account.owner == vault.key()
            @ QuotaError::UnauthorizedSigner,

        constraint =
            vault_token_account.mint == mint.key()
    )]
    pub vault_token_account:
        InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        constraint =
            treasury_token_account.owner
            == authority.key()
            @ QuotaError::UnauthorizedSigner,

        constraint =
            treasury_token_account.mint == mint.key()
    )]
    pub treasury_token_account:
        InterfaceAccount<'info, TokenAccount>,

    pub token_program:
        Interface<'info, TokenInterface>,
}

pub fn reclaim_treasury(
    ctx: Context<ReclaimTreasury>,
    amount: u64,
) -> Result<()> {

    require!(
        amount > 0,
        QuotaError::InvalidAmount
    );

    let vault = &ctx.accounts.vault;

    require!(
        !vault.active,
        QuotaError::VaultStillActive
    );

    require!(
        vault.total_assigned == 0,
        QuotaError::VaultNotEmpty
    );

    require!(
        ctx.accounts.vault_token_account.amount >= amount,
        QuotaError::InsufficientFunds
    );

    let owner_key = vault.owner;

    let bump = vault.bump;

    let seeds = &[
        VAULT_SEED,
        owner_key.as_ref(),
        &[bump]
    ];

    let signer_seeds = &[&seeds[..]];

    let cpi_accounts = TransferChecked {

        from: ctx.accounts
            .vault_token_account
            .to_account_info(),

        mint: ctx.accounts
            .mint
            .to_account_info(),

        to: ctx.accounts
            .treasury_token_account
            .to_account_info(),

        authority: ctx.accounts
            .vault
            .to_account_info(),
    };

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer_seeds,
    );

    transfer_checked(
        cpi_ctx,
        amount,
        ctx.accounts.mint.decimals,
    )?;

    Ok(())
}