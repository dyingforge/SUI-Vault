import { createBetterTxFactory, networkConfig, suiClient } from "./index";
import {isValidSuiAddress} from "@mysten/sui/utils";

// public entry fun create_vault(
//     pool: &mut VaultPool,
//     verifier_address: address,
//     clock: &Clock,
//     name: String,
//     ctx: &mut TxContext,
// ) {
//     let owner = tx_context::sender(ctx);

//     // 创建新保险箱
//     let vault_uid = object::new(ctx);
//     let vault_id = object::uid_to_inner(&vault_uid);
//     let vault_address = object::uid_to_address(&vault_uid);

//     let vault = Vault {
//         id: vault_uid,
//         owner,
//         verifier_address,
//         status: VAULT_LOCKED,
//         verification_expire_epoch: 0,
//         created_at: clock::timestamp_ms(clock), // 添加创建时间
//         last_operation_epoch: tx_context::epoch(ctx),
//         // last_verification_epoch: 0,
//         recipient: owner,
//         name,
//         send_amount: 0,
//         emergency_unlock_time: 0,
//         emergency_active: false,
//         temp_unlock_expiry: 0,
//     };

//     // 更新用户的保险箱列表
//     if (!table::contains(&pool.user_vaults, owner)) {
//         table::add(&mut pool.user_vaults, owner, vector::empty<address>());
//     };
//     let user_vaults = table::borrow_mut(&mut pool.user_vaults, owner);
//     vector::push_back(user_vaults, vault_address);

//     // 更新验证者的保险箱列表
//     if (!table::contains(&pool.verifier_vaults, verifier_address)) {
//         table::add(&mut pool.verifier_vaults, verifier_address, vector::empty<address>());
//     };
//     let verifier_vaults = table::borrow_mut(&mut pool.verifier_vaults, verifier_address);
//     vector::push_back(verifier_vaults, vault_address);

//     // 将保险箱添加到集合中
//     vector::push_back(&mut pool.vaults, vault_address);
//     pool.total_vaults = pool.total_vaults + 1;

//     // 创建验证者凭证
//     let verifier_cap = VerifierCap {
//         id: object::new(ctx),
//         vault_id: object::uid_to_inner(&vault.id),
//         owner,
//         verifier: verifier_address,
//     };

//     // 转移保险箱到用户，发送验证者凭证给验证者
//     transfer::share_object(vault);
//     transfer::transfer(verifier_cap, verifier_address);

//     // 发出创建事件
//     event::emit(VaultCreated {
//         vault_id,
//         owner,
//         verifier: verifier_address,
//         amount: 0,
//     });
// }

export const createVaultTx = createBetterTxFactory<{ verifier_address:string, name:string}>((tx, networkVariables, params) => {
    tx.moveCall({
        package: networkVariables.Package,
        module: "vault_host",
        function: "create_vault",
        arguments: [
            tx.object(networkVariables.VaultPool),
            tx.pure.address(params.verifier_address),
            tx.object("0x6"),
            tx.pure.string(params.name),
        ],
    });
    return tx;
});
//   // 发出创建事件


// // 验证并提取代币（原子操作）
// public entry fun verify_and_withdraw<T>(vault: &mut Vault, cap: &VerifierCap, ctx: &mut TxContext) {
//   let sender = tx_context::sender(ctx);

//   // 2. 验证凭证
//   assert!(cap.vault_id == object::uid_to_inner(&vault.id), ENotVerifier);
//   assert!(cap.owner == vault.owner, ENotVerifier);

//   // 3. 验证调用者权限（必须是验证者或所有者）
//   assert!(sender == vault.verifier_address, ENoAuthorizedSender);

//   // 4. 检查验证状态
//   assert!(vault.status == VAULT_PENDING_VERIFICATION, EVerificationNotActive);

//   // 5. 检查是否已过期
//   let current_epoch = tx_context::epoch(ctx);
//   assert!(current_epoch <= vault.verification_expire_epoch, EVerificationExpired);

