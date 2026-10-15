# focus-mode-switcher

Stream Deck plugin that shows and switches macOS Focus modes.

A **Focus Mode** key is bound to one Focus. It shows that Focus's icon and colour, bright while the Focus is on and faded while it's off, and pressing it turns the Focus on.

## Setup

1. **Give Stream Deck Full Disk Access** — System Settings → Privacy & Security → Full Disk Access → add Elgato Stream Deck, then quit and reopen it.
   macOS keeps Focus state in `~/Library/DoNotDisturb/DB`, which only apps with Full Disk Access can read.
2. **Drag a Focus Mode key onto your Stream Deck and choose its Focus.**
3. **Click Install shortcut** in the key's settings, and add **Focus Mode Switcher** when Shortcuts asks.
   macOS has no API for turning a Focus on; the key runs this shortcut instead.

## What the key shows

| Key | Meaning |
| --- | --- |
| The Focus's icon, bright | That Focus is on |
| The Focus's icon, faded | That Focus is off |
| Red lock | Stream Deck doesn't have Full Disk Access |
| Yellow warning | macOS stores Focus state in a format this plugin doesn't know yet |

A press shows ⚠ when the key has no Focus chosen, when the Focus Mode Switcher shortcut is missing, or when two Focuses share the key's Focus's name — Shortcuts picks a Focus by name, so rename one.

## Development

```sh
npm ci
npm run build
npx sd link com.akeboshiwind.focus-mode-switcher.sdPlugin   # once, from the checkout you develop in
npm run watch                                                # rebuild and restart the plugin on change
```

Reading Focus state is adapted from Raycast's [focus modes](https://github.com/raycast/extensions/tree/main/extensions/focus-modes) extension (MIT).
