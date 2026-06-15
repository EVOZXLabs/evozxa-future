import { connectWallet } from "./wallet.js";

const connectBtn =
document.getElementById("connectBtn");

connectBtn.addEventListener(
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

        } catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Wallet connection failed"
            );

        }

    }
);
