
const fs = require('fs');
const ethers = require('ethers');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const { check, randomExponential } = require('./common');

async function main() {
  const argv = yargs(hideBin(process.argv)).array('input').argv;
  const mnemonic = argv.mnemonic || ethers.Wallet.createRandom().mnemonic.phrase;
  const output = check(argv.output);
  const n = argv.n || 1;
  const regions = argv.regions ? argv.regions.split(/[\s,]/) : ['TEST'];

  console.log(`Generating ${n} accounts using mnemonic phrase: ${mnemonic}`);

  const accounts = [];
  for (let i = 0; i < n; ++i) {
    const path = `m/44'/60'/0'/0/${i}`;
    const wallet = ethers.Wallet.fromMnemonic(mnemonic, path);
    const region = regions[i % regions.length];
    console.log(`Address ${wallet.address} region ${region}`);
    accounts.push({
      address: wallet.address,
      privateKey: wallet.privateKey,
      region,
      mnemonic,
      path,
    });
  }

  fs.writeFileSync(output, JSON.stringify(accounts, null, 4));

  console.log('Done');
}

main();
