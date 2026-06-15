import { CONFIG } from "./config.js";

export async function loadExchange(
    signer
) {

    const abi =
        await fetch(
            "./abi/exchange.json"
        ).then(r => r.json());

    return new ethers.Contract(
        CONFIG.EXCHANGE,
        abi,
        signer
    );
}

export async function getRate(
    signer
) {

    const exchange =
        await loadExchange(
            signer
        );

    return await exchange.rate();

}

export async function buyMissingEVOZX(
    signer,
    missingEvozx
) {

    const exchange =
        await loadExchange(
            signer
        );

    const rate =
        await exchange.rate();

    const evozRequired =
        missingEvozx * rate;

    const tx =
        await exchange.buyEVOZX({
            value:
            ethers.parseEther(
                evozRequired.toString()
            )
        });

    await tx.wait();

    return tx.hash;

}
