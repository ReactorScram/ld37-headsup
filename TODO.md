# What's That Word TODO

## Performance

PIXI is pretty slow. It hangs Firefox on my phone several times during
a one-minute round, and on the Pandora it can scarcely manage 1 FPS with
loads of hangs. The animations basically don't play.

Here are my options, from least-drastic to most-drastic

- Have a low-animation mode that doesn't move things so often
- Ditch PIXI for a simpler canvas renderer that has fewer animations
  and better CPU rendering performance
- Just use HTML / CSS buttons and maybe some WebM or GIF animations
  in place of the fancy transforms
- Port to LOVE2D so the Pandora can harness WebGL
- Port to C++

## Local version

It actually works fine locally! Firefox converts the XMLHttpRequests into
local file access with file:///.

So I should make a downloadable zip for that.

Submitting the analytics fails, so I should handle that. Due to CORS
it is probably impossible to make a local file send data to my website.

