
const ethers = require('ethers');
const fs = require('fs');
const https = require('https');
const { AlphaRouter } = require('@uniswap/smart-order-router');
const { Pool, Route } = require('@uniswap/v3-sdk');
const { CurrencyAmount, Ether, Percent, Token, TradeType } = require('@uniswap/sdk-core');

const { abi: QuoterABI } = require("@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json");
const { abi: FactoryABI } = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json");
const { abi: PoolABI } = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json");

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const INFURA_ID = "07bc63faa17b4eae96c758bca58cfa85";

// Mainnet
// const UNISWAP_V3_SWAP_ROUTER_ADDRESS = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
const UNISWAP_V3_FACTORY_ADDRESS = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
const UNISWAP_V3_SWAP_ROUTER_ADDRESS = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";
const UNISWAP_QUOTER_ADDRESS = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";
//const CHAIN_ID = 1;
//const provider = new ethers.providers.JsonRpcProvider(
//    `https://mainnet.infura.io/v3/${INFURA_ID}`);

// Rinkeby
const CHAIN_ID = 4;
const provider = new ethers.providers.JsonRpcProvider(
    `https://rinkeby.infura.io/v3/${INFURA_ID}`);
const quoterContract = new ethers.Contract(UNISWAP_QUOTER_ADDRESS, QuoterABI, provider);
const factoryContract = new ethers.Contract(UNISWAP_V3_FACTORY_ADDRESS, FactoryABI, provider);

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

async function getPoolData(poolContract) {
  const [token0, token1, fee, liquidity, slot] = await Promise.all([
    poolContract.token0(),
    poolContract.token1(),
    poolContract.fee(),
    poolContract.liquidity(),
    poolContract.slot0()
  ]);
  return { token0, token1, fee, liquidity, sqrtPriceX96: slot[0], tick: slot[1] };
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

  const poolAddress = await factoryContract.getPool(
      fromCurrency.address,
      toCurrency.address,
      FEE);
  const poolContract = new ethers.Contract(poolAddress, PoolABI, provider);
  const poolData = await getPoolData(poolContract);
  const poolToken0 = fromCurrency.address == poolData.token0 ? fromCurrency : toCurrency;
  const poolToken1 = fromCurrency.address == poolData.token1 ? fromCurrency : toCurrency;
  const pool = new Pool(
      poolToken0,
      poolToken1,
      poolData.fee,
      poolData.sqrtPriceX96.toString(),
      poolData.liquidity.toString(),
      poolData.tick);

  //const route = new Route([pool], fromCurrency, toCurrency);
  /*
  const quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(
      fromCurrency.address,
      toCurrency.address,
      FEE,
      BigInt(rawAmount * 1e18).toString(),
      0);
  const trade = await Trade.createUncheckedTrade({
    route,
    inputAmount: CurrencyAmount.fromRawAmount(fromCurrency, rawAmount * 1e18),
    outputAmount: CurrencyAmount.fromRawAmount(toCurrency, quotedAmountOut.toString()),
    tradeType: TradeType.EXACT_INPUT,
  });
  console.log(trade);
  */

  const route = await router.route(
    CurrencyAmount.fromRawAmount(fromCurrency, rawAmount * 1e18),
    toCurrency,
    TradeType.EXACT_INPUT,
    {
      recipient: address,
      slippageTolerance: new Percent(5, 100),
      deadline: Math.floor(new Date().getTime() / 1000) + 6 * 60 * 60,
    }
  );
  console.log(route);
  console.log(`Found route! Cost \$${route.estimatedGasUsedUSD.toFixed()}`);

  const transaction = {
    data: route.methodParameters.calldata,
    to: UNISWAP_V3_SWAP_ROUTER_ADDRESS,
    value: route.methodParameters.value,
    from: address,
    gasPrice: route.gasPriceWei,
    gasLimit: route.estimatedGasUsed * 1.5,
  };

  console.log(transaction);

  if (!dryRun) {
    console.log(`Performing transaction...`);
    const result = await wallet.sendTransaction(transaction);
    console.log(result);
  }

  console.log('Done');
}

main();
