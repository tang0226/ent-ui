import { EntityPath } from "./entity-path.js";
import { isArrowFunction, isValidParentOperator } from "./utils/validation.js";

class InitError extends Error {
  constructor(msg) {
    super(`Cannot initialize Entity: ${msg}`);
  }
}

class EntityGetError extends Error {
  constructor(src, msg) {
    super(`getEntity() from Entity "${src._path.toString()}": ${msg}`);
  }
}


export class Entity {
  constructor(config = {}, { _parent = null, _token = null, _updateHierarchy = true } = {}) {
    // Path properties
    this._path = new EntityPath();
    this._parent = _parent;
    this._token = _token;

    // Element
    this._domEl = config.domEl || null;
    if (
      this._domEl !== null && this._domEl !== undefined &&
      !(this._domEl instanceof Element)
    ) throw new InitError("domEl property is not a DOM element");

    // Attributes
    this.attrs = config.attrs || {};
    if (
      this.attrs !== null && this.attrs !== undefined &&
      typeof this.attrs !== "object"
    ) throw new InitError("attributes property is not an object");

    // Temp state
    this.state = config.state || {};

    // Local state
    this.lState = config.lState || {};

    // Validators
    const validators = config.validators;
    this.validators = {};
    if (validators) {
      if (typeof validators !== "object") {
        throw new InitError("validators property is not an object");
      }

      for (const [name, func] of Object.entries(validators)) {
        if (typeof func !== "function") {
          throw new InitError(`validator "${name}" is not a function`);
        }

        // Check if the function is an arrow (=>) function, which cannot be bound with
        // a specific `this` value
        if (isArrowFunction(func)) {
          throw new InitError(`validator "${name}" cannot be an arrow function`)
        }

        this.validators[name] = func.bind(this);
      }
    }

    // Utilities
    this.utils = {};
    if (config.utils) {
      if (typeof config.utils !== "object") {
        throw new InitError("utils property is not an object");
      }

      for (const [name, func] of Object.entries(config.utils)) {
        if (typeof func !== "function") {
          throw new InitError(`utility "${name}" is not a function`);
        }

        // Check if the function is an arrow (=>) function, which cannot be bound with
        // a specific `this` value
        if (isArrowFunction(func)) {
          throw new InitError(`utility "${name}" cannot be an arrow function`)
        }

        this.utils[name] = func.bind(this);
      }
    }

    // Event listeners
    this.events = config.events || {};
    if (this._domEl) {
      if (typeof this.events !== "object") {
        throw new InitError("events property is not an object");
      }

      if (Object.keys(this.events).length) {
        this._initEventListeners();
      }
    }


    // Children
    const children = config.children;

    // Default to a bottom-level entity if no structure is defined
    this._type = "leaf";

    if (children && typeof children == "object") {
      // Determine Entity type and initialize the children prop
      if (Array.isArray(children)) {
        this._type = "list";
        this._children = [];
      }
      else {
        this._type = "group";
        this._children = {};
      }
    }


    // Add children
    if (this._type == "group") {
      for (const [key, ent] of Object.entries(children)) {
        this.addEntity(ent, key, { _updateHierarchy: false });
      }
    }

    if (this._type == "list") {
      children.forEach((ent, index) => {
        this.addEntity(ent, index, { _updateHierarchy: false });
      });
    }

    // Once entities have been added, check if this Entity is top-level.
    // If so, initialize its path and those of its descendants.
    if (!this._parent && _updateHierarchy) {
      this._updateHierarchy();
    }


    // Custom initialization
    if (config.init && typeof config.init === "function") {
      this.init = config.init.bind(this);
      this.init();
    }
  }
  // END CONSTRUCTOR
  // -----------------------------------------------------------

  // Getters
  get path() {
    return new EntityPath(this.path);
  }

  get parent() {
    return this._parent;
  }
  
  get token() {
    return this._token;
  }
  
  get type() {
    return this._type;
  }

  get domEl() {
    return this._domEl;
  }

  get ui() {
    return this._ui;
  }

  // Links the Entity to a DOM element; should only be run once, and only if no DOM element was passed at initialization
  setDomEl(domEl) {
    if (this._domEl) {
      throw new Error(`Cannot set DOM element of Entity "${this._path.toString()}": Entity already has a DOM element`);
    }
    if (!(domEl instanceof Element)) {
      throw new TypeError(`Cannot set DOM element of Entity "${this._path.toString()}": ${domEl} is not an Element`);
    }

    this._domEl = domEl;
    this._initEventListeners();
  }

