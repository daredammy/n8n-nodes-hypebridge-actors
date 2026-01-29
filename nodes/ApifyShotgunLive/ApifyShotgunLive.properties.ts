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
		// Scrape Full Event Details (scrapeEventDetails)
		scrapeEventDetails: context.getNodeParameter('scrapeEventDetails', itemIndex),
		// Maximum Events (maxEvents)
		maxEvents: context.getNodeParameter('maxEvents', itemIndex),
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
    "description": "City, venue, or event URLs from Shotgun.live to scrape. City pages (e.g., https://shotgun.live/en/cities/new-york) will discover all events in that city. Venue pages (e.g., https://shotgun.live/en/venues/volange) will discover all events at that venue. Event pages (e.g., https://shotgun.live/en/events/event-name) will scrape that specific event.",
    "required": true,
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
    "displayName": "Scrape Full Event Details",
    "name": "scrapeEventDetails",
    "description": "When enabled, navigates to each event page for complete information (venue, lineup, tickets). Additional charges apply per event scraped.",
    "required": false,
    "default": true,
    "type": "boolean"
  },
  {
    "displayName": "Maximum Events",
    "name": "maxEvents",
    "description": "Maximum number of events to scrape. Set to 0 for unlimited.",
    "required": false,
    "default": 20,
    "type": "number",
    "typeOptions": {
      "minValue": 0
    }
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