//   // 7. 执行提取逻辑
//   let type_name = type_name::get<T>();
//   assert!(dynamic_field::exists_(&vault.id, type_name), ENotFound);

//   let balance = dynamic_field::borrow_mut<TypeName, Balance<T>>(&mut vault.id, type_name);
//   let available = balance::value(balance);
//   assert!(vault.send_amount <= available, EInsufficientFunds);

//   let withdrawn_balance = balance::split(balance, vault.send_amount);
//   let withdrawn_coin = coin::from_balance(withdrawn_balance, ctx);
//   let remaining = balance::value(balance);

//   // 8. 重置状态
//   vault.status = VAULT_LOCKED;
//   vault.last_operation_epoch = current_epoch;

//   // 9. 发出提款事件
//   event::emit(CoinWithdrawn {
//       vault_id: object::uid_to_inner(&vault.id),
//       owner: vault.owner,
//       coin_type: type_name,
//       amount: vault.send_amount,
//       remaining,
//   });

//   // 10. 转移代币
//   transfer::public_transfer(withdrawn_coin, vault.recipient);
// }
//   // 11. 发出验证事件
export const verifyAndWithdrawTx = createBetterTxFactory<{vault:string,cap:string,coin_type:string}>((tx, networkVariables, params) => {
    tx.moveCall({
        package: networkVariables.Package,
        module: "vault_host",
        function: "verify_and_withdraw",
        arguments: [
            tx.object(params.vault),
            tx.object(params.cap),
        ],
        typeArguments: [params.coin_type]
    });
    return tx;
});

// // 向保险箱存入代币
// public entry fun deposit_coin<T>(vault: &mut Vault, coin: Coin<T>, ctx: &mut TxContext) {
//   let sender = tx_context::sender(ctx);
//   assert!(sender == vault.owner, ENotOwner);

//   let amount = coin::value(&coin);
//   let type_name = type_name::get<T>();
//   let total;

//   // 检查是否已存在该类型的代币余额
//   if (dynamic_field::exists_(&vault.id, type_name)) {
//       let balance = dynamic_field::borrow_mut<TypeName, Balance<T>>(&mut vault.id, type_name);
//       balance::join(balance, coin::into_balance(coin));
//       total = balance::value(balance);
//   } else {
//       dynamic_field::add(&mut vault.id, type_name, coin::into_balance(coin));
//       total = amount;
//   };

//   // 发出存款事件
//   event::emit(CoinDeposited {
//       vault_id: object::uid_to_inner(&vault.id),
//       owner: vault.owner,
//       coin_type: type_name,
//       amount,
//       new_balance: total,
//   });
// }

export const depositCoinTx = createBetterTxFactory<{vault:string,coin:string,amount:number,coin_type: string}>((tx, networkVariables, params) => {
    if (!isValidSuiAddress(params.vault) ){
        throw new Error("Invalid Sui address");
    }
    console.log("vault", params.coin)
    if (!isValidSuiAddress(params.coin)) {
        throw new Error("Invalid Sui 1address");
    }

        if(params.coin_type === "0x2::sui::SUI"){
        const [depositCoin] =  tx.splitCoins(tx.gas, [tx.pure.u64(params.amount)]);
        tx.moveCall({
            package: networkVariables.Package,
            module: "vault_host",
            function: "deposit_coin",
            arguments: [
                tx.object(params.vault),
                tx.object(depositCoin),
            ],
            typeArguments: [params.coin_type]
        });
        }else{
        const [depositCoin] = tx.splitCoins(tx.object(params.coin), [tx.pure.u64(params.amount)]);
        tx.moveCall({
            package: networkVariables.Package,
            module: "vault_host",
            function: "deposit_coin",
            arguments: [
                tx.object(params.vault),
                tx.object(depositCoin),
            ],
            typeArguments: [params.coin_type]
        });
        }

    return tx;
});

