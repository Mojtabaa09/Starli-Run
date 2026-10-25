# Starli Run: Game Details (for the team)

Plain HTML5 Canvas game. No engine, no build step, no dependencies.
Run it by opening `index.html`, or through a local server / GitHub Pages.

## Project structure

| File | What it holds |
|---|---|
| `index.html` | Page layout: canvas, intro screen, overlay (menu / game over), sound button |
| `css/style.css` | All styling (colors are CSS variables at the top: `--bg`, `--fg`, `--gold`, `--cy`) |
| `js/game.js` | All game logic, drawing and procedural audio |
| `images/` | The three image assets (see below) |

## Assets

| File | Size (px) | Used for |
|---|---|---|
| `images/starli-character.png` | 211 x 360 | Player character (Starli). Drawn at height 138 and mirrored |
| `images/soneium-logo.png` | 160 x 160 | Normal collectible, portal center, score icon, intro logo |
| `images/rainbow-logo.png` | 160 x 160 | Bonus collectible (rainbow), progress bar end icon |

To replace an asset, keep the same file name and size (transparent PNG). The file names are listed in `SRC` at the top of `js/game.js`.

## Game basics

- Canvas size is fixed at **800 x 450** (`W`, `H`) and scales to the screen at 16:9.
- Three lanes at y = 140 / 250 / 360 (`LY`). The player stays at x = 150 (`PXX`). The portal is at x = 705, y = 225 (`PTX`, `PTY`).
- Controls: tap top/bottom half of the screen, or ArrowUp / ArrowDown (W / S). In the menu: keys 1, 2, 3 choose the level, Enter or Space starts.
- Collect logos until the goal; red shards end the run.
- A "safe lane" is generated for every row, so there is always a reachable gap.
- Best score and unlocked portal are saved in `localStorage` (`starliBest`, `starliPortal`, `starliLvl`, `starliMute`).

## Difficulty settings (`LV` in `js/game.js`)

| Field | Meaning |
|---|---|
| `goal` | Logos needed to win |
| `base`, `k`, `cap` | Speed = `base + coins * k`, capped at `cap` |
| `gap`, `gk`, `gmin`, `gm` | Distance between rows. Shrinks by `gk` per coin, never below `gmin` or `speed * gm` |
| `opB`, `opK`, `opM` | Chance of a shard in a non-safe lane: starts at `opB`, grows by `opK` per coin, max `opM` |
| `bonus` | Chance of an extra logo in a non-safe lane that has no shard |
| `sway` | Coins collected before logos start swaying up and down |
| `blink` | Coins collected before logos start blinking |

| Level | Goal | Start speed | Max speed |
|---|---|---|---|
| Easy | 60 | 3.4 | 8 |
| Medium | 70 | 4.2 | 9.5 |
| Hard | 80 | 5 | 11 |

## Code map (`js/game.js`)

| Function | Role |
|---|---|
| `tone`, `noise`, `audioInit`, `playStep`, `mus` | Procedural music (Web Audio, no audio files) |
| `sfxCoin`, `sfxHit`, `sfxWin` | Sound effects |
| `goMenu`, `setLevel`, `show`, `menu`, `start`, `over`, `win` | Game states and overlay text |
| `steer` | Lane change |
| `spawn` | Creates a row of logos and shards |
| `update` | Movement, collisions, scoring, particles |
| `coin`, `shard`, `hero`, `flame`, `blob`, `portal`, `rr` | Drawing helpers |
| `draw`, `loop` | Frame rendering and main loop |

Game states (`st`): `menu`, `play`, `dying`, `over`, `win`.

## Texts to review

The intro, menu and end screen texts are in `index.html` (intro) and in `show(...)` calls and `LV[].desc` in `js/game.js`.
