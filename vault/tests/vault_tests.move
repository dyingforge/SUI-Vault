#[test_only]
module vault::vault_tests;

use std::debug;
use std::string;
use sui::clock::{Self, Clock};
use sui::coin;
use sui::object::{Self, ID};
use sui::sui::SUI;
use sui::test_scenario::{Self as ts, Scenario};
use sui::test_utils::assert_eq;
use vault::vault_host::{
    Self,
    Vault,
    VaultPool,
    VerifierCap,
    AdminCap,
    get_user_vaults,
    get_verifier_vaults,
    get_coin_balance
};

// 测试地址
const ADMIN: address = @0xA;
const OWNER: address = @0xB;
const VERIFIER: address = @0xC;
const RECIPIENT: address = @0xD;

// 测试常量
const DEPOSIT_AMOUNT: u64 = 1000;
const WITHDRAW_AMOUNT: u64 = 500;
const VERIFICATION_WINDOW: u64 = 10; // 10个epoch

// 错误码
const ASSERTION_FAILED: u64 = 1000;

// #[test]
// fun test_create_vault() {
//     let mut scenario = ts::begin(ADMIN);

//     // 初始化模块
//     {
//         vault_host::test_init(ts::ctx(&mut scenario));
//     };

//     // 创建时钟
//     let clock = clock::create_for_testing(ts::ctx(&mut scenario));

//     // 创建保险箱池
//     ts::next_tx(&mut scenario, OWNER);
//     {
//         let mut pool = ts::take_shared<VaultPool>(&scenario);
//         let name = string::utf8(b"Test Vault");

//         vault_host::create_vault(&mut pool, VERIFIER, &clock, name, ts::ctx(&mut scenario));

//         // 验证保险箱创建成功
//         let user_vaults = get_user_vaults(&pool, OWNER);
//         assert!(vector::length(&user_vaults) == 1, ASSERTION_FAILED);

//         let verifier_vaults = get_verifier_vaults(&pool, VERIFIER);
//         assert!(vector::length(&verifier_vaults) == 1, ASSERTION_FAILED);

//         ts::return_shared(pool);
//     };

//     // 验证者应该收到VerifierCap
//     ts::next_tx(&mut scenario, VERIFIER);
//     {
//         let cap_exists = ts::has_most_recent_for_sender<VerifierCap>(&scenario);
//         assert!(cap_exists, ASSERTION_FAILED);
//     };

//     clock::destroy_for_testing(clock);
//     ts::end(scenario);
// }

// #[test]
// fun test_deposit_coin() {
//     let mut scenario = ts::begin(ADMIN);

//     // 初始化模块
//     {
//         vault_host::test_init(ts::ctx(&mut scenario));
//     };

//     // 创建时钟
//     let clock = clock::create_for_testing(ts::ctx(&mut scenario));

//     // 存入代币
//     ts::next_tx(&mut scenario, OWNER);
//     {
//         let mut vault_pool = ts::take_shared<VaultPool>(&scenario);

//         vault_host::create_vault(
//             &mut vault_pool,
//             VERIFIER,
//             &clock,
//             string::utf8(b"Test Vault"),
//             ts::ctx(&mut scenario),
//         );
//         ts::return_shared(vault_pool);
//     };

//     ts::next_tx(&mut scenario, OWNER);
//     {
//         let mut vault = ts::take_shared<Vault>(&scenario);
//         let coin = coin::mint_for_testing<SUI>(DEPOSIT_AMOUNT, ts::ctx(&mut scenario));
//         vault_host::deposit_coin<SUI>(&mut vault, coin, ts::ctx(&mut scenario));
//         // 验证余额
//         let balance = get_coin_balance<SUI>(&vault);
//         assert_eq(balance, DEPOSIT_AMOUNT);

//         ts::return_shared(vault);
//     };
//     clock::destroy_for_testing(clock);
//     ts::end(scenario);
// }

// #[test]
// fun test_verification_and_withdrawal() {
//     let mut scenario = ts::begin(ADMIN);

//     // 初始化模块
//     {
//         vault_host::test_init(ts::ctx(&mut scenario));
//     };

//     // 创建时钟
//     let clock = clock::create_for_testing(ts::ctx(&mut scenario));

//     ts::next_tx(&mut scenario, OWNER);
//     {
//         let mut vault_pool = ts::take_shared<VaultPool>(&scenario);

