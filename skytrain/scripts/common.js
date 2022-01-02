
function check(value, message = 'Unexpected null') {
  if (!value) throw Error(message);
  return value;
}

function eq(a, b) {
  return a.toLowerCase() == b.toLowerCase();
}

const Status = {
  TODO: 0,
  DONE: 1,
  FAILED: 2,
};

const ToStatus = {
  0: 'TODO',
  1: 'DONE',
  2: 'FAILED',
};

function longToString(number) {
  return BigInt(number).toString();
}

function randomExponential(average) {
  return -Math.log(Math.random()) * average;
}

module.exports = {
  check,
  eq,
  Status,
  ToStatus,
  longToString,
  randomExponential,
};
