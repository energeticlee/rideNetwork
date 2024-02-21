import * as anchor from "@project-serum/anchor";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { assert, expect } from "chai";
import {
  assertDriverCompleteJob,
  createDriverAssert,
  initDriverInfraAssert,
  updateDriverInfraCompanyAssert,
  updateDriverLocationAssert,
} from "../asserts/driver";
import {
  getCompanyInfraAddress,
  getDriverAddress,
  getDriverData,
  getDriverInfraAddress,
  getDriverInfraData,
  getCountryAddress,
  getCountryData,
  getVehicleAddress,
  getDriverInfraDataByUpdateAuthority,
  getCustomerInfraDataByUpdateAuthority,
  getJobData,
  getCustomerInfraAddress,
} from "../utils/pda";
import { IAllAccounts } from "../utils/types";

export const initDriverInfra = async (
  allAccounts: IAllAccounts,
  driverInfraId = new anchor.BN(0),
  shouldPass = true
) => {
  const { program, stableMint, driverInfraOwner } = allAccounts;
  const countryPda = getCountryAddress(program);
  const countryState = await getCountryData(program);
  const driverInfraPda = getDriverInfraAddress(
    program,
    shouldPass ? countryState.driverInfraCounter : driverInfraId
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
    driverInfraCount: shouldPass
      ? countryState.driverInfraCounter
      : driverInfraId,
    companyName: "helloRide",
    entityRegistryId: "S123",
    website: "helloRide.sg",
    driverInfraFeeBasisPoint: 100,
  };

  try {
    await program.methods
      .initDriverInfra("SGP", params)
      .accounts({
        countryState: countryPda,
        driverInfraOwner: driverInfraOwner.publicKey,
        driverInfra: driverInfraPda,
        companyInfo: driverInfraCompanyPda,
        driverInfraOwnerStable: driverInfraOwnerStableAta,
        driverInfraStable: driverInfraStableAta,
        mint: stableMint,
      })
      .signers([driverInfraOwner])
      .rpc();
    if (shouldPass) {
      // ASSERT TEST
      await initDriverInfraAssert(
        program,
        params,
        countryState.driverInfraCounter,
        driverInfraOwner.publicKey
      );
    } else {
      assert.fail();
    }
  } catch (error) {
    if (shouldPass) {
      console.log("error:", error);
      throw error;
    } else {
      expect(error.message).to.include("custom program error:");
    }
  }
};

