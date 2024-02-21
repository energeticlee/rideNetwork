import * as anchor from "@project-serum/anchor";
import { assert } from "chai";
import { RideNetwork } from "../../target/types/ride_network";
import { getCountryAddress, getGlobalData, getServiceData } from "../utils/pda";
import { PublicKey } from "@solana/web3.js";

export const assertNewService = async (
  program: anchor.Program<RideNetwork>,
  alpha3Code: string,
  serviceCount: anchor.BN,
  name: string,
  initializer: PublicKey
) => {
  const serviceData = await getServiceData(program, serviceCount);
  const countryPda = getCountryAddress(program, alpha3Code);
  // ASSERT TEST
  assert.equal(
    serviceData.countryKey.toString(),
    countryPda.toString(),
    "countryKey"
  );
  assert.equal(serviceData.name, name, "name");
  assert.equal(+serviceData.serviceCount, +serviceCount, "serviceCount");
  assert.equal(serviceData.isValid, false, "isValid");
  assert.equal(serviceData.isInitialized, true, "isInitialized");
  assert.equal(
    serviceData.initializer.toString(),
    initializer.toString(),
    "initializer"
  );
};
