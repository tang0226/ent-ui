import { Entity } from "../src/entity.js";
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

// For checking Entity hierarchy
export function assertParentChild(parent, child) {
  assertEqual(parent._children[child._token], child, "parent._children contain a match with child's token");
  assertDeepEqual(child._path.tokens, [...parent._path.tokens, child._token], "child tokens incorrect");
}

// Check hierarchy for root and all descendants
export function assertValidHierarchy(entity, currTokens = null) {
  if (currTokens === null) {
    currTokens = entity._path.tokens;
  }

  if (!entity._children) return;

  entity.forEachChild(function(c, token) {
    const newTokens = [...currTokens, c._token];

    // Assert the child's token, path, and parent props
    assertEqual(c._token, token, "child's token incorrect");
    assertDeepEqual(c._path.tokens, newTokens, "child's path incorrect");
    assertEqual(c._parent, this, "child's parent reference incorrect");

    // Recursive call with the current path
    assertValidHierarchy(c, newTokens);
  });
}

const testSuite = new TestSuite("Entity");

testSuite.addTest("Initialization succeeds with empty config object", () => {
  new Entity({});
});

// Initial DOM element
testSuite.addTest("Initialization succeeds with valid DOM element", () => {
  var e = new Entity({
    domEl: document.createElement("div"),
  });
  assertInstance(e.domEl, Element);
});

testSuite.addTest("Initialization fails with non-DOM element", () => {
  assertThrows(() => {
    var e = new Entity({
      domEl: [],
    });
  }, "domEl property is not a DOM element");
});

// Attributes
testSuite.addTest("Attributes initialize", () => {
  var e = new Entity({
    attrs: { a: 1, b: 2 },
  });
  assertEqual(e.attrs.a, 1);
  assertEqual(e.attrs.b, 2);
});

testSuite.addTest("Initialization fails with non-object attributes", () => {
  assertThrows(() => {
    var e = new Entity({
      attrs: "not-an-object",
    });
  }, "attributes property is not an object");
});

// State and local state
testSuite.addTest("constructor: state initializes", () => {
  var e = new Entity({
    state: { value: 10 },
  });
  assertEqual(e._state.value, 10);
});

testSuite.addTest("constructor: local state initializes", () => {
  var e = new Entity({
    lState: { isActive: true },
  });
  assertEqual(e.lState.isActive, true);
});

// Validators
testSuite.addTest("constructor: validators initialize", () => {
  var e = new Entity({
    domEl: document.createElement("div"),
    validators: {
      checkText() {
        return this.domEl.innerText == "test text";
      },
    }
  });
  assertType(e.validators.checkText, "function");
});

testSuite.addTest("Validators operate", () => {
  var e = new Entity({
    domEl: document.createElement("div"),
    validators: {
      checkText() {
        return this.domEl.innerText == "test text";
      },
    }
  });
  e.domEl.innerText = "test text";
  assertEqual(e.validators.checkText(), true);
});

testSuite.addTest("Initialization fails with non-object validators", () => {
  assertThrows(() => {
    var e = new Entity({
      validators: "not-an-object",
    });
  }, "validators property is not an object");
});

testSuite.addTest("Initialization fails with non-function validators", () => {
  assertThrows(() => {
    var e = new Entity({
      validators: {
        checkText: "not-a-function",
      },
    });
  }, /validator.+is not a function/);
});

testSuite.addTest("Initialization fails with arrow function validators", () => {
  assertThrows(() => {
    var e = new Entity({
      domEl: document.createElement("div"),
      validators: {
        checkText: () => this.domEl.innerText == "test text",
      },
    });
  }, /validator.+cannot be an arrow function/);
});

// Utils
testSuite.addTest("constructor: utils initialize", () => {
  var e = new Entity({
    utils: {
      setA(n) {this.lState.a = n},
      setB(n) {this.lState.b = n},
    },
  });
  assertType(e.utils.setA, "function");
  assertType(e.utils.setB, "function");
});