export const updateDriverInfraCompanyInfo = async (
  allAccounts: IAllAccounts
) => {
  const { program, driverInfraOwner } = allAccounts;
  const countryState = await getCountryData(program, "SGP");
  const newDriverInfraPdaCount = new anchor.BN(
    +countryState.driverInfraCounter + 1
  );
  const driverInfraPda = getDriverInfraAddress(program, newDriverInfraPdaCount);
  const driverInfraData = await getDriverInfraData(
    program,
    newDriverInfraPdaCount
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
    entityRegistryId: "S123",
    website: "helloWorld.sg",
    infraCount: newDriverInfraPdaCount,
    oldCompanyInfoCount: driverInfraData.companyInfoCurrentCount,
  };

  try {
    await program.methods
      .updateDriverInfraCompany("SGP", params)
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
  await updateDriverInfraCompanyAssert(program, params, newDriverInfraPdaCount);
};

export const updateDriverInfraCompanyInfoWithWrongAuth = async (
  allAccounts: IAllAccounts
) => {
  const { program, driverInfraOwner, customerInfraOwner } = allAccounts;
  const countryState = await getCountryData(program, "SGP");
  const newDriverInfraPdaCount = new anchor.BN(
    +countryState.driverInfraCounter + 1
  );
  const driverInfraPda = getDriverInfraAddress(program, newDriverInfraPdaCount);
  const driverInfraData = await getDriverInfraData(
    program,
    newDriverInfraPdaCount
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
    entityRegistryId: "S123",
    website: "helloWorld.sg",
    infraCount: newDriverInfraPdaCount,
    oldCompanyInfoCount: driverInfraData.companyInfoCurrentCount,
  };

  try {
    await program.methods
      .updateDriverInfraCompany("SGP", params)
      .accounts({
        driverInfra: driverInfraPda,
        driverInfraOwner: customerInfraOwner.publicKey,
        oldCompanyInfo: oldDriverInfraCompanyPda,
        newCompanyInfo: newDriverInfraCompanyPda,
      })
      .signers([customerInfraOwner])
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
  const driverInfraData = await getDriverInfraDataByUpdateAuthority(
    program,
    driverInfraOwner.publicKey
  );
  const driverInfraPda = getDriverInfraAddress(
    program,
    driverInfraData.account.driverInfraCount
  );

  const basisPoint = 300;
  try {
    await program.methods
      .updateDriverInfraBasisPoint("SGP", basisPoint)
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
    driverInfraData.account.driverInfraCount
  );
  expect(driverInfraDataAfter.driverInfraFeeBasisPoint).to.equal(basisPoint);
};

export const updateDriverInfraBasisPointTestWrongAuth = async (
  allAccounts: IAllAccounts
) => {
  const { program, driverInfraOwner, customerInfraOwner } = allAccounts;

  const driverInfraData = await getDriverInfraDataByUpdateAuthority(
    program,
    driverInfraOwner.publicKey
  );
  const driverInfraPda = getDriverInfraAddress(
    program,
    driverInfraData.account.driverInfraCount
  );

  const basisPoint = 200;
  try {
    await program.methods
      .updateDriverInfraBasisPoint("SGP", basisPoint)
      .accounts({
        driverInfra: driverInfraPda,
        driverInfraOwner: customerInfraOwner.publicKey,
      })
      .signers([customerInfraOwner])
      .rpc();
    assert.fail();
  } catch (error) {
    expect(error.message).to.include("Error Code: ConstraintSeeds");
  }
};

export const createDriver = async (
  allAccounts: IAllAccounts,
  driverUuid: string,
  publicKeyPem: string | Buffer
) => {
  const { program, driverInfraOwner } = allAccounts;
  const countryPda = getCountryAddress(program, "SGP");
  const driverAddress = getDriverAddress(program, driverUuid);
  const vehicleAddress = getVehicleAddress(program, new anchor.BN(0));
  const driverInfraData = await getDriverInfraDataByUpdateAuthority(
    program,
    driverInfraOwner.publicKey
  );
  const driverInfraPda = getDriverInfraAddress(
    program,
    driverInfraData.account.driverInfraCount
  );
  const coordinates = { lat: 1.28272, long: 103.845455 };

  try {
    await program.methods
      .driverStartWork(
        "SGP",
        driverInfraData.account.driverInfraCount,
        driverUuid,
        publicKeyPem.toString(),
        [new anchor.BN(0)],
        [new anchor.BN(0)],
        new anchor.BN(0),
        coordinates
      )
      .accounts({
        countryState: countryPda,
        driverInfra: driverInfraPda,
        driver: driverAddress,
        vehicle: vehicleAddress,
        driverInfraAuthority: driverInfraOwner.publicKey,
        locationUpdateAuthority: driverInfraOwner.publicKey,
      })
      .signers([driverInfraOwner])
      .rpc();
  } catch (error) {
    console.log("error:", error);
    assert.fail();
  }

  await createDriverAssert(program, driverUuid, driverInfraPda, coordinates);
};

// export const createDriverWithWrongAuth = async (
//   uuid: string,
//   allAccounts: IAllAccounts
// ) => {
//   const { program, driverInfraOwner, bozo } = allAccounts;
//   const driverAddress = getDriverAddress(program, uuid);
//   const driverInfraData = await getDriverInfraDataByUpdateAuthority(
//     program,
//     driverInfraOwner.publicKey
//   );
//   const driverInfraPda = getDriverInfraAddress(
//     program,
//     driverInfraData.account.driverInfraCount
//   );
//   const coordinates = { lat: 1.28272, long: 103.845455 };

//   try {
//     await program.methods
//       .driverStartOrUpdate(uuid, coordinates, { premiumSeater: {} }, null)
//       .accounts({
//         driver: driverAddress,
//         driverInfra: driverInfraPda,
//         driverInfraOwner: bozo.publicKey,
//       })
//       .signers([bozo])
//       .rpc();
//     assert.fail();
//   } catch (error) {
//     expect(error.message).to.include("Error Code: ConstraintSeeds");
//   }
// };

export const updateDriverLocation = async (
  allAccounts: IAllAccounts,
  uuid: string
) => {
  const { program, driverInfraOwner } = allAccounts;
  const driverAddress = getDriverAddress(program, uuid);
  const coordinates = { lat: 1.33333, long: 102.845885 };

  const driverDataBefore = await getDriverData(program, uuid);

  try {
    await program.methods
      .driverUpdateLocation(uuid, coordinates, null)
      .accounts({
        driver: driverAddress,
        locationUpdateAuthority: driverInfraOwner.publicKey,
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

// export const updateDriverLocationWrongAuth = async (
//   uuid: string,
//   allAccounts: IAllAccounts
// ) => {
//   const { program, driverInfraOwner, bozo } = allAccounts;
//   const driverAddress = getDriverAddress(program, uuid);
//   const driverInfraData = await getDriverInfraDataByUpdateAuthority(
//     program,
//     driverInfraOwner.publicKey
//   );
//   const driverInfraPda = getDriverInfraAddress(
//     program,
//     driverInfraData.account.driverInfraCount
//   );
//   const coordinates = { lat: 1.33333, long: 102.845885 };

//   const driverDataBefore = await getDriverData(program, uuid);

//   try {
//     await program.methods
//       .driverStartOrUpdate(uuid, coordinates, { premiumSeater: {} }, null)
//       .accounts({
//         driver: driverAddress,
//         driverInfra: driverInfraPda,
//         driverInfraOwner: bozo.publicKey,
//       })
//       .signers([bozo])
//       .rpc();
//     assert.fail();
//   } catch (error) {
//     expect(error.message).to.include("Error Code: ConstraintSeeds");
//   }

//   await updateDriverLocationAssert(
//     program,
//     uuid,
//     coordinates,
//     driverDataBefore
//   );
// };

export const driverCompleteJob = async (
  allAccounts: IAllAccounts,
  driverUuid: string
) => {
  const { program, driverInfraOwner, customerInfraOwner, stableMint } =
    allAccounts;
  const countryAddress = getCountryAddress(program);
  const driverAddress = getDriverAddress(program, driverUuid);
  const driverInfraData = await getDriverInfraDataByUpdateAuthority(
    program,
    driverInfraOwner.publicKey
  );
  const customerInfraData = await getCustomerInfraDataByUpdateAuthority(
    program,
    customerInfraOwner.publicKey
  );
  const jobData = await getJobData(
    program,
    customerInfraData.publicKey,
    driverUuid
  );

  const driverInfraPda = getDriverInfraAddress(
    program,
    driverInfraData.account.driverInfraCount
  );
  const customerInfraPda = getCustomerInfraAddress(
    program,
    customerInfraData.account.customerInfraCount
  );

  const driverInfraStableAta = await getAssociatedTokenAddress(
    stableMint,
    driverInfraPda,
    true
  );
  const customerInfraStableAta = await getAssociatedTokenAddress(
    stableMint,
    customerInfraPda,
    true
  );
  const jobEscrowStableAta = await getAssociatedTokenAddress(
    stableMint,
    jobData.publicKey,
    true
  );

  try {
    await program.methods
      .driverCompleteJob(
        "SGP",
        driverUuid,
        driverInfraData.account.driverInfraCount,
        customerInfraData.account.customerInfraCount,
        jobData.account.jobCount
      )
      .accounts({
        countryState: countryAddress,
        driverInfra: driverInfraPda,
        customerInfra: customerInfraPda,
        driver: driverAddress,
        job: jobData.publicKey,
        driverInfraOwner: driverInfraOwner.publicKey,
        jobEsrowStable: jobEscrowStableAta,
        driverInfraStable: driverInfraStableAta,
        customerInfraStable: customerInfraStableAta,
        mint: stableMint,
      })
      .signers([driverInfraOwner])
      .rpc();
  } catch (error) {
    console.log("error:", error);
    assert.fail();
  }

  await assertDriverCompleteJob(
    program,
    driverUuid,
    customerInfraData.publicKey
  );
};

export const driverCompleteJobAfterFinialize = async (
  allAccounts: IAllAccounts,
  driverUuid: string
) => {
  const { program, driverInfraOwner, customerInfraOwner, stableMint } =
    allAccounts;
  const countryAddress = getCountryAddress(program);
  const driverAddress = getDriverAddress(program, driverUuid);
  const driverInfraData = await getDriverInfraDataByUpdateAuthority(
    program,
    driverInfraOwner.publicKey
  );
  const customerInfraData = await getCustomerInfraDataByUpdateAuthority(
    program,
    customerInfraOwner.publicKey
  );
  const jobData = await getJobData(
    program,
    customerInfraData.publicKey,
    driverUuid
  );

  const driverInfraPda = getDriverInfraAddress(
    program,
    driverInfraData.account.driverInfraCount
  );
  const customerInfraPda = getCustomerInfraAddress(
    program,
    customerInfraData.account.customerInfraCount
  );

  const driverInfraStableAta = await getAssociatedTokenAddress(
    stableMint,
    driverInfraPda,
    true
  );
  const customerInfraStableAta = await getAssociatedTokenAddress(
    stableMint,
    customerInfraPda,
    true
  );
  const jobEscrowStableAta = await getAssociatedTokenAddress(
    stableMint,
    jobData.publicKey,
    true
  );

  try {
    await program.methods
      .driverCompleteJob(
        "SGP",
        driverUuid,
        driverInfraData.account.driverInfraCount,
        customerInfraData.account.customerInfraCount,
        jobData.account.jobCount
      )
      .accounts({
        countryState: countryAddress,
        driverInfra: driverInfraPda,
        customerInfra: customerInfraPda,
        driver: driverAddress,
        job: jobData.publicKey,
        driverInfraOwner: driverInfraOwner.publicKey,
        jobEsrowStable: jobEscrowStableAta,
        driverInfraStable: driverInfraStableAta,
        customerInfraStable: customerInfraStableAta,
        mint: stableMint,
      })
      .signers([driverInfraOwner])
      .rpc();
  } catch (error) {
    console.log("error:", error);
  }
  const data = await getJobData(program, customerInfraPda, driverUuid);
  assert.equal(!!data, false, `Account should be closed by got ${data}`);
};

// export const endDriverWorkWrongAuth = async (
//   uuid: string,
//   allAccounts: IAllAccounts
// ) => {
//   const { program, driverInfraOwner, bozo } = allAccounts;
//   const driverAddress = getDriverAddress(program, uuid);
//   const driverInfraData = await getDriverInfraDataByUpdateAuthority(
//     program,
//     driverInfraOwner.publicKey
//   );
//   const driverInfraPda = getDriverInfraAddress(
//     program,
//     driverInfraData.account.driverInfraCount
//   );

//   try {
//     await program.methods
//       .driverEndWork(uuid)
//       .accounts({
//         driver: driverAddress,
//         driverInfra: driverInfraPda,
//         driverInfraOwner: bozo.publicKey,
//       })
//       .signers([bozo])
//       .rpc();
//     assert.fail();
//   } catch (error) {
//     expect(error.message).to.include("Error Code: ConstraintSeeds");
//   }
// };

// export const endDriverWork = async (
//   uuid: string,
//   allAccounts: IAllAccounts
// ) => {
//   const { program, driverInfraOwner } = allAccounts;
//   const driverAddress = getDriverAddress(program, uuid);
//   const driverInfraData = await getDriverInfraDataByUpdateAuthority(
//     program,
//     driverInfraOwner.publicKey
//   );
//   const driverInfraPda = getDriverInfraAddress(
//     program,
//     driverInfraData.account.driverInfraCount
//   );

//   try {
//     await program.methods
//       .driverEndWork(uuid)
//       .accounts({
//         driver: driverAddress,
//         driverInfra: driverInfraPda,
//         driverInfraOwner: driverInfraOwner.publicKey,
//       })
//       .signers([driverInfraOwner])
//       .rpc();
//   } catch (error) {
//     assert.fail();
//   }

//   try {
//     await getDriverData(program, uuid);
//     assert.fail();
//   } catch (error) {
//     expect(error.message).to.include("Account does not exist");
//   }
// };

export const driverCancelJob = async (
  allAccounts: IAllAccounts,
  driverUuid: string,
  shouldPass = true
) => {
  const { program, driverInfraOwner, customerInfraOwner, stableMint } =
    allAccounts;
  const countryAddress = getCountryAddress(program);
  const driverAddress = getDriverAddress(program, driverUuid);
  const driverInfraData = await getDriverInfraDataByUpdateAuthority(
    program,
    driverInfraOwner.publicKey
  );
  const customerInfraData = await getCustomerInfraDataByUpdateAuthority(
    program,
    customerInfraOwner.publicKey
  );
  const jobData = await getJobData(
    program,
    customerInfraData.publicKey,
    driverUuid
  );

  const driverInfraPda = getDriverInfraAddress(
    program,
    driverInfraData.account.driverInfraCount
  );
  const customerInfraPda = getCustomerInfraAddress(
    program,
    customerInfraData.account.customerInfraCount
  );

  const driverInfraStableAta = await getAssociatedTokenAddress(
    stableMint,
    driverInfraPda,
    true
  );
  const customerInfraStableAta = await getAssociatedTokenAddress(
    stableMint,
    customerInfraPda,
    true
  );
  const jobEscrowStableAta = await getAssociatedTokenAddress(
    stableMint,
    jobData.publicKey,
    true
  );

  try {
    await program.methods
      .driverCancelJob(
        "SGP",
        driverUuid,
        driverInfraData.account.driverInfraCount,
        customerInfraData.account.customerInfraCount,
        jobData.account.jobCount
      )
      .accounts({
        countryState: countryAddress,
        driverInfra: driverInfraPda,
        customerInfra: customerInfraPda,
        driver: driverAddress,
        job: jobData.publicKey,
        driverInfraOwner: driverInfraOwner.publicKey,
        jobEsrowStable: jobEscrowStableAta,
        driverInfraStable: driverInfraStableAta,
        customerInfraStable: customerInfraStableAta,
        mint: stableMint,
      })
      .signers([driverInfraOwner])
      .rpc();
    const data = await getJobData(
      program,
      customerInfraData.publicKey,
      driverUuid
    );
    if (shouldPass) {
      assert.fail(`data is ${data}`);
    } else {
      assert.fail();
    }
  } catch (error) {
    if (shouldPass) {
      expect(error.message).to.include("data is undefined");
      // CHECK FEES WAS NOT DEDUCTED
    } else {
      expect(error.message).to.include("assert.fail()");
    }
  }
};
