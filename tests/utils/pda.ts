import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { RideNetwork } from "../../target/types/ride_network";

export const getGlobalAddress = (program: Program<RideNetwork>) => {
  const [globalAddress, _globalAddressBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("global")],
    program.programId
  );
  return globalAddress;
};

export const getGlobalData = async (program: Program<RideNetwork>) => {
  const [globalAddress, _globalAddressBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("global")],
    program.programId
  );

  const data = await program.account.global.fetch(globalAddress);
  return data;
};

export const getCountryAddress = (
  program: Program<RideNetwork>,
  alpha3Code = "SGP"
) => {
  const [countryAddress, _countryAddressBump] =
    PublicKey.findProgramAddressSync(
      [Buffer.from("country"), Buffer.from(alpha3Code)],
      program.programId
    );
  return countryAddress;
};

export const getCountryData = async (
  program: Program<RideNetwork>,
  alpha3Code = "SGP"
) => {
  const [countryAddress, _countryAddressBump] =
    PublicKey.findProgramAddressSync(
      [Buffer.from("country"), Buffer.from(alpha3Code)],
      program.programId
    );

  const data = await program.account.country.fetch(countryAddress);
  return data;
};

export const getServiceAddress = (
  program: Program<RideNetwork>,
  serviceCount: anchor.BN
) => {
  const [serviceAddress, _serviceAddressBump] =
    PublicKey.findProgramAddressSync(
      [Buffer.from("offered_service"), serviceCount.toBuffer("le", 8)],
      program.programId
    );
  return serviceAddress;
};

export const getServiceData = async (
  program: Program<RideNetwork>,
  serviceCount: anchor.BN
) => {
  const [serviceAddress, _serviceAddressBump] =
    PublicKey.findProgramAddressSync(
      [Buffer.from("offered_service"), serviceCount.toBuffer("le", 8)],
      program.programId
    );
  const data = await program.account.offeredService.fetch(serviceAddress);
  return data;
};

export const getPassengerTypeAddress = (
  program: Program<RideNetwork>,
  passengerTypeCount: anchor.BN
) => {
  const [passengerTypeAddress, _passengerTypeAddressBump] =
    PublicKey.findProgramAddressSync(
      [Buffer.from("passenger_type"), passengerTypeCount.toBuffer("le", 8)],
      program.programId
    );
  return passengerTypeAddress;
};

export const getPassengerTypeData = async (
  program: Program<RideNetwork>,
  passengerTypeCount: anchor.BN
) => {
  const [passengerTypeAddress, _passengerTypeAddressBump] =
    PublicKey.findProgramAddressSync(
      [Buffer.from("passenger_type"), passengerTypeCount.toBuffer("le", 8)],
      program.programId
    );
  const data = await program.account.passengerTypes.fetch(passengerTypeAddress);
  return data;
};

export const getVehicleAddress = (
  program: Program<RideNetwork>,
  vehicleCount: anchor.BN
) => {
  const [vehicleAddress, _vehicleAddressBump] =
    PublicKey.findProgramAddressSync(
      [Buffer.from("vehicle"), vehicleCount.toBuffer("le", 8)],
      program.programId
    );
  return vehicleAddress;
};

export const getVehicleData = async (
  program: Program<RideNetwork>,
  vehicleCount: anchor.BN
) => {
  const [vehicleAddress, _vehicleAddressBump] =
    PublicKey.findProgramAddressSync(
      [Buffer.from("vehicle"), vehicleCount.toBuffer("le", 8)],
      program.programId
    );
  const data = await program.account.vehicle.fetch(vehicleAddress);
  return data;
};

export const getDriverInfraData = async (
  program: Program<RideNetwork>,
  driverInfraCount: anchor.BN,
  alpha3Code = "SGP"
) => {
  const [driverInfraAddress, _driverInfraAddressBump] =
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("driver_infra"),
        Buffer.from(alpha3Code),
        driverInfraCount.toBuffer("le", 8),
      ],
      program.programId
    );
  const data = await program.account.driverInfra.fetch(driverInfraAddress);
  return data;
};

export const getCustomerInfraData = async (
  program: Program<RideNetwork>,
  customerInfraCount: anchor.BN,
  alpha3Code = "SGP"
) => {
  const [customerInfraAddress, _customerInfraAddressBump] =
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("customer_infra"),
        Buffer.from(alpha3Code),
        customerInfraCount.toBuffer("le", 8),
      ],
      program.programId
    );
  const data = await program.account.customerInfra.fetch(customerInfraAddress);
  return data;
};

export const getCompanyInfraAddress = (
  program: Program<RideNetwork>,
  infraPda: PublicKey,
  count: anchor.BN
) => {
  const [infraAddress, _infraAddressBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("company_info"), infraPda.toBuffer(), count.toBuffer("le", 8)],
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
    [Buffer.from("company_info"), infraPda.toBuffer(), count.toBuffer("le", 8)],
    program.programId
  );
  const data = await program.account.companyInfo.fetch(infraAddress);
  return data;
};

