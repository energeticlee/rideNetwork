import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { getGlobalAddress } from "../utils/pda";
import { IAllAccounts } from "../utils/types";
import { initOrUpdateCountryAssert } from "../asserts/country";
import { AssertGlobal } from "../asserts/global";
import * as anchor from "@project-serum/anchor";
import { assert } from "chai";

export const initGlobalState = async (
  allAccounts: IAllAccounts,
  shouldFail = false
) => {
  const { program, mainWallet2 } = allAccounts;
  const globalPda = getGlobalAddress(program);

  const platformFeeBasisPoint = 100;
  const newVehicleOrPaxFeeCent = new anchor.BN(100_00);
  try {
    await program.methods
      .initOrUpdateGlobal(platformFeeBasisPoint, newVehicleOrPaxFeeCent)
      .accounts({
        globalState: globalPda,
        updateAuthority: mainWallet2.publicKey,
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
    await AssertGlobal(
      program,
      platformFeeBasisPoint,
      newVehicleOrPaxFeeCent,
      mainWallet2
    );
  }
};

export const updateGlobalStateBasisPoint = async (
  allAccounts: IAllAccounts,
  shouldFail = false
) => {
  const { program, mainWallet2 } = allAccounts;
  const globalPda = getGlobalAddress(program);

  const platformFeeBasisPoint = 200;
  const newVehicleOrPaxFeeCent = new anchor.BN(100_00);
  try {
    await program.methods
      .initOrUpdateGlobal(platformFeeBasisPoint, null)
      .accounts({
        globalState: globalPda,
        updateAuthority: mainWallet2.publicKey,
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
    await AssertGlobal(
      program,
      platformFeeBasisPoint,
      newVehicleOrPaxFeeCent,
      mainWallet2
    );
  }
};

export const updateGlobalStateFees = async (
  allAccounts: IAllAccounts,
  shouldFail = false
) => {
  const { program, mainWallet2 } = allAccounts;
  const globalPda = getGlobalAddress(program);

  const platformFeeBasisPoint = 200;
  const newVehicleOrPaxFeeCent = new anchor.BN(200_00);
  try {
    await program.methods
      .initOrUpdateGlobal(null, newVehicleOrPaxFeeCent)
      .accounts({
        globalState: globalPda,
        updateAuthority: mainWallet2.publicKey,
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
    await AssertGlobal(
      program,
      platformFeeBasisPoint,
      newVehicleOrPaxFeeCent,
      mainWallet2
    );
  }
};

export const updateGlobalStateAuthority = async (
  allAccounts: IAllAccounts,
  shouldFail = false
) => {
  const { program, mainWallet1, mainWallet2 } = allAccounts;
  const globalPda = getGlobalAddress(program);

  const platformFeeBasisPoint = 200;
  const newVehicleOrPaxFeeCent = new anchor.BN(200_00);
  try {
    await program.methods
      .changeGobalAuthority()
      .accounts({
        globalState: globalPda,
        currentAuthority: mainWallet2.publicKey,
        newAuthority: mainWallet1.publicKey,
      })
      .signers([mainWallet2])
      .rpc();
  } catch (error) {
    if (shouldFail) {
      assert.ok(true);
    } else {
      console.log("error", error);
      assert.fail();
    }
  }

  if (!shouldFail) {
    // ASSERT TEST
    await AssertGlobal(
      program,
      platformFeeBasisPoint,
      newVehicleOrPaxFeeCent,
      mainWallet1
    );
  }
};
