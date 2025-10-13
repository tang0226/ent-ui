import { EntityPath } from "./entity-path.js";
import { isArrowFunction } from "./utils/validation.js";

export class Entity {
  constructor(config = {}, { _parent = null, _token = null } = {}) {
    // Path properties
    this.path = new EntityPath();
    this.parent = _parent;
    this.token = _token;

    // Element
    this.domEl = config.domEl || null;
    if (
      this.domEl !== null && this.domEl !== undefined &&
      !(this.domEl instanceof Element)
    ) throw new TypeError("Cannot initialize Entity: domEl property is not a DOM element");

    // Attributes
    this.attrs = config.attrs || {};
    if (
      this.attrs !== null && this.attrs !== undefined &&
      typeof this.attrs !== "object"
    ) throw new TypeError("Cannot initialize Entity: attributes property is not an object");

    // Temp state
    this.state = config.state || {};

    // Local state
    this.lState = config.lState || {};

    // Validators
    const validators = config.validators;
    this.validators = {};
    if (validators) {
      if (typeof validators !== "object") {
        throw new TypeError("Cannot initialize Entity: validators property is not an object");
      }

      for (const [name, func] of Object.entries(validators)) {
        if (typeof func !== "function") {
          throw new TypeError(`Cannot initialize Entity: validator "${name}" is not a function`);
        }

        // Check if the function is an arrow (=>) function, which cannot be bound with
        // a specific `this` value
        if (isArrowFunction(func)) {
          throw new TypeError(`Cannot initialize Entity: validator "${name}" cannot be an arrow function`)
        }

        this.validators[name] = func.bind(this);
      }
    }

    // Utilities
    this.utils = {};
    if (config.utils) {
      if (typeof config.utils !== "object") {
        throw new TypeError("Cannot initialize Entity: utils property is not an object");
      }

      for (const [name, func] of Object.entries(config.utils)) {
        if (typeof func !== "function") {
          throw new TypeError(`Cannot initialize Entity: utility "${name}" is not a function`);
        }

        // Check if the function is an arrow (=>) function, which cannot be bound with
        // a specific `this` value
        if (isArrowFunction(func)) {
          throw new TypeError(`Cannot initialize Entity: utility "${name}" cannot be an arrow function`)
        }

        this.utils[name] = func.bind(this);
      }
    }

    // Event listeners
    const events = config.events || {};
    if (events && this.domEl) {
      if (typeof events !== "object") {
        throw new TypeError("Cannot initialize Entity: events property is not an object");
      }

      this.events = events;

      if (this.domEl) {
        this._initEventListeners();
      }
    }


    // Children
    const children = config.children;

    // Default to a bottom-level entity if no structure is defined
    this.type = "leaf";

    if (children && typeof children == "object") {
      // Determine Entity type and initialize the children prop
      if (Array.isArray(children)) {
        this.type = "list";
        this.children = [];
      }
      else {
        this.type = "group";
        this.children = {};
      }
    }


    // Add children
    if (this.type == "group") {
      for (const [key, ent] of Object.entries(children)) {
        this.addEntity(ent, key, { _updateHierarchy: false });
      }
    }

    if (this.type == "list") {
      children.forEach((ent, index) => {
        this.addEntity(ent, index, { _updateHierarchy: false });
      });
    }

    // Once entities have been added, check if this Entity is top-level.
    // If so, initialize its path and those of its descendants.
    if (!this.parent) {
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


  // Links the Entity to a DOM element; should only be run once, and only if no DOM element was passed at initialization
  setDomEl(domEl) {
    if (this.domEl) {
      throw new Error(`Cannot set DOM element of Entity "${this.path.toString()}": Entity already has a DOM element`);
    }
    if (!(domEl instanceof Element)) {
      throw new TypeError(`Cannot set DOM element of Entity "${this.path.toString()}": ${domEl} is not an Element`);
    }

    this.domEl = domEl;
    this._initEventListeners();
  }

  // entObj can be either a config object or an Entity instance
  addEntity(entObj, token, { _updateHierarchy = true } = {}) {
    if (this.type == "leaf") {
      throw new TypeError("Cannot add Entity to leaf Entity");
    }

    // Token validation
    if (this.type == "group") {
      if (typeof token != "string") {
        throw new TypeError("Token to add an Entity must be a string when adding to a group");
      }
      if (this.children[token]) {
        throw new ReferenceError(`Error adding child ${token} to group "${this.path.toString()}": already exists`);
      }
    }

    if (this.type == "list") {
      if (token === undefined) {
        token = this.children.length;
      }
      else {
        if (typeof token != "number") {
          throw new TypeError("Token to add an Entity must be an integer when adding to a list");
        }
      }
    }

    // Validation / initialization based on entity parameter type
    var entity;
    if (entObj instanceof Entity) {
      entity = entObj;
      if (entity.parent) {
        throw new Error(`Cannot add entity to ${this.type} "${this.path.toString()}": Entity already has a parent`);
      }

      // Set this Entity's parent and token props
      entity.parent = this;
      entity.token = token;
    }
    else {
      if (typeof entObj != "object") {
        throw new TypeError(`Cannot add Entity to ${this.type} "${this.path.toString()}": Entity to add is not an object or Entity`);
      }

      // If the entity is a config object, initialize it,
      // passing self and the new token to give context for initializing paths later
      entity = new Entity(entObj, { _parent: this, _token: token });
    }

    // Recursively update hierarchy if called for
    if (_updateHierarchy) {
      entity._updateHierarchy();
    }

    // Add the entity to the children array / object
    if (this.type == "group") {
      this.children[token] = entity;
    }
    if (this.type == "list") {
      this.children.splice(token, 0, entity);
    }

    return entity;
  }
  

  forEachChild(func) {
    if (this.type == "group") {
      for (const [token, child] of Object.entries(this.children)) {
        func(child, token);
      }
      return;
    }
    if (this.type == "list") {
      this.children.forEach((child, index) => {
        func(child, index);
      });
      return;
    }
    throw new TypeError(`Cannot call forEachChild on entity "${this.path.toString()}": not a group or list`);
  }


  // Attaches all events to DOM element if possible
  _initEventListeners() {
    if (this.domEl) {
      for (const [event, handler] of Object.entries(this.events)) {
        if (typeof handler != "function") {
          throw new Error(`Cannot initialize Entity "${this.path.toString()}": ${event} event handler must be a function`);
        }
        if (isArrowFunction(handler)) {
          throw new Error(`Cannot initialize Entity "${this.path.toString()}": ${event} event handler cannot be an arrow function`);
        }
        this.domEl.addEventListener(event, handler.bind(this));
      }
    }
  }


  // Recursively updates paths for self and all descendants;
  // For use internally and in other core classes
  _updateHierarchy() {
    if (this.parent) {
      this.path = EntityPath.join(this.parent.path, this.token);
    }

    if (this.children) {
      this.forEachChild((c) => {
        c._updateHierarchy();
      });
    }
  }
}