//         vault_host::create_vault(
//             &mut vault_pool,
//             VERIFIER,
//             &clock,
//             string::utf8(b"Test Vault"),
//             ts::ctx(&mut scenario),
//         );
//         ts::return_shared(vault_pool);
//     };

//     ts::next_tx(&mut scenario, OWNER);
//     {
//         let mut vault = ts::take_shared<Vault>(&scenario);
//         let coin = coin::mint_for_testing<SUI>(DEPOSIT_AMOUNT, ts::ctx(&mut scenario));
//         vault_host::deposit_coin<SUI>(&mut vault, coin, ts::ctx(&mut scenario));
//         // 验证余额
//         let balance = get_coin_balance<SUI>(&vault);
//         assert_eq(balance, DEPOSIT_AMOUNT);

//         ts::return_shared(vault);
//     };

//     // 请求验证
//     ts::next_tx(&mut scenario, OWNER);
//     {
//         let mut vault = ts::take_shared<Vault>(&scenario);
//         let balance = get_coin_balance<SUI>(&vault);
//         assert_eq(balance, DEPOSIT_AMOUNT);

//         vault_host::request_verification(
//             &mut vault,
//             WITHDRAW_AMOUNT,
//             RECIPIENT,
//             VERIFICATION_WINDOW,
//             ts::ctx(&mut scenario),
//         );

//         // 验证状态
//         let (_, _, _, _, status, _) = vault_host::get_vault_info<SUI>(&vault);
//         assert_eq(status, 1); // VAULT_PENDING_VERIFICATION

//         ts::return_shared(vault);
//     };

//     // 验证者验证并提取
//     ts::next_tx(&mut scenario, VERIFIER);
//     {
//         let mut vault = ts::take_shared<Vault>(&scenario);
//         let cap = ts::take_from_sender<VerifierCap>(&scenario);

//         vault_host::verify_and_withdraw<SUI>(&mut vault, &cap, ts::ctx(&mut scenario));

//         // 验证状态和余额
//         let (_, _, _, balance, status, _) = vault_host::get_vault_info<SUI>(&vault);
//         assert_eq(status, 0); // VAULT_LOCKED
//         assert_eq(balance, DEPOSIT_AMOUNT - WITHDRAW_AMOUNT);

//         ts::return_shared(vault);
//         ts::return_to_sender(&scenario, cap);
//     };

//     // 接收者应该收到代币
//     ts::next_tx(&mut scenario, RECIPIENT);
//     {
//         // 检查接收者是否有相应的代币
//         let id_opt = ts::most_recent_id_for_address<coin::Coin<SUI>>(RECIPIENT);
//         assert!(option::is_some(&id_opt), ASSERTION_FAILED);

//         if (option::is_some(&id_opt)) {
//             let id = option::destroy_some(id_opt);
//             let coin = ts::take_from_address_by_id<coin::Coin<SUI>>(&scenario, RECIPIENT, id);
//             assert_eq(coin::value(&coin), WITHDRAW_AMOUNT);
//             ts::return_to_address(RECIPIENT, coin);
//         } else {
//             option::destroy_none(id_opt);
//         };
//     };
//     clock::destroy_for_testing(clock);
//     ts::end(scenario);
// }

// #[test]
// fun test_verification_cancel() {
//     let mut scenario = ts::begin(ADMIN);

//     {
//         vault_host::test_init(ts::ctx(&mut scenario));
//     };

//     let clock = clock::create_for_testing(ts::ctx(&mut scenario));

//     // 创建并准备保险箱
//     ts::next_tx(&mut scenario, OWNER);
//     {
//         let mut vault_pool = ts::take_shared<VaultPool>(&scenario);

//         vault_host::create_vault(
//             &mut vault_pool,
//             VERIFIER,
//             &clock,
//             string::utf8(b"Test Vault"),
//             ts::ctx(&mut scenario),
//         );
//         ts::return_shared(vault_pool);
//     };

//     ts::next_tx(&mut scenario, OWNER);
//     {
//         let mut vault = ts::take_shared<Vault>(&scenario);
//         let coin = coin::mint_for_testing<SUI>(DEPOSIT_AMOUNT, ts::ctx(&mut scenario));
//         vault_host::deposit_coin<SUI>(&mut vault, coin, ts::ctx(&mut scenario));
//         // 验证余额
//         let balance = get_coin_balance<SUI>(&vault);
//         assert_eq(balance, DEPOSIT_AMOUNT);

