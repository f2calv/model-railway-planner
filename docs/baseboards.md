# Baseboard Shapes

Use **Edit baseboards** to work on the baseboard rather than the track. Boards and track are separate:
moving, rotating, resizing or removing a board never moves or removes its track.

Return to the [planner README](../README.md) for installation, backup and track controls.

## Shape Palette and Placement

- **Rectangle** creates a four-corner polygon; equal width and height make a square.
- **Right triangle** uses the entered width and height as perpendicular legs.
- **Circle** uses an outer radius and is positioned by its centre.
- **Semicircle** starts as a filled 180-degree sector.
- **Arc strip** has an outer radius, inner radius and sweep from 1 to 360 degrees.
  Set the inner radius to zero for a filled sector; a 360-degree sweep makes an annulus.

Drag from the palette to see a placement preview, or choose a shape and tap the canvas.
**Add shape at coordinates** uses the inspector's exact values. **Add rectangle** remains a quick
coordinate-based rectangle command. **Select / pan boards** cancels the placement tool.

Rectangles and triangles initially use their upper-left/right-angle corner as the local origin;
circles and arcs use their centre. Coordinates and radii are millimetres, and positive angles
rotate clockwise on screen. An arc starts along the local positive X axis.

## Module Presets

These nominal tabletop dimensions were checked against
[Modellbahnmodule's module comparison](https://www.modellbahnmodule.de/) on 24 November 2026.
They are geometric starting shapes, not a parts-ordering integration or a structural model.

| Preset                | Geometry                      |
| --------------------- | ----------------------------- |
| 1000 x 500 mm         | Rectangle                     |
| 1000 x 250 mm         | Rectangle                     |
| 500 x 500 mm          | Square                        |
| 500 x 250 mm          | Rectangle                     |
| 250 x 250 mm          | Square                        |
| 250 mm right triangle | Two perpendicular 250 mm legs |

The supplier lists the last corner module as 250 x 353 x 250 mm; the planner computes the diagonal
from the two 250 mm legs rather than using a rounded hypotenuse. Frame heights, feet, bolt positions,
joining hardware, roadways and structural load limits are not represented. Editing a preset makes
custom geometry; it is no longer a claim of an orderable supplier size.

## Editing and Snapping

Select a board on the canvas or in **Baseboard shape**. Drag its surface to move it. The active
board and its handles are drawn above other boards so a joined edge remains editable.

- Drag a polygon corner to reshape it, or use **Polygon corners** and **Apply corners**.
  Corner coordinates are local to the board. Convex quadrilaterals include trapezoids.
- Crossed, concave or collapsed polygons are rejected without saving the preview.
- **Apply board changes** edits position, angle and dimensions. Polygon width/height changes
  scale the existing outline, preserving a trapezoid rather than resetting it to a rectangle.
- Circle/arc radius controls reshape curved boards. Inner radius must remain below outer radius.
- Arrow keys move a selected board 5 mm; Shift + arrows move it 1 mm. `R` rotates 22.5 degrees.
  Delete removes it. Enter selects a focused board; inspector buttons are non-drag alternatives.
- Escape, pointer cancellation, loss of capture or a second touch discards the current preview.
  Space + drag pans, and wheel/two-finger pinch zooms.

With **Snap** enabled, placement/movement snaps to nearby vertices, edge projections and circular
boundaries within 15 screen pixels. Rotation is explicit, not automatic. Polygon corners also
snap to neighbouring board boundaries. Geometry connectivity allows overlaps or point/edge contact
with a 0.1 mm numerical tolerance; snapping does not establish physical fixing compatibility.

## Checks, Saving and Limits

Disconnected boards are allowed during assembly and produce a planning warning. Board edits may
expose existing track outside the baseboard; that also produces a warning. New track placement still
rejects a footprint outside the union of boards. Shared seams are not treated as outside edges,
and holes in curved strips remain outside the baseboard.

Containment and joining use analytic polygon/line/circle geometry. Track footprints retain the
existing sampled clearance checks; this is not a guarantee of vehicle clearance or structural safety.

Each successful gesture is one save and one undo step. A failed browser-storage write rejects the
edit. Format 5 backups retain board IDs, poses and geometry and migrate the earlier rectangle format.
Close/update older app tabs before editing migrated documents. The existing storage key is retained.

Layouts support at most 50 board shapes. Polygons have 3 to 16 corners with at least 1 mm between
consecutive corners; local corner coordinates and radii are bounded to 100000 mm. Circles/arcs use
1 to 100000 mm outer radii, with sweeps from 1 to 360 degrees. Arbitrary concave outlines, freehand
curves, structural frames, elevations and multi-board group editing are not implemented.

Named rooms and furniture form a separate layer beneath baseboards. See the [room guide](rooms.md)
for assigning a room and placing a baseboard over a table without attaching their movement.