// public entry fun request_verification<T>(
//     vault: &mut Vault,
//     amount: u64,
//     recipient: address,
//     verification_window: u64,
//     ctx: &mut TxContext,
// ) {
//     let sender = tx_context::sender(ctx);

//     // 验证所有权
//     assert!(sender == vault.owner, ENotOwner);

//     let type_name = type_name::get<T>();
//     assert!(dynamic_field::exists_(&vault.id, type_name), ENotFound);
//     let balance = dynamic_field::borrow_mut<TypeName, Balance<T>>(&mut vault.id, type_name);
//     let available = balance::value(balance);
//     assert!(amount <= available, EInsufficientFunds);

//     let current_epoch = tx_context::epoch(ctx);
//     vault.verification_expire_epoch = current_epoch + verification_window;

//     assert!(vault.status == VAULT_LOCKED, EVerificationNotActive);

//     // 设置验证状态
//     vault.status = VAULT_PENDING_VERIFICATION;
//     vault.last_operation_epoch = current_epoch;
//     vault.recipient = recipient;
//     vault.send_amount = amount;

//     // 发出验证请求事件
//     event::emit(VerificationRequested {
//         vault_id: object::uid_to_inner(&vault.id),
//         owner: vault.owner,
//         verifier: vault.verifier_address,
//         expire_epoch: vault.verification_expire_epoch,
//     });
// }

export const requestVerificationTx = createBetterTxFactory<{vault:string,amount:number,recipient:string,verification_window:number,coin_type: string}>((tx, networkVariables, params) => {
    tx.moveCall({
        package: networkVariables.Package,
        module: "vault_host",
        function: "request_verification",
        arguments: [
            tx.object(params.vault),
            tx.pure.u64(params.amount),
            tx.pure.address(params.recipient),
            tx.pure.u64(params.verification_window),
        ],
        typeArguments:[params.coin_type]
    });
    return tx;
}
);


//发起紧急解锁
// public entry fun initiate_emergency_unlock(vault: &mut Vault, clock: &Clock, ctx: &mut TxContext) {
//     let sender = tx_context::sender(ctx);

//     // 验证所有权
//     assert!(sender == vault.owner, ENotOwner);

//     // 检查是否已经发起
//     assert!(!vault.emergency_active, EAlreadyInitiated);

//     assert!(vault.status == VAULT_LOCKED, EVerificationNotActive);

//     // 设置紧急解锁状态
//     vault.emergency_active = true;
//     let current_time = clock::timestamp_ms(clock);
//     vault.emergency_unlock_time = current_time + TEMP_UNLOCK_TIMEOUT_MS; // 1周延迟
//     vault.status = VAULT_EMERGENCY_PENDING;

//     // 发出紧急解锁请求事件
//     event::emit(EmergencyUnlockInitiated {
//         vault_id: object::uid_to_inner(&vault.id),
//         owner: sender,
//         unlock_time: vault.emergency_unlock_time,
//     });
// }

export const initiateEmergencyUnlockTx = createBetterTxFactory<{vault:string}>((tx, networkVariables, params) => {
    tx.moveCall({ 
        package: networkVariables.Package,
        module: "vault_host",
        function: "initiate_emergency_unlock",
        arguments: [
            tx.object(params.vault),
            tx.object("0x8"),
        ],
    });
    return tx;
}
);

// // 取消紧急解锁
// public entry fun cancel_emergency_unlock(vault: &mut Vault, clock: &Clock, ctx: &mut TxContext) {
//   let sender = tx_context::sender(ctx);

//   // 验证所有权
//   assert!(sender == vault.owner, ENotOwner);

//   // 检查是否处于紧急状态
//   assert!(vault.emergency_active, EVerificationNotActive);

//   // 取消紧急解锁
//   vault.emergency_active = false;
//   vault.emergency_unlock_time = 0;
//   vault.status = VAULT_LOCKED;

//   // 发出取消事件
//   event::emit(EmergencyUnlockCancelled {
//       vault_id: object::uid_to_inner(&vault.id),
//       owner: sender,
//       timestamp: clock::timestamp_ms(clock),
//   });
// }

