use anchor_lang::prelude::*;

#[account]
pub struct Global {
    // Account state
    pub is_initialized: bool,
    // Authority to update the global state
    pub update_authority: Pubkey,
    // Fees towards the global DAO
    pub platform_fee_basis_point: u16,
    // Number of services created
    pub service_type_counter: u64,
    // Number of special passengers option created
    pub passengers_type_counter: u64,
    // Number of vehicle option created
    pub vehicle_counter: u64,
    // Cost to add a new vehicle or new pax option
    pub new_vehicle_or_pax_fee_cent: u64,
}

#[account]
pub struct Country {
    // Country Alpha3 code => SGP, USA, MYS
    pub alpha3_country_code: String,
    // Authority to update the country state
    pub update_authority: Pubkey,
    // Fees towards the country DAO
    pub platform_fee_basis_point: u16,
    // Number of driver infra created
    pub driver_infra_counter: u64,
    // Number of customer infra created
    pub customer_infra_counter: u64,
    // Stable mint in the local currency
    pub stable_mint: Pubkey,
    // duration which waiting fees are enforced
    pub waiting_fee_sec: u64,
    // Waiting fees in local stable mint
    pub waiting_fee_cent: u64,
    // duration which driver will be charged for cancellation
    pub driver_cancellation_fee_sec: u64,
    // duration which customer will be charged for cancellation
    pub customer_cancellation_fee_sec: u64,
    // Cancellation fees in local stable mint
    pub cancellation_fee_cent: u64,
    // Based rate for each job
    pub base_rate_cent: u64,
    // Minimum per km rate
    pub min_km_rate_cent: u64,
    // Minimum minute duration rate
    pub min_min_fee_cent: u64,
    // Duration to finialize job
    pub finalize_duration_sec: u64,
    // Duration for issuee to respond
    pub dispute_waitout_period: u64,
    // Minimum deposit for driver infra
    pub min_driver_infra_deposit: u64,
    // Minimum deposit for customer infra
    pub min_customer_infra_deposit: u64,
    // Base reference value for calculating slashed
    pub base_slash_amount: u64,
    // Has this account been initialiazed
    pub is_initialized: bool,
}

#[account]
pub struct DriverInfra {
    // alpha3 country code
    pub alpha3_country_code: String,
    // Authority to update the country state
    pub update_authority: Pubkey,
    // Number of job created
    pub job_counter: u64,
    // Count of driver infra (ID)
    pub driver_infra_count: u64,
    // Has this account been initialiazed
    pub is_initialized: bool,
    // Has this account been verified by country
    pub is_verified: bool,
    // Is this account currently frozen
    pub is_frozen: bool,
    // Driver infra fees
    pub driver_infra_fee_basis_point: u16,
    // Count of company info (ID)
    pub company_info_current_count: u64,
    // Number of ride matched
    pub matched_ride: u64,
    // Number of ride cancelled
    pub cancellation: u64,
    // Number of dispute ride
    pub dispute_cases: u64,
    // Number of dispute ride which infra lost
    pub cases_lost_in_dispute: u64,
}

#[account]
pub struct CompanyInfo {
    // Name of the company
    pub company_name: String,
    // Company registration number
    pub entity_registry_id: String,
    // Company website
    pub website: String,
}

