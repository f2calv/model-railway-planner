# Track Catalogs

Reference information for the planner's supported track catalogs, organised by manufacturer and
scale. There are 44 entries across Hornby, Peco Setrack and Bachmann OO, including one accessory. Other scales require their
own verified geometry and clearance profile, not merely a new display label.

Return to the [planner README](../README.md) for installation and editing instructions.

## Hornby OO Catalog

The Hornby catalog includes 28 entries: 17 dimension-supported simple straights/arcs, one
double-track level crossing, one attached accessory and nine
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
one accessory per host is supported. It adds no rail geometry or connectors, has an independent
inventory/shopping count and uses a schematic marker rather than an invented road/gate footprint.
It moves and deletes with its host, survives undo/export/import and can be removed separately.
R614 is a left-hand diamond crossing, not a road crossing.

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

## Compatibility and Clearance

Profiles declare gauge, scale ratio, electrical system, known rail code and the planning envelope.
All current entries use OO, 1:76, 16.5 mm gauge and two-rail planning. Peco Setrack specifies Code
100; Hornby/Bachmann rail codes remain unspecified in these profiles.

Snapping rejects mismatched gauge/electrical systems and conflicting known rail codes. An unknown
rail code permits geometric planning, not a certified physical connection. Verify actual joiners,
rail heights, sleepers and electrical behaviour before buying or assembling mixed brands. The
interface displays this warning for non-Hornby layouts.

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
