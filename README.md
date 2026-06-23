# trigger-animations
Trigger Engine but for animations

## Installation

### Module

[Manifest URL](https://raw.githubusercontent.com/MrVauxs/trigger-animations/latest/releases/module.json), [Zip File Download](https://raw.githubusercontent.com/MrVauxs/trigger-animations/latest/releases/module.zip)

### Repository

```
cd trigger-animations && bun install
```

## Scripts

| Script | Description |
|--------|-------------|
| `dev` | Start the development server with HMR |
| `build` | Build the module for production |
| `symlink` | Symlink the module to your Foundry data directory |
| `extract` | Extract Foundry compendium packs |

## Using the API

Other modules can consume `trigger-animations`'s typed API by installing it as a GitHub dependency:

```sh
npm install github:mrvauxs/trigger-animations
```

Then import the types either directly in the code or tsconfig.json:

```ts
# Import types directly
import "trigger-animations/types";

# Or add to tsconfig.json
{
  "compilerOptions": {
    "types": ["trigger-animations/types"]
  }
}
```

To call methods at runtime, read from the module's global:

```ts
const { runFromTrigger } = globalThis.triggerAnimations.api;
runFromTrigger();
```

To add triggers, you can use the [Trigger Engine's registerTriggers](https://github.com/reonZ/trigger-engine/wiki) method, or add the following flag to your module.json.

```json
{
  "flags": {
		  "trigger-animations": {
		  	"triggers": "modules/your-module/yourTriggersFile.json"
	  	},
  }
}
```

## Included PF2e Triggers

The module includes multiple triggers for both Trigger Animations and Trigger Engine to smoothen development. There are also some notably missing triggers that have been left for the reasons described below.

The naming convention of each event describes what animation names the event sends out. As with every trigger, any and all of them can be disabled in favor of your own.

Reasoning behind not including a trigger is most often due to the trigger being too specific for broader purposes or requiring too many combinations of parameters to be wholly encompassing.

| Included | Event | Naming Convention / Reasoning |
| ----------- | ----- | ----------------- |
| ✓ | Action Sent to Chat | `item-slug` |
| ✓ | Attack Rolled | `item-slug, weapon group, base-item` |
| ✗ | Aura Entered | *Too Specific* |
| ✗ | Aura Left | *Too Specific* |
| ✓ | Check Rolled | `item-slug` |
| ✗ | Combatant Created | *Too Specific* |
| ✗ | Combatant Removed | *Too Specific* |
| ✓ | Damage Taken | `<type of damage>:item-slug` |
| ✗ | Execute Event | ***Not Applicable*** |
| ! | Item Added to Actor | `item-slug` (*only applies to Effect items*) |
| ✗ | On Hook Called | ***Not Applicable*** |
| ✗ | Region Triggered | *Too Specific* |
| ✗ | Test Event | ***Not Applicable*** |
| ✗ | Token Created | *Too Specific* |
| ✗ | Token Moved | *Too Specific* |
| ✗ | Token Removed | *Too Specific* |
| ✗ | Turn End | *Too Specific* |
| ✗ | Turn Start | *Too Specific* |


