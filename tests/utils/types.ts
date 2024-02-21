import * as anchor from "@project-serum/anchor";
import { RideNetwork } from "../../target/types/ride_network";

export interface IAllAccounts {
  mainWallet1: anchor.web3.Keypair;
  mainWallet2: anchor.web3.Keypair;
  driverInfraOwner: anchor.web3.Keypair;
  customerInfraOwner: anchor.web3.Keypair;
  bozo: anchor.web3.Keypair;
  stableMint: anchor.web3.PublicKey;
  program: anchor.Program<RideNetwork>;
}

export interface IInitOrUpdateCountryAssert {
  platformFeeBasisPoint: number;
  waitingFeeSec: anchor.BN;
  waitingFeeCent: anchor.BN;
  driverCancellationFeeSec: anchor.BN;
  customerCancellationFeeSec: anchor.BN;
  cancellationFeeCent: anchor.BN;
  baseRateCent: anchor.BN;
  minKmRateCent: anchor.BN;
  minMinFeeCent: anchor.BN;
  finalizeDurationSec: anchor.BN;
  minDriverInfraDeposit: anchor.BN;
  minCustomerInfraDeposit: anchor.BN;
  disputeWaitoutPeriod: anchor.BN;
  baseSlashAmount: anchor.BN;
}

export interface IInitDriverInfraAssert {
  driverInfraCount: anchor.BN;
  companyName: String;
  entityRegistryId: String;
  website: String;
  driverInfraFeeBasisPoint: number;
}
export interface IUpdateInfraAssert {
  companyName: String;
  entityRegistryId: String;
  website: String;
  infraCount: anchor.BN;
  oldCompanyInfoCount: anchor.BN;
}
export interface IInitCustomerInfraAssert {
  customerInfraCount: anchor.BN;
  companyName: String;
  entityRegistryId: String;
  website: String;
  customerInfraFeeBasisPoint: number;
}

export enum OfferedService {
  rideHailing,
  parcelDelivery,
}

export enum Status {
  Init,
  JobAccepted,
  Arrived,
  Started,
  Completed,
  CancelledByDriver,
  CancelledByCustomer,
  DisputeByDriver,
  DisputeByCustomer,
}

export interface CustomerData {
  endpoint: string;
  apiUuidV4: string;
}

export interface EncryptedData {
  encryptedData: string;
  encryptedCombinedRandBase64: string;
}
