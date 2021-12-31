
const fs = require('fs');
const { Client } = require('pg');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const { check, eq, Status, ToStatus, randomExponential } = require('./common');

async function main() {
  const argv = yargs(hideBin(process.argv)).array('input').argv;

  const accounts = check(JSON.parse(fs.readFileSync(argv.accounts)));
  let operations = check(JSON.parse(fs.readFileSync(argv.operations)));

  const client = new Client(argv.config ? JSON.parse(fs.readFileSync(argv.config)) : {});
  await client.connect();
  console.log('Connected');

  const existingAccounts = (await client.query('SELECT Address,Region FROM Accounts')).rows;
  console.log(existingAccounts);

  for (let account of accounts) {
    if (existingAccounts.find(existingAcct => eq(account.address, existingAcct.address))) {
      throw Error(`Account already exists! ${account.address}`);
    }

    console.log(`Create account: ${account.address}`);
    await client.query({
      text: 'INSERT INTO Accounts(Address,PrivateKey,Region,WaitUntil) VALUES ($1,$2,$3,$4)',
      values: [account.address, account.privateKey, account.region, new Date(account.startTime * 1000)]
    });

    console.log(`Randomizing ${operations.length} operations`);
    operations.forEach(operation => {
      operation.waitAfterSeconds = randomExponential(operation.waitAfterSeconds);
    });

    console.log(`Scheduling ${operations.length} operations`);
    for (let i = 0; i < operations.length; ++i) {
      await client.query({
        text: 'INSERT INTO Operations(Address,Priority,Details,Status) VALUES ($1,$2,$3,$4)',
        values: [
          account.address,
          i,
          JSON.stringify(operations[i]),
          Status.TODO
        ]
      });
    }
  }

  await client.end();
  console.log('Done');
}

main();
