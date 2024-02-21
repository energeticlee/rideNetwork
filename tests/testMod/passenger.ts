import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import {
  getAllDriverData,
  getCountryAddress,
  getGlobalAddress,
  getGlobalData,
  getPassengerTypeAddress,
} from "../utils/pda";
import { IAllAccounts } from "../utils/types";
import { assert, expect } from "chai";
import { assertNewPassengerType } from "../asserts/passengerTypes";

export const addPassengerType = async (
  allAccounts: IAllAccounts,
  shouldPass = true
) => {
  const { program, mainWallet1, stableMint } = allAccounts;
  const globalPda = getGlobalAddress(program);
  const globalData = await getGlobalData(program);
  const passengerTypePda = getPassengerTypeAddress(
    program,
    globalData.passengersTypeCounter
  );
  const passengerTypeStableAta = await getAssociatedTokenAddress(
    stableMint,
    passengerTypePda,
    true
  );
  const initializerStableAta = await getAssociatedTokenAddress(
    stableMint,
    mainWallet1.publicKey
  );

  try {
    await program.methods
      .initOrUpdatePassenger("dog_friendly", globalData.passengersTypeCounter)
      .accounts({
        globalState: globalPda,
        passengerType: passengerTypePda,
        passengerTypeEscrowAccount: passengerTypeStableAta,
        initializerTokenAccount: initializerStableAta,
        initializer: mainWallet1.publicKey,
        mint: stableMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([mainWallet1])
      .rpc();
    if (shouldPass) {
      await assertNewPassengerType(
        program,
        globalData.passengersTypeCounter,
        "dog_friendly",
        mainWallet1.publicKey
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
