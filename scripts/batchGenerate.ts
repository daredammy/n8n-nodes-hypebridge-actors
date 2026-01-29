// @ts-nocheck
import { ApifyClient } from 'apify-client';
import fs from 'fs';
import path from 'path';
import { createActorAppSchemaForN8n } from './actorSchemaConverter';
import type { INodeProperties } from 'n8n-workflow';
import chalk from 'chalk';

const ACTORS = [
  { id: 'RjlsknvHDKDBbrNVX', name: 'eventbrite-search' },
  { id: '9H947AEOMEGDjwWQF', name: 'draftkings-predictions' },
  { id: 'RNlctZLFgonQhtzMy', name: 'eater' },
  { id: 'h4IM5lZDxLlFcQ3yx', name: 'blind-post-comments-scraper' },
  { id: 'roLLcGwYo8k6afKnH', name: 'eventnoire' },
  { id: 'wMq6Lnj8aX8EVRRTa', name: 'influencer-evaluation-agent-instagram-tiktok' },
  { id: 'CuHJ7SN96LdHDGAgk', name: 'dice-fm' },
  { id: 'DKn2bTBmsX7hLjpHS', name: 'prekindle' },
  { id: 'C73oJlNgIn3YtMqKz', name: 'shotgun-live' },
  { id: '44NPXm3vet7y8B0xY', name: 'posh-vip' },
  { id: 'glRc5oz3NacDyGQl3', name: 'influencer-discovery-agent-instagram-tiktok' },
];

const PACKAGE_NAME = 'n8n-nodes-hypebridge-actors';
const X_PLATFORM_HEADER_ID = 'n8n';

