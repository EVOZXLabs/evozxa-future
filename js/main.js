import {
    connectWallet,
    getSigner,
    getAddress
} from "./wallet.js";

import {
    loadBalances
} from "./balance.js";

import {
    loadFactory,
    loadEvozx,
    buildTokenConfig,
    validateConfig
} from "./deploy.js";

import {
    buyMissingEVOZX
} from "./exchange.js";

import {
    CONFIG
} from "./config.js";

import { initFeeCalculator } from "./fee-realtime.js";

initFeeCalculator();

const connectBtn = document.getElementById("connectBtn");
const deployBtn = document.getElementById("deployBtn");

function setDeployStatus(text) {
    console.log("[DEPLOY]", text);

    const el = document.getElementById("deployStatus");
    if (el) el.textContent = text;
}

/* =====================================================
   WALLET CONNECT
===================================================== */
connectBtn?.addEventListener("click", async () => {
    try {
        const wallet = await connectWallet();
        if (!wallet) return;

        const shortAddress =
            wallet.address.slice(0, 6) +
            "..." +
            wallet.address.slice(-4);

        connectBtn.textContent = shortAddress;

        const walletEl = document.getElementById("walletAddress");
        if (walletEl) walletEl.textContent = shortAddress;

        await refreshBalances();

    } catch (error) {
        console.error(error);
        alert(error?.message || "Wallet connection failed");
    }
});

/* =====================================================
   BALANCE SYNC
===================================================== */
async function refreshBalances() {
    const signer = getSigner();
    if (!signer) return;

    const address = getAddress();

    const balances = await loadBalances(
        signer.provider,
        address
    );

    const evozEl = document.getElementById("evozBalance");
    const evozxEl = document.getElementById("evozxBalance");

    if (evozEl) evozEl.textContent = Number(balances.evoz || 0).toFixed(4);
    if (evozxEl) evozxEl.textContent = Number(balances.evozx || 0).toFixed(4);
}

/* =====================================================
   DEPLOY FLOW (FIXED FULL PIPELINE)
===================================================== */
deployBtn?.addEventListener("click", async () => {
    try {
        deployBtn.disabled = true;

        const signer = getSigner();
        if (!signer) throw new Error("Connect wallet first");

        setDeployStatus("Loading contracts...");

        const factory = await loadFactory(signer);
        const evozx = await loadEvozx(signer);

        setDeployStatus("Reading configuration...");

        const config = buildTokenConfig();
        validateConfig(config);

        setDeployStatus("Checking symbol availability...");

        const exists = await factory.symbolExists(config.symbol);
        if (exists) {
            throw new Error("Symbol already exists");
        }

        /* =================================================
           FEE (CRITICAL FIX: BIGINT SAFE)
        ================================================= */
        setDeployStatus("Calculating deployment fee...");

        const fee = await factory.getDeploymentFee(config);

        const address = getAddress();
        const balance = await evozx.balanceOf(address);

        console.log("FEE RAW:", fee.toString());

        if (balance < fee) {
            const missing = fee - balance;

            setDeployStatus("Insufficient EVOZX, auto-buying...");

            await buyMissingEVOZX(signer, missing);

            const newBalance = await evozx.balanceOf(address);

            if (newBalance < fee) {
                throw new Error("Auto-buy EVOZX failed");
            }
        }

        /* =================================================
           APPROVAL
        ================================================= */
        setDeployStatus("Approving EVOZX...");

        const allowance = await evozx.allowance(
            address,
            CONFIG.FACTORY
        );

        if (allowance < fee) {
            const approveTx = await evozx.approve(
                CONFIG.FACTORY,
                fee
            );

            await approveTx.wait();
        }

        /* =================================================
           DEPLOY
        ================================================= */
        setDeployStatus("Deploying token...");

        const tx = await factory.createToken(config);
        const receipt = await tx.wait();

        /* =================================================
           EVENT PARSE (SAFE)
        ================================================= */
        let tokenAddress = null;

        for (const log of receipt.logs) {
            try {
                const parsed = factory.interface.parseLog(log);

                if (parsed?.name === "TokenCreated") {
                    tokenAddress = parsed.args.token;
                    break;
                }
            } catch (_) {}
        }

        if (!tokenAddress) {
            throw new Error("TokenCreated event not found");
        }

        /* =================================================
           FINAL
        ================================================= */
        await refreshBalances();

        const explorer = `${CONFIG.EXPLORER}/token/${tokenAddress}`;

        setDeployStatus("Deployment completed");

        alert(
`🚀 TOKEN DEPLOYED

Token:
${tokenAddress}

Explorer:
${explorer}`
        );

        console.log("DEPLOYED:", tokenAddress);

    } catch (error) {

        console.error(error);

        setDeployStatus("Deployment failed");

        alert(
            error?.reason ||
            error?.shortMessage ||
            error?.message ||
            "Deployment failed"
        );

    } finally {
        deployBtn.disabled = false;
    }
});
