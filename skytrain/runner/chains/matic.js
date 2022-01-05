
const ethers = require('ethers');
const fs = require('fs');

const { POSClient, use } = require('@maticnetwork/maticjs');
const { Web3ClientPlugin } = require('@maticnetwork/maticjs-ethers');

const { check, longToString } = require('../common');

const INFURA_ID = "07bc63faa17b4eae96c758bca58cfa85";

use(Web3ClientPlugin);

const getEthProvider = (mainnet) => new ethers.providers.JsonRpcProvider(mainnet
    ? 'https://cloudflare-eth.com/'
    : `https://goerli.infura.io/v3/${INFURA_ID}`);
const getMaticProvider = (mainnet) => new ethers.providers.JsonRpcProvider(mainnet
    ? 'https://polygon-rpc.com'
    : 'https://rpc-mumbai.maticvigil.com/v1/5879797d6e4f3d3742e5ca26a1cfd3d38caa26e8');

exports.checkBalance = async (options) => {
  const amount = check(options.amount);
  const mainnet = options.network == 'mainnet';
  const address = check(options.address);
  const token = options.token || 'ETH';

  const ethProvider = getEthProvider(mainnet);
  const maticProvider = getMaticProvider(mainnet);

  switch (token) {
    case 'ETH':
      const balance = parseInt(await ethProvider.getBalance(address));
      if (balance < amount) {
        throw Error(`Insufficient balance: ${balance / 1e18} (needed ${amount})`);
      } else {
        console.log(`Sufficient balance: ${balance / 1e18} (needed ${amount})`);
      }
      break;
    // TODO: case 'MATIC'
    default:
      throw Error(`Unexpected token: ${token}`);
  }
};

exports.bridge = async (options) => {
  const amount = check(options.amount);
  const mainnet = options.network == 'mainnet';
  const address = check(options.address);
  const privateKey = check(options.privateKey);
  const token = options.token || 'ETH';

  console.log(mainnet
      ? 'Setting up mainnet...'
      : 'Setting up testnet...');
  const ethProvider = getEthProvider(mainnet);
  const maticProvider = getMaticProvider(mainnet);

  const posClient = new POSClient();
  await posClient.init({
    network: mainnet ? 'mainnet' : 'testnet',
    version: mainnet ? 'v1' : 'mumbai',
    parent: {
      provider: new ethers.Wallet(privateKey, ethProvider),
      defaultConfig: { from: address },
    },
    child: {
      provider: new ethers.Wallet(privateKey, maticProvider),
      defaultConfig: { from: address },
    },
  });

  switch (token) {
    case 'ETH':
      console.log(`Bridge ${amount} ETH for address ${address}`);
      const result = await (await posClient.depositEther(longToString(amount), address)).promise;
      console.log(result);
      break;
    case 'MATIC':
      console.log(`Bridge ${amount} MATIC for address ${address}`);
      const maticToken = posClient.erc20(mainnet
              ? '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0'
              : '0xa108830a23a9a054fff4470a8e6292da0886a4d4',
          true);
      const approveResult = await (await maticToken.approveMax()).promise;
      console.log(approveResult);
      const depositResult = await (await maticToken.deposit(longToString(amount), address)).promise;
      console.log(depositResult);
      break;
    default:
      throw Error(`Unexpected token: ${token}`);
  }
};
