import { Entity } from "./entity.js";
import { ObjectPath } from "./object-path.js";

export class EntUI {
  constructor(options = {}) {
    this._entities = {};
    this._state = {};
    this.attrs = {};
    this.validators = {};

    // Init with options here
    if (options.entities) {
      if (typeof options.entities === "object") {
        if (Array.isArray(options.entities)) {
          throw new Error(`EntUI cannot accept entities option of type Array`);
        }
        for (const [token, config] of Object.entries(options.entities)) {
          this.addEntity(config, token);
        }
      }
      else {
        throw new Error(`EntUI cannot accept entities option of type ${typeof options.entities}`);
      }
    }
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
      path = ObjectPath.join(path, newToken);
    }
    else {
      if (!(path instanceof ObjectPath)) {
        path = new ObjectPath(path);
      }
    }

    const tokens = path.tokens;

    if (tokens.length == 0) {
      throw new Error(`Cannot add Entity to UI: empty path`);
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
    const traversalTokens = tokens.slice(0, -1);
    // final token (token to give `entObj` when adding)
    var token = tokens[tokens.length - 1];

    // See if we are adding a top-level entity
    if (traversalTokens.length == 0) {
      // Seed the entity's path with its string token, then propagate the paths through the hierarchy
      entity._token = token;
      entity._path = new ObjectPath([token]);
      entity._updateHierarchy();

      // Add to top-level entities object
      this._entities[token] = entity;
    }
    else {
      // Handle ambiguous case (adding to list of lists): treat any final index token as a traversal token unless
      // specified as the new token for inserting into a list
      if (typeof token === "number" && newToken !== token) {
        traversalTokens.push(token);
        token = null;
      }
      this.getEntity(traversalTokens).addEntity(entity, token, { _handleUiUpdates: false });
    }

    this._connectEntity(entity);
  }

  // Accepts a connected Entity or any path format
  removeEntity(toRemove) {
    var parent, token;
    if (toRemove instanceof Entity) {
      if (toRemove._ui !== this) {
        throw new Error(`Cannot remove Entity from UI: Entity \`_ui\` property does not match this UI`);
      }
      token = toRemove._token;
      parent = toRemove._parent;
    }
    else {
      // Treat toRemove as a path
      var tokens = (new ObjectPath(toRemove, { deepCopy: false })).tokens;
      token = tokens[tokens.length - 1];
      if (tokens.length > 1) {
        parent = this.getEntity(tokens.slice(0, -1));
      }
    }

    var entity = parent ? parent._children[token] : this._entities[token];
    if (parent) {
      parent.removeEntity(token, { _handleUiUpdates: false });
    }
    else {
      delete this._entities[token];

      // Remove event listeners, since there is no parent removeEntity call to do that
      if (entity.domEl) {
        entity.removeAllEventListeners();
      }
    }

    this._disconnectEntity(entity);
    entity._setAsHierarchyRoot();

    return entity;
  }

  deleteEntity(toDelete) {
    var parent, token;
    if (toDelete instanceof Entity) {
      if (toDelete._ui !== this) {
        throw new Error(`Cannot delete Entity from UI: Entity \`_ui\` property does not match this UI`);
      }
      token = toDelete._token;
      parent = toDelete._parent;
    }
    else {
      // Treat toDelete as a path
      var tokens = (new ObjectPath(toDelete, { deepCopy: false })).tokens;
      token = tokens[tokens.length - 1];
      if (tokens.length > 1) {
        parent = this.getEntity(tokens.slice(0, -1));
      }
    }

    var entity = parent ? parent._children[token] : this._entities[token];

    if (parent) {
      parent.deleteEntity(token, { _handleUiUpdates: false });
    }
    else {
      delete this._entities[token];

      // Remove event listeners, since there is no parent removeEntity call to do that
      if (entity.domEl) {
        entity.removeAllEventListeners();
      }
    }

    // Remove the Entity's authoritative state
    this._removeEntityState(entity);
  }

  getEntity(path) {
    var tokens = ObjectPath.normalize(path).tokens;

    // Validate first token and initialize current entity var
    if (typeof tokens[0] != "string") {
      throw new TypeError("First path token must be a property name");
    }

    var entity = this._entities[tokens[0]];
    if (!entity) {
      throw new Error(`UI has no top-level entity "${tokens[0]}"`);
    }

    for (const token of tokens.slice(1)) {
      if (!entity._children) {
        throw new Error(`Entity "${entity._path.toString()}" has no children`);
      }

      let nextEntity = entity._children[token];
      if (!nextEntity) {
        throw new Error(`Entity "${entity._path.toString()}" has no child "${token}"`);
      }
      entity = nextEntity;
    }

    return entity;
  }


  // Recursively adds the `ui` prop to an entity and all its descendants
  _addUiProp(entity) {
    entity._ui = this;
    if (entity._children) {
      entity.forEachChild((c) => {
        this._addUiProp(c);
      });
    }
  }

  _removeUiProp(entity) {
    entity._ui = null;
    if (entity._children) {
      entity.forEachChild((c) => {
        this._removeUiProp(c);
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
    if (entity._state) {
      // Move the entity's state into stateObj
      // (which refers to the correct location in `this._state`)
      stateObj.state = entity._state;
      entity._state = null;
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

  // Removes the Entity's state object from `_state` and returns it
  _removeEntityState(entity) {
    let parentStateObj = entity._parent ? this._getStateObj(entity._parent._path) : this._state;
    let parentType = entity._parent?._type;
    let stateObj; // to be returned
    if (!parentType || parentType === "group") {
      stateObj = parentStateObj[entity._token];
      delete parentStateObj[entity._token];
      return stateObj;
    }
    else if (parentType === "list") {
      stateObj = parentStateObj.children.splice(entity._token, 1)[0];
      return stateObj;
    }
  }

  // Opposite of state extraction: when an Entity is removed, remove its corresponding
  // object, embedding the state back into the Entity as temp-state
  _embedEntityState(entity, stateObj = null) {
    if (stateObj === null) {
      stateObj = this._removeEntityState(entity);
    }

    entity._state = stateObj.state;

    if (entity._children) {
      entity.forEachChild((c, token) => {
        this._embedEntityState(c, stateObj.children[token]);
      });
    }
  }

  // Adds the `ui` prop to the Entity and extract its temp-state into the UI's `state` prop
  _connectEntity(entity) {
    this._addUiProp(entity);
    this._extractEntityState(entity);
  }

  _disconnectEntity(entity) {
    this._removeUiProp(entity);
    this._embedEntityState(entity);
  }


  // Returns the state object (branch) at a given (assumed valid) path
  _getStateObj(path) {
    const tokens = path.tokens;
    var stateTree = this._state[tokens[0]];
    for (const token of tokens.slice(1)) {
      stateTree = stateTree.children[token];
    }
    return stateTree;
  }
}
