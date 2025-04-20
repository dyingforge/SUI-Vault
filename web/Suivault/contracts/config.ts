interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'testnet' | 'mainnet';

const configs = {
    testnet: {
        Package: "0x3c24a59437218644378c91b3e5415be1c7e0a4a7a647b77ac0a829d16dd053d6",
        VaultPool:"0x0c9a6be8349c2287e89035612edbcc8ee049faa3f274e77bc2e63fcc5bdb989f"
    },
    mainnet: {
        Package: "0x1111111111111111111111111111111111111111",
        VaultPool:"0x"
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}