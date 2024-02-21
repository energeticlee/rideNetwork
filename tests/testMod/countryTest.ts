import * as anchor from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { assert, expect } from "chai";
import { initOrUpdateCountryAssert } from "../asserts/country";
import {
  getAllCustomerInfraData,
  getAllDriverData,
  getAllDriverInfraData,
  getCountryAddress,
  getCountryData,
  getCustomerInfraAddress,
  getDriverAddress,
  getDriverData,
  getDriverInfraAddress,
} from "../utils/pda";
import { IAllAccounts } from "../utils/types";
import { assertVerifyDriverInfra } from "../asserts/driver";
import { assertVerifyCustomerInfra } from "../asserts/customer";

export const initCountryState = async (
  allAccounts: IAllAccounts,
  shouldFail = false
) => {
  const { program, mainWallet2, stableMint } = allAccounts;
  const countryPda = getCountryAddress(program, "SGP");

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
    customerCancellationFeeSec: new anchor.BN(300),
    cancellationFeeCent: new anchor.BN(5000),
    baseRateCent: new anchor.BN(4500),
    minKmRateCent: new anchor.BN(20),
    minMinFeeCent: new anchor.BN(10),
    finalizeDurationSec: new anchor.BN(1),
    minDriverInfraDeposit: new anchor.BN(10_000_00),
    minCustomerInfraDeposit: new anchor.BN(10_000_00),
    disputeWaitoutPeriod: new anchor.BN(10_000_00),
    baseSlashAmount: new anchor.BN(10_00),
  };

  try {
    await program.methods
      .initOrUpdateCountry("SGP", params)
      .accounts({
        countryState: countryPda,
        authority: mainWallet2.publicKey,
        countryStableAccount: countryStableAta,
        mint: stableMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([mainWallet2])
      .rpc();
  } catch (error) {
    if (shouldFail) {
      assert.ok(true);
    } else {
      assert.fail();
    }
  }

  if (!shouldFail) {
    // ASSERT TEST
    await initOrUpdateCountryAssert(program, params, "SGP", mainWallet2);
  }
};

export const updateCountryState = async (
  allAccounts: IAllAccounts,
  fakeAuth = false
) => {
  const { program, stableMint, mainWallet2, bozo } = allAccounts;
  const countryPda = getCountryAddress(program, "SGP");

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
    customerCancellationFeeSec: new anchor.BN(300),
    cancellationFeeCent: new anchor.BN(5000),
    baseRateCent: new anchor.BN(4000),
    minKmRateCent: new anchor.BN(10),
    minMinFeeCent: new anchor.BN(15),
    finalizeDurationSec: new anchor.BN(1),
    minDriverInfraDeposit: new anchor.BN(1_000_00),
    minCustomerInfraDeposit: new anchor.BN(1_000_00),
    disputeWaitoutPeriod: new anchor.BN(1000000),
    baseSlashAmount: new anchor.BN(100),
  };

  try {
    await program.methods
      .initOrUpdateCountry("SGP", params)
      .accounts({
        countryState: countryPda,
        authority: fakeAuth ? bozo.publicKey : mainWallet2.publicKey,
        countryStableAccount: countryStableAta,
        mint: stableMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([fakeAuth ? bozo : mainWallet2])
      .rpc();

    // ASSERT TEST
    if (fakeAuth) {
      assert.fail("Update should fail");
    } else {
      await initOrUpdateCountryAssert(program, params, "SGP", mainWallet2);
    }
  } catch (error) {
    if (fakeAuth) {
      expect(error.message).to.include("Error Code: InvalidUpdateAuthority");
    } else {
      throw error;
    }
  }
};

export const updateNewAuthority = async (
  allAccounts: IAllAccounts,
  fakeAuth = false
) => {
  const { program, mainWallet1, mainWallet2, bozo } = allAccounts;
  const countryPda = getCountryAddress(program, "SGP");

  try {
    await program.methods
      .updateNewCountryAuthority("SGP")
      .accounts({
        countryState: countryPda,
        currentAuthority: fakeAuth ? bozo.publicKey : mainWallet2.publicKey,
        newAuthority: mainWallet1.publicKey,
      })
      .signers([fakeAuth ? bozo : mainWallet2])
      .rpc();
    if (fakeAuth) {
      assert.fail("Update should fail");
    } else {
      const countryAccount = await getCountryData(program, "SGP");
      assert.equal(
        countryAccount.updateAuthority.toString(),
        mainWallet1.publicKey.toString()
      );
    }
  } catch (error) {
    expect(error.message).to.include("Error Code: ConstraintRaw");
  }
};

export const approveDriverInfra = async (
  allAccounts: IAllAccounts,
  shouldPass = true
) => {
  const { program, mainWallet1, mainWallet2 } = allAccounts;
  const countryPda = getCountryAddress(program, "SGP");
  const allDriverInfraData = await getAllDriverInfraData(program);
  const targetDriver = allDriverInfraData[0];
  const driverInfraPda = getDriverInfraAddress(
    program,
    targetDriver.account.driverInfraCount
  );
  try {
    await program.methods
      .approveDriverInfra("SGP", targetDriver.account.driverInfraCount)
      .accounts({
        countryState: countryPda,
        countryAuthority: shouldPass
          ? mainWallet1.publicKey
          : mainWallet2.publicKey,
        driverInfra: driverInfraPda,
      })
      .signers([shouldPass ? mainWallet1 : mainWallet2])
      .rpc();
    if (shouldPass) {
      await assertVerifyDriverInfra(
        program,
        targetDriver.account.driverInfraCount
      );
    } else {
      assert.fail("Update should fail");
    }
  } catch (error) {
    if (shouldPass) {
      throw error;
    } else {
      expect(error.message).to.include("Error Code: ConstraintRaw");
    }
  }
};

export const approveCustomerInfra = async (
  allAccounts: IAllAccounts,
  shouldPass = true
) => {
  const { program, mainWallet1, mainWallet2 } = allAccounts;
  const countryPda = getCountryAddress(program, "SGP");
  const allCustomerInfraData = await getAllCustomerInfraData(program);
  const targetCustomerInfra = allCustomerInfraData[0];
  const customerInfraPda = getCustomerInfraAddress(
    program,
    targetCustomerInfra.account.customerInfraCount
  );
  try {
    await program.methods
      .approveCustomerInfra(
        "SGP",
        targetCustomerInfra.account.customerInfraCount
      )
      .accounts({
        countryState: countryPda,
        countryAuthority: shouldPass
          ? mainWallet1.publicKey
          : mainWallet2.publicKey,
        customerInfra: customerInfraPda,
      })
      .signers([shouldPass ? mainWallet1 : mainWallet2])
      .rpc();
    if (shouldPass) {
      await assertVerifyCustomerInfra(
        program,
        targetCustomerInfra.account.customerInfraCount
      );
    } else {
      assert.fail("Update should fail");
    }
  } catch (error) {
    if (shouldPass) {
      throw error;
    } else {
      expect(error.message).to.include("Error Code: ConstraintRaw");
    }
  }
};
