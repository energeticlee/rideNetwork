import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import {
  createAssociatedTokenAccount,
  createMint,
  mintTo,
} from "@solana/spl-token";
import { Keypair, PublicKey } from "@solana/web3.js";
import { RideNetwork } from "../target/types/ride_network";
import {
  createDriver,
  driverCancelJob,
  driverCompleteJob,
  driverCompleteJobAfterFinialize,
  initDriverInfra,
  updateDriverInfraBasisPointTest,
  updateDriverInfraBasisPointTestWrongAuth,
  updateDriverInfraCompanyInfo,
  updateDriverInfraCompanyInfoWithWrongAuth,
  updateDriverLocation,
} from "./testMod/driverTest";
import {
  approveCustomerInfra,
  approveDriverInfra,
  initCountryState,
  updateCountryState,
  updateNewAuthority,
} from "./testMod/countryTest";
import { v4 as uuidv4 } from "uuid";

const program = anchor.workspace.RideNetwork as Program<RideNetwork>;

const mainWallet1 = Keypair.generate();
const mainWallet2 = Keypair.generate();
const driverInfraOwner = Keypair.generate();
const customerInfraOwner = Keypair.generate();
const bozo = Keypair.generate();
let stableMint: PublicKey;
const allAccounts = {
  mainWallet1,
  mainWallet2,
  driverInfraOwner,
  customerInfraOwner,
  bozo,
  stableMint,
  program,
};

describe("Infra Initialization Test", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  it("Setup Testing Env", async () => {
    await envSetup(program, allAccounts);
  });

  // ------------------------
  it("Init Global State", async () => {
    await initGlobalState(allAccounts);
  });
  it("Update Global State Basis Point", async () => {
    await updateGlobalStateBasisPoint(allAccounts);
  });
  it("Update Global State Fees", async () => {
    await updateGlobalStateFees(allAccounts);
  });
  it("Update Global Authority", async () => {
    await updateGlobalStateAuthority(allAccounts);
  });
  it("Init Country State", async () => {
    await initCountryState(allAccounts);
  });
  it("Update Country State Basis Point", async () => {
    await updateCountryState(allAccounts);
  });
  it("Update Country Authority", async () => {
    await updateNewAuthority(allAccounts);
  });
  it("Driver Infra Test: init", async () => {
    await initDriverInfra(allAccounts);
  });
  it("Country Test: Verify driver infra", async () => {
    await approveDriverInfra(allAccounts);
  });
  it("Customer Infra Test: init", async () => {
    await initCustomerInfra(allAccounts);
  });
  it("Country Test: Verify customer infra", async () => {
    await approveCustomerInfra(allAccounts);
  });
  it("Service Test: Init a new service", async () => {
    await addService(allAccounts);
  });
  it("Passenger Test: Init a new passenger", async () => {
    await addPassengerType(allAccounts);
  });
  it("Vehicle Test: Init a new vehicle", async () => {
    await addVehicle(allAccounts);
  });

  // TODO
  // it("Country Test: Freeze driver infra", async () => {});
  // it("Country Test: unfreeze driver infra", async () => {});
  // it("Country Test: Freeze rider infra", async () => {});
  // it("Country Test: unfreeze rider infra", async () => {});
});

describe("Infra Initialization Fail Test", () => {
  // PROCESS FAIL CHECK
  it("Fail test: init global again, should fail", async () => {
    await initGlobalState(allAccounts, true);
  });
  it("Fail test: init country again, should fail", async () => {
    await initCountryState(allAccounts, true);
  });
  it("Fail test: update country w wrong auth", async () => {
    await updateCountryState(allAccounts, true);
  });
  it("Fail test: update country auth w wrong auth", async () => {
    await updateNewAuthority(allAccounts, true);
  });
  it("Fail test: init driver infra again", async () => {
    const driverInfraId = await getDriverInfraDataByUpdateAuthority(
      program,
      driverInfraOwner.publicKey
    );
    await initDriverInfra(
      allAccounts,
      driverInfraId.account.driverInfraCount,
      false
    );
  });
  it("Fail test: init customer infra again", async () => {
    const customerInfraId = await getCustomerInfraDataByUpdateAuthority(
      program,
      customerInfraOwner.publicKey
    );
    await initCustomerInfra(
      allAccounts,
      customerInfraId.account.customerInfraCount,
      false
    );
  });
  it("Fail test: Verify driver infra w wrong auth", async () => {
    await approveDriverInfra(allAccounts, false);
  });
  it("Fail test: Verify customer infra w wrong auth", async () => {
    await approveCustomerInfra(allAccounts, false);
  });

  // TODO
  // it("Country Test: Freeze driver infra w wrong auth", async () => {});
  // it("Country Test: unfreeze driver infra w wrong auth", async () => {});
  // it("Country Test: Freeze rider infra w wrong auth", async () => {});
  // it("Country Test: unfreeze rider infra w wrong auth", async () => {});
});

