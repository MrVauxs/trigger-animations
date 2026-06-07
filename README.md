# trigger-animations
Trigger Engine but for animations

## Installation

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

## Resources

D&D5e Wiki: https://github.com/foundryvtt/dnd5e/wiki
D&D5e Specific Module Flags: https://github.com/foundryvtt/dnd5e/wiki/Module-Registration

## Using the API

Other modules can consume `trigger-animations`'s typed API by installing it as a GitHub dependency:

```sh
npm install github:YOUR_USERNAME/trigger-animations
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
const { doSomething } = globalThis.triggerAnimations.api;
doSomething();
```
