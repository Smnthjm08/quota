use anchor_lang::prelude::*;

#[error_code]
pub enum QuotaError {
    #[msg("Unauthorized signer")]
    UnauthorizedSigner,

    #[msg("Seat inactive")]
    SeatInactive,

    #[msg("Vault inactive")]
    VaultInactive,

    #[msg("Quota exceeded")]
    QuotaExceeded,

    #[msg("New limit cannot be below already consumed usage")]
    InvalidLimit,

    #[msg("Math overflow")]
    MathOverflow,
}