describe("Best Case: No dispute", () => {
  const d1Uuid = uuidv4();
  const shortenD1Uuid = extractParts(d1Uuid);
  const { publicKeyPem, privateKeyPem } = generateRsaKeypair();

  it("Driver Test: Start Work", async () => {
    // Require UUID Generation
    await createDriver(allAccounts, shortenD1Uuid, publicKeyPem);
  });

  it("Driver Test: Update driver location", async () => {
    await updateDriverLocation(allAccounts, shortenD1Uuid);
  });

  it("Customer Test: Request Ride", async () => {
    const customerData = {
      endpoint: "https://helloWorldThisIsATestWebsite.com.sg/request-rider/XX", // 60
      apiUuidV4: "753d36f5-a272-4129-8eecXX", // 25
    };

    const encryptedData = customerEncryption(publicKeyPem, customerData);
    await customerRequestRide(allAccounts, encryptedData);
  });
  it("Driver Test: Driver accept request", async () => {
    // Get data from on-chain
    const { encryptedData, encryptedCombinedRandBase64 } =
      await getJobDataWithUuid(program, shortenD1Uuid);
    // Decrypt data
    const decompressedData = driverDecryption(
      { encryptedData, encryptedCombinedRandBase64 },
      privateKeyPem
    );
    //! DRIVER INFRA WILL SEND HTTPS REQUEST TO ACCEPT JOB, CUSTOMER WILL ACCEPT AND UPDATE JOB STATUS
    await driverAcceptedJob(
      allAccounts,
      allAccounts.driverInfraOwner.publicKey,
      shortenD1Uuid
    );

    //! CUSTOMER INFRA WILL REJECT ALL OTHER REQUEST BY UPDATING OTHER JOB
    //! OR DRIVER INFRA CAN SET JOB TO ALREADY ACCEPTED
    // Customer respond to accept request
  });
  it("Driver Test: Arrive at location", async () => {
    //! Both infra communicate according to protocol
    // NO NEED TO BE ON-CHAIN
  });
  it("Driver Test: Pickup rider", async () => {
    //! Both infra communicate according to protocol
    // NO NEED TO BE ON-CHAIN
  });
  it("Driver Test: Complete job", async () => {
    await driverCompleteJob(allAccounts, shortenD1Uuid);
  });
  it("Driver Infra Test: Process payout after finalize", async () => {
    console.log("Waiting for timeout...");
    await delayScript(2000);
    await driverCompleteJobAfterFinialize(allAccounts, shortenD1Uuid);
  });
});

// SUCESS CASE COMPLETE

describe("Disruption Case: Driver reject call", () => {
  const d1Uuid = uuidv4();
  const shortenD1Uuid = extractParts(d1Uuid);
  const { publicKeyPem, privateKeyPem } = generateRsaKeypair();

  it("Driver Test: Start Work", async () => {
    // Require UUID Generation
    await createDriver(allAccounts, shortenD1Uuid, publicKeyPem);
  });

  it("Driver Test: Update driver location", async () => {
    await updateDriverLocation(allAccounts, shortenD1Uuid);
  });

  it("Customer Test: Request Ride", async () => {
    const customerData = {
      endpoint: "https://helloWorldThisIsATestWebsite.com.sg/request-rider/XX", // 60
      apiUuidV4: "753d36f5-a272-4129-8eecXX", // 25
    };

    const encryptedData = customerEncryption(publicKeyPem, customerData);
    await customerRequestRide(allAccounts, encryptedData);
  });

  it("Driver reject request", async () => {
    // Get data from on-chain
    //! DRIVER INFRA WILL SEND HTTPS REQUEST TO JOB INFO, RETURN REJECT STATUS TO CUSTOMER INFRA
    await driverCancelJob(allAccounts, shortenD1Uuid);
    // Customer respond to accept request
  });
});

