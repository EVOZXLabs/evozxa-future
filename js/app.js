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
    CONFIG
} from "./config.js";

/* =========================================================
   DOM
========================================================= */

const connectBtn =
    document.getElementById("connectBtn");

const deployBtn =
    document.getElementById("deployBtn");

const feeEvozxEl =
    document.getElementById("evozxFee");

const feeEvozEl =
    document.getElementById("evozFee");

const statusEl =
    document.getElementById("deployStatus");

/* =========================================================
   STATUS
========================================================= */

function setStatus(message) {

    console.log(message);

    if (statusEl) {
        statusEl.textContent = message;
    }
}

/* =========================================================
   ACCORDION
========================================================= */

window.toggleAcc = function(header) {

    const content =
        header.nextElementSibling;

    if (!content) return;

    content.style.display =
        content.style.display === "block"
            ? "none"
            : "block";
};

window.toggleInput = function(checkbox) {

    const wrapper =
        checkbox.closest(".feature-wrapper");

    if (!wrapper) return;

    const input =
        wrapper.querySelector(".hidden-input");

    if (!input) return;

    input.disabled =
        !checkbox.checked;

    input.style.display =
        checkbox.checked
            ? "block"
            : "none";

    if (!checkbox.checked) {
        input.value = "";
    }

    updateFee();
};

/* =========================================================
   WALLET
========================================================= */

async function refreshBalances() {

    try {

        const signer =
            getSigner();

        if (!signer) return;

        const balances =
            await loadBalances(
                signer.provider,
                getAddress()
            );

        const evozEl =
            document.getElementById(
                "evozBalance"
            );

        const evozxEl =
            document.getElementById(
                "evozxBalance"
            );

        if (evozEl) {
            evozEl.textContent =
                Number(
                    balances.evoz
                ).toFixed(4);
        }

        if (evozxEl) {
            evozxEl.textContent =
                Number(
                    balances.evozx
                ).toFixed(4);
        }

    } catch(error) {

        console.error(
            "Balance refresh error",
            error
        );
    }
}

connectBtn?.addEventListener(
    "click",
    async () => {

        try {

            const wallet =
                await connectWallet();

            if (!wallet) return;

            const shortAddress =
                wallet.address.slice(0, 6) +
                "..." +
                wallet.address.slice(-4);

            connectBtn.textContent =
                shortAddress;

            const walletAddress =
                document.getElementById(
                    "walletAddress"
                );

            if (walletAddress) {
                walletAddress.textContent =
                    shortAddress;
            }

            await refreshBalances();

            await updateFee();

        } catch(error) {

            console.error(error);

            alert(
                error.message ||
                "Wallet connection failed"
            );
        }
    }
);

/* =========================================================
   FEE CALCULATOR
========================================================= */

let feeTimer;

async function updateFee() {

    clearTimeout(feeTimer);

    feeTimer = setTimeout(
        async () => {

            try {

                const signer =
                    getSigner();

                if (!signer) return;

                const factory =
                    await loadFactory(
                        signer
                    );

                const config =
                    buildTokenConfig(
                        getAddress()
                    );

                const fee =
                    await factory.getDeploymentFee(
                        config
                    );

                const feeEVOZX =
                    Number(
                        ethers.formatEther(
                            fee
                        )
                    );

                const feeEVOZ =
                    feeEVOZX * 5;

                if (feeEvozxEl) {
                    feeEvozxEl.textContent =
                        feeEVOZX.toFixed(2);
                }

                if (feeEvozEl) {
                    feeEvozEl.textContent =
                        feeEVOZ.toFixed(2);
                }

            } catch(error) {

                console.log(
                    "Fee calculation skipped:",
                    error.message
                );
            }

        },
        250
    );
}

document.addEventListener(
    "input",
    (event) => {

        if (
            event.target.matches(
                "input,select,textarea"
            )
        ) {
            updateFee();
        }
    }
);

document.addEventListener(
    "change",
    (event) => {

        if (
            event.target.matches(
                "input,select,textarea"
            )
        ) {
            updateFee();
        }
    }
);

