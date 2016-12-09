# ReactorScram Ludum Dare 37 - "Heads-Up"

My goal this LD is to clone the popular "Heads-Up" game for phones.

Heads-Up is charades on a phone. The screen shows a secret word or phrase. One or more players are "hint givers" who can see the screen and give hints to the "guesser". The "guesser" is the only player who cannot see the screen directly, and must deduce the secret phrase from the hints.

I am planning to write it in JavaScript with Pixi.JS for graphics and an
opt-in hook to send analytics data back to my server, which will be written in Go and write to a SQLite DB.

The whole license will be AGPLv3-licensed.

The official proprietary version has some novelty where it records video of the other players, but when I've played it nobody bothered to play the video back, so I am ignoring that feature for now.