//         ts::return_shared(vault);
//     };

//     // 请求验证
//     ts::next_tx(&mut scenario, OWNER);
//     {
//         let mut vault = ts::take_shared<Vault>(&scenario);

//         vault_host::request_verification<SUI>(
//             &mut vault,
//             WITHDRAW_AMOUNT,
//             RECIPIENT,
//             VERIFICATION_WINDOW,
//             ts::ctx(&mut scenario),
//         );

//         ts::return_shared(vault);
//     };

//     // 取消验证
//     ts::next_tx(&mut scenario, OWNER);
//     {
//         let mut vault = ts::take_shared<Vault>(&scenario);

//         vault_host::relock(&mut vault, ts::ctx(&mut scenario));

//         // 验证状态
//         let (_, _, _, _, status, _) = vault_host::get_vault_info<SUI>(&vault);
//         assert_eq(status, 0); // VAULT_LOCKED

//         ts::return_shared(vault);
//     };

//     clock::destroy_for_testing(clock);
//     ts::end(scenario);
// }

// #[test]
// fun test_emergency_unlock() {
//     let mut scenario = ts::begin(ADMIN);

//     {
//         vault_host::test_init(ts::ctx(&mut scenario));
//     };

//     let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));

//     ts::next_tx(&mut scenario, OWNER);
//     {
//         let mut vault_pool = ts::take_shared<VaultPool>(&scenario);

//         vault_host::create_vault(
//             &mut vault_pool,
//             VERIFIER,
//             &clock,
//             string::utf8(b"Test Vault"),
//             ts::ctx(&mut scenario),
//         );
//         ts::return_shared(vault_pool);
//     };

//     ts::next_tx(&mut scenario, OWNER);
//     {
//         let mut vault = ts::take_shared<Vault>(&scenario);
//         let coin = coin::mint_for_testing<SUI>(DEPOSIT_AMOUNT, ts::ctx(&mut scenario));
//         vault_host::deposit_coin<SUI>(&mut vault, coin, ts::ctx(&mut scenario));
//         // 验证余额
//         let balance = get_coin_balance<SUI>(&vault);
//         assert_eq(balance, DEPOSIT_AMOUNT);

//         ts::return_shared(vault);
//     };

//     // 发起紧急解锁
//     ts::next_tx(&mut scenario, OWNER);
//     {
//         let mut vault = ts::take_shared<Vault>(&scenario);
//         vault_host::initiate_emergency_unlock(&mut vault, &clock, ts::ctx(&mut scenario));

//         // 验证状态
//         let (_, _, _, _, status, emergency_active) = vault_host::get_vault_info<SUI>(&vault);
//         assert_eq(status, 3);
//         assert_eq(emergency_active, true);

//         ts::return_shared(vault);
//     };

//     // 模拟时间经过一周
//     ts::next_tx(&mut scenario, ADMIN);
//     {
//         clock::increment_for_testing(&mut clock, 604800000 + 1000); // 一周 + 缓冲
//     };

//     // 执行紧急解锁
//     ts::next_tx(&mut scenario, OWNER);
//     {
//         let mut vault = ts::take_shared<Vault>(&scenario);

//         vault_host::execute_emergency_unlock<SUI>(
//             &mut vault,
//             WITHDRAW_AMOUNT,
//             &clock,
//             RECIPIENT,
//             ts::ctx(&mut scenario),
//         );

//         // 验证状态
//         let (_, _, _, balance, status, emergency_active) = vault_host::get_vault_info<SUI>(
//             &vault,
//         );
//         assert_eq(status, 0); // VAULT_LOCKED
//         assert_eq(emergency_active, false);
//         assert_eq(balance, DEPOSIT_AMOUNT - WITHDRAW_AMOUNT);

//         ts::return_shared(vault);
//     };

//     // 验证接收者收到代币
//     ts::next_tx(&mut scenario, RECIPIENT);
//     {
//         // 检查接收者是否有相应的代币
//         let has_coin = ts::has_most_recent_for_address<coin::Coin<SUI>>(RECIPIENT);
//         assert!(has_coin, ASSERTION_FAILED);

//         if (has_coin) {
//             let coin = ts::take_from_address<coin::Coin<SUI>>(&scenario, RECIPIENT);
//             assert_eq(coin::value(&coin), WITHDRAW_AMOUNT);
//             ts::return_to_address(RECIPIENT, coin);
//         };
//     };