testSuite.addTest("Utils operate", () => {
  var e = new Entity({
    lState: {},
    utils: {
      setA(n) {this.lState.a = n},
      setB(n) {this.lState.b = n},
    },
  });
  const aVal = 100;
  const bVal = 200;
  e.utils.setA(aVal);
  e.utils.setB(bVal);
  assertEqual(e.lState.a, aVal);
  assertEqual(e.lState.b, bVal);
});

testSuite.addTest("Initialization fails with non-object utils", () => {
  assertThrows(() => {
    var e = new Entity({
      utils: "not-an-object",
    });
  }, "utils property is not an object")
});

testSuite.addTest("Initialization fails with non-function utils", () => {
  assertThrows(() => {
    var e = new Entity({
      utils: {
        setA: 100,
        setB: 200,
      },
    });
  }, /utility.+is not a function/);
});

testSuite.addTest("Initialization fails with arrow function utils", () => {
  assertThrows(() => {
    var e = new Entity({
      utils: {
        setA: (n) => this.lState.a = n,
        setB: (n) => this.lState.b = n,
      },
    });
  }, /utility.+cannot be an arrow function/);
});

// Event listeners
testSuite.addTest("constructor: Event listeners initialize", () => {
  var e = new Entity({
    domEl: document.createElement("div"),
    events: {
      click() {
        this.lState.clicked = true;
      },
    },
  });
  assertType(e.events.click[0].handler, "function");
});

testSuite.addTest("Initialization fails with non-object events", () => {
  assertThrows(() => {
    var e = new Entity({
      domEl: document.createElement("div"),
      events: "not-an-object",
    });
  }, "events property is not an object");
});

// addEventListener()
testSuite.addTest("addEventListener adds event listener to domEl", () => {
  var e = new Entity({
    domEl: document.createElement("div"),
  });
  e.addEventListener("click", function(e) {
    this.domEl.innerText = "hello world";
  });
  e.domEl.dispatchEvent(new Event("click"));
  assertEqual(e.domEl.innerText, "hello world");
});

testSuite.addTest("addEventListener supports multiple events of same type", () => {
  var e = new Entity({
    domEl: document.createElement("div"),
  });
  e.addEventListener("click", function(e) {
    this.domEl.innerText = "hello world";
  });
    e.addEventListener("click", function(e) {
    this.lState = "clicked";
  });
  e.domEl.dispatchEvent(new Event("click"));
  assertEqual(e.domEl.innerText, "hello world");
  assertEqual(e.lState, "clicked");
});

testSuite.addTest("addEventListener fails on Entity without domEl", () => {
  var e = new Entity();
  assertThrows(() => {
    e.addEventListener("click", function() {});
  }, "Entity has no element");
});

testSuite.addTest("addEventListener fails with non-function handlers", () => {
  assertThrows(() => {
    var e = new Entity({
      domEl: document.createElement("div"),
    });
    e.addEventListener("click", "not-a-function");
  }, "event handler must be a function");
});

testSuite.addTest("addEventListener fails with arrow function handlers", () => {
  assertThrows(() => {
    var e = new Entity({
      domEl: document.createElement("div"),
    });
    e.addEventListener("click", () => {});
  }, "event handler cannot be an arrow function");
});

// removeEventListener()
testSuite.addTest("removeEventListener removes event listener from self", () => {
  var handler = function() {
    this.lState = "clicked";
  };
  var e = new Entity({
    domEl: document.createElement("div"),
    events: {
      click: handler,
    },
  });
  e.removeEventListener("click", handler);
  assertFalsy(e.events.click.length);
});

testSuite.addTest("removeEventListener differentiates between two callbacks for same event type", () => {
  var handler1 = function() {
    this.lState = "clicked";
  };
  var handler2 = function() {
    this.domEl.innerText = "clicked";
  };

  var e = new Entity({
    domEl: document.createElement("div"),
  });
  e.addEventListener("click", handler1);
  e.addEventListener("click", handler2);

  e.removeEventListener("click", handler1);

  // Make sure there is still a click event left
  assertEqual(e.events.click.length, 1);
});

testSuite.addTest("removeEventListener fails on Entity without domEl", () => {
  var e = new Entity();
  assertThrows(() => {
    e.removeEventListener();
  }, "Entity has no element");
});

