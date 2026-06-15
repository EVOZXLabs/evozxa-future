import { CONFIG } from "./config.js";

export async function loadFactory(
    signer
) {

    const abi =
        await fetch(
            "./abi/factory.json"
        ).then(r => r.json());

    return new ethers.Contract(
        CONFIG.FACTORY,
        abi,
        signer
    );
}

export async function loadEvozx(
    signer
) {

    const abi =
        await fetch(
            "./abi/evozx.json"
        ).then(r => r.json());

    return new ethers.Contract(
        CONFIG.EVOZX,
        abi,
        signer
    );
}

export function buildTokenConfig(
    owner
) {

    return {

        name:
        document
        .getElementById("name")
        .value
        .trim(),

        symbol:
        document
        .getElementById("symbol")
        .value
        .trim(),

        supply:
        Number(
            document
            .getElementById("supply")
            .value || 0
        ),

        owner,

        chainId: 805,

        launchKitVersion: 1,

        burnable:
        document
        .getElementById("burnable")
        .checked,

        mintable:
        document
        .getElementById("mintable")
        .checked,

        ownershipEnabled:
        document
        .getElementById("ownership")
        .checked,

        website:
        document
        .getElementById("websiteUrl")
        .value
        .trim(),

        telegram:
        document
        .getElementById("telegramUrl")
        .value
        .trim(),

        twitter:
        document
        .getElementById("twitterUrl")
        .value
        .trim(),

        logoURI:
        document
        .getElementById("logoUrl")
        .value
        .trim(),

        maxWalletEnabled:
        document
        .getElementById("maxWallet")
        .checked,

        maxWalletPercent:
        Number(
            document
            .getElementById("maxWalletValue")
            .value || 0
        ),

        maxTxEnabled:
        document
        .getElementById("maxTx")
        .checked,

        maxTxPercent:
        Number(
            document
            .getElementById("maxTxValue")
            .value || 0
        ),

        tradingControlEnabled:
        document
        .getElementById("tradingControl")
        .checked,

        tradingEnabled: false,

        buyTaxEnabled:
        document
        .getElementById("buyTax")
        .checked,

        buyTax:
        Number(
            document
            .getElementById("buyTaxValue")
            .value || 0
        ),

        sellTaxEnabled:
        document
        .getElementById("sellTax")
        .checked,

        sellTax:
        Number(
            document
            .getElementById("sellTaxValue")
            .value || 0
        ),

        burnTaxShare:
        Number(
            document
            .getElementById("burnTaxShare")
            .value || 0
        ),

        marketingWallet:
        document
        .getElementById("marketingWallet")
        .value
        .trim()
        ||
        ethers.ZeroAddress,

        developmentWallet:
        document
        .getElementById("developmentWallet")
        .value
        .trim()
        ||
        ethers.ZeroAddress

    };

}

export function validateConfig(
    config
) {

    if(!config.name)
        throw new Error(
            "Token name required"
        );

    if(!config.symbol)
        throw new Error(
            "Token symbol required"
        );

    if(config.supply <= 0)
        throw new Error(
            "Supply required"
        );

    if(config.buyTax > 10)
        throw new Error(
            "Buy tax max 10%"
        );

    if(config.sellTax > 10)
        throw new Error(
            "Sell tax max 10%"
        );

    if(
        config.buyTaxEnabled ||
        config.sellTaxEnabled
    ){

        const hasReceiver =

            config.burnTaxShare > 0 ||

            config.marketingWallet !==
            ethers.ZeroAddress ||

            config.developmentWallet !==
            ethers.ZeroAddress;

        if(!hasReceiver){

            throw new Error(
                "Tax receiver missing"
            );

        }

    }

}
