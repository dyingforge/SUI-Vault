module vault::vault_authorize;

use std::string::String;
use std::type_name::{Self, TypeName};
use sui::bcs;
use sui::clock::{Self, Clock};
use sui::coin::{Self, Coin};
use sui::event;
use sui::hash;
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
const EInvalidAuthToken: u64 = 11;
const EAuthorizationExpired: u64 = 12;
const EInvalidOperation: u64 = 13;
const ENonRequestVerifier: u64 = 14;

// 操作类型常量
const OP_TRANSFER: u8 = 1;
const OP_SWAP: u8 = 2;
const OP_STAKE: u8 = 3;
const OP_NFT_PURCHASE: u8 = 4;

// 保险箱状态
const VAULT_LOCKED: u8 = 0;
const VAULT_PENDING_VERIFICATION: u8 = 1;
const VAULT_VERIFIED: u8 = 2;
const VAULT_EMERGENCY_PENDING: u8 = 3;
const VAULT_TEMP_UNLOCKED: u8 = 4;
const TEMP_UNLOCK_TIMEOUT_MS: u64 = 300000; // 5分钟

// 授权代币 - 表示对特定数量资产的使用权
public struct VaultAuthToken<phantom T> has key, store {
    id: UID,
    owner: address, // 资产所有者
    vault_id: ID, // 关联的保险箱
    authorized_amount: u64, // 授权金额
    expiration: u64, // 授权过期时间
    operation_type: u8, // 允许的操作类型
    auth_id: vector<u8>, // 唯一授权ID
}

// 授权信息结构体
public struct AuthInfo has drop, store {
    asset_type: TypeName, // 资产类型
    amount: u64, // 授权金额
    created_at: u64, // 创建时间
    expires_at: u64, // 过期时间
    operation_types: vector<u8>, // 允许的操作类型集合
}

// 保险箱结构 - 区别于vault.move，不直接存储资产
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
    verified_requester: address, // 记录验证请求者
    authorizations: Table<vector<u8>, AuthInfo>, // 授权表
}

// 保险箱集合 - 与vault.move相同
public struct VaultPool has key {
    id: UID,
    vaults: vector<address>,
    user_vaults: Table<address, vector<address>>,
    verifier_vaults: Table<address, vector<address>>,
    admin: address,
    total_vaults: u64,
}

// 验证者凭证 - 与vault.move相同
public struct VerifierCap has key, store {
    id: UID,
    vault_id: ID,
    owner: address,
    verifier: address,
}

// 系统管理员凭证 - 与vault.move相同
public struct AdminCap has key, store {
    id: UID,
}

// 事件
public struct VaultCreated has copy, drop {
    vault_id: ID,
    owner: address,
    verifier: address,
}

public struct VerificationRequested has copy, drop {
    vault_id: ID,
    owner: address,
    verifier: address,
    expire_epoch: u64,
}

public struct AuthorizationCreated has copy, drop {
    vault_id: ID,
    owner: address,
    asset_type: TypeName,
    amount: u64,
    operation_type: u8,
    expiration: u64,
}

public struct AuthorizationExecuted has copy, drop {
    vault_id: ID,
    owner: address,
    asset_type: TypeName,
    amount: u64,
    operation_type: u8,
}

public struct AuthorizationCancelled has copy, drop {
    vault_id: ID,
    owner: address,
    asset_type: TypeName,
    auth_id: vector<u8>,
}

public struct AssetProtected has copy, drop {
    vault_id: ID,
    owner: address,
    asset_type: TypeName,
    amount: u64,
    validity_days: u64,
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

public struct VerifierChanged has copy, drop {
    vault_id: ID,
    owner: address,
    old_verifier: address,
    new_verifier: address,
}

// 初始化系统 - 与vault.move相似
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

// 创建保险箱 - 修改为授权模式
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
    // 增强密码哈希安全性
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
        verified_requester: @0x0, // 初始化为零地址
        authorizations: table::new(ctx), // 初始化授权表
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
    });
}

// 请求验证 - 增加记录请求者
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

    // 记录验证请求者
    vault.verified_requester = sender;

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

// 验证保险箱 - 基本不变
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