testSuite.addTest("removeEventListener fails when no event listener of matching type found", () => {
  var e = new Entity({
    domEl: document.createElement("div"),
    events: {
      click() {},
    },
  });
  assertThrows(() => {
    e.removeEventListener("focus", function() {});
  }, /no event listener found for.+event/);
});

testSuite.addTest("removeEventListener fails when no matching handler found", () => {
  var e = new Entity({
    domEl: document.createElement("div"),
    events: {
      click() {},
    },
  });
  assertThrows(() => {
    e.removeEventListener("click", function() {});
  }, "handler doesn't match any currently present");
});


testSuite.addTest("Event listeners operate", () => {
  var e = new Entity({
    domEl: document.createElement("div"),
    lState: {},
    events: {
      click() {
        this.lState.result = 50;
      },
    },
  });
  e.domEl.dispatchEvent(new Event("click"));
  assertEqual(e.lState.result, 50);
});

testSuite.addTest("Multiple event listeners of same type on same Entity both execute", () => {
  var e = new Entity({
    domEl: document.createElement("div"),
    lState: {},
    events: {
      click() {
        this.lState.result = 50;
      },
    },
  });
  e.addEventListener("click", function() {
    this.domEl.innerText = "foo";
  });
  e.domEl.dispatchEvent(new Event("click"));
  assertEqual(e.lState.result, 50);
  assertEqual(e.domEl.innerText, "foo");
});

// Entity.setDomEl()
testSuite.addTest("setDomEl() operates", () => {
  var e = new Entity({});
  e.setDomEl(document.createElement("div"));
  assertInstance(e.domEl, Element);
});

testSuite.addTest("setDomEl() fails when Entity already has a DOM element", () => {
  assertThrows(() => {
    var e = new Entity({
      domEl: document.createElement("div"),
    });
    e.setDomEl(document.createElement("div"));
  }, "Entity already has a DOM element");
});

testSuite.addTest("setDomEl() fails when domEl param is not an Element", () => {
  assertThrows(() => {
    var e = new Entity({});
    e.setDomEl({});
  }, "is not an Element");
});


// Children and hierarchy

// Constructor
testSuite.addTest("Entity initialized with empty config object is of type \"leaf\"", () => {
  var e = new Entity({});
  assertEqual(e._type, "leaf");
});

testSuite.addTest("Entity initialized with empty children object is of type \"group\"", () => {
  var e = new Entity({
    children: {},
  });
  assertEqual(e._type, "group");
});

testSuite.addTest("Entity initialized with empty children array is of type \"list\"", () => {
  var e = new Entity({
    children: [],
  });
  assertEqual(e._type, "list");
});

testSuite.addTest("Group Entity initialized with single child entity has correct hierarchy", () => {
  var e = new Entity({
    children: {
      child: {},
    },
  });
  assertParentChild(e, e._children.child);
});

testSuite.addTest("List Entity initialized with single child entity has correct hierarchy", () => {
  var e = new Entity({
    children: [{}],
  });
  assertParentChild(e, e._children[0]);
});

// forEachChild()
testSuite.addTest("forEachChild loops through each direct child (group)", () => {
  var e = new Entity({
    children: {
      one: {},
      two: {},
      three: {},
    },
  });
  e.forEachChild((c, token) => {
    c.lState = { name: token };
  });
  assertEqual(e._children.one.lState.name, "one");
  assertEqual(e._children.two.lState.name, "two");
  assertEqual(e._children.three.lState.name, "three");
});

testSuite.addTest("forEachChild loops through each direct child (list)", () => {
  var e = new Entity({
    children: [{}, {}, {}],
  });
  e.forEachChild((c, token) => {
    c.lState = { index: token };
  });
  assertEqual(e._children[0].lState.index, 0);
  assertEqual(e._children[1].lState.index, 1);
  assertEqual(e._children[2].lState.index, 2);
});

testSuite.addTest("forEachChild fails on non-parent Entity", () => {
  assertThrows(() => {
    var e = new Entity();
    e.forEachChild((c) => {});
  }, /Cannot call forEachChild.+not a group or list/);
});

// addEntity
testSuite.addTest("addEntity adds an Entity to children and updates the hierarchy (config obj passed)", () => {
  var e = new Entity({
    children: {},
  });
  e.addEntity({}, "child");
  assertValidHierarchy(e);
});

