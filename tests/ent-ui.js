import { $ } from "../src/utils/dom.js";
import { Entity } from "../src/entity.js";
import { EntUI } from "../src/ent-ui.js";
import { EntityPath } from "../src/entity-path.js";

var elements = [];
for (let i = 1; i < 20; i++) {
  elements.push($(`#e${i}`));
}

console.log("TESTING CLASS EntUI");

var ui = new EntUI();

ui.addEntity({
  children: {
    one: {
      domEl: elements[0],
    },
    two: {
      domEl: elements[1],
      children: [
        {
          domEl: elements[2],
        },
        {
          domEl: elements[3],
        },
      ],
    },
  }
}, "foo");

console.log(ui);

console.log("Element 4 (foo.two[1]):", ui.getEntity(["foo", "two", 1]));