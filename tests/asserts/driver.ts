import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { expect } from "chai";
import { RideNetwork } from "../../target/types/ride_network";
import {} from "../utils/helperFn";
import {
  getCompanyData,
  getDriverData,
  getDriverInfraAddress,
  getDriverInfraData,
} from "../utils/pda";
import { IInitDriverInfraAssert, IUpdateInfraAssert } from "../utils/types";

export const initDriverInfraAssert = async (
  program: anchor.Program<RideNetwork>,
  params: IInitDriverInfraAssert,
  driverInfraOwner: PublicKey
) => {
  const driverInfraData = await getDriverInfraData(program, driverInfraOwner);
  const driverInfraAddress = getDriverInfraAddress(program, driverInfraOwner);
  const companyData = await getCompanyData(
    program,
    driverInfraData.companyInfoCurrentCount,
    driverInfraAddress
  );
  // ASSERT TEST
  expect(driverInfraData.updateAuthority.toString()).to.equal(
    driverInfraOwner.toString()
  );
  expect(+driverInfraData.driverInfraCount).to.equal(
    +params.driverInfraCount,
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
  expect(companyData.uen).to.equal(params.uen, "uen");
  expect(companyData.website).to.equal(params.website, "website");
};

export const updateDriverInfraCompanyAssert = async (
  program: anchor.Program<RideNetwork>,
  params: IUpdateInfraAssert,
  driverInfraOwner: PublicKey
) => {
  const driverInfraData = await getDriverInfraData(program, driverInfraOwner);
  const driverInfraAddress = getDriverInfraAddress(program, driverInfraOwner);
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

export const updateDriverLocationAssert = async (
  program: anchor.Program<RideNetwork>,
  uuid: string,
  currentLocation: { lat: number; long: number },
  driverDataBefore: any
) => {
  const driverData = await getDriverData(program, uuid);
  // ASSERT TEST
  expect(driverData.uuid).to.equal(driverDataBefore.uuid, "uuid");
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
  expect(Object.keys(driverData.jobType)[0]).to.equal(
    Object.keys(driverDataBefore.jobType)[0],
    "nextLocation"
  );
};
