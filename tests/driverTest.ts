import * as anchor from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { assert, expect } from "chai";
import {
  createDriverAssert,
  initDriverInfraAssert,
  updateDriverInfraCompanyAssert,
  updateDriverLocationAssert,
} from "./asserts/driver";
import {
  getCompanyInfraAddress,
  getDriverAddress,
  getDriverData,
  getDriverInfraAddress,
  getDriverInfraData,
  getCountryAddress,
  getCountryData,
} from "./utils/pda";
import { IAllAccounts, JobType } from "./utils/types";

export const initDriverInfra = async (allAccounts: IAllAccounts) => {
  const { program, stableMint, driverInfraOwner } = allAccounts;
  const countryPda = getCountryAddress(program);
  const countryState = await getCountryData(program);
  const newDriverInfraPdaCount = new anchor.BN(
    +countryState.driverInfraCounter + 1
  );
  const driverInfraPda = getDriverInfraAddress(
    program,
    driverInfraOwner.publicKey
  );
  const driverInfraCompanyPda = getCompanyInfraAddress(
    program,
    driverInfraPda,
    new anchor.BN(0)
  );

  const driverInfraOwnerStableAta = await getAssociatedTokenAddress(
    stableMint,
    driverInfraOwner.publicKey,
    true
  );
  const driverInfraStableAta = await getAssociatedTokenAddress(
    stableMint,
    driverInfraPda,
    true
  );

  let params = {
    driverInfraCount: newDriverInfraPdaCount,
    companyName: "helloRide",
    uen: "S123",
    website: "helloRide.sg",
    driverInfraFeeBasisPoint: 100,
  };

  try {
    await program.methods
      .initDriverInfra(params)
      .accounts({
        countryState: countryPda,
        driverInfraOwner: driverInfraOwner.publicKey,
        driverInfra: driverInfraPda,
        companyInfo: driverInfraCompanyPda,
        driverInfraOwnerStable: driverInfraOwnerStableAta,
        driverInfraStable: driverInfraStableAta,
        mint: stableMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([driverInfraOwner])
      .rpc();
  } catch (error) {
    console.log("error:", error);
  }

  // ASSERT TEST
  await initDriverInfraAssert(program, params, driverInfraOwner.publicKey);
};

export const initDriverInfraAgain = async (allAccounts: IAllAccounts) => {
  const { program, stableMint, driverInfraOwner } = allAccounts;
  const countryPda = getCountryAddress(program);
  const countryState = await getCountryData(program);
  const newDriverInfraPdaCount = new anchor.BN(
    +countryState.driverInfraCounter + 1
  );
  const driverInfraPda = getDriverInfraAddress(
    program,
    driverInfraOwner.publicKey
  );
  const driverInfraCompanyPda = getCompanyInfraAddress(
    program,
    driverInfraPda,
    new anchor.BN(0)
  );

  const driverInfraOwnerStableAta = await getAssociatedTokenAddress(
    stableMint,
    driverInfraOwner.publicKey,
    true
  );
  const driverInfraStableAta = await getAssociatedTokenAddress(
    stableMint,
    driverInfraPda,
    true
  );

  let params = {
    driverInfraCount: newDriverInfraPdaCount,
    companyName: "helloRide",
    uen: "S123",
    website: "helloRide.sg",
    driverInfraFeeBasisPoint: 100,
  };

  try {
    await program.methods
      .initDriverInfra(params)
      .accounts({
        countryState: countryPda,
        driverInfraOwner: driverInfraOwner.publicKey,
        driverInfra: driverInfraPda,
        companyInfo: driverInfraCompanyPda,
        driverInfraOwnerStable: driverInfraOwnerStableAta,
        driverInfraStable: driverInfraStableAta,
        mint: stableMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([driverInfraOwner])
      .rpc();
    assert.fail();
  } catch (error) {
    expect(error.message).to.include("custom program error:");
  }
};

export const updateDriverInfraCompanyInfo = async (
  allAccounts: IAllAccounts
) => {
  const { program, driverInfraOwner } = allAccounts;
  const countryState = await getCountryData(program);
  const newDriverInfraPdaCount = new anchor.BN(
    +countryState.driverInfraCounter + 1
  );
  const driverInfraPda = getDriverInfraAddress(
    program,
    driverInfraOwner.publicKey
  );
  const driverInfraData = await getDriverInfraData(
    program,
    driverInfraOwner.publicKey
  );
  const oldDriverInfraCompanyPda = getCompanyInfraAddress(
    program,
    driverInfraPda,
    driverInfraData.companyInfoCurrentCount
  );
  const newDriverInfraCompanyPda = getCompanyInfraAddress(
    program,
    driverInfraPda,
    new anchor.BN(+driverInfraData.companyInfoCurrentCount + 1)
  );

  let params = {
    companyName: "helloWorld",
    uen: "S123",
    website: "helloWorld.sg",
    infraCount: newDriverInfraPdaCount,
    oldCompanyInfoCount: driverInfraData.companyInfoCurrentCount,
  };

  try {
    await program.methods
      .updateDriverInfraCompany(params)
      .accounts({
        driverInfra: driverInfraPda,
        driverInfraOwner: driverInfraOwner.publicKey,
        oldCompanyInfo: oldDriverInfraCompanyPda,
        newCompanyInfo: newDriverInfraCompanyPda,
      })
      .signers([driverInfraOwner])
      .rpc();
  } catch (error) {
    console.log("error:", error);
  }
  // ASSERT TEST
  await updateDriverInfraCompanyAssert(
    program,
    params,
    driverInfraOwner.publicKey
  );
};

export const updateDriverInfraCompanyInfoWithWrongAuth = async (
  allAccounts: IAllAccounts
) => {
  const { program, driverInfraOwner, riderInfraOwner } = allAccounts;
  const countryState = await getCountryData(program);
  const newDriverInfraPdaCount = new anchor.BN(
    +countryState.driverInfraCounter + 1
  );
  const driverInfraPda = getDriverInfraAddress(
    program,
    driverInfraOwner.publicKey
  );
  const driverInfraData = await getDriverInfraData(
    program,
    driverInfraOwner.publicKey
  );
  const oldDriverInfraCompanyPda = getCompanyInfraAddress(
    program,
    driverInfraPda,
    driverInfraData.companyInfoCurrentCount
  );
  const newDriverInfraCompanyPda = getCompanyInfraAddress(
    program,
    driverInfraPda,
    new anchor.BN(+driverInfraData.companyInfoCurrentCount + 1)
  );

  let params = {
    companyName: "helloWorld",
    uen: "S123",
    website: "helloWorld.sg",
    infraCount: newDriverInfraPdaCount,
    oldCompanyInfoCount: driverInfraData.companyInfoCurrentCount,
  };

  try {
    await program.methods
      .updateDriverInfraCompany(params)
      .accounts({
        driverInfra: driverInfraPda,
        driverInfraOwner: riderInfraOwner.publicKey,
        oldCompanyInfo: oldDriverInfraCompanyPda,
        newCompanyInfo: newDriverInfraCompanyPda,
      })
      .signers([riderInfraOwner])
      .rpc();
    assert.fail();
  } catch (error) {
    expect(error.message).to.include("Error Code: ConstraintSeeds");
  }
};

export const updateDriverInfraBasisPointTest = async (
  allAccounts: IAllAccounts
) => {
  const { program, driverInfraOwner } = allAccounts;
  const driverInfraPda = getDriverInfraAddress(
    program,
    driverInfraOwner.publicKey
  );

  const basisPoint = 300;
  try {
    await program.methods
      .updateDriverInfraBasisPoint(basisPoint)
      .accounts({
        driverInfra: driverInfraPda,
        driverInfraOwner: driverInfraOwner.publicKey,
      })
      .signers([driverInfraOwner])
      .rpc();
  } catch (error) {
    console.log("error:", error);
  }
  // ASSERT TEST
  const driverInfraDataAfter = await getDriverInfraData(
    program,
    driverInfraOwner.publicKey
  );
  expect(driverInfraDataAfter.driverInfraFeeBasisPoint).to.equal(basisPoint);
};

export const updateDriverInfraBasisPointTestWrongAuth = async (
  allAccounts: IAllAccounts
) => {
  const { program, driverInfraOwner, riderInfraOwner } = allAccounts;

  const driverInfraPda = getDriverInfraAddress(
    program,
    driverInfraOwner.publicKey
  );

  const basisPoint = 200;
  try {
    await program.methods
      .updateDriverInfraBasisPoint(basisPoint)
      .accounts({
        driverInfra: driverInfraPda,
        driverInfraOwner: riderInfraOwner.publicKey,
      })
      .signers([riderInfraOwner])
      .rpc();
    assert.fail();
  } catch (error) {
    expect(error.message).to.include("Error Code: ConstraintSeeds");
  }
};

export const createDriver = async (uuid: string, allAccounts: IAllAccounts) => {
  const { program, driverInfraOwner } = allAccounts;
  const driverAddress = getDriverAddress(program, uuid);
  const driverInfraPda = getDriverInfraAddress(
    program,
    driverInfraOwner.publicKey
  );
  const coordinates = { lat: 1.28272, long: 103.845455 };

  try {
    await program.methods
      .driverStartOrUpdate(uuid, coordinates, { premiumSeater: {} }, null)
      .accounts({
        driver: driverAddress,
        driverInfra: driverInfraPda,
        driverInfraOwner: driverInfraOwner.publicKey,
      })
      .signers([driverInfraOwner])
      .rpc();
  } catch (error) {
    console.log("error:", error);
    assert.fail();
  }

  await createDriverAssert(
    program,
    uuid,
    driverInfraPda,
    coordinates,
    "premiumSeater"
  );
};

export const createDriverWithWrongAuth = async (
  uuid: string,
  allAccounts: IAllAccounts
) => {
  const { program, driverInfraOwner, bozo } = allAccounts;
  const driverAddress = getDriverAddress(program, uuid);
  const driverInfraPda = getDriverInfraAddress(
    program,
    driverInfraOwner.publicKey
  );
  const coordinates = { lat: 1.28272, long: 103.845455 };

  try {
    await program.methods
      .driverStartOrUpdate(uuid, coordinates, { premiumSeater: {} }, null)
      .accounts({
        driver: driverAddress,
        driverInfra: driverInfraPda,
        driverInfraOwner: bozo.publicKey,
      })
      .signers([bozo])
      .rpc();
    assert.fail();
  } catch (error) {
    expect(error.message).to.include("Error Code: ConstraintSeeds");
  }
};

export const updateDriverLocation = async (
  uuid: string,
  allAccounts: IAllAccounts
) => {
  const { program, driverInfraOwner } = allAccounts;
  const driverAddress = getDriverAddress(program, uuid);
  const driverInfraPda = getDriverInfraAddress(
    program,
    driverInfraOwner.publicKey
  );
  const coordinates = { lat: 1.33333, long: 102.845885 };

  const driverDataBefore = await getDriverData(program, uuid);

  try {
    await program.methods
      .driverStartOrUpdate(uuid, coordinates, { premiumSeater: {} }, null)
      .accounts({
        driver: driverAddress,
        driverInfra: driverInfraPda,
        driverInfraOwner: driverInfraOwner.publicKey,
      })
      .signers([driverInfraOwner])
      .rpc();
  } catch (error) {
    console.log("error:", error);
    assert.fail();
  }

  await updateDriverLocationAssert(
    program,
    uuid,
    coordinates,
    driverDataBefore
  );
};

export const updateDriverLocationWrongAuth = async (
  uuid: string,
  allAccounts: IAllAccounts
) => {
  const { program, driverInfraOwner, bozo } = allAccounts;
  const driverAddress = getDriverAddress(program, uuid);
  const driverInfraPda = getDriverInfraAddress(
    program,
    driverInfraOwner.publicKey
  );
  const coordinates = { lat: 1.33333, long: 102.845885 };

  const driverDataBefore = await getDriverData(program, uuid);

  try {
    await program.methods
      .driverStartOrUpdate(uuid, coordinates, { premiumSeater: {} }, null)
      .accounts({
        driver: driverAddress,
        driverInfra: driverInfraPda,
        driverInfraOwner: bozo.publicKey,
      })
      .signers([bozo])
      .rpc();
    assert.fail();
  } catch (error) {
    expect(error.message).to.include("Error Code: ConstraintSeeds");
  }

  await updateDriverLocationAssert(
    program,
    uuid,
    coordinates,
    driverDataBefore
  );
};

export const endDriverWorkWrongAuth = async (
  uuid: string,
  allAccounts: IAllAccounts
) => {
  const { program, driverInfraOwner, bozo } = allAccounts;
  const driverAddress = getDriverAddress(program, uuid);
  const driverInfraPda = getDriverInfraAddress(
    program,
    driverInfraOwner.publicKey
  );

  try {
    await program.methods
      .driverEndWork(uuid)
      .accounts({
        driver: driverAddress,
        driverInfra: driverInfraPda,
        driverInfraOwner: bozo.publicKey,
      })
      .signers([bozo])
      .rpc();
    assert.fail();
  } catch (error) {
    expect(error.message).to.include("Error Code: ConstraintSeeds");
  }
};

export const endDriverWork = async (
  uuid: string,
  allAccounts: IAllAccounts
) => {
  const { program, driverInfraOwner } = allAccounts;
  const driverAddress = getDriverAddress(program, uuid);
  const driverInfraPda = getDriverInfraAddress(
    program,
    driverInfraOwner.publicKey
  );

  try {
    await program.methods
      .driverEndWork(uuid)
      .accounts({
        driver: driverAddress,
        driverInfra: driverInfraPda,
        driverInfraOwner: driverInfraOwner.publicKey,
      })
      .signers([driverInfraOwner])
      .rpc();
  } catch (error) {
    assert.fail();
  }

  try {
    await getDriverData(program, uuid);
    assert.fail();
  } catch (error) {
    expect(error.message).to.include("Account does not exist");
  }
};