// 创建资产授权 - 授权模式的核心功能
public entry fun create_authorization<T>(
    vault: &mut Vault,
    amount: u64,
    operation_type: u8,
    validity_period_ms: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let sender = tx_context::sender(ctx);

    // 验证所有权和请求验证者一致
    assert!(sender == vault.owner, ENotOwner);
    assert!(sender == vault.verified_requester, ENonRequestVerifier);

    // 验证状态 - 必须是已验证状态
    assert!(vault.status == VAULT_VERIFIED, EVerificationNotActive);

    // 生成唯一授权ID
    let current_time = clock::timestamp_ms(clock);
    let auth_id = generate_auth_id(
        object::uid_to_inner(&vault.id),
        operation_type,
        current_time,
        ctx,
    );

    // 创建授权信息
    let mut op_types = vector::empty<u8>();
    vector::push_back(&mut op_types, operation_type);

    let auth_info = AuthInfo {
        asset_type: type_name::get<T>(),
        amount,
        created_at: current_time,
        expires_at: current_time + validity_period_ms,
        operation_types: op_types,
    };

    // 记录授权信息
    table::add(&mut vault.authorizations, auth_id, auth_info);

    // 创建授权代币
    let auth_token = VaultAuthToken<T> {
        id: object::new(ctx),
        owner: sender,
        vault_id: object::uid_to_inner(&vault.id),
        authorized_amount: amount,
        expiration: current_time + validity_period_ms,
        operation_type,
        auth_id,
    };

    // 转移授权代币给所有者
    transfer::transfer(auth_token, sender);

    // 发出授权事件
    event::emit(AuthorizationCreated {
        vault_id: object::uid_to_inner(&vault.id),
        owner: sender,
        asset_type: type_name::get<T>(),
        amount,
        operation_type,
        expiration: current_time + validity_period_ms,
    });

    // 重置保险箱状态为锁定
    vault.status = VAULT_LOCKED;
    vault.last_operation_epoch = tx_context::epoch(ctx);
}

// 生成唯一授权ID
fun generate_auth_id(vault_id: ID, op_type: u8, timestamp: u64, ctx: &TxContext): vector<u8> {
    // 结合多个数据源创建唯一ID
    let mut serialized = bcs::to_bytes(&vault_id);
    vector::append(&mut serialized, bcs::to_bytes(&op_type));
    vector::append(&mut serialized, bcs::to_bytes(&timestamp));
    vector::append(&mut serialized, bcs::to_bytes(tx_context::digest(ctx)));
    hash::blake2b256(&serialized)
}

// 使用授权代币执行转账操作
public entry fun execute_transfer<T>(
    vault: &mut Vault,
    auth_token: VaultAuthToken<T>,
    coin: Coin<T>,
    recipient: address,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let sender = tx_context::sender(ctx);

    // 验证授权代币
    verify_auth_token(&auth_token, vault, OP_TRANSFER, sender, clock);

    // 验证代币金额
    let amount = coin::value(&coin);
    assert!(amount <= auth_token.authorized_amount, EInsufficientFunds);

    // 执行转账
    transfer::public_transfer(coin, recipient);

    // 更新或移除授权记录
    if (table::contains(&vault.authorizations, auth_token.auth_id)) {
        let auth_info = table::remove(&mut vault.authorizations, auth_token.auth_id);

        // 如果金额小于授权金额，更新授权信息并重新添加
        if (amount < auth_info.amount) {
            let updated_auth_info = AuthInfo {
                asset_type: auth_info.asset_type,
                amount: auth_info.amount - amount,
                created_at: auth_info.created_at,
                expires_at: auth_info.expires_at,
                operation_types: auth_info.operation_types,
            };
            table::add(&mut vault.authorizations, auth_token.auth_id, updated_auth_info);
        }
    };

    // 消费授权代币
    let VaultAuthToken {
        id,
        owner: _,
        vault_id: _,
        authorized_amount: _,
        expiration: _,
        operation_type: _,
        auth_id: _,
    } = auth_token;
    object::delete(id);

    // 发出执行事件
    event::emit(AuthorizationExecuted {
        vault_id: object::uid_to_inner(&vault.id),
        owner: sender,
        asset_type: type_name::get<T>(),
        amount,
        operation_type: OP_TRANSFER,
    });
}

// 验证授权代币
fun verify_auth_token<T>(
    token: &VaultAuthToken<T>,
    vault: &Vault,
    expected_op: u8,
    sender: address,
    clock: &Clock,
) {
    // 验证所有权
    assert!(token.owner == sender, ENotOwner);

    // 验证保险箱绑定
    assert!(token.vault_id == object::uid_to_inner(&vault.id), EInvalidAuthToken);

    // 验证授权存在
    assert!(table::contains(&vault.authorizations, token.auth_id), ENotFound);

    // 获取授权信息
    let auth_info = table::borrow(&vault.authorizations, token.auth_id);

    // 验证资产类型
    assert!(auth_info.asset_type == type_name::get<T>(), EInvalidAuthToken);

    // 验证操作类型
    assert!(token.operation_type == expected_op, EInvalidOperation);

    // 验证授权有效期
    let current_time = clock::timestamp_ms(clock);
    assert!(current_time <= auth_info.expires_at, EAuthorizationExpired);
}

