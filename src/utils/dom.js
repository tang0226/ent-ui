export function $(str) {
  var res = document.querySelector(str);
  if (res === null) {
    throw new Error(`$(${str}): No element found`);
  }
  return res;
}