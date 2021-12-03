
const ethers = require('ethers');
const fs = require('fs');

const { POSClient, use } = require('@maticnetwork/maticjs');
const { Web3ClientPlugin } = require('@maticnetwork/maticjs-ethers');


use(Web3ClientPlugin);

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const INFURA_ID = "07bc63faa17b4eae96c758bca58cfa85";

const ethProvider = new ethers.providers.JsonRpcProvider(
    `https://mainnet.infura.io/v3/${INFURA_ID}`);
const maticProvider = new ethers.providers.JsonRpcProvider(
    'https://polygon-rpc.com');

function longToString(number) {
  return BigInt(number).toString();
}

const OPTIMISM_GATEWAY = '0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1';
const OPTIMISM_L2_GATEWAY = '0x4200000000000000000000000000000000000010';

async function main() {
  const argv = yargs(hideBin(process.argv)).array('input').argv;

  const dryRun = argv.noDryRun === undefined;
  const amount = parseFloat(argv.amount);

  console.log(`Reading key from ${argv.key}`);
  const {address, privateKey} = JSON.parse(fs.readFileSync(argv.key));

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


  console.log(`Bridge ${amount} ETH for address ${address}`);
  if (!dryRun) {
    const result = await (await posClient.depositEther(longToString(argv.amount * 1e18), address)).promise;
    console.log(result);
  }

  console.log('Done');
}

main();
