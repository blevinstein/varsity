
const fs = require('fs');
const Web3 = require('web3');

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const INFURA_ID = "07bc63faa17b4eae96c758bca58cfa85";

const web3 = new Web3(new Web3.providers.HttpProvider(
    `https://mainnet.infura.io/v3/${INFURA_ID}`,
    {
      reconnect: {
        auto: true,
        delay: 3000, //ms
        maxAttempts: 5,
        onTimeout: false
      }
    }));

function longToString(number) {
  return BigInt(number).toString();
}

const OPTIMISM_GATEWAY = '0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1';
const OPTIMISM_L2_GATEWAY = '0x4200000000000000000000000000000000000010';
const IL1StandardBridgeAbi = JSON.parse(fs.readFileSync('build/contracts/IL1StandardBridge.json')).abi;

const bridge = new web3.eth.Contract(IL1StandardBridgeAbi, OPTIMISM_GATEWAY);

async function main() {
  const argv = yargs(hideBin(process.argv)).array('input').argv;

  const dryRun = argv.noDryRun === undefined;
  const amount = parseFloat(argv.amount);

  console.log(`Reading key from ${argv.key}`);
  const {address, privateKey} = JSON.parse(fs.readFileSync(argv.key));
  if (dryRun) {
    console.log('DRY RUN MODE');
  } else {
    web3.eth.accounts.wallet.add(privateKey);
  }

  if (await bridge.methods.l2TokenBridge().call() != OPTIMISM_L2_GATEWAY) {
    throw Error('Bad environment');
  }

  console.log(`Bridge ${amount} ETH for address ${address}`);
  if (!dryRun) {
    const result = await bridge.methods.depositETH(13e5, 64).send({
        from: address,
        value: longToString(amount * 1e18),
        gas: 160e3,
    });
    console.log(result);
  }

  console.log('Done');
}

main();
