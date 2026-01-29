import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

async function convertPngToSvg() {
  const nodesDir = path.resolve('./nodes');
  const pngFiles = await glob('*/logo.png', { cwd: nodesDir });

  for (const pngPath of pngFiles) {
    const fullPngPath = path.join(nodesDir, pngPath);
    const svgPath = fullPngPath.replace('.png', '.svg');

    // Read PNG and convert to base64
    const pngBuffer = fs.readFileSync(fullPngPath);
    const base64 = pngBuffer.toString('base64');

    // Create SVG wrapper with embedded PNG
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 60 60" width="60" height="60">
  <image width="60" height="60" xlink:href="data:image/png;base64,${base64}"/>
</svg>`;

    fs.writeFileSync(svgPath, svg);
    console.log(`✅ Converted: ${pngPath} -> ${pngPath.replace('.png', '.svg')}`);
  }

  console.log('\nDone! SVG files created.');
}

convertPngToSvg().catch(console.error);
