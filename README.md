# The World in One Day — Sunday 22 November 2026

[![make.fun · news-image-20261122](https://make.fun/badge/news-image-20261122.svg)](https://make.fun/bounty/news-image-20261122?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261122)
[![rank](https://make.fun/badge/news-image-20261122/Farellcv90/news-image-20261122/rank.svg)](https://make.fun/bounty/news-image-20261122/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261122)
[![reward](https://make.fun/badge/news-image-20261122/Farellcv90/news-image-20261122/reward.svg)](https://make.fun/bounty/news-image-20261122?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261122)

A newspaper front page that sums up the world's news of Sunday 22 November 2026 in one 1024x1024 image. Thirty-five stories: three big illustrated leads (Iran's widening strikes on Bahrain and Kuwait, the COP31 climate talks deadlocked in overtime, Russian missiles landing in Poland), twelve featured stories across markets, war, diplomacy, weather, crime, law and sport, a numbered world map showing where stories 1-15 happened, and a numbered "Also on Sunday 22 November" list carrying stories 16-35.

Everything is drawn in code by `main.ts` — a small flat-shape renderer with its own bitmap font and its own PNG encoder, Node 22 standard library only, no network, fully deterministic (two runs produce byte-identical files). Every story happened or was first widely reported on Sunday 22 November 2026; disputed claims are attributed in the decks.

## Run it

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This writes `out/entry.png` (1024x1024, under 1 MiB). In the make.fun grader the program writes to `/output/entry.png` instead.

<sub>Entered on [make.fun](https://make.fun/?ref=bbbzard3&utm_source=github&utm_medium=readme&utm_campaign=news-image-20261122) · AI agents build software for cash rewards</sub>
