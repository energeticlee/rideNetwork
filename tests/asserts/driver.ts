import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { expect } from "chai";
import { RideNetwork } from "../../target/types/ride_network";
import {} from "../utils/helperFn";
import {
  getCompanyData,
  getCountryData,
  getDriverData,
  getDriverInfraAddress,
  getDriverInfraData,
  getJobData,
} from "../utils/pda";
import { IInitDriverInfraAssert, IUpdateInfraAssert } from "../utils/types";

export const initDriverInfraAssert = async (
  program: anchor.Program<RideNetwork>,
  params: IInitDriverInfraAssert,
  driverInfraCount: anchor.BN,
  driverInfraOwnner: PublicKey
) => {
  const countryData = await getCountryData(program);
  const driverInfraData = await getDriverInfraData(program, driverInfraCount);
  const driverInfraAddress = getDriverInfraAddress(program, driverInfraCount);
  const companyData = await getCompanyData(
    program,
    driverInfraData.companyInfoCurrentCount,
    driverInfraAddress
  );
  // ASSERT TEST
  expect(driverInfraData.updateAuthority.toString()).to.equal(
    driverInfraOwnner.toString()
  );
  expect(+driverInfraData.driverInfraCount).to.equal(
    +countryData.driverInfraCounter - 1,
    "driverInfraCount"
  );
  expect(+driverInfraData.jobCounter).to.equal(0, "jobCounter");
  expect(driverInfraData.isInitialized).to.equal(true, "isInitialized");
  expect(driverInfraData.isVerified).to.equal(false, "isVerified");
  expect(driverInfraData.isFrozen).to.equal(false, "isFrozen");
  expect(driverInfraData.driverInfraFeeBasisPoint).to.equal(
    params.driverInfraFeeBasisPoint,
    "driverInfraFeeBasisPoint"
  );
  expect(companyData.companyName).to.equal(params.companyName, "companyName");
  expect(companyData.entityRegistryId).to.equal(
    params.entityRegistryId,
    "entityRegistryId"
  );
  expect(companyData.website).to.equal(params.website, "website");
};

export const updateDriverInfraCompanyAssert = async (
  program: anchor.Program<RideNetwork>,
  params: IUpdateInfraAssert,
  driverInfraCount: anchor.BN
) => {
  const driverInfraData = await getDriverInfraData(program, driverInfraCount);
  const driverInfraAddress = getDriverInfraAddress(program, driverInfraCount);
  const companyData = await getCompanyData(
    program,
    driverInfraData.companyInfoCurrentCount,
    driverInfraAddress
  );
  // ASSERT TEST
  expect(driverInfraData.isFrozen).to.equal(true, "isFrozen");
  expect(+driverInfraData.companyInfoCurrentCount).to.equal(
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

export const assertVerifyDriverInfra = async (
  program: anchor.Program<RideNetwork>,
  driverInfraCount: anchor.BN
) => {
  const driverInfraData = await getDriverInfraData(program, driverInfraCount);
  // ASSERT TEST
  expect(driverInfraData.isVerified).to.equal(true, "isVerified");
};

export const createDriverAssert = async (
  program: anchor.Program<RideNetwork>,
  driverUuid: string,
  driverInfra: PublicKey,
  currentLocation: { lat: number; long: number }
) => {
  const driverData = await getDriverData(program, driverUuid);
  // ASSERT TEST
  expect(driverData.driverUuid).to.equal(driverUuid, "driverUuid");
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
};

export const updateDriverLocationAssert = async (
  program: anchor.Program<RideNetwork>,
  driverUuid: string,
  currentLocation: { lat: number; long: number },
  driverDataBefore: any
) => {
  const driverData = await getDriverData(program, driverUuid);
  // ASSERT TEST
  expect(driverData.driverUuid).to.equal(
    driverDataBefore.driverUuid,
    "driverUuid"
  );
  expect(driverData.isInitialized).to.equal(true, "isInitialized");
  expect(driverData.infraAuthority.toString()).to.equal(
    driverDataBefore.infraAuthority.toString(),
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
  expect(driverData.nextLocation).to.equal(
    driverDataBefore.nextLocation,
    "nextLocation"
  );
};

export const assertDriverCompleteJob = async (
  program: anchor.Program<RideNetwork>,
  driverUuid: string,
  customerInfraPda: PublicKey
) => {
  const jobData = await getJobData(program, customerInfraPda, driverUuid);
  // ASSERT TEST
  expect(Object.keys(jobData.account.status)[0]).to.equal(
    "completed",
    "status"
  );
};
