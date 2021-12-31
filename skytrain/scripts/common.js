
function check(value, message = 'Unexpected null') {
  if (!value) throw Error(message);
  return value;
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

function eq(a, b) {
  return a.toLowerCase() == b.toLowerCase();
}

function randomExponential(average) {
  return -Math.log(Math.random()) * average;
}

module.exports = {
  check,
  eq,
  Status,
  ToStatus,
  randomExponential,
};
