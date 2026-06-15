export const FEATURE_PRICES = {

base: 10,

burnable: 5,
mintable: 20,
ownership: 5,

maxWallet: 5,
maxTx: 5,

tradingControl: 10,

buyTax: 20,
sellTax: 20,

website: 1,
telegram: 1,
twitter: 1,

logo: 2

};

export function calculateFee(features) {

let total =
FEATURE_PRICES.base;

if(features.burnable)
total += FEATURE_PRICES.burnable;

if(features.mintable)
total += FEATURE_PRICES.mintable;

if(features.ownership)
total += FEATURE_PRICES.ownership;

if(features.maxWallet)
total += FEATURE_PRICES.maxWallet;

if(features.maxTx)
total += FEATURE_PRICES.maxTx;

if(features.tradingControl)
total += FEATURE_PRICES.tradingControl;

if(features.buyTax)
total += FEATURE_PRICES.buyTax;

if(features.sellTax)
total += FEATURE_PRICES.sellTax;

if(features.website)
total += FEATURE_PRICES.website;

if(features.telegram)
total += FEATURE_PRICES.telegram;

if(features.twitter)
total += FEATURE_PRICES.twitter;

if(features.logo)
total += FEATURE_PRICES.logo;

return total;

}
