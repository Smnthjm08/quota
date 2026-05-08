use anchor_lang::prelude::*;

#[error_code]
pub enum QuotaError {
    // vault
    #[msg("Invalid Plan")]
    InvalidPlan,

    #[msg("Vault inactive")]
    VaultInactive,

    #[msg("Invalid Amount")]
    InvalidAmount,  
    
      #[msg("Invalid Deposit Amount")]
    InvalidDepositAmount,

    #[msg("Unauthorized signer")]
    UnauthorizedSigner,

    #[msg("Seat inactive")]
    SeatInactive,

    #[msg("Quota exceeded")]
    QuotaExceeded,

    #[msg("New limit cannot be below already consumed usage")]
    InvalidLimit,

    #[msg("Exceeds per call limit")]
    ExceedsPerCallLimit,

    #[msg("Daily limit exceeded")]
    DailyLimitExceeded,

    #[msg("Invalid Seat Type")]
    InvalidSeatType,

    #[msg("Invalid Credits")]
    InvalidCredits,

    #[msg("Math overflow")]
    MathOverflow,

    #[msg["Insufficient Funds"]]
    InsufficientFunds,

    #[msg("Vault still contains funds")]
    VaultNotEmpty,

    #[msg("Vault is still active")]
    VaultStillActive,
}
