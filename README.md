# Play Simon

Double-click **Start Simon.cmd**, then open http://localhost:4173/ in your browser. Keep the launcher window open while playing online. Node.js is required (already installed on this computer).

Wait for **Ready to play offline** at the bottom of the game before disconnecting. The game can then reopen at the same address without a network connection, even after the launcher stops. Scores and settings belong to that browser and device; clearing website data removes them.

Use **Install game** when your browser offers it, or its **Install app / Add to Home Screen** menu. For phone installation, these files must be hosted on an HTTPS website. This computer's localhost address is only accessible on this computer. On iPhone/iPad, visit the hosted game in Safari and use Share → Add to Home Screen.

Opening index.html directly still works for regular play, but cannot register offline support or install the app.

When publishing updates, increment the cache version in sw.js. Updates become active once all older game windows are closed and reopened, preserving an in-progress game.
