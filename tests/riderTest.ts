import * as anchor from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { assert, expect } from "chai";
import {
  initRiderInfraAssert,
  riderRequestRideAssert,
  updateRiderInfraCompanyAssert,
} from "./asserts/rider";
import {
  getAllDriver,
  getCompanyInfraAddress,
  getDriverData,
  getDriverInfraData,
  getDriverInfraDataByAddress,
  getCountryAddress,
  getCountryData,
  getJobPda,
  getRiderInfraAddress,
  getRiderInfraData,
} from "./utils/pda";
import { IAllAccounts } from "./utils/types";

export const initRiderInfra = async (allAccounts: IAllAccounts) => {
  const { program, stableMint, riderInfraOwner } = allAccounts;
  const countryPda = getCountryAddress(program);
  const countryState = await getCountryData(program);
  const newRiderInfraPdaCount = new anchor.BN(
    +countryState.riderInfraCounter + 1
  );
  const riderInfraPda = getRiderInfraAddress(
    program,
    riderInfraOwner.publicKey
  );
  const riderInfraCompanyPda = getCompanyInfraAddress(
    program,
    riderInfraPda,
    new anchor.BN(0)
  );

  const riderInfraOwnerStableAta = await getAssociatedTokenAddress(
    stableMint,
    riderInfraOwner.publicKey,
    true
  );
  const riderInfraStableAta = await getAssociatedTokenAddress(
    stableMint,
    riderInfraPda,
    true
  );

  let params = {
    riderInfraCount: newRiderInfraPdaCount,
    companyName: "helloRide",
    uen: "S123",
    website: "helloRide.sg",
    riderInfraFeeBasisPoint: 100,
  };
  try {
    await program.methods
      .initRiderInfra(params)
      .accounts({
        countryState: countryPda,
        riderInfraOwner: riderInfraOwner.publicKey,
        riderInfra: riderInfraPda,
        companyInfo: riderInfraCompanyPda,
        riderInfraOwnerStable: riderInfraOwnerStableAta,
        riderInfraStable: riderInfraStableAta,
        mint: stableMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([riderInfraOwner])
      .rpc();
  } catch (error) {
    console.log("error:", error);
  }

  // ASSERT TEST
  await initRiderInfraAssert(program, params, riderInfraOwner.publicKey);
};

export const initRiderInfraAgain = async (allAccounts: IAllAccounts) => {
  const { program, stableMint, riderInfraOwner } = allAccounts;
  const countryPda = getCountryAddress(program);
  const countryState = await getCountryData(program);
  const newRiderInfraPdaCount = new anchor.BN(
    +countryState.riderInfraCounter + 1
  );
  const riderInfraPda = getRiderInfraAddress(
    program,
    riderInfraOwner.publicKey
  );
  const riderInfraCompanyPda = getCompanyInfraAddress(
    program,
    riderInfraPda,
    new anchor.BN(0)
  );

  const riderInfraOwnerStableAta = await getAssociatedTokenAddress(
    stableMint,
    riderInfraOwner.publicKey,
    true
  );
  const riderInfraStableAta = await getAssociatedTokenAddress(
    stableMint,
    riderInfraPda,
    true
  );

  let params = {
    riderInfraCount: newRiderInfraPdaCount,
    companyName: "helloRide",
    uen: "S123",
    website: "helloRide.sg",
    riderInfraFeeBasisPoint: 100,
  };
  try {
    await program.methods
      .initRiderInfra(params)
      .accounts({
        countryState: countryPda,
        riderInfraOwner: riderInfraOwner.publicKey,
        riderInfra: riderInfraPda,
        companyInfo: riderInfraCompanyPda,
        riderInfraOwnerStable: riderInfraOwnerStableAta,
        riderInfraStable: riderInfraStableAta,
        mint: stableMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([riderInfraOwner])
      .rpc();
    assert.fail();
  } catch (error) {
    expect(error.message).to.include("custom program error:");
  }
};

export const updateRiderInfraCompanyInfo = async (
  allAccounts: IAllAccounts
) => {
  const { program, riderInfraOwner } = allAccounts;
  const countryState = await getCountryData(program);
  const newRiderInfraPdaCount = new anchor.BN(
    +countryState.riderInfraCounter + 1
  );
  const riderInfraPda = getRiderInfraAddress(
    program,
    riderInfraOwner.publicKey
  );
  const riderInfraData = await getRiderInfraData(
    program,
    riderInfraOwner.publicKey
  );
  const oldRiderInfraCompanyPda = getCompanyInfraAddress(
    program,
    riderInfraPda,
    riderInfraData.companyInfoCurrentCount
  );
  const newRiderInfraCompanyPda = getCompanyInfraAddress(
    program,
    riderInfraPda,
    new anchor.BN(+riderInfraData.companyInfoCurrentCount + 1)
  );

  let params = {
    companyName: "helloWorld",
    uen: "S123",
    website: "helloWorld.sg",
    infraCount: newRiderInfraPdaCount,
    oldCompanyInfoCount: riderInfraData.companyInfoCurrentCount,
  };

  try {
    await program.methods
      .updateRiderInfraCompany(params)
      .accounts({
        riderInfra: riderInfraPda,
        riderInfraOwner: riderInfraOwner.publicKey,
        oldCompanyInfo: oldRiderInfraCompanyPda,
        newCompanyInfo: newRiderInfraCompanyPda,
      })
      .signers([riderInfraOwner])
      .rpc();
  } catch (error) {
    console.log("error:", error);
  }
  // ASSERT TEST
  await updateRiderInfraCompanyAssert(
    program,
    params,
    riderInfraOwner.publicKey
  );
};

export const updateRiderInfraCompanyInfoWithWrongAuth = async (
  allAccounts: IAllAccounts
) => {
  const { program, driverInfraOwner, riderInfraOwner } = allAccounts;
  const countryState = await getCountryData(program);
  const newRiderInfraPdaCount = new anchor.BN(
    +countryState.riderInfraCounter + 1
  );
  const riderInfraPda = getRiderInfraAddress(
    program,
    riderInfraOwner.publicKey
  );
  const riderInfraData = await getRiderInfraData(
    program,
    riderInfraOwner.publicKey
  );
  const oldRiderInfraCompanyPda = getCompanyInfraAddress(
    program,
    riderInfraPda,
    riderInfraData.companyInfoCurrentCount
  );
  const newRiderInfraCompanyPda = getCompanyInfraAddress(
    program,
    riderInfraPda,
    new anchor.BN(+riderInfraData.companyInfoCurrentCount + 1)
  );

  let params = {
    companyName: "helloWorld",
    uen: "S123",
    website: "helloWorld.sg",
    infraCount: newRiderInfraPdaCount,
    oldCompanyInfoCount: riderInfraData.companyInfoCurrentCount,
  };

  try {
    await program.methods
      .updateRiderInfraCompany(params)
      .accounts({
        riderInfra: riderInfraPda,
        riderInfraOwner: driverInfraOwner.publicKey,
        oldCompanyInfo: oldRiderInfraCompanyPda,
        newCompanyInfo: newRiderInfraCompanyPda,
      })
      .signers([driverInfraOwner])
      .rpc();
    assert.fail();
  } catch (error) {
    expect(error.message).to.include("Error Code: ConstraintSeeds");
  }
};

export const updateRiderInfraBasisPointTest = async (
  allAccounts: IAllAccounts
) => {
  const { program, riderInfraOwner } = allAccounts;
  const riderInfraPda = getRiderInfraAddress(
    program,
    riderInfraOwner.publicKey
  );

  const basisPoint = 300;
  try {
    await program.methods
      .updateRiderInfraBasisPoint(basisPoint)
      .accounts({
        riderInfra: riderInfraPda,
        riderInfraOwner: riderInfraOwner.publicKey,
      })
      .signers([riderInfraOwner])
      .rpc();
  } catch (error) {
    console.log("error:", error);
  }
  // ASSERT TEST
  const riderInfraDataAfter = await getRiderInfraData(
    program,
    riderInfraOwner.publicKey
  );
  expect(riderInfraDataAfter.riderInfraFeeBasisPoint).to.equal(basisPoint);
};

export const updateRiderInfraBasisPointTestWrongAuth = async (
  allAccounts: IAllAccounts
) => {
  const { program, riderInfraOwner, driverInfraOwner } = allAccounts;
  const riderInfraPda = getRiderInfraAddress(
    program,
    riderInfraOwner.publicKey
  );

  const basisPoint = 200;
  try {
    await program.methods
      .updateRiderInfraBasisPoint(basisPoint)
      .accounts({
        riderInfra: riderInfraPda,
        riderInfraOwner: driverInfraOwner.publicKey,
      })
      .signers([driverInfraOwner])
      .rpc();
    assert.fail();
  } catch (error) {
    expect(error.message).to.include("Error Code: ConstraintSeeds");
  }
};

export const riderRequestRide = async (allAccounts: IAllAccounts) => {
  const { program, riderInfraOwner, stableMint } = allAccounts;
  const countryState = getCountryAddress(program);
  const selectedDriver = await getAllDriver(program);
  const driverUuid = selectedDriver.account.uuid;
  const driverInfraAddress = selectedDriver.account.infraAuthority;
  const driverPda = selectedDriver.publicKey;

  const riderInfraPda = getRiderInfraAddress(
    program,
    riderInfraOwner.publicKey
  );
  const driverInfraData = await getDriverInfraDataByAddress(
    program,
    driverInfraAddress
  );

  const jobCount = new anchor.BN(+driverInfraData.jobCounter + 1);
  const jobPda = await getJobPda(program, driverInfraAddress, jobCount);
  const riderInfraOwnerStableAta = await getAssociatedTokenAddress(
    stableMint,
    riderInfraOwner.publicKey,
    true
  );
  const jobEscrowStableAta = await getAssociatedTokenAddress(
    stableMint,
    jobPda,
    true
  );

  const encryptedData = "TODO";
  const distributionLen = 2;
  const calculatedFees = new anchor.BN(10_50);
  try {
    await program.methods
      .riderRequestRide(
        driverUuid,
        jobCount,
        distributionLen,
        encryptedData,
        calculatedFees
      )
      .accounts({
        countryState: countryState,
        riderInfra: riderInfraPda,
        driverInfraOwner: driverInfraData.updateAuthority,
        driverInfra: driverInfraAddress,
        driver: driverPda,
        job: jobPda,
        riderInfraOwner: riderInfraOwner.publicKey,
        riderInfraOwnerStable: riderInfraOwnerStableAta,
        jobEscrowStable: jobEscrowStableAta,
        mint: stableMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([riderInfraOwner])
      .rpc();
  } catch (error) {
    console.log("error:", error);
  }

  // ASSERT TEST
  await riderRequestRideAssert(
    program,
    driverUuid,
    jobCount,
    distributionLen,
    encryptedData,
    calculatedFees,
    allAccounts
  );
};