#[account]
pub struct CustomerInfra {
    // alpha3 country code
    pub alpha3_country_code: String,
    // Authority to update the country state
    pub update_authority: Pubkey,
    // Stable mint in the local currency
    pub stable_mint: Pubkey,
    // Count of customer infra (ID)
    pub customer_infra_count: u64,
    // Has this account been initialiazed
    pub is_initialized: bool,
    // Has this account been verified by country
    pub is_verified: bool,
    // Is this account currently frozen
    pub is_frozen: bool,
    // Customer infra fees
    pub customer_infra_fee_basis_point: u16,
    // Count of company info (ID)
    pub company_info_current_count: u64,
    // Number of ride matched
    pub matched_ride: u64,
    // Number of ride cancelled
    pub cancellation: u64,
    // Number of dispute ride
    pub dispute_cases: u64,
    // Number of dispute ride which infra lost
    pub cases_lost_in_dispute: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Coordinates {
    pub lat: f64,
    pub long: f64,
}

#[account]
pub struct Driver {
    // Has this account been initialiazed
    pub is_initialized: bool,
    // Location update authority
    pub location_update_authority: Pubkey,
    // Driver UUID
    pub driver_uuid: String,
    // RSA pubkey for data encryption
    pub rsa_pem_pubkey: String,
    // Authority over the driver account
    pub infra_authority: Pubkey,
    // Driver last location, to be updated every 10 seconds
    pub last_location: Coordinates,
    // Driver location last updated time
    pub location_last_update: u64,
    // Driver next destination
    pub next_location: Option<Coordinates>,
    // Driver operating country code
    pub country_key: Pubkey,
    // Services that the driver accepts
    pub offered_service: Vec<u64>,
    // Special Ppassengers that the driver accept: Kids/Pets
    pub passenger_types: Vec<u64>,
    // Type of vehicle
    pub vehicle: Pubkey,
    // Number of seats in the vehicle
    pub number_of_seats: u8,
}

#[account]
pub struct Job {
    // Current status of the job
    pub status: Status,
    pub job_count: u64,
    pub customer_infra: Pubkey,
    pub driver_infra: Pubkey,
    pub driver_uuid: String,
    // Time of initialization
    // Distribution of fees
    pub distribution: Vec<Distribution>,
    // Settlement protocol that is being used
    pub settlement_protocol: Option<Pubkey>,
    // Total fees on job
    pub total_fee_cent: u64,
    pub job_initialized_time: u64,
    // When the job was accepted
    pub job_start_time: Option<u64>,
    // When the driver arrived at pickup location
    pub arrival_time: Option<u64>,
    // When the driver arrived at destination
    pub job_end_time: Option<u64>,
    // Encrypted data
    pub encrypted_data: String,
    // Encrypted RSA Pubkey with AES & IV
    pub encrypted_combined_rand_base64: String,
}

#[account]
pub struct OfferedService {
    // Points to country pubkey
    pub country_key: Pubkey,
    // Name of service type: ride_hailing, package delivery
    pub name: String,
    // Service type count (ID)
    pub service_count: u64,
    // Is this an available option
    pub is_valid: bool,
    // Check is initialize for counter
    pub is_initialized: bool,
    // Deposit Payer
    pub initializer: Pubkey,
}

#[account]
pub struct PassengerTypes {
    // Name of special pax: dog_friendly, baby_seat
    pub name: String,
    // Is this an available option
    pub is_valid: bool,
    // Check is initialize for counter
    pub is_initialized: bool,
    // Deposit Payer
    pub initializer: Pubkey,
}
#[account]
pub struct Vehicle {
    // Brand of vehicle
    pub brand: String,
    // model of vehicle
    pub model: String,
    pub number_of_seats: u8,
    // Is this an available option
    pub is_valid: bool,
    // Deposit Payer
    pub initializer: Pubkey,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Debug)]
pub enum Status {
    Init,
    JobAccepted,
    RejectedByDriver,
    Arrived, // No need
    Started, // No need
    Completed,
    CancelledByDriver,
    CancelledByCustomer,
    DisputeByDriver,
    DisputeByCustomer,
}

// #[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug)]
// pub enum JobType {
//     Ride4Seater,
//     RideWithPets,
//     Ride4SeaterWithKids,
//     Ride6Seater,
//     PremiumSeater,
// }

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug)]
pub struct Distribution {
    pub provider: Pubkey,
    pub basis_point_payout: u16,
}

const DISCRIMINATOR: usize = 8;
const PREFIX: usize = 4;
const ALPHA3: usize = PREFIX + 3;
const PUBKEY: usize = 32;
const BOOL: usize = 1;
const U8: usize = 1;
const U16: usize = 2;
const U64: usize = 8;

