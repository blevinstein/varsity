
const ethers = require('ethers');
const fs = require('fs');

const { POSClient, use } = require('@maticnetwork/maticjs');
const { Web3ClientPlugin } = require('@maticnetwork/maticjs-ethers');

const INFURA_ID = "07bc63faa17b4eae96c758bca58cfa85";

use(Web3ClientPlugin);

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

function longToString(number) {
  return BigInt(number).toString();
}

async function main() {
  const argv = yargs(hideBin(process.argv)).array('input').argv;

  const dryRun = argv.noDryRun === undefined;
  const amount = parseFloat(argv.amount);
  const mainnet = argv.mainnet !== undefined;

  console.log(mainnet
      ? 'Setting up mainnet...'
      : 'Setting up testnet...');
  const ethProvider = mainnet
      ? new ethers.providers.JsonRpcProvider('https://cloudflare-eth.com')
      : new ethers.providers.JsonRpcProvider(`https://goerli.infura.io/v3/${INFURA_ID}`);
  const maticProvider = new ethers.providers.JsonRpcProvider(mainnet
      ? 'https://polygon-rpc.com'
      : 'https://rpc-mumbai.maticvigil.com/v1/5879797d6e4f3d3742e5ca26a1cfd3d38caa26e8');

  console.log(`Reading key from ${argv.key}`);
  const {address, privateKey} = JSON.parse(fs.readFileSync(argv.key));

  const l1Balance = parseInt(await ethProvider.getBalance(address));
  const l2Balance = parseInt(await maticProvider.getBalance(address));
  console.log(`Balances: ${l1Balance / 1e18} (L1) ${l2Balance / 1e18} (L2)`);

  let posClient;
  if (dryRun) {
    console.log('DRY RUN MODE');
  } else {
    posClient = new POSClient();
    await posClient.init({
      network: 'mainnet',
      version: 'v1',
      parent: {
        provider: new ethers.Wallet(privateKey, ethProvider),
        defaultConfig: { from: address },
      },
      child: {
        provider: new ethers.Wallet(privateKey, maticProvider),
        defaultConfig: { from: address },
      },
    });
  }

  if (argv.token === undefined || argv.token == 'ETH') {
    console.log(`Bridge ${amount} ETH for address ${address}`);
    if (!dryRun) {
      const result = await (await posClient.depositEther(longToString(argv.amount * 1e18), address)).promise;
      console.log(result);
    }
  } else if (argv.token == 'MATIC') {
    console.log(`Bridge ${amount} MATIC for address ${address}`);
    if (!dryRun) {
      const maticToken = posClient.erc20('0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0', true);
      const result = await (await maticToken.deposit(longToString(argv.amount * 1e18), address)).promise;
      console.log(result);
    }
  } else {
    throw Error(`Unexpected token: ${argv.token}`);
  }

  console.log('Done');
}

main();