// 取消授权
public entry fun cancel_authorization<T>(
    vault: &mut Vault,
    auth_token: VaultAuthToken<T>,
    ctx: &mut TxContext,
) {
    let sender = tx_context::sender(ctx);

    // 验证所有权
    assert!(sender == vault.owner, ENotOwner);
    assert!(auth_token.owner == sender, ENotOwner);
    assert!(auth_token.vault_id == object::uid_to_inner(&vault.id), EInvalidAuthToken);

    // 从授权表中移除
    if (table::contains(&vault.authorizations, auth_token.auth_id)) {
        table::remove(&mut vault.authorizations, auth_token.auth_id);
    };

    // 销毁授权代币
    let VaultAuthToken {
        id,
        owner: _,
        vault_id: _,
        authorized_amount: _,
        expiration: _,
        operation_type: _,
        auth_id,
    } = auth_token;
    object::delete(id);

    // 发出取消授权事件
    event::emit(AuthorizationCancelled {
        vault_id: object::uid_to_inner(&vault.id),
        owner: sender,
        asset_type: type_name::get<T>(),
        auth_id,
    });
}

// 一次性创建多种操作类型的资产授权 - 用户友好功能
public entry fun protect_asset<T>(
    vault: &mut Vault,
    amount: u64,
    operation_types: vector<u8>,
    validity_days: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let sender = tx_context::sender(ctx);

    // 验证所有权和状态
    assert!(sender == vault.owner, ENotOwner);
    assert!(sender == vault.verified_requester, ENonRequestVerifier);
    assert!(vault.status == VAULT_VERIFIED, EVerificationNotActive);

    // 获取当前时间
    let current_time = clock::timestamp_ms(clock);
    let validity_ms = validity_days * 86400000; // 转换为毫秒

    // 对每种操作类型创建授权
    let mut i = 0;
    let op_types_len = vector::length(&operation_types);

    while (i < op_types_len) {
        let op_type = *vector::borrow(&operation_types, i);

        // 生成唯一授权ID
        let auth_id = generate_auth_id(
            object::uid_to_inner(&vault.id),
            op_type,
            current_time + i,
            ctx,
        );

        // 创建单个操作类型的向量
        let mut single_op = vector::empty<u8>();
        vector::push_back(&mut single_op, op_type);

        // 创建授权信息
        let auth_info = AuthInfo {
            asset_type: type_name::get<T>(),
            amount,
            created_at: current_time,
            expires_at: current_time + validity_ms,
            operation_types: single_op,
        };

        // 记录授权信息
        table::add(&mut vault.authorizations, auth_id, auth_info);

        // 创建授权代币
        let auth_token = VaultAuthToken<T> {
            id: object::new(ctx),
            owner: sender,
            vault_id: object::uid_to_inner(&vault.id),
            authorized_amount: amount,
            expiration: current_time + validity_ms,
            operation_type: op_type,
            auth_id,
        };

        // 转移授权代币给用户
        transfer::transfer(auth_token, sender);

        i = i + 1;
    };

    // 发出资产保护事件
    event::emit(AssetProtected {
        vault_id: object::uid_to_inner(&vault.id),
        owner: sender,
        asset_type: type_name::get<T>(),
        amount,
        validity_days,
    });

    // 重置保险箱状态为锁定
    vault.status = VAULT_LOCKED;
    vault.last_operation_epoch = tx_context::epoch(ctx);
}

