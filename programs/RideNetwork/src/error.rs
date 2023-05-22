use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Not all params are provided")]
    InvalidCreateGlobalParams,
    #[msg("Invalid Update Authority")]
    InvalidUpdateAuthority,
    #[msg("Company name, uen, and website required")]
    InvalidInitDriverInput,
    #[msg("Incorrect Init Driver Infra Count")]
    IncorrectInitDriverInfraCount,
    #[msg("Incorrect Init Rider Infra Count")]
    IncorrectInitRiderInfraCount,
    #[msg("Invalid coordinates value")]
    InvalidCoordinatesValid,
    #[msg("Job marked as dispute raised by driver")]
    JobDisputeByDriver,
    #[msg("Job marked as dispute raised by rider")]
    JobDisputeByRider,
    #[msg("Job not yet started")]
    JobNotYetStarted,
    #[msg("Mismatch in driver payout")]
    MismatchDriverPayout,
    #[msg("Job marked as cancelled by rider")]
    CancelledByRider,
    #[msg("Job marked as cancelled by driver")]
    CancelledByDriver,
    #[msg("Incorrect lifecycle, job status must be marked as Arrived")]
    IncorrectLifecycleArrived,
    #[msg("Incorrect lifecycle, job status must be marked as Job Accepted")]
    IncorrectLifecycleJobAccepted,
    #[msg("Job already initialized")]
    JobAlreadyInitialized,
}
