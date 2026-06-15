import { CONFIG } from "./config.js";

export let provider = null;
export let signer = null;
export let userAddress = null;

export async function connectWallet() {

    if (!window.ethereum) {
        alert("MetaMask wallet not detected");
        return null;
    }

    try {

        provider = new ethers.BrowserProvider(window.ethereum);

        await switchToEvoz();

        signer = await provider.getSigner();

        userAddress = await signer.getAddress();

        return {
            provider,
            signer,
            address: userAddress
        };

    } catch (error) {

        console.error(error);

        throw error;
    }
}

export async function switchToEvoz() {

    try {

        await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [
                {
                    chainId: "0x325"
                }
            ]
        });

    } catch (error) {

        if (error.code === 4902) {

            await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                    {
                        chainId: "0x325",
                        chainName: "EVOZ Mainnet",
                        nativeCurrency: {
                            name: "evoz",
                            symbol: "EVOZ",
                            decimals: 18
                        },
                        rpcUrls: [
                            CONFIG.RPC_URL
                        ],
                        blockExplorerUrls: [
                            CONFIG.EXPLORER
                        ]
                    }
                ]
            });

        } else {

            throw error;
        }
    }
}

export function getSigner() {
    return signer;
}

export function getAddress() {
    return userAddress;
}
