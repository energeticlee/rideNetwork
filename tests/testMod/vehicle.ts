import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import {
  getGlobalAddress,
  getGlobalData,
  getVehicleAddress,
} from "../utils/pda";
import { IAllAccounts } from "../utils/types";
import { assert, expect } from "chai";
import { assertNewVehicle } from "../asserts/vehicle";

export const addVehicle = async (
  allAccounts: IAllAccounts,
  shouldPass = true
) => {
  const { program, mainWallet1, stableMint } = allAccounts;
  const globalPda = getGlobalAddress(program);
  const globalData = await getGlobalData(program);
  const vehiclePda = getVehicleAddress(program, globalData.vehicleCounter);
  const vehicleStableAta = await getAssociatedTokenAddress(
    stableMint,
    vehiclePda,
    true
  );
  const initializerStableAta = await getAssociatedTokenAddress(
    stableMint,
    mainWallet1.publicKey
  );

  try {
    await program.methods
      .initVehicle(globalData.vehicleCounter, "subaru", "forester", 4)
      .accounts({
        globalState: globalPda,
        vehicle: vehiclePda,
        vehicleEscrowAccount: vehicleStableAta,
        initializerTokenAccount: initializerStableAta,
        initializer: mainWallet1.publicKey,
        mint: stableMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([mainWallet1])
      .rpc();
    if (shouldPass) {
      await assertNewVehicle(
        program,
        globalData.vehicleCounter,
        "subaru",
        "forester",
        4,
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
