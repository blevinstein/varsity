
const async = require('async');
const fs = require('fs');
const { Client } = require('pg');

const { check, eq, Status, ToStatus } = require('./common');

async function doOperation(address, privateKey, operation) {
  switch (operation.type) {
    case 'noop':
      return;
    case 'fail':
      throw Error('Fail');
    default:
      throw Error(`Unexpected operation type: ${operation.type}`);
  }
}

exports.run = async (input) => {
  const region = input.region || 'TEST';
  const config = input.config ? JSON.parse(fs.readFileSync(input.config)) : {};

  const client = new Client(config);
  await client.connect();
  console.log('Connected');

  const result = await client.query({
    text: 'SELECT a.Address,a.PrivateKey,o.Priority,o.Details,o.Status FROM Accounts a JOIN Operations o USING (Address) ' +
        'WHERE a.WaitUntil < NOW() AND a.Region = $1 AND o.Status != $2',
    values: [region, Status.DONE]
  });

  const rowsByAddress = await async.groupBy(result.rows, async row => row.address);

  for (let [address, rows] of Object.entries(rowsByAddress)) {
    const nextOperation = rows.reduce((a, b) => a.priority < b.priority ? a : b);
    if (nextOperation.status != Status.TODO) {
      console.log(`Address ${address} is blocked from continuing.`);
      continue;
    }

    try {
      const details = JSON.parse(nextOperation.details);
      const delaySeconds = details.waitAfterSeconds;
      console.log(`Address: ${address} Operation: ${nextOperation.priority} ${nextOperation.details}`);
      await doOperation(address, nextOperation.privatekey, details);
      await client.query({
        text: 'UPDATE Operations SET Status=$1 WHERE Address=$2 AND Priority=$3',
        values: [Status.DONE, address, nextOperation.priority],
      });
      const waitUntil = new Date(new Date().getTime() + delaySeconds * 1000);
      await client.query({
        text: 'UPDATE Accounts SET WaitUntil=$1 WHERE Address=$2',
        values: [waitUntil, address]
      });
    } catch (e) {
      console.error(`Operation failed! ${address} / ${nextOperation.priority}`);
      console.error(e);
      await client.query({
        text: 'UPDATE Operations SET Status=$1 WHERE Address=$2 AND Priority=$3',
        values: [Status.FAILED, address, nextOperation.priority],
      });
    }
  }

  await client.end();
  console.log('Done');
};
