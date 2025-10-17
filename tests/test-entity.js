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
function assertParentChild(parent, child) {
  assertEqual(parent.children[child.token], child, "parent.children contain a match with child's token");
  assertDeepEqual(child.path.tokens, [...parent.path.tokens, child.token], "child tokens incorrect");
}

// Check hierarchy for root and all descendants
function assertValidHierarchy(entity, currTokens = null) {
  if (currTokens === null) {
    currTokens = entity.path.tokens;
  }
  entity.forEachChild(function(c, token) {
    const newTokens = [...currTokens, c.token];

    // Assert the child's token, path, and parent props
    assertEqual(c.token, token, "child's token incorrect");
    assertDeepEqual(c.path.tokens, newTokens, "child's path incorrect");
    assertEqual(c.parent, this, "child's parent reference incorrect");

    // Recursive call with the current path if the child has subsequent children
    if (c.children) {
      assertValidHierarchy(c, newTokens);
    }
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
testSuite.addTest("State initializes", () => {
  var e = new Entity({
    state: { value: 10 },
  });
  assertEqual(e.state.value, 10);
});

testSuite.addTest("Local state initializes", () => {
  var e = new Entity({
    lState: { isActive: true },
  });
  assertEqual(e.lState.isActive, true);
});

// Validators
testSuite.addTest("Validators initialize", () => {
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
testSuite.addTest("Utils initialize", () => {
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
testSuite.addTest("_initEventListeners(): Event listeners initialize", () => {
  var e = new Entity({
    domEl: document.createElement("div"),
    events: {
      click() {
        this.lState.clicked = true;
      },
    },
  });
  assertType(e.events.click, "function");
});

testSuite.addTest("Initialization fails with non-object events", () => {
  assertThrows(() => {
    var e = new Entity({
      domEl: document.createElement("div"),
      events: "not-an-object",
    });
  }, "events property is not an object");
});

testSuite.addTest("_initEventListeners() fails with non-function handlers", () => {
  assertThrows(() => {
    var e = new Entity({
      domEl: document.createElement("div"),
      events: {
        click: "not-a-function",
      },
    });
  }, "event handler must be a function");
});

testSuite.addTest("_initEventListeners() fails with arrow function handlers", () => {
  assertThrows(() => {
    var e = new Entity({
      domEl: document.createElement("div"),
      events: {
        click: (e) => {return e},
      },
    });
  }, "event handler cannot be an arrow function");
});

testSuite.addTest("Event listeners operate", () => {
  var e = new Entity({
    domEl: document.createElement("div"),
    events: {
      click() {
        this.lState.result = 50;
      },
    },
  });
  e.domEl.dispatchEvent(new Event("click"));
  assertEqual(e.lState.result, 50);
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
testSuite.addTest("Entity initialized with empty config object is of type \"leaf\"", () => {
  var e = new Entity({});
  assertEqual(e.type, "leaf");
});

testSuite.addTest("Entity initialized with empty children object is of type \"group\"", () => {
  var e = new Entity({
    children: {},
  });
  assertEqual(e.type, "group");
});

testSuite.addTest("Entity initialized with empty children array is of type \"list\"", () => {
  var e = new Entity({
    children: [],
  });
  assertEqual(e.type, "list");
});

testSuite.addTest("Group Entity initialized with single child entity has correct hierarchy", () => {
  var e = new Entity({
    children: {
      child: {},
    },
  });
  assertParentChild(e, e.children.child);
});

testSuite.addTest("List Entity initialized with single child entity has correct hierarchy", () => {
  var e = new Entity({
    children: [{}],
  });
  assertParentChild(e, e.children[0]);
});

testSuite.addTest("forEachChild loops through each direct child (group)", () => {
  var e = new Entity({
    children: {
      one: {},
      two: {},
      three: {},
    },
  });
  e.forEachChild((c, token) => {
    c.lState.name = token;
  });
  assertEqual(e.children.one.lState.name, "one");
  assertEqual(e.children.two.lState.name, "two");
  assertEqual(e.children.three.lState.name, "three");
});

testSuite.addTest("forEachChild loops through each direct child (list)", () => {
  var e = new Entity({
    children: [{}, {}, {}],
  });
  e.forEachChild((c, token) => {
    c.lState.index = token;
  });
  assertEqual(e.children[0].lState.index, 0);
  assertEqual(e.children[1].lState.index, 1);
  assertEqual(e.children[2].lState.index, 2);
});

testSuite.addTest("forEachChild fails on non-parent Entity", () => {
  assertThrows(() => {
    var e = new Entity();
    e.forEachChild((c) => {});
  }, /Cannot call forEachChild.+not a group or list/);
});

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

testSuite.runTests();