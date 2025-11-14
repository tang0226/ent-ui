import { EntityPath } from "./entity-path.js";
import {
  isArrowFunction,
  isValidParentOperator,
  isValidProp,
  isValidIndex,
} from "./utils/validation.js";

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
    this._state = null;
    if (config.state !== null && config.state !== undefined) {
      this._state = config.state;
    }

    // Local state
    this.lState = null;
    if (config.lState !== null && config.lState !== undefined) {
      this.lState = config.lState;
    }

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


    // Event listeners
    this._events = config.events || {};
    if (this._domEl) {
      if (typeof this._events !== "object") {
        throw new InitError("events property is not an object");
      }

      if (Object.keys(this._events).length) {
        this._initEventListeners();
      }
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
    return new EntityPath(this._path.tokens);
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

  get children() {
    // Deep copy to avoid direct rewriting of _children or its attributes
    if (this._type == "group") return {...this._children};
    if (this._type == "list") return [...this._children];
    return null;
  }

  get domEl() {
    return this._domEl;
  }

  get events() {
    return this._events;
  }

  get ui() {
    return this._ui;
  }

  // Associates the Entity with a DOM element; should only be run once, and only if no DOM element was passed at initialization
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

  addEventListener(event, handler) {
    if (!this._domEl) {
      throw new Error(`Cannot add event listener to Entity "${this._path.toString()}": Entity has no element`);
    }
    if (typeof handler != "function") {
      throw new Error(`Cannot add event listener to Entity "${this._path.toString()}": event handler must be a function`);
    }
    if (isArrowFunction(handler)) {
      throw new Error(`Cannot add event listener to Entity "${this._path.toString()}": event handler cannot be an arrow function`);
    }
    const bound = handler.bind(this);
    this._domEl.addEventListener(event, bound);
    
    if (!this._events[event]) {
      this._events[event] = [];
    }
    this._events[event].push({handler, bound});
  }

  // Removes an event listener from the Entity's domEl
  // (accepts event type and original unbound handler)
  removeEventListener(event, handler) {
    if (!this._domEl) {
      throw new Error(`Cannot remove event listener from Entity "${this._path.toString()}": Entity has no element`);
    }

    const listeners = this._events[event];
    if (listeners === undefined) {
      throw new Error(`Cannot remove event listener from Entity "${this._path.toString()}": no event listener found for "${event}" event`);
    }

    const i = listeners.findIndex(l => l.handler === handler);
    if (i === -1) {
      throw new Error(`Cannot remove event listener from Entity "${this._path.toString()}": handler doesn't match any currently present`);
    }
    const listener = listeners.splice(i, 1);
    this._domEl.removeEventListener(event, listener[0].bound);
  }

  removeAllEventListeners() {
    if (!this._domEl) {
      throw new Error(`Cannot remove event listeners from Entity "${this._path.toString()}": Entity has no element`);
    }
    for (const [event, handlers] of Object.entries(this._events)) {
      for (const handler of handlers) {
        this._domEl.removeEventListener(event, handler.bound);
      }
      delete this._events[event];
    }
  }

  // entObj can be either a config object or an Entity instance
  addEntity(entObj, token, { _updateHierarchy = true, _handleUiUpdates = true } = {}) {
    if (this._type == "leaf") {
      throw new TypeError("Cannot add Entity to leaf Entity");
    }

    if (token === undefined || token === null) {
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

    // connect the new Entity to self's UI object, if applicable
    if (this._ui && _handleUiUpdates) {
      this._ui._connectEntity(entity);
    }

    return entity;
  }

  removeEntity(token, { _handleUiUpdates = true } = {}) {
    if (this._type === "leaf") {
      throw new Error(`Cannot remove Entity from leaf Entity "${this.path.toString()}"`);
    }

    // Entity to remove
    let ent;

    // Remove child Entity from hierarchy
    if (this._type === "list") {
      if (!isValidIndex(token)) {
        throw new Error(`Cannot remove Entity from list ${this.path.toString()}: token "${token}" is not a valid index`);
      }
      if (token >= this._children.length) {
        throw new Error(`Cannot remove Entity from list ${this.path.toString()}: index ${token} is out of range`);
      }

      ent = this._children.splice(token, 1)[0];
      // Update tokens for subsequent children
      for (let i = token; i < this._children.length; i++) {
        this._children[i]._token = i;
        this._children[i]._setToken(i);
      }
    }

    if (this._type === "group") {
      if (!isValidProp(token)) {
        throw new Error(`Cannot remove Entity from group "${this.path.toString()}": token "${token}" is not a valid property name`);
      }

      ent = this._children[token];
      if (ent === undefined) {
        throw new Error(`Cannot remove Entity from group "${this.path.toString()}": no child found with token ${token}`);
      }

      delete this._children[token];
    }

    // Remove Entity's event listeners
    if (ent._domEl) {
      ent.removeAllEventListeners();
    }

    // Disconnect Entity from the UI
    if (ent._ui) {
      if (_handleUiUpdates) {
        ent._ui._disconnectEntity(ent);
      }
    }
    else {
      ent._setAsHierarchyRoot();
    }

    return ent;
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
      for (const [event, handler] of Object.entries(this._events)) {
        this._events[event] = null;
        this.addEventListener(event, handler);
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

  // Sets self as the root of a (new) hierarchy tree. Used to reset removed Entities
  _setAsHierarchyRoot() {
    this._parent = null;
    this._token = null;
    this._path = new EntityPath([]);
    this._updateHierarchy();
  }

  _setToken(token, index = null) {
    if (index === null) {
      this._token = token;
      index = this._path.tokens.length - 1;
    }

    this._path.tokens[index] = token;

    if (this._children) {
      this.forEachChild((c) => {
        c._setToken(token, index);
      });
    }
  }
}