export const getDriverInfraAddress = (
  program: Program<RideNetwork>,
  driverInfraCount: anchor.BN,
  alpha3Code = "SGP"
) => {
  const [driverInfraAddress, _driverInfraAddressBump] =
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("driver_infra"),
        Buffer.from(alpha3Code),
        driverInfraCount.toBuffer("le", 8),
      ],
      program.programId
    );
  return driverInfraAddress;
};

export const getAllDriverInfraData = async (program: Program<RideNetwork>) => {
  const data = await program.account.driverInfra.all();
  return data;
};

export const getDriverInfraDataByUpdateAuthority = async (
  program: Program<RideNetwork>,
  driverInfraUpdateAuthority: PublicKey
) => {
  const alphaCodeByteSize = 4 + 3;

  const filter = [
    {
      memcmp: {
        offset: 8 + alphaCodeByteSize, //prepend for anchor's discriminator
        bytes: driverInfraUpdateAuthority.toBase58(),
      },
    },
  ];
  const data = await program.account.driverInfra.all(filter);
  return data[0];
};

export const getCustomerInfraAddress = (
  program: Program<RideNetwork>,
  customerInfraCount: anchor.BN,
  alpha3Code = "SGP"
) => {
  const [customerInfraAddress, _customerInfraAddressBump] =
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("customer_infra"),
        Buffer.from(alpha3Code),
        customerInfraCount.toBuffer("le", 8),
      ],
      program.programId
    );
  return customerInfraAddress;
};

export const getCustomerInfraDataByAddress = async (
  program: Program<RideNetwork>,
  customerInfraAddress: PublicKey
) => {
  const data = await program.account.customerInfra.fetch(customerInfraAddress);
  return data[0];
};

export const getCustomerInfraDataByUpdateAuthority = async (
  program: Program<RideNetwork>,
  customerInfraUpdateAuthority: PublicKey
) => {
  const alphaCodeByteSize = 4 + 3;

  const filter = [
    {
      memcmp: {
        offset: 8 + alphaCodeByteSize, //prepend for anchor's discriminator
        bytes: customerInfraUpdateAuthority.toBase58(),
      },
    },
  ];

  const data = await program.account.customerInfra.all(filter);
  return data[0];
};

export const getAllCustomerInfraData = async (
  program: Program<RideNetwork>
) => {
  const data = await program.account.customerInfra.all();
  return data;
};

export const getDriverAddress = (
  program: Program<RideNetwork>,
  driverUuid: string
) => {
  const [driverAddress, _driverAddressBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("driver"), Buffer.from(driverUuid)],
    program.programId
  );
  return driverAddress;
};

export const getAllDriverData = async (program: Program<RideNetwork>) => {
  const data = await program.account.driver.all();
  return data;
};

export const getDriverData = async (
  program: Program<RideNetwork>,
  driverUuid: string
) => {
  const [driverInfraAddress, _driverInfraAddressBump] =
    PublicKey.findProgramAddressSync(
      [Buffer.from("driver"), Buffer.from(driverUuid)],
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

export const getJobPda = (
  program: Program<RideNetwork>,
  driverInfraAddress: PublicKey,
  jobCount: anchor.BN
) => {
  const [jobAddress, _jobAddressBump] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("job"),
      driverInfraAddress.toBuffer(),
      jobCount.toBuffer("le", 8),
    ],
    program.programId
  );
  return jobAddress;
};

export const getJobData = async (
  program: Program<RideNetwork>,
  customer_infra: PublicKey,
  driverUuid: string
) => {
  const filter = [
    {
      memcmp: {
        offset: 8 + 1 + 8, // Offset discrimator and offset
        bytes: customer_infra.toBase58(),
      },
    },
    {
      memcmp: {
        offset: 8 + 1 + 8 + 32 + 32 + 4, // Offset discrimator and offset
        bytes: anchor.utils.bytes.bs58.encode(Buffer.from(driverUuid)),
      },
    },
  ];
  const data = await program.account.job.all(filter);
  return data[0];
};

export const getJobDataWithUuid = async (
  program: Program<RideNetwork>,
  driverUuid: string
) => {
  const filter = [
    {
      memcmp: {
        offset: 8 + 1 + 8 + 32 + 32 + 4, // Offset discrimator and offset
        bytes: anchor.utils.bytes.bs58.encode(Buffer.from(driverUuid)),
      },
    },
  ];
  const data = await program.account.job.all(filter);
  return data[0].account;
};

export const getJobDataByAddress = async (
  program: Program<RideNetwork>,
  jobAddress: string
) => {
  const data = await program.account.job.fetch(jobAddress);
  return data;
};
