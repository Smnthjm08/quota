# Quota

    Instruction              Signer          When called
   ─────────────────────────────────────────────────────────
✅ initialize_vault         Owner wallet    Once at onboarding
   create_seat              Owner wallet    Adding a seat on dashboard
   update_seat              Owner wallet    Editing seat limit
   toggle_seat              Owner wallet    Suspending/resuming seat
   withdraw_from_vault      Owner wallet    Recovering funds
   close_vault              Owner wallet    Shutting down vault
   topup_vault              Owner wallet    User manual deposit

✅ deposit_to_vault         api_signer      Dodo webhook fires
   consume                  api_signer      Every API request
   reclaim_treasury         api_signer      Internal treasury ops
