import { Entity } from "./entity.js";
import { EntityPath } from "./entity-path.js";

export class EntUI {
  constructor(options = {}) {
    this.entities = this.ents = {};
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


    let ent = this.ents[tokens[0]];
    if (!ent) {
      throw new Error(`UI has no entity ${tokens[0]}`);
    }

    for (let token of tokens.slice(1)) {
      if (!ent.children) {
        throw new Error(`Entity ${ent.path.toString()} has no children`);
      }

      // Check for mismatching token types
      if (ent.type == "group" && typeof token != "string") {
        throw new TypeError(`Invalid token: accessing Entities of group ${ent.path.toString()} requires a string; ${token} provided instead`);
      }
      if (ent.type == "list" && typeof token != "number") {
        throw new TypeError(`Invalid token: accessing Entities of list ${ent.path.toString()} requires a number; ${token} provided instead`);
      }

      ent = ent.children[token];
      if (!ent) {
        throw new Error(`Entity ${ent.path.toString()} has no child ${token}`);
      }
    }

    return ent;
  }

  addEntity(entity, path) {
    if (typeof path == "string") {
      path = new EntityPath(path);
    }

    entity.ui = this;

    if (entity.type == "group") {
    }
  }

  // Recursive function that connects entity and all children, grandchildren, etc. to the UI
  // Only initially called on child entities (not top-level)
  connectEntity(entity, path) {

  }

  static createEntity(config) {
    return new Entity(config);
  }
}
