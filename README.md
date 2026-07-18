# Brick Studio

A browser-based 3D brick builder. Snap bricks onto a studded baseplate, stack them in
every valid configuration (staggered, overhanging, mixed brick/plate heights), and switch
between visual themes.

No build step — plain ES modules + [Three.js](https://threejs.org/) loaded from a CDN via an
import map. Open it on any static host (GitHub Pages) or a local server.

## Run locally

ES modules need HTTP (not `file://`):

```bash
cd BrickStudio
python3 -m http.server 8000
# open http://localhost:8000
```

## Controls

| Action | Input |
| --- | --- |
| Orbit / pan / zoom | left-drag / right-drag / wheel |
| Slide the piece | move mouse (it stays on the surface, hangs off edges) |
| Nudge 1 stud | arrow keys |
| Rotate 90° | `R` |
| Place | click (green = supported, red = would float) |
| Delete | `ESC` to deselect, then click a piece |

## How snapping works

Space is a voxel grid at **plate** resolution (a brick is 3 plates tall). A piece rests at the
highest level where at least one of its studs is supported, so you can offset a 2x4 on a 2x4
down to a single stud of grip — but never float it with zero support.

## Project layout

Everything is split so adding shapes never means editing a giant file.

```
index.html          shell + import map
css/styles.css
js/
  constants.js      grid units
  colors.js         color palette
  themes.js         aesthetics
  kinds.js          PART REGISTRY — add shapes here
  occupancy.js      voxel grid (collide / support / valid)
  selection.js      current piece / color / rotation
  scene.js          scene, camera, baseplate, theme
  factory.js        builds a mesh group for any kind
  snapping.js       cursor → snapped target
  ghost.js          preview + nudge + footprint marker
  blocks.js         place / delete / occupancy writes
  input.js          pointer + keyboard
  ui.js             sidebar built from the registry
  main.js           wire-up + render loop
```

## Adding a new shape

Add one `registerKind({...})` call in `js/kinds.js` (or a new file that imports `registerKind`):

```js
registerKind({
  id: 'tile', label: 'Tiles', heightPlates: 1, studs: false, colorable: true,
  geometry: boxGeometry, sizes: ['1x2', '2x2', '2x4'],
});
```

It shows up in the palette automatically. For a custom shape, pass your own
`geometry(fw, fd, h)` builder.

## Movable parts

Wheels, propellers, and fans **spin** on their own (a real animation). The **Animation**
toggle in the sidebar pauses them so you can build precisely.

**Mounting on axles:** place an axle (Axles tab), then select a wheel/propeller/fan and move
the cursor near the axle — it snaps onto the nearest **mid or end** point and aligns its spin
axis to the axle. Away from an axle they place freely on the grid.

**Axles on block sides:** an axle can lie on top of a block (grid) *or* snap to a block's
vertical **side face**, sticking out perpendicular — hover a side and it attaches. Press **M**
to toggle whether the axle's **end** or **middle** sits on the face. Great for a windmill arm
poking out of a tower.

**Vertical axles:** press **V** to stand the selected axle up (along Y) — hover a surface and
it rises from it. Gears/wheels mount on vertical shafts the same way as horizontal ones.

## Gears & driveline (mechanics)

The first real mechanics: **one axle can turn another**.

- **Crank** (Mechanics tab) drives the axle it's mounted on. A mounted propeller/fan/wheel also
  drives its axle, so a windmill's blades can power a drivetrain.
- **Gears** are teeth-based (1x1 = 8t, 2x2 = 16t, 3x3 = 24t) with pitch radius = size in studs,
  so meshing spacing always lands on the grid and ratios are exact: a 16t driving an 8t turns it
  **2× faster** (opposite direction); an 8t driving a 24t turns it **⅓ as fast**. Rotation
  propagates through a whole chain (including compound gears sharing an axle).
- **Auto-line-up:** when you place a gear near an existing gear on a parallel axle, it snaps
  *along* the axle to sit coplanar with it, so they mesh cleanly.
- **Bevel gears (90°)** mesh across *perpendicular* axles — pair one on a horizontal axle with
  one on a vertical axle at the corner to turn power from horizontal to vertical (or vice-versa).

Try: two axles the right distance apart (2 studs for two 1x1 gears, 4 for two 2x2), a crank on
one, a gear on each where they meet. Turn Animation on — the second axle spins the other way.

This is kinematics (speed + direction), not dynamics — no torque/load yet, which is why gear
"power" doesn't factor until there's something to push against.

## Pulleys, belts & chains

- **Motors** (Mechanics tab) drive their axle; press **F** to choose **CW/CCW** before placing.
- **Pulleys** are grooved wheels on axles. Pick the **Belt** or **Chain** tool and **drag** from a
  pulley's top/bottom **handle** to another pulley's handle to link them.
- **Direction is set by routing:** top→top (or bottom→bottom) = **open belt → same direction**;
  top→bottom = **crossed → reversed**. Speed couples by pulley radius. Chains behave the same,
  toothed look. Build complex systems with several pairwise belts (a triangle = 3 belts).

## Saving

- Builds **auto-save to `localStorage`** on every place/delete, so they survive a refresh.
- **Named builds:** in the BUILDS panel, *Save As* stores the current build under a name,
  *Load* restores it, *Delete* removes it. Multiple builds are kept.
- **Export / Import** a build as a JSON file for backup or sharing.

## Roadmap

- Particle water (tiny mass-bearing droplets) for the Water piece
- Multi-size / multi-brightness light bricks
- Axle-driven mechanics (gears/constraints) so wheels are actually powered
- More parts (doors, curved slopes, wedge plates) as classic building-brick elements
- Shareable build links

## Disclaimer

Brick Studio is an independent project. It is **not affiliated with, endorsed by, sponsored by,
or connected to the LEGO Group** in any way. LEGO® is a trademark of the LEGO Group, which does
not own, produce, endorse, or support this software. Any references to interlocking building
bricks are descriptive of a general product category, not any particular brand.
