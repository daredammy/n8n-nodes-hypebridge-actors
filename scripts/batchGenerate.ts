// @ts-nocheck
import { ApifyClient } from 'apify-client';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import sharp from 'sharp';
import { createActorAppSchemaForN8n } from './actorSchemaConverter';
import type { INodeProperties } from 'n8n-workflow';
import chalk from 'chalk';

const ACTORS = [
  { id: 'XIUAyRsGZ5I3g1kxi', name: 'find-events' },
  { id: 'RjlsknvHDKDBbrNVX', name: 'eventbrite-search' },
  { id: '9H947AEOMEGDjwWQF', name: 'draftkings-predictions' },
  { id: 'RNlctZLFgonQhtzMy', name: 'eater' },
  { id: 'h4IM5lZDxLlFcQ3yx', name: 'blind-post-scraper' },
  { id: 'roLLcGwYo8k6afKnH', name: 'eventnoire' },
  { id: 'wMq6Lnj8aX8EVRRTa', name: 'influencer-evaluation-agent-instagram-tiktok' },
  { id: 'CuHJ7SN96LdHDGAgk', name: 'dice-fm' },
  { id: 'DKn2bTBmsX7hLjpHS', name: 'prekindle' },
  { id: 'JFxrdGYYPZYL1Lree', name: 'luma-com-event-scraper' },
  { id: 'C73oJlNgIn3YtMqKz', name: 'shotgun-live' },
  { id: '44NPXm3vet7y8B0xY', name: 'posh-vip' },
  { id: 'glRc5oz3NacDyGQl3', name: 'influencer-discovery-agent-instagram-tiktok' },
  { id: '8XMqU9wbHagBrsqVM', name: 'nfm' },
  { id: 'OZnsMd2g4Ny9wKMgE', name: 'goodfirms-agency-scraper' },
  { id: 'Frgkvw77h8aJOCL2D', name: 'filmfreeway-festival-scraper' },
  { id: 'iPe2FRxtDIOuFJQUC', name: 'showpass-event-scraper' },
  { id: 'r2s0hWJVbB7M0JPxj', name: 'eventeny-vendor-market-directory' },
  { id: '8cRUPgqAkvHAmL4Wn', name: 'partiful-events-scraper' },
  { id: 'pxAxPv5iilYB1qYqV', name: 'shop-app-scraper' },
  { id: 'aNO4odb23qzDTuNj2', name: 'shein-scraper' },
  { id: '7aM68FMx47ef3CHPc', name: 'meetup-scraper-all-urls' },
  { id: 'Jd8z3QPUhuSC2QtmI', name: 'fashionnova-scraper' },
  { id: '2UQ5B1IEeeqma9NhE', name: 'economic-calendar-api' },
  { id: 'jD4xGn5nPuPJJtzf7', name: 'whop-campaign-intelligence' },
  { id: 'cYqlsDgeqdqNbeUvJ', name: 'escortalligator-listcrawler' },
  { id: 'oArh9wsCGUj8gwEvr', name: 'hypebridge-brand-fit' },
  { id: '6tKzSq2IuChkRGbuc', name: 'podcast-transcript-mention-extractor' },
  { id: 'AUvquCIU6GMq59Rpj', name: 'sympla-events-scraper' },
  { id: '8CFqYmM8J7RKqEu4s', name: 'runsignup-race-scraper' },
  { id: 'k5cyg7zhR5qwZOTbc', name: 'adaptive-web-scraper' },
  { id: '5aM34Os04KwJdeeGf', name: 'google-populartimes' },
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
  usesDate: boolean;
  usesJson: boolean;
  usesOptional: boolean;
}

