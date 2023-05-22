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
  getRiderInfraAddress,
  getRiderInfraData,
} from "../utils/pda";
import {
  IAllAccounts,
  IInitDriverInfraAssert,
  IInitRiderInfraAssert,
  IUpdateInfraAssert,
} from "../utils/types";

export const initRiderInfraAssert = async (
  program: anchor.Program<RideNetwork>,
  params: IInitRiderInfraAssert,
  riderInfraOwner: PublicKey
) => {
  const riderInfraData = await getRiderInfraData(program, riderInfraOwner);
  const riderInfraAddress = getRiderInfraAddress(program, riderInfraOwner);
  const companyData = await getCompanyData(
    program,
    riderInfraData.companyInfoCurrentCount,
    riderInfraAddress
  );
  // ASSERT TEST
  expect(riderInfraData.updateAuthority.toString()).to.equal(
    riderInfraOwner.toString(),
    "updateAuthority"
  );
  expect(+riderInfraData.riderInfraCount).to.equal(
    +params.riderInfraCount,
    "riderInfraCount"
  );
  expect(riderInfraData.isInitialized).to.equal(true, "isInitialized");
  expect(riderInfraData.isVerified).to.equal(false, "isVerified");
  expect(riderInfraData.isFrozen).to.equal(false, "isFrozen");
  expect(riderInfraData.riderInfraFeeBasisPoint).to.equal(
    params.riderInfraFeeBasisPoint,
    "riderInfraFeeBasisPoint"
  );
  expect(companyData.companyName).to.equal(params.companyName, "companyName");
  expect(companyData.uen).to.equal(params.uen, "uen");
  expect(companyData.website).to.equal(params.website, "website");
};

export const updateDriverInfraCompanyAssert = async (
  program: anchor.Program<RideNetwork>,
  params: IUpdateInfraAssert,
  riderInfraOwner: PublicKey
) => {
  const riderInfraData = await getRiderInfraData(program, riderInfraOwner);
  const riderInfraAddress = getRiderInfraAddress(program, riderInfraOwner);
  const companyData = await getCompanyData(
    program,
    riderInfraData.companyInfoCurrentCount,
    riderInfraAddress
  );
  // ASSERT TEST
  expect(riderInfraData.isFrozen).to.equal(true, "isFrozen");
  expect(+riderInfraData.companyInfoCurrentCount).to.equal(
    1,
    "companyInfoCurrentCount"
  );
  expect(companyData.companyName).to.equal(params.companyName, "companyName");
  expect(companyData.uen).to.equal(params.uen, "uen");
  expect(companyData.website).to.equal(params.website, "website");
};

export const createDriverAssert = async (
  program: anchor.Program<RideNetwork>,
  uuid: string,
  driverInfra: PublicKey,
  currentLocation: { lat: number; long: number },
  jobType: string
) => {
  const driverData = await getDriverData(program, uuid);
  // ASSERT TEST
  expect(driverData.uuid).to.equal(uuid, "uuid");
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
  expect(Object.keys(driverData.jobType)[0]).to.equal(jobType, "nextLocation");
};

export const updateRiderInfraCompanyAssert = async (
  program: anchor.Program<RideNetwork>,
  params: IUpdateInfraAssert,
  riderInfraOwner: PublicKey
) => {
  const riderInfraData = await getRiderInfraData(program, riderInfraOwner);
  const riderInfraAddress = getRiderInfraAddress(program, riderInfraOwner);
  const companyData = await getCompanyData(
    program,
    riderInfraData.companyInfoCurrentCount,
    riderInfraAddress
  );
  // ASSERT TEST
  expect(riderInfraData.isFrozen).to.equal(true, "isFrozen");
  expect(+riderInfraData.companyInfoCurrentCount).to.equal(
    1,
    "companyInfoCurrentCount"
  );
  expect(companyData.companyName).to.equal(params.companyName, "companyName");
  expect(companyData.uen).to.equal(params.uen, "uen");
  expect(companyData.website).to.equal(params.website, "website");
};

export const riderRequestRideAssert = async (
  program: anchor.Program<RideNetwork>,
  driverUuid: string,
  jobCount: anchor.BN,
  distributionLen: number,
  encryptedData: string,
  calculatedFees: anchor.BN,
  allAccounts: IAllAccounts
) => {
  const { riderInfraOwner, driverInfraOwner } = allAccounts;
  const jobData = await getJobData(program, driverUuid);
  const riderInfraAddress = getRiderInfraAddress(
    program,
    riderInfraOwner.publicKey
  );
  const driverInfraAddress = getDriverInfraAddress(
    program,
    driverInfraOwner.publicKey
  );

  // ASSERT TEST
  expect(jobData.driverUuid).to.equal(driverUuid, "uuid");
  expect(jobData.riderInfra.toString()).to.equal(
    riderInfraAddress.toString(),
    "riderInfra"
  );
  expect(jobData.driverInfra.toString()).to.equal(
    driverInfraAddress.toString(),
    "driverInfra"
  );
  expect(+jobData.totalFeeCent).to.equal(+calculatedFees, "ride fare");
  expect(jobData.isInitialized).to.equal(true, "isInitialized");
  expect(jobData.data).to.equal(encryptedData, "website");
};
