import { isValidSuiAddress } from "@mysten/sui/utils";
import { suiClient } from "./index";
import { SuiObjectResponse,SuiParsedData,SuiObjectData ,CoinMetadata} from "@mysten/sui/client";
import { createBetterTxFactory, networkConfig } from "./index";
import { VaultPool,Vault,DispalyVault,UserVault,SuiTableInfo ,SuiCoin,VaultData,VerificationRequested} from "@/types/index";
import { SuiGraphQLClient } from "@mysten/sui/graphql";
import queryVaultDataContext from "./graphqlContext";

// 创建 GraphQL 客户端
const graphqlClient = new SuiGraphQLClient({
  url: `https://sui-testnet.mystenlabs.com/graphql`,
});

export async function getVaultDynamicFields(vaultId: string) {
  const result = await graphqlClient.query({
    query: queryVaultDataContext,
    variables: { address: vaultId }
  });

  // 处理返回的数据
  const folderData: VaultData[] = result.data?.object?.dynamicFields?.nodes?.map((node) => {
    const nameJson = node.name as { json: { name: string } };
    const valueJson = node.value as { json: { value: string } }; // Changed unknown to string to match FolderData type
    return {
        name: nameJson.json.name,
        value: Number(valueJson.json.value)
    }
}) ?? [];
  
  return folderData;
}

export const getUserProfileCoin = async (address: string) => {
  if (!isValidSuiAddress(address)) {
    throw new Error("Invalid Sui address");
  }
  // export type SuiObject = {
  //   id: string,
  //   type: string,
  //   coinMetadata?: CoinMetadata,
  //   balance?: number,
  // }
    const response = await suiClient.getCoins({
      owner: address,
    });

    const coins = await Promise.all(response.data.map(async(coinContent) => {
      const coindata = await suiClient.getCoinMetadata({
        coinType: coinContent.coinType,
        }) as CoinMetadata;
      const coin = {
        id: coinContent.coinObjectId,
        type: coinContent.coinType,
        coinMetadata: coindata,
        balance: Number(coinContent.balance),
      }as SuiCoin
      return coin;
    }));
  return coins;
};

export const queryCoinMetadata = async (coinTypes: string) => {
  const coin = await suiClient.getCoinMetadata({
      coinType: coinTypes,
      }) as CoinMetadata;
  return coin;
}


export const queryVaultPool = async () => {
  const vaultPoolContent = await suiClient.getObject({
    id: networkConfig.testnet.variables.VaultPool,
    options: {
      showContent: true,
    },
  })

  if (!vaultPoolContent.data?.content) {
    
    throw new Error("Profile content not found");
  }

  const parsedVaultPool = vaultPoolContent.data.content as SuiParsedData;
  if (!('fields' in parsedVaultPool)) {
    throw new Error("Invalid profile data structure");
  }

  const vaultPool = parsedVaultPool.fields as unknown as VaultPool;
  if (!vaultPool) {
    throw new Error("Failed to parse profile data");
  } 

  return vaultPool;   

}

export const queryUserVault = async (address: string) => {
  try {
    const vaultPool = await queryVaultPool();
    const ownedVaultsTableAddress = vaultPool.user_vaults.fields.id.id;
    const verifierVaultsTableAddress = vaultPool.verifier_vaults.fields.id.id;

    // 查询用户拥有的保险箱
    const ownedVaultsContent = await suiClient.getDynamicFieldObject({
      parentId: ownedVaultsTableAddress,
      name: {
        type: "address",
        value: address,
      },
    });

    // 查询用户作为验证者的保险箱
    const verifierVaultsContent = await suiClient.getDynamicFieldObject({
      parentId: verifierVaultsTableAddress,
      name: {
        type: "address",
        value: address,
      },
    });

    // 创建空的默认返回对象
    const emptyVaults = {
      user_vaults: [],
      verifier_vaults: [],
      total_vaults: vaultPool.total_vaults,
    } as unknown as UserVault;

    // 检查是否有自己的保险箱数据
    const hasOwnedVaults = ownedVaultsContent.data?.content && 'fields' in ownedVaultsContent.data.content;
    
    // 检查是否有验证者保险箱数据
    const hasVerifierVaults = verifierVaultsContent.data?.content && 'fields' in verifierVaultsContent.data.content;

    // 如果两种保险箱都没有，直接返回空对象
    if (!hasOwnedVaults && !hasVerifierVaults) {
      console.log("用户没有任何保险箱");
      return emptyVaults;
    }

    // 处理自己的保险箱
    let ownedVaults: Vault[] = [];
    if (ownedVaultsContent.data?.content && 'fields' in ownedVaultsContent.data.content) {
      let ownedVaultsInfo = ownedVaultsContent.data.content.fields as unknown as SuiTableInfo;
      if (ownedVaultsInfo.value && ownedVaultsInfo.value.length > 0) {
        ownedVaults = await Promise.all(ownedVaultsInfo.value.map(async (id) => {
          const ownedContent = await suiClient.getObject({
            id: id,
            options: { showContent: true },
          });

          if (ownedContent.data?.content && 'fields' in ownedContent.data.content) {
            return ownedContent.data.content.fields as unknown as Vault;
          }
          return null;
        })).then(results => results.filter(Boolean) as Vault[]);
      }
    }

    // 处理验证者保险箱
    let verifierVaults: Vault[] = [];
    if (verifierVaultsContent.data?.content && 'fields' in verifierVaultsContent.data.content) {
      let verifierVaultsInfo = verifierVaultsContent.data.content.fields as unknown as SuiTableInfo;
      if (verifierVaultsInfo.value && verifierVaultsInfo.value.length > 0) {
        verifierVaults = await Promise.all(verifierVaultsInfo.value.map(async (id) => {
          const verifierContent = await suiClient.getObject({
            id: id,
            options: { showContent: true },
          });

          if (verifierContent.data?.content && 'fields' in verifierContent.data.content) {
            return verifierContent.data.content.fields as unknown as Vault;
          }
          return null;
        })).then(results => results.filter(Boolean) as Vault[]);
      }
    }

    console.log("处理后的保险箱数量 - 自己的:", ownedVaults.length, "验证者:", verifierVaults.length);

    // 构建并返回结果
    return {
      user_vaults: ownedVaults,
      verifier_vaults: verifierVaults,
      total_vaults: vaultPool.total_vaults,
    } as unknown as UserVault;
  } catch (error) {
    console.error("查询保险箱时出错:", error);
    // 出错时也返回空对象
    return {
      user_vaults: [],
      verifier_vaults: [],
      total_vaults: 0,
    } as unknown as UserVault;
  }
};

export const queryRequestEvent = async() => {
  const requestEventContent = await suiClient.queryEvents({
    query: {
      MoveEventType: `${networkConfig.testnet.variables.Package}::vault_host::VerificationRequested`,
    },
  });
  const eventsPromise = requestEventContent.data.map(async (event) => {
    const verificationCreated = event.parsedJson as VerificationRequested;
    
    return verificationCreated

  });
    const events = await Promise.all(eventsPromise);
  return events as unknown as VerificationRequested[];
}


