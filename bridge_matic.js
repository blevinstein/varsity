
const ethers = require('ethers');
const fs = require('fs');

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const { bridge, checkBalance } = require('./skytrain/runner/chains/matic');
const { check, longToString } = require('./skytrain/scripts/common');

async function main() {
  const argv = yargs(hideBin(process.argv)).array('input').argv;

  const dryRun = argv.noDryRun === undefined;
  const amount = parseFloat(argv.amount);
  const mainnet = argv.mainnet !== undefined;
  const accounts = argv.key
    ? [JSON.parse(fs.readFileSync(argv.key))]
    : JSON.parse(fs.readFileSync(argv.accounts));

  for (let account of accounts) {
    const {address, privateKey} = account;
    console.log(`Address: ${address}`);

    console.log('Checking balance');
    const checkOptions = {
      amount: amount * 1e18,
      network: mainnet ? 'mainnet' : 'testnet',
      address,
      token: argv.token
    };
    await checkBalance(checkOptions);

    const bridgeOptions = {
      amount: amount * 1e18,
      network: mainnet ? 'mainnet' : 'testnet',
      address,
      privateKey,
      token: argv.token
    };

    let posClient;
    if (dryRun) {
      console.log('DRY RUN MODE');
      console.log(bridgeOptions);
    } else {
      await bridge(bridgeOptions);
    }
  }

  console.log('Done');
}

main();
