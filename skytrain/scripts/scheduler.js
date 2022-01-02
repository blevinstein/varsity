
const fs = require('fs');
const { Client } = require('pg');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const { check, eq, Status, ToStatus, randomExponential, randomize } = require('./common');

async function main() {
  const argv = yargs(hideBin(process.argv)).array('input').argv;

  const accounts = check(JSON.parse(fs.readFileSync(argv.accounts)));
  let operations = check(JSON.parse(fs.readFileSync(argv.operations)));
  const averageOffsetHours = parseInt(argv.offsetHours) || 24;

  // Offset from current time
  let lastTime = new Date();

  const client = new Client(argv.config ? JSON.parse(fs.readFileSync(argv.config)) : {});
  await client.connect();
  console.log('Connected');

  const existingAccounts = (await client.query('SELECT Address,Region FROM Accounts')).rows;

  for (let account of accounts) {
    if (existingAccounts.find(existingAcct => eq(account.address, existingAcct.address))) {
      throw Error(`Account already exists! ${account.address}`);
    }

    const delayHours = randomExponential(averageOffsetHours);
    const startTime = new Date(lastTime.getTime() + delayHours * 60 * 60 * 1000);
    lastTime = startTime;

    console.log(`Create account: ${account.address} (starts ${startTime})`);
    await client.query({
      text: 'INSERT INTO Accounts(Address,PrivateKey,Region,WaitUntil) VALUES ($1,$2,$3,$4)',
      values: [account.address, account.privateKey, account.region, startTime]
    });

    console.log(`Randomizing ${operations.length} operations`);
    const randomOperations = operations.map(operation => {
      const randomOperation = Object.assign({}, operation);
      if (randomOperation.amount) randomOperation.amount = randomize(operation.amount);
      randomOperation.waitAfterSeconds = randomize(operation.waitAfterSeconds);
      return randomOperation;
    });

    console.log(`Scheduling ${randomOperations.length} operations`);
    for (let i = 0; i < randomOperations.length; ++i) {
      await client.query({
        text: 'INSERT INTO Operations(Address,Priority,Details,Status) VALUES ($1,$2,$3,$4)',
        values: [
          account.address,
          i,
          JSON.stringify(randomOperations[i]),
          Status.TODO
        ]
      });
    }
  }

  await client.end();
  console.log('Done');
}

main();
