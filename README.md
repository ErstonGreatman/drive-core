# Drive Core

A free, community-built character and mecha builder for [Battle Century G Remastered](https://gimmicklabs.itch.io/bcgremastered). No accounts, no servers — everything lives in your browser.

Inspired by [Fultimator](https://github.com/fultimator/fultimator), the community builder for Fabula Ultima.

## Features

- **Pilot Builder** — attributes, skills, traits, genre powers, and themes
- **Mecha Builder** — attributes, upgrades (including Expansion Pack, Invincible Super Combination, and other special upgrades), and weapons
- Builds persist locally in your browser via localStorage
- Import / export builds as JSON for sharing
- Light, dark, and system theme support

## Stack

- [SolidJS](https://solidjs.com) — reactive UI
- [TypeScript](https://typescriptlang.org) — strict mode throughout
- [Tailwind CSS v4](https://tailwindcss.com) — utility-first styling
- [Kobalte](https://kobalte.dev) — accessible headless UI primitives
- [Vite](https://vitejs.dev) — build tooling
- [Bun](https://bun.sh) — runtime and package manager

## Getting Started

```bash
bun install
bun dev
```

Other commands:

```bash
bun build       # production build
bun preview     # preview production build
bun test        # run tests
bun typecheck   # tsc --noEmit
```

## Contributing

Pull requests are welcome. For larger changes, open an issue first so we can talk through the approach.

A few things to keep in mind:

- All PRs must pass `bun typecheck` (TypeScript strict mode, no `any` without justification)
- Game mechanics changes need a rulebook page reference in the PR description
- No prop destructuring — it breaks SolidJS reactivity
- `bun` only, never `npm`, `pnpm`, or `yarn`

## Game Content Attribution

Rules text, game data, and other content from Battle Century G Remastered used in this project belongs to its author and is used here under its original license:

> Battle Century G is licensed under the [Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License](https://creativecommons.org/licenses/by-nc-nd/4.0/).
>
> © 2022 Juan Herrera. Some Rights Reserved.
>
> Rules Version 1.84

## License

Drive Core's source code is licensed under the [MIT License](./LICENSE).

Game content (rules text, descriptions, and data sourced from the BCG-R rulebook) is separately attributed above and remains under its original CC BY-NC-ND 4.0 license.
