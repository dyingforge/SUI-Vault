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
  const vaultPool = await queryVaultPool();
  const ownedVaultsTableAddress = vaultPool.user_vaults.fields.id.id;
  const verifierVaultsTableAddress = vaultPool.verifier_vaults.fields.id.id;

  const ownedVaultsContent = await suiClient.getDynamicFieldObject({
    parentId: ownedVaultsTableAddress,
    name: {
      type: "address",
      value: address,
    },
  });

  const verifierVaultsContent = await suiClient.getDynamicFieldObject({
    parentId: verifierVaultsTableAddress,
    name: {
      type: "address",
      value: address,
    },
  });

  if (!verifierVaultsContent.data?.content || !ownedVaultsContent.data?.content) {
    throw new Error("vaults content not found");
  }
  if (!('fields' in ownedVaultsContent.data.content) || !('fields' in verifierVaultsContent.data.content)) {
    throw new Error("Invalid profile data structure");
  }
  
  let ownedVaultsInfo = ownedVaultsContent.data?.content.fields as unknown as SuiTableInfo;
  let verifierVaultsInfo = verifierVaultsContent.data?.content.fields as unknown as SuiTableInfo;
  console.log(ownedVaultsInfo.value, verifierVaultsInfo.value)

  const ownedVaults = await Promise.all(ownedVaultsInfo.value.map(async (id) => {
    const ownedContent =  await suiClient.getObject({
      id: id,
      options: {
        showContent: true,
      },
    });

    if (!ownedContent.data?.content) {
      throw new Error("Profile content not found");
    }

    const parsedVault = ownedContent.data.content as SuiParsedData;
    if (!('fields' in parsedVault)) {
      throw new Error("Invalid profile data structure");
    }
    const ownedVault = parsedVault.fields as unknown as Vault;
  
    return ownedVault;

  }));

  const verifierVaults = await Promise.all(verifierVaultsInfo.value.map(async (id) =>{
    const verifierContent = await suiClient.getObject({
      id: id,
      options: {
        showContent: true,
      }
    })
    
    if (!verifierContent.data?.content) {
      throw new Error("Profile content not found");
    }

    const parsedVault = verifierContent.data.content as SuiParsedData;
    if (!('fields' in parsedVault)) {
      throw new Error("Invalid profile data structure");
    }
    const verifierVault = parsedVault.fields as unknown as Vault;
  
    return verifierVault;
  }))
  
  console.log("owned",ownedVaults)
  console.log("verifier",verifierVaults)

  const vaults = {
    user_vaults: ownedVaults,
    verifier_vaults: [],
    total_vaults: vaultPool.total_vaults,
  } as unknown as UserVault;

  return vaults;
}

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


