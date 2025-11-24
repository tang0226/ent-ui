TODO:
* Start writing docs
* Add Entity init tests
* Add rendering functions
* Figure out how to improve performance of ObjectPath (parsing, validation, etc.)

Planning:
* principles for state management:
  * Entities validate updates, only UI writes
  * Runtime flow:
    * User makes change in UI -> triggers event listener in Entity -> Entity validates the update -> if ok, requests asks UI to rewrite state
