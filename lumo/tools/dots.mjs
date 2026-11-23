// Génère une carte du monde en points (projection équirectangulaire) -> assets/world_dots.json
import fs from 'fs'; import {feature} from 'topojson-client'; import {geoContains} from 'd3-geo';
const topo = JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-110m.json'));
const land = feature(topo, topo.objects.countries);
const dots = [];
for (let lat = 72; lat >= -56; lat -= 1.6) for (let lon = -170; lon <= 180; lon += 1.6) {
  for (const f of land.features) if (geoContains(f, [lon, lat])) { dots.push([+lon.toFixed(1), +lat.toFixed(1), f.properties.name === 'Togo' ? 1 : 0]); break; }
}
fs.writeFileSync('../assets/world_dots.json', JSON.stringify(dots));
console.log(dots.length, 'points');