//     clock::destroy_for_testing(clock);
//     ts::end(scenario);
// }

// #[test]
// fun test_cancel_emergency_unlock() {
//     let mut scenario = ts::begin(ADMIN);

//     {
//         vault_host::test_init(ts::ctx(&mut scenario));
//     };

//     let clock = clock::create_for_testing(ts::ctx(&mut scenario));

//     ts::next_tx(&mut scenario, OWNER);
//     {
//         let mut vault_pool = ts::take_shared<VaultPool>(&scenario);

//         vault_host::create_vault(
//             &mut vault_pool,
//             VERIFIER,
//             &clock,
//             string::utf8(b"Test Vault"),
//             ts::ctx(&mut scenario),
//         );
//         ts::return_shared(vault_pool);
//     };

//     ts::next_tx(&mut scenario, OWNER);
//     {
//         let mut vault = ts::take_shared<Vault>(&scenario);
//         let coin = coin::mint_for_testing<SUI>(DEPOSIT_AMOUNT, ts::ctx(&mut scenario));
//         vault_host::deposit_coin<SUI>(&mut vault, coin, ts::ctx(&mut scenario));
//         // 验证余额
//         let balance = get_coin_balance<SUI>(&vault);
//         assert_eq(balance, DEPOSIT_AMOUNT);

//         ts::return_shared(vault);
//     };

//     ts::next_tx(&mut scenario, OWNER);
//     {
//         let mut vault = ts::take_shared<Vault>(&scenario);
//         vault_host::initiate_emergency_unlock(&mut vault, &clock, ts::ctx(&mut scenario));

//         // 验证状态
//         let (_, _, _, _, status, emergency_active) = vault_host::get_vault_info<SUI>(&vault);
//         assert_eq(status, 3);
//         assert_eq(emergency_active, true);

//         ts::return_shared(vault);
//     };

//     // 取消紧急解锁
//     ts::next_tx(&mut scenario, OWNER);
//     {
//         let mut vault = ts::take_shared<Vault>(&scenario);

//         vault_host::cancel_emergency_unlock(&mut vault, &clock, ts::ctx(&mut scenario));

//         // 验证状态
//         let (_, _, _, _, status, emergency_active) = vault_host::get_vault_info<SUI>(&vault);
//         assert_eq(status, 0); // VAULT_LOCKED
//         assert_eq(emergency_active, false);

//         ts::return_shared(vault);
//     };

//     clock::destroy_for_testing(clock);
//     ts::end(scenario);
// }

// // 测试余额不足的情况
// #[test]
// #[expected_failure(abort_code = 10)] // EInsufficientFunds = 10
// fun test_insufficient_funds() {
//     let mut scenario = ts::begin(ADMIN);

//     {
//         vault_host::test_init(ts::ctx(&mut scenario));
//     };

//     let clock = clock::create_for_testing(ts::ctx(&mut scenario));

//     // 请求提取超过余额的金额

//     ts::next_tx(&mut scenario, OWNER);
//     {
//         let mut vault_pool = ts::take_shared<VaultPool>(&scenario);

//         vault_host::create_vault(
//             &mut vault_pool,
//             VERIFIER,
//             &clock,
//             string::utf8(b"Test Vault"),
//             ts::ctx(&mut scenario),
//         );
//         ts::return_shared(vault_pool);
//     };

//     ts::next_tx(&mut scenario, OWNER);
//     {
//         let mut vault = ts::take_shared<Vault>(&scenario);
//         let coin = coin::mint_for_testing<SUI>(100, ts::ctx(&mut scenario));
//         vault_host::deposit_coin<SUI>(&mut vault, coin, ts::ctx(&mut scenario));
//         // 验证余额
//         let balance = get_coin_balance<SUI>(&vault);
//         assert_eq(balance, 100);

//         ts::return_shared(vault);
//     };

//     ts::next_tx(&mut scenario, OWNER);
//     {
//         let mut vault = ts::take_shared<Vault>(&scenario);
//         vault_host::request_verification<SUI>(
//             &mut vault,
//             500, // 尝试提取500，但只有100
//             RECIPIENT,
//             VERIFICATION_WINDOW,
//             ts::ctx(&mut scenario),
//         );
//         ts::return_shared(vault);
//     };
//     clock::destroy_for_testing(clock);
//     ts::end(scenario);
// }
