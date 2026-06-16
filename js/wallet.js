import { CONFIG } from "./config.js";

export let provider = null;
export let signer = null;
export let userAddress = null;

function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
}

export async function connectWallet() {

    if (!window.ethereum) {
        alert("MetaMask wallet not detected");
        return null;
    }

    try {

        // safety delay (ANDROID FIX)
        await delay(200);

        provider = new ethers.BrowserProvider(window.ethereum);

        // IMPORTANT: request accounts first (prevents hang)
        await window.ethereum.request({
            method: "eth_requestAccounts"
        });

        // chain switch with timeout safety
        await safeSwitchChain();

        signer = await provider.getSigner();
        userAddress = await signer.getAddress();

        return {
            provider,
            signer,
            address: userAddress
        };

    } catch (error) {

        console.error("CONNECT ERROR:", error);
        throw error;
    }
}

async function safeSwitchChain() {

    const chainId = "0x325";

    try {

        const switchPromise = window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId }]
        });

        // timeout guard (CRITICAL FIX)
        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Switch chain timeout")), 5000)
        );

        await Promise.race([switchPromise, timeout]);

    } catch (error) {

        // user reject or chain not added
        if (error.code === 4902) {

            await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [{
                    chainId: "0x325",
                    chainName: "EVOZ Mainnet",
                    nativeCurrency: {
                        name: "EVOZ",
                        symbol: "EVOZ",
                        decimals: 18
                    },
                    rpcUrls: [CONFIG.RPC_URL],
                    blockExplorerUrls: [CONFIG.EXPLORER]
                }]
            });

            return;
        }

        // IMPORTANT: jangan crash silent app
        console.warn("Chain switch skipped:", error.message);
    }
}

export function getSigner() {
    return signer;
}

export function getAddress() {
    return userAddress;
}
