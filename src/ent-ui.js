import { Entity } from "./entity.js";
import { EntityPath } from "./entity-path.js";

export class EntUI {
  constructor(options = {}) {
    this.entities = {};
    this.state = {};
    this.attrs = {};
    this.validators = {};

    // Init with options here
  }


  // Can add a top-level Entity to the UI or a sub-Entity to an existing Entity, depending on `path`
  // entObj can be either a config object or an Entity instance
  addEntity(entObj, path) {
    if (entObj === undefined) throw new Error("Cannot add Entity to UI: Entity instance / config object not provided");
    if (path === undefined) throw new Error("Cannot add Entity to UI: no path provided");

    // Path validation; KEEP IN FRONT OF `entObj` VALIDATION
    if (!(path instanceof EntityPath)) {
      if (typeof path == "string" || Array.isArray(path)) {
        path = new EntityPath(path);
      }
      else {
        throw new TypeError(`Cannot add Entity to UI: path {${path}} not an EntityPath, string, or array`);
      }
    }

    if (path.tokens.length == 0) {
      throw new ValueError(`Cannot add Entity to UI: empty path`);
    }
    if (typeof path.tokens[0] != "string") {
      throw new TypeError(`Cannot add Entity to UI: first path token {${path.tokens[0]}} is not a string`);
    }

    // entObj validation
    let entity;
    if (entObj instanceof Entity) {
      entity = entObj;

      
      if (entity.ui) {
        throw new Error(`Cannot add entity to UI at path "${path.toString()}": Entity is already attached to a UI`);
      }
      if (entity.parent) {
        throw new Error(`Cannot add entity to UI at path "${path.toString()}": Entity already has a parent`);
      }
    }
    else {
      if (typeof entObj != "object") {
        throw new TypeError(`Cannot add Entity to UI at path "${path.toString()}": input is not an object or Entity instance`);
      }

      entity = new Entity(entObj);
    }

    // See if we are adding a top-level object
    if (path.tokens.length == 1) {
      // Seed the entity's path with its string token, then propagate the paths through the hierarchy
      const token = path.tokens[0];
      entity.token = token;
      entity.path = new EntityPath([token]);
      entity._updateHierarchy();

      // Add to top-level entities object
      this.entities[token] = entity;
    }
    else {
      // Add entity to some descendant Entity (determined by path)
      this.getEntity(path).addEntity(entity);
    }

    // Link the Entity to this UI
    this._linkEntity(entity);

    // Extract state from the Entity and its descendants
    this._extractEntityState(entity);
  }


  getEntity(path) {
    let tokens = path;

    // Initialize tokens and validate path type
    if (path instanceof EntityPath) {
      tokens = EntityPath.tokens;
    }
    else if (typeof path == "string") {
      tokens = EntityPath.tokenize(path);
    }
    else if (!Array.isArray(path)) {
      throw new TypeError("Path variable must be an EntityPath, a string, or an array of tokens");
    }

    // Validate first token and initialize current entity var
    if (typeof tokens[0] != "string") {
      throw new TypeError("First path token must be a property name");
    }
    let entity = this.entities[tokens[0]];
    if (!entity) {
      throw new Error(`UI has no top-level entity "${tokens[0]}"`);
    }

    for (const token of tokens.slice(1)) {
      if (!entity.children) {
        throw new Error(`Entity "${entity.path.toString()}" has no children`);
      }
      // Check for mismatching token type
      if (entity.type == "list" && typeof token != "number") {
        throw new TypeError(`Invalid token: accessing Entity of list "${entity.path.toString()}" requires a number; {${token}} provided instead`);
      }

      let nextEntity = entity.children[token];
      if (!nextEntity) {
        throw new Error(`Entity "${entity.path.toString()}" has no child {${token}}`);
      }
      entity = nextEntity;
    }

    return entity;
  }


  // Recursively adds the `ui` prop to an entity and all its descendants
  _linkEntity(entity) {
    entity.ui = this;
    if (entity.children) {
      entity.forEachChild((c) => {
        this._linkEntity(c);
      });
    }
  }


  // Recursively extract the temp-state from an entity and its descendants into the `state` prop.
  // When adding an Entity, this step must take place after hierarchy initialization (Entity._updateHierarchy())
  _extractEntityState(entity, stateObj = null) {

    // If entity is top-level, initialize the top-level object in `state`
    if (!entity.parent) {
      // Initialize top-level state and set stateObj as a reference
      this.state[entity.token] = stateObj = {};
    }
    else {
      // If not recursively passed, et the state object by
      // traversing `state` based on entity's `path`
      if (!stateObj) {
        stateObj = this._getStateObj(entity.path);
      }
    }

    stateObj.state = null;
    if (entity.state) {
      // Move the entity's state into stateObj
      // (which refers to the correct location in `this.state`)
      stateObj.state = entity.state;
      entity.state = null;
    }

    if (entity.children) {
      stateObj.children = entity.type == "list" ? [] : {};

      entity.forEachChild((c, token) => {
        stateObj.children[token] = {};
        this._extractEntityState(
          c,
          stateObj.children[token]
        );
      });
    }
  }


  // Returns the state object (branch) at a given (assumed valid) path
  _getStateObj(path) {
    const tokens = path.tokens;
    var stateTree = this.state[tokens[0]];
    for (let token of tokens.slice(1)) {
      stateTree = stateTree.children[token];
    }
    return stateTree;
  }
}
