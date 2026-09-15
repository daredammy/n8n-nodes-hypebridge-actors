import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';
import { properties } from './ApifyAdaptiveWebScraper.properties';
import { runActor } from './helpers/executeActor';

// SNIPPET 1: Actor schema constants
export const ACTOR_ID = 'k5cyg7zhR5qwZOTbc' as string;

export const PACKAGE_NAME = 'n8n-nodes-hypebridge-actors' as string;
export const CLASS_NAME = 'ApifyAdaptiveWebScraper' as string;
export const ClassNameCamel = 'apifyAdaptiveWebScraper' as string;

export const X_PLATFORM_HEADER_ID = 'n8n' as string;
export const X_PLATFORM_APP_HEADER_ID = 'k5cyg7zhR5qwZOTbc' as string;

export const DISPLAY_NAME = 'Adaptive AI Web Scraper' as string;
export const DESCRIPTION = 'Extract structured data from public or logged-in websites with one prompt. Adaptive routing switches between DOM, hidden JSON, direct APIs, and browser fallback, supports listing-to-detail crawls, and returns schema-locked JSON with confidence signals when pages get messy.' as string;

export class ApifyAdaptiveWebScraper implements INodeType {
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
