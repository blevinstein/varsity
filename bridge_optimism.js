
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

function getJson(url) {
  return new Promise((resolve, reject) => {
    const request = https.request(url, (result) => {
      if (result.statusCode != 200) {
        reject(result.statusCode);
      } else {
        let fullData = Buffer.from([]);
        result.on('data', (data) => fullData = Buffer.concat([fullData, data]));
        result.on('end', () => resolve(JSON.parse(fullData)));
      }
    });
    request.end();
  });
}

const OPTIMISM_GATEWAY = '0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1';
const OPTIMISM_L2_GATEWAY = '0x4200000000000000000000000000000000000010';
const IL1StandardBridgeAbi = JSON.parse(fs.readFileSync('build/contracts/IL1StandardBridge.json')).abi;

const bridge = new web3.eth.Contract(IL1StandardBridgeAbi, OPTIMISM_GATEWAY);

async function main() {
  const argv = yargs(hideBin(process.argv)).array('input').argv;

  const dryRun = argv.noDryRun === undefined;
  const amount = parseFloat(argv.amount);
  const token = argv.token;

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

  if (token == 'ETH') {
    console.log(`Bridge ${amount} ETH for address ${address}`);
    if (!dryRun) {
      const result = await bridge.methods.depositETH(13e5, 64).send({
          from: address,
          value: longToString(amount * 1e18),
          gas: 160e3,
      });
      console.log(result);
    }
  } else {
    const tokenData = await getJson('https://static.optimism.io/optimism.tokenlist.json');
    const l1Token = tokenData.tokens.find(t => t.symbol == token && t.chainId == 1);
    const l2Token = tokenData.tokens.find(t => t.symbol == token && t.chainId == 10);
    if (!l1Token || !l2Token) {
      throw Error(`Failed to find ${token} in tokenlist`);
    }
    console.log(`Bridge ${amount} ${token} for address ${address}`);
    if (!dryRun()) {
      const result = await bridge.methods.depositERC20(l1Token.address, l2Token.address, 13e5, 64)
          .send({
              from: address,
              gas: 160e3,
          });
      console.log(result);
    }
  }

  console.log('Done');
}

main();
