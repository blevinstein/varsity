
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
      'SELECT a.Address,o.Status,o.Priority '+
          'FROM Accounts a JOIN Operations o USING (Address) WHERE o.Status = 2');

  for (let row of result.rows) {
    console.log(`Resume ${row.address} priority ${row.priority}`);
    await client.query({
      text: 'UPDATE Operations SET Status = 0 WHERE Address = $1 AND Priority = $2',
      values: [row.address, row.priority],
    });
  }

  await client.end();
  console.log('Done');
}

main();
