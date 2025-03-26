use soroban_sdk::{contracttype, Address, Env};

// Constantes para manejo del tiempo de vida de las instancias
pub const INSTANCE_LIFETIME_THRESHOLD: u32 = 86400; // 1 día en segundos
pub const INSTANCE_BUMP_AMOUNT: u32 = 86400 * 30; // 30 días en segundos

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Admin,
    Metadata,
    Balance(Address),
    Allowance(AllowanceDataKey),
    TotalSupply,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AllowanceDataKey {
    pub from: Address,
    pub spender: Address,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AllowanceValue {
    pub amount: i128,
    pub expiration_ledger: u32,
}

pub fn extend_instance_ttl(e: &Env) {
    e.storage()
        .instance()
        .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
} 