testSuite.addTest("addEntity adds an Entity to children and updates the hierarchy (Entity instance passed)", () => {
  var e = new Entity({
    children: {},
  });
  e.addEntity(new Entity({}), "child");
  assertValidHierarchy(e);
});

testSuite.addTest("addEntity provides default token when adding to list", () => {
  var e = new Entity({
    children: [{}],
  });
  e.addEntity({ lState: { a: 2 } }); // no index token provided; addEntity should by default add this Ent to the end of the list
  assertEqual(e._children[1].lState.a, 2, "lState of added Entity not set");
});

testSuite.addTest("addEntity inserts child at specified index in list Entity", () => {
  var e = new Entity({
    children: [{}, {}, {}],
  });
  var child = new Entity({
    lState: { a: 2 },
  });
  e.addEntity(child, 2); // Specify the index
  // Check that the child is at the specified index
  assertEqual(e._children[2], child, "child not inserted at correct index");
});

testSuite.addTest("addEntity works when adding grandchildren", () => {
  var e = new Entity({
    children: {},
  });
  e.addEntity(new Entity({ children: [] }), "child");
  e._children.child.addEntity({});
  assertValidHierarchy(e);
});

testSuite.addTest("addEntity _updateHierarchy option skips the hierarchy initialization if set to false", () => {
  var e = new Entity({
    children: {},
  });
  e.addEntity({}, "child", { _updateHierarchy: false });
  // Make sure the hierarchy initialization was skipped (e should have an invalid hier.)
  assertThrows(() => {
    assertValidHierarchy(e);
  });
});

// addEntity validation
testSuite.addTest("addEntity fails when attempting to add to leaf Entity", () => {
  var e = new Entity();
  assertThrows(() => {
    e.addEntity({});
  }, "Cannot add Entity to leaf Entity");
});

testSuite.addTest("addEntity fails when adding to group with no token provided", () => {
  var e = new Entity({
    children: {},
  });
  assertThrows(() => {
    e.addEntity({});
  }, "no token provided");
});

testSuite.addTest("addEntity fails if Entity to add already has a parent", () => {
  var e = new Entity({
    children: { child: {} },
  });
  assertThrows(() => {
    e.addEntity({}, "child");
  }, "already exists");
});

testSuite.addTest("addEntity fails when adding to list at invalid index", () => {
  var e = new Entity({
    children: [],
  });
  assertThrows(() => {
    e.addEntity({}, "NaN");
  }, "token must be a valid index when adding to a list");
});

testSuite.addTest("addEntity fails when Entity to add already has a parent", () => {
  var e1 = new Entity({
    children: {
      child: {},
    },
  });
  var e2 = new Entity({
    children: {},
  });
  assertThrows(() => {
    e2.addEntity(e1._children.child, "child");
  }, "Entity to add already has a parent");
});

testSuite.addTest("addEntity fails when a non-object is passed", () => {
  var e = new Entity({
    children: {},
  })
  assertThrows(() => {
    e.addEntity("not-an-object", "child");
  }, "Entity to add is not an object");
});


// removeEntity()
testSuite.addTest("removeEntity removes Entity from _children (group)", () => {
  var e = new Entity({
    children: { foo: {} },
  });
  var foo = e._children.foo;
  e.removeEntity("foo");
  assertEqual(e._children.foo, undefined);
});

testSuite.addTest("removeEntity removes Entity from _children (list)", () => {
  var e = new Entity({
    children: [{ lState: 0 }, { lState: 1 }, { lState: 2 }, { lState: 3 }],
  });
  e.removeEntity(1);
  assertEqual(e._children[0].lState, 0);
  assertEqual(e._children[1].lState, 2);
});

testSuite.addTest("removeEntity returns removed Entity", () => {
  var e = new Entity({
    children: { foo: {} },
  });
  var foo = e._children.foo;
  assertEqual(e.removeEntity("foo"), foo);
});

