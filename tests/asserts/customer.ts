import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { expect } from "chai";
import { RideNetwork } from "../../target/types/ride_network";
import {
  getCompanyData,
  getDriverData,
  getDriverInfraAddress,
  getJobData,
  getJobPda,
  getCustomerInfraAddress,
  getCustomerInfraData,
  getCountryData,
  getCustomerInfraDataByUpdateAuthority,
  getCustomerInfraDataByAddress,
} from "../utils/pda";
import {
  IAllAccounts,
  IInitDriverInfraAssert,
  IInitCustomerInfraAssert,
  IUpdateInfraAssert,
  CustomerData,
  EncryptedData,
} from "../utils/types";

export const initCustomerInfraAssert = async (
  program: anchor.Program<RideNetwork>,
  params: IInitCustomerInfraAssert,
  customerInfraOwner: PublicKey
) => {
  const countryData = await getCountryData(program);
  const customerInfraData = await getCustomerInfraData(
    program,
    params.customerInfraCount
  );
  const customerInfraAddress = getCustomerInfraAddress(
    program,
    params.customerInfraCount
  );
  const companyData = await getCompanyData(
    program,
    customerInfraData.companyInfoCurrentCount,
    customerInfraAddress
  );
  // ASSERT TEST
  expect(customerInfraData.updateAuthority.toString()).to.equal(
    customerInfraOwner.toString(),
    "updateAuthority"
  );
  expect(+customerInfraData.customerInfraCount).to.equal(
    +countryData.customerInfraCounter - 1,
    "customerInfraCount"
  );
  expect(customerInfraData.isInitialized).to.equal(true, "isInitialized");
  expect(customerInfraData.isVerified).to.equal(false, "isVerified");
  expect(customerInfraData.isFrozen).to.equal(false, "isFrozen");
  expect(customerInfraData.customerInfraFeeBasisPoint).to.equal(
    params.customerInfraFeeBasisPoint,
    "customerInfraFeeBasisPoint"
  );
  expect(+customerInfraData.matchedRide).to.equal(0, "matchedRide");
  expect(+customerInfraData.cancellation).to.equal(0, "cancellation");
  expect(+customerInfraData.disputeCases).to.equal(0, "disputeCases");
  expect(+customerInfraData.casesLostInDispute).to.equal(
    0,
    "casesLostInDispute"
  );
  expect(companyData.companyName).to.equal(params.companyName, "companyName");
  expect(companyData.entityRegistryId).to.equal(
    params.entityRegistryId,
    "entityRegistryId"
  );
  expect(companyData.website).to.equal(params.website, "website");
};

export const assertVerifyCustomerInfra = async (
  program: anchor.Program<RideNetwork>,
  customerInfraCount: anchor.BN
) => {
  const customerInfraData = await getCustomerInfraData(
    program,
    customerInfraCount
  );
  // ASSERT TEST
  expect(customerInfraData.isVerified).to.equal(true, "isVerified");
};

export const updateDriverInfraCompanyAssert = async (
  program: anchor.Program<RideNetwork>,
  params: IUpdateInfraAssert,
  customerInfraOwner: PublicKey
) => {
  const customerInfraData = await getCustomerInfraData(
    program,
    params.infraCount
  );
  const customerInfraAddress = getCustomerInfraAddress(
    program,
    params.infraCount
  );
  const companyData = await getCompanyData(
    program,
    customerInfraData.companyInfoCurrentCount,
    customerInfraAddress
  );
  // ASSERT TEST
  expect(customerInfraData.isFrozen).to.equal(true, "isFrozen");
  expect(+customerInfraData.companyInfoCurrentCount).to.equal(
    1,
    "companyInfoCurrentCount"
  );
  expect(companyData.companyName).to.equal(params.companyName, "companyName");
  expect(companyData.entityRegistryId).to.equal(
    params.entityRegistryId,
    "entityRegistryId"
  );
  expect(companyData.website).to.equal(params.website, "website");
};

export const createDriverAssert = async (
  program: anchor.Program<RideNetwork>,
  uuid: string,
  driverInfra: PublicKey,
  currentLocation: { lat: number; long: number },
  offeredService: string
) => {
  const driverData = await getDriverData(program, uuid);
  // ASSERT TEST
  expect(driverData.driverUuid).to.equal(uuid, "driverUuid");
  expect(driverData.isInitialized).to.equal(true, "isInitialized");
  expect(driverData.infraAuthority.toString()).to.equal(
    driverInfra.toString(),
    "infraAuthority"
  );
  expect(driverData.lastLocation.lat).to.equal(
    currentLocation.lat,
    "currentLocation: Lat"
  );
  expect(driverData.lastLocation.long).to.equal(
    currentLocation.long,
    "currentLocation: Long"
  );
  expect(driverData.nextLocation).to.equal(null, "nextLocation");
  expect(Object.keys(driverData.offeredService)[0]).to.equal(
    offeredService,
    "nextLocation"
  );
};

export const updateCustomerInfraCompanyAssert = async (
  program: anchor.Program<RideNetwork>,
  params: IUpdateInfraAssert,
  customerInfraOwner: PublicKey
) => {
  const customerInfraData = await getCustomerInfraData(
    program,
    params.infraCount
  );
  const customerInfraAddress = getCustomerInfraAddress(
    program,
    params.infraCount
  );
  const companyData = await getCompanyData(
    program,
    customerInfraData.companyInfoCurrentCount,
    customerInfraAddress
  );
  // ASSERT TEST
  expect(customerInfraData.isFrozen).to.equal(true, "isFrozen");
  expect(+customerInfraData.companyInfoCurrentCount).to.equal(
    1,
    "companyInfoCurrentCount"
  );
  expect(companyData.companyName).to.equal(params.companyName, "companyName");
  expect(companyData.entityRegistryId).to.equal(
    params.entityRegistryId,
    "entityRegistryId"
  );
  expect(companyData.website).to.equal(params.website, "website");
};

export const customerRequestRideAssert = async (
  program: anchor.Program<RideNetwork>,
  driverUuid: string,
  customerInfraCount: anchor.BN,
  driverInfraCount: anchor.BN,
  encryptedData: EncryptedData,
  calculatedFees: anchor.BN,
  allAccounts: IAllAccounts
) => {
  const customerInfraAddress = getCustomerInfraAddress(
    program,
    customerInfraCount
  );
  const jobDataX = await getJobData(program, customerInfraAddress, driverUuid);
  const driverInfraAddress = getDriverInfraAddress(program, driverInfraCount);
  const jobData = jobDataX.account;
  // ASSERT TEST
  expect(jobData.driverUuid).to.equal(driverUuid, "uuid");
  expect(jobData.customerInfra.toString()).to.equal(
    customerInfraAddress.toString(),
    "customerInfra"
  );
  expect(jobData.driverInfra.toString()).to.equal(
    driverInfraAddress.toString(),
    "driverInfra"
  );
  expect(Object.keys(jobData.status)[0]).to.equal("init", "status");
  expect(+jobData.totalFeeCent).to.equal(+calculatedFees, "totalFeeCent");
  expect(jobData.encryptedCombinedRandBase64).to.equal(
    encryptedData.encryptedCombinedRandBase64,
    "encryptedCombinedRandBase64"
  );
  expect(jobData.encryptedData).to.equal(
    encryptedData.encryptedData,
    "encryptedData"
  );
};
