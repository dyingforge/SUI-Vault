module vault::vault;

use std::string::String;
use std::type_name::{Self, TypeName};
use sui::balance::{Self, Balance};
use sui::clock::{Self, Clock};
use sui::coin::{Self, Coin};
use sui::dynamic_field;
use sui::event;
use sui::table::{Self, Table};

// 错误码
const ENotOwner: u64 = 1;
const ENotVerifier: u64 = 2;
const ENotAdmin: u64 = 3;
const EIncorrectPassword: u64 = 4;
const ENotFound: u64 = 5;
const EVerificationNotActive: u64 = 6;
const EVerificationExpired: u64 = 7;
const ECooldownNotMet: u64 = 8;
const EAlreadyInitiated: u64 = 9;
const EInsufficientFunds: u64 = 10;

// 保险箱状态
const VAULT_LOCKED: u8 = 0;
const VAULT_PENDING_VERIFICATION: u8 = 1;
const VAULT_VERIFIED: u8 = 2;
const VAULT_EMERGENCY_PENDING: u8 = 3;
const VAULT_TEMP_UNLOCKED: u8 = 4;
const TEMP_UNLOCK_TIMEOUT_MS: u64 = 300000; // 5分钟

// 事件
public struct VaultCreated has copy, drop {
    vault_id: ID,
    owner: address,
    verifier: address,
    amount: u64,
}

public struct VaultUnlocked has copy, drop {
    vault_id: ID,
    owner: address,
    amount: u64,
}

public struct VerificationRequested has copy, drop {
    vault_id: ID,
    owner: address,
    verifier: address,
    expire_epoch: u64,
}

public struct CoinDeposited has copy, drop {
    vault_id: ID,
    owner: address,
    coin_type: TypeName,
    amount: u64,
    new_balance: u64,
}

public struct CoinWithdrawn has copy, drop {
    vault_id: ID,
    owner: address,
    coin_type: TypeName,
    amount: u64,
    remaining: u64,
}

public struct VaultTempUnlocked has copy, drop {
    vault_id: ID,
    owner: address,
    expiry_time: u64,
}

public struct VaultRelocked has copy, drop {
    vault_id: ID,
    owner: address,
    timestamp: u64,
}

public struct EmergencyUnlockInitiated has copy, drop {
    vault_id: ID,
    owner: address,
    unlock_time: u64,
}

public struct EmergencyUnlockCancelled has copy, drop {
    vault_id: ID,
    owner: address,
    timestamp: u64,
}

public struct VerifierChanged has copy, drop {
    vault_id: ID,
    owner: address,
    old_verifier: address,
    new_verifier: address,
}

// 系统管理员凭证
public struct AdminCap has key, store {
    id: UID,
}

public struct Vault has key, store {
    id: UID,
    password_hash: vector<u8>,
    owner: address,
    verifier_address: address,
    status: u8,
    verification_expire_epoch: u64,
    last_operation_epoch: u64,
    cooldown_period: u64,
    name: String,
    emergency_unlock_time: u64,
    emergency_active: bool,
    created_at: u64,
    temp_unlock_expiry: u64,
}

// 保险箱集合 - 存储所有保险箱
public struct VaultPool has key {
    id: UID,
    vaults: vector<address>,
    user_vaults: Table<address, vector<address>>,
    verifier_vaults: Table<address, vector<address>>,
    admin: address,
    total_vaults: u64,
}

// 验证者凭证
public struct VerifierCap has key, store {
    id: UID,
    vault_id: ID,
    owner: address,
    verifier: address,
}

// 初始化系统
fun init(ctx: &mut TxContext) {
    let admin = tx_context::sender(ctx);

    transfer::transfer(
        AdminCap {
            id: object::new(ctx),
        },
        admin,
    );

    // 创建保险箱集合
    let vault_pool = VaultPool {
        id: object::new(ctx),
        vaults: vector::empty<address>(),
        user_vaults: table::new(ctx),
        verifier_vaults: table::new(ctx),
        admin,
        total_vaults: 0,
    };

    transfer::share_object(vault_pool);
}

