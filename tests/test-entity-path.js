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
  const errorTarget = "Token of invalid type: ";
  assertThrows(() => {
    EntityPath.validateTokens([{}]);
  }, errorTarget);
  assertThrows(() => {
    EntityPath.validateTokens([null]);
  }, errorTarget);
  assertThrows(() => {
    EntityPath.validateTokens([undefined]);
  }, errorTarget);
  assertThrows(() => {
    EntityPath.validateTokens([() => {}]);
  }, errorTarget);
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

testSuite.addTest("Initialization fails when path is not a string or array", () => {
  const errorTarget = "requires an EntityPath object, a string, or an array of tokens";
  assertThrows(() => {
    var p = new EntityPath(10);
  }, errorTarget);
  assertThrows(() => {
    var p = new EntityPath(false);
  },errorTarget);
  assertThrows(() => {
    var p = new EntityPath({});
  },errorTarget);
  assertThrows(() => {
    var p = new EntityPath(null);
  },errorTarget);
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
testSuite.addTest("join() accepts EntityPath objects", () => {
  var p = EntityPath.join(
    new EntityPath([0, "foo"]),
    new EntityPath(["bar", 1]),
  );
  assertDeepEqual(p.tokens, [0, "foo", "bar", 1]);
});

testSuite.addTest("join() accepts strings", () => {
  var p = EntityPath.join(
    "[0].foo",
    "bar[1]",
    "baz[0].qux",
  );
  assertDeepEqual(p.tokens, [0, "foo", "bar", 1, "baz", 0, "qux"]);
});

testSuite.addTest("join() accepts arrays", () => {
  var p = EntityPath.join(
    [0, "foo"],
    ["bar", 1],
    ["baz", 0, "qux"],
  );
  assertDeepEqual(p.tokens, [0, "foo", "bar", 1, "baz", 0, "qux"]);
});

testSuite.addTest("join() accepts indices", () => {
  var p = EntityPath.join(0, 1);
  assertDeepEqual(p.tokens, [0, 1]);
});

testSuite.addTest("join() rejects invalid indices", () => {
  assertThrows(() => {
    var p = EntityPath.join(0.5, 1);
  }, "invalid index");
  assertThrows(() => {
    var p = EntityPath.join(0, -1);
  }, "invalid index");
});

testSuite.addTest("join() rejects invalid types", () => {
  const errorTarget = "not of type EntityPath, string, Array, or number";
  assertThrows(() => {
    var p = EntityPath.join("foo", null);
  }, errorTarget);
  assertThrows(() => {
    var p = EntityPath.join("foo", undefined);
  }, errorTarget);
  assertThrows(() => {
    var p = EntityPath.join("foo", {});
  }, errorTarget);
  assertThrows(() => {
    var p = EntityPath.join("foo", true);
  }, errorTarget);
});

testSuite.addTest("join() accepts mixed types", () => {
  var p = EntityPath.join(
    new EntityPath("foo.bar[0]"),
    "[1].baz",
    [2, 3, "qux"],
    4, 5,
  );
  assertDeepEqual(
    p.tokens,
    ["foo", "bar", 0, 1, "baz", 2, 3, "qux", 4, 5],
  );
});


testSuite.runTests();