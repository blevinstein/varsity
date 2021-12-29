
const fs = require('fs');
const { Client } = require('pg');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const Status = {
  TODO: 0,
  DONE: 1,
  FAILED: 2,
};

function eq(a, b) {
  return a.toLowerCase() == b.toLowerCase();
}

function check(value, message = 'Unexpected null') {
  if (!value) throw Error(message);
  return value;
}

async function main() {
  const argv = yargs(hideBin(process.argv)).array('input').argv;

  const accounts = check(JSON.parse(fs.readFileSync(argv.accounts)));
  const operations = check(JSON.parse(fs.readFileSync(argv.operations)));

  const client = new Client(argv.config ? JSON.parse(argv.config) : {});
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
      text: 'INSERT INTO Accounts(Address,Region,WaitUntil) VALUES ($1,$2,$3)',
      values: [account.address, account.region, new Date(account.startTime * 1000)]
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
