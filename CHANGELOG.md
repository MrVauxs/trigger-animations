# 0.9.2
- (Nodes) Added an experimental "Token Magic" node, adding and removing Token Magic FX filters on tokens and regions.
- Fixed many important logs being hidden behind a debug flag. 

# 0.9.1
- (Nodes) Made "Exit if Global" on sound location nodes the default.

# 0.9.0
- Improved compatibility with A-A, requires A-A 7.0.22.
- (Nodes) Added a new input to Location nodes, "Exit if Empty," on by default. It makes the nodes disable an animation if they are not provided a valid (truthy) location.
- (Nodes) All nodes now have their state stated in parenthesis, e.g. "Location (attachTo)"

# 0.8.6
- (Templates) Updated the default priority of templated triggers to 10.
- (Nodes) Allowed negative numbers for Loop Delay inputs in Persistence nodes.

# 0.8.5
- (Triggers) Fix Attack Roll and Check Roll using any instead of string and boolean for "Outcome" and "Is Reroll" inputs respectively.

# 0.8.4
- (Nodes) Renamed Mass Loop outputs to "Looped Out" and "Ending Out."
- (Nodes) Fixed out connections not having tooltips.

# 0.8.3
- Added a "Minimum Triggers Access Role" setting. Players at or above the set role will be able to edit Trigger Animations triggers, below they won't.

# 0.8.2
- (Nodes) Added a "Matched Name" output to the Start Animation node, telling you which of the node's own names matched. Wildcards are returned as the wildcard than the thing they matched (`attack:*bow*` rather than `attack:longbow-fire`), and the first matched wildcard is listed.
- (Nodes) Reverted default "Hide Behind Walls" change in 0.8.0.

# 0.8.1
- Actually make the `CONFIG.debug.triggerAnimations` work.

# 0.8.0
- (Nodes) Added an "EZ Ranged" node. Takes a Source, Target, File, Item, Attach To and Outcome and outputs a ready to go projectile effect.
- (Templates) The Attack template now uses the EZ Ranged node.
- (Nodes) Added a Module File query node, allowing you to quickly get files between the two versions of JB2A, or two modules in general.
- (Nodes) Made "Hide Behind Walls" on by default in the Aim node.
- (Triggers) Added an UUID name variant for animating specific items (e.g. `attack:Actor.X91A5Exe4cnwaJ68.Item.9EKkgR05PZUQzM20`)
- (Triggers) Added a user target fallback to Action Posted and Check Roll triggers.
- Expanded suggested trigger names in template creator to include item UUIDs.
- Significantly improved the addition of trigger names in the template creator.

# 0.7.2
- Added an **Override Automated Animations** setting, on by default. When A-A is about to run for an item Trigger Animations also has a trigger for it will kill A-A's animation. Best effort though, until A-A implements PR#78 its not gonna be 100% accurate. Especially with Trigger Animation's Trove.
- Exposed `autoAnimations` utility functions in triggerAnimations.api. Most notably `triggerAnimations.api.autoAnimations.competes(item)`, for use in triggers, returning whether A-A would play for a given item.
- Expanded suggested trigger names in template creator to include weapon groups, effects, and conditions.

# 0.7.1
- Changed the default "no matches" trigger name in trigger generator to be `unknown-trigger:<item-slug>` instead of `<itemType>:<item-slug>`.

# 0.7.0
- Fixed typo in module.json preventing required modules from actually being required.
- Bumped minor version because previous version can actually break some nodes.

# 0.6.9
- (Nodes) Added {x,y} effect scale options.
- (Nodes) Moved Anchor inputs from two separate number inputs to a single Point input.

# 0.6.8
- Added CONFIG.debug["trigger-animations"] and CONFIG.debug.triggerAnimations handling.

# 0.6.7
- Made the module yell out that it requires Trigger Engine and Sequencer in an event they aren't enabled.
- (Nodes) Removed most of the enforced "steps" in number input fields. Only remaining are integers for repeats and zIndex, and 0.01 for percentages.
- (Triggers) Updated pf2e triggers to have a Trigger Animations tag and description.
- (Triggers) Fixed Check Roll returning the wrong targets. It now returns the targets of the person that the actor belongs to.

# 0.6.6
- (Nodes) Added section outputs to all Sequencer section nodes (i.e. all Effect nodes can now output their Effect entries).

# 0.6.5
- (Nodes) Added a second state to Mass Loop node, allowing to loop over a predefined number.
- Fixed typo in Execute Animation's sequence input. The node will create its own Sequence if not provided one.

# 0.6.4
- (Animations) Fixed Force Barrage animation having wrongly typed variables leading to errors.

# 0.6.3
- Fixed mustache inputs logging an invalid object when nothing is passed to it.

# 0.6.2
- (Nodes) Added a new "advanced" state to Effect and Sound File nodes. Advanced state changes the File input and Mustache input. File from a plain string to JSON, allowing to put JSON arrays in place for randomized effects. Mustache from JSON to any, allowing the user to pass a custom object created in another node, like Execute Script, so for example Sequencer can run its getters at each repetition.

# 0.6.1
- (Triggers) Updated Attack Roll and Template Placed triggers to include PC and NPC weapon groups and baseItems.

# 0.6.0
- (Nodes) Removed Crosshair section nodes and Pick Location node due to incompatibility with local animations and lack of use for the time being. These may come back when implementation of them becomes easier. For now, you can use Then Do or Execute Script nodes to do the same and more.
- (Animations) Added wildcard options (attack:\*bow\*) in example weapon animations as there may be occurences where all you have to rely on is a slug, e.g. attack:shortbow, which does not match attack:bow.
- Trigger Animation nodes now assume the userContext of the passed user input in Execute Animation.

# 0.5.5
- (Nodes) Added a user input to Execute Animation.
- Fixed various preset inputs not having a "none" option.

# 0.5.4
- (Nodes) Increase (decrease?) the "From" and "To" number inputs step for Animate Property node to `0.01`.
- Fixed various nodes breaking when passed undefined Positions.

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
