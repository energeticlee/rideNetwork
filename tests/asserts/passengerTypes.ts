import * as anchor from "@project-serum/anchor";
import { assert } from "chai";
import { RideNetwork } from "../../target/types/ride_network";
import {
  getCountryAddress,
  getGlobalData,
  getPassengerTypeData,
} from "../utils/pda";
import { PublicKey } from "@solana/web3.js";

export const assertNewPassengerType = async (
  program: anchor.Program<RideNetwork>,
  passengerTypeCount: anchor.BN,
  name: string,
  initializer: PublicKey
) => {
  const globalData = await getGlobalData(program);
  const passengerTypeData = await getPassengerTypeData(
    program,
    passengerTypeCount
  );
  // ASSERT TEST

  assert.equal(
    +globalData.passengersTypeCounter,
    +passengerTypeCount,
    "passengerTypeCount"
  );
  assert.equal(passengerTypeData.name, name, "name");
  assert.equal(passengerTypeData.isValid, false, "isValid");
  assert.equal(passengerTypeData.isInitialized, true, "isInitialized");
  assert.equal(
    passengerTypeData.initializer.toString(),
    initializer.toString(),
    "initializer"
  );
};
