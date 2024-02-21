import * as anchor from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { assert, expect } from "chai";
import {
  initCustomerInfraAssert,
  customerRequestRideAssert,
  updateCustomerInfraCompanyAssert,
} from "../asserts/customer";
import {
  getAllDriver,
  getCompanyInfraAddress,
  getDriverInfraDataByAddress,
  getCountryAddress,
  getCountryData,
  getJobPda,
  getCustomerInfraAddress,
  getCustomerInfraData,
  getAllCustomerInfraData,
  getCustomerInfraDataByUpdateAuthority,
  getGlobalAddress,
  getDriverInfraDataByUpdateAuthority,
  getDriverAddress,
  getDriverInfraAddress,
  getJobData,
  getJobDataByAddress,
} from "../utils/pda";
import { EncryptedData, IAllAccounts } from "../utils/types";
import { customerEncryption } from "../utils/encryption";
import { PublicKey } from "@solana/web3.js";

export const initCustomerInfra = async (
  allAccounts: IAllAccounts,
  customerInfraId = new anchor.BN(0),
  shouldPass = true
) => {
  const { program, stableMint, customerInfraOwner } = allAccounts;
  const countryPda = getCountryAddress(program, "SGP");
  const countryState = await getCountryData(program, "SGP");
  const customerInfraPda = getCustomerInfraAddress(
    program,
    shouldPass ? countryState.customerInfraCounter : customerInfraId
  );
  const customerInfraCompanyPda = getCompanyInfraAddress(
    program,
    customerInfraPda,
    new anchor.BN(0)
  );

  const customerInfraOwnerStableAta = await getAssociatedTokenAddress(
    stableMint,
    customerInfraOwner.publicKey,
    true
  );
  const customerInfraStableAta = await getAssociatedTokenAddress(
    stableMint,
    customerInfraPda,
    true
  );

  let params = {
    customerInfraCount: shouldPass
      ? countryState.customerInfraCounter
      : customerInfraId,
    companyName: "helloRide",
    entityRegistryId: "S123",
    website: "helloRide.sg",
    customerInfraFeeBasisPoint: 100,
  };

  try {
    await program.methods
      .initCustomerInfra("SGP", params)
      .accounts({
        countryState: countryPda,
        customerInfraOwner: customerInfraOwner.publicKey,
        customerInfra: customerInfraPda,
        companyInfo: customerInfraCompanyPda,
        customerInfraOwnerStable: customerInfraOwnerStableAta,
        customerInfraStable: customerInfraStableAta,
        mint: stableMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([customerInfraOwner])
      .rpc();
    if (shouldPass) {
      // ASSERT TEST
      await initCustomerInfraAssert(
        program,
        params,
        customerInfraOwner.publicKey
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

export const initCustomerInfraAgain = async (allAccounts: IAllAccounts) => {
  const { program, stableMint, customerInfraOwner } = allAccounts;
  const countryPda = getCountryAddress(program, "SGP");
  const countryState = await getCountryData(program, "SGP");
  const newCustomerInfraPdaCount = new anchor.BN(
    +countryState.customerInfraCounter + 1
  );
  const customerInfraPda = getCustomerInfraAddress(
    program,
    countryState.customerInfraCounter
  );
  const customerInfraCompanyPda = getCompanyInfraAddress(
    program,
    customerInfraPda,
    new anchor.BN(0)
  );

  const customerInfraOwnerStableAta = await getAssociatedTokenAddress(
    stableMint,
    customerInfraOwner.publicKey,
    true
  );
  const customerInfraStableAta = await getAssociatedTokenAddress(
    stableMint,
    customerInfraPda,
    true
  );

  let params = {
    customerInfraCount: newCustomerInfraPdaCount,
    companyName: "helloRide",
    entityRegistryId: "S123",
    website: "helloRide.sg",
    customerInfraFeeBasisPoint: 100,
  };
  try {
    await program.methods
      .initCustomerInfra("SGP", params)
      .accounts({
        countryState: countryPda,
        customerInfraOwner: customerInfraOwner.publicKey,
        customerInfra: customerInfraPda,
        companyInfo: customerInfraCompanyPda,
        customerInfraOwnerStable: customerInfraOwnerStableAta,
        customerInfraStable: customerInfraStableAta,
        mint: stableMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([customerInfraOwner])
      .rpc();
    assert.fail();
  } catch (error) {
    expect(error.message).to.include("custom program error:");
  }
};

export const updateCustomerInfraCompanyInfo = async (
  allAccounts: IAllAccounts
) => {
  const { program, customerInfraOwner } = allAccounts;
  const countryState = await getCountryData(program, "SGP");
  const newCustomerInfraPdaCount = new anchor.BN(
    +countryState.customerInfraCounter + 1
  );
  const customerInfraPda = getCustomerInfraAddress(
    program,
    countryState.customerInfraCounter
  );
  const customerInfraData = await getCustomerInfraData(
    program,
    countryState.customerInfraCounter
  );
  const oldcustomerInfraCompanyPda = getCompanyInfraAddress(
    program,
    customerInfraPda,
    customerInfraData.companyInfoCurrentCount
  );
  const newcustomerInfraCompanyPda = getCompanyInfraAddress(
    program,
    customerInfraPda,
    new anchor.BN(+customerInfraData.companyInfoCurrentCount + 1)
  );

  let params = {
    companyName: "helloWorld",
    entityRegistryId: "S123",
    website: "helloWorld.sg",
    infraCount: newCustomerInfraPdaCount,
    oldCompanyInfoCount: customerInfraData.companyInfoCurrentCount,
  };

  try {
    await program.methods
      .updateCustomerInfraCompany("SGP", params)
      .accounts({
        customerInfra: customerInfraPda,
        customerInfraOwner: customerInfraOwner.publicKey,
        oldCompanyInfo: oldcustomerInfraCompanyPda,
        newCompanyInfo: newcustomerInfraCompanyPda,
      })
      .signers([customerInfraOwner])
      .rpc();
  } catch (error) {
    console.log("error:", error);
  }
  // ASSERT TEST
  await updateCustomerInfraCompanyAssert(
    program,
    params,
    customerInfraOwner.publicKey
  );
};

export const updateCustomerInfraCompanyInfoWithWrongAuth = async (
  allAccounts: IAllAccounts
) => {
  const { program, driverInfraOwner, customerInfraOwner } = allAccounts;
  const countryState = await getCountryData(program, "SGP");
  const newCustomerInfraPdaCount = new anchor.BN(
    +countryState.customerInfraCounter + 1
  );
  const customerInfraPda = getCustomerInfraAddress(
    program,
    countryState.customerInfraCounter
  );
  const customerInfraData = await getCustomerInfraData(
    program,
    countryState.customerInfraCounter
  );
  const oldcustomerInfraCompanyPda = getCompanyInfraAddress(
    program,
    customerInfraPda,
    customerInfraData.companyInfoCurrentCount
  );
  const newcustomerInfraCompanyPda = getCompanyInfraAddress(
    program,
    customerInfraPda,
    new anchor.BN(+customerInfraData.companyInfoCurrentCount + 1)
  );

  let params = {
    companyName: "helloWorld",
    entityRegistryId: "S123",
    website: "helloWorld.sg",
    infraCount: newCustomerInfraPdaCount,
    oldCompanyInfoCount: customerInfraData.companyInfoCurrentCount,
  };

  try {
    await program.methods
      .updateCustomerInfraCompany("SGP", params)
      .accounts({
        customerInfra: customerInfraPda,
        customerInfraOwner: driverInfraOwner.publicKey,
        oldCompanyInfo: oldcustomerInfraCompanyPda,
        newCompanyInfo: newcustomerInfraCompanyPda,
      })
      .signers([driverInfraOwner])
      .rpc();
    assert.fail();
  } catch (error) {
    expect(error.message).to.include("Error Code: ConstraintSeeds");
  }
};

export const updateCustomerInfraBasisPointTest = async (
  allAccounts: IAllAccounts
) => {
  const { program, customerInfraOwner } = allAccounts;
  const countryState = await getCountryData(program, "SGP");
  const customerInfraData = await getCustomerInfraDataByUpdateAuthority(
    program,
    customerInfraOwner.publicKey
  );

  const basisPoint = 300;
  try {
    await program.methods
      .updateCustomerInfraBasisPoint(
        "SGP",
        customerInfraData.account.customerInfraCount,
        basisPoint
      )
      .accounts({
        customerInfra: customerInfraData.publicKey,
        customerInfraOwner: customerInfraOwner.publicKey,
      })
      .signers([customerInfraOwner])
      .rpc();
  } catch (error) {
    console.log("error:", error);
  }
  // ASSERT TEST
  const customerInfraDataAfter = await getCustomerInfraData(
    program,
    countryState.customerInfraCounter
  );
  expect(customerInfraDataAfter.customerInfraFeeBasisPoint).to.equal(
    basisPoint
  );
};

export const updateCustomerInfraBasisPointTestWrongAuth = async (
  allAccounts: IAllAccounts
) => {
  const { program, customerInfraOwner, driverInfraOwner } = allAccounts;
  const countryState = await getCountryData(program, "SGP");

  const customerInfraData = await getCustomerInfraDataByUpdateAuthority(
    program,
    customerInfraOwner.publicKey
  );

  const basisPoint = 200;
  try {
    await program.methods
      .updateCustomerInfraBasisPoint(
        "SGP",
        customerInfraData.account.customerInfraCount,
        basisPoint
      )
      .accounts({
        customerInfra: customerInfraData.publicKey,
        customerInfraOwner: driverInfraOwner.publicKey,
      })
      .signers([driverInfraOwner])
      .rpc();
    assert.fail();
  } catch (error) {
    expect(error.message).to.include("Error Code: ConstraintSeeds");
  }
};

export const customerRequestRide = async (
  allAccounts: IAllAccounts,
  encryptedData: EncryptedData
) => {
  const { program, customerInfraOwner, stableMint } = allAccounts;
  const globalState = getGlobalAddress(program);
  const selectedDriver = await getAllDriver(program);
  const driverUuid = selectedDriver.account.driverUuid;
  const driverInfraAddress = selectedDriver.account.infraAuthority;
  const customerInfraData = await getCustomerInfraDataByUpdateAuthority(
    program,
    customerInfraOwner.publicKey
  );
  const driverInfraData = await getDriverInfraDataByAddress(
    program,
    driverInfraAddress
  );

  const customerInfraCount = customerInfraData.account.customerInfraCount;
  const jobCount = driverInfraData.jobCounter;
  const driverInfraCount = driverInfraData.driverInfraCount;
  const jobPda = getJobPda(program, driverInfraAddress, jobCount);
  const customerInfraOwnerStableAta = await getAssociatedTokenAddress(
    stableMint,
    customerInfraOwner.publicKey,
    true
  );
  const jobEscrowStableAta = await getAssociatedTokenAddress(
    stableMint,
    jobPda,
    true
  );
  const distributionLen = 2;
  const totalFees = new anchor.BN(10_50);

  try {
    await program.methods
      .customerRequestRide(
        "SGP",
        driverUuid,
        jobCount,
        customerInfraCount,
        driverInfraCount,
        distributionLen,
        encryptedData.encryptedData,
        encryptedData.encryptedCombinedRandBase64,
        totalFees
      )
      .accounts({
        globalState,
        customerInfra: customerInfraData.publicKey,
        driverInfra: driverInfraAddress,
        job: jobPda,
        customerInfraOwner: customerInfraOwner.publicKey,
        customerInfraOwnerStable: customerInfraOwnerStableAta,
        jobEscrowStable: jobEscrowStableAta,
        mint: stableMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([customerInfraOwner])
      .rpc();
  } catch (error) {
    console.log("error:", error);
  }

  // ASSERT TEST
  await customerRequestRideAssert(
    program,
    driverUuid,
    customerInfraCount,
    driverInfraCount,
    encryptedData,
    totalFees,
    allAccounts
  );
};

// Customer application has all required infomation
export const driverAcceptedJob = async (
  allAccounts: IAllAccounts,
  driverInfraOwner: PublicKey,
  driverUuid: string
) => {
  const { program, customerInfraOwner } = allAccounts;
  const customerInfraData = await getCustomerInfraDataByUpdateAuthority(
    program,
    customerInfraOwner.publicKey
  );
  const driverInfraData = await getDriverInfraDataByUpdateAuthority(
    program,
    driverInfraOwner
  );
  const driverAddress = getDriverAddress(program, driverUuid);
  const jobData = await getJobData(
    program,
    customerInfraData.publicKey,
    driverUuid
  );

  const distination = { lat: 1.28272, long: 103.845455 };

  try {
    await program.methods
      .driverAcceptedJob(
        "SGP",
        customerInfraData.account.customerInfraCount,
        driverInfraData.account.driverInfraCount,
        driverUuid,
        jobData.account.jobCount,
        distination
      )
      .accounts({
        driver: driverAddress,
        driverInfra: driverInfraData.publicKey,
        customerInfra: customerInfraData.publicKey,
        job: jobData.publicKey,
        customerInfraOwner: customerInfraOwner.publicKey,
      })
      .signers([customerInfraOwner])
      .rpc();
    assert.ok(true);
  } catch (error) {
    console.log("error", error);
    assert.fail();
  }
};
export const customerCancelJob = async (
  allAccounts: IAllAccounts,
  driverUuid: string,
  shouldPass = true
) => {
  const { program, customerInfraOwner, stableMint, driverInfraOwner } =
    allAccounts;
  const countryPda = getCountryAddress(program, "SGP");
  const customerInfraData = await getCustomerInfraDataByUpdateAuthority(
    program,
    customerInfraOwner.publicKey
  );
  const driverInfraData = await getDriverInfraDataByUpdateAuthority(
    program,
    driverInfraOwner.publicKey
  );
  const driverAddress = getDriverAddress(program, driverUuid);
  const jobData = await getJobData(
    program,
    customerInfraData.publicKey,
    driverUuid
  );

  const customerInfraStableAta = await getAssociatedTokenAddress(
    stableMint,
    customerInfraData.publicKey,
    true
  );
  const driverInfraStableAta = await getAssociatedTokenAddress(
    stableMint,
    driverInfraData.publicKey,
    true
  );

  try {
    await program.methods
      .customerCancelRide(
        "SGP",
        driverUuid,
        customerInfraData.account.customerInfraCount,
        driverInfraData.account.driverInfraCount,
        jobData.account.jobCount
      )
      .accounts({
        countryState: countryPda,
        customerInfra: customerInfraData.publicKey,
        driverInfra: driverInfraData.publicKey,
        driver: driverAddress,
        job: jobData.publicKey,
        customerInfraOwner: customerInfraOwner.publicKey,
        customerInfraStable: customerInfraStableAta,
        driverInfraStable: driverInfraStableAta,
        mint: stableMint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([customerInfraOwner])
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
    } else {
      expect(error.message).to.include("assert.fail()");
    }
  }
};
