TODO:
  * Fix token stringification (entUI.getEntity "Invalid token" errors)
  * Allow EntUI initialization from config object
  * Initialize UI state (by default or as predefined in standalone Entity)
  * Add init options
    * figure out order that init() calls should run


--------------------------------------------------------------

Cluttered and chaotic planning / theory:

Initialization of path props:

When an entity is created, it starts with no path.

updatePaths utility: updates self path and all children:
 * Get path of parent, join this.key to that path
 * call updatePaths for all children

addEntity: append 

Idea: initialize structure with tokens and parents data.
Then, at the end of the constructor, after all children and stuff have been added,
run updatePaths ONLY IF THIS ENTITY HAS NO PARENT. This way, we are guaranteed to begin from the top level



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
For "traversal" syntax, can use prefixes of parent symbol "^"

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
---------------------------------------------------------------------------------
