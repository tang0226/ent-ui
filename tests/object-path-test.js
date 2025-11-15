import { ObjectPath } from "../src/object-path.js";
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

const testSuite = new TestSuite("ObjectPath");

// ObjectPath.validateTokens()
testSuite.addTest("validateTokens() succeeds with valid tokens", () => {
  ObjectPath.validateTokens(["abc", "_abc", "abc0_", "$", "_", "$abc", "$abc_0", 0, 2, 100, 1000]);
});

testSuite.addTest("validateTokens() succeeds with valid tokens and parent prefix", () => {
  ObjectPath.validateTokens(["^^^^", "abc", 0, "_b123"]);
});

testSuite.addTest("validateTokens() rejects invalid indices", () => {
  assertThrows(() => {
    ObjectPath.validateTokens([0.1]);
  }, "is not a valid index");
  assertThrows(() => {
    ObjectPath.validateTokens([-1]);
  }, "is not a valid index");
});

testSuite.addTest("validateTokens() rejects invalid properties", () => {
  assertThrows(() => {
    ObjectPath.validateTokens(["0abc"]);
  }, "is not a valid property name");
  assertThrows(() => {
    ObjectPath.validateTokens(["ab*c"]);
  }, "is not a valid property name");
});

testSuite.addTest("validateTokens() rejects invalid token types", () => {
  const errorTarget = "Token of invalid type: ";
  assertThrows(() => {
    ObjectPath.validateTokens([{}]);
  }, errorTarget);
  assertThrows(() => {
    ObjectPath.validateTokens([null]);
  }, errorTarget);
  assertThrows(() => {
    ObjectPath.validateTokens([undefined]);
  }, errorTarget);
  assertThrows(() => {
    ObjectPath.validateTokens([() => {}]);
  }, errorTarget);
});

testSuite.addTest("validateTokens() rejects unexpected parent operator", () => {
  assertThrows(() => {
    ObjectPath.validateTokens(["abc", "^^^"]);
  }, "unexpected parent operator");
});

// ObjectPath.tokenize()
testSuite.addTest("tokenize() succeeds with normal path beginning with a prop name", () => {
  var tokens = ObjectPath.tokenize("prop1[0][100]._prop2.$prop3_[2]._0._");
  assertDeepEqual(tokens, ["prop1", 0, 100, "_prop2", "$prop3_", 2, "_0", "_"]);
});

testSuite.addTest("tokenize() succeeds with normal path beginning with an index", () => {
  var tokens = ObjectPath.tokenize("[0].prop1[0][100]._prop2.$prop3_[2]._0._");
  assertDeepEqual(tokens, [0, "prop1", 0, 100, "_prop2", "$prop3_", 2, "_0", "_"]);
});

testSuite.addTest("tokenize() succeeds with normal path beginning with parent operator and prop name", () => {
  var tokens = ObjectPath.tokenize("^^.prop1[0][100]._prop2.$prop3_[2]._0._");
  assertDeepEqual(tokens, ["^^", "prop1", 0, 100, "_prop2", "$prop3_", 2, "_0", "_"]);
});

testSuite.addTest("tokenize() succeeds with normal path beginning with parent operator and index", () => {
  var tokens = ObjectPath.tokenize("^^^[0].prop1[0][100]._prop2.$prop3_[2]._0._");
  assertDeepEqual(tokens, ["^^^", 0, "prop1", 0, 100, "_prop2", "$prop3_", 2, "_0", "_"]);
});

testSuite.addTest("tokenize() succeeds with path consisting of only parent operator", () => {
  var tokens = ObjectPath.tokenize("^^^");
  assertDeepEqual(tokens, ["^^^"]);
});

testSuite.addTest("tokenize() fails with non-string input", () => {
  assertThrows(() => {
    var tokens = ObjectPath.tokenize({});
  }, "requires a string");
});

testSuite.addTest("tokenize() fails with missing . after brackets", () => {
  assertThrows(() => {
    var tokens = ObjectPath.tokenize("abc[0]def");
  }, "Missing . after brackets");
});

testSuite.addTest("tokenize() fails with illegal identifier after parent operator", () => {
  assertThrows(() => {
    var tokens = ObjectPath.tokenize("^^^abc");
  }, "Illegal identifier after ^");
});

testSuite.addTest("tokenize() fails with trailing dot at end of path", () => {
  assertThrows(() => {
    var tokens = ObjectPath.tokenize("a.b.c.");
  }, "Trailing dot at end of path");
});

testSuite.addTest("tokenize() fails with non-identifier after dot", () => {
  assertThrows(() => {
    var tokens = ObjectPath.tokenize("abc.[0]");
  }, "Expected identifier after dot");
});

