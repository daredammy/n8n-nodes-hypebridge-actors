import fs from 'fs';
import path from 'path';
import type { IExecuteFunctions } from 'n8n-workflow';

interface StressTestResult {
  className: string;
  scenariosRun: number;
  scenariosPassed: number;
  errors: string[];
}

function createMockContext(
  paramResolver: (paramName: string, itemIndex: number, fallback: any) => any
): IExecuteFunctions {
  return {
    getNodeParameter: (paramName: string, itemIndex: number, fallback?: any) => {
      return paramResolver(paramName, itemIndex, fallback);
    },
  } as unknown as IExecuteFunctions;
}

function runBuildActorInputStressTests(): void {
  const packageJsonPath = path.resolve(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const registeredNodes: string[] = packageJson.n8n?.nodes || [];

  console.log(`\n🧪 Stress-testing buildActorInput across ${registeredNodes.length} nodes...\n`);

  const results: StressTestResult[] = [];

  for (const nodePath of registeredNodes) {
    const classNameMatch = nodePath.match(/dist\/nodes\/([^\/]+)\/\1\.node\.js/);
    const className = classNameMatch ? classNameMatch[1] : path.basename(nodePath, '.node.js');
    const propertiesPath = path.resolve(__dirname, `../nodes/${className}/${className}.properties.ts`);

    const result: StressTestResult = {
      className,
      scenariosRun: 0,
      scenariosPassed: 0,
      errors: [],
    };

    if (!fs.existsSync(propertiesPath)) {
      result.errors.push(`Properties file does not exist: ${propertiesPath}`);
      results.push(result);
      continue;
    }

    let buildActorInput: (context: IExecuteFunctions, itemIndex: number, defaultInput: any) => any;
    let actorProperties: any[] = [];
    try {
      const mod = require(propertiesPath);
      buildActorInput = mod.buildActorInput;
      actorProperties = mod.actorProperties || [];
      if (typeof buildActorInput !== 'function') {
        result.errors.push(`buildActorInput is not a function in ${className}.properties.ts`);
        results.push(result);
        continue;
      }
    } catch (err: any) {
      result.errors.push(`Failed to import properties for ${className}: ${err.message}`);
      results.push(result);
      continue;
    }

    const jsonParamNames = actorProperties.filter((p: any) => p.type === 'json').map((p: any) => p.name);

    // --- Scenario 1: Fallback resolver (simulate clean n8n execution with defaults) ---
    result.scenariosRun++;
    try {
      const ctx = createMockContext((_param, _idx, fallback) => fallback);
      const output = buildActorInput(ctx, 0, { baseDefault: true });
      if (!output || typeof output !== 'object') throw new Error('Output is not an object');
      if (output.baseDefault !== true) throw new Error('Default input baseDefault was not preserved');
      result.scenariosPassed++;
    } catch (e: any) {
      result.errors.push(`Scenario 1 (Fallbacks) failed: ${e.message}`);
    }

    // --- Scenario 2: NodeParameter returns undefined for ALL parameters ---
    result.scenariosRun++;
    try {
      const ctx = createMockContext(() => undefined);
      const output = buildActorInput(ctx, 0, {});
      if (!output || typeof output !== 'object') throw new Error('Output is not an object');
      result.scenariosPassed++;
    } catch (e: any) {
      result.errors.push(`Scenario 2 (All Undefined) failed: ${e.message}`);
    }

    // --- Scenario 3: NodeParameter returns null for ALL parameters ---
    result.scenariosRun++;
    try {
      const ctx = createMockContext(() => null);
      const output = buildActorInput(ctx, 0, {});
      if (!output || typeof output !== 'object') throw new Error('Output is not an object');
      result.scenariosPassed++;
    } catch (e: any) {
      result.errors.push(`Scenario 3 (All Null) failed: ${e.message}`);
    }

    // --- Scenario 4: NodeParameter returns empty string "" for ALL parameters ---
    result.scenariosRun++;
    try {
      const ctx = createMockContext(() => '');
      const output = buildActorInput(ctx, 0, {});
      if (!output || typeof output !== 'object') throw new Error('Output is not an object');
      result.scenariosPassed++;
    } catch (e: any) {
      result.errors.push(`Scenario 4 (All Empty String) failed: ${e.message}`);
    }

    // --- Scenario 5: NodeParameter returns whitespace-only strings ---
    result.scenariosRun++;
    try {
      const ctx = createMockContext(() => '   \t\n  ');
      const output = buildActorInput(ctx, 0, {});
      if (!output || typeof output !== 'object') throw new Error('Output is not an object');
      result.scenariosPassed++;
    } catch (e: any) {
      result.errors.push(`Scenario 5 (Whitespace String) failed: ${e.message}`);
    }

    // --- Scenario 6: NodeParameter returns custom objects for ALL parameters ---
    result.scenariosRun++;
    try {
      const ctx = createMockContext(() => ({ customKey: 'val', nested: { a: 1 } }));
      const output = buildActorInput(ctx, 0, { seeded: 123 });
      if (!output || typeof output !== 'object') throw new Error('Output is not an object');
      if (output.seeded !== 123) throw new Error('Seeded defaultInput was clobbered');
      result.scenariosPassed++;
    } catch (e: any) {
      result.errors.push(`Scenario 6 (Custom objects) failed: ${e.message}`);
    }

    // --- Scenario 7: Rich Valid Collections & JSON ---
    result.scenariosRun++;
    try {
      const ctx = createMockContext((param, _idx, fallback) => {
        if (param === 'startUrls') return { items: [{ url: 'https://test.com' }] };
        if (param === 'pairs' || param.includes('headers') || param.includes('env')) {
          return { pairs: [{ key: 'Authorization', value: 'Bearer 123' }] };
        }
        if (param.includes('values')) return { values: [{ value: 'tag1' }, { value: 'tag2' }] };
        if (jsonParamNames.includes(param) || param === 'proxyConfiguration' || param === 'cookies') {
          return '{"useApifyProxy": true}';
        }
        if (typeof fallback === 'number') return 42;
        if (typeof fallback === 'boolean') return true;
        if (Array.isArray(fallback)) return fallback;
        return 'valid_string_value';
      });
      const output = buildActorInput(ctx, 0, { seeded: 123 });
      if (output.seeded !== 123) throw new Error('Seeded defaultInput was clobbered');
      result.scenariosPassed++;
    } catch (e: any) {
      result.errors.push(`Scenario 7 (Rich collections & JSON) failed: ${e.message}`);
    }

    // --- Scenario 8: Malformed fixedCollection shapes ---
    result.scenariosRun++;
    try {
      const ctx = createMockContext((param) => {
        if (param === 'startUrls') return { items: [] };
        if (param === 'headers') return { pairs: [{ key: '', value: 'skip' }, { key: undefined, value: 'skip' }] };
        if (param === 'tags') return { values: [] };
        return {};
      });
      const output = buildActorInput(ctx, 0, {});
      if (!output || typeof output !== 'object') throw new Error('Output is not an object');
      result.scenariosPassed++;
    } catch (e: any) {
      result.errors.push(`Scenario 8 (Malformed collections) failed: ${e.message}`);
    }

    // --- Scenario 9: Extreme defaultInput values (null, undefined, prototype-less) ---
    result.scenariosRun++;
    try {
      const ctx = createMockContext((_param, _idx, fallback) => fallback);
      const outNull = buildActorInput(ctx, 0, null as any);
      if (!outNull || typeof outNull !== 'object') throw new Error('Null defaultInput failed');

      const outUndef = buildActorInput(ctx, 0, undefined as any);
      if (!outUndef || typeof outUndef !== 'object') throw new Error('Undefined defaultInput failed');

      const bareObj = Object.create(null);
      bareObj.custom = 'bare';
      const outBare = buildActorInput(ctx, 0, bareObj);
      if (outBare.custom !== 'bare') throw new Error('Prototype-less object failed');

      result.scenariosPassed++;
    } catch (e: any) {
      result.errors.push(`Scenario 9 (Extreme defaultInput) failed: ${e.message}`);
    }

    // --- Scenario 10: Deterministic Fuzz inputs ---
    result.scenariosRun++;
    try {
      const fuzzValues = [
        null,
        undefined,
        '',
        0,
        -1,
        false,
        true,
        [],
        { custom: 1 },
        '2026-09-14T22:00:00Z',
        '{"validJson": true}',
      ];
      for (let run = 0; run < 10; run++) {
        const ctx = createMockContext((param, idx, fallback) => {
          if (jsonParamNames.includes(param) || param === 'proxyConfiguration' || param === 'cookies') {
            return run % 2 === 0 ? '{"valid": true}' : { valid: true };
          }
          return fuzzValues[(idx + run) % fuzzValues.length] ?? fallback;
        });
        const output = buildActorInput(ctx, run, { fuzzRun: run });
        if (!output || typeof output !== 'object') {
          throw new Error(`Fuzz run ${run} did not return an object`);
        }
      }
      result.scenariosPassed++;
    } catch (e: any) {
      result.errors.push(`Scenario 10 (Fuzz testing) failed: ${e.message}`);
    }

    // --- Scenario 11: Error boundary for JSON parameters (informative syntax error verification) ---
    result.scenariosRun++;
    try {
      if (jsonParamNames.length > 0) {
        for (const jParam of jsonParamNames) {
          const ctx = createMockContext((param, _idx, fallback) => {
            if (param === jParam) return '{ bad json string ';
            return fallback;
          });
          let caught = false;
          try {
            buildActorInput(ctx, 0, {});
          } catch (err: any) {
            caught = true;
            if (!err.message.includes(`Invalid JSON in parameter "${jParam}"`)) {
              throw new Error(`Expected descriptive error for ${jParam}, got: ${err.message}`);
            }
          }
          if (!caught) {
            throw new Error(`Expected JSON parse error for invalid JSON in ${jParam}, but none was thrown`);
          }
        }
      }
      result.scenariosPassed++;
    } catch (e: any) {
      result.errors.push(`Scenario 11 (JSON Error Boundary) failed: ${e.message}`);
    }

    results.push(result);
  }

  // Print results table
  console.log('| # | Node Class | Scenarios Run | Passed | Status |');
  console.log('|---|---|---|---|---|');
  let totalScenarios = 0;
  let totalPassed = 0;
  let failedNodes = 0;

  results.forEach((r, idx) => {
    totalScenarios += r.scenariosRun;
    totalPassed += r.scenariosPassed;
    const passed = r.scenariosPassed === r.scenariosRun && r.errors.length === 0;
    if (!passed) failedNodes++;
    console.log(`| ${idx + 1} | ${r.className} | ${r.scenariosRun} | ${r.scenariosPassed} | ${passed ? '✅ PASS' : '❌ FAIL'} |`);
    if (!passed) {
      r.errors.forEach(e => console.log(`    ⚠️ ${e}`));
    }
  });

  console.log(`\nSummary: ${totalPassed}/${totalScenarios} test scenarios passed across ${results.length} nodes.`);
  if (failedNodes > 0) {
    console.error(`❌ ${failedNodes} nodes failed buildActorInput stress tests!`);
    process.exit(1);
  } else {
    console.log('🎉 ZERO runtime exceptions across all 32 nodes under all stress test scenarios!\n');
  }
}

runBuildActorInputStressTests();
