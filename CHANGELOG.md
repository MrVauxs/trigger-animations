# 0.0.4
- (Nodes) Added "Random List" query node.
- (Triggers) Added Pathfinder 2e triggers:
  - Action Posted
  - Check Roll
  - Damage Taken
  - Healing Received
  - Negated Damage
  - Persistent Damage Taken
- (Nodes) Moved "tieTo" from the Advanced effect node to the Persist effect node.
- (Backend) `prepareTriggers` now runs across all connected clients.
- (Backend) Added a live-update plugin so created triggers are exported into the repo during development.

# 0.0.3
- Moved database to Journal Entries. Now everyone can edit the animations.
- (Animations) Added "Spell Effect: Shield."
- (Triggers) Added "Effect."
- (Backend) Added scripts for managing triggers in the repo.

# 0.0.2
- Implemented region support
- Changed locations to any
- Fixed the app not registering
- Add more built in triggers

# 0.0.1
- Initial release
