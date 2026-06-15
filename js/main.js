import {
    connectWallet,
    getSigner,
    getAddress
}
from "./wallet.js";

import {
    loadBalances
}
from "./balance.js";

import {
    loadFactory,
    loadEvozx,
    buildTokenConfig,
    validateConfig
}
from "./deploy.js";

import {
    buyMissingEVOZX
}
from "./exchange.js";

import {
    CONFIG
}
from "./config.js";



const connectBtn =
document.getElementById(
    "connectBtn"
);



connectBtn?.addEventListener(
    "click",
    async () => {

        try {

            const wallet =
            await connectWallet();

            if(!wallet) return;

            const shortAddress =
                wallet.address.slice(0,6) +
                "..." +
                wallet.address.slice(-4);

            connectBtn.textContent =
                shortAddress;

            document.getElementById(
                "walletAddress"
            ).textContent =
                shortAddress;

            await refreshBalances();

        }
        catch(error){

            console.error(error);

            alert(
                error.message
            );

        }

    }
);



async function refreshBalances(){

    const signer =
    getSigner();

    if(!signer) return;

    const balances =
    await loadBalances(
        signer.provider,
        getAddress()
    );

    document.getElementById(
        "evozBalance"
    ).textContent =
    Number(
        balances.evoz
    ).toFixed(4);

    document.getElementById(
        "evozxBalance"
    ).textContent =
    Number(
        balances.evozx
    ).toFixed(4);

}



const deployBtn =
document.getElementById(
    "deployBtn"
);



deployBtn?.addEventListener(
    "click",
    async () => {

        try {

            deployBtn.disabled = true;

            const signer =
            getSigner();

            if(!signer){

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



            const exists =
            await factory.symbolExists(
                config.symbol
            );

            if(exists){

                throw new Error(
                    "Symbol already exists"
                );

            }



            const fee =
            await factory.getDeploymentFee(
                config
            );



            console.log(
                "Fee EVOZX:",
                ethers.formatEther(
                    fee
                )
            );



            let balance =
            await evozx.balanceOf(
                getAddress()
            );



            if(balance < fee){

                const missing =
                    fee -
                    balance;

                console.log(
                    "Buying missing EVOZX..."
                );

                await buyMissingEVOZX(
                    signer,
                    Number(
                        ethers.formatEther(
                            missing
                        )
                    )
                );



                balance =
                await evozx.balanceOf(
                    getAddress()
                );

            }



            const allowance =
            await evozx.allowance(
                getAddress(),
                CONFIG.FACTORY
            );



            if(allowance < fee){

                console.log(
                    "Approving EVOZX..."
                );

                const approveTx =
                await evozx.approve(
                    CONFIG.FACTORY,
                    fee
                );

                await approveTx.wait();

            }



            console.log(
                "Creating Token..."
            );



            const tx =
            await factory.createToken(
                config
            );



            const receipt =
            await tx.wait();



            let tokenAddress =
            null;



            for(
                const log of receipt.logs
            ){

                try{

                    const parsed =
                    factory.interface.parseLog(
                        log
                    );

                    if(

                        parsed &&

                        parsed.name ===
                        "TokenCreated"

                    ){

                        tokenAddress =
                        parsed.args.token;

                        break;

                    }

                }
                catch{}

            }



            if(!tokenAddress){

                throw new Error(
                    "TokenCreated event not found"
                );

            }



            await refreshBalances();



            const explorerUrl =
            `${CONFIG.EXPLORER}/address/${tokenAddress}`;



            alert(

`Token deployed successfully

Address:
${tokenAddress}

Explorer:
${explorerUrl}`

            );



            console.log(
                "TOKEN",
                tokenAddress
            );

        }
        catch(error){

            console.error(error);

            alert(
                error.reason ||
                error.message ||
                "Deployment failed"
            );

        }
        finally{

            deployBtn.disabled =
            false;

        }

    }
);