// 创建保险箱
public entry fun create_vault(
    pool: &mut VaultPool,
    password: vector<u8>,
    verifier_address: address,
    name: String,
    cooldown_period: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let owner = tx_context::sender(ctx);
    //todo
    let password_hash = password;
    let current_time = clock::timestamp_ms(clock);

    // 创建新保险箱
    let vault_uid = object::new(ctx);
    let vault_id = object::uid_to_inner(&vault_uid);
    let vault_address = object::uid_to_address(&vault_uid);

    let vault = Vault {
        id: vault_uid,
        password_hash,
        owner,
        verifier_address,
        status: VAULT_LOCKED,
        verification_expire_epoch: 0,
        last_operation_epoch: tx_context::epoch(ctx),
        cooldown_period,
        name,
        emergency_unlock_time: 0,
        emergency_active: false,
        created_at: current_time,
        temp_unlock_expiry: 0,
    };

    // 更新用户的保险箱列表
    if (!table::contains(&pool.user_vaults, owner)) {
        table::add(&mut pool.user_vaults, owner, vector::empty<address>());
    };
    let user_vaults = table::borrow_mut(&mut pool.user_vaults, owner);
    vector::push_back(user_vaults, vault_address);

    // 更新验证者的保险箱列表
    if (!table::contains(&pool.verifier_vaults, verifier_address)) {
        table::add(&mut pool.verifier_vaults, verifier_address, vector::empty<address>());
    };
    let verifier_vaults = table::borrow_mut(&mut pool.verifier_vaults, verifier_address);
    vector::push_back(verifier_vaults, vault_address);

    // 将保险箱添加到集合中
    vector::push_back(&mut pool.vaults, vault_address);
    pool.total_vaults = pool.total_vaults + 1;

    // 创建验证者凭证
    let verifier_cap = VerifierCap {
        id: object::new(ctx),
        vault_id: object::uid_to_inner(&vault.id),
        owner,
        verifier: verifier_address,
    };

    // 转移保险箱到用户，发送验证者凭证给验证者
    transfer::transfer(vault, owner);
    transfer::transfer(verifier_cap, verifier_address);

    // 发出创建事件
    event::emit(VaultCreated {
        vault_id,
        owner,
        verifier: verifier_address,
        amount: 0,
    });
}

// 向保险箱存入代币
public entry fun deposit_coin<T>(vault: &mut Vault, coin: Coin<T>, ctx: &mut TxContext) {
    let sender = tx_context::sender(ctx);
    assert!(sender == vault.owner, ENotOwner);

    let amount = coin::value(&coin);
    let type_name = type_name::get<T>();
    let total;

    // 检查是否已存在该类型的代币余额
    if (dynamic_field::exists_(&vault.id, type_name)) {
        let balance = dynamic_field::borrow_mut<TypeName, Balance<T>>(&mut vault.id, type_name);
        balance::join(balance, coin::into_balance(coin));
        total = balance::value(balance);
    } else {
        dynamic_field::add(&mut vault.id, type_name, coin::into_balance(coin));
        total = amount;
    };

    // 发出存款事件
    event::emit(CoinDeposited {
        vault_id: object::uid_to_inner(&vault.id),
        owner: vault.owner,
        coin_type: type_name,
        amount,
        new_balance: total,
    });
}

// 请求验证
public entry fun request_verification(
    vault: &mut Vault,
    verification_window: u64,
    ctx: &mut TxContext,
) {
    let sender = tx_context::sender(ctx);

    // 验证所有权
    assert!(sender == vault.owner, ENotOwner);

    // 检查冷却期
    let current_epoch = tx_context::epoch(ctx);
    assert!(current_epoch >= vault.last_operation_epoch + vault.cooldown_period, ECooldownNotMet);

    // 设置验证状态
    vault.status = VAULT_PENDING_VERIFICATION;
    vault.verification_expire_epoch = current_epoch + verification_window;
    vault.last_operation_epoch = current_epoch;

    // 发出验证请求事件
    event::emit(VerificationRequested {
        vault_id: object::uid_to_inner(&vault.id),
        owner: vault.owner,
        verifier: vault.verifier_address,
        expire_epoch: vault.verification_expire_epoch,
    });
}

// 验证保险箱
public entry fun verify_vault(vault: &mut Vault, cap: &VerifierCap, ctx: &mut TxContext) {
    let sender = tx_context::sender(ctx);

    // 验证身份和凭证
    assert!(sender == vault.verifier_address, ENotVerifier);
    assert!(cap.vault_id == object::uid_to_inner(&vault.id), ENotVerifier);
    assert!(cap.owner == vault.owner, ENotVerifier);

    // 检查状态
    assert!(vault.status == VAULT_PENDING_VERIFICATION, EVerificationNotActive);

    // 检查是否已过期
    let current_epoch = tx_context::epoch(ctx);
    assert!(current_epoch <= vault.verification_expire_epoch, EVerificationExpired);

    // 更新状态
    vault.status = VAULT_VERIFIED;
}

