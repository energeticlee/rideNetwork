use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Not all params are provided")]
    InvalidCreateGlobalParams,
    #[msg("Not all params are provided")]
    InvalidCreateCountryParams,
    #[msg("Invalid Update Authority")]
    InvalidUpdateAuthority,
    #[msg("Driver already initialized")]
    DriverAlreadyInitialized,
    #[msg("Job has already been accepted")]
    JobAlreadyAccepted,
    #[msg("Company name, uen, and website required")]
    InvalidInitDriverInput,
    #[msg("Infra already initialized")]
    InfraAlreadyInitialized,
    #[msg("Incorrect Init Driver Infra Count")]
    IncorrectInitDriverInfraCount,
    #[msg("Incorrect Init Customer Infra Count")]
    IncorrectInitCustomerInfraCount,
    #[msg("Invalid coordinates value")]
    InvalidCoordinatesValid,
    #[msg("Job marked as dispute raised by driver")]
    JobDisputeByDriver,
    #[msg("Job marked as dispute raised by Customer")]
    JobDisputeByCustomer,
    #[msg("Job not yet started")]
    JobNotYetStarted,
    #[msg("Mismatch in driver payout")]
    MismatchDriverPayout,
    #[msg("Job marked as cancelled by Customer")]
    CancelledByCustomer,
    #[msg("Job marked as cancelled by driver")]
    CancelledByDriver,
    #[msg("Incorrect lifecycle, job status must be marked as Arrived")]
    IncorrectLifecycleArrived,
    #[msg("Incorrect lifecycle, job status must be marked as Job Accepted")]
    IncorrectLifecycleJobAccepted,
    #[msg("Job already initialized")]
    JobAlreadyInitialized,
}