  // entObj can be either a config object or an Entity instance
  addEntity(entObj, token, { _updateHierarchy = true } = {}) {
    if (this._type == "leaf") {
      throw new TypeError("Cannot add Entity to leaf Entity");
    }

    if (token === undefined) {
      if (this._type === "list") {
        token = this._children.length;
      }
      else {
        throw new Error("Cannot add Entity to group Entity: no token provided");
      }
    }

    // Token validation
    if (this._type == "group") {
      if (this._children[token]) {
        throw new ReferenceError(`Error adding child ${token} to group "${this._path.toString()}": already exists`);
      }
    }

    if (this._type == "list") {
      if (typeof token != "number") {
        throw new TypeError("Token to add an Entity must be a number when adding to a list");
      }
    }

    // Validation / initialization based on entity parameter type
    var entity;
    if (entObj instanceof Entity) {
      entity = entObj;
      // Check if the entity already has a UI that doesn't match self's
      if (entity._ui && entity._ui !== this._ui) {
        throw new Error(`Cannot add entity to ${this._type} "${this._path.toString()}": Entity is already in another UI`);
      }
      if (entity._parent) {
        throw new Error(`Cannot add entity to ${this._type} "${this._path.toString()}": Entity already has a parent`);
      }

      // Set this Entity's parent and token props
      entity._parent = this;
      entity._token = token;
    }
    else {
      if (typeof entObj != "object") {
        throw new TypeError(`Cannot add Entity to ${this._type} "${this._path.toString()}": Entity to add is not an object or Entity`);
      }

      // If the entity is a config object, initialize it,
      // passing self and the new token to give context for initializing paths later
      entity = new Entity(entObj, { _parent: this, _token: token });
    }

    // Add the entity to the children array / object
    if (this._type == "group") {
      this._children[token] = entity;
    }
    if (this._type == "list") {
      this._children.splice(token, 0, entity);
    }

    // Recursively update hierarchy if called for
    // (only skipped during Entity constructor, since it only needs to be called once in the parent Entity)
    if (_updateHierarchy) {
      entity._updateHierarchy();
    }

    // Link the new Entity to self's UI object, if applicable
    if (this._ui) {
      this._ui._linkEntity(entity);
      this._ui._extractEntityState(entity);
    }

    return entity;
  }

  // Gets the entity at a certain path (string, array of tokens, EntityPath instance);
  // can also use parent operator here
  getEntity(path) {
    // Validate path and initialize as an EntityPath instance
    if (path === undefined) throw new EntityGetError(this, "no path provided");
    if (!(path instanceof EntityPath)) {
      if (typeof path == "string" || Array.isArray(path)) {
        path = new EntityPath(path);
      }
      else if (typeof path == "number") {
        path = new EntityPath([path]);
      }
      else {
        throw new EntityGetError(this, `path {${path}} not an EntityPath, string, array, or index`);
      }
    }

    const tokens = path.tokens;
    if (tokens.length == 0) return this;

    var entity = this;
    var i = 0;
    if (isValidParentOperator(tokens[0])) {
      // Traverse up the tree according to the number of ^
      for (let j = 0; j < tokens[0].length; j++) {
        if (!entity._parent) {
          throw new EntityGetError(this, `parent operator error at index ${j}: Entity "${entity._path.toString()}" has no parent`);
        }
        entity = entity._parent;
      }
      
      // Start descending from the second token
      i++;
    }

    for (; i < tokens.length; i++) {
      if (!entity._children) {
        throw new EntityGetError(this, `Entity "${entity._path.toString()}" has no children`);
      }

      const token = tokens[i];
      let prevEntity = entity;
      entity = entity._children[token];
      if (entity === undefined) {
        throw new EntityGetError(this, `Entity "${prevEntity._path.toString()}" has no child with token "${token}"`);
      }
    }

    return entity;
  }
  
  // Like Array.forEach(), but for an Entity's children.
  // Function is bound to the calling Entity when possible
  forEachChild(func) {
    if (!isArrowFunction(func)) {
      func = func.bind(this);
    }

    if (this._type == "group") {
      for (const [token, child] of Object.entries(this._children)) {
        func(child, token);
      }
      return;
    }
    if (this._type == "list") {
      this._children.forEach((child, index) => {
        func(child, index);
      });
      return;
    }
    throw new TypeError(`Cannot call forEachChild on entity "${this._path.toString()}": not a group or list`);
  }


  // Attaches all events to DOM element if possible
  _initEventListeners() {
    if (this._domEl) {
      for (const [event, handler] of Object.entries(this.events)) {
        if (typeof handler != "function") {
          throw new InitError(`${event} event handler must be a function`);
        }
        if (isArrowFunction(handler)) {
          throw new InitError(`${event} event handler cannot be an arrow function`);
        }
        this._domEl.addEventListener(event, handler.bind(this));
      }
    }
  }


  // Recursively updates paths for self and all descendants;
  // For use internally and in other core classes
  _updateHierarchy() {
    if (this._parent) {
      this._path = EntityPath.join(this._parent._path, this._token);
    }

    if (this._children) {
      this.forEachChild((c) => {
        c._updateHierarchy();
      });
    }
  }
}