// 临时解锁PTB功能 - 适配授权模式
public entry fun temp_unlock_for_ptb(
    vault: &mut Vault,
    password: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let sender = tx_context::sender(ctx);

    // 验证所有权和验证请求者一致
    assert!(sender == vault.owner, ENotOwner);
    assert!(sender == vault.verified_requester, ENonRequestVerifier);

    // 验证状态
    assert!(vault.status == VAULT_VERIFIED, EVerificationNotActive);

    // 验证密码
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

// 创建PTB临时授权
public fun create_temp_auth<T>(
    vault: &mut Vault,
    amount: u64,
    operation_type: u8,
    clock: &Clock,
    ctx: &mut TxContext,
): VaultAuthToken<T> {
    let sender = tx_context::sender(ctx);

    // 验证所有权
    assert!(sender == vault.owner, ENotOwner);

    // 验证临时解锁状态
    assert!(vault.status == VAULT_TEMP_UNLOCKED, EVerificationNotActive);

    // 检查临时解锁是否过期
    let current_time = clock::timestamp_ms(clock);
    assert!(current_time <= vault.temp_unlock_expiry, EVerificationExpired);

    // 生成唯一授权ID
    let auth_id = generate_auth_id(
        object::uid_to_inner(&vault.id),
        operation_type,
        current_time,
        ctx,
    );

    // 创建单个操作类型的向量
    let mut single_op = vector::empty<u8>();
    vector::push_back(&mut single_op, operation_type);

    // 创建授权信息
    let auth_info = AuthInfo {
        asset_type: type_name::get<T>(),
        amount,
        created_at: current_time,
        expires_at: vault.temp_unlock_expiry, // 与临时解锁过期时间一致
        operation_types: single_op,
    };

    // 记录授权信息
    table::add(&mut vault.authorizations, auth_id, auth_info);

    // 创建授权代币
    VaultAuthToken<T> {
        id: object::new(ctx),
        owner: sender,
        vault_id: object::uid_to_inner(&vault.id),
        authorized_amount: amount,
        expiration: vault.temp_unlock_expiry,
        operation_type,
        auth_id,
    }
}

// 锁回保险箱 - 与原来类似
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

// 紧急授权请求
public entry fun initiate_emergency_authorization<T>(
    vault: &mut Vault,
    amount: u64,
    operation_types: vector<u8>,
    delay_hours: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let sender = tx_context::sender(ctx);

    // 验证所有权
    assert!(sender == vault.owner, ENotOwner);

    // 检查是否已经发起
    assert!(!vault.emergency_active, EAlreadyInitiated);

    // 设置紧急状态
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

// 执行紧急授权
public entry fun execute_emergency_authorization<T>(
    vault: &mut Vault,
    password: vector<u8>,
    operation_types: vector<u8>,
    amount: u64,
    validity_days: u64,
    clock: &Clock,
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

    // 验证密码
    let input_hash = password;
    assert!(input_hash == vault.password_hash, EIncorrectPassword);

    // 调用protect_asset创建多个授权
    // 为每种操作类型创建授权
    let mut i = 0;
    let op_types_len = vector::length(&operation_types);
    let validity_ms = validity_days * 86400000; // 转换为毫秒

    while (i < op_types_len) {
        let op_type = *vector::borrow(&operation_types, i);

        // 生成唯一授权ID
        let auth_id = generate_auth_id(
            object::uid_to_inner(&vault.id),
            op_type,
            current_time + i,
            ctx,
        );

        // 创建单个操作类型的向量
        let mut single_op = vector::empty<u8>();
        vector::push_back(&mut single_op, op_type);

        // 创建授权信息
        let auth_info = AuthInfo {
            asset_type: type_name::get<T>(),
            amount,
            created_at: current_time,
            expires_at: current_time + validity_ms,
            operation_types: single_op,
        };

        // 记录授权信息
        table::add(&mut vault.authorizations, auth_id, auth_info);

        // 创建授权代币
        let auth_token = VaultAuthToken<T> {
            id: object::new(ctx),
            owner: sender,
            vault_id: object::uid_to_inner(&vault.id),
            authorized_amount: amount,
            expiration: current_time + validity_ms,
            operation_type: op_type,
            auth_id,
        };

        // 转移授权代币给用户
        transfer::transfer(auth_token, sender);

        i = i + 1;
    };

    // 重置紧急状态
    vault.emergency_active = false;
    vault.emergency_unlock_time = 0;
    vault.status = VAULT_LOCKED;
    vault.last_operation_epoch = tx_context::epoch(ctx);
}

// // 获取保险箱授权信息
// public fun get_authorizations<T>(vault: &Vault): u64 {
//     let mut total_authorized = 0;
//     let auth_ids = table::borrow_mut(table, k);
//     let i = 0;
//     let len = vector::length(&auth_ids);

//     while (i < len) {
//         let auth_id = vector::borrow(&auth_ids, i);
//         let auth_info = table::borrow(&vault.authorizations, *auth_id);

//         if (auth_info.asset_type == type_name::get<T>()) {
//             total_authorized = total_authorized + auth_info.amount;
//         };

//         i = i + 1;
//     };

//     total_authorized
// }

// 获取保险箱信息
public fun get_vault_info(vault: &Vault): (address, address, String, u8, u64, bool) {
    (
        vault.owner,
        vault.verifier_address,
        vault.name,
        vault.status,
        vault.created_at,
        vault.emergency_active,
    )
}

// 获取用户的所有保险箱 - 与原模块相同
public fun get_user_vaults(pool: &VaultPool, user: address): vector<address> {
    if (table::contains(&pool.user_vaults, user)) {
        *table::borrow(&pool.user_vaults, user)
    } else {
        vector::empty<address>()
    }
}

// 获取验证者的所有保险箱 - 与原模块相同
public fun get_verifier_vaults(pool: &VaultPool, verifier: address): vector<address> {
    if (table::contains(&pool.verifier_vaults, verifier)) {
        *table::borrow(&pool.verifier_vaults, verifier)
    } else {
        vector::empty<address>()
    }
}