/* =========================================================
   DEPLOY RESULT
========================================================= */

function showDeploymentResult(
    tokenAddress,
    config
) {

    const resultCard =
        document.getElementById(
            "deploymentResult"
        );

    const tokenAddressEl =
        document.getElementById(
            "tokenAddress"
        );

    const explorerLink =
        document.getElementById(
            "explorerLink"
        );

    const verificationLink =
        document.getElementById(
            "verificationLink"
        );

    if (resultCard) {
        resultCard.classList.remove(
            "hidden"
        );
    }

    if (tokenAddressEl) {
        tokenAddressEl.textContent =
            tokenAddress;
    }

    if (explorerLink) {

        explorerLink.href =
            `${CONFIG.EXPLORER}/token/${tokenAddress}`;

        explorerLink.textContent =
            "Open Explorer";
    }

    if (verificationLink) {

        verificationLink.href =
            "./assets/standard-input.json";

        verificationLink.download =
            `${config.symbol}-standard-input.json`;

        verificationLink.textContent =
            "Download Package";
    }

    const deployments =
        JSON.parse(
            localStorage.getItem(
                "evozxaDeployments"
            ) || "[]"
        );

    deployments.unshift({

        name:
            config.name,

        symbol:
            config.symbol,

        token:
            tokenAddress,

        timestamp:
            Date.now()
    });

    localStorage.setItem(
        "evozxaDeployments",
        JSON.stringify(
            deployments
        )
    );
}

/* =========================================================
   DEPLOY TOKEN
========================================================= */

deployBtn?.addEventListener(
    "click",
    async () => {

        try {

            deployBtn.disabled = true;

            setStatus(
                "Preparing deployment..."
            );

            const signer =
                getSigner();

            if (!signer) {
                throw new Error(
                    "Connect wallet first"
                );
            }

            const factory =
                await loadFactory(
                    signer
                );

            const evozx =
                await loadEvozx(
                    signer
                );

            const config =
                buildTokenConfig(
                    getAddress()
                );

            validateConfig(
                config
            );

            setStatus(
                "Calculating fee..."
            );

            const fee =
                await factory.getDeploymentFee(
                    config
                );

            const balance =
                await evozx.balanceOf(
                    getAddress()
                );

            if (balance < fee) {

                throw new Error(
                    `Insufficient EVOZX balance.

Required:
${ethers.formatEther(fee)} EVOZX`
                );
            }

            setStatus(
                "Checking allowance..."
            );

            const allowance =
                await evozx.allowance(
                    getAddress(),
                    CONFIG.FACTORY
                );

            if (allowance < fee) {

                setStatus(
                    "Approve EVOZX..."
                );

                const approveTx =
                    await evozx.approve(
                        CONFIG.FACTORY,
                        fee
                    );

                await approveTx.wait();
            }

            setStatus(
                "Deploying token..."
            );

            const tx =
                await factory.createToken(
                    config
                );

            const receipt =
                await tx.wait();

            let tokenAddress =
                null;

            for (
                const log
                of receipt.logs
            ) {

                try {

                    const parsed =
                        factory.interface.parseLog(
                            log
                        );

                    if (
                        parsed &&
                        parsed.name ===
                            "TokenCreated"
                    ) {

                        tokenAddress =
                            parsed.args.token;

                        break;
                    }

                } catch {}
            }

            if (!tokenAddress) {

                throw new Error(
                    "TokenCreated event not found"
                );
            }

            await refreshBalances();

            showDeploymentResult(
                tokenAddress,
                config
            );

            setStatus(
                "Deployment completed"
            );

            alert(
`🚀 TOKEN DEPLOYED

Name:
${config.name}

Symbol:
${config.symbol}

Address:
${tokenAddress}`
            );

        } catch(error) {

            console.error(error);

            setStatus(
                "Deployment failed"
            );

            alert(
                error.reason ||
                error.shortMessage ||
                error.message ||
                "Deployment failed"
            );

        } finally {

            deployBtn.disabled =
                false;
        }
    }
);

/* =========================================================
   INIT
========================================================= */

updateFee();
