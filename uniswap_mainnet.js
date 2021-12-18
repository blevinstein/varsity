
const ethers = require('ethers');
const fs = require('fs');
const https = require('https');
const { AlphaRouter } = require('@uniswap/smart-order-router');
const { CurrencyAmount, Ether, Percent, Token, TradeType } = require('@uniswap/sdk-core');

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const INFURA_ID = "07bc63faa17b4eae96c758bca58cfa85";

// Mainnet
const UNISWAP_V3_SWAP_ROUTER_ADDRESS = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
//const CHAIN_ID = 1;
//const provider = new ethers.providers.JsonRpcProvider(
//    `https://mainnet.infura.io/v3/${INFURA_ID}`);

// Rinkeby
const CHAIN_ID = 4;
const provider = new ethers.providers.JsonRpcProvider(
    `https://rinkeby.infura.io/v3/${INFURA_ID}`);

const router = new AlphaRouter({
  chainId: CHAIN_ID,
  provider
});

function getJson(url) {
  return new Promise((resolve, reject) => {
    const request = https.request(url, (result) => {
      if (result.statusCode != 200) {
        reject(result.statusCode);
      } else {
        let fullData = Buffer.from([]);
        result.on('data', (data) => fullData = Buffer.concat([fullData, data]));
        result.on('end', () => resolve(JSON.parse(fullData)));
      }
    });
    request.end();
  });
}

function getCurrency(symbol, tokenData) {
  if (symbol == 'ETH') {
    return Ether.onChain(CHAIN_ID);
  } else {
    const tokenDatum = tokenData.tokens.find(t => t.symbol == symbol && t.chainId == CHAIN_ID)
        || (() => { throw Error(`Token not found: ${symbol}`); })();
    return new Token(CHAIN_ID,
        tokenDatum.address,
        tokenDatum.decimals,
        tokenDatum.symbol,
        tokenDatum.name);
  }
}

async function main() {
  const argv = yargs(hideBin(process.argv)).array('input').argv;

  const dryRun = argv.noDryRun === undefined;
  const rawAmount = parseFloat(argv.amount);
  const fromToken = argv.from;
  const toToken = argv.to;

  console.log(`Reading key from ${argv.key}`);
  const {address, privateKey} = JSON.parse(fs.readFileSync(argv.key));
  let wallet;
  if (dryRun) {
    console.log('DRY RUN MODE');
  } else {
    wallet = new ethers.Wallet(privateKey, provider);
  }

  const tokenData = await getJson('https://gateway.ipfs.io/ipns/tokens.uniswap.org');
  const fromCurrency = getCurrency(fromToken, tokenData);
  const toCurrency = getCurrency(toToken, tokenData);

  const route = await router.route(
    CurrencyAmount.fromRawAmount(fromCurrency, rawAmount * 1e18),
    toCurrency,
    TradeType.EXACT_INPUT,
    {
      recipient: address,
      slippageTolerance: new Percent(5, 100),
      deadline: Math.floor(new Date().getTime() / 1000) + /* 6 hours */ 6 * 60 * 60,
    }
  );
  console.log(`Found route! Cost \$${route.estimatedGasUsedUSD.toFixed()}`);

  const transaction = {
    data: route.methodParameters.calldata,
    to: UNISWAP_V3_SWAP_ROUTER_ADDRESS,
    value: route.methodParameters.value,
    from: address,
    gasPrice: route.gasPriceWei,
    gasLimit: route.estimatedGasUsed * 1.5,
  };

  console.log(route);
  console.log(transaction);

  if (!dryRun) {
    console.log(`Performing transaction...`);
    const result = await wallet.sendTransaction(transaction);
    console.log(result);
  }

  console.log('Done');
}

main();