describe("Disruption Case: Customer cancel call before driver can accept, before cancel limit", () => {
  const d1Uuid = uuidv4();
  const shortenD1Uuid = extractParts(d1Uuid);
  const { publicKeyPem, privateKeyPem } = generateRsaKeypair();

  it("Driver Test: Start Work", async () => {
    // Require UUID Generation
    await createDriver(allAccounts, shortenD1Uuid, publicKeyPem);
  });

  it("Driver Test: Update driver location", async () => {
    await updateDriverLocation(allAccounts, shortenD1Uuid);
  });

  it("Customer Test: Request Ride", async () => {
    const customerData = {
      endpoint: "https://helloWorldThisIsATestWebsite.com.sg/request-rider/XX", // 60
      apiUuidV4: "753d36f5-a272-4129-8eecXX", // 25
    };

    const encryptedData = customerEncryption(publicKeyPem, customerData);
    await customerRequestRide(allAccounts, encryptedData);
  });

  it("Customer cancel call before driver accept", async () => {
    // Customer cancel call
    await customerCancelJob(allAccounts, shortenD1Uuid);
  });
  it("Driver accept cancelled test, customer return 404 and cancel job", async () => {
    //! DRIVER INFRA WILL SEND HTTPS REQUEST TO ACCEPT JOB, CUSTOMER WILL REJECT AND UPDATE JOB STATUS
    // ------------------------
    // Customer initialize 2 jobs, driver 1 accept call
    // Driver 2 accept call, should fail
    // ------------------------
  });
});

// TODO: Check if fee was deducted
describe("Disruption Case: Customer cancel call after cancel limit", () => {});

// TODO: Check if fee was deducted
describe("Disruption Case: Driver cancel call after accepting, but before cancel limit", () => {
  const d1Uuid = uuidv4();
  const shortenD1Uuid = extractParts(d1Uuid);
  const { publicKeyPem, privateKeyPem } = generateRsaKeypair();

  it("Driver Test: Start Work", async () => {
    // Require UUID Generation
    await createDriver(allAccounts, shortenD1Uuid, publicKeyPem);
  });

  it("Driver Test: Update driver location", async () => {
    await updateDriverLocation(allAccounts, shortenD1Uuid);
  });

  it("Customer Test: Request Ride", async () => {
    const customerData = {
      endpoint: "https://helloWorldThisIsATestWebsite.com.sg/request-rider/XX", // 60
      apiUuidV4: "753d36f5-a272-4129-8eecXX", // 25
    };

    const encryptedData = customerEncryption(publicKeyPem, customerData);
    await customerRequestRide(allAccounts, encryptedData);
  });

  it("Driver accept request", async () => {
    // Get data from on-chain
    const { encryptedData, encryptedCombinedRandBase64 } =
      await getJobDataWithUuid(program, shortenD1Uuid);
    // Decrypt data
    const decompressedData = driverDecryption(
      { encryptedData, encryptedCombinedRandBase64 },
      privateKeyPem
    );
    //! DRIVER INFRA WILL SEND HTTPS REQUEST TO ACCEPT JOB, CUSTOMER WILL ACCEPT AND UPDATE JOB STATUS
    await driverAcceptedJob(
      allAccounts,
      allAccounts.driverInfraOwner.publicKey,
      shortenD1Uuid
    );
  });
  it("Driver cancel request after accepting", async () => {
    await driverCancelJob(allAccounts, shortenD1Uuid);
  });
});
describe("Disruption Case: Driver cancel call after cancel limit", () => {});
describe("Disruption Case: Driver arrive at pickup point, customer late", () => {});
describe("Disruption Case: Driver arrive at destination, customer raise dispute", () => {});
describe("Disruption Case: Driver arrive at destination, driver raise dispute", () => {});
// ------------------------
// Driver receive 2 jobs, accept 1st call
// Should reject 2nd call
// ------------------------
// TODO: distribution size > 3 (2x Platform Fees)
// TODO: Settlement logic, Slashing amount
// TODO: Settlement logic, DAO voting (Infra NFT)
// TODO: Test Upgrade, create assert function to test entire state

