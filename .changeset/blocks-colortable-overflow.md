---
"@unpunnyfuns/swatchbook-blocks": patch
---

`<ColorTable>` now wraps its `<table>` in a `.sb-color-table__scroll` div with `overflow-x: auto; max-width: 100%`. Previously, wide rows (long alias paths or multiple variant pills on `nowrap` cells) could push the surrounding container horizontally — most noticeable on docs pages with several `<ColorTable>` instances stacked. The wrapper contains the worst case to the table's own region; `max-width: 240px` truncation on the value cell keeps typical rows from needing to scroll at all.
