import {
  isValidPropChar,
  isValidPropFirstChar,
  isValidIndex,
  isValidProp,
} from "./utils/validation.js";

export class EntityPath {
  constructor(path, { deepCopy = true } = {}) {
    this.tokens = [];

    if (path === undefined) {
      return;
    }

    if (Array.isArray(path)) {
      EntityPath.validateTokens(path);

      if (deepCopy) this.tokens = [...path]; // deep copy
      else this.tokens = path;

      return;
    }

    if (path instanceof EntityPath) return new EntityPath(path.tokens);
    if (typeof path === "string") {
      this.tokens = EntityPath.tokenize(path);
      return;
    }
    throw new TypeError("EntityPath constructor requires an EntityPath object, a string, or an array of tokens");
  }

  toString() {
    return this.tokens
      .map((t, i) => {
        if (typeof t === "number") return `[${t}]`;
        return i == 0 ? t : `.${t}`;
      })
      .join("");
  }

  static join(...paths) {
    var newTokens = [];
    for (const p of paths) {
      if (p instanceof EntityPath) {
        newTokens = [...newTokens, ...p.tokens];
        continue;
      }
      if (typeof p == "string") {
        newTokens = [...newTokens, ...EntityPath.tokenize(p)];
        continue;
      }
      if (Array.isArray(p)) {
        EntityPath.validateTokens(p);
        newTokens = [...newTokens, ...p];
        continue;
      }
      if (typeof p == "number") {
        if (!isValidIndex(p)) throw new Error(`Cannot add ${p} to token list: invalid index`);
        newTokens = [...newTokens, p];
        continue;
      }
      throw new TypeError(`Path {${p}} not of type EntityPath, string, Array, or number`);
    }
    return new EntityPath(newTokens, { deepCopy: false });
  }

  static tokenize(str) {
    if (Array.isArray(str)) return str;
    if (typeof str != "string") {
      throw new TypeError(`EntityPath.tokenize requires a string, not <${typeof str}>`);
    }

    if (str.length == 0) return [];

    var tokens = [];
    let i = 0;
    const len = str.length;
    
    while (i < len) {
      if (isValidPropFirstChar(str[i])) {
        if (i > 0) {
          if (str[i - 1] === "]") throw new SyntaxError(`Missing . after brackets at pos ${i}`);
        }

        let start = i++;
        while (i < len && isValidPropChar(str[i])) i++;
        tokens.push(str.slice(start, i));
        continue;
      }

      // dot (expect property name)
      if (str[i] == ".") {
        if (i == len - 1) throw new SyntaxError("Trailing dot at end of path");
        i++;
        if (!isValidPropFirstChar(str[i])) {
          throw new SyntaxError(`Expected identifier after dot at pos ${i}`);
        }
        continue;
      }

      // brackets (expect index)
      if (str[i] == "[") {
        i++;
        if (i >= len) throw new SyntaxError("Unclosed [ in path string");
        let start = i;

        while (i < len && str[i] !== "]") {
          if (!/[0-9]/.test(str[i])) {
            throw new SyntaxError(`Invalid char '${str[i]}' in index at pos ${i} in path`);
          }
          i++;
        }
        if (i >= len) throw new SyntaxError("Unclosed [ in path string");
        if (i === start) throw new SyntaxError("Empty index [] not allowed in path");

        tokens.push(Number(str.slice(start, i)));
        i++; // skip ']'
        continue;
      }

      throw new SyntaxError(`Unexpected token in path: ${str[i]}`);
    }

    return tokens;
  }

  static validateTokens(tokens) {
    for (const token of tokens) {
      if (typeof token == "number") {
        if (!isValidIndex(token)) throw new Error(`Token error: ${token} is not a valid index`);
        continue;
      }
      if (typeof token == "string") {
        if (!isValidProp(token)) throw new Error(`Token error: ${token} is not a valid property name`);
        continue;
      }
      throw new Error(`Token of invalid type: {${token}}`);
    }
  }
}


