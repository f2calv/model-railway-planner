# Rooms and Furniture

The plan uses one millimetre coordinate system and three independent drawing layers:

1. Room outline and furniture, at the bottom.
2. Baseboard shapes.
3. Track, at the top.

Room and furniture shapes are visual references. Placing a baseboard over a table does not attach
them: moving the table never moves the baseboard or its track. Furniture does not consume inventory
and is not included in the track shopping list.

## Create a Room and Table

1. Choose **New room**, enter a name and save.
2. Select **Room outline** in **Room shape role** and give the outline a name.
3. Enter its width and height in millimetres, normally with X/Y zero, then **Add room rectangle**.
4. Select **Furniture**, enter a name such as `Table`, its position, width and height, and add
   another rectangle.
5. Add and position baseboards over the table using the existing baseboard controls.
6. Choose track from the catalog to return to track editing.

Rooms allow one outline and up to 50 shapes including furniture. An empty room is valid while being
drawn; a planning warning asks for an outline. Up to 50 named rooms can be saved.

## Shape Editing

**Edit room shapes** activates the bottom layer and dims/disables board and track hit targets.
Furniture can be dragged by its surface; an outline is selected/dragged by its border so it cannot
cover furniture hit targets. **Select room shape** provides a non-drag selection alternative.

The room palette supports rectangles, right triangles, circles, semicircles and arc strips.
Use **Add room shape at coordinates**, or drag a palette shape to the canvas. Dimensions, rotation,
radii, sweep and convex corner editing follow the [baseboard geometry guide](baseboards.md).
The inspector's name and role are saved with **Apply room shape changes**. To replace an outline,
remove it first or change its role to furniture before creating a new outline.

Snapping operates only within the edited layer. Room shapes do not snap track or baseboards to
furniture; use the common coordinate inputs to align layers precisely. Escape, additional pointers
and pointer cancellation discard previews. Successful shape edits are one save and one undo step.

## Share Rooms Between Ideas

The **Room** selector assigns a named room to the current layout. **No room** hides the room layer
without deleting the room. New ideas start unassigned; duplicated ideas retain their room assignment.
Switching the assignment never changes board or track coordinates, so room outlines should use
consistent origins when comparing ideas.

Room geometry and names are shared: editing or renaming a room affects every idea assigned to it.
To explore a different room arrangement independently, create another named room.
**Delete room** asks for confirmation, removes its furniture and clears all references to that
room; baseboards, track and inventory remain. Undo restores the room and its assignments.

## Warnings, Exports and Saving

Planning checks warn when boards, track or furniture extend outside the selected room outline.
They never block placement. Furniture does not impose collisions, load limits or support requirements:
this is not a structural, accessibility or clearance assessment.

Room checks sample polygon edges and curved boundaries; track retains its sampled footprint checks.
These are advisory, not a continuous-containment or physical-clearance certificate. Check actual
walls, doors, aisles and furniture dimensions independently.

Fit, SVG, PNG and print/PDF include the selected room and furniture below boards and track.
Only the assigned room appears in a drawing; JSON backups include every named room and assignment.
User room/furniture names are retained verbatim when changing UI language and escaped in SVG exports.

Format 6 backups retain rooms from version 5 and migrate versions 1–4 without inventing rooms or
changing older track/board geometry.
Autosave, failed-write protection, whole-document undo/redo and cross-tab recovery apply to room edits
as well. Close/update older app tabs before editing migrated documents.

Use the prominent **Feature requests / bug reports** link in the page header to open the repository.
Opening that link does not upload the room, layout or inventory.
