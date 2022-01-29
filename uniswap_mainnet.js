
const ethers = require('ethers');
const fs = require('fs');
const https = require('https');
const { AlphaRouter } = require('@uniswap/smart-order-router');
const { CurrencyAmount, Ether, Percent, Token, TradeType } = require('@uniswap/sdk-core');

const { abi: ERC20ABI } = require('@openzeppelin/contracts/build/contracts/ERC20.json');

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const infura_id = "07bc63faa17b4eae96c758bca58cfa85";

// Mainnet
// const UNISWAP_V3_SWAP_ROUTER_ADDRESS = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
//const CHAIN_ID = 1;
//const provider = new ethers.providers.JsonRpcProvider(
//    `https://mainnet.infura.io/v3/${INFURA_ID}`);

// Rinkeby
const CHAIN_ID = 4;
const provider = new ethers.providers.JsonRpcProvider(
    `https://rinkeby.infura.io/v3/${INFURA_ID}`);
const UNISWAP_V3_SWAP_ROUTER_ADDRESS = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";

const FEE = 3000;

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

  console.log('Getting token data');
  const tokenData = await getJson('https://gateway.ipfs.io/ipns/tokens.uniswap.org');
  const fromCurrency = getCurrency(fromToken, tokenData);
  const toCurrency = getCurrency(toToken, tokenData);

  console.log('Getting route from router');
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
  //console.log(route);
  console.log(`Found route! Cost \$${route.estimatedGasUsedUSD.toFixed()}`);

  if (!fromCurrency.isNative) {
    const fromContract = new ethers.Contract(fromCurrency.address, ERC20ABI, wallet);
    const allowance = parseInt(await fromContract.allowance(address, UNISWAP_V3_SWAP_ROUTER_ADDRESS));
    console.log(`Allowance is ${allowance / 1e18}`);
    if (allowance < rawAmount * 1e18) {
      console.log(`Increase allowance to ${rawAmount}`);
      if (!dryRun) {
        await fromContract.approve(UNISWAP_V3_SWAP_ROUTER_ADDRESS, BigInt(rawAmount * 1e18).toString());
      }
    }
  }

  const transaction = {
    data: route.methodParameters.calldata,
    to: UNISWAP_V3_SWAP_ROUTER_ADDRESS,
    value: route.methodParameters.value,
    from: address,
    gasPrice: route.gasPriceWei,
    gasLimit: route.estimatedGasUsed * 1.2,
  };

  //console.log(transaction);

  console.log(`Performing swap...`);
  if (!dryRun) {
    const result = await wallet.sendTransaction(transaction);
    console.log(result.hash);
    //console.log(result);
  }
}

process.on('exit', () => {
  console.log('Node process shutting down.');
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception!');
  console.error(error);
});

main()
  .then(() => console.log('Done'))
  .catch(error => {
    console.error(error);
  });
