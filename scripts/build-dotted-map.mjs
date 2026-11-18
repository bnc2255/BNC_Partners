// Pre-renders the hero's dotted world map so browsers don't compute it at runtime.
// Same settings the WorldMap component used. Re-run with: node scripts/build-dotted-map.mjs
import DottedMapModule from 'dotted-map';
const DottedMap = DottedMapModule.default ?? DottedMapModule;
import { writeFileSync, mkdirSync } from 'node:fs';

const svg = new DottedMap({ height: 100, grid: 'diagonal' }).getSVG({
  radius: 0.22,
  color: '#00000040',
  shape: 'circle',
  backgroundColor: 'transparent',
});
mkdirSync('public/maps', { recursive: true });
writeFileSync('public/maps/dotted-world.svg', svg);
console.log(`public/maps/dotted-world.svg ${svg.length} bytes`);
