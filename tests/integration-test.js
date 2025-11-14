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

import {
  assertEntityLinkedToUI
} from "./ent-ui-test.js";

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

testSuite.addTest("addEntity updates new Entity's UI info if the parent Entity has a UI", () => {
  var ui = new EntUI();
  ui.addEntity(new Entity({ children: {} }), "entity");
  ui.getEntity("entity").addEntity({}, "child");
  assertEntityLinkedToUI(ui.getEntity("entity.child"), ui);
});

testSuite.addTest("Entity.removeEntity calls UI state cleanup if applicable", () => {
  var ui = new EntUI({
    entities: {
      entity: {
        children: {
          child: { children: [
            { state: "child0" },
            { state: "child1" },
          ]},
        },
      },
    },
  });

  ui.getEntity("entity.child").removeEntity(0);
  // Check that the correct state object was removed
  assertEqual(ui._state.entity.children.child.children.length, 1);
  assertEqual(ui._state.entity.children.child.children[0].state, "child1");
});

testSuite.addTest("Entity.deleteEntity calls UI state cleanup if applicable", () => {
  var ui = new EntUI({
    entities: {
      entity: {
        children: {
          child: { children: [
            { state: "child0" },
            { state: "child1" },
          ]},
        },
      },
    },
  });

  ui.getEntity("entity.child").deleteEntity(0);
  // Check that the correct state object was removed
  assertEqual(ui._state.entity.children.child.children.length, 1);
  assertEqual(ui._state.entity.children.child.children[0].state, "child1");
});

testSuite.runTests();