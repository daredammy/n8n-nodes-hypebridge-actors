import { ApifyClient } from 'apify-client';
import { convertApifyToN8n } from '../scripts/actorSchemaConverter';
import path from 'path';

interface DriftCheckActor {
  id: string;
  name: string;
  className: string;
  specificChecks?: (liveProps: any[], nodeProps: any[]) => string[];
}

const DRIFTED_ACTORS: DriftCheckActor[] = [
  {
    id: 'r2s0hWJVbB7M0JPxj',
    name: 'eventeny-vendor-market-directory',
    className: 'ApifyEventenyVendorMarketDirectory',
    specificChecks: (liveProps, nodeProps) => {
      const issues: string[] = [];
      const getDetailsProp = nodeProps.find((p: any) => p.name === 'getDetails');
      if (!getDetailsProp) {
        issues.push('Missing getDetails property');
      } else if (getDetailsProp.default !== true) {
        issues.push(`getDetails default is ${getDetailsProp.default}, expected true`);
      }
      return issues;
    },
  },
  {
    id: 'XIUAyRsGZ5I3g1kxi',
    name: 'find-events',
    className: 'ApifyFindEvents',
    specificChecks: (liveProps, nodeProps) => {
      const issues: string[] = [];
      const platformsProp = nodeProps.find((p: any) => p.name === 'platforms');
      if (!platformsProp) {
        issues.push('Missing platforms property');
      } else {
        const defaultPlatforms = platformsProp.default;
        if (!Array.isArray(defaultPlatforms)) {
          issues.push(`platforms default is not an array: ${JSON.stringify(defaultPlatforms)}`);
        } else if (defaultPlatforms.length !== 0) {
          issues.push(`platforms default must be empty for Auto mode, got ${JSON.stringify(defaultPlatforms)}`);
        }
      }
      return issues;
    },
  },
  {
    id: 'wMq6Lnj8aX8EVRRTa',
    name: 'influencer-evaluation-agent-instagram-tiktok',
    className: 'ApifyInfluencerEvaluationAgentInstagramTiktok',
    specificChecks: (liveProps, nodeProps) => {
      const issues: string[] = [];
      const handleProp = nodeProps.find((p: any) => p.name === 'influencerHandle');
      if (!handleProp) {
        issues.push('Missing influencerHandle property');
      } else {
        const desc = handleProp.description || '';
        if (!desc.toLowerCase().includes('instagram') || !desc.toLowerCase().includes('tiktok')) {
          issues.push(`influencerHandle description does not mention instagram and tiktok: ${desc}`);
        }
      }
      return issues;
    },
  },
  {
    id: '8cRUPgqAkvHAmL4Wn',
    name: 'partiful-events-scraper',
    className: 'ApifyPartifulEventsScraper',
    specificChecks: (liveProps, nodeProps) => {
      const issues: string[] = [];
      // Verify node.ts has PACKAGE_NAME and subtitle 'Run Actor'
      const nodeTsPath = path.resolve(__dirname, `../nodes/ApifyPartifulEventsScraper/ApifyPartifulEventsScraper.node.ts`);
      const fs = require('fs');
      const content = fs.readFileSync(nodeTsPath, 'utf-8');
      if (!content.includes("export const PACKAGE_NAME = 'n8n-nodes-hypebridge-actors'")) {
        issues.push('PACKAGE_NAME in ApifyPartifulEventsScraper.node.ts is incorrect');
      }
      if (!content.includes("subtitle: 'Run Actor'")) {
        issues.push("subtitle in ApifyPartifulEventsScraper.node.ts is not 'Run Actor'");
      }
      return issues;
    },
  },
];