// 解锁并提取代币
public entry fun withdraw_coin<T>(
    vault: &mut Vault,
    password: vector<u8>,
    amount: u64,
    recipient: address,
    ctx: &mut TxContext,
) {
    let sender = tx_context::sender(ctx);

    // 验证所有权
    assert!(sender == vault.owner, ENotOwner);

    // 验证状态
    assert!(vault.status == VAULT_VERIFIED, EVerificationNotActive);

    // 验证密码 todo
    let input_hash = password;
    assert!(input_hash == vault.password_hash, EIncorrectPassword);

    // 获取代币类型
    let type_name = type_name::get<T>();

    // 确保存在该类型的代币
    assert!(dynamic_field::exists_(&vault.id, type_name), ENotFound);

    // 获取余额
    let balance = dynamic_field::borrow_mut<TypeName, Balance<T>>(&mut vault.id, type_name);

    // 确保余额足够
    let available = balance::value(balance);
    assert!(amount <= available, EInsufficientFunds);

    // 提取代币
    let withdrawn_balance = balance::split(balance, amount);
    let withdrawn_coin = coin::from_balance(withdrawn_balance, ctx);

    // 计算剩余余额
    let remaining = balance::value(balance);

    // 重置状态
    vault.status = VAULT_LOCKED;
    vault.last_operation_epoch = tx_context::epoch(ctx);

    // 发出提款事件
    event::emit(CoinWithdrawn {
        vault_id: object::uid_to_inner(&vault.id),
        owner: sender,
        coin_type: type_name,
        amount,
        remaining,
    });

    // 将代币转给接收者
    transfer::public_transfer(withdrawn_coin, recipient);
}

// 临时解锁以进行PTB操作
public entry fun temp_unlock_for_ptb(
    vault: &mut Vault,
    password: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let sender = tx_context::sender(ctx);

    // 验证所有权
    assert!(sender == vault.owner, ENotOwner);

    // 验证状态
    assert!(vault.status == VAULT_VERIFIED, EVerificationNotActive);

    // 验证密码 todo
    let input_hash = password;
    assert!(input_hash == vault.password_hash, EIncorrectPassword);

    // 设置临时解锁状态和过期时间
    let current_time = clock::timestamp_ms(clock);
    vault.status = VAULT_TEMP_UNLOCKED;
    vault.temp_unlock_expiry = current_time + TEMP_UNLOCK_TIMEOUT_MS;

    // 发出临时解锁事件
    event::emit(VaultTempUnlocked {
        vault_id: object::uid_to_inner(&vault.id),
        owner: sender,
        expiry_time: vault.temp_unlock_expiry,
    });
}

// 获取代币用于PTB操作
public fun borrow_coin_for_ptb<T>(
    vault: &mut Vault,
    amount: u64,
    clock: &Clock,
    ctx: &mut TxContext,
): Coin<T> {
    let sender = tx_context::sender(ctx);

    // 验证所有权
    assert!(sender == vault.owner, ENotOwner);

    // 验证临时解锁状态
    assert!(vault.status == VAULT_TEMP_UNLOCKED, EVerificationNotActive);

    // 检查临时解锁是否过期
    let current_time = clock::timestamp_ms(clock);
    assert!(current_time <= vault.temp_unlock_expiry, EVerificationExpired);

    // 获取代币类型
    let type_name = type_name::get<T>();

    // 确保存在该类型的代币
    assert!(dynamic_field::exists_(&vault.id, type_name), ENotFound);

    // 获取余额
    let balance = dynamic_field::borrow_mut<TypeName, Balance<T>>(&mut vault.id, type_name);

    // 确保余额足够
    let available = balance::value(balance);
    assert!(amount <= available, EInsufficientFunds);

    // 提取代币
    let withdrawn_balance = balance::split(balance, amount);
    coin::from_balance(withdrawn_balance, ctx)
}

