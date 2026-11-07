# spellspeed.com

The built website of [Spellspeed](https://github.com/KingMrock/spellspeed), served by GitHub Pages at
[spellspeed.com](https://spellspeed.com).

- `index.html`, `android.html`, `privacy.html`: the site.
- `try/`: *Try it*, Spellspeed's deck builder running in the page (card search, Access, Starters, Summon Lab, YDK and
  YDKe import and export). `try/spellspeed/` holds unchanged copies of the extension's files; `try/host.js` stands in
  for DuelingBook's deck constructor.

This repository holds generated files and is updated from the Spellspeed sources; it is kept apart so the source
repository stays small.

## Credits and licences
- Spellspeed's code and site: GPL-3.0-only, see [LICENSE](LICENSE). Fonts: SIL Open Font License (`fonts/`).
- Card data (`try/cards.json`) and card images (`try/art/`) come from [YGOPRODeck](https://ygoprodeck.com/),
  downloaded once and hosted here as its API guide asks. Card names, texts and artwork belong to Konami and are not
  covered by this repository's licence.

Spellspeed is an independent fan project, not affiliated with or endorsed by DuelingBook, Konami or YGOPRODeck.
Yu-Gi-Oh! is a trademark of Konami.
