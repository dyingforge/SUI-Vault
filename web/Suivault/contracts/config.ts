interface ContractAddresses {
    [key: string]: string;
}

type NetworkType = 'testnet' | 'mainnet';

const configs = {
    testnet: {
        Package: "0x00286b35e606688796675a8854c4ea20e79253f454352b1531fe849546c0827e",
        VaultPool:"0xb280ac8006ae7fcd20045ad9d2d878ada98537dde892ba0a58f12af4585b70fb"
    },
    mainnet: {
        Package: "0x1111111111111111111111111111111111111111",
        VaultPool:"0x"
    }
} as const satisfies Record<NetworkType, ContractAddresses>;

export function getContractConfig(network: NetworkType): ContractAddresses {
    return configs[network];
}