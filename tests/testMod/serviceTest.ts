import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import {
  getAllDriverData,
  getCountryAddress,
  getCountryData,
  getDriverInfraAddress,
  getGlobalAddress,
  getGlobalData,
  getServiceAddress,
} from "../utils/pda";
import { IAllAccounts } from "../utils/types";
import { assert, expect } from "chai";
import { assertNewService } from "../asserts/service";

export const addService = async (
  allAccounts: IAllAccounts,
  shouldPass = true
) => {
  const { program, mainWallet1, stableMint } = allAccounts;
  const globalPda = getGlobalAddress(program);
  const globalData = await getGlobalData(program);
  const countryPda = getCountryAddress(program, "SGP");
  const countryData = await getCountryData(program, "SGP");
  const servicePda = getServiceAddress(program, globalData.serviceTypeCounter);
  const serviceStableAta = await getAssociatedTokenAddress(
    stableMint,
    servicePda,
    true
  );
  const initializerStableAta = await getAssociatedTokenAddress(
    stableMint,
    mainWallet1.publicKey
  );

  try {
    await program.methods
      .initOrUpdateService("SGP", globalData.serviceTypeCounter, "ride_hailing")
      .accounts({
        globalState: globalPda,
        countryState: countryPda,
        serviceType: servicePda,
        serviceTypeEscrowAccount: serviceStableAta,
        initializerTokenAccount: initializerStableAta,
        initializer: mainWallet1.publicKey,
        mint: stableMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([mainWallet1])
      .rpc();
    if (shouldPass) {
      await assertNewService(
        program,
        "SGP",
        globalData.serviceTypeCounter,
        "ride_hailing",
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
