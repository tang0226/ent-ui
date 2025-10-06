import { Entity } from "./entity.js";
import { EntityPath } from "./entity-path.js";

export class EntUI {
  constructor(options = {}) {
    this.entities = {};
    this.state = this.st = {};
    this.attributes = this.attrs = {};
    this.validators = this.valid = {};

    // Init with options here
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

    // Validate first token
    if (typeof tokens[0] != "string") {
      throw new TypeError("First path token must be a property name");
    }


    let entity = this.entities[tokens[0]];
    if (!entity) {
      throw new Error(`UI has no top-level entity "${tokens[0]}"`);
    }

    for (let token of tokens.slice(1)) {
      if (!entity.children) {
        throw new Error(`Entity "${entity.path.toString()}" has no children`);
      }

      // Check for mismatching token types
      if (entity.type == "group" && typeof token != "string") {
        throw new TypeError(`Invalid token: accessing Entities of group "${entity.path.toString()}" requires a string; {${token}} provided instead`);
      }
      if (entity.type == "list" && typeof token != "number") {
        throw new TypeError(`Invalid token: accessing Entities of list "${entity.path.toString()}" requires a number; {${token}} provided instead`);
      }

      let nextEntity = entity.children[token];
      if (!nextEntity) {
        throw new Error(`Entity "${entity.path.toString()}" has no child {${token}}`);
      }
      entity = nextEntity;
    }

    return entity;
  }

  // Can add a top-level Entity to the UI or a sub-Entity to an existing Entity, depending on `path`
  // entObj can be either a config object or an Entity instance
  addEntity(entObj, path) {
    if (!entObj) throw new Error("Cannot add Entity to UI: Entity instance / config object not provided");
    if (!path) throw new Error("Cannot add Entity to UI: no path provided");

    // Path validation; KEEP IN FRONT OF `entObj` VALIDATION
    if (!(path instanceof EntityPath)) {
      if (typeof path == "string") {
        path = new EntityPath(path);
      }
      else {
        throw new TypeError(`Cannot add Entity to UI: path {${path}} not an EntityPath or string`);
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

      this.linkEntity(entity);

      // Add to top-level entities object
      this.entities[token] = entity;
    }
    else {
      this.linkEntity(entity);

      // Add entity to some descendant Entity (determined by path)
      this.getEntity(path).addEntity(entity);
    }
  }

  // Recursively adds the `ui` prop to an entity and all its descendants
  linkEntity(entity) {
    entity.ui = this;
    if (entity.children) {
      entity.forEachChild((c) => {
        this.linkEntity(c);
      });
    }
  }

  static createEntity(config) {
    return new Entity(config);
  }
}
