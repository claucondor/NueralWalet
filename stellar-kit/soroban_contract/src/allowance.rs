use soroban_sdk::{Address, Env};
use crate::storage_types::{AllowanceDataKey, AllowanceValue, DataKey};

pub fn read_allowance(e: &Env, from: Address, spender: Address) -> AllowanceValue {
    let key = DataKey::Allowance(AllowanceDataKey { from, spender });
    
    // Verificar si existe una autorización
    if let Some(allowance) = e.storage().instance().get::<_, AllowanceValue>(&key) {
        // Verificar si la autorización ha expirado
        let ledger_sequence = e.ledger().sequence();
        if allowance.expiration_ledger <= ledger_sequence {
            return AllowanceValue {
                amount: 0,
                expiration_ledger: allowance.expiration_ledger,
            };
        }
        return allowance;
    }
    
    // Si no existe, retornar un valor por defecto
    AllowanceValue {
        amount: 0,
        expiration_ledger: 0,
    }
}

pub fn write_allowance(
    e: &Env,
    from: Address,
    spender: Address,
    amount: i128,
    expiration_ledger: u32,
) {
    let ledger_sequence = e.ledger().sequence();
    if expiration_ledger <= ledger_sequence && amount > 0 {
        panic!("expiration_ledger must be greater than current ledger number");
    }
    
    let allowance = AllowanceValue {
        amount,
        expiration_ledger,
    };
    
    let key = DataKey::Allowance(AllowanceDataKey { from, spender });
    e.storage().instance().set(&key, &allowance);
}

pub fn spend_allowance(e: &Env, from: Address, spender: Address, amount: i128) {
    let allowance = read_allowance(e, from.clone(), spender.clone());
    if allowance.amount < amount {
        panic!("insufficient allowance");
    }
    
    let new_allowance = AllowanceValue {
        amount: allowance.amount - amount,
        expiration_ledger: allowance.expiration_ledger,
    };
    
    let key = DataKey::Allowance(AllowanceDataKey { from, spender });
    e.storage().instance().set(&key, &new_allowance);
} 