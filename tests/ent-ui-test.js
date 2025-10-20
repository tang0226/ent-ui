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
  assertEqual(ui.entities.topLevel, e);
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
      two: {},
    },
  });
  ui.addEntity(e, "topLevel");
  ui.addEntity({}, "topLevel.one[0]", "child");
  assertValidHierarchy(e);
  assertEntityLinkedToUI(e.getEntity("one[0].child"), ui);
});

testSuite.runTests();