function buildParameterAssignments(properties: INodeProperties[]): BuildResult {
  const paramAssignments: string[] = [];
  let usesFixedCollection = false;
  let usesDate = false;
  let usesJson = false;
  let usesOptional = false;

  for (const prop of properties) {
    const displayName = prop.displayName || prop.name;
    const comment = `		// ${displayName} (${prop.name})`;

    if (prop.type === 'fixedCollection') {
      usesFixedCollection = true;
      for (const option of prop.options ?? []) {
        let transformType = 'passthrough';
        if (option.name === 'values') {
          transformType = 'mapValues';
        } else if (option.name === 'pairs') {
          transformType = 'keyValue';
        }
        paramAssignments.push(`${comment}
		...getFixedCollectionParam(context, '${prop.name}', itemIndex, '${option.name}', '${transformType}'),`);
      }
    } else if (prop.type === 'json') {
      usesJson = true;
      paramAssignments.push(`${comment}
		...getJsonParam(context, '${prop.name}', itemIndex),`);
    } else if (prop.type === 'dateTime') {
      usesDate = true;
      paramAssignments.push(`${comment}
		...getDateParam(context, '${prop.name}', itemIndex),`);
    } else if ((prop.type === 'string' || prop.type === 'options') && !prop.required) {
      usesOptional = true;
      paramAssignments.push(`${comment}
		...getOptionalParam(context, '${prop.name}', itemIndex),`);
    } else if (prop.type === 'number') {
      const fallback = prop.default !== undefined ? JSON.stringify(prop.default) : 0;
      paramAssignments.push(
        `${comment}\n		${prop.name}: context.getNodeParameter('${prop.name}', itemIndex, ${fallback}),`
      );
    } else {
      const fallback = prop.default !== undefined ? JSON.stringify(prop.default) : 'undefined';
      paramAssignments.push(
        `${comment}\n		${prop.name}: context.getNodeParameter('${prop.name}', itemIndex, ${fallback}),`
      );
    }
  }

  return { paramAssignments, usesFixedCollection, usesDate, usesJson, usesOptional };
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

export async function runActor(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
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
		return Array.isArray(resultData) && resultData.length > 0 ? resultData : [{ json: {} }];
	}

	if (Array.isArray(resultData) && resultData.length > 0) {
		return resultData;
	}

	return [{ json: { ...lastRunData } }];
}
`;
}

function generatePropertiesTs(
  properties: INodeProperties[],
  paramAssignments: string[],
  usesFixedCollection: boolean,
  usesDate: boolean,
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
	transformType: 'passthrough' | 'mapValues' | 'keyValue',
): Record<string, any> {
	const param = context.getNodeParameter(paramName, itemIndex, {}) as { [key: string]: any[] };
	if (!param?.[optionName]?.length) return {};

	let result: any = param[optionName];
	if (transformType === 'mapValues') {
		result = result.map((item: any) => item.value);
	} else if (transformType === 'keyValue') {
		const kvObj: Record<string, any> = {};
		for (const item of result) {
			if (item.key !== undefined && item.key !== '') {
				kvObj[item.key] = item.value;
			}
		}
		result = kvObj;
	}
	return { [paramName]: result };
}
` : '';

  const dateFn = usesDate ? `
function getDateParam(context: IExecuteFunctions, paramName: string, itemIndex: number): Record<string, any> {
	const value = context.getNodeParameter(paramName, itemIndex, undefined);
	if (value === undefined || value === null || value === '') return {};
	const date = String(value).slice(0, 10);
	return { [paramName]: date };
}
` : '';

  const jsonFn = usesJson ? `
function getJsonParam(context: IExecuteFunctions, paramName: string, itemIndex: number): Record<string, any> {
	try {
		const rawValue = context.getNodeParameter(paramName, itemIndex, undefined);
		if (rawValue === undefined || rawValue === null || rawValue === '' || (typeof rawValue === 'string' && rawValue.trim() === '')) {
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
	const value = context.getNodeParameter(paramName, itemIndex, undefined);
	return value !== undefined && value !== null && value !== '' ? { [paramName]: value } : {};
}
` : '';

  return `import { IExecuteFunctions, INodeProperties } from 'n8n-workflow';
${fixedCollectionFn}${dateFn}${jsonFn}${optionalFn}
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

function downloadBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    client.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadBuffer(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Status ${res.statusCode}`));
      }
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

const FALLBACK_SVG = `<svg width="60" height="60" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M86.0214 0H147.727C148.982 0 150 1.01753 150 2.27273V96.5744C150 98.8332 147.062 99.7089 145.826 97.8188L84.1196 3.51714C83.1305 2.00559 84.215 0 86.0214 0Z" fill="#246DFF"/>
<path d="M63.9786 0H2.27273C1.01753 0 0 1.01753 0 2.27273V96.5744C0 98.8332 2.93774 99.7089 4.1745 97.8188L65.8804 3.51714C66.8695 2.00559 65.785 0 63.9786 0Z" fill="#20A34E"/>
<path d="M73.9429 75.5012L3.84485 146.126C2.42137 147.56 3.43724 150 5.45792 150H144.6C146.612 150 147.632 147.578 146.225 146.139L77.1811 75.5135C76.2942 74.6063 74.8365 74.6008 73.9429 75.5012Z" fill="#F86606"/>
</svg>`;

async function generateLogoSvg(actor: any, nodeDir: string): Promise<void> {
  const logoPath = path.join(nodeDir, 'logo.svg');
  if (actor.pictureUrl) {
    try {
      const buf = await downloadBuffer(actor.pictureUrl);
      const resized = await sharp(buf).resize(60, 60, { fit: 'cover' }).png().toBuffer();
      const b64 = resized.toString('base64');
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 60 60" width="60" height="60">
  <image width="60" height="60" xlink:href="data:image/png;base64,${b64}"/>
</svg>`;
      fs.writeFileSync(logoPath, svg, 'utf-8');
      console.log(chalk.green(`  🎨 Saved branded icon for ${actor.name}`));
      return;
    } catch (err) {
      console.warn(chalk.yellow(`  ⚠️  Failed to fetch/resize pictureUrl for ${actor.name}, using fallback SVG: ${(err as Error).message}`));
    }
  }

  fs.writeFileSync(logoPath, FALLBACK_SVG, 'utf-8');
  console.log(chalk.gray(`  🎨 Saved fallback Apify icon for ${actor.name}`));
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

  // Generate branded or fallback logo.svg
  await generateLogoSvg(actor, nodeDir);

  // Get properties from actor schema
  const properties = await createActorAppSchemaForN8n(client, actor) as INodeProperties[];
  const { paramAssignments, usesFixedCollection, usesDate, usesJson, usesOptional } = buildParameterAssignments(properties);

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
    generatePropertiesTs(properties, paramAssignments, usesFixedCollection, usesDate, usesJson, usesOptional)
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

  // Remove obsolete directory nodes/ApifyBlindPostCommentsScraper
  const obsoleteDir = path.resolve('./nodes/ApifyBlindPostCommentsScraper');
  if (fs.existsSync(obsoleteDir)) {
    console.log(chalk.yellow('  ⚠️  Removing obsolete directory nodes/ApifyBlindPostCommentsScraper...'));
    fs.rmSync(obsoleteDir, { recursive: true });
  }

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
