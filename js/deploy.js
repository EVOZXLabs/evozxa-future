import { CONFIG } from "./config.js";

export async function loadFactory(
    signer
) {

    const abi =
        await fetch(
            "./abi/factory.json"
        ).then(
            r => r.json()
        );

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
        ).then(
            r => r.json()
        );

    return new ethers.Contract(
        CONFIG.EVOZX,
        abi,
        signer
    );

}

export async function loadExchange(
    signer
) {

    const abi =
        await fetch(
            "./abi/exchange.json"
        ).then(
            r => r.json()
        );

    return new ethers.Contract(
        CONFIG.EXCHANGE,
        abi,
        signer
    );

}

export function buildTokenConfig() {

    const marketingWalletInput =
        document
        .getElementById(
            "marketingWallet"
        )
        ?.value
        ?.trim();

    const developmentWalletInput =
        document
        .getElementById(
            "developmentWallet"
        )
        ?.value
        ?.trim();

    return {

        name:
        document
        .getElementById("name")
        ?.value
        ?.trim() || "",

        symbol:
        document
        .getElementById("symbol")
        ?.value
        ?.trim()
        ?.toUpperCase() || "",

        supply:
        Number(
            document
            .getElementById("supply")
            ?.value || 0
        ),

        owner:
        ethers.ZeroAddress,

        chainId:
        0,

        launchKitVersion:
        0,

        burnable:
        document
        .getElementById("burnable")
        ?.checked || false,

        mintable:
        document
        .getElementById("mintable")
        ?.checked || false,

        ownershipEnabled:
        document
        .getElementById("ownership")
        ?.checked || false,

        website:
        document
        .getElementById("websiteUrl")
        ?.value
        ?.trim() || "",

        telegram:
        document
        .getElementById("telegramUrl")
        ?.value
        ?.trim() || "",

        twitter:
        document
        .getElementById("twitterUrl")
        ?.value
        ?.trim() || "",

        logoURI:
        document
        .getElementById("logoUrl")
        ?.value
        ?.trim() || "",

        maxWalletEnabled:
        document
        .getElementById("maxWallet")
        ?.checked || false,

        maxWalletPercent:
        Math.min(
            100,
            Number(
                document
                .getElementById(
                    "maxWalletValue"
                )
                ?.value || 0
            )
        ),

        maxTxEnabled:
        document
        .getElementById("maxTx")
        ?.checked || false,

        maxTxPercent:
        Math.min(
            100,
            Number(
                document
                .getElementById(
                    "maxTxValue"
                )
                ?.value || 0
            )
        ),

        tradingControlEnabled:
        document
        .getElementById(
            "tradingControl"
        )
        ?.checked || false,

        tradingEnabled:
        document
        .getElementById(
            "tradingEnabled"
        )
        ?.checked || false,

        buyTaxEnabled:
        document
        .getElementById("buyTax")
        ?.checked || false,

        buyTax:
        Math.min(
            10,
            Number(
                document
                .getElementById(
                    "buyTaxValue"
                )
                ?.value || 0
            )
        ),

        sellTaxEnabled:
        document
        .getElementById("sellTax")
        ?.checked || false,

        sellTax:
        Math.min(
            10,
            Number(
                document
                .getElementById(
                    "sellTaxValue"
                )
                ?.value || 0
            )
        ),

        burnTaxShare:
        Math.min(
            100,
            Number(
                document
                .getElementById(
                    "burnTaxShare"
                )
                ?.value || 0
            )
        ),

        marketingWallet:

        marketingWalletInput &&
        ethers.isAddress(
            marketingWalletInput
        )
        ?
        marketingWalletInput
        :
        ethers.ZeroAddress,

        developmentWallet:

        developmentWalletInput &&
        ethers.isAddress(
            developmentWalletInput
        )
        ?
        developmentWalletInput
        :
        ethers.ZeroAddress

    };

}

export function validateConfig(
    config
) {

    if(
        !config.name
    ){

        throw new Error(
            "Token name required"
        );

    }

    if(
        !config.symbol
    ){

        throw new Error(
            "Token symbol required"
        );

    }

    if(
        config.symbol.length < 2
    ){

        throw new Error(
            "Symbol too short"
        );

    }

    if(
        config.supply <= 0
    ){

        throw new Error(
            "Supply must be greater than zero"
        );

    }

    if(
        config.supply >
        1000000000000
    ){

        throw new Error(
            "Maximum supply is 1,000,000,000,000"
        );

    }

    if(
        config.buyTax < 0 ||
        config.buyTax > 10
    ){

        throw new Error(
            "Buy tax max 10%"
        );

    }

    if(
        config.sellTax < 0 ||
        config.sellTax > 10
    ){

        throw new Error(
            "Sell tax max 10%"
        );

    }

    if(
        config.maxWalletEnabled &&
        (
            config.maxWalletPercent <= 0 ||
            config.maxWalletPercent > 100
        )
    ){

        throw new Error(
            "Max Wallet must be between 1 and 100"
        );

    }

    if(
        config.maxTxEnabled &&
        (
            config.maxTxPercent <= 0 ||
            config.maxTxPercent > 100
        )
    ){

        throw new Error(
            "Max Tx must be between 1 and 100"
        );

    }

    if(
        config.marketingWallet !==
        ethers.ZeroAddress
    ){

        if(
            !ethers.isAddress(
                config.marketingWallet
            )
        ){

            throw new Error(
                "Invalid marketing wallet"
            );

        }

    }

    if(
        config.developmentWallet !==
        ethers.ZeroAddress
    ){

        if(
            !ethers.isAddress(
                config.developmentWallet
            )
        ){

            throw new Error(
                "Invalid development wallet"
            );

        }

    }

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

        if(
            !hasReceiver
        ){

            throw new Error(
                "Tax receiver missing"
            );

        }

    }

}