impl Global {
    pub fn len() -> usize {
        DISCRIMINATOR + BOOL + PUBKEY + U16 + U64 + U64 + U64 + U64
    }
}

impl Country {
    pub fn len() -> usize {
        DISCRIMINATOR
            + ALPHA3
            + PUBKEY
            + U16
            + U64
            + U64
            + PUBKEY
            + U64
            + U64
            + U64
            + U64
            + U64
            + U64
            + U64
            + U64
            + U64
            + U64
            + U64
            + U64
            + U64
            + BOOL
    }
}

impl DriverInfra {
    pub fn len() -> usize {
        DISCRIMINATOR
            + ALPHA3
            + PUBKEY
            + U64
            + U64
            + BOOL
            + BOOL
            + BOOL
            + U16
            + U64
            + U64
            + U64
            + U64
            + U64
    }
}

impl CompanyInfo {
    pub fn len(company_name: &String, entity_registry_id: &String, website: &String) -> usize {
        DISCRIMINATOR
            + (PREFIX + company_name.chars().count())
            + (PREFIX + entity_registry_id.chars().count())
            + (PREFIX + website.chars().count())
    }
}

impl Driver {
    pub fn len(
        uuid: &String,
        rsa_pubkey: &String,
        offered_service: &Vec<u64>,
        passenger_types: &Vec<u64>,
    ) -> usize {
        DISCRIMINATOR
            + BOOL // Is initialized
            + PUBKEY // Location update authority
            + (PREFIX + uuid.chars().count())
            + (PREFIX + rsa_pubkey.chars().count())
            + PUBKEY // Infra authority
            + std::mem::size_of::<f64>() * 2 // Last location
            + U64 // location last update
            + std::mem::size_of::<f64>() * 2 // next location
            + PUBKEY // country key
            + (PREFIX + offered_service.len() * U64) // offered service
            + (PREFIX + passenger_types.len() * U64) // passenger type
            + PUBKEY // Vehicle
            + U8 // Number of seats
            + 200
    }
}

impl CustomerInfra {
    pub fn len() -> usize {
        DISCRIMINATOR
            + ALPHA3
            + PUBKEY
            + PUBKEY // stable mint
            + U64
            + BOOL
            + BOOL
            + BOOL
            + U16
            + U64
            + U64
            + U64
            + U64
            + U64
    }
}

impl Job {
    pub fn len(
        driver_uuid: &String,
        distribution_len: &u8,
        encrypted_data: &String,
        encrypted_combined_rand_base64: &String,
    ) -> usize {
        DISCRIMINATOR
            + PUBKEY // Driver infra
            + PUBKEY // Rider infra
            + U8 // Job Count
            + PUBKEY // Settlement protocol
            + U64 // Total fees
            + (PREFIX + (PUBKEY + U16) * *distribution_len as usize)
            + 1 // Status
            + U64 // Job initialized time
            + U64 // Job start time
            + U64 // Driver arrived time
            + U64 // Job end time
            + (PREFIX + driver_uuid.chars().count()) // Driver UUID
            + (PREFIX + encrypted_data.chars().count())
            + (PREFIX + encrypted_combined_rand_base64.chars().count())
    }
}

impl OfferedService {
    pub fn len(name: &String) -> usize {
        DISCRIMINATOR + PUBKEY + (PREFIX + name.chars().count()) + U64 + BOOL + BOOL + PUBKEY
    }
}

impl Vehicle {
    pub fn len(brand: &String, model: &String) -> usize {
        DISCRIMINATOR
            + (PREFIX + brand.chars().count())
            + (PREFIX + model.chars().count())
            + U8
            + BOOL
            + PUBKEY
    }
}

impl PassengerTypes {
    pub fn len(name: &String) -> usize {
        DISCRIMINATOR + (PREFIX + name.chars().count()) + BOOL + BOOL + PUBKEY
    }
}
