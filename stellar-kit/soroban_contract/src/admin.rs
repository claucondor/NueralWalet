use soroban_sdk::{Address, Env};
use crate::storage_types::DataKey;

pub fn read_administrator(e: &Env) -> Address {
    e.storage()
        .instance()
        .get::<_, Address>(&DataKey::Admin)
        .expect("Administrator not set")
}

pub fn write_administrator(e: &Env, admin: &Address) {
    e.storage().instance().set(&DataKey::Admin, admin);
} 