import * as anchor from "@project-serum/anchor";
import { assert } from "chai";
import { RideNetwork } from "../../target/types/ride_network";
import { getGlobalData } from "../utils/pda";

export const AssertGlobal = async (
  program: anchor.Program<RideNetwork>,
  platformFeeBasisPoint: number,
  newVehicleOrPaxFeeCent: anchor.BN,
  mainWallet: anchor.web3.Keypair
) => {
  const globalAccount = await getGlobalData(program);
  // ASSERT TEST
  assert.equal(
    globalAccount.updateAuthority.toString(),
    mainWallet.publicKey.toString()
  );
  assert.equal(
    +globalAccount.platformFeeBasisPoint,
    platformFeeBasisPoint,
    "platformFeeBasisPoint"
  );
  assert.equal(
    +globalAccount.newVehicleOrPaxFeeCent,
    +newVehicleOrPaxFeeCent,
    "newVehicleOrPaxFeeCent"
  );
  assert.equal(
    +globalAccount.passengersTypeCounter,
    0,
    "passengersTypeCounter"
  );
  assert.equal(+globalAccount.vehicleCounter, 0, "vehicleCounter");
};
