import { connectWallet, getSigner, getAddress } from "./wallet.js";
import { loadBalances } from "./balance.js";
import { loadFactory, loadEvozx, buildTokenConfig, validateConfig } from "./deploy.js";
import { CONFIG } from "./config.js";

// =========================================================
// 1. UI: ACCORDION & INPUT TOGGLE
// =========================================================
window.toggleAcc = (el) => {
    const content = el.nextElementSibling;
    content.style.display = (content.style.display === "block") ? "none" : "block";
};

window.toggleInput = (checkbox) => {
    const wrapper = checkbox.closest('.feature-wrapper');
    const input = wrapper.querySelector('.hidden-input');
    if (input) {
        input.style.display = checkbox.checked ? "block" : "none";
        input.disabled = !checkbox.checked;
        if (!checkbox.checked) input.value = "";
    }
    updateFee();
};

// =========================================================
// 2. WALLET & UI LOGIC
// =========================================================
const connectBtn = document.getElementById("connectBtn");

connectBtn.addEventListener("click", async () => {
    try {
        const wallet = await connectWallet();
        if (!wallet) return;

        const shortAddress = wallet.address.slice(0, 6) + "..." + wallet.address.slice(-4);
        connectBtn.textContent = shortAddress;
        document.getElementById("walletAddress").textContent = shortAddress;

        const balances = await loadBalances(wallet.provider, wallet.address);
        document.getElementById("evozBalance").textContent = Number(balances.evoz).toFixed(4);
        document.getElementById("evozxBalance").textContent = Number(balances.evozx).toFixed(4);
    } catch (error) {
        console.error(error);
        alert(error.message || "Wallet connection failed");
    }
});

// =========================================================
// 3. AUTO FEE CALCULATOR (FROM FACTORY)
// =========================================================
async function updateFee() {
    try {
        const signer = getSigner();
        if (!signer) return;

        const factory = await loadFactory(signer);
        const config = buildTokenConfig(getAddress());
        
        // Ambil biaya langsung dari Smart Contract
        const fee = await factory.getDeploymentFee(config);
        
        document.getElementById("evozxFee").textContent = fee.toString();
        document.getElementById("evozFee").textContent = (Number(fee) * 5).toString();
    } catch (err) {
        console.log("Waiting for valid config...");
    }
}

// Debounce agar tidak spam update saat mengetik
const debounce = (fn, delay) => {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), delay);
    };
};

const debouncedUpdate = debounce(updateFee, 500);

document.addEventListener("change", (e) => { if (e.target.tagName === "INPUT") debouncedUpdate(); });
document.addEventListener("input", (e) => { if (e.target.tagName === "INPUT") debouncedUpdate(); });

// =========================================================
// 4. DEPLOYMENT LOGIC
// =========================================================
const deployBtn = document.getElementById("deployBtn");

deployBtn.addEventListener("click", async () => {
    try {
        deployBtn.disabled = true;
        const signer = getSigner();
        if(!signer) throw new Error("Connect wallet first");

        const factory = await loadFactory(signer);
        const config = buildTokenConfig(getAddress());
        validateConfig(config);

        const evozx = await loadEvozx(signer);
        const fee = await factory.getDeploymentFee(config);
        
        const balance = await evozx.balanceOf(getAddress());
        if(balance < fee) throw new Error("Insufficient EVOZX balance");

        const allowance = await evozx.allowance(getAddress(), CONFIG.FACTORY);
        if(allowance < fee) {
            const approveTx = await evozx.approve(CONFIG.FACTORY, fee);
            await approveTx.wait();
        }

        const tx = await factory.createToken(config);
        const receipt = await tx.wait();

        const event = receipt.logs.map(l => {
            try { return factory.interface.parseLog(l); } catch { return null; }
        }).find(e => e?.name === "TokenCreated");

        if(!event) throw new Error("Token address not found");

        alert(`Token deployed successfully!\n\nAddress: ${event.args.token}`);
    } catch(error) {
        console.error(error);
        alert(error.message);
    } finally {
        deployBtn.disabled = false;
    }
});
