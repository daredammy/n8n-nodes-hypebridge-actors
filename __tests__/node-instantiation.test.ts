import fs from 'fs';
import path from 'path';

interface TestResult {
  className: string;
  success: boolean;
  errors: string[];
  metadata?: {
    name: string;
    displayName: string;
    description: string;
    icon: string;
    propertiesCount: number;
    hasExecute: boolean;
    credentialsCount: number;
  };
}

function runNodeInstantiationTests(): void {
  const packageJsonPath = path.resolve(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const registeredNodes: string[] = packageJson.n8n?.nodes || [];

  console.log(`\n🔍 Found ${registeredNodes.length} registered nodes in package.json\n`);

  if (registeredNodes.length !== 32) {
    console.error(`❌ Expected 32 registered nodes, found ${registeredNodes.length}`);
  }

  const results: TestResult[] = [];

  for (const nodePath of registeredNodes) {
    const fullJsPath = path.resolve(__dirname, '..', nodePath);
    const classNameMatch = nodePath.match(/dist\/nodes\/([^\/]+)\/\1\.node\.js/);
    const className = classNameMatch ? classNameMatch[1] : path.basename(nodePath, '.node.js');
    const errors: string[] = [];

    if (!fs.existsSync(fullJsPath)) {
      errors.push(`Compiled file does not exist: ${fullJsPath}`);
      results.push({ className, success: false, errors });
      continue;
    }

    try {
      const module = require(fullJsPath);
      const NodeClass = module[className];

      if (!NodeClass) {
        errors.push(`Module does not export class ${className}`);
        results.push({ className, success: false, errors });
        continue;
      }

      const instance = new NodeClass();

      if (!instance.description) {
        errors.push('Instance has no description property');
      }

      const desc = instance.description || {};

      if (!desc.name || typeof desc.name !== 'string') {
        errors.push(`Invalid name: ${desc.name}`);
      }

      if (!desc.displayName || typeof desc.displayName !== 'string') {
        errors.push(`Invalid displayName: ${desc.displayName}`);
      }

      if (!desc.description || typeof desc.description !== 'string') {
        errors.push(`Invalid description: ${desc.description}`);
      }

      if (!desc.icon || desc.icon !== 'file:logo.svg') {
        errors.push(`Invalid icon specifier: ${desc.icon} (expected 'file:logo.svg')`);
      }

      // Check icon on disk in both dist and source
      const distIconPath = path.resolve(path.dirname(fullJsPath), 'logo.svg');
      const srcDir = path.resolve(__dirname, '../nodes', className);
      const srcIconPath = path.resolve(srcDir, 'logo.svg');

      if (!fs.existsSync(distIconPath)) {
        errors.push(`Icon missing in dist: ${distIconPath}`);
      } else {
        const distIcon = fs.readFileSync(distIconPath, 'utf-8');
        if (!distIcon.includes('<svg') || !distIcon.includes('</svg>')) {
          errors.push(`Dist icon is not valid SVG`);
        }
      }

      if (!fs.existsSync(srcIconPath)) {
        errors.push(`Icon missing in source: ${srcIconPath}`);
      } else {
        const srcIcon = fs.readFileSync(srcIconPath, 'utf-8');
        if (!srcIcon.includes('<svg') || !srcIcon.includes('</svg>')) {
          errors.push(`Source icon is not valid SVG`);
        }
      }

      // Check properties
      if (!Array.isArray(desc.properties) || desc.properties.length === 0) {
        errors.push(`Properties missing or empty`);
      } else {
        for (let i = 0; i < desc.properties.length; i++) {
          const prop = desc.properties[i];
          if (!prop.name) {
            errors.push(`Property at index ${i} missing name`);
          }
          if (!prop.displayName) {
            errors.push(`Property "${prop.name}" missing displayName`);
          }
          if (!prop.type) {
            errors.push(`Property "${prop.name}" missing type`);
          }
        }
      }

      // Check execute method
      const hasExecute = typeof instance.execute === 'function';
      if (!hasExecute) {
        errors.push('Missing execute function');
      }

      // Check credentials
      const creds = desc.credentials || [];
      const credNames = creds.map((c: any) => c.name);
      if (!credNames.includes('apifyApi') || !credNames.includes('apifyOAuth2Api')) {
        errors.push(`Missing credentials. Expected apifyApi & apifyOAuth2Api, got: ${credNames.join(', ')}`);
      }

      results.push({
        className,
        success: errors.length === 0,
        errors,
        metadata: {
          name: desc.name,
          displayName: desc.displayName,
          description: desc.description?.slice(0, 50) + (desc.description?.length > 50 ? '...' : ''),
          icon: desc.icon,
          propertiesCount: desc.properties?.length || 0,
          hasExecute,
          credentialsCount: creds.length,
        },
      });
    } catch (err: any) {
      errors.push(`Instantiation threw exception: ${err.message}\n${err.stack}`);
      results.push({ className, success: false, errors });
    }
  }

  // Print results table
  let passedCount = 0;
  console.log('| # | Node Class | Name | Display Name | Props | Icon | Exec | Status |');
  console.log('|---|---|---|---|---|---|---|---|');
  results.forEach((r, idx) => {
    if (r.success) passedCount++;
    const meta = r.metadata;
    console.log(
      `| ${idx + 1} | ${r.className} | ${meta?.name} | ${meta?.displayName} | ${meta?.propertiesCount} | ${meta?.icon} | ${meta?.hasExecute ? 'YES' : 'NO'} | ${r.success ? '✅ PASS' : '❌ FAIL'} |`
    );
    if (!r.success) {
      r.errors.forEach(e => console.log(`    ⚠️ Error: ${e}`));
    }
  });

  console.log(`\nSummary: ${passedCount}/${results.length} nodes passed all instantiation & metadata checks.`);

  // Verify that nodes/ directory contains exactly these 32 nodes and no obsolete ones
  const nodesDir = path.resolve(__dirname, '../nodes');
  const diskNodes = fs.readdirSync(nodesDir).filter(f => fs.statSync(path.join(nodesDir, f)).isDirectory());
  console.log(`\nDisk nodes directory count: ${diskNodes.length}`);
  const registeredClassNames = registeredNodes.map(n => n.split('/')[2]);
  const extraNodes = diskNodes.filter(n => !registeredClassNames.includes(n));
  if (extraNodes.length > 0) {
    console.error(`❌ Unexpected extra node directories found on disk: ${extraNodes.join(', ')}`);
    process.exitCode = 1;
  } else {
    console.log(`✅ Zero orphaned/unregistered directories in nodes/`);
  }

  if (passedCount !== 32 || results.length !== 32) {
    process.exitCode = 1;
  }
}

runNodeInstantiationTests();
