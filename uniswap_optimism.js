
const fs = require('fs');
const https = require('https');
const Web3 = require('web3');
const { AlphaRouter } = require('@uniswap/smart-order-router');
const { Ether, Token } = require('@uniswap/sdk-core');

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Optimism
const CHAIN_ID = 10;
const provider = new Web3.providers.HttpProvider(
    'https://mainnet.optimism.io',
    {
      reconnect: {
        auto: true,
        delay: 3000, //ms
        maxAttempts: 5,
        onTimeout: false
      }
    });

const web3 = new Web3(provider);

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
  const amount = parseFloat(argv.amount);
  const fromToken = argv.from;
  const toToken = argv.to;

  console.log(`Reading key from ${argv.key}`);
  const {address, privateKey} = JSON.parse(fs.readFileSync(argv.key));
  if (dryRun) {
    console.log('DRY RUN MODE');
  } else {
    web3.eth.accounts.wallet.add(privateKey);
  }

  const balance = await web3.eth.getBalance(address);
  if (balance < amount * 1e18) {
    throw Error(`Unsufficient funds: ${balance / 1e18} < ${amount}`);
  }

  const tokenData = await getJson('https://static.optimism.io/optimism.tokenlist.json');
  const fromTokenData = getCurrency(fromToken, tokenData);
  const toTokenData = getCurrency(toToken, tokenData);
  console.log(fromTokenData);
  console.log(toTokenData);

  console.log('Done');
}

main();
