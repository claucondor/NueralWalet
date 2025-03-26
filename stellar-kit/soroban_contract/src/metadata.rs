use soroban_sdk::{Env, String};
use soroban_token_sdk::metadata::TokenMetadata;
use crate::storage_types::DataKey;

pub fn read_metadata(e: &Env) -> TokenMetadata {
    e.storage()
        .instance()
        .get::<_, TokenMetadata>(&DataKey::Metadata)
        .expect("Metadata not set")
}

pub fn write_metadata(e: &Env, metadata: TokenMetadata) {
    e.storage().instance().set(&DataKey::Metadata, &metadata);
}

pub fn read_decimal(e: &Env) -> u32 {
    read_metadata(e).decimal
}

pub fn read_name(e: &Env) -> String {
    read_metadata(e).name
}

pub fn read_symbol(e: &Env) -> String {
    read_metadata(e).symbol
} 