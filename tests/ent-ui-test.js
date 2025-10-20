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


export function assertEntityLinkedToUI(entity, ui, msg = "") {
  assertEqual(entity._ui, ui, msg || `Entity ${entity._path.toString()} not linked to ui`);
  if (entity._children) {
    entity.forEachChild((c) => {
      assertEntityLinkedToUI(c, ui, msg);
    });
  }
}


const testSuite = new TestSuite("EntUI");

// _linkEntity
testSuite.addTest("_linkEntity adds ui prop to entity and all descendants", () => {
  const ui = new EntUI();
  const e = new Entity({
    children: {
      child1: {
        children: [{}, {}],
      },
      child2: {},
    },
  });
  ui._linkEntity(e);
  assertEntityLinkedToUI(e, ui);
});

// addEntity
testSuite.addTest("addEntity with single-token path adds to entities prop", () => {
  var ui = new EntUI();
  var e = new Entity();
  ui.addEntity(e, "topLevel");
  assertEqual(ui._entities.topLevel, e);
});

testSuite.addTest("addEntity with single-token path produces a proper hierarchy", () => {
  var ui = new EntUI();
  var e = new Entity({
    children: {
      one: { children: [{}, {}] },
      two: {},
    },
  });
  ui.addEntity(e, "topLevel");
  assertValidHierarchy(e);
});

testSuite.addTest("addEntity at deep path adds Entity and updates hierarchy", () => {
  var ui = new EntUI();
  var e = new Entity({
    children: {
      one: { children: [{ children: {} }, {}] },
    },
  });
  ui.addEntity(e, "topLevel");
  ui.addEntity({}, "topLevel.one[0]", "child");
  assertValidHierarchy(e);
});

testSuite.addTest("addEntity with single-token path extracts state properly", () => {
  var ui = new EntUI();
  ui.addEntity({
    state: {foo: 5},
  }, "topLevel");
  assertEqual(ui._state.topLevel.state.foo, 5);
});

testSuite.addTest("addEntity with deep path extracts state properly", () => {
  var ui = new EntUI();
  ui.addEntity({
    children: {},
    attrs: {name: "topLevel"},
  }, "topLevel");

  ui.addEntity({
    state: {bar: 5},
    attrs: {name: "child"},
  }, "topLevel.child");
  assertEqual(ui._state.topLevel.children.child.state.bar, 5);
});

testSuite.runTests();