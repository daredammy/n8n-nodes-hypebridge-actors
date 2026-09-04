import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';
import { properties } from './ApifyFindEvents.properties';
import { runActor } from './helpers/executeActor';

// SNIPPET 1: Make sure the constants are correct
export const ACTOR_ID = 'XIUAyRsGZ5I3g1kxi' as string;

export const PACKAGE_NAME = 'n8n-nodes-find-events' as string;
export const CLASS_NAME = 'ApifyFindEvents' as string;
export const ClassNameCamel = CLASS_NAME.charAt(0).toLowerCase() + CLASS_NAME.slice(1); // make the first letter lowercase for name fields

export const X_PLATFORM_HEADER_ID = 'n8n' as string;
export const X_PLATFORM_APP_HEADER_ID = 'find-events-app' as string;

export const DISPLAY_NAME = 'Apify Find Events' as string;
export const DESCRIPTION = 'Queries multiple event platforms for a given city and category, returning a single normalized dataset of scheduled events. Supported platforms include Eventbrite, Meetup, Luma, Dice, Eventnoire, Posh, Prekindle, and Shotgun.' as string;

export class ApifyFindEvents implements INodeType {
	description: INodeTypeDescription = {
		displayName: DISPLAY_NAME,
		name: ClassNameCamel,

		// SNIPPET 2: Adjust the icon of your app
		icon: 'file:logo.svg',
		group: ['transform'],
		// Mismatched version and defaultVersion as a minor hack to hide "Custom API Call" resource
		version: [1],
		defaultVersion: 1,

		// SNIPPET 3: Adjust the subtitle for your Actor app.
		subtitle: 'Run Scraper',
		
		// SNIPPET 4: Make sure the description is not too large, 1 sentence should be ideal.
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
