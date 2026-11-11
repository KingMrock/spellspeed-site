# spellspeed.com

The built website of [Spellspeed](https://github.com/KingMrock/spellspeed), served by GitHub Pages at
[spellspeed.com](https://spellspeed.com).

- `index.html`, `android.html`, `privacy.html`: the site.
- `try/`: *Try it*, Spellspeed's deck builder running in the page (card search, Access, Starters, Summon Lab, YDK and
  YDKe import and export). `try/spellspeed/` holds unchanged copies of the extension's files; `try/host.js` stands in
  for DuelingBook's deck constructor.
- `download/`: the Android app's APK, linked from `android.html` with its size and SHA-256. A new version replaces the
  file and those lines; it is built by the source repository's Android build and signed with the same key.
- `assets/video/`: the 1-minute overview (720p web copy), its poster, and the thumbnails of the long tour and the shorts.
  The tour and shorts are on YouTube: each card in `index.html` gets its `href` when its video is public.

This repository holds generated files and is updated from the Spellspeed sources; it is kept apart so the source
repository stays small.

## Credits and licences
- Spellspeed's code and site: GPL-3.0-only, see [LICENSE](LICENSE). Fonts: SIL Open Font License (`fonts/`).
- Card data (`try/cards.json`) and card images (`try/art/`) come from [YGOPRODeck](https://ygoprodeck.com/),
  downloaded once and hosted here as its API guide asks. Card names, texts and artwork belong to Konami and are not
  covered by this repository's licence.

Spellspeed is an independent fan project, not affiliated with or endorsed by DuelingBook, Konami or YGOPRODeck.
Yu-Gi-Oh! is a trademark of Konami.
