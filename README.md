# ciosai's demo for Sessions

# set up

1. install deno (or npm if you bother to modify the configs for it)
1. install dependencies
1. for deno specifically, `deno task build`, for npm run its respective vite build command
1. the final html (and the inlined js will be in `dist/index.html`)
1. optionally pack it into a proper submission with this command (linux) `zip -r dist/source.zip . -x ./dist/* -x "./.vite/*"; cp index.nfo dist/index.nfo; zip -r dist/ciosai-sessions2025-realtime-kau_hia_toh_chai_kau_ah.zip dist; rm dist/index.nfo dist/source.zip`

# technical info

For archival purpose I feel like this info is important enough, there are approximately 3 things that can affect how the demo plays

1. I used Math.random(), in a LOT of places, generally the exact location of the nodes will be different every playback
1. Local fonts: I obviously didn't pack a whole font in there, I used your local fonts, whatever sans-serif you happen to have will determine your result. Notably Chinese characters and combining vertical line above(a Peh-oe-ji diacritic) might not show up / display in the same font / positioned correctly / all of the above. Tanoshii, ne?
1. Performance: I did NOT use delta time, only capped FPS, sigh, don't mentioned it ~n~ This means every playback will be slightly different rhythm, and more noticeable the slower it runs for you, sumimasen lol

# greetz

stargaze, wrighter, 0b5vr, Session Orgas, Low Score Boy, FL\_YANG, jrwei, ananq\_0w0, whereischappie, psenough, ocf.tw, g0v.tw, Atsushi Eno, Amos Li, jon, echo heo

# credit

MDN documents, my sanity, vite-plugin-singlefile
