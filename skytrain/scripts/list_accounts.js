
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
      'SELECT a.Address,a.WaitUntil,a.Region,o.Status,o.Priority,o.Details '+
          'FROM Accounts a LEFT JOIN Operations o USING (Address)');

  const resultByAddress = await async.groupBy(result.rows, async row => row.address);

  for (let [address, rows] of Object.entries(resultByAddress)) {
    const waitUntil = rows[0].waituntil;
    const waitString = waitUntil > new Date() ? ` (paused until ${waitUntil})` : '';
    console.log(`Address: ${address}\t${rows[0].region}\t${waitString}`);
    rows.sort((a, b) => a.priority - b.priority);
    for (let row of rows) {
      console.log('\t' + [row.priority, ToStatus[row.status], row.details].join('\t'));
    }
  }

  await client.end();
  console.log('Done');
}

main();
