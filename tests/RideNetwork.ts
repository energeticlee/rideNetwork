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
  createDriverWithWrongAuth,
  endDriverWork,
  endDriverWorkWrongAuth,
  initDriverInfra,
  initDriverInfraAgain,
  updateDriverInfraBasisPointTest,
  updateDriverInfraBasisPointTestWrongAuth,
  updateDriverInfraCompanyInfo,
  updateDriverInfraCompanyInfoWithWrongAuth,
  updateDriverLocation,
  updateDriverLocationWrongAuth,
} from "./driverTest";
import {
  initCountryState,
  updateCountryState,
  updateCountryStateWithWrongAuth,
  updateNewAuthority,
  updateNewAuthorityWithWrongAuth,
} from "./countryTest";
import { v4 as uuidv4 } from "uuid";
import { envSetup, extractParts } from "./utils/helperFn";
import {
  initRiderInfra,
  initRiderInfraAgain,
  riderRequestRide,
  updateRiderInfraBasisPointTest,
  updateRiderInfraBasisPointTestWrongAuth,
  updateRiderInfraCompanyInfo,
  updateRiderInfraCompanyInfoWithWrongAuth,
} from "./riderTest";

describe("RideNetwork", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.RideNetwork as Program<RideNetwork>;

  const mainWallet1 = Keypair.generate();
  const mainWallet2 = Keypair.generate();
  const driverInfraOwner = Keypair.generate();
  const riderInfraOwner = Keypair.generate();
  const bozo = Keypair.generate();
  let stableMint: PublicKey;
  const allAccounts = {
    mainWallet1,
    mainWallet2,
    driverInfraOwner,
    riderInfraOwner,
    bozo,
    stableMint,
    program,
  };

  it("Setup Testing Env", async () => {
    console.log("Setting up enviroment...");
    await envSetup(program, allAccounts);
    const mint = await createMint(
      program.provider.connection,
      mainWallet1,
      mainWallet1.publicKey,
      mainWallet1.publicKey,
      2
    );
    const driverInfraOwnerStable = await createAssociatedTokenAccount(
      program.provider.connection,
      mainWallet1,
      mint,
      driverInfraOwner.publicKey
    );
    await mintTo(
      program.provider.connection,
      mainWallet1,
      mint,
      driverInfraOwnerStable,
      mainWallet1,
      10_000_00
    );
    const riderInfraOwnerStable = await createAssociatedTokenAccount(
      program.provider.connection,
      mainWallet1,
      mint,
      riderInfraOwner.publicKey
    );
    await mintTo(
      program.provider.connection,
      mainWallet1,
      mint,
      riderInfraOwnerStable,
      mainWallet1,
      10_000_00
    );
    allAccounts.stableMint = mint;
  });

  // ------------------------
  it("Global Test: init", async () => {});
  it("Global Test: init again", async () => {});
  it("Global Test: update basis point", async () => {});
  it("Global Test: update basis point w wrong auth", async () => {});
  it("Global Test: init country", async () => {
    await initCountryState(allAccounts);
  });
  it("Global Test: init again", async () => {});
  // ------------------------

  it("Country Test: changing alpha3 country code", async () => {});
  it("Country Test: update", async () => {
    await updateCountryState(allAccounts);
  });
  it("Country Test: update w wrong auth", async () => {
    await updateCountryStateWithWrongAuth(allAccounts);
  });
  it("Country Test: update new auth", async () => {
    await updateNewAuthority(allAccounts);
  });
  it("Country Test: update new auth w wrong auth", async () => {
    await updateNewAuthorityWithWrongAuth(allAccounts);
  });

  // ------------------------
  // TODO: Add match_ride stats
  // TODO: distribution size > 3 (2x Platform Fees)
  // TODO: Create job type
  // TODO: Add EPOCH duration
  // TODO: Settlement logic, Slashing amount
  // TODO: Settlement logic, DAO voting (Infra NFT)

  // TODO: Test Upgrade, create assert function to test entire state

  it("Driver Infra Test: init", async () => {
    await initDriverInfra(allAccounts);
  });
  it("Driver Infra Test: init again", async () => {
    await initDriverInfraAgain(allAccounts);
  });
  it("Country Test: Verify driver infra", async () => {
    // approve_driver_infra
    // await approveDriverInfra()
  });
  it("Country Test: Verify driver infra w wrong auth", async () => {});
  it("Country Test: Freeze driver infra", async () => {});
  it("Country Test: Freeze driver infra w wrong auth", async () => {});
  it("Country Test: unfreeze driver infra", async () => {});
  it("Country Test: unfreeze driver infra w wrong auth", async () => {});
  it("Driver Infra Test: update company info", async () => {
    await updateDriverInfraCompanyInfo(allAccounts);
  });
  it("Driver Infra Test: update company info with wrong update auth", async () => {
    await updateDriverInfraCompanyInfoWithWrongAuth(allAccounts);
  });
  it("Driver Infra Test: update driver infra basis point", async () => {
    await updateDriverInfraBasisPointTest(allAccounts);
  });
  it("Driver Infra Test: update driver infra basis point with wrong auth", async () => {
    await updateDriverInfraBasisPointTestWrongAuth(allAccounts);
  });
  const spare1Uuid = uuidv4();
  const shortenSpareUuid = extractParts(spare1Uuid);
  it("Driver Test: Start work with wrong auth", async () => {
    // Require UUID Generation
    await createDriverWithWrongAuth(shortenD1Uuid, allAccounts);
  });
  const d1Uuid = uuidv4();
  const shortenD1Uuid = extractParts(d1Uuid);
  it("Driver Test: Start Work", async () => {
    // Require UUID Generation
    await createDriver(shortenD1Uuid, allAccounts);
  });
  it("Driver Test: Update driver location", async () => {
    await updateDriverLocation(shortenD1Uuid, allAccounts);
  });
  it("Driver Test: Update driver location w wrong auth", async () => {
    await updateDriverLocationWrongAuth(shortenD1Uuid, allAccounts);
  });
  it("Driver Test: End Work w wrong auth", async () => {
    await endDriverWorkWrongAuth(shortenD1Uuid, allAccounts);
  });
  it("Driver Test: End Work", async () => {
    await endDriverWork(shortenD1Uuid, allAccounts);
  });

  // ------------------------

  it("Rider Infra Test: init", async () => {
    await initRiderInfra(allAccounts);
  });
  it("Rider Infra Test: init again", async () => {
    await initRiderInfraAgain(allAccounts);
  });
  it("Country Test: Verify rider infra", async () => {});
  it("Country Test: Verify rider infra w wrong auth", async () => {});
  it("Country Test: Freeze rider infra", async () => {});
  it("Country Test: Freeze rider infra w wrong auth", async () => {});
  it("Country Test: unfreeze rider infra", async () => {});
  it("Country Test: unfreeze rider infra w wrong auth", async () => {});
  it("Rider Infra Test: update company info", async () => {
    await updateRiderInfraCompanyInfo(allAccounts);
  });
  it("Rider Infra Test: update company info with wrong update auth", async () => {
    await updateRiderInfraCompanyInfoWithWrongAuth(allAccounts);
  });
  it("Rider Infra Test: update rider infra basis point", async () => {
    await updateRiderInfraBasisPointTest(allAccounts);
  });
  it("Driver Test: update driver infra basis point with wrong auth", async () => {
    await updateRiderInfraBasisPointTestWrongAuth(allAccounts);
  });
  it("Rider Test: Request Ride", async () => {
    // Require Require SHA256 Encryption
    await createDriver(shortenD1Uuid, allAccounts);
    await riderRequestRide(allAccounts);
  });
  it("Driver Test: Driver accept request", async () => {});
  it("Driver Test: Another driver accept request", async () => {});
  it("Rider Test: Cancel call before driver accept", async () => {});
  it("Rider Test: Cancel call after driver accept", async () => {});
  it("Rider Test: Cancel call after driver accept, with fees", async () => {});
  it("Driver Test: Cancel call before accepting", async () => {});
  it("Driver Test: Cancel call after accepting", async () => {});
  it("Driver Test: Cancel call after accepting, with fees", async () => {});
  it("Driver Test: Reach location", async () => {});
  it("Driver Test: Reach location w wrong auth", async () => {});
  it("Driver Test: Pickup rider", async () => {});
  it("Driver Test: Pickup rider after waiting time", async () => {});
  it("Driver Test: Complete job", async () => {});
  it("Driver Test: Complete job w wrong auth", async () => {});
  it("Driver Test: Raise issue", async () => {});
  it("Driver Test: Raise issue w wrong auth", async () => {});
  it("Rider Test: Raise issue", async () => {});
  it("Rider Test: Raise issue w wrong auth", async () => {});
  it("Driver Infra Test: Process payout before finalize", async () => {});
  it("Driver Infra Test: Process payout before finalize w wrong auth", async () => {});
  it("Driver Infra Test: Process payout after finalize", async () => {});
  it("Driver Infra Test: Process payout after finalize w wrong auth", async () => {});
  it("Driver Test: Receive next ride request while on job", async () => {});
  it("Driver Test: Accept next ride request while on job", async () => {});

  // TODO: Multiple drop-off location
});
