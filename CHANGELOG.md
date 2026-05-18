# Changelog

All notable changes to Drive Core are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.2.1] - 2026-05-17

### Changed
- Refactored WeaponTab and UpgradeTab into focused submodules (~80–200 lines each) under `weapon/` and `upgrade/` subdirectories
- Extracted all business logic (filtering, validation, cost calculations, data derivations) from components into co-located `*Utils.ts` and `*Rules.ts` files for isolation and testability
- Eliminated duplicated swap-attribute state machine and clone helpers shared across mecha upgrade components
- Consolidated pilot-side logic into `lib/skillRules.ts`, `lib/traitRules.ts`, `lib/genrePowerRules.ts`, and `lib/pilotClones.ts`
- All components and helpers now use arrow functions consistently

## [0.2.0] - 2026-05-10

### Added
- **Viewer** — import and browse player pilot and mecha builds separately from your personal collection; collapsible sidebar with inline sheet display; import via file or clipboard paste (auto-detects pilot vs. mecha)
- **Custom weapon builder** — point-buy system for Melee and Shooting weapons; select abilities and drawbacks within a WP budget; Beam boost cost auto-calculated; Custom badge on built weapons
- Rename weapons and upgrades from their template names after adding to a build; original template name shown in muted text
- Conditional Advantage condition text field on custom weapons
- Forewarning disclaimer in the custom weapon builder
- Changelog page

### Changed
- Mecha and pilot builder headers no longer show a visible scrollbar
- Tab content has added right padding to give breathing room from the scrollbar
- Selected weapon and upgrade cards have increased internal padding and spacing

### Fixed
- Sheet scroll area now has right padding so the scrollbar does not clip cards

## [0.1.0] - 2026-05-01

### Added
- Initial release: pilot builder and mecha builder as an installable PWA
- Pilot builder — attributes, skills, traits, genre themes, and genre powers with alternative slot support
- Mecha builder — attributes, weapons (template and custom), and upgrades (internal, external, separate)
- Pilot and mecha sheet views for play reference
- Import and export builds as JSON (download or clipboard)
- Light and dark theme toggle
- About page
