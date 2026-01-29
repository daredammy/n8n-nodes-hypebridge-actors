import { IExecuteFunctions, INodeProperties } from 'n8n-workflow';

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

export function buildActorInput(
	context: IExecuteFunctions,
	itemIndex: number,
	defaultInput: Record<string, any>,
): Record<string, any> {
	return {
		...defaultInput,
		// Start URLs (startUrls)
		...getFixedCollectionParam(context, 'startUrls', itemIndex, 'items', 'passthrough'),
		// Scrape Event Details (scrapeEventDetails)
		scrapeEventDetails: context.getNodeParameter('scrapeEventDetails', itemIndex),
		// Max Events (maxEvents)
		maxEvents: context.getNodeParameter('maxEvents', itemIndex),
		// Disable Proxy (disableProxy)
		disableProxy: context.getNodeParameter('disableProxy', itemIndex),
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

export const actorProperties: INodeProperties[] = [
  {
    "displayName": "Start URLs",
    "name": "startUrls",
    "description": "Search/discovery URLs to start with.",
    "required": false,
    "default": {},
    "type": "fixedCollection",
    "typeOptions": {
      "multipleValues": true
    },
    "options": [
      {
        "name": "items",
        "displayName": "items",
        "values": [
          {
            "displayName": "item",
            "name": "url",
            "type": "string",
            "default": ""
          }
        ]
      }
    ]
  },
  {
    "displayName": "Scrape Event Details",
    "name": "scrapeEventDetails",
    "description": "Enable to navigate to each event page and extract comprehensive details (organizer info, full description, venue details, pricing, policies, etc.). This provides richer data similar to the Eventbrite API but costs more per event.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Max Events",
    "name": "maxEvents",
    "description": "Maximum number of events to scrape. Set to 0 for unlimited.",
    "required": false,
    "default": 0,
    "type": "number",
    "typeOptions": {
      "minValue": 0
    }
  },
  {
    "displayName": "Disable Proxy",
    "name": "disableProxy",
    "description": "Disable proxy usage. Enable this if Eventbrite is blocking proxy traffic (you'll see 'Human Verification' or CAPTCHA pages)",
    "required": false,
    "default": false,
    "type": "boolean"
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
