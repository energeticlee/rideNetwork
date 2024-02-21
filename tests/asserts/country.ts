import * as anchor from "@project-serum/anchor";
import { assert } from "chai";
import { RideNetwork } from "../../target/types/ride_network";
import { getCountryData } from "../utils/pda";
import { IInitOrUpdateCountryAssert } from "../utils/types";

export const initOrUpdateCountryAssert = async (
  program: anchor.Program<RideNetwork>,
  params: IInitOrUpdateCountryAssert,
  alpha3CountryCode: string,
  mainWallet: anchor.web3.Keypair
) => {
  const countryAccount = await getCountryData(program, "SGP");
  // ASSERT TEST
  assert.equal(
    countryAccount.alpha3CountryCode,
    alpha3CountryCode,
    "alpha3CountryCode"
  );
  assert.equal(
    countryAccount.updateAuthority.toString(),
    mainWallet.publicKey.toString()
  );
  assert.equal(
    +countryAccount.waitingFeeSec,
    +params.waitingFeeSec,
    "waitingFeeSec"
  );
  assert.equal(
    +countryAccount.waitingFeeCent,
    +params.waitingFeeCent,
    "waitingFeeCent"
  );
  assert.equal(
    +countryAccount.driverCancellationFeeSec,
    +params.driverCancellationFeeSec,
    "driverCancellationFeeSec"
  );
  assert.equal(
    +countryAccount.customerCancellationFeeSec,
    +params.customerCancellationFeeSec,
    "customerCancellationFeeSec"
  );
  assert.equal(
    +countryAccount.baseRateCent,
    +params.baseRateCent,
    "baseRateCent"
  );
  assert.equal(
    +countryAccount.minKmRateCent,
    +params.minKmRateCent,
    "minKmRateCent"
  );
  assert.equal(
    +countryAccount.minMinFeeCent,
    +params.minMinFeeCent,
    "minMinFeeCent"
  );
  assert.equal(
    +countryAccount.finalizeDurationSec,
    +params.finalizeDurationSec,
    "finalizeDurationSec"
  );
  assert.equal(
    +countryAccount.minDriverInfraDeposit,
    +params.minDriverInfraDeposit,
    "minDriverInfraDeposit"
  );
  assert.equal(
    +countryAccount.minCustomerInfraDeposit,
    +params.minCustomerInfraDeposit,
    "minCustomerInfraDeposit"
  );
  assert.equal(
    +countryAccount.baseSlashAmount,
    +params.baseSlashAmount,
    "baseSlashAmount"
  );
  assert.equal(countryAccount.isInitialized, true);
};
