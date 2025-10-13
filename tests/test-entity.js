import { Entity } from "../src/entity.js";
import { $ } from "../src/utils/dom.js";
import { TestSuite } from "./framework/test-suite.js";
import {
  assert,
  assertEqual,
  assertDeepEqual,
  assertType,
  assertInstance,
  assertDefined,
  assertTruthy,
  assertFalsy,
  assertThrows,
  assertDoesNotThrow,
} from "./framework/assert.js";

const testSuite = new TestSuite("Entity");

testSuite.addTest("Initialization succeeds with empty config object", () => {
  new Entity({});
});

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

testSuite.addTest("Event listeners initialize (Entity._initEventListeners)", () => {
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

testSuite.runTests();