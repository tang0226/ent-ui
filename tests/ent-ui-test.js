import { EntityPath } from "../../src/entity-path.js";
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

// Constructor
testSuite.addTest("Constructor initializes with `entities` option", () => {
  const ui = new EntUI({
    entities: {
      foo: {},
      bar: {},
    },
  });
  assertTruthy(ui._entities.foo);
  assertTruthy(ui._entities.bar);
});

testSuite.addTest("Initialization fails with bad `entities` option type", () => {
  assertThrows(() => {
    const ui = new EntUI({
      entities: 10,
    });
  }, "cannot accept entities option of type");
  assertThrows(() => {
    const ui = new EntUI({
      entities: [],
    });
  }, "cannot accept entities option of type");
  assertThrows(() => {
    const ui = new EntUI({
      entities: true,
    });
  }, "cannot accept entities option of type");
});

// _linkEntity
testSuite.addTest("_linkEntity adds _ui prop to Entity and all descendants", () => {
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

testSuite.addTest("addEntity accepts different path types", () => {
  var ui = new EntUI();
  var e = new Entity({
    children: {
      one: { children: [{ children: {} }, {}] },
    },
  });
  ui.addEntity(e, "topLevel");
  ui.addEntity({}, "topLevel.one[0]", "child1");
  assertTruthy(ui._entities.topLevel._children.one._children[0]._children.child1);
  ui.addEntity({}, new EntityPath(["topLevel", "one", 0]), "child2");
  assertTruthy(ui._entities.topLevel._children.one._children[0]._children.child2);
  ui.addEntity({}, ["topLevel", "one", 0], "child3");
  assertTruthy(ui._entities.topLevel._children.one._children[0]._children.child3);
});

testSuite.addTest("addEntity accepts different path/token configurations", () => {
  var ui = new EntUI();
  var e = new Entity({
    children: {
      one: { children: [{ children: {} }, {}] },
    },
  });
  ui.addEntity(e, "topLevel");
  // Treat path as path of existing Entity to which we add a new Entity with token "child1"
  ui.addEntity({}, "topLevel.one[0]", "child1");
  assertTruthy(ui._entities.topLevel._children.one._children[0]._children.child1);
  // Treat path as full path of new Entity ("child2" is the new Entity's)
  ui.addEntity({}, "topLevel.one[0].child2");
  assertTruthy(ui._entities.topLevel._children.one._children[0]._children.child2);
});

testSuite.addTest("addEntity treats final index token as traversal token unless otherwise specified", () => {
  var ui = new EntUI();
  ui.addEntity({
    children: [
      { children: [] }, // inner should end up inside here
      { children: [] },
    ],
  }, "entity");

  // 0 index is part of the path, so EntUI should add the Entity to
  // the actual Entity "entity[0]"
  ui.addEntity({ lState: "inner" }, "entity[0]");
  assertEqual(ui._entities.entity._children[0]._children[0].lState, "inner");

  // 0 index is specified as the new token, so EntUI should add the Entity
  // to "entity" at index 0
  ui.addEntity({ lState: "outer" }, "entity", 0);
  assertEqual(ui._entities.entity._children[0].lState, "outer");
});

testSuite.addTest("addEntity fails when no entObj is passed", () => {
  var ui = new EntUI();
  assertThrows(() => {
    ui.addEntity();
  }, "Entity instance / config object not provided");
});

testSuite.addTest("addEntity fails when no path is passed", () => {
  var ui = new EntUI();
  assertThrows(() => {
    ui.addEntity({});
  }, "no path provided");
});

testSuite.addTest("addEntity fails when empty path is passed", () => {
  var ui = new EntUI();
  assertThrows(() => {
    ui.addEntity({}, []);
  }, "empty path");
});

testSuite.addTest("addEntity fails when first path token is not a string", () => {
  var ui = new EntUI();
  assertThrows(() => {
    ui.addEntity({}, new EntityPath([0]));
  }, /first path token.+is not a string/);
});

testSuite.addTest("addEntity fails when Entity to add already has a UI", () => {
  var ui = new EntUI();
  var ui2 = new EntUI();
  var ent = new Entity();
  ui.addEntity(ent, "entity");
  assertThrows(() => {
    ui2.addEntity(ent, "entity");
  }, "Entity is already attached to a UI");
});

testSuite.addTest("addEntity fails when Entity already has a parent", () => {
  var ui = new EntUI();
  var ent = new Entity({
    children: { child: {} },
  });
  assertThrows(() => {
    ui.addEntity(ent._children.child, "entity");
  }, "Entity already has a parent");
});

testSuite.addTest("addEntity fails when Entity is not an object or an Entity instance", () => {
  var ui = new EntUI();
  assertThrows(() => {
    ui.addEntity("not-an-object-or-Entity", "entity");
  }, "input is not an object or Entity instance");
});

// getEntity()
testSuite.addTest("getEntity succeeds on single-token path", () => {
  var ui = new EntUI();
  ui.addEntity({
    lState: { foo: 10 }
  }, "topLevel");
  assertEqual(ui.getEntity("topLevel").lState.foo, 10);
});

testSuite.addTest("getEntity succeeds on deep path", () => {
  var ui = new EntUI();
  ui.addEntity({
    children: {
      child1: {},
      child2: {
        children: [
          {},
          {
            children: [{}, {}],
          }
        ],
      },
    },
  }, "topLevel");
  var e = ui._entities.topLevel._children.child2._children[1]._children[0];
  assertEqual(ui.getEntity("topLevel.child2[1][0]"), e);
});

testSuite.addTest("getEntity accepts different path types", () => {
  var ui = new EntUI();
  ui.addEntity({
    children: {
      child1: {},
      child2: {
        children: [
          {},
          {
            children: [{}, {}],
          }
        ],
      },
    },
  }, "topLevel");
  var e = ui._entities.topLevel._children.child2._children[1]._children[0];
  assertEqual(ui.getEntity(new EntityPath("topLevel.child2[1][0]")), e);
  assertEqual(ui.getEntity("topLevel.child2[1][0]"), e);
  assertEqual(ui.getEntity(["topLevel", "child2", 1, 0]), e);
});

testSuite.addTest("getEntity fails with invalid path type", () => {
  var ui = new EntUI();
  assertThrows(() => {
    ui.getEntity(null);
  }, "must be an EntityPath, a string, or an array of tokens");
});

testSuite.addTest("getEntity fails with non-string first token", () => {
  var ui = new EntUI();
  ui.addEntity({}, "topLevel");
  assertThrows(() => {
    ui.getEntity("[0].foo");
  }, "First path token must be a property name");
});

testSuite.addTest("getEntity fails with non-existent top-level token", () => {
  var ui = new EntUI();
  ui.addEntity({}, "topLevel");
  assertThrows(() => {
    ui.getEntity("notATopLevelToken");
  }, "UI has no top-level entity");
});

testSuite.addTest("getEntity fails when trying to access child of childless Entity", () => {
  var ui = new EntUI();
  ui.addEntity({
    children: [
      { children: { foo: {} } },
    ],
  }, "topLevel");
  assertThrows(() => {
    ui.getEntity("topLevel[0].foo.nonExistent");
  }, /Entity.+has no children/);
});

testSuite.addTest("getEntity fails when no matching child is found", () => {
  var ui = new EntUI();
  ui.addEntity({
    children: [
      { children: { foo: {} } },
    ],
  }, "topLevel");
  assertThrows(() => {
    ui.getEntity("topLevel[0].bar");
  }, /Entity.+has no child "bar"/);
});

testSuite.runTests();