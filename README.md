# pixel zen rock garden

built this bcs i wanted to make smth that feels like a quiet morning in a japanese garden. but with a little bit of puzzle challenge. u place stones on the sand to catch falling sakura petals before the timer runs out. its got a big red moon, pixel mountains and a tiny glowing lantern.

## features

-- pixel art canvas: everything is drawn from scratch in js. the cherry blossom tree, the red moon, the sand ripples and the stone lantern are all just math and fillrect no images used.
-- procedural ambient music: used the web audio api to generate a japanese pentatonic scale on the fly. it plays random soft chimes over a low drone. no audio files needed.
-- stone placement: you get 10 stones. click anywhere on the sand to place one. petals that hit a stone give u points.
-- combo system: catch 3 petals in a row for 2x multipliet, 6 for 3x multiplier. if a petal touches the sand, u lose ur combo.
-- ranks: survive 60 seconds and get a rank based on your score. from novice to sage.

## how to play

open index.html file in ur browser and click begin.

## what i learned: n my mistakes

-- the upside down mountains: my mountain drawing function was making triangles that pointed down. the math was inverted. took me staring at the screen for 5 minutes to realize it.
-- duplicate html ids: i accidentally gave every hud element id=score. the game refused to start bcs js was tryn to update null elements. lesson learned: always check after u duplicated smth and also check the console.
-- audio clicks: starting a gain node at a random value and ramping it down causes a nasty popping sound. starting at 0 fisrt and ramping up fixed it.
-- pixel circles: drawing circles without ctx.arc means calculating math.sqrt for every row. feels like real math.
-- negative animation delays: whenn i had to delay the petals, i realized using negative values in css makes things look like they've already been falling efore the screen even looaded

overall its super chill to play. the music and the litttle stone thud sounds make it really satisfying when you get a combo going

