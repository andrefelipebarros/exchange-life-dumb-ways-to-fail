# Exchange Life: Dumb Ways to Fail

A fast-paced browser microgame project inspired by chaotic exchange-student situations.  
The current prototype includes the first minigame: entering the correct building password before the timer runs out.

## Current status

This is a frontend-only prototype built with:

- HTML
- CSS
- JavaScript
- LocalStorage for character and leaderboard data

No game engine is required.

## Gameplay loop

1. Main menu.
2. Command screen.
3. Password minigame.
4. Result screen.
5. Life lost screen when the player fails.
6. Next minigame.
7. Game over when all lives are lost.

Only one minigame exists for now, so the same one repeats until new minigames are added.

## Current minigame

### Password Box

The player must enter the correct password:

```text
0616B
```

Success:

- green light turns on;
- success result screen appears;
- the game goes to the next minigame.

Failure:

- red light turns on;
- fail result screen appears;
- the player loses one life;
- the game goes to the next minigame or game over.

## Features

- Full English interface.
- Minimalist password minigame.
- Pink top timer bar.
- Fullscreen result video support.
- Audio settings modal.
- YouTube button placeholder.
- Character creator.
- Local leaderboard.
- Landscape orientation warning for mobile.

## How to run

Open `index.html` directly in the browser.

Recommended local server:

```bash
python3 -m http.server 5500
```

Then open:

```text
http://localhost:5500
```

## How to test on mobile

Keep your computer and phone on the same Wi-Fi network.

Run:

```bash
python3 -m http.server 5500 --bind 0.0.0.0
```

Find your computer IP address and open this on your phone:

```text
http://YOUR-PC-IP:5500
```

Example:

```text
http://192.168.0.20:5500
```

## Result videos

The result screen is already prepared for fullscreen videos.

In `src/game.js`, edit:

```js
const RESULT_VIDEOS = {
  success: "",
  fail: ""
};
```

Example:

```js
const RESULT_VIDEOS = {
  success: "assets/videos/success.mp4",
  fail: "assets/videos/fail.mp4"
};
```

Create this folder:

```text
assets/videos/
```

Then add your videos there.

The videos use:

```css
object-fit: cover;
```

This makes the video fill the whole screen. Some edges may be cropped if the video ratio is different from the screen.

## YouTube video button

In `src/game.js`, edit:

```js
const YOUTUBE_GAME_URL = "";
```

Example:

```js
const YOUTUBE_GAME_URL = "https://www.youtube.com/watch?v=YOUR_VIDEO_ID";
```

## Character creator and leaderboard

The current leaderboard uses `localStorage`.

That means:

- it works without a backend;
- scores stay saved only in the current browser/device;
- it is good for prototyping;
- it is not a real school-wide leaderboard yet.

For a real leaderboard shared by students, the future architecture should be:

```text
Player creates character
↓
Player plays the game
↓
Game sends name, class, avatar, and score to an API
↓
API saves the score in a database
↓
Leaderboard loads the best scores from the API
```

Possible backend options:

- Firebase
- Supabase
- Node.js + Express
- Spring Boot + PostgreSQL

## Suggested repository name

```text
exchange-life-dumb-ways-to-fail
```

Alternative names:

```text
exchange-life-web-game
exchange-life-minigames
dumb-ways-to-fail-web
```

## Suggested GitHub description

```text
A browser-based microgame project about funny exchange-student challenges, built with HTML, CSS, and JavaScript.
```

## Suggested Git workflow

```bash
git init
git add .
git commit -m "Initial Exchange Life frontend prototype"
git branch -M main
git remote add origin https://github.com/YOUR-USER/exchange-life-dumb-ways-to-fail.git
git push -u origin main
```

## Recommended repository structure

```text
exchange-life-dumb-ways-to-fail/
├── assets/
│   ├── images/
│   │   └── menu-escola.png
│   └── videos/
│       ├── success.mp4
│       └── fail.mp4
├── src/
│   ├── game.js
│   └── styles.css
├── index.html
└── README.md
```

## Next steps

- Add the second minigame.
- Replace result placeholders with real videos.
- Add background music.
- Add character sprites to the menu.
- Add a real backend leaderboard.
- Deploy the game with GitHub Pages.


## Mobile fix

This version includes a specific mobile landscape correction.

What was changed:

- the game now uses `100dvh` to respect the real mobile browser viewport;
- the password panel becomes smaller on landscape phones;
- keypad buttons reduce their height when the browser address bar is visible;
- safe-area padding was added;
- a fullscreen button was added to the menu;
- a web manifest was added with `display: fullscreen` and `orientation: landscape`.

### Best mobile test

On Android/Chrome:

1. Open the GitHub Pages link.
2. Tap the fullscreen button `⛶` in the menu.
3. If the browser blocks fullscreen, tap Chrome menu → **Add to Home screen**.
4. Open the game from the home screen.

This removes most of the address bar problem.


## Mobile fit v2

This version changes the password minigame sizing strategy.

Instead of making the keypad panel primarily based on screen width, it now fits based on the available screen height. This prevents the bottom row of the keypad from being cut off when the phone is in landscape mode and the browser address bar is visible.

Main CSS idea:

```css
.keypad-panel {
  --panel-h: min(92dvh, 430px);
  --panel-w: min(86vw, calc(var(--panel-h) * .82));
  height: var(--panel-h);
  width: var(--panel-w);
}
```


## Game Over lobby button

The Game Over screen now has two options:

- `RESTART`: starts a new run immediately.
- `LOBBY`: returns to the main menu without starting the game again.


## Fix: password input not advancing

A JavaScript error was stopping the keypad click handler from being registered.

Cause:

```text
game.js was trying to add a click event to fullscreenButton,
but the button was missing from index.html.
```

Fix applied:

- added the missing fullscreen button to the menu;
- made optional menu button event listeners safer with optional chaining;
- preserved the password flow: entering `0616B` now advances to the success result screen again.
