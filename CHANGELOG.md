# 0.5.3
- Added a "Enable Required Triggers" button to the welcome message. Automatically opens the Trigger Engine sheet, enables the triggers from the module, and saves.

# 0.5.2
- (Nodes) Changed Sound Location node toLocation and moveTowards to use Position entries instead of Target.
- (Nodes) Added a "Position Name" output to the Crosshair node, allowing you to connect it to other nodes without having to create a separate text variable.
- (Nodes) Fixed Crosshair node not adding a named location to the trigger context, causing erroneous warnings about a request name not being added.

# 0.5.1
- Fixed ready hook being triggered in the wrong place, effectively doing nothing.

# 0.5.0
- Improved the template tool styling and by actually having more than one template to choose from.
- Template tool now opens the blueprint menu and creates a new trigger without saving.
- Added a "ready" property to the API which becomes true once Trigger Animations is registered. You can listen for it with a `Hooks.once("triggerAnimations.ready", (api) => {})` hook.
- Added a "templates" and "registerTemplate" function to the API, allowing modules to register their own templates.

# 0.4.0
- Added a basic animation template tool for items. Opening an item sheet will show a new button (disable-able in settings) to create a new Trigger Animations trigger using a suggested name.

# 0.3.1
- Removed accidental duplicate Attack Roll trigger.

# 0.3.0
- (Triggers) Changed the default name definition. Now every trigger has its own unique name, including Attack Roll (`attack:slug`), Template Placed (`template:slug`), Effect / Condition Granted (`effect:slug`/`condition:slug`), Action Posted (`action:slug`).
- (Animations) Adjusted the names per above changes.

# 0.2.1
- Added guards against infinite loops due to the Execute Animation node.

# 0.2.0
- (Nodes) Added "Module Enabled" and "Execute Animation" nodes.
- (Nodes) Improved Sequencer preset selection by making it a dropdown of all registered presets, if any.

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
