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

function getOptionalParam(context: IExecuteFunctions, paramName: string, itemIndex: number): Record<string, any> {
	const value = context.getNodeParameter(paramName, itemIndex);
	return value !== undefined && value !== null && value !== '' ? { [paramName]: value } : {};
}

export function buildActorInput(
	context: IExecuteFunctions,
	itemIndex: number,
	defaultInput: Record<string, any>,
): Record<string, any> {
	return {
		...defaultInput,
		// Any Shotgun URL (startUrls)
		...getFixedCollectionParam(context, 'startUrls', itemIndex, 'items', 'passthrough'),
		// Maximum Events (maxEvents)
		maxEvents: context.getNodeParameter('maxEvents', itemIndex),
		// Scrape Full Event Details (scrapeEventDetails)
		scrapeEventDetails: context.getNodeParameter('scrapeEventDetails', itemIndex),
		// Proxy Country (proxyCountryCode)
		...getOptionalParam(context, 'proxyCountryCode', itemIndex),
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
    "displayName": "Any Shotgun URL",
    "name": "startUrls",
    "description": "City, venue, or event URLs from Shotgun.live to scrape. City pages (e.g., https://shotgun.live/en/cities/new-york) will discover all events in that city. City URLs also support optional genre and/or date filters as path segments: /en/cities/{city}/{genre}/{YYYY-MM-DD} (use '-' as the genre placeholder for date-only, e.g. /en/cities/paris/-/2026-07-10). Genre slugs: afro, dance, downtempo, experimental, hard-music, hip-hop, house, industrial, instrumental, latino-brazilian, metal, pop, reggae-dub, rock, techno, trance, uk. Venue pages (e.g., https://shotgun.live/en/venues/volange) will discover all events at that venue. Event pages (e.g., https://shotgun.live/en/events/event-name) will scrape that specific event.",
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
    "displayName": "Maximum Events",
    "name": "maxEvents",
    "description": "Maximum number of events to scrape across all start URLs.",
    "required": false,
    "default": 30,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 500
    }
  },
  {
    "displayName": "Scrape Full Event Details",
    "name": "scrapeEventDetails",
    "description": "When enabled, navigates to each event page for complete information (venue, lineup, tickets). Additional charges apply per event scraped.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Proxy Country",
    "name": "proxyCountryCode",
    "description": "Two-letter country code for the residential proxy (e.g. US, FR, BR). Shotgun.live challenges a share of proxy IPs regardless of country; the scraper retries on fresh IPs automatically, so change this only if one country is consistently blocked for your target pages.",
    "required": false,
    "default": "US",
    "type": "string"
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