testSuite.addTest("tokenize() fails with unclosed [", () => {
  assertThrows(() => {
    var tokens = ObjectPath.tokenize("abc[0");
  }, "Unclosed [ in path string");
});

testSuite.addTest("tokenize() fails with invalid index char", () => {
  assertThrows(() => {
    var tokens = ObjectPath.tokenize("abc[1a]");
  }, /Invalid char.+in index at pos/);
});

testSuite.addTest("tokenize() fails with empty index", () => {
  assertThrows(() => {
    var tokens = ObjectPath.tokenize("abc[]");
  }, "Empty index [] not allowed in path");
});

testSuite.addTest("tokenize() fails with unexpected char", () => {
  assertThrows(() => {
    var tokens = ObjectPath.tokenize("abc[0].a&");
  }, "Unexpected token in path: ");
});

// ObjectPath constructor
testSuite.addTest("Empty path initializes", () => {
  var p = new ObjectPath();
  assertDeepEqual(p.tokens, []);
});

testSuite.addTest("Normal path initializes", () => {
  var tokens = [0, 1, 2, "abc", "def", 0];
  var p = new ObjectPath([...tokens]);
  assertDeepEqual(p.tokens, tokens);
});

testSuite.addTest("Single index path initializes", () => {
  var tokens = [1];
  var p = new ObjectPath([...tokens]);
  assertDeepEqual(p.tokens, tokens);
});

testSuite.addTest("Initialization fails when path is not a string or array", () => {
  const errorTarget = "requires an ObjectPath, a string, or an array of tokens";
  assertThrows(() => {
    var p = new ObjectPath(false);
  },errorTarget);
  assertThrows(() => {
    var p = new ObjectPath({});
  },errorTarget);
  assertThrows(() => {
    var p = new ObjectPath(null);
  },errorTarget);
});

testSuite.addTest("deepCopy flag makes a deep copy when true", () => {
  var tokens = [0, 1, 2];
  var p = new ObjectPath(tokens);
  assertNotEqual(p.tokens, tokens);
});

testSuite.addTest("deepCopy flag makes a shallow copy when false", () => {
  var tokens = [0, 1, 2];
  var p = new ObjectPath(tokens, { deepCopy: false });
  assertEqual(p.tokens, tokens);
});

// toString()
testSuite.addTest("toString() returns correct string", () => {
  assertEqual(
    (new ObjectPath(["^^", "_abc", 0, "foo", 1, 2, 3, "bar", "baz"])).toString(),
    "^^._abc[0].foo[1][2][3].bar.baz",
  );
  assertEqual(
    (new ObjectPath([0, 1, 2])).toString(),
    "[0][1][2]",
  );
});

// ObjectPath.join()
testSuite.addTest("join() accepts ObjectPaths", () => {
  var p = ObjectPath.join(
    new ObjectPath([0, "foo"]),
    new ObjectPath(["bar", 1]),
  );
  assertDeepEqual(p.tokens, [0, "foo", "bar", 1]);
});

testSuite.addTest("join() accepts strings", () => {
  var p = ObjectPath.join(
    "[0].foo",
    "bar[1]",
    "baz[0].qux",
  );
  assertDeepEqual(p.tokens, [0, "foo", "bar", 1, "baz", 0, "qux"]);
});

testSuite.addTest("join() accepts arrays", () => {
  var p = ObjectPath.join(
    [0, "foo"],
    ["bar", 1],
    ["baz", 0, "qux"],
  );
  assertDeepEqual(p.tokens, [0, "foo", "bar", 1, "baz", 0, "qux"]);
});

testSuite.addTest("join() accepts indices", () => {
  var p = ObjectPath.join(0, 1);
  assertDeepEqual(p.tokens, [0, 1]);
});

testSuite.addTest("join() rejects invalid indices", () => {
  assertThrows(() => {
    var p = ObjectPath.join(0.5, 1);
  }, "invalid index");
  assertThrows(() => {
    var p = ObjectPath.join(0, -1);
  }, "invalid index");
});

testSuite.addTest("join() rejects invalid types", () => {
  const errorTarget = "not of type ObjectPath, string, Array, or number";
  assertThrows(() => {
    var p = ObjectPath.join("foo", null);
  }, errorTarget);
  assertThrows(() => {
    var p = ObjectPath.join("foo", undefined);
  }, errorTarget);
  assertThrows(() => {
    var p = ObjectPath.join("foo", {});
  }, errorTarget);
  assertThrows(() => {
    var p = ObjectPath.join("foo", true);
  }, errorTarget);
});

testSuite.addTest("join() accepts mixed types", () => {
  var p = ObjectPath.join(
    new ObjectPath("foo.bar[0]"),
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