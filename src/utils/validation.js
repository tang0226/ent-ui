function isValidPropChar(c) {
  return c && /[a-zA-Z0-9_$]/.test(c);
}

function isValidPropFirstChar(c) {
  return c && /[a-zA-Z_$]/.test(c);
}

function isValidIndex(n) {
  return n >= 0 && Number.isInteger(n);
}

function isValidProp(str) {
  return str && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str);
}

function isValidParentOperator(str) {
  if (typeof str !== "string") return false;
  for (let char of str) if (char != "^") return false;
  return true;
}

function isArrowFunction(func) {
  return /^\(.*?\).*?=>/.test(func.toString());
}

export {
  isValidPropChar,
  isValidPropFirstChar,
  isValidIndex,
  isValidProp,
  isValidParentOperator,
  isArrowFunction,
};