async function verifyDriftedSchemas(): Promise<void> {
  console.log('\n📡 Connecting to live Apify Platform to verify drifted schemas...\n');
  const client = new ApifyClient({ token: process.env.APIFY_TOKEN });

  let allPassed = true;

  for (const actorInfo of DRIFTED_ACTORS) {
    console.log(`Checking [${actorInfo.name}] (ID: ${actorInfo.id})...`);

    // 1. Fetch live actor
    const actor = await client.actor(actorInfo.id).get();
    if (!actor) {
      console.error(`  ❌ Failed to fetch actor ${actorInfo.id}`);
      allPassed = false;
      continue;
    }

    const defaultBuildTag = actor.defaultRunOptions?.build || 'latest';
    const buildId = actor.taggedBuilds?.[defaultBuildTag]?.buildId;
    if (!buildId) {
      console.error(`  ❌ Default build not found for actor ${actorInfo.id}`);
      allPassed = false;
      continue;
    }

    const build = await client.build(buildId).get();
    if (!build?.actorDefinition?.input) {
      console.error(`  ❌ Build ${buildId} does not have actorDefinition.input`);
      allPassed = false;
      continue;
    }

    const liveInputSchema = build.actorDefinition.input;
    const expectedN8nProperties = convertApifyToN8n(liveInputSchema);

    // 2. Load generated properties from compiled node
    const modulePath = path.resolve(__dirname, `../dist/nodes/${actorInfo.className}/${actorInfo.className}.node.js`);
    const mod = require(modulePath);
    const instance = new mod[actorInfo.className]();
    // In compiled node, properties is on instance.description.properties (ignoring authentication property at idx 0)
    const nodeAllProperties = instance.description.properties || [];
    const nodeProperties = nodeAllProperties.filter((p: any) => p.name !== 'authentication');

    // 3. Compare property count
    console.log(`  Live schema property count: ${expectedN8nProperties.length}`);
    console.log(`  Node schema property count: ${nodeProperties.length}`);

    if (expectedN8nProperties.length !== nodeProperties.length) {
      console.error(`  ❌ Property count mismatch! Live: ${expectedN8nProperties.length}, Node: ${nodeProperties.length}`);
      allPassed = false;
    }

    // 4. Compare each property name, type, default, required
    const liveNames = expectedN8nProperties.map(p => p.name);
    const nodeNames = nodeProperties.map(p => p.name);

    for (const expProp of expectedN8nProperties) {
      const actProp = nodeProperties.find(p => p.name === expProp.name);
      if (!actProp) {
        console.error(`  ❌ Missing property: ${expProp.name}`);
        allPassed = false;
        continue;
      }

      if (actProp.type !== expProp.type) {
        console.error(`  ❌ Property ${expProp.name} type mismatch: expected ${expProp.type}, got ${actProp.type}`);
        allPassed = false;
      }

      if (actProp.required !== expProp.required) {
        console.error(`  ❌ Property ${expProp.name} required mismatch: expected ${expProp.required}, got ${actProp.required}`);
        allPassed = false;
      }

      // Check default value equality
      const actDef = JSON.stringify(actProp.default);
      const expDef = JSON.stringify(expProp.default);
      if (actDef !== expDef) {
        console.error(`  ❌ Property ${expProp.name} default mismatch:\n    Expected: ${expDef}\n    Actual:   ${actDef}`);
        allPassed = false;
      }
    }

    // 5. Run actor-specific checks
    if (actorInfo.specificChecks) {
      const issues = actorInfo.specificChecks(expectedN8nProperties, nodeProperties);
      if (issues.length > 0) {
        issues.forEach(i => console.error(`  ❌ Specific check failed: ${i}`));
        allPassed = false;
      } else {
        console.log(`  ✅ Passed actor-specific drift checks`);
      }
    }

    console.log(`  ✅ ${actorInfo.className} matches live Apify platform build ${buildId} (Tag: ${defaultBuildTag})\n`);
  }

  if (!allPassed) {
    console.error('❌ Drifted schemas verification FAILED.');
    process.exit(1);
  } else {
    console.log('🎉 All 4 drifted schemas match live Apify platform schemas with 100% fidelity!\n');
  }
}

verifyDriftedSchemas().catch(err => {
  console.error('Fatal error verifying drifted schemas:', err);
  process.exit(1);
});