function toClassName(name: string): string {
  return 'Apify' + name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

function toCamelCase(className: string): string {
  return className.charAt(0).toLowerCase() + className.slice(1);
}

interface BuildResult {
  paramAssignments: string[];
  usesFixedCollection: boolean;
  usesJson: boolean;
  usesOptional: boolean;
}

function buildParameterAssignments(properties: INodeProperties[]): BuildResult {
  const paramAssignments: string[] = [];
  let usesFixedCollection = false;
  let usesJson = false;
  let usesOptional = false;

  for (const prop of properties) {
    const displayName = prop.displayName || prop.name;
    const comment = `		// ${displayName} (${prop.name})`;

    if (prop.type === 'fixedCollection') {
      usesFixedCollection = true;
      for (const option of prop.options ?? []) {
        const transformType = option.name === 'values' ? 'mapValues' : 'passthrough';
        paramAssignments.push(`${comment}
		...getFixedCollectionParam(context, '${prop.name}', itemIndex, '${option.name}', '${transformType}'),`);
      }
    } else if (prop.type === 'json') {
      usesJson = true;
      paramAssignments.push(`${comment}
		...getJsonParam(context, '${prop.name}', itemIndex),`);
    } else if (prop.type === 'number') {
      paramAssignments.push(
        `${comment}\n		${prop.name}: context.getNodeParameter('${prop.name}', itemIndex),`
      );
    } else if (prop.type === 'dateTime' || (prop.type === 'string' && !prop.required)) {
      usesOptional = true;
      paramAssignments.push(`${comment}
		...getOptionalParam(context, '${prop.name}', itemIndex),`);
    } else {
      paramAssignments.push(
        `${comment}\n		${prop.name}: context.getNodeParameter('${prop.name}', itemIndex),`
      );
    }
  }

  return { paramAssignments, usesFixedCollection, usesJson, usesOptional };
}

function generateNodeTs(className: string, actorId: string, displayName: string, description: string): string {
  const classNameCamel = toCamelCase(className);
  const escapedDescription = description.replace(/'/g, "\\'").replace(/\n/g, ' ');

  return `import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';
import { properties } from './${className}.properties';
import { runActor } from './helpers/executeActor';

// SNIPPET 1: Actor schema constants
export const ACTOR_ID = '${actorId}' as string;

export const PACKAGE_NAME = '${PACKAGE_NAME}' as string;
export const CLASS_NAME = '${className}' as string;
export const ClassNameCamel = '${classNameCamel}' as string;

export const X_PLATFORM_HEADER_ID = '${X_PLATFORM_HEADER_ID}' as string;
export const X_PLATFORM_APP_HEADER_ID = '${actorId}' as string;

export const DISPLAY_NAME = '${displayName}' as string;
export const DESCRIPTION = '${escapedDescription}' as string;

export class ${className} implements INodeType {
	description: INodeTypeDescription = {
		displayName: DISPLAY_NAME,
		name: ClassNameCamel,

		// SNIPPET 2: Node icon
		icon: 'file:logo.svg',
		group: ['transform'],
		version: [1],
		defaultVersion: 1,

		// SNIPPET 3: Subtitle
		subtitle: 'Run Actor',

		// SNIPPET 4: Node description
		description: DESCRIPTION,
		defaults: {
			name: DISPLAY_NAME,
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		usableAsTool: true,
		credentials: [
			{
				displayName: 'Apify API key connection',
				name: 'apifyApi',
				required: false,
				displayOptions: {
					show: {
						authentication: ['apifyApi'],
					},
				},
			},
			{
				displayName: 'Apify OAuth2 connection',
				name: 'apifyOAuth2Api',
				required: false,
				displayOptions: {
					show: {
						authentication: ['apifyOAuth2Api'],
					},
				},
			},
		],

		properties,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const data = await runActor.call(this, i);

				const addPairedItem = (item: INodeExecutionData) => ({
					...item,
					pairedItem: { item: i },
				});

				if (Array.isArray(data)) {
					returnData.push(...data.map(addPairedItem));
				} else {
					returnData.push(addPairedItem(data));
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: error.message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
`;
}

function generateGenericFunctions(className: string): string {
  const classNameCamel = toCamelCase(className);

  return `import {
	NodeApiError,
	NodeOperationError,
	sleep,
	type IExecuteFunctions,
	type IHookFunctions,
	type ILoadOptionsFunctions,
	type IHttpRequestOptions,
} from 'n8n-workflow';
import { ClassNameCamel, X_PLATFORM_APP_HEADER_ID, X_PLATFORM_HEADER_ID } from '../${className}.node';

type IApiRequestOptions = Omit<IHttpRequestOptions, 'url'> & {
	uri?: string;
	url?: string;
};

export async function apiRequest(
	this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions,
	requestOptions: IApiRequestOptions,
): Promise<any> {
	const { method = 'GET', qs, uri, ...rest } = requestOptions;

	const query = qs || {};
	const endpoint = \`https://api.apify.com\${uri ?? ''}\`;

	const headers: Record<string, string> = {
		'x-apify-integration-platform': X_PLATFORM_HEADER_ID,
		...(X_PLATFORM_APP_HEADER_ID && { 'x-apify-integration-app-id': X_PLATFORM_APP_HEADER_ID }),
	};

	if (isUsedAsAiTool(this.getNode().type)) {
		headers['x-apify-integration-ai-tool'] = 'true';
	}

	const options: IHttpRequestOptions = {
		...rest,
		method,
		qs: query,
		url: endpoint,
		headers,
		json: true,
	};

	if (method === 'GET' && 'body' in options) {
		delete options.body;
	}

	try {
		const authenticationMethod = this.getNodeParameter('authentication', 0) as string;

		try {
			await this.getCredentials(authenticationMethod);
		} catch {
			throw new NodeOperationError(
				this.getNode(),
				\`No valid credentials found for \${authenticationMethod}. Please configure them first.\`,
			);
		}

		return await this.helpers.httpRequestWithAuthentication.call(
			this,
			authenticationMethod,
			options,
		);
	} catch (error) {
		if (error instanceof NodeApiError) throw error;

		if (error.response?.body) {
			throw new NodeApiError(this.getNode(), error, {
				message: error.response.body,
				description: error.message,
			});
		}

		throw new NodeApiError(this.getNode(), error);
	}
}

export function isUsedAsAiTool(nodeType: string): boolean {
	const parts = nodeType.split('.');
	return parts[parts.length - 1] === \`\${ClassNameCamel}Tool\`;
}

export async function pollRunStatus(
	this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions,
	runId: string,
): Promise<any> {
	let lastRunData: any;
	while (true) {
		try {
			const pollResult = await apiRequest.call(this, {
				method: 'GET',
				uri: \`/v2/actor-runs/\${runId}\`,
			});

			const status = pollResult?.data?.status;
			lastRunData = pollResult?.data;
			if (['SUCCEEDED', 'FAILED', 'TIMED-OUT', 'ABORTED'].includes(status)) break;
		} catch (err) {
			throw new NodeApiError(this.getNode(), {
				message: \`Error polling run status: \${err}\`,
			});
		}
		await sleep(1000);
	}
	return lastRunData;
}

export async function getResults(this: IExecuteFunctions, datasetId: string): Promise<any> {
	const results = await apiRequest.call(this, {
		method: 'GET',
		uri: \`/v2/datasets/\${datasetId}/items\`,
	});

	// SNIPPET 5: AI Agent tool usage optimizations
	if (isUsedAsAiTool(this.getNode().type)) {
		// results = results.map((item: any) => ({ markdown: item.markdown }));
	}

	return this.helpers.returnJsonArray(results);
}
`;
}

function generateExecuteActor(className: string): string {
  return `import { IExecuteFunctions, INodeExecutionData, NodeApiError } from 'n8n-workflow';
import { apiRequest, getResults, isUsedAsAiTool, pollRunStatus } from './genericFunctions';
import { ACTOR_ID } from '../${className}.node';
import { buildActorInput } from '../${className}.properties';

export async function getDefaultBuild(this: IExecuteFunctions, actorId: string) {
	const defaultBuildResp = await apiRequest.call(this, {
		method: 'GET',
		uri: \`/v2/acts/\${actorId}/builds/default\`,
	});
	if (!defaultBuildResp?.data) {
		throw new NodeApiError(this.getNode(), {
			message: \`Could not fetch default build for Actor \${actorId}\`,
		});
	}
	return defaultBuildResp.data;
}

export function getDefaultInputsFromBuild(build: any) {
	const buildInputProperties = build?.actorDefinition?.input?.properties;
	const defaultInput: Record<string, any> = {};
	if (buildInputProperties && typeof buildInputProperties === 'object') {
		for (const [key, property] of Object.entries(buildInputProperties)) {
			if (
				property &&
				typeof property === 'object' &&
				'prefill' in property &&
				(property as any).prefill !== undefined &&
				(property as any).prefill !== null
			) {
				defaultInput[key] = (property as any).prefill;
			}
		}
	}
	return defaultInput;
}

export async function runActorApi(
	this: IExecuteFunctions,
	actorId: string,
	mergedInput: Record<string, any>,
	qs: Record<string, any>,
) {
	return await apiRequest.call(this, {
		method: 'POST',
		uri: \`/v2/acts/\${actorId}/runs\`,
		body: mergedInput,
		qs,
	});
}

export async function runActor(this: IExecuteFunctions, i: number): Promise<INodeExecutionData> {
	const build = await getDefaultBuild.call(this, ACTOR_ID);
	const defaultInput = getDefaultInputsFromBuild(build);
	const mergedInput = buildActorInput(this, i, defaultInput);

	const run = await runActorApi.call(this, ACTOR_ID, mergedInput, { waitForFinish: 0 });
	if (!run?.data?.id) {
		throw new NodeApiError(this.getNode(), {
			message: \`Run ID not found after running the Actor\`,
		});
	}

	const runId = run.data.id;
	const datasetId = run.data.defaultDatasetId;
	const lastRunData = await pollRunStatus.call(this, runId);
	const resultData = await getResults.call(this, datasetId);

	if (isUsedAsAiTool(this.getNode().type)) {
		return { json: { ...resultData } };
	}

	return { json: { ...lastRunData, ...resultData } };
}
`;
}

function generatePropertiesTs(
  properties: INodeProperties[],
  paramAssignments: string[],
  usesFixedCollection: boolean,
  usesJson: boolean,
  usesOptional: boolean
): string {
  const propsJson = JSON.stringify(properties, null, 2);

  const fixedCollectionFn = usesFixedCollection ? `
function getFixedCollectionParam(
	context: IExecuteFunctions,
	paramName: string,
	itemIndex: number,
	optionName: string,
	transformType: 'passthrough' | 'mapValues',
): Record<string, any> {
	const param = context.getNodeParameter(paramName, itemIndex, {}) as { [key: string]: any[] };
	if (!param?.[optionName]?.length) return {};

	let result = param[optionName];
	if (transformType === 'mapValues') {
		result = result.map((item: any) => item.value);
	}
	return { [paramName]: result };
}
` : '';

  const jsonFn = usesJson ? `
function getJsonParam(context: IExecuteFunctions, paramName: string, itemIndex: number): Record<string, any> {
	try {
		const rawValue = context.getNodeParameter(paramName, itemIndex);
		if (typeof rawValue === 'string' && rawValue.trim() === '') {
			return {};
		}
		return { [paramName]: typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue };
	} catch (error) {
		throw new Error(\`Invalid JSON in parameter "\${paramName}": \${(error as Error).message}\`);
	}
}
` : '';

  const optionalFn = usesOptional ? `
function getOptionalParam(context: IExecuteFunctions, paramName: string, itemIndex: number): Record<string, any> {
	const value = context.getNodeParameter(paramName, itemIndex);
	return value !== undefined && value !== null && value !== '' ? { [paramName]: value } : {};
}
` : '';

  return `import { IExecuteFunctions, INodeProperties } from 'n8n-workflow';
${fixedCollectionFn}${jsonFn}${optionalFn}
export function buildActorInput(
	context: IExecuteFunctions,
	itemIndex: number,
	defaultInput: Record<string, any>,
): Record<string, any> {
	return {
		...defaultInput,
${paramAssignments.join('\n')}
	};
}

const authenticationProperties: INodeProperties[] = [
	{
		displayName: 'Authentication',
		name: 'authentication',
		type: 'options',
		options: [
			{
				name: 'API Key',
				value: 'apifyApi',
			},
			{
				name: 'OAuth2',
				value: 'apifyOAuth2Api',
			},
		],
		default: 'apifyApi',
		description: 'Choose which authentication method to use',
	},
];

export const actorProperties: INodeProperties[] = ${propsJson};

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
`;
}

function generateNodeJson(className: string, actorName: string): object {
  const classNameCamel = toCamelCase(className);

  return {
    node: `n8n-nodes-base.${classNameCamel}`,
    nodeVersion: '1.0',
    codexVersion: '1.0',
    categories: ['Data & Storage', 'Marketing & Content'],
    resources: {
      primaryDocumentation: [
        {
          url: `https://apify.com/hypebridge/${actorName}`,
        },
      ],
    },
    alias: [actorName.replace(/-/g, ' '), 'apify', 'scraper', 'automation', 'hypebridge'],
  };
}

async function generateNode(client: ApifyClient, actorId: string, actorName: string): Promise<string> {
  const className = toClassName(actorName);
  const nodeDir = path.resolve(`./nodes/${className}`);

  console.log(chalk.blue(`\n📦 Generating node for ${chalk.bold(actorName)}...`));

  // Get actor info
  const actor = await client.actor(actorId).get();
  if (!actor) {
    throw new Error(`Actor ${actorId} not found`);
  }

  // Create node directory
  if (fs.existsSync(nodeDir)) {
    console.log(chalk.yellow(`  ⚠️  Directory ${className} exists, removing...`));
    fs.rmSync(nodeDir, { recursive: true });
  }

  fs.mkdirSync(nodeDir, { recursive: true });
  fs.mkdirSync(path.join(nodeDir, 'helpers'), { recursive: true });

  // Create placeholder logo (replace with actual logo after generation)
  const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60" height="60">
  <rect width="60" height="60" rx="8" fill="#00AAFF"/>
  <text x="30" y="38" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">A</text>
</svg>`;
  fs.writeFileSync(path.join(nodeDir, 'logo.svg'), placeholderSvg);

  // Get properties from actor schema
  const properties = await createActorAppSchemaForN8n(client, actor) as INodeProperties[];
  const { paramAssignments, usesFixedCollection, usesJson, usesOptional } = buildParameterAssignments(properties);

  const displayName = actor.title || actorName;
  const description = actor.description || `Run the ${displayName} Actor on Apify`;

  // Generate node.ts
  fs.writeFileSync(
    path.join(nodeDir, `${className}.node.ts`),
    generateNodeTs(className, actorId, displayName, description)
  );

  // Generate properties.ts
  fs.writeFileSync(
    path.join(nodeDir, `${className}.properties.ts`),
    generatePropertiesTs(properties, paramAssignments, usesFixedCollection, usesJson, usesOptional)
  );

  // Generate helpers/genericFunctions.ts
  fs.writeFileSync(
    path.join(nodeDir, 'helpers', 'genericFunctions.ts'),
    generateGenericFunctions(className)
  );

  // Generate helpers/executeActor.ts
  fs.writeFileSync(
    path.join(nodeDir, 'helpers', 'executeActor.ts'),
    generateExecuteActor(className)
  );

  // Generate node.json
  fs.writeFileSync(
    path.join(nodeDir, `${className}.node.json`),
    JSON.stringify(generateNodeJson(className, actorName), null, 2)
  );

  console.log(chalk.green(`  ✅ Generated ${className}`));
  return className;
}

async function updatePackageJson(classNames: string[]) {
  const packageJsonPath = path.resolve('./package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  packageJson.name = PACKAGE_NAME;
  packageJson.version = '1.0.0';
  packageJson.description = 'n8n community nodes for Hypebridge Apify actors - event scrapers, influencer tools, and more';
  packageJson.author = {
    name: 'Hypebridge',
    email: 'hello@hypebridge.io',
  };

  // Update nodes list
  packageJson.n8n.nodes = classNames.map(
    (className) => `dist/nodes/${className}/${className}.node.js`
  );

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log(chalk.green('\n✅ Updated package.json'));
}

async function main() {
  console.log(chalk.bold.cyan('\n🚀 Batch generating n8n nodes for Hypebridge actors...\n'));

  const client = new ApifyClient({
    token: process.env.APIFY_TOKEN,
  });

  const classNames: string[] = [];

  for (const actor of ACTORS) {
    try {
      const className = await generateNode(client, actor.id, actor.name);
      classNames.push(className);
    } catch (error: any) {
      console.error(chalk.red(`  ❌ Failed to generate ${actor.name}: ${error.message}`));
    }
  }

  await updatePackageJson(classNames);

  console.log(chalk.bold.green('\n🎉 Batch generation complete!'));
  console.log(chalk.cyan(`\nGenerated ${classNames.length} nodes:`));
  classNames.forEach((name) => console.log(`  - ${name}`));

  console.log(chalk.yellow('\n📋 Next steps:'));
  console.log('  1. npm run build');
  console.log('  2. npm run dev  (to test locally)');
  console.log('  3. npm publish  (when ready)');
}

main().catch(console.error);
