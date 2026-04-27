import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";
import { PublicKey } from "@solana/web3.js";
import { QuotaVault } from "../target/types/quota_vault";

describe("quota_vault", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.QuotaVault as Program<QuotaVault>;

  // fresh owner each test run
  const ownerKeypair = anchor.web3.Keypair.generate();
  const owner = ownerKeypair.publicKey;

  const plan = 2;

  const [vaultPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("vault"),
      owner.toBuffer(),
    ],
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
    const vaultAccount =
      await program.account.vaultAccount.fetch(vaultPda);

    expect(
      vaultAccount.owner.toBase58()
    ).to.equal(owner.toBase58());

    expect(
      vaultAccount.apiSigner.toBase58()
    ).to.equal(owner.toBase58());

    expect(
      vaultAccount.active
    ).to.equal(true);

    expect(
      vaultAccount.plan
    ).to.equal(plan);

    console.log("Vault account:", vaultAccount);
  });

  it("Fails if vault already exists", async () => {
    let failed = false;

    try {
      await program.methods
        .initializeVault(owner, plan)
        .accounts({
          owner,
        })
        .signers([ownerKeypair])
        .rpc();
    } catch (err: any) {
      failed = true;
      console.log(
        "Expected duplicate init failure:",
        err.message
      );
    }

    expect(failed).to.equal(true);
  });

  it("Creates a seat", async () => {
    // unique seat every run
    const seatId = new anchor.BN(Date.now());

    const holder =
      anchor.web3.Keypair.generate().publicKey;

    const seatType = 0;
    const monthlyLimit = new anchor.BN(1000);

    const [seatPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("seat"),
        vaultPda.toBuffer(),
        seatId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    await program.methods
      .createSeat(
        holder,
        seatId,
        seatType,
        monthlyLimit
      )
      .accountsPartial({
        owner,
        vault: vaultPda,
      })
      .signers([ownerKeypair])
      .rpc();

    const seatAccount =
      await program.account.seatAccount.fetch(seatPda);

    console.log("Seat PDA:", seatPda.toBase58());
    console.log("Seat account:", seatAccount);

    expect(
      seatAccount.vault.toBase58()
    ).to.equal(vaultPda.toBase58());

    expect(
      seatAccount.holder.toBase58()
    ).to.equal(holder.toBase58());

    expect(
      seatAccount.monthlyLimit.toString()
    ).to.equal("1000");

    expect(
      seatAccount.consumed.toString()
    ).to.equal("0");

    expect(
      seatAccount.active
    ).to.equal(true);
  });
});