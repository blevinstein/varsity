
const ethers = require('ethers');
const fs = require('fs');
const zksync = require('zksync');

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const INFURA_ID = "07bc63faa17b4eae96c758bca58cfa85";

function longToString(number) {
  return BigInt(number).toString();
}

const ARBITRUM_GATEWAY = '0x72Ce9c846789fdB6fC1f34aC4AD25Dd9ef7031ef';
const ARBITRUM_L2_GATEWAY = '0x5288c571Fd7aD117beA99bF60FE0846C4E84F933';

async function main() {
  const argv = yargs(hideBin(process.argv)).array('input').argv;

  const dryRun = argv.noDryRun === undefined;

  const ethProvider = new ethers.providers.JsonRpcProvider(
      `https://mainnet.infura.io/v3/${INFURA_ID}`);
  const syncProvider = await zksync.getDefaultProvider('mainnet');

  console.log(`Reading key from ${argv.key}`);
  const {address, privateKey} = JSON.parse(fs.readFileSync(argv.key));

  let ethWallet, syncWallet;
  if (dryRun) {
    console.log('DRY RUN MODE');
  } else {
    ethWallet = new ethers.Wallet(privateKey, ethProvider);
    syncWallet = await zksync.Wallet.fromEthSigner(ethWallet, syncProvider);
  }

  console.log(`Bridge ${argv.amount} ETH for address ${address}`);
  if (!dryRun) {
    const result = await syncWallet.depositToSyncFromEthereum({
        depositTo: syncWallet.address(),
        token: 'ETH',
        amount: ethers.utils.parseEther(argv.amount.toString()),
    });
    console.log(result);
  }

  console.log('Done');
}

main();
