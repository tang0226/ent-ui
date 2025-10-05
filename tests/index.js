import { $ } from "../src/utils/dom.js";
import { Entity } from "../src/entity.js";
import { EntUI } from "../src/ent-ui.js";
import { EntityPath } from "../src/entity-path.js";

var elements = [];
for (let i = 1; i < 20; i++) {
  elements.push($(`#e${i}`));
}

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
                  thireteen: new Entity({ domEl: elements[12] }),
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

list45.addEntity(group12, 0);
console.log(list45);

/**

Initialization of path props:

When an entity is created, it starts with no path.

updatePaths utility: updates self path and all children:
 * Get path of parent, join this.key to that path
 * call updatePaths for all children

addEntity: append 

Idea: initialize structure with tokens and parents data.
Then, at the end of the constructor, after all children and stuff have been added,
run updatePaths ONLY IF THIS ENTITY HAS NO PARENT. This way, we are guaranteed to begin from the top level



---------------------------------------------------------------------------------
Target API calls
this.ui.credsGroup.els.username.domEl.style.display = "none"
this.ui.domEl("credsGroup", "username").style.display = "none"
ui.domEl("credsGroup", "username").style.display = "none";

this.ui.state.credsGroup.username
this.ui.attrs.taskList[0]

this.ui.state("credsGroup", "username")

this.ui.setState("credsGroup", "username", "admin");

will use tokenizer to return the list of attributes/indices, e.g.:
["listOfLists", "taskLists", "0", "tasks", 2, "deleteButton"]
Groups access via attribute strings
Lists access via indices

KEY IDEA: Define access paths for elements and lists. When elements are created
as part of a group/list/UI, they are initialized with the path of tokens leading to themselves. This will help shorten the long routes up to the UI parent and back
abstractly: this.ui.getAttr(this.path)

***
In fact, each element can have it's own getAttr, getState, etc. functions.
These interfaces will then interface with the parent UI object using the element's token path
***

// Examples of three different access syntaxes
Getting:
this.ui.getState("listOfLists", "taskLists", 0, "tasks", 2) // multiple parameters with thing to set at the end
this.ui.getState("listOfLists.taskLists.0.tasks.2") // single access parameter with index properties
this.ui.getState("listOfLists.taskLists[0].tasks[2]") // single access parameter with bracket notation

Setting:
this.ui.setState("listOfLists", "taskLists", 0, "tasks", 2, "3rd task of 1st list") // multiple parameters with thing to set at the end
this.ui.setState("listOfLists.taskLists.0.tasks.2", "3rd task of 1st list") // single access parameter
this.ui.setState("listOfLists.taskLists[0].tasks[2]", "3rd task of 1st list") // single access parameter with bracket notation

this.ui.attr("taskList", 0)

this.ui.valid("rememberMe") // Single validator
this.ui.valid("rememberMe", "isChecked") // Validator object

this.ui.domEl("credsGroup", "username") // group
this.ui.domEl("rememberMe", "checkbox") // group

this.ui.domEl("taskList", 0) // list
---------------------------------------------------------------------------------


*/
