# Track Power Planning

The optional DC/DCC checker estimates electrical reachability from explicitly declared connected
feeds. It does not measure or certify a real railway. Return to the [planner README](../README.md).

## Configure an Idea

Choose **DC (analogue)** or **DCC (digital)** under **Track power**. Older ideas begin
**Not configured**, and adding a power track never silently connects a controller.
Select one unlocked track piece and use **Apply power settings** to save:

- **Native power track**: R8206 for DC or R8241 for DCC.
- **R602 DC clip** or **R8242 DCC clip**: the planner deliberately limits clip hosts to R600/R601.
  These are planning declarations, not verified physical-fit guarantees. Check the actual track
  and clip; use a manual feeder declaration for other physically verified arrangements.
- **Manual feeder**: your declaration of a feed appropriate for the chosen system.
- **Feed connector**: the endpoint/section receiving the feed, identified by number and coordinates.
  It matters on crossings and isolating track. It is not a model of solder-pad locations.
- **Connected to the selected controller**: explicitly enables this feed as a power source.
  All marked feeds are assumed to come from the same controller.

**No feed** removes a feed and releases its connecting-clip inventory requirement. Switching the
idea to **Not configured** hides checks but retains the saved wiring declarations and clip counts.
Power edits are undoable, retained in JSON backups and rejected if browser storage cannot save.
Locked pieces cannot have their power declarations changed.

## Hornby Points and Isolation

Supported Hornby points are self-isolating: **Route 1** or **Route 2** connects the common entry
to that exit. The other siding can remain dead in DC operation. The route numbers correspond to the
catalog routes, not necessarily “straight” and “curved” on every point.

An **Unknown position** remains unverified until a position or bypass is declared. A declared
**R8232 pair (2 clips)** or **Soldered bypass** bridges the modeled isolation and powers both
branches from a common feed. Alternatively, a siding can have its own same-controller feeder.
Frog wiring and the precise shared toe/branch rail sections are not represented.

R618 double-isolating track does not conduct between its ends. With only one side fed, it is
**partial**; separate feeds can power both isolated sides without connecting them through the gap.
R636 and R614/R615 crossings keep their two routes electrically independent.

## Stock and Accessories

R8232 stock is counted as **individual clips**, not packs. Enter **20** for the currently listed
full pack; each fitted point pair uses two. R602 and R8242 each consume one clip per declared host,
even before a controller connection is marked. No stock is preloaded.

Missing clips appear on the active idea’s shopping list and CSV. As with track, the checker models
the proposed layout even when stock is missing; a powered estimate does not mean the necessary
parts are owned or physically installed. R645 can coexist with a feed on its host straight.

## Results and Limits

**Show power overlay** is a session-only display switch. A thin coloured route overlay leaves
shopping/lock colours and padlocks intact:

| Result     | Overlay        | Meaning                                                                    |
| ---------- | -------------- | -------------------------------------------------------------------------- |
| Powered    | Green, solid   | Definite modeled reachability from a compatible connected feed             |
| Unpowered  | Orange, dashed | No modeled power source reaches the section                                |
| Partial    | Yellow, dashed | Only part of an isolating route is definitely powered                      |
| Unverified | Purple, dashed | Unknown point/track behavior or uncertain joints prevent a definite result |

Text summaries show route counts and the selected piece’s individual routes. DC dead sidings are
informational. DCC warns about unpowered/partial routes and uncertain continuity.
**All modelled routes powered** appears only when every route is powered and no electrical warning
remains. A layout without a compatible marked feed never passes.

The graph uses the same compatible mechanical joins as snapping: endpoint distance below 0.25 mm
and opposite headings within 0.1 degrees. Ambiguous imported joins are uncertain. Simple rails
assume sound electrical continuity; unsupported electrical behavior is not assumed continuous.
Factory R8206/R602 DC hardware produces a DCC compatibility warning; a connected wrong-system
feed is excluded as a source. This is a hardware caution, not instructions to modify a connector.

The checker does **not** validate rail polarity, reverse loops, shorts, frogs, controller districts,
current capacity, voltage drop, insulated joiners, or the quality of physical connections.
Confirm the real installation against the manufacturer’s wiring instructions.

JSON retains power settings. SVG, PNG and print exports remain geometry-only and **do not include**
the power overlay or wiring declarations. Inventory/shopping CSV includes the power accessories.

## Sources

- [Hornby R602 power connecting clip](https://uk.hornby.com/products/power-connecting-clip-r602).
- [Hornby R8242 digital connecting clip](https://uk.hornby.com/products/digital-power-connecting-clip-r8242).
- [Hornby R8232 current 20-clip pack](https://uk.hornby.com/products/digital-electric-point-clips-pack-20-r8232).
- [Hornby Elite manual, hosted by ManualsLib](https://www.manualslib.com/manual/822457/Hornby-Elite-Unit.html):
  self-isolating points and two clips per point.
- [Hornby-hosted community discussion of DCC wiring and point clips](https://community.hornbyhobbies.com/forums/topic/32637-dcc-wiring-best-practice-and-point-clips/):
  community guidance, not an official wiring manual.
