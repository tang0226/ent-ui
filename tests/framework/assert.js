function assert(condition, msg) {
  if (!condition) throw new Error(msg || "Assertion failed");
}

function assertEqual(a, b, msg) {
  assert(a === b, msg);
}

function assertDeepEqual(a, b, msg) {
  const aStr = JSON.stringify(a);
  const bStr = JSON.stringify(b);
  assert(aStr === bStr, msg || `Expected deep equality:\n${aj}\n${bj}`);
}

function assertType(val, type, msg) {
  assert(typeof val === type, msg || `Expected value ${val} to have type ${type}`);
}

function assertInstance(val, cls, msg) {
  assert(val instanceof cls, msg || `Expected value ${val} to be instance of class ${cls}`);
}

function assertDefined(val, msg) {
  assert(val !== undefined, msg || `Expected value to be defined`);
}

function assertTruthy(val, msg) {
  assert(Boolean(val), msg || `Expected value ${val} to be truthy`);
}

function assertFalsy(val, msg) {
  assert(!Boolean(val), msg || `Expected value ${val} to be falsy`);
}

function assertThrows(fn, msg) {
  var errorFound = false;
  try {
    fn();
  }
  catch (error) {
    errorFound = true;
  }
  assert(errorFound, msg || `Expected function to throw error`);
}

function assertDoesNotThrow(fn, msg) {
  var errorFound = false;
  try {
    fn();
  }
  catch (error) {
    errorFound = true;
  }
  assert(!errorFound, msg || `Expected function to execute without error`);
}

export {
  assert,
  assertEqual,
  assertDeepEqual,
  assertType,
  assertInstance,
  assertDefined,
  assertTruthy,
  assertFalsy,
  assertThrows,
  assertDoesNotThrow,
};
