use anchor_lang::prelude::*;

#[account]
pub struct Global {
    pub update_authority: Pubkey,
    pub platform_fee_basis_point: u16,
    pub is_initialized: bool,
}

#[account]
pub struct Country {
    pub alpha3_country_code: String,
    pub update_authority: Pubkey,
    pub platform_fee_basis_point: u16,
    pub driver_infra_counter: u64,
    pub rider_infra_counter: u64,
    pub stable_mint: Pubkey,
    pub waiting_fee_sec: u64,
    pub waiting_fee_cent: u64,
    pub driver_cancellation_fee_sec: u64,
    pub rider_cancellation_fee_sec: u64,
    pub cancellation_fee_cent: u64,
    pub base_rate_cent: u64,
    pub min_km_rate_cent: u64,
    pub min_min_fee_cent: u64,
    pub finalize_duration_sec: u64,
    pub min_driver_infra_deposit: u64,
    pub min_rider_infra_deposit: u64,
    pub base_slash_amount: u64,
    pub is_initialized: bool,
}

#[account]
pub struct DriverInfra {
    pub creator: Pubkey,
    pub update_authority: Pubkey,
    pub job_counter: u64,
    pub driver_infra_count: u64,
    pub is_initialized: bool,
    pub is_verified: bool,
    pub is_frozen: bool,
    pub driver_infra_fee_basis_point: u16,
    pub company_info_current_count: u64,
}

#[account]
pub struct CompanyInfo {
    pub company_name: String,
    pub uen: String,
    pub website: String,
}

#[account]
pub struct RiderInfra {
    pub creator: Pubkey,
    pub update_authority: Pubkey,
    pub rider_infra_count: u64,
    pub is_initialized: bool,
    pub is_verified: bool,
    pub is_frozen: bool,
    pub rider_infra_fee_basis_point: u16,
    pub company_info_current_count: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Coordinates {
    pub lat: f64,
    pub long: f64,
}

#[account]
pub struct Driver {
    pub uuid: String,
    pub infra_authority: Pubkey,
    pub last_location: Coordinates,
    pub next_location: Option<Coordinates>,
    pub job_type: JobType,
    pub is_initialized: bool,
}

#[account]
pub struct Job {
    pub driver_uuid: String,
    pub driver_infra: Pubkey,
    pub rider_infra: Pubkey,
    pub total_fee_cent: u64,
    pub distribution: Vec<Distribution>,
    pub status: Status,
    pub job_initialized_time: u64,
    pub job_start_time: Option<u64>,
    pub arrival_time: Option<u64>,
    pub job_end_time: Option<u64>,
    pub is_initialized: bool,
    pub data: String, // SHA256
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub enum Status {
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

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug)]
pub enum JobType {
    Ride4Seater,
    RideWithPets,
    Ride4SeaterWithKids,
    Ride6Seater,
    PremiumSeater,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct Distribution {
    pub provider: Pubkey,
    pub basis_point_payout: u16,
}

const DISCRIMINATOR: usize = 8;
const PREFIX: usize = 4;
const CHAR: usize = 4;
const ALPHA3: usize = PREFIX + (3 * CHAR);
const PUBKEY: usize = 32;
const BOOL: usize = 1;
const U16: usize = 2;
const U64: usize = 8;
const UUID: usize = 23;

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
            + BOOL
    }
}

impl DriverInfra {
    pub fn len() -> usize {
        DISCRIMINATOR + PUBKEY + PUBKEY + U64 + U64 + BOOL + BOOL + BOOL + U16 + U64
    }
}

impl CompanyInfo {
    pub fn len(company_name: &String, uen: &String, website: &String) -> usize {
        DISCRIMINATOR
            + (PREFIX + company_name.len() * CHAR)
            + (PREFIX + uen.len() * CHAR)
            + (PREFIX + website.len() * CHAR)
    }
}

impl Driver {
    pub fn len() -> usize {
        DISCRIMINATOR
            + UUID
            + PUBKEY
            + std::mem::size_of::<f64>() * 2
            + std::mem::size_of::<f64>() * 2
            + 1
            + BOOL
    }
}

impl RiderInfra {
    pub fn len() -> usize {
        DISCRIMINATOR + PUBKEY + PUBKEY + U64 + BOOL + BOOL + BOOL + U16 + U64
    }
}

impl Job {
    pub fn len(distribution_len: &u8, encrypted_data_size: &usize) -> usize {
        DISCRIMINATOR
            + UUID
            + PUBKEY
            + PUBKEY
            + U64
            + (PREFIX + (PUBKEY + U16) * *distribution_len as usize)
            + U64
            + U64
            + U64
            + 1
            + BOOL
            + encrypted_data_size
    }
}
