import * as anchor from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { assert, expect } from "chai";
import { initOrUpdateCountryAssert } from "./asserts/country";
import {
  getCountryAddress,
  getCountryData,
  getDriverAddress,
} from "./utils/pda";
import { IAllAccounts } from "./utils/types";

export const initCountryState = async (allAccounts: IAllAccounts) => {
  const { program, mainWallet1, stableMint } = allAccounts;
  const countryPda = getCountryAddress(program);

  const countryStableAta = await getAssociatedTokenAddress(
    stableMint,
    countryPda,
    true
  );

  let params = {
    platformFeeBasisPoint: 100,
    waitingFeeSec: new anchor.BN(300),
    waitingFeeCent: new anchor.BN(5000),
    driverCancellationFeeSec: new anchor.BN(300),
    riderCancellationFeeSec: new anchor.BN(300),
    cancellationFeeCent: new anchor.BN(5000),
    baseRateCent: new anchor.BN(4500),
    minKmRateCent: new anchor.BN(20),
    minMinFeeCent: new anchor.BN(10),
    finalizeDurationSec: new anchor.BN(3000),
    minDriverInfraDeposit: new anchor.BN(1000000),
    minRiderInfraDeposit: new anchor.BN(1000000),
    baseSlashAmount: new anchor.BN(100),
  };

  const tx = await program.methods
    .initOrUpdateCountry(params, "SGP")
    .accounts({
      countryState: countryPda,
      initializer: mainWallet1.publicKey,
      countryStableAccount: countryStableAta,
      mint: stableMint,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    })
    .signers([mainWallet1])
    .rpc();

  // ASSERT TEST
  await initOrUpdateCountryAssert(program, params, "SGP", mainWallet1);
};

export const updateCountryState = async (allAccounts: IAllAccounts) => {
  const { program, stableMint, mainWallet1 } = allAccounts;
  const countryPda = getCountryAddress(program);

  const countryStableAta = await getAssociatedTokenAddress(
    stableMint,
    countryPda,
    true
  );

  const params = {
    platformFeeBasisPoint: 200,
    waitingFeeSec: new anchor.BN(300),
    waitingFeeCent: new anchor.BN(5000),
    driverCancellationFeeSec: new anchor.BN(300),
    riderCancellationFeeSec: new anchor.BN(300),
    cancellationFeeCent: new anchor.BN(5000),
    baseRateCent: new anchor.BN(4000),
    minKmRateCent: new anchor.BN(10),
    minMinFeeCent: new anchor.BN(15),
    finalizeDurationSec: new anchor.BN(300),
    minDriverInfraDeposit: new anchor.BN(1_000_00),
    minRiderInfraDeposit: new anchor.BN(1_000_00),
    baseSlashAmount: new anchor.BN(100),
  };

  await program.methods
    .initOrUpdateCountry(params, "SGP")
    .accounts({
      countryState: countryPda,
      initializer: mainWallet1.publicKey,
      countryStableAccount: countryStableAta,
      mint: stableMint,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    })
    .signers([mainWallet1])
    .rpc();

  // ASSERT TEST
  await initOrUpdateCountryAssert(program, params, "SGP", mainWallet1);
};

export const updateCountryStateWithWrongAuth = async (
  allAccounts: IAllAccounts
) => {
  const { program, stableMint, bozo } = allAccounts;
  const countryPda = getCountryAddress(program);

  const countryStableAta = await getAssociatedTokenAddress(
    stableMint,
    countryPda,
    true
  );

  const params = {
    platformFeeBasisPoint: 200,
    waitingFeeSec: new anchor.BN(300),
    waitingFeeCent: new anchor.BN(5000),
    driverCancellationFeeSec: new anchor.BN(300),
    riderCancellationFeeSec: new anchor.BN(300),
    cancellationFeeCent: new anchor.BN(5000),
    baseRateCent: new anchor.BN(4000),
    minKmRateCent: new anchor.BN(10),
    minMinFeeCent: new anchor.BN(15),
    finalizeDurationSec: new anchor.BN(300),
    minDriverInfraDeposit: new anchor.BN(10000000),
    minRiderInfraDeposit: new anchor.BN(10000000),
    baseSlashAmount: new anchor.BN(100),
  };

  try {
    await program.methods
      .initOrUpdateCountry(params, "SGP")
      .accounts({
        countryState: countryPda,
        initializer: bozo.publicKey,
        countryStableAccount: countryStableAta,
        mint: stableMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([bozo])
      .rpc();
    assert.fail("Update should fail");
  } catch (error) {
    expect(error.message).to.include("Error Code: InvalidUpdateAuthority");
  }
};

export const updateNewAuthority = async (allAccounts: IAllAccounts) => {
  const { program, mainWallet1, mainWallet2 } = allAccounts;
  const countryPda = getCountryAddress(program);

  await program.methods
    .updateNewCountryAuthority()
    .accounts({
      countryState: countryPda,
      currentAuthority: mainWallet1.publicKey,
      newAuthority: mainWallet2.publicKey,
    })
    .signers([mainWallet1])
    .rpc();

  const countryAccount = await getCountryData(program);
  assert.equal(
    countryAccount.updateAuthority.toString(),
    mainWallet2.publicKey.toString()
  );
};

export const updateNewAuthorityWithWrongAuth = async (
  allAccounts: IAllAccounts
) => {
  const { program, mainWallet1, mainWallet2 } = allAccounts;
  const countryPda = getCountryAddress(program);

  try {
    await program.methods
      .updateNewCountryAuthority()
      .accounts({
        countryState: countryPda,
        currentAuthority: mainWallet1.publicKey,
        newAuthority: mainWallet2.publicKey,
      })
      .signers([mainWallet1])
      .rpc();
    assert.fail("Update should fail");
  } catch (error) {
    expect(error.message).to.include("Error Code: ConstraintRaw");
  }
};

// export const approveDriverInfra = async (allAccounts: IAllAccounts) => {
//   const { program, mainWallet1 } = allAccounts;
//   const countryPda = getCountryAddress(program);
//   const driverInfraPda = getDriverAddress(program);

//   try {
//     await program.methods
//       .approveDriverInfra()
//       .accounts({
//         countryState: countryPda,
//         currentAuthority: mainWallet1.publicKey,
//         driverInfra: driverInfraPda,
//       })
//       .signers([mainWallet1])
//       .rpc();
//     assert.fail("Update should fail");
//   } catch (error) {
//     expect(error.message).to.include("Error Code: ConstraintRaw");
//   }
// };