// TODO: Upgrade: EPOCH duration for DAO proposal

// it("Driver Infra Test: update company info", async () => {
//   await updateDriverInfraCompanyInfo(allAccounts);
// });
// it("Driver Infra Test: update company info with wrong update auth", async () => {
//   await updateDriverInfraCompanyInfoWithWrongAuth(allAccounts);
// });
// it("Driver Infra Test: update driver infra basis point", async () => {
//   await updateDriverInfraBasisPointTest(allAccounts);
// });
// it("Driver Infra Test: update driver infra basis point with wrong auth", async () => {
//   await updateDriverInfraBasisPointTestWrongAuth(allAccounts);
// });
// const spare1Uuid = uuidv4();
// const shortenSpareUuid = extractParts(spare1Uuid);
// it("Driver Test: Start work with wrong auth", async () => {
//   // Require UUID Generation
//   await createDriverWithWrongAuth(shortenD1Uuid, allAccounts);
// });

// it("Driver Test: Start Work", async () => {
//   // Require UUID Generation
//   await createDriver(shortenD1Uuid, allAccounts);
// });
// it("Driver Test: Update driver location", async () => {
//   await updateDriverLocation(shortenD1Uuid, allAccounts);
// });
// it("Driver Test: Update driver location w wrong auth", async () => {
//   await updateDriverLocationWrongAuth(shortenD1Uuid, allAccounts);
// });
// it("Driver Test: End Work w wrong auth", async () => {
//   await endDriverWorkWrongAuth(shortenD1Uuid, allAccounts);
// });
// it("Driver Test: End Work", async () => {
//   await endDriverWork(shortenD1Uuid, allAccounts);
// });

// // ------------------------

// it("Customer Infra Test: init again", async () => {
//   await initCustomerAgain(allAccounts);
// });
// it("Country Test: Verify rider infra", async () => {});
// it("Country Test: Verify rider infra w wrong auth", async () => {});

// it("Customer Infra Test: update company info", async () => {
//   await updateRiderInfraCompanyInfo(allAccounts);
// });
// it("Customer Infra Test: update company info with wrong update auth", async () => {
//   await updateRiderInfraCompanyInfoWithWrongAuth(allAccounts);
// });
// it("Customer Infra Test: update rider infra basis point", async () => {
//   await updateRiderInfraBasisPointTest(allAccounts);
// });
// it("Driver Test: update driver infra basis point with wrong auth", async () => {
//   await updateRiderInfraBasisPointTestWrongAuth(allAccounts);
// });
// it("Customer Test: Request Ride", async () => {
//   // Require Require SHA256 Encryption
//   await createDriver(shortenD1Uuid, allAccounts);
//   await customerRequestRide(allAccounts);
// });
// it("Driver Test: Driver accept request", async () => {});
// it("Driver Test: Another driver accept request", async () => {});
// it("Customer Test: Cancel call after driver accept", async () => {});
// it("Customer Test: Cancel call after driver accept, with fees", async () => {});
// it("Driver Test: Cancel call before accepting", async () => {});
// it("Driver Test: Cancel call after accepting", async () => {});
// it("Driver Test: Cancel call after accepting, with fees", async () => {});
// it("Driver Test: Reach location", async () => {});
// it("Driver Test: Reach location w wrong auth", async () => {});
// it("Driver Test: Pickup rider", async () => {});
// it("Driver Test: Pickup rider after waiting time", async () => {});
// it("Driver Test: Complete job", async () => {});
// it("Driver Test: Complete job w wrong auth", async () => {});
// it("Driver Test: Raise issue", async () => {});
// it("Driver Test: Raise issue w wrong auth", async () => {});
// it("Customer Test: Raise issue", async () => {});
// it("Customer Test: Raise issue w wrong auth", async () => {});
// it("Driver Infra Test: Process payout before finalize", async () => {});
// it("Driver Infra Test: Process payout before finalize w wrong auth", async () => {});
// it("Driver Infra Test: Process payout after finalize", async () => {});
// it("Driver Infra Test: Process payout after finalize w wrong auth", async () => {});
// it("Driver Test: Receive next ride request while on job", async () => {});
// it("Driver Test: Accept next ride request while on job", async () => {});

// TODO: Multiple drop-off location
