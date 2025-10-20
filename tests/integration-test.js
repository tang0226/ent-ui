import { Entity } from "../../src/entity.js";
import { EntUI } from "../../src/ent-ui.js";

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

import {
  assertParentChild,
  assertValidHierarchy,
} from "./entity-test.js";

const testSuite = new TestSuite("Entity-EntUI integration");

testSuite.addTest("addEntity fails if entity to add has a non-matching UI", () => {
  var e = new Entity({ children: {} });
  var e2 = new Entity();
  var ui = new EntUI();
  ui.addEntity(e2, "entity");
  assertThrows(() => {
    e.addEntity(e2, "child");
  }, "is already in another UI");
});

testSuite.runTests();