function isValidPropChar(c) {
  return /[a-zA-Z0-9_$]/.test(c);
}

function isValidPropFirstChar(c) {
  return /[a-zA-Z_$]/.test(c);
}

function isValidIndex(n) {
  return n >= 0 && Number.isInteger(n);
}

function isValidProp(str) {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str);
}

function isArrowFunction(func) {
  return /^\(.*?\).*?=>/.test(func.toString());
}

export {
  isValidPropChar,
  isValidPropFirstChar,
  isValidIndex,
  isValidProp,
  isArrowFunction,
};
