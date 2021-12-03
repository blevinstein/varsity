
const { Bridge } = require('arb-ts');
const { providers, utils, Wallet } = require('ethers');
const fs = require('fs');

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const INFURA_ID = "07bc63faa17b4eae96c758bca58cfa85";

const ethProvider = new providers.JsonRpcProvider(
    `https://mainnet.infura.io/v3/${INFURA_ID}`);
const arbProvider = new providers.JsonRpcProvider(
    'https://arb1.arbitrum.io/rpc');

function longToString(number) {
  return BigInt(number).toString();
}

const ARBITRUM_GATEWAY = '0x72Ce9c846789fdB6fC1f34aC4AD25Dd9ef7031ef';
const ARBITRUM_L2_GATEWAY = '0x5288c571Fd7aD117beA99bF60FE0846C4E84F933';

async function main() {
  const argv = yargs(hideBin(process.argv)).array('input').argv;

  const dryRun = argv.noDryRun === undefined;

  console.log(`Reading key from ${argv.key}`);
  const {address, privateKey} = JSON.parse(fs.readFileSync(argv.key));

  let bridge;
  if (dryRun) {
    console.log('DRY RUN MODE');
  } else {
    const l1Wallet = new Wallet(privateKey, ethProvider);
    const l2Wallet = new Wallet(privateKey, arbProvider);
    bridge = await Bridge.init(l1Wallet, l2Wallet, ARBITRUM_GATEWAY, ARBITRUM_L2_GATEWAY);
  }

  console.log(`Bridge ${argv.amount} ETH for address ${address}`);
  if (!dryRun) {
    const result = await bridge.depositETH(utils.parseEther(argv.amount.toString()));
    console.log(result);
  }

  console.log('Done');
}

main();
