use soroban_sdk::{Address, Env};
use crate::storage_types::DataKey;

pub fn read_balance(e: &Env, addr: Address) -> i128 {
    let key = DataKey::Balance(addr);
    e.storage().instance().get::<_, i128>(&key).unwrap_or(0)
}

pub fn receive_balance(e: &Env, addr: Address, amount: i128) {
    let balance = read_balance(e, addr.clone());
    let key = DataKey::Balance(addr);
    e.storage().instance().set(&key, &(balance + amount));
}

pub fn spend_balance(e: &Env, addr: Address, amount: i128) {
    let balance = read_balance(e, addr.clone());
    if balance < amount {
        panic!("insufficient balance");
    }
    let key = DataKey::Balance(addr);
    e.storage().instance().set(&key, &(balance - amount));
}

pub fn read_total_supply(e: &Env) -> i128 {
    e.storage()
        .instance()
        .get::<_, i128>(&DataKey::TotalSupply)
        .unwrap_or(0)
}

pub fn update_total_supply(e: &Env, delta: i128) {
    let total = read_total_supply(e);
    let new_total = total + delta;
    if new_total < 0 {
        panic!("total supply cannot be negative");
    }
    e.storage().instance().set(&DataKey::TotalSupply, &new_total);
} 