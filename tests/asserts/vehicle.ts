import * as anchor from "@project-serum/anchor";
import { assert } from "chai";
import { RideNetwork } from "../../target/types/ride_network";
import { getVehicleData } from "../utils/pda";
import { PublicKey } from "@solana/web3.js";

export const assertNewVehicle = async (
  program: anchor.Program<RideNetwork>,
  vehicleCount: anchor.BN,
  brand: string,
  model: string,
  numberOfSeats: number,
  initializer: PublicKey
) => {
  const vehicleData = await getVehicleData(program, vehicleCount);
  // ASSERT TEST
  assert.equal(vehicleData.brand, brand);
  assert.equal(vehicleData.model, model, "model");
  assert.equal(vehicleData.numberOfSeats, numberOfSeats, "numberOfSeats");
  assert.equal(vehicleData.isValid, false, "isValid");
  assert.equal(
    vehicleData.initializer.toString(),
    initializer.toString(),
    "initializer"
  );
};
