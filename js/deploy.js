import { CONFIG } from "./config.js";

/* =========================================================
   CONTRACT LOADERS (FINAL SAFE VERSION)
========================================================= */

export async function loadFactory(signer) {
    const abi = await fetch("./abi/factory.json").then(r => r.json());

    return new ethers.Contract(
        CONFIG.FACTORY,
        abi,
        signer
    );
}

export async function loadEvozx(signer) {
    const abi = await fetch("./abi/evozx.json").then(r => r.json());

    return new ethers.Contract(
        CONFIG.EVOZX,
        abi,
        signer
    );
}

export async function loadExchange(signer) {
    const abi = await fetch("./abi/exchange.json").then(r => r.json());

    return new ethers.Contract(
        CONFIG.EXCHANGE,
        abi,
        signer
    );
}

/* =========================================================
   SAFE DOM ACCESS (ANTI MOBILE CRASH)
========================================================= */

function val(id, fallback = "") {
    const el = document.getElementById(id);
    return el ? el.value : fallback;
}

function chk(id) {
    const el = document.getElementById(id);
    return el ? el.checked : false;
}

function num(id, max = null) {
    const v = Number(val(id, 0) || 0);
    if (max !== null) return Math.min(max, v);
    return v;
}

/* =========================================================
   FINAL CONFIG BUILDER (FACTORY SYNCED)
========================================================= */

export function buildTokenConfig() {

    const marketingWallet = val("marketingWallet").trim();
    const developmentWallet = val("developmentWallet").trim();

    return {
        /* BASIC */
        name: val("name").trim(),
        symbol: val("symbol").trim().toUpperCase(),
        supply: Number(val("supply") || 0),

        owner: ethers.ZeroAddress,
        chainId: 0,
        launchKitVersion: 1,

        /* FEATURES */
        burnable: chk("burnable"),
        mintable: chk("mintable"),
        ownershipEnabled: chk("ownership"),

        maxWalletEnabled: chk("maxWallet"),
        maxTxEnabled: chk("maxTx"),
        tradingControlEnabled: chk("tradingControl"),
        tradingEnabled: chk("tradingEnabled"),

        /* TAX */
        buyTaxEnabled: chk("buyTax"),
        sellTaxEnabled: chk("sellTax"),

        buyTax: num("buyTaxValue", 10),
        sellTax: num("sellTaxValue", 10),
        burnTaxShare: num("burnTaxShare", 100),

        /* LIMITS */
        maxWalletPercent: num("maxWalletValue", 100),
        maxTxPercent: num("maxTxValue", 100),

        /* METADATA */
        website: val("websiteUrl").trim(),
        telegram: val("telegramUrl").trim(),
        twitter: val("twitterUrl").trim(),
        logoURI: val("logoUrl").trim(),

        /* WALLETS */
        marketingWallet:
            ethers.isAddress(marketingWallet)
                ? marketingWallet
                : ethers.ZeroAddress,

        developmentWallet:
            ethers.isAddress(developmentWallet)
                ? developmentWallet
                : ethers.ZeroAddress
    };
}

/* =========================================================
   FINAL VALIDATION (STRICT BUT SAFE)
========================================================= */

export function validateConfig(c) {

    if (!c.name) throw new Error("Token name required");

    if (!c.symbol) throw new Error("Token symbol required");

    if (c.symbol.length < 2) throw new Error("Symbol too short");

    if (c.supply <= 0) throw new Error("Supply must be greater than zero");

    if (c.supply > 1_000_000_000_000)
        throw new Error("Maximum supply is 1,000,000,000,000");

    if (c.buyTax < 0 || c.buyTax > 10)
        throw new Error("Buy tax max 10%");

    if (c.sellTax < 0 || c.sellTax > 10)
        throw new Error("Sell tax max 10%");

    if (c.maxWalletEnabled) {
        if (c.maxWalletPercent <= 0 || c.maxWalletPercent > 100)
            throw new Error("Max Wallet must be 1–100%");
    }

    if (c.maxTxEnabled) {
        if (c.maxTxPercent <= 0 || c.maxTxPercent > 100)
            throw new Error("Max TX must be 1–100%");
    }

    if (c.buyTaxEnabled || c.sellTaxEnabled) {

        const hasReceiver =
            c.burnTaxShare > 0 ||
            c.marketingWallet !== ethers.ZeroAddress ||
            c.developmentWallet !== ethers.ZeroAddress;

        if (!hasReceiver) {
            throw new Error("Tax receiver missing");
        }
    }
}
