
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

function randomize(value) {
  if (typeof value == 'number') {
    return value;
  } else if (typeof value == 'object' && value.op == 'random') {
    let result = randomExponential(check(value.average))
    if (value.roundTo) result = Math.round(result / value.roundTo) * value.roundTo;
    if (value.min) result = Math.max(value.min, result);
    if (value.max) result = Math.min(value.max, result);
    return result;
  }

  throw Error(`Unexpected value: ${value} (${typeof value})`);
}

module.exports = {
  check,
  eq,
  Status,
  ToStatus,
  longToString,
  randomExponential,
  randomize,
};
