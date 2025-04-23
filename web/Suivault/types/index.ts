import { CoinMetadata } from "@mysten/sui/client"


// public struct VaultCreated has copy, drop {
//   vault_id: ID,
//   owner: address,
//   verifier: address,
//   amount: u64,
// }

// public struct VerificationRequested has copy, drop {
//   vault_id: ID,
//   owner: address,
//   verifier: address,
//   expire_epoch: u64,
// }

// public struct CoinDeposited has copy, drop {
//   vault_id: ID,
//   owner: address,
//   coin_type: TypeName,
//   amount: u64,
//   new_balance: u64,
// }

// public struct CoinWithdrawn has copy, drop {
//   vault_id: ID,
//   owner: address,
//   coin_type: TypeName,
//   amount: u64,
//   remaining: u64,
// }

// public struct EmergencyUnlockInitiated has copy, drop {
//   vault_id: ID,
//   owner: address,
//   unlock_time: u64,
// }

// public struct EmergencyUnlockCancelled has copy, drop {
//   vault_id: ID,
//   owner: address,
//   timestamp: u64,
// }

// public struct VerificationCancelled has copy, drop {
//   vault_id: ID,
//   owner: address,
//   verifier: address,
//   timestamp: u64,
// }


export interface VaultCreated {
    vault_id: string;
    owner: string;
    verifier: string;
    amount: number;
}
export interface VerificationRequested {
    vault_id: string;
    owner: string;
    verifier: string;
    coin_type: {name:string};
    cap:string,
    expire_epoch: number;
} 
export interface CoinDeposited {
    vault_id: string;
    owner: string;
    coin_type: string;
    amount: number;
    new_balance: number;
}
export interface CoinWithdrawn {
    vault_id: string;
    owner: string;
    coin_type: string;
    amount: number;
    remaining: number;
}
export interface EmergencyUnlockInitiated {
    vault_id: string;
    owner: string;
    unlock_time: number;
}
export interface EmergencyUnlockCancelled {
    vault_id: string;
    owner: string;
    timestamp: number;
}
export interface VerificationCancelled {
    vault_id: string;
    owner: string;
    verifier: string;
    timestamp: number;
}


// public struct Vault has key {
//     id: UID,
//     name: String,
//     owner: address,
//     verifier_address: address,
//     // last_verification_epoch: u64,
//     created_at: u64,
//     status: u8,
//     verification_expire_epoch: u64,
//     last_operation_epoch: u64,
//     recipient: address,
//     emergency_unlock_time: u64,
//     emergency_active: bool,
//     send_amount: u64,
//     temp_unlock_expiry: u64,
//     //dynamic field
// }

// // 保险箱集合 - 存储所有保险箱
// public struct VaultPool has key {
//   id: UID,
//   vaults: vector<address>,
//   user_vaults: Table<address, vector<address>>,
//   verifier_vaults: Table<address, vector<address>>,
//   admin: address,
//   total_vaults: u64,
// }

// // 验证者凭证
// public struct VerifierCap has key {
//   id: UID,
//   vault_id: ID,
//   owner: address,
//   verifier: address,
// }

export interface Vault {
    id: {id:string};
    name: string;
    owner: string;
    verifier_address: string;
    created_at: number;
    status: number;
    verification_expire_epoch: number;
    last_operation_epoch: number;
    cap:string;
    recipient: string;
    emergency_unlock_time: number;
    emergency_active: boolean;
    send_amount: number;
    temp_unlock_expiry: number;
}

export interface DispalyVault {
    id: {id:string};
    name:string;
    status:number;
    createdAt:string;
    verifier:string;
    balances: {
        coin: string;
        amount: string;
    }[];
    emergencyTimeRemaining: string;
}

export interface UserVault{
    user_vaults: Vault[];
    verifier_vaults: Vault[];
    total_vaults: number;
}


export interface SuiTableData {
    fields: {
        id: {id:string};
    };
    type: string;
}

export interface SuiTableInfo {
        id: {id:string};
        name:string;
        value:string[]
    
};

export interface VaultData{
    name:string;
    value:number;
}

export interface SuiCoin  {
    id: string,
    type: string,
    coinMetadata?: CoinMetadata,
    balance?: number,
  }

export interface VaultPool {
    id: {id:string};
    vaults: string[];
    user_vaults: SuiTableData;
    verifier_vaults: SuiTableData;
    admin: string;
    total_vaults: number;
}

export interface VerifierCap {
    id: string;
    vault_id: string;
    owner: string;
    verifier: string;
}
