import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';
import { properties } from './ApifyWhopCampaignIntelligence.properties';
import { runActor } from './helpers/executeActor';

// SNIPPET 1: Actor schema constants
export const ACTOR_ID = 'jD4xGn5nPuPJJtzf7' as string;

export const PACKAGE_NAME = 'n8n-nodes-hypebridge-actors' as string;
export const CLASS_NAME = 'ApifyWhopCampaignIntelligence' as string;
export const ClassNameCamel = 'apifyWhopCampaignIntelligence' as string;

export const X_PLATFORM_HEADER_ID = 'n8n' as string;
export const X_PLATFORM_APP_HEADER_ID = 'jD4xGn5nPuPJJtzf7' as string;

export const DISPLAY_NAME = 'Whop Campaign Intelligence & Marketplace Scraper' as string;
export const DESCRIPTION = 'Collects public Content Rewards campaigns, searches selected parts of the Whop catalog, and joins campaigns to public Whop company profiles. It is designed for campaign research, creator outreach, competitor monitoring, and bounded marketplace discovery' as string;

export class ApifyWhopCampaignIntelligence implements INodeType {
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
