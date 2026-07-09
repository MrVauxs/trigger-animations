# 0.2.0
- (Nodes) Added "Module Enabled" node.

# 0.1.1
- Fixed Position inputs erroring on being undefined.

# 0.1.0
- Added "Position" entry that merges "Target", "Region", "Point", and "String" entries (attaching to a Token, Region, X/Y coordinates, and a named location respectively). Replaced "any" entries in inputs that related to positioning.
- Made "preload" option on Play Node true by default.
- Added descriptions to example triggers.
- Renamed weapon group example triggers.
- Added volume slider.

# 0.0.7
- Added an automatic update notice message in chat.
- Fixed `local` not working across clients.
- Bumped up minimum module version requirements.

# 0.0.6
- Moved node tags to aliases.
- (Triggers) Updated Effect Trigger to contain Conditions as well.
- (Nodes) Added "Get Quality" node.
- (Animations) Added "Get Quality" node to Breathe Fire example.

# 0.0.5
- Optimized hooks by caching trigger IDs and their names.
- Made local animations run for every individual user independent of each other.
- (Nodes) Added "Get Setting" query node.
- (Animations) Added Fireball.
- Removed vestigial "Path" input from Animation Event Node.

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
- Added more built in triggers

# 0.0.1
- Initial release
