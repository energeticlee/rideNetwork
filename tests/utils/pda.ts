import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { RideNetwork } from "../../target/types/ride_network";

export const getCountryAddress = (program: Program<RideNetwork>) => {
  const [countryAddress, _countryAddressBump] =
    PublicKey.findProgramAddressSync(
      [Buffer.from(anchor.utils.bytes.utf8.encode("country"))],
      program.programId
    );
  return countryAddress;
};

export const getCountryData = async (program: Program<RideNetwork>) => {
  const [countryAddress, _countryAddressBump] =
    PublicKey.findProgramAddressSync(
      [Buffer.from(anchor.utils.bytes.utf8.encode("country"))],
      program.programId
    );

  const data = await program.account.country.fetch(countryAddress);
  return data;
};

export const getDriverInfraData = async (
  program: Program<RideNetwork>,
  driverInfraOwner: PublicKey
) => {
  const [driverInfraAddress, _driverInfraAddressBump] =
    PublicKey.findProgramAddressSync(
      [
        Buffer.from(anchor.utils.bytes.utf8.encode("driver_infra")),
        driverInfraOwner.toBuffer(),
      ],
      program.programId
    );
  const data = await program.account.driverInfra.fetch(driverInfraAddress);
  return data;
};

export const getRiderInfraData = async (
  program: Program<RideNetwork>,
  riderInfraOwner: PublicKey
) => {
  const [riderInfraAddress, _riderInfraAddressBump] =
    PublicKey.findProgramAddressSync(
      [
        Buffer.from(anchor.utils.bytes.utf8.encode("rider_infra")),
        riderInfraOwner.toBuffer(),
      ],
      program.programId
    );
  const data = await program.account.riderInfra.fetch(riderInfraAddress);
  return data;
};

export const getCompanyInfraAddress = (
  program: Program<RideNetwork>,
  infraPda: PublicKey,
  count: anchor.BN
) => {
  const [infraAddress, _infraAddressBump] = PublicKey.findProgramAddressSync(
    [
      Buffer.from(anchor.utils.bytes.utf8.encode("company_info")),
      infraPda.toBuffer(),
      count.toBuffer("le", 8),
    ],
    program.programId
  );
  return infraAddress;
};

export const getCompanyData = async (
  program: Program<RideNetwork>,
  count: anchor.BN,
  infraPda: PublicKey
) => {
  const [infraAddress, _infraAddressBump] = PublicKey.findProgramAddressSync(
    [
      Buffer.from(anchor.utils.bytes.utf8.encode("company_info")),
      infraPda.toBuffer(),
      count.toBuffer("le", 8),
    ],
    program.programId
  );
  const data = await program.account.companyInfo.fetch(infraAddress);
  return data;
};

export const getDriverInfraAddress = (
  program: Program<RideNetwork>,
  driverInfraOwner: PublicKey
) => {
  const [driverInfraAddress, _driverInfraAddressBump] =
    PublicKey.findProgramAddressSync(
      [
        Buffer.from(anchor.utils.bytes.utf8.encode("driver_infra")),
        driverInfraOwner.toBuffer(),
      ],
      program.programId
    );
  return driverInfraAddress;
};

export const getDriverInfraDataByCreator = async (
  program: Program<RideNetwork>,
  driverInfraCreator: PublicKey
) => {
  const filter = [
    {
      memcmp: {
        offset: 8, //prepend for anchor's discriminator
        bytes: driverInfraCreator.toBase58(),
      },
    },
  ];

  const data = await program.account.driverInfra.all(filter);
  return data[0];
};

export const getRiderInfraAddress = (
  program: Program<RideNetwork>,
  riderInfraOwner: PublicKey
) => {
  const [riderInfraAddress, _riderInfraAddressBump] =
    PublicKey.findProgramAddressSync(
      [
        Buffer.from(anchor.utils.bytes.utf8.encode("rider_infra")),
        riderInfraOwner.toBuffer(),
      ],
      program.programId
    );
  return riderInfraAddress;
};

export const getRiderInfraDataByCreator = async (
  program: Program<RideNetwork>,
  riderInfraCreator: PublicKey
) => {
  const filter = [
    {
      memcmp: {
        offset: 8, //prepend for anchor's discriminator
        bytes: riderInfraCreator.toBase58(),
      },
    },
  ];

  const data = await program.account.riderInfra.all(filter);
  return data[0];
};

export const getDriverAddress = (
  program: Program<RideNetwork>,
  uuid: string
) => {
  const [driverAddress, _driverAddressBump] = PublicKey.findProgramAddressSync(
    [
      Buffer.from(anchor.utils.bytes.utf8.encode("driver")),
      Buffer.from(anchor.utils.bytes.utf8.encode(uuid)),
    ],
    program.programId
  );
  return driverAddress;
};

export const getDriverData = async (
  program: Program<RideNetwork>,
  uuid: string
) => {
  const [driverInfraAddress, _driverInfraAddressBump] =
    PublicKey.findProgramAddressSync(
      [
        Buffer.from(anchor.utils.bytes.utf8.encode("driver")),
        Buffer.from(anchor.utils.bytes.utf8.encode(uuid)),
      ],
      program.programId
    );
  const data = await program.account.driver.fetch(driverInfraAddress);
  return data;
};

export const getAllDriver = async (program: Program<RideNetwork>) => {
  const data = await program.account.driver.all();
  return data[0];
};

export const getDriverInfraDataByAddress = async (
  program: Program<RideNetwork>,
  driverInfraAddress: PublicKey
) => {
  const data = await program.account.driverInfra.fetch(driverInfraAddress);
  return data;
};

export const getJobPda = async (
  program: Program<RideNetwork>,
  driverInfraAddress: PublicKey,
  jobCount: anchor.BN
) => {
  const [jobAddress, _jobAddressBump] = PublicKey.findProgramAddressSync(
    [
      Buffer.from(anchor.utils.bytes.utf8.encode("job")),
      driverInfraAddress.toBuffer(),
      jobCount.toBuffer("le", 8),
    ],
    program.programId
  );
  return jobAddress;
};

export const getJobData = async (
  program: Program<RideNetwork>,
  uuid: string
) => {
  const filter = [
    {
      memcmp: {
        offset: 8 + 4, // Offset discrimator and offset
        bytes: anchor.utils.bytes.bs58.encode(Buffer.from(uuid)),
      },
    },
  ];
  const data = await program.account.job.all(filter);
  return data[0].account;
};
