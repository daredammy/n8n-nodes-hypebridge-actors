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
		// Start URLs (startUrls)
		...getFixedCollectionParam(context, 'startUrls', itemIndex, 'items', 'passthrough'),
		// Scrape Event Details (scrapeEventDetails)
		scrapeEventDetails: context.getNodeParameter('scrapeEventDetails', itemIndex),
		// Max Events (maxEvents)
		maxEvents: context.getNodeParameter('maxEvents', itemIndex),
		// Keyword (keyword)
		...getOptionalParam(context, 'keyword', itemIndex),
		// City (city)
		...getOptionalParam(context, 'city', itemIndex),
		// State (state)
		...getOptionalParam(context, 'state', itemIndex),
		// Country (country)
		...getOptionalParam(context, 'country', itemIndex),
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
    "description": "Eventbrite search/discovery URLs to scrape. Direct Search fields replace the prefilled nationwide URL; custom Start URLs take precedence.",
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
    "default": 5,
    "type": "number",
    "typeOptions": {
      "minValue": 0
    }
  },
  {
    "displayName": "Keyword",
    "name": "keyword",
    "description": "Search keyword used to construct an Eventbrite search URL (e.g. 'music', 'sunday-funday', 'funparty'). Replaces the prefilled nationwide URL, but not a custom Start URL.",
    "required": false,
    "default": "",
    "type": "string"
  },
  {
    "displayName": "City",
    "name": "city",
    "description": "City name (e.g. 'Dallas', 'Newark', 'New York').",
    "required": false,
    "default": "",
    "type": "string"
  },
  {
    "displayName": "State",
    "name": "state",
    "description": "State name or abbreviation (e.g. 'Texas', 'TX', 'New Jersey', 'NJ').",
    "required": false,
    "default": "",
    "type": "string"
  },
  {
    "displayName": "Country",
    "name": "country",
    "description": "Country code (e.g. 'US').",
    "required": false,
    "default": "",
    "type": "string"
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
