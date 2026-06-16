import { getSigner } from "./wallet.js";
import { loadFactory, buildTokenConfig } from "./deploy.js";

async function updateFee() {
    try {

        const signer = getSigner();
        if (!signer) return;

        const factory = await loadFactory(signer);
        const config = buildTokenConfig();

        if (!config.name || !config.symbol || !config.supply) return;

        // =========================
        // 1. EVOZX DEPOSIT FEE (REAL ON-CHAIN)
        // =========================
        const evozxFee = await factory.getDeploymentFee(config);

        document.getElementById("evozxFee").textContent =
            ethers.formatEther(evozxFee);

        // =========================
        // 2. EVOZ GAS ESTIMATION (REAL NETWORK)
        // =========================

        const txData = await factory.createToken.populateTransaction(config);

        const gasEstimate = await signer.estimateGas(txData);

        const feeData = await signer.provider.getFeeData();

        const gasCost =
            gasEstimate * feeData.maxFeePerGas;

        document.getElementById("evozFee").textContent =
            ethers.formatEther(gasCost);

    } catch (err) {
        console.log("fee realtime skip:", err.message);
    }
}

// realtime loop (lightweight)
setInterval(updateFee, 4000);

// reactive update on input
document.addEventListener("input", updateFee);
