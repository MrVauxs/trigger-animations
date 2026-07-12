# ![Trigger Animations logo by HongBo](https://github.com/MrVauxs/trigger-animations/blob/master/assets/TA_Border.webp?raw=true)

[![GitHub all releases](https://img.shields.io/github/downloads/MrVauxs/trigger-animations/total)](https://github.com/MrVauxs/trigger-animations/releases)
[![gitlocalized ](https://gitlocalize.com/repo/10817/whole_project/badge.svg)](https://gitlocalize.com/repo/10817?utm_source=badge)
[![Wiki](https://img.shields.io/badge/Wiki-Read%20the%20Documentation!-ffffff?logo=astro&style=flat&color=52b922&logoColor=FF5D01)](https://wiki.mrvauxs.net/)
[![Logo By Hongbo](https://img.shields.io/badge/Who%20made%20the-Logo%3F-e4682a?style=flat&logo=svg)](http://hongbo-portfolio.free.nf/)

Trigger Engine but for animations.

> [!important]
> If you want a library of premade animations, see [pf2e-trigger-animations-collection](https://github.com/ChasarooniZ/pf2e-trigger-animations-collection)!

## Installation

### Module

[Manifest URL](https://raw.githubusercontent.com/MrVauxs/trigger-animations/latest/releases/module.json), [Zip File Download](https://raw.githubusercontent.com/MrVauxs/trigger-animations/latest/releases/module.zip)

### Repository

```
cd trigger-animations && bun install
```

## Scripts

| Script    | Description                                       |
| --------- | ------------------------------------------------- |
| `dev`     | Start the development server with HMR             |
| `build`   | Build the module for production                   |
| `symlink` | Symlink the module to your Foundry data directory |
| `extract` | Extract Foundry compendium packs                  |

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
	  	}
	}
}
```

## Included PF2e Triggers

The module includes multiple triggers for both Trigger Animations and Trigger Engine to smoothen development. There are also some notably missing triggers that have been left for the reasons described below.

The naming convention of each event describes what animation names the event sends out. As with every trigger, any and all of them can be disabled in favor of your own.

Reasoning behind not including a trigger is most often due to the trigger being too specific for broader purposes or requiring too many combinations of parameters to be wholly encompassing.

| Included | Event               | Naming Convention / Reasoning                          |
| -------- | ------------------- | ------------------------------------------------------ |
| ✓        | Action Sent to Chat | `item-slug`                                            |
| ✓        | Attack Rolled       | `item-slug, weapon group, base-item`                   |
| ✗        | Aura Entered        | _Too Specific_                                         |
| ✗        | Aura Left           | _Too Specific_                                         |
| ✓        | Check Rolled        | `item-slug`                                            |
| ✗        | Combatant Created   | _Too Specific_                                         |
| ✗        | Combatant Removed   | _Too Specific_                                         |
| ✓        | Damage Taken        | `(damage\|healing\|persistent\|negated):item-slug`     |
| ✗        | Execute Event       | _**Not Applicable**_                                   |
| !        | Item Added to Actor | `item-slug` (_only applies to Effects and Conditions_) |
| ✗        | On Hook Called      | _**Not Applicable**_                                   |
| ✗        | Region Triggered    | _Too Specific_                                         |
| ✗        | Test Event          | _**Not Applicable**_                                   |
| ✗        | Token Created       | _Too Specific_                                         |
| ✗        | Token Moved         | _Too Specific_                                         |
| ✗        | Token Removed       | _Too Specific_                                         |
| ✗        | Turn End            | _Too Specific_                                         |
| ✗        | Turn Start          | _Too Specific_                                         |
