# Canonical PAAIPE brand assets

Only checksum-verified canonical logo files belong in this directory.
`npm run verify:brand` fails if any byte changes, if a file is missing, or if an
unexpected file appears here.

| File | Intrinsic size | Pinned SHA-256 |
| --- | --- | --- |
| `PAAIPE_Logo_Square_Final.png` | 2000 × 2000 | `88f91f0e5b4a7bf70d202d49dadedae5a677a72c02f9d4eaf097962a247d1867` |
| `PAAIPE_Logo_Horizontal_Final.png` | 1800 × 627 | `f332dc8c5d005b4cf46b06643d005d90071b36072c17a816107f3730021a1378` |

## Unresolved: the master command prints different checksums

The Frontend Master Command (Tab 02 and Tab 15) requires:

- Square: `fd142bbe87429931b8cbf10d4f834d24f538b713b79a2fa69fdc660f016adf77`
- Horizontal: `1e87fd4cbc683de75e240c8810c6f835928e768e849c0ddf2c92866808b55944`

The files supplied and confirmed as official by the owner on 2026-09-03 do not
hash to those values. The gate is pinned to the supplied files and reports the
divergence on every run. **PAAIPE must confirm which pair is authoritative** —
see `docs/frontend-audit.md`, blocker B-1.

## Rules

- Do not run these files through an image optimizer, resizer or converter.
- Do not add an alternate, recreated, recoloured, cropped or traced logo here.
- Decorative map / network / node graphics belong in `public/media/`, never here.
