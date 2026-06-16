import { CONFIG } from "./config.js";
import { buildTokenConfig } from "./deploy.js";

let timer = null;
let lastFee = null;

// debounce helper
function debounceCalc(fn, delay = 400) {
    clearTimeout(timer);
    timer = setTimeout(fn, delay);
}

// provider read-only (NO wallet needed)
function getProvider() {
    if (window.ethereum) {
        return new ethers.BrowserProvider(window.ethereum);
    }

    throw new Error("No provider found");
}

// load factory contract (READ ONLY)
async function loadFactoryReadOnly() {
    const abi = await fetch("./abi/factory.json").then(r => r.json());
    const provider = getProvider();

    return new ethers.Contract(
        CONFIG.FACTORY,
        abi,
        provider
    );
}

// update UI fee
function renderFee(fee) {
    const evozx = document.getElementById("evozxFee");
    const evoz = document.getElementById("evozFee");

    if (!evozx || !evoz) return;

    const formatted = ethers.formatEther(fee);

    evozx.textContent = formatted;
    evoz.textContent = (Number(formatted) * 5).toFixed(4); 
    // optional: multiplier simulasi value EVOZ (ubah sesuai SC kamu)
}

// main calculator
async function calculateFee() {
    try {
        const factory = await loadFactoryReadOnly();

        const config = buildTokenConfig();

        // skip invalid early
        if (!config.name || !config.symbol || config.supply <= 0) {
            renderFee(0);
            return;
        }

        const fee = await factory.getDeploymentFee(config);

        lastFee = fee;

        renderFee(fee);

        console.log("REALTIME FEE:", ethers.formatEther(fee));

    } catch (err) {
        console.error("Fee calc error:", err);

        renderFee(0);
    }
}

// attach listeners to ALL form inputs
function attachListeners() {
    const ids = [
        "name","symbol","supply",
        "burnable","mintable","ownership",
        "maxWallet","maxTx","tradingControl",
        "buyTax","sellTax",
        "website","telegram","twitter","logo",
        "websiteUrl","telegramUrl","twitterUrl","logoUrl",
        "buyTaxValue","sellTaxValue",
        "maxWalletValue","maxTxValue",
        "burnTaxShare","marketingWallet","developmentWallet"
    ];

    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        el.addEventListener("input", () => {
            debounceCalc(calculateFee);
        });

        el.addEventListener("change", () => {
            debounceCalc(calculateFee);
        });
    });
}

// init
export function initFeeCalculator() {
    attachListeners();
    calculateFee();
}