// 在PTB中存入代币
public fun deposit_coin_to_ptb<T>(
    vault: &mut Vault,
    coin: Coin<T>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let sender = tx_context::sender(ctx);

    // 验证所有权
    assert!(sender == vault.owner, ENotOwner);

    // 验证临时解锁状态
    assert!(vault.status == VAULT_TEMP_UNLOCKED, EVerificationNotActive);

    // 检查临时解锁是否过期
    let current_time = clock::timestamp_ms(clock);
    assert!(current_time <= vault.temp_unlock_expiry, EVerificationExpired);

    // 获取代币类型
    let type_name = type_name::get<T>();
    let amount = coin::value(&coin);
    let total;

    // 检查是否已存在该类型的代币余额
    if (dynamic_field::exists_(&vault.id, type_name)) {
        let balance = dynamic_field::borrow_mut<TypeName, Balance<T>>(&mut vault.id, type_name);
        balance::join(balance, coin::into_balance(coin));
        total = balance::value(balance);
    } else {
        dynamic_field::add(&mut vault.id, type_name, coin::into_balance(coin));
        total = amount;
    };

    // 发出存款事件
    event::emit(CoinDeposited {
        vault_id: object::uid_to_inner(&vault.id),
        owner: sender,
        coin_type: type_name,
        amount,
        new_balance: total,
    });
}

// 锁回保险箱
public entry fun relock_after_ptb(vault: &mut Vault, clock: &Clock, ctx: &mut TxContext) {
    let sender = tx_context::sender(ctx);

    // 验证所有权
    assert!(sender == vault.owner, ENotOwner);

    // 验证临时解锁状态
    assert!(vault.status == VAULT_TEMP_UNLOCKED, EVerificationNotActive);

    // 锁回
    vault.status = VAULT_LOCKED;
    vault.last_operation_epoch = tx_context::epoch(ctx);

    // 发出锁回事件
    event::emit(VaultRelocked {
        vault_id: object::uid_to_inner(&vault.id),
        owner: sender,
        timestamp: clock::timestamp_ms(clock),
    });
}

// 发起紧急解锁
public entry fun initiate_emergency_unlock(
    vault: &mut Vault,
    delay_hours: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let sender = tx_context::sender(ctx);

    // 验证所有权
    assert!(sender == vault.owner, ENotOwner);

    // 检查是否已经发起
    assert!(!vault.emergency_active, EAlreadyInitiated);

    // 设置紧急解锁状态
    vault.emergency_active = true;
    let current_time = clock::timestamp_ms(clock);
    vault.emergency_unlock_time = current_time + (delay_hours * 3600000); // 毫秒
    vault.status = VAULT_EMERGENCY_PENDING;

    // 发出紧急解锁请求事件
    event::emit(EmergencyUnlockInitiated {
        vault_id: object::uid_to_inner(&vault.id),
        owner: sender,
        unlock_time: vault.emergency_unlock_time,
    });
}

// 取消紧急解锁
public entry fun cancel_emergency_unlock(vault: &mut Vault, clock: &Clock, ctx: &mut TxContext) {
    let sender = tx_context::sender(ctx);

    // 验证所有权
    assert!(sender == vault.owner, ENotOwner);

    // 检查是否处于紧急状态
    assert!(vault.emergency_active, EVerificationNotActive);

    // 取消紧急解锁
    vault.emergency_active = false;
    vault.emergency_unlock_time = 0;
    vault.status = VAULT_LOCKED;

    // 发出取消事件
    event::emit(EmergencyUnlockCancelled {
        vault_id: object::uid_to_inner(&vault.id),
        owner: sender,
        timestamp: clock::timestamp_ms(clock),
    });
}

// 执行紧急解锁
public entry fun execute_emergency_unlock<T>(
    vault: &mut Vault,
    password: vector<u8>,
    amount: u64,
    clock: &Clock,
    recipient: address,
    ctx: &mut TxContext,
) {
    let sender = tx_context::sender(ctx);

    // 验证所有权
    assert!(sender == vault.owner, ENotOwner);

    // 检查是否处于紧急状态
    assert!(vault.emergency_active, EVerificationNotActive);

    // 检查时间是否到达
    let current_time = clock::timestamp_ms(clock);
    assert!(current_time >= vault.emergency_unlock_time, EVerificationExpired);

    // 验证密码 todo
    let input_hash = password;
    assert!(input_hash == vault.password_hash, EIncorrectPassword);

    // 获取代币类型
    let type_name = type_name::get<T>();

    // 确保存在该类型的代币
    assert!(dynamic_field::exists_(&vault.id, type_name), ENotFound);

    // 获取余额
    let balance = dynamic_field::borrow_mut<TypeName, Balance<T>>(&mut vault.id, type_name);

    // 确保余额足够
    let available = balance::value(balance);
    assert!(amount <= available, EInsufficientFunds);

    // 提取代币
    let withdrawn_balance = balance::split(balance, amount);
    let withdrawn_coin = coin::from_balance(withdrawn_balance, ctx);

    // 计算剩余余额
    let remaining = balance::value(balance);

    // 重置紧急状态
    vault.emergency_active = false;
    vault.emergency_unlock_time = 0;
    vault.status = VAULT_LOCKED;

    // 发出提款事件
    event::emit(CoinWithdrawn {
        vault_id: object::uid_to_inner(&vault.id),
        owner: sender,
        coin_type: type_name,
        amount,
        remaining,
    });

    // 将代币转给接收者
    transfer::public_transfer(withdrawn_coin, recipient);
}