export const cancelEmergencyUnlockTx = createBetterTxFactory<{vault:string}>((tx, networkVariables, params) => {
    tx.moveCall({ 
        package: networkVariables.Package,
        module: "vault_host",
        function: "cancel_emergency_unlock",
        arguments: [
            tx.object(params.vault),
            tx.object("0x8"),
        ],
    });
    return tx;
}
);

// // 执行紧急解锁
// public entry fun execute_emergency_unlock<T>(
//   vault: &mut Vault,
//   password: vector<u8>,
//   amount: u64,
//   clock: &Clock,
//   recipient: address,
//   ctx: &mut TxContext,
// ) {
//   let sender = tx_context::sender(ctx);

//   // 验证所有权
//   assert!(sender == vault.owner, ENotOwner);

//   // 检查是否处于紧急状态
//   assert!(vault.emergency_active, EVerificationNotActive);

//   // 检查时间是否到达
//   let current_time = clock::timestamp_ms(clock);
//   assert!(current_time >= vault.emergency_unlock_time, EVerificationExpired);

//   // 验证密码 todo
//   let input_hash = password;
//   assert!(input_hash == vault.password_hash, EIncorrectPassword);

//   // 获取代币类型
//   let type_name = type_name::get<T>();

//   // 确保存在该类型的代币
//   assert!(dynamic_field::exists_(&vault.id, type_name), ENotFound);

//   // 获取余额
//   let balance = dynamic_field::borrow_mut<TypeName, Balance<T>>(&mut vault.id, type_name);

//   // 确保余额足够
//   let available = balance::value(balance);
//   assert!(amount <= available, EInsufficientFunds);

//   // 提取代币
//   let withdrawn_balance = balance::split(balance, amount);
//   let withdrawn_coin = coin::from_balance(withdrawn_balance, ctx);

//   // 计算剩余余额
//   let remaining = balance::value(balance);

//   // 重置紧急状态
//   vault.emergency_active = false;
//   vault.emergency_unlock_time = 0;
//   vault.status = VAULT_LOCKED;

//   // 发出提款事件
//   event::emit(CoinWithdrawn {
//       vault_id: object::uid_to_inner(&vault.id),
//       owner: sender,
//       coin_type: type_name,
//       amount,
//       remaining,
//   });

//   // 将代币转给接收者
//   transfer::public_transfer(withdrawn_coin, recipient);
// }

export const executeEmergencyUnlockTx = createBetterTxFactory<{recipient:string,vault:string,coin_type:string[]}>((tx, networkVariables, params) => {
    tx.moveCall({
        package: networkVariables.Package,
        module: "vault_host",
        function: "execute_emergency_unlock",
        arguments: [
            tx.object(params.vault),
            tx.object("0x8"),
            tx.pure.address(params.recipient),
        ],
        typeArguments:params.coin_type
    });
    return tx;
}
);

//取消验证
// public entry fun relock(vault: &mut Vault, ctx: &mut TxContext) {
//   let sender = tx_context::sender(ctx);

//   // 验证所有权
//   assert!(sender == vault.owner, ENotOwner);

//   // 检查是否已过期
//   let current_epoch = tx_context::epoch(ctx);
//   assert!(current_epoch > vault.verification_expire_epoch, EVerificationNotExpired);

//   // 重置状态
//   vault.status = VAULT_LOCKED;
//   vault.last_operation_epoch = current_epoch;

//   event::emit(VerificationCancelled {
//       vault_id: object::uid_to_inner(&vault.id),
//       owner: vault.owner,
//       verifier: vault.verifier_address,
//       timestamp: current_epoch,
//   });
// }

export const relockTx = createBetterTxFactory<{vault:string}>((tx, networkVariables, params) => {
    tx.moveCall({
        package: networkVariables.Package,
        module: "vault_host",
        function: "relock",
        arguments: [
            tx.object(params.vault),
        ],
    });
    return tx;
})