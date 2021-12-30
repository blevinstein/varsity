
const async = require('async');
const fs = require('fs');
const { Client } = require('pg');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const ToStatus = {
  0: 'TODO',
  1: 'DONE',
  2: 'FAILED'
};

async function main() {
  const argv = yargs(hideBin(process.argv)).array('input').argv;

  const client = new Client(argv.config ? JSON.parse(fs.readFileSync(argv.config)) : {});
  await client.connect();
  console.log('Connected');

  const result = await client.query(
      'SELECT a.Address,o.Status,COUNT(*) FROM Accounts a LEFT JOIN Operations o USING (Address) GROUP BY (Address, Status)');

  const resultByAddress = await async.groupBy(result.rows, async row => row.address);

  for (let [address, rows] of Object.entries(resultByAddress)) {
    console.log(`Address: ${address}`);
    for (let row of rows) {
      console.log(`\t${row.count} tasks ${ToStatus[row.status]}`);
    }
  }

  await client.end();
  console.log('Done');
}

main();