testSuite.addTest("removeEntity from list updates hierarchy for other children", () => {
  var e = new Entity({
    children: [{}, {}, {}, {}],
  });
  // Use Entity's children() getter
  var children = e.children;
  var foo = e.getEntity(0);

  assertEqual(e.removeEntity(0), foo);
  assertDeepEqual(e._children, children.slice(1));
  assertValidHierarchy(e);
});

testSuite.addTest("removeEntity updates hierarchy for removed and returned Entity", () => {
  var e = new Entity({
    children: {
      child: {
        children: [
          {
            children: { child: {} },
          },
          {},
        ],
      },
    },
  });
  var removedChild = e.removeEntity("child");
  assertDeepEqual(removedChild._children[0]._children.child._path.tokens, [0, "child"]);
});

testSuite.addTest("removeEntity removes event listeners", () => {
  var e = new Entity({
    children: {
      child: {
        domEl: document.createElement("div"),
        lState: {
          clicked: 0,
          focused: 0,
        },
        events: {
          click() {this.lState.clicked++},
          focus() {this.lState.focused++},
        },
      },
    },
  });
  var child = e._children.child;
  child.domEl.dispatchEvent(new Event("click"));
  child.domEl.dispatchEvent(new Event("focus"));
  assertEqual(child.lState.clicked, 1);
  assertEqual(child.lState.focused, 1);

  e.removeEntity("child");
  
  // Assert that event listeners have been removed
  child.domEl.dispatchEvent(new Event("click"));
  child.domEl.dispatchEvent(new Event("focus"));
  // State shouldn't change because the event listeners should be removed by now
  assertEqual(child.lState.clicked, 1);
  assertEqual(child.lState.focused, 1);
});

testSuite.addTest("removeEntity fails on leaf Entity", () => {
  var e = new Entity();
  assertThrows(() => {
    e.removeEntity(0);
  }, "Cannot remove Entity from leaf Entity");
});

testSuite.addTest("removeEntity fails with invalid index token", () => {
  var e = new Entity({
    children: [{}],
  });
  assertThrows(() => {
    e.removeEntity(0.2);
  }, /Cannot remove Entity from.+not a valid index/);
});

testSuite.addTest("removeEntity fails with out-of-range index", () => {
  var e = new Entity({
    children: [{}],
  });
  assertThrows(() => {
    e.removeEntity(1);
  }, /Cannot remove Entity from.+out of range/);
});

testSuite.addTest("removeEntity fails with invalid property name", () => {
  var e = new Entity({
    children: {foo: {}},
  });
  assertThrows(() => {
    e.removeEntity("0foo");
  }, /Cannot remove Entity from.+not a valid property name/);
});

testSuite.addTest("removeEntity fails if no child found that matches token", () => {
  var e = new Entity({
    children: {foo: {}},
  });
  assertThrows(() => {
    e.removeEntity("bar");
  }, /Cannot remove Entity from.+no child found with token/);
});


// deleteEntity()
testSuite.addTest("deleteEntity removes Entity from _children (group)", () => {
  var e = new Entity({
    children: { foo: {} },
  });
  var foo = e._children.foo;
  e.deleteEntity("foo");
  assertEqual(e._children.foo, undefined);
});

testSuite.addTest("deleteEntity removes Entity from _children (list)", () => {
  var e = new Entity({
    children: [{ lState: 0 }, { lState: 1 }, { lState: 2 }, { lState: 3 }],
  });
  e.deleteEntity(1);
  assertEqual(e._children[0].lState, 0);
  assertEqual(e._children[1].lState, 2);
});

testSuite.addTest("deleteEntity from list updates hierarchy for other children", () => {
  var e = new Entity({
    children: [{}, {}, {}, {}],
  });
  // Use Entity's children() getter
  var children = e.children;
  e.deleteEntity(0)
  assertDeepEqual(e._children, children.slice(1));
  assertValidHierarchy(e);
});

