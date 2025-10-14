import { EntityPath } from "../src/entity-path.js";
import { TestSuite } from "./framework/test-suite.js";
import {
  assert,
  assertEqual,
  assertNotEqual,
  assertDeepEqual,
  assertType,
  assertInstance,
  assertDefined,
  assertTruthy,
  assertFalsy,
  assertThrows,
  assertDoesNotThrow,
} from "./framework/assert.js";

const testSuite = new TestSuite("EntityPath");

// EntityPath.validateTokens()
testSuite.addTest("validateTokens() succeeds with valid tokens", () => {
  EntityPath.validateTokens(["abc", "_abc", "abc0_", "$", "_", "$abc", "$abc_0", 0, 2, 100, 1000]);
});

testSuite.addTest("validateTokens() rejects invalid indices", () => {
  assertThrows(() => {
    EntityPath.validateTokens([0.1]);
  }, "is not a valid index");
  assertThrows(() => {
    EntityPath.validateTokens([-1]);
  }, "is not a valid index");
});

testSuite.addTest("validateTokens() rejects invalid properties", () => {
  assertThrows(() => {
    EntityPath.validateTokens(["0abc"]);
  }, "is not a valid property name");
  assertThrows(() => {
    EntityPath.validateTokens(["ab*c"]);
  }, "is not a valid property name");
});

testSuite.addTest("validateTokens() rejects invalid token types", () => {
  assertThrows(() => {
    EntityPath.validateTokens([{}]);
  }, "Token of invalid type: ");
  assertThrows(() => {
    EntityPath.validateTokens([null]);
  }, "Token of invalid type: ");
  assertThrows(() => {
    EntityPath.validateTokens([undefined]);
  }, "Token of invalid type: ");
  assertThrows(() => {
    EntityPath.validateTokens([() => {}]);
  }, "Token of invalid type: ");
});

// EntityPath.tokenize()
testSuite.addTest("tokenize() succeeds with normal path beginning with a prop name", () => {
  var tokens = EntityPath.tokenize("prop1[0][100]._prop2.$prop3_[2]._0._");
  assertDeepEqual(tokens, ["prop1", 0, 100, "_prop2", "$prop3_", 2, "_0", "_"]);
});

testSuite.addTest("tokenize() succeeds with normal path beginning with an index", () => {
  var tokens = EntityPath.tokenize("[0].prop1[0][100]._prop2.$prop3_[2]._0._");
  assertDeepEqual(tokens, [0, "prop1", 0, 100, "_prop2", "$prop3_", 2, "_0", "_"]);
});

testSuite.addTest("tokenize() fails with non-string input", () => {
  assertThrows(() => {
    var tokens = EntityPath.tokenize({});
  }, "requires a string");
});

testSuite.addTest("tokenize() fails with missing . after brackets", () => {
  assertThrows(() => {
    var tokens = EntityPath.tokenize("abc[0]def");
  }, "Missing . after brackets");
});

testSuite.addTest("tokenize() fails with trailing dot at end of path", () => {
  assertThrows(() => {
    var tokens = EntityPath.tokenize("a.b.c.");
  }, "Trailing dot at end of path");
});

testSuite.addTest("tokenize() fails with non-identifier after dot", () => {
  assertThrows(() => {
    var tokens = EntityPath.tokenize("abc.[0]");
  }, "Expected identifier after dot");
});

testSuite.addTest("tokenize() fails with unclosed [", () => {
  assertThrows(() => {
    var tokens = EntityPath.tokenize("abc[0");
  }, "Unclosed [ in path string");
});

testSuite.addTest("tokenize() fails with invalid index char", () => {
  assertThrows(() => {
    var tokens = EntityPath.tokenize("abc[1a]");
  }, /Invalid char.+in index at pos/);
});

testSuite.addTest("tokenize() fails with empty index", () => {
  assertThrows(() => {
    var tokens = EntityPath.tokenize("abc[]");
  }, "Empty index [] not allowed in path");
});

testSuite.addTest("tokenize() fails with unexpected char", () => {
  assertThrows(() => {
    var tokens = EntityPath.tokenize("abc[0].a&");
  }, "Unexpected token in path: ");
});

// EntityPath constructor
testSuite.addTest("Empty path initializes", () => {
  var p = new EntityPath();
  assertDeepEqual(p.tokens, []);
});

testSuite.addTest("Normal path initializes", () => {
  var tokens = [0, 1, 2, "abc", "def", 0];
  var p = new EntityPath([...tokens]);
  assertDeepEqual(p.tokens, tokens);
});

testSuite.addTest("deepCopy flag makes a deep copy when true", () => {
  var tokens = [0, 1, 2];
  var p = new EntityPath(tokens);
  assertNotEqual(p.tokens, tokens);
});

testSuite.addTest("deepCopy flag makes a shallow copy when false", () => {
  var tokens = [0, 1, 2];
  var p = new EntityPath(tokens, { deepCopy: false });
  assertEqual(p.tokens, tokens);
});

// toString()
testSuite.addTest("toString() returns correct string", () => {
  assertEqual(
    (new EntityPath(["_abc", 0, "foo", 1, 2, 3, "bar", "baz"])).toString(),
    "_abc[0].foo[1][2][3].bar.baz",
  );
  assertEqual(
    (new EntityPath([0, 1, 2])).toString(),
    "[0][1][2]",
  );
});

// EntityPath.join()


testSuite.runTests();