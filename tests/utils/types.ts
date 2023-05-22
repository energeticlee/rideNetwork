import * as anchor from "@project-serum/anchor";
import { RideNetwork } from "../../target/types/ride_network";

export interface IAllAccounts {
  mainWallet1: anchor.web3.Keypair;
  mainWallet2: anchor.web3.Keypair;
  driverInfraOwner: anchor.web3.Keypair;
  riderInfraOwner: anchor.web3.Keypair;
  bozo: anchor.web3.Keypair;
  stableMint: anchor.web3.PublicKey;
  program: anchor.Program<RideNetwork>;
}

export interface IInitOrUpdateCountryAssert {
  platformFeeBasisPoint: number;
  waitingFeeSec: anchor.BN;
  waitingFeeCent: anchor.BN;
  driverCancellationFeeSec: anchor.BN;
  riderCancellationFeeSec: anchor.BN;
  cancellationFeeCent: anchor.BN;
  baseRateCent: anchor.BN;
  minKmRateCent: anchor.BN;
  minMinFeeCent: anchor.BN;
  finalizeDurationSec: anchor.BN;
  minDriverInfraDeposit: anchor.BN;
  minRiderInfraDeposit: anchor.BN;
  baseSlashAmount: anchor.BN;
}

export interface IInitDriverInfraAssert {
  driverInfraCount: anchor.BN;
  companyName: String;
  uen: String;
  website: String;
  driverInfraFeeBasisPoint: number;
}
export interface IUpdateInfraAssert {
  companyName: String;
  uen: String;
  website: String;
  infraCount: anchor.BN;
  oldCompanyInfoCount: anchor.BN;
}
export interface IInitRiderInfraAssert {
  riderInfraCount: anchor.BN;
  companyName: String;
  uen: String;
  website: String;
  riderInfraFeeBasisPoint: number;
}

export enum JobType {
  Ride4Seater,
  RideWithPets,
  Ride4SeaterWithKids,
  Ride6Seater,
  PremiumSeater,
}

export enum Status {
  Init,
  JobAccepted,
  Arrived,
  Started,
  Completed,
  CancelledByDriver,
  CancelledByRider,
  DisputeByDriver,
  DisputeByRider,
}
