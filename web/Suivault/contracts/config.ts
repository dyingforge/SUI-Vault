interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'testnet' | 'mainnet';

const configs = {
    testnet: {
        Package: "0x5b20020099486b34856fd4b17458aa37ee43ea7d6ad385114cebe91c482250d7",
        VaultPool:"0x2cae1098eabd44703fa37eff24b25f9d380ec3bc9fc8f93d1d947fc786873e18"
    },
    mainnet: {
        Package: "0x1111111111111111111111111111111111111111",
        VaultPool:"0x"
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}