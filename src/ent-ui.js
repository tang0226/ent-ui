import { Entity } from "./entity.js";
import { EntityPath } from "./entity-path.js";

export class EntUI {
  constructor(options = {}) {
    this._entities = {};
    this._state = {};
    this.attrs = {};
    this.validators = {};

    // Init with options here
  }

  get entities() {
    // Deep copy to avoid direct rewriting of _entities and its attributes
    return {...this._entities};
  }


  // * Can add a top-level Entity to the UI or a sub-Entity to an existing Entity, depending on the path params
  // * entObj can be either a config object or an Entity instance
  // * `path` can be the full path of the new Entity (including the new token),
  //   OR it can be the path fo the Entity to add to, and `newToken` can be the token of the new Entity.
  //   Either way, `path` and `newToken` are joined, and the last token in the combined path is taken as the new Entity's
  addEntity(entObj, path, newToken = null) {
    if (entObj === undefined) throw new Error("Cannot add Entity to UI: Entity instance / config object not provided");
    if (path === undefined) throw new Error("Cannot add Entity to UI: no path provided");

    if (newToken !== null) {
      path = EntityPath.join(path, newToken);
    }
    else {
      if (!(path instanceof EntityPath)) {
        path = new EntityPath(path);
      }
    }

    const tokens = path.tokens;

    if (tokens.length == 0) {
      throw new ValueError(`Cannot add Entity to UI: empty path`);
    }
    if (typeof tokens[0] != "string") {
      throw new TypeError(`Cannot add Entity to UI: first path token {${path.tokens[0]}} is not a string`);
    }

    // entObj validation
    let entity;
    if (entObj instanceof Entity) {
      entity = entObj;

      
      if (entity._ui) {
        throw new Error(`Cannot add entity to UI at path "${path.toString()}": Entity is already attached to a UI`);
      }
      if (entity._parent) {
        throw new Error(`Cannot add entity to UI at path "${path.toString()}": Entity already has a parent`);
      }
    }
    else {
      if (typeof entObj != "object") {
        throw new TypeError(`Cannot add Entity to UI at path "${path.toString()}": input is not an object or Entity instance`);
      }

      // Initialize the new ent, but will update hierarchy later, after token is set
      entity = new Entity(entObj, { _updateHierarchy: false });
    }

    // Tokens that reach the entity to which we're adding (empty if we're adding a top-level ent)
    const traverseTokens = tokens.slice(0, -1);
    // final token (token to give `entObj` when adding)
    const token = tokens[tokens.length - 1];

    // See if we are adding a top-level entity
    if (traverseTokens.length == 0) {
      // Seed the entity's path with its string token, then propagate the paths through the hierarchy
      entity._token = token;
      entity._path = new EntityPath([token]);
      entity._updateHierarchy();

      // Add to top-level entities object
      this._entities[token] = entity;
    }
    else {
      // Add `entity` to its correct parent entity
      // (Entity.addEntity() initializes `entity`'s hierarchy)
      this.getEntity(traverseTokens).addEntity(entity, token);
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
    let entity = this._entities[tokens[0]];
    if (!entity) {
      throw new Error(`UI has no top-level entity "${tokens[0]}"`);
    }

    for (const token of tokens.slice(1)) {
      if (!entity._children) {
        throw new Error(`Entity "${entity._path.toString()}" has no children`);
      }

      let nextEntity = entity._children[token];
      if (!nextEntity) {
        throw new Error(`Entity "${entity._path.toString()}" has no child {${token}}`);
      }
      entity = nextEntity;
    }

    return entity;
  }


  // Recursively adds the `ui` prop to an entity and all its descendants
  _linkEntity(entity) {
    entity._ui = this;
    if (entity._children) {
      entity.forEachChild((c) => {
        this._linkEntity(c);
      });
    }
  }


  // Recursively extract the temp-state from a new entity and its descendants into the `state` prop.
  // When adding an Entity, this step must take place after hierarchy initialization (Entity._updateHierarchy())
  _extractEntityState(entity, stateObj = null) {

    if (stateObj === null) {
      if (entity._parent) {
        // Initialize a new branch in the corresponding part of UI's `state` tree
        const parentState = this._getStateObj(entity._parent._path);
        if (!parentState.children) parentState.children = {};
        parentState.children[entity._token] = stateObj = {};
      }
      else {
        // Create a new top-level branch in UI's `state`
        this._state[entity._token] = stateObj = {};
      }
    }

    stateObj.state = null;
    if (entity.state) {
      // Move the entity's state into stateObj
      // (which refers to the correct location in `this.state`)
      stateObj.state = entity.state;
      entity.state = null;
    }

    if (entity._children) {
      stateObj.children = entity._type == "list" ? [] : {};

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
    var stateTree = this._state[tokens[0]];
    for (let token of tokens.slice(1)) {
      stateTree = stateTree.children[token];
    }
    return stateTree;
  }
}
