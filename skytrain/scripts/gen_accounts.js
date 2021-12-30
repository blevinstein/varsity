
const fs = require('fs');
const ethers = require('ethers');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

function randomExponential(average) {
  return -Math.log(Math.random()) * average;
}

async function main() {
  const argv = yargs(hideBin(process.argv)).array('input').argv;
  const mnemonic = argv.mnemonic;
  const output = argv.output;
  const n = argv.n;
  const regions = argv.regions ? argv.regions.split(/[\s,]/) : ['TEST'];
  const averageOffsetHours = argv.offsetHours;

  // Offset from current time
  let lastTime = new Date();

  const accounts = [];
  for (let i = 0; i < n; ++i) {
    const wallet = ethers.Wallet.fromMnemonic(mnemonic, `m/44'/60'/0'/0/${i}`);
    const region = regions[i % regions.length];
    const delayHours = randomExponential(averageOffsetHours);
    const startTime = new Date(lastTime.getTime() + delayHours * 60 * 60 * 1000);
    lastTime = startTime;
    console.log(`Address ${wallet.address} region ${region} starts at ${startTime}`);
    accounts.push({
      address: wallet.address,
      privateKey: wallet.privateKey,
      region,
      startTime: Math.floor(startTime.getTime() / 1000)
    });
  }

  fs.writeFileSync(output, JSON.stringify(accounts));

  console.log('Done');
}

main();
