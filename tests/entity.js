import { $ } from "../src/utils/dom.js";
import { Entity } from "../src/entity.js";
import { EntUI } from "../src/ent-ui.js";
import { EntityPath } from "../src/entity-path.js";

var elements = [];
for (let i = 1; i < 20; i++) {
  elements.push($(`#e${i}`));
}

console.log("TESTING CLASS Entity");

var group12 = new Entity({
  children: {
    one: {
      domEl: elements[0]
    },
    two: {
      domEl: elements[1]
    },
  }
});

group12.addEntity(
  {
    domEl: elements[2],
    children: {
      eight: new Entity({
        children: [
          {
            domEl: elements[8]
          },
          {
            domEl: elements[9],
            children: [
              { domEl: elements[10] },
              {
                domEl: elements[11],
                children: {
                  thirteen: new Entity({ domEl: elements[12] }),
                  fourteen: { domEl: elements[13] },
                }
              }
            ]
          }
        ]
      })
    }
  },
  "three"
);

var list45 = new Entity({
  children: [
    {
      domEl: elements[3],
      children: {
        six: {
          domEl: elements[5],
        },

        seven: {
          domEl: elements[6],
        }
      }
    },
    
    {
      domEl: elements[4],
    }
  ]
});


var ui = new EntUI();

ui.addEntity(group12, "group12");
ui.addEntity(list45, "list45");

console.log("Nesting test:");
console.log(ui);

console.log("init() order test:");

console.log("target order: three, four, one, five, seven, eight, six, two");

var nested = new Entity({
  children: {
    one: {
      children: {
        three: {
          domEl: elements[2],
          init() {
            console.log("three");
          }
        },
        four: {
          domEl: elements[3],
          init() {
            console.log("four");
          }
        }
      },
      init() {
        console.log("one");
      }
    },
    two: {
      children: [
        {
          domEl: elements[4],
          init() {
            console.log("five");
          },
        },
        {
          domEl: elements[5],
          children: [
            {
              domEl: elements[6],
              init() {
                console.log("seven");
              }
            },
            {
              domEl: elements[7],
              init() {
                console.log("eight");
              }
            }
          ],
          init() {
            console.log("six");
          }
        }
      ],
      init() {
        console.log("two");
      }
    }

  }
});
nested.children["one"].addEntity({
  domEl: elements[8],
}, "nine");

console.log(nested);
console.log("");
