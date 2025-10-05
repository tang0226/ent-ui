import { EntityPath } from "./entity-path.js";

export class Entity {
  constructor(config = {}, { parent, token } = {}) {
    // Element
    this.domElement = config.domElement || config.domEl;

    // Attributes
    this.attributes = config.attributes || config.attrs || null;

    // Temp state
    this.state = config.state || config.st || null;

    // Local state
    this.lState = config.localState || config.lState || null;

    // Validators
    const valid = config.validators || config.valid;
    this.validators = {};
    if (valid) {
      for (const [name, func] of Object.entries(valid)) {
        this.validators[name] = func.bind(this);
      }
    }

    // Utilities
    this.utils = null;
    if (config.utils) {
      this.utils = {};
      for (const [name, func] of config.utils) {
        this.utils[name] = func.bind(this);
      }
    }

    // Event listeners
    if (config.events && this.domElement) {
      for (const [event, handler, options] of Object.entries(config.events)) {
        this.domElement.addEventListener(event, handler.bind(this), options);
      }
    }

    // Path properties
    this.path = new EntityPath();
    this.parent = parent;
    this.token = token;


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
    
    // If the Entity is a leaf, ensure it has a DOM element
    if (this.type == "leaf") {
      if (!this.domElement) {
        throw new Error("Leaf entity must have an associated DOM element");
      }
    }

    // Add children
    if (this.type == "group") {
      for (const [key, ent] of Object.entries(children)) {
        this.addEntity(ent, key, { updatePaths: false });
      }
    }

    if (this.type == "list") {
      children.forEach((ent, index) => {
        this.addEntity(ent, index, { updatePaths: false });
      });
    }

    // Once entities have been added, check if this Entity is top-level.
    // If so, initialize its path and those of its descendants.
    if (!this.parent) {
      this.updatePaths();
    }


    // Custom initialization
    if (config.init) {
      this.init.bind(this)();
    }
  }

  addEntity(entity, token, { updatePaths = true } = {}) {
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

    // Validate / branch based on entity parameter type
    if (entity instanceof Entity) {
      if (entity.parent) {
        throw new Error(`Cannot add entity to ${this.type} "${this.path.toString()}": Entity already has a parent`);
      }

      // Set this Entity's parent and token props
      entity.parent = this;
      entity.token = token;

      if (updatePaths) {
        entity.updatePaths();
      }
    }
    else {
      if (typeof entity != "object") {
        throw new TypeError(`Cannot add Entity to ${this.type} "${this.path.toString()}": Entity to add is not an object or Entity`);
      }

      // If the entity is a config object, initialize it,
      // passing self and the new token to give context for initializing paths later
      entity = new Entity(entity, {parent: this, token: token});
    }


    // Add the entity to the children array / object
    if (this.type == "group") {
      this.children[token] = entity;
    }
    if (this.type == "list") {
      this.children.splice(token, 0, entity);
    }
  }

  updatePaths() {
    if (this.parent) {
      this.path = EntityPath.join(this.parent.path, this.token);
      console.log(this.path.toString());
    }

    if (this.children) {
      this.forEachChild((c) => {
        c.updatePaths();
      });
    }
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
}