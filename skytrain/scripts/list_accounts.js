
const async = require('async');
const fs = require('fs');
const { Client } = require('pg');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const { Status, ToStatus } = require('./common');

async function main() {
  const argv = yargs(hideBin(process.argv)).array('input').argv;

  const client = new Client(argv.config ? JSON.parse(fs.readFileSync(argv.config)) : {});
  await client.connect();
  console.log('Connected');

  const result = await client.query(
      'SELECT a.Address,o.Status,o.Priority,o.Details FROM Accounts a LEFT JOIN Operations o USING (Address)');

  const resultByAddress = await async.groupBy(result.rows, async row => row.address);

  for (let [address, rows] of Object.entries(resultByAddress)) {
    console.log(`Address: ${address}`);
    rows.sort((a, b) => a.priority - b.priority);
    for (let row of rows) {
      console.log('\t' + [ToStatus[row.status], row.priority, row.details].join('\t'));
    }
  }

  await client.end();
  console.log('Done');
}

main();
