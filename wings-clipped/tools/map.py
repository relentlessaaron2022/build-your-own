"""map.py states-10m.json out.json — decode us-atlas TopoJSON (Census 2017, unprojected) to lon/lat rings for the East Coast states."""
import sys, json
T = json.load(open(sys.argv[1])); sx, sy = T['transform']['scale']; tx, ty = T['transform']['translate']
arcs = []
for a in T['arcs']:
    x = y = 0; pts = []
    for dx, dy in a: x += dx; y += dy; pts.append((round(x * sx + tx, 3), round(y * sy + ty, 3)))
    arcs.append(pts)
def arc(i): return arcs[i] if i >= 0 else arcs[~i][::-1]
def ring(r):
    out = []
    for i in r: p = arc(i); out.extend(p if not out else p[1:])
    return out
KEEP = {'Florida', 'Georgia', 'Alabama', 'South Carolina', 'North Carolina', 'Virginia', 'West Virginia', 'Maryland', 'Delaware', 'New Jersey', 'Pennsylvania',
        'New York', 'Connecticut', 'Rhode Island', 'Massachusetts', 'Tennessee', 'Kentucky', 'Mississippi', 'Ohio', 'District of Columbia', 'Vermont', 'New Hampshire'}
out = []
for g in T['objects']['states']['geometries']:
    name = g['properties']['name']
    if name not in KEEP: continue
    polys = g['arcs'] if g['type'] == 'MultiPolygon' else [g['arcs']]
    rings = [ring(p[0]) for p in polys]
    rings = [r[::2] if len(r) > 60 else r for r in rings if len(r) > 6]
    out.append({'name': name, 'rings': rings})
json.dump(out, open(sys.argv[2], 'w'), separators=(',', ':'))
print(len(out), 'states', sum(len(r) for s in out for r in s['rings']), 'points')
