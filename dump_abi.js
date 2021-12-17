
const fs = require('fs');
const Web3 = require('web3');
const web3 = new Web3();

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

async function main() {
  const argv = yargs(hideBin(process.argv)).array('input').argv;

  if (argv.interface) {
    const interface = JSON.parse(fs.readFileSync(argv.interface));
    for (let method of interface.abi) {
      console.log(`${method.name} => ${web3.eth.abi.encodeFunctionSignature(method)}`);
    }
  }

  if (argv.string) {
    console.log(`${argv.string} => ${web3.eth.abi.encodeFunctionSignature(argv.string)}`);
  }
}

main();
