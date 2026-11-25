# Track Catalogs

Reference information for the planner's supported track catalogs, organised by manufacturer and
scale. There are 52 entries: 47 across Hornby, Peco Setrack and Bachmann OO, including four
accessories, plus five starter entries across Z, N, TT, O and G. Starter geometry has manufacturer
dimension sources, but not verified rolling-stock clearance profiles.

Return to the [planner README](../README.md) for installation and editing instructions.

## Hornby OO Catalog

The Hornby catalog includes 31 entries: 17 dimension-supported simple straights/arcs, one
double-track level crossing, four attached accessories and nine
idealised points/diamond crossings, including all seven standard-range point types and both diamond crossing
hands. It is not the complete Hornby range. Numeric dimensions and product codes are
referenced from product descriptions; no product photographs or artwork are copied.

| Pieces        | Geometry                                                                         | Sources                                                                                                                                                                  |
| ------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R600 / R601   | 168 / 335 mm straight                                                            | [R600](https://uk.hornby.com/products/straight-track-r600), [R601](https://uk.hornby.com/products/double-straight-r601)                                                  |
| R603          | 670 mm straight                                                                  | [Long straight](https://uk.hornby.com/products/long-straight-r603)                                                                                                       |
| R610          | 38 mm quarter straight                                                           | [Quarter straight](https://uk.hornby.com/products/quarter-straight-r610)                                                                                                 |
| R618 / R8206  | 168 mm double-isolating / power straight                                         | [Isolating track](https://uk.hornby.com/products/double-isolating-track-r618), [Power track](https://uk.hornby.com/products/power-track-r8206)                           |
| R8241         | 168 mm digital power straight                                                    | [Digital power track](https://uk.hornby.com/products/digital-power-track-r8241)                                                                                          |
| R636          | Two independent 168 mm straights at standard 67 mm centres                       | [Double-track level crossing](https://uk.hornby.com/products/level-crossing-double-track-r636)                                                                           |
| R645          | Trackless single-track level-crossing accessory, centred on an existing straight | [Single-track level crossing](https://uk.hornby.com/products/level-crossing-single-track-r645)                                                                           |
| R602 / R8242  | DC / DCC feed clips; one clip per inventory unit                                 | [DC clip](https://uk.hornby.com/products/power-connecting-clip-r602), [DCC clip](https://uk.hornby.com/products/digital-power-connecting-clip-r8242)                     |
| R8232         | Point bypass clips; two per point, individual clip inventory units               | [Current pack of 20 clips](https://uk.hornby.com/products/digital-electric-point-clips-pack-20-r8232)                                                                    |
| R604 / R605   | 371 mm radius; 22.5 / 45 degrees                                                 | [R604](https://uk.hornby.com/products/curve-1st-radius-r604), [R605](https://uk.hornby.com/products/double-curve-1st-radius-r605)                                        |
| R606          | 438 mm radius; 22.5 degrees                                                      | [R606](https://uk.hornby.com/products/curve-2nd-radius-r606)                                                                                                             |
| R607 / R643   | Nominal 438 mm radius; 45 / 11.25 degrees                                        | [R607](https://uk.hornby.com/products/double-curve-2nd-radius-r607), [R643](https://uk.hornby.com/products/half-curve-2nd-radius-r643)                                   |
| R608 / R609   | 505 mm radius; 22.5 / 45 degrees                                                 | [R608](https://uk.hornby.com/products/curve-3rd-radius-r608), [R609](https://uk.hornby.com/products/double-curve-3rd-radius-r609)                                        |
| R8072 / R8073 | 168 mm straight plus 438 mm radius / 22.5 degree branch                          | [Left point](https://uk.hornby.com/products/left-hand-point-r8072), [Right point](https://uk.hornby.com/products/right-hand-point-r8073)                                 |
| R8261 / R8262 | Nominal 572 mm radius; 22.5 / 45 degrees                                         | [R8261](https://uk.hornby.com/products/curve-4th-radius-r8261), [R8262](https://uk.hornby.com/products/double-curve-4th-radius-r8262)                                    |
| R628          | 852 mm radius; 11.25 degrees                                                     | [Large-radius half curve](https://uk.hornby.com/products/half-curve-33-large-radius-r628)                                                                                |
| R8074 / R8075 | Approximate curved-point branches, not CAD geometry                              | [Left curved point](https://uk.hornby.com/products/left-hand-curved-point-r8074), [Right curved point](https://uk.hornby.com/products/right-hand-curved-point-r8075)     |
| R8076         | Idealised symmetric 852 mm / 11.25 degree Y branches                             | [Y point](https://uk.hornby.com/products/y-point-r8076), [Dimensional comparison](https://www.railwayscenics.com/track_comparison_oo.php)                                |
| R8077 / R8078 | 245 mm straight and idealised 852 mm / 11.25 degree branch                       | [Left express point](https://uk.hornby.com/products/left-hand-express-point-r8077), [Right express point](https://uk.hornby.com/products/right-hand-express-point-r8078) |
| R614 / R615   | Idealised 168 / 181 mm diamond crossing; 22.5 degrees                            | [Left crossing](https://uk.hornby.com/products/diamond-crossing-left-hand-r614), [Right crossing](https://uk.hornby.com/products/diamond-crossing-right-hand-r615)       |

Sources reviewed 23 November 2026. The
[official Hornby track geometry diagram](https://support.hornby.com/hc/en-gb/article_attachments/10406061442332)
supports 371/438/505/572 mm standard radii and 11.25/22.5/45 degree sections.
Some descriptions conflate curve length and radius: R628's 852 mm is its radius, not its arc length.
All points and diamond crossings are
idealised, not manufacturer CAD models: check their real connector positions before buying or
building. Curved points use an approximate 438 mm / 33.75 degree route and a 67 mm lead followed by
a 438 mm / 22.5 degree route. Express points use an idealised straight lead before their branch.
Geometry warnings appear in the palette tooltip, selected-piece description, hover tooltip and
planning checks.

R636 includes both tracks and has four connectors; one placed crossing consumes one inventory item.
The road, gates and barriers are not included in its clearance envelope. R645 does **not** include
track: select one unlocked Hornby straight at least 168 mm long and choose R645 to attach it. Only
one R645 per host is supported, independently of power settings. It adds no rail geometry or connectors, has an independent
inventory/shopping count and uses a schematic marker rather than an invented road/gate footprint.
It moves and deletes with its host, survives undo/export/import and can be removed separately.
R614 is a left-hand diamond crossing, not a road crossing.

Power accessories add no track geometry. Select a suitable unlocked host and choose the accessory,
then explicitly mark feed connection in **Track power**. R602/R8242 clip controls are limited to
R600/R601; actual fit still requires physical verification. R8232 consumes two individual clips
per declared bypass. See the [power planning guide](power.md) for compatibility and limitations.

## Peco Setrack OO Catalog

Seven entries demonstrate another manufacturer's nominal Code 100 set-track geometry.
The 41 mm ST-203 is not a substitute for Hornby's 38 mm R610.

| Pieces          | Geometry                         | Manufacturer source                                                                                                                                                                                           |
| --------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ST-200 / ST-201 | 168 / 335 mm straight            | [Standard straight](https://peco-uk.com/products/st200-peco-setrack-oo-ho-track-c100-standard-straight), [Double straight](https://peco-uk.com/products/st201-peco-setrack-oo-ho-track-c100-double-straight)  |
| ST-202 / ST-203 | 79 / 41 mm short straight        | [Short straight](https://peco-uk.com/products/st202-peco-setrack-oo-ho-track-c100-short-straight), [Special short straight](https://peco-uk.com/products/special-short-straight)                              |
| ST-204          | 670 mm long straight             | [Long straight](https://peco-uk.com/products/st204-peco-setrack-oo-ho-track-c100-long-straight)                                                                                                               |
| ST-220 / ST-221 | 371 mm radius, 22.5 / 45 degrees | [Standard first-radius curve](https://peco-uk.com/products/standard-curve-1st-radius), [Double first-radius curve](https://peco-uk.com/products/st221-peco-setrack-oo-ho-track-c100-no-1-radius-double-curve) |

Further curves whose official descriptions do not verify angles, and points with different leads
or connector offsets, are excluded. A similar product description is not geometric equivalence.

## Bachmann OO Catalog

Nine entries use dimensions from the
[Bachmann Branchline OO track listing](https://www.bachmann.co.uk/category/model-railway/branchline/ootrack).
These are simple straights/arcs, not a claim that the whole range has been modelled.

| Pieces                            | Geometry                                 |
| --------------------------------- | ---------------------------------------- |
| 36-600 / 36-601 / 36-603 / 36-610 | 168 / 335 / 670 / 38 mm straight         |
| 36-606 / 36-607 / 36-643          | 438 mm radius, 22.5 / 45 / 11.25 degrees |
| 36-608 / 36-609                   | 505 mm radius, 22.5 / 45 degrees         |

## Other-Gauge Starter Catalogs

The palette's **Gauge** dropdown filters brands to those with registered pieces in that gauge;
the **Brand** selection then filters the pieces. Both catalog views default to **OO/H0**.
The first brand option names the selected gauge, for example **All OO/H0 brands**; individual
brand names do not repeat it. Switching gauge resets an unavailable
brand and cancels pending track placement. The separate **Track catalog** page shows
all registered pieces with gauge/brand filters, dimensions, product sources and
owned/active-idea quantities. Browsing does not modify inventory or layout data.
Each view remembers its gauge, brand and wildcard filter across reloads and future visits on this
browser/device. Collapsed palette categories are remembered independently of the filter: searching
temporarily opens matching groups without changing their saved collapsed state. An unavailable
saved brand resets to **All** for its gauge. **Reset page settings** restores these defaults without
changing inventory, layouts or backups.

Both views share a case-insensitive **Wildcard filter** across codes, brands, names, scales and
track categories. Plain text matches anywhere; `*` matches any text and `?` one character.
For example, `curve` includes Hornby's radius-named curves, and `R60?` finds matching product codes.
Search derives each piece's name and category terms from the shared English, German, French,
Spanish and Italian translations, regardless of the interface language. For example, `curve`,
`Kurve`, `courbe` and `curva` find radius-named curves; `Rayon 2` and `Raggio 2` find the translated
second-radius names. Category labels are the same metadata used for palette grouping, with singular
and plural translations, not per-product keyword exceptions. Product names and saved IDs are unchanged.
Other punctuation is literal, not a regular expression. Choose **All gauges** on the full catalog
page to browse every gauge; a brand then includes its registered products across those gauges.

| Group     | Profile                             | Starter piece | Nominal geometry               | Manufacturer source                                                                              |
| --------- | ----------------------------------- | ------------- | ------------------------------ | ------------------------------------------------------------------------------------------------ |
| Z, 6.5 mm | Märklin Z, 1:220                    | 8500          | 110 mm straight                | [Märklin 8500](https://www.marklin.com/products/details/article/8500)                            |
| N, 9 mm   | Peco Setrack UK N, 1:148, Code 80   | ST-1          | 87 mm straight                 | [Peco ST-1](https://peco-uk.com/products/st1-peco-setrack-n-track-c80-standard-straight)         |
| TT, 12 mm | Hornby TT, 1:120, Code 80           | TT8002        | 166 mm straight                | [Hornby TT8002](https://uk.hornby.com/products/straight-track-tt8002)                            |
| O, 32 mm  | Peco Setrack UK O, 1:43.5, Code 124 | ST-700        | 394 mm straight                | [Peco ST-700](https://peco-uk.com/products/st700-peco-setrack-o-track-bh-c124-standard-straight) |
| G, 45 mm  | Peco Setrack G45, Code 250          | ST-905        | 600 mm radius, 30-degree curve | [Peco ST-905](https://peco-uk.com/products/st905-peco-setrack-g45-track-c250-standard-curve)     |

These are deliberately small starter catalogs, not complete ranges. Inventory counts individual
track sections even where a supplier sells a multi-pack, including Märklin 8500.
G45 is used at multiple scales, so its scale ratio is unspecified rather than guessed.
**OO/H0** is the 16.5 mm browsing group: OO and H0 do not have the same scale ratio.
The current entries in that group retain the project's OO envelope; no H0-specific range is claimed.

## Compatibility and Clearance

Profiles declare gauge, scale ratio, electrical system, known rail code and the planning envelope.
All current entries use two-rail planning. The OO entries use the project's 1:76, 16.5 mm profile.
Peco Setrack OO specifies Code 100; Hornby OO, Bachmann OO and Märklin Z rail codes remain
unspecified in these profiles. Other known rail codes appear in the starter table.

Snapping rejects mismatched gauge/electrical systems and conflicting known rail codes. An unknown
rail code permits geometric planning, not a certified physical connection. Verify actual joiners,
rail heights, sleepers and electrical behaviour before buying or assembling mixed brands. The
interface displays this warning for non-Hornby layouts.

New-gauge track widths are schematic: the OO 30 mm footprint is scaled by gauge for drawing,
overlap and board/room containment checks. No verified parallel-spacing targets are available for
these starter profiles, so parallel-spacing enforcement is skipped and the planner warns about the
limitation. This is not a measured sleeper or rolling-stock envelope. Different gauges can be
stored in one idea but cannot snap together.

Hornby's standard track centres are 67 mm apart. Other current OO catalogs deliberately reuse this
conservative project envelope; it is not advertised as a Peco/Bachmann standard. Matching connectors
does not guarantee clearance for long vehicles or overhang on curves. See the
[editing limits](../README.md#editing-and-limits) for sampling and exemptions.

The [retailer comparison list](https://www.mumfysmodels.co.uk/oo-track-list) is useful for discovery,
but its equivalences are not authoritative dimensions or cross-brand joiner certification.

## Deferred Pieces and Platform Furniture

Hornby R460/R462/R463/R464 platforms are not selectable yet. Published lengths alone are insufficient
for reliable footprints and train-clearance checks:

| Piece | Supported description                               | Missing geometry                            |
| ----- | --------------------------------------------------- | ------------------------------------------- |
| R460  | 168 mm straight platform                            | Width and edge offsets                      |
| R462  | 212 mm large curved platform, outside second radius | Width, curve radii, angles and edge offsets |
| R463  | 136 mm small curved platform, inside first radius   | Width, curve radii, angles and edge offsets |
| R464  | 127 mm platform ramp                                | Width and footprint                         |

No widths were guessed from ambiguous packaging measurements. Additional specialist track,
flexible track, R620/R632 and unverified vendor pieces remain in
[the project issue](https://github.com/f2calv/model-railway-planner/issues/1) until reliable dimensions
or measurements are available.
