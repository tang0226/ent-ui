TODO:
* Allow EntUI initialization from config object
* Add option for rendering functions
* Removing Entities from Entities and EntUIs
  (insert state back into Entity, delete state from UI, then disassociate the Entity from the Entity or UI containing it and return the removed Entity)
* Deleting Entities
  (delete state object, completely remove Entity)
  * for both removing an deleting, same logic for Entity vs EntUI: EntUI checks if it is a single-token path. Otherwise, it does prep work with state and ui association before calling the parent Entity's remove / delete function
  * _embedEntityState to take state from EntUI and embed it back into an Entity and its descendants
