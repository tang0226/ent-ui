TODO:
* Add EntUI error throwing methods to DRY code
* Use ObjectPath.normalize() where possible (check EntUI)
* Add 
* Start writing docs
* Add Entity init tests
* Add rendering functions
* Figure out how to improve performance of ObjectPath (parsing, validation, etc.)
* Add EntUi.getState() and EntUi.setState()

Planning:
* There is only 1 authoritative state: it resides inside EntUI's _state prop.
* principles for state management:
  * Entities validate updates, only UI writes

  * Runtime flow:
    * User makes change in UI -> triggers event listener in Entity -> Entity validates the update -> if ok, requests asks UI to rewrite state
  * It's ok for public / Entity-level code to access an Entity's state object and read from it, but writing should not be allowed (enforce this with object freezing).
* Entities can have a pointer to their authoritative state in the _state property