// 更换验证者 todo
public fun change_verifier(
    vault: &mut Vault,
    pool: &mut VaultPool,
    password: vector<u8>,
    new_verifier: address,
    old_cap: VerifierCap,
    ctx: &mut TxContext,
) {
    let sender = tx_context::sender(ctx);

    // 验证所有权
    assert!(sender == vault.owner, ENotOwner);

    // 验证密码 todo
    let input_hash = password;
    assert!(input_hash == vault.password_hash, EIncorrectPassword);

    // 验证旧凭证
    assert!(old_cap.vault_id == object::uid_to_inner(&vault.id), ENotVerifier);
    assert!(old_cap.owner == vault.owner, ENotVerifier);
    assert!(old_cap.verifier == vault.verifier_address, ENotVerifier);

    // 从旧验证者列表中移除
    let vault_id_address = object::uid_to_address(&vault.id);

    if (table::contains(&pool.verifier_vaults, vault.verifier_address)) {
        let verifier_vaults = table::borrow_mut(&mut pool.verifier_vaults, vault.verifier_address);
        let (found, index) = vector::index_of(verifier_vaults, &vault_id_address);
        if (found) {
            vector::remove(verifier_vaults, index);
        };
    };

    // 更新验证者地址
    let old_verifier = vault.verifier_address;
    vault.verifier_address = new_verifier;

    // 添加到新验证者列表
    if (!table::contains(&pool.verifier_vaults, new_verifier)) {
        table::add(&mut pool.verifier_vaults, new_verifier, vector::empty<address>());
    };
    let verifier_vaults = table::borrow_mut(&mut pool.verifier_vaults, new_verifier);
    vector::push_back(verifier_vaults, vault_id_address);

    // 创建新验证者凭证
    let new_cap = VerifierCap {
        id: object::new(ctx),
        vault_id: object::uid_to_inner(&vault.id),
        owner: vault.owner,
        verifier: new_verifier,
    };

    // 发出验证者变更事件
    event::emit(VerifierChanged {
        vault_id: object::uid_to_inner(&vault.id),
        owner: vault.owner,
        old_verifier,
        new_verifier,
    });

    // 销毁旧凭证，转移新凭证
    let VerifierCap { id, vault_id: _, owner: _, verifier: _ } = old_cap;
    object::delete(id);
    transfer::transfer(new_cap, new_verifier);
}

// 获取保险箱信息
public fun get_vault_info<T>(vault: &Vault): (address, address, String, u64, u8, u64, bool) {
    let type_name = type_name::get<T>();
    let balance = if (dynamic_field::exists_(&vault.id, type_name)) {
        balance::value(dynamic_field::borrow<TypeName, Balance<T>>(&vault.id, type_name))
    } else {
        0
    };

    (
        vault.owner,
        vault.verifier_address,
        vault.name,
        balance,
        vault.status,
        vault.created_at,
        vault.emergency_active,
    )
}

// 获取用户的所有保险箱
public fun get_user_vaults(pool: &VaultPool, user: address): vector<address> {
    if (table::contains(&pool.user_vaults, user)) {
        *table::borrow(&pool.user_vaults, user)
    } else {
        vector::empty<address>()
    }
}

// 获取验证者的所有保险箱
public fun get_verifier_vaults(pool: &VaultPool, verifier: address): vector<address> {
    if (table::contains(&pool.verifier_vaults, verifier)) {
        *table::borrow(&pool.verifier_vaults, verifier)
    } else {
        vector::empty<address>()
    }
}

// 获取特定代币在保险箱中的余额
public fun get_coin_balance<T>(vault: &Vault): u64 {
    let type_name = type_name::get<T>();
    if (dynamic_field::exists_(&vault.id, type_name)) {
        balance::value(dynamic_field::borrow<TypeName, Balance<T>>(&vault.id, type_name))
    } else {
        0
    }
}