testSuite.addTest("deleteEntity removes event listeners", () => {
  var e = new Entity({
    children: {
      child: {
        domEl: document.createElement("div"),
        lState: {
          clicked: 0,
          focused: 0,
        },
        events: {
          click() {this.lState.clicked++},
          focus() {this.lState.focused++},
        },
      },
    },
  });
  var child = e._children.child;
  child.domEl.dispatchEvent(new Event("click"));
  child.domEl.dispatchEvent(new Event("focus"));
  assertEqual(child.lState.clicked, 1);
  assertEqual(child.lState.focused, 1);

  e.deleteEntity("child");
  
  // Assert that event listeners have been removed
  child.domEl.dispatchEvent(new Event("click"));
  child.domEl.dispatchEvent(new Event("focus"));
  // State shouldn't change because the event listeners should be removed by now
  assertEqual(child.lState.clicked, 1);
  assertEqual(child.lState.focused, 1);
});

testSuite.addTest("deleteEntity fails on leaf Entity", () => {
  var e = new Entity();
  assertThrows(() => {
    e.deleteEntity(0);
  }, "Cannot delete Entity from leaf Entity");
});

testSuite.addTest("deleteEntity fails with invalid index token", () => {
  var e = new Entity({
    children: [{}],
  });
  assertThrows(() => {
    e.deleteEntity(0.2);
  }, /Cannot delete Entity from.+not a valid index/);
});

testSuite.addTest("deleteEntity fails with out-of-range index", () => {
  var e = new Entity({
    children: [{}],
  });
  assertThrows(() => {
    e.deleteEntity(1);
  }, /Cannot delete Entity from.+out of range/);
});

testSuite.addTest("deleteEntity fails with invalid property name", () => {
  var e = new Entity({
    children: {foo: {}},
  });
  assertThrows(() => {
    e.deleteEntity("0foo");
  }, /Cannot delete Entity from.+not a valid property name/);
});

testSuite.addTest("deleteEntity fails if no child found that matches token", () => {
  var e = new Entity({
    children: {foo: {}},
  });
  assertThrows(() => {
    e.deleteEntity("bar");
  }, /Cannot delete Entity from.+no child found with token/);
});



testSuite.addTest("Hierarchy is valid with deep nesting", () => {
  assertValidHierarchy(new Entity({
    children: [
      {
        children: {
          c1: {
            children: [{}, {}],
          },
          c2: {},
        }
      },
      {
        children: {
          c1: {},
          c2: {
            children: [
              {}, {},
              {
                children: [{}, {}],
              },
            ],
          },
        },
      },
    ],
  }));
});

// getEntity()
testSuite.addTest("getEntity succeeds with basic descendant relationship", () => {
  var e = new Entity({
    children: [
      {},
      {
        children: {
          one: {},
          two: { children: [{}, {}] },
        },
      },
    ],
  });
  assertEqual(
    e._children[1]._children.two._children[1],
    e.getEntity("[1].two[1]"),
  );
});

testSuite.addTest("getEntity succeeds with parent operator", () => {
  var e = new Entity({
    children: [
      {
        children: {
          one: { children: [{}, {}] },
        }
      },
      { children: { two: {} } },
    ],
  });
  assertEqual(
    e._children[0]._children.one._children[1],
    e._children[1]._children.two.getEntity("^^[0].one[1]"),
  );
});

testSuite.addTest("getEntity fails when path not provided", () => {
  var e = new Entity({ children: [{}] });
  assertThrows(() => {
    e.getEntity();
  }, "no path provided");
});

testSuite.addTest("getEntity fails with invalid path type", () => {
  var e = new Entity();
  assertThrows(() => {
    e.getEntity({});
  }, "not an ObjectPath, string, array, or index");
});

testSuite.addTest("getEntity fails with excess parent operator", () => {
  var e = new Entity({
    children: [
      {
        children: [{}],
      },
    ],
  });
  assertThrows(() => {
    e._children[0]._children[0].getEntity("^^^");
  }, "parent operator error at index 2");
});

testSuite.addTest("getEntity fails when attempting to access child of leaf Entity", () => {
  var e = new Entity({
    children: [{}],
  });
  assertThrows(() => {
    e.getEntity("[0].nonExistent");
  }, "has no children");
});

testSuite.addTest("getEntity fails when attempting to access nonexistent child", () => {
  var e = new Entity({
    children: [{
      children: { one: {} },
    }],
  });
  assertThrows(() => {
    e.getEntity("[0].wrongToken");
  }, "has no child with token \"wrongToken\"");
});

testSuite.runTests();