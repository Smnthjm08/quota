import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";
import { PublicKey } from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { QuotaVault } from "../target/types/quota_vault";

describe("quota_vault", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.QuotaVault as Program<QuotaVault>;

  const ownerKeypair = anchor.web3.Keypair.generate();
  const owner = ownerKeypair.publicKey;

  const plan = 2;

  const [vaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), owner.toBuffer()],
    program.programId
  );

  // setup once
  before(async () => {
    const sig = await provider.connection.requestAirdrop(
      owner,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );

    await provider.connection.confirmTransaction(sig);

    await program.methods
      .initializeVault(owner, plan)
      .accounts({
        owner,
      })
      .signers([ownerKeypair])
      .rpc();

    console.log("Vault initialized:", vaultPda.toBase58());
  });

  it("Fetches initialized vault", async () => {
    const vaultAccount = await program.account.vaultAccount.fetch(vaultPda);

    expect(vaultAccount.owner.toBase58()).to.equal(owner.toBase58());
    expect(vaultAccount.apiSigner.toBase58()).to.equal(owner.toBase58());
    expect(vaultAccount.active).to.equal(true);
    expect(vaultAccount.plan).to.equal(plan);

    console.log("Vault account:", vaultAccount);
  });

  it("Deposits to vault, creates seat, updates limit, and toggles", async () => {
    const seatId = new anchor.BN(Date.now());
    const holder = anchor.web3.Keypair.generate().publicKey;

    // On-chain enum: 1 = HUMAN, 2 = AGENT
    const seatType = 1;
    // Use base units for token amounts (6 decimals like USDC)
    const monthlyLimit = new anchor.BN(1000).mul(new anchor.BN(1_000_000));

    // Step 1: Create SPL mint (USDC-like with 6 decimals)
    const mint = await createMint(
      provider.connection,
      ownerKeypair,
      owner,
      null,
      6
    );

    // Step 2: Create token accounts for owner and vault
    const ownerTokenAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      ownerKeypair,
      mint,
      owner
    );

    const vaultTokenAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      ownerKeypair,
      mint,
      vaultPda
    );

    // Step 3: Mint 2000 USDC (in base units) to owner
    const depositAmount = new anchor.BN(2000).mul(new anchor.BN(1_000_000));
    await mintTo(
      provider.connection,
      ownerKeypair,
      mint,
      ownerTokenAccount.address,
      ownerKeypair,
      Number(depositAmount)
    );

    // Step 4: Call deposit_to_vault to move tokens and update vault.total_deposited
    await program.methods
      .depositToVault(new anchor.BN(Number(depositAmount)))
      .accountsPartial({
        vault: vaultPda,
        authority: owner,
        mint,
        fromTokenAccount: ownerTokenAccount.address,
        vaultTokenAccount: vaultTokenAccount.address,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([ownerKeypair])
      .rpc();

    const vaultAfterDeposit = await program.account.vaultAccount.fetch(vaultPda);
    console.log("After deposit — vault.total_deposited:", vaultAfterDeposit.totalDeposited.toString());
    console.log("After deposit — vault.total_assigned:", vaultAfterDeposit.totalAssigned.toString());

    // Step 5: Create seat (1000 USDC limit = 1000 * 1_000_000 base units)
    const [seatPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("seat"), vaultPda.toBuffer(), seatId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    await program.methods
      .createSeat(holder, seatId, seatType, monthlyLimit)
      .accountsPartial({ owner, vault: vaultPda })
      .signers([ownerKeypair])
      .rpc();

    const seatAccount = await program.account.seatAccount.fetch(seatPda);
    console.log("After create — seat.limit:", seatAccount.limit.toString());
    console.log("After create — seat.active:", seatAccount.active);

    expect(seatAccount.vault.toBase58()).to.equal(vaultPda.toBase58());
    expect(seatAccount.holder.toBase58()).to.equal(holder.toBase58());
    expect(seatAccount.limit.toString()).to.equal(monthlyLimit.toString());
    expect(seatAccount.consumed.toString()).to.equal("0");
    expect(seatAccount.active).to.equal(true);
    expect(seatAccount.seatType).to.equal(seatType);

    const vaultAfterCreate = await program.account.vaultAccount.fetch(vaultPda);
    console.log("After create — vault.total_assigned:", vaultAfterCreate.totalAssigned.toString());

    // Step 6: Update seat limit (500 USDC = 500 * 1_000_000 base units)
    const newLimit = new anchor.BN(500).mul(new anchor.BN(1_000_000));

    await program.methods
      .updateSeatHandler(newLimit)
      .accountsPartial({ authority: owner, vault: vaultPda, seat: seatPda })
      .signers([ownerKeypair])
      .rpc();

    const updatedSeat = await program.account.seatAccount.fetch(seatPda);
    console.log("After update — seat.limit:", updatedSeat.limit.toString());

    expect(updatedSeat.limit.toString()).to.equal(newLimit.toString());

    const vaultAfterUpdate = await program.account.vaultAccount.fetch(vaultPda);
    console.log("After update — vault.total_assigned:", vaultAfterUpdate.totalAssigned.toString());

    // Step 7: Toggle seat (deactivate)
    const vaultBeforeToggle = await program.account.vaultAccount.fetch(vaultPda);
    console.log("Before toggle — vault.total_assigned:", vaultBeforeToggle.totalAssigned.toString());

    await program.methods
      .toggleSeatHandler()
      .accountsPartial({ authority: owner, vault: vaultPda, seat: seatPda })
      .signers([ownerKeypair])
      .rpc();

    const toggledSeat = await program.account.seatAccount.fetch(seatPda);
    console.log("After toggle — seat.active:", toggledSeat.active);

    expect(toggledSeat.active).to.equal(false);

    // Verify that deactivation released the seat limit from vault.total_assigned
    const vaultAfterToggle = await program.account.vaultAccount.fetch(vaultPda);
    console.log("After toggle — vault.total_assigned:", vaultAfterToggle.totalAssigned.toString());
    console.log("  (Released:", newLimit.toString(), "back to available pool)");
    expect(vaultAfterToggle.totalAssigned.toString()).to.equal("0");

    // Step 8: Reactivate seat (toggle back on)
    await program.methods
      .toggleSeatHandler()
      .accountsPartial({ authority: owner, vault: vaultPda, seat: seatPda })
      .signers([ownerKeypair])
      .rpc();

    const reactivatedSeat = await program.account.seatAccount.fetch(seatPda);
    console.log("After reactivate — seat.active:", reactivatedSeat.active);
    expect(reactivatedSeat.active).to.equal(true);

    // Verify that reactivation reserves the limit again
    const vaultAfterReactivate = await program.account.vaultAccount.fetch(vaultPda);
    console.log("After reactivate — vault.total_assigned:", vaultAfterReactivate.totalAssigned.toString());
    expect(vaultAfterReactivate.totalAssigned.toString()).to.equal(newLimit.toString());

    // Step 9: Verify final vault state
    const vaultFinal = await program.account.vaultAccount.fetch(vaultPda);
    console.log("Final vault state:");
    console.log("  total_deposited:", vaultFinal.totalDeposited.toString());
    console.log("  total_assigned:", vaultFinal.totalAssigned.toString());
    console.log("  active:", vaultFinal.active);
  });
});