import { IExecuteFunctions, INodeProperties } from 'n8n-workflow';

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

function getDateParam(context: IExecuteFunctions, paramName: string, itemIndex: number): Record<string, any> {
	const value = context.getNodeParameter(paramName, itemIndex, undefined);
	if (value === undefined || value === null || value === '') return {};
	const date = String(value).slice(0, 10);
	return { [paramName]: date };
}

function getOptionalParam(context: IExecuteFunctions, paramName: string, itemIndex: number): Record<string, any> {
	const value = context.getNodeParameter(paramName, itemIndex, undefined);
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
		// Max events (maxEvents)
		maxEvents: context.getNodeParameter('maxEvents', itemIndex, 100),
		// Get full event details (getEventDetails)
		getEventDetails: context.getNodeParameter('getEventDetails', itemIndex, true),
		// City / location (location)
		...getOptionalParam(context, 'location', itemIndex),
		// Artist or venue search (searchQuery)
		...getOptionalParam(context, 'searchQuery', itemIndex),
		// Date filter (dateFilter)
		...getOptionalParam(context, 'dateFilter', itemIndex),
		// Start date (YYYY-MM-DD) (dateFrom)
		...getDateParam(context, 'dateFrom', itemIndex),
		// End date (YYYY-MM-DD) (dateTo)
		...getDateParam(context, 'dateTo', itemIndex),
		// Genre filter (genre)
		...getOptionalParam(context, 'genre', itemIndex),
		// Free shows only (freeOnly)
		freeOnly: context.getNodeParameter('freeOnly', itemIndex, false),
		// Livestreams only (livestreamsOnly)
		livestreamsOnly: context.getNodeParameter('livestreamsOnly', itemIndex, false),
		// Max concurrency (maxConcurrency)
		maxConcurrency: context.getNodeParameter('maxConcurrency', itemIndex, 10),
		// Debug mode (debugMode)
		debugMode: context.getNodeParameter('debugMode', itemIndex, false),
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
    "description": "Bandsintown URLs to scrape: city pages (/c/new-york-ny, /c/london-united-kingdom, /de/c/berlin-germany), event pages (/e/...), artist pages (/a/...), venue pages (/v/...), or festival country pages (/f/countries/us).",
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
    "displayName": "Max events",
    "name": "maxEvents",
    "description": "Maximum total number of events to extract across all inputs in this run.",
    "required": false,
    "default": 100,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 10000
    }
  },
  {
    "displayName": "Get full event details",
    "name": "getEventDetails",
    "description": "Visit each event page to enrich records with direct ticket vendor URLs, venue street address & coordinates, genres, and artist social links. Direct /e/ URLs in Start URLs always return full details.",
    "required": false,
    "default": true,
    "type": "boolean"
  },
  {
    "displayName": "City / location",
    "name": "location",
    "description": "Optional city name (e.g. \"London\", \"Berlin\", \"Austin, TX\") resolved via Bandsintown city search when not providing Start URLs.",
    "required": false,
    "default": "",
    "type": "string"
  },
  {
    "displayName": "Artist or venue search",
    "name": "searchQuery",
    "description": "Optional artist or venue name to resolve via Bandsintown search and scrape their upcoming events.",
    "required": false,
    "default": "",
    "type": "string"
  },
  {
    "displayName": "Date filter",
    "name": "dateFilter",
    "description": "Date window applied to city/location event discovery.",
    "required": false,
    "default": "all-dates",
    "type": "options",
    "options": [
      {
        "name": "All upcoming dates",
        "value": "all-dates"
      },
      {
        "name": "Today",
        "value": "today"
      },
      {
        "name": "This week",
        "value": "this-week"
      },
      {
        "name": "This month",
        "value": "this-month"
      },
      {
        "name": "Custom date range",
        "value": "choose-dates"
      }
    ]
  },
  {
    "displayName": "Start date (YYYY-MM-DD)",
    "name": "dateFrom",
    "description": "Start date for custom date range (used when Date filter is \"Custom date range\").",
    "required": false,
    "default": "",
    "type": "dateTime"
  },
  {
    "displayName": "End date (YYYY-MM-DD)",
    "name": "dateTo",
    "description": "End date for custom date range (used when Date filter is \"Custom date range\").",
    "required": false,
    "default": "",
    "type": "dateTime"
  },
  {
    "displayName": "Genre filter",
    "name": "genre",
    "description": "Optional genre filter for city/location event discovery.",
    "required": false,
    "default": "all-genres",
    "type": "options",
    "options": [
      {
        "name": "All genres",
        "value": "all-genres"
      },
      {
        "name": "Alternative",
        "value": "alternative"
      },
      {
        "name": "Blues",
        "value": "blues"
      },
      {
        "name": "Christian / Gospel",
        "value": "christian-gospel"
      },
      {
        "name": "Classical",
        "value": "classical"
      },
      {
        "name": "Comedy",
        "value": "comedy"
      },
      {
        "name": "Country",
        "value": "country"
      },
      {
        "name": "Electronic",
        "value": "electronic"
      },
      {
        "name": "Folk",
        "value": "folk"
      },
      {
        "name": "Hip-Hop",
        "value": "hip-hop"
      },
      {
        "name": "Jazz",
        "value": "jazz"
      },
      {
        "name": "Latin",
        "value": "latin"
      },
      {
        "name": "Metal",
        "value": "metal"
      },
      {
        "name": "Pop",
        "value": "pop"
      },
      {
        "name": "Punk",
        "value": "punk"
      },
      {
        "name": "Reggae",
        "value": "reggae"
      },
      {
        "name": "R&B / Soul",
        "value": "rnb-soul"
      },
      {
        "name": "Rock",
        "value": "rock"
      }
    ]
  },
  {
    "displayName": "Free shows only",
    "name": "freeOnly",
    "description": "Return only free events when discovering by city/location.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Livestreams only",
    "name": "livestreamsOnly",
    "description": "Return only livestream events when discovering by city/location.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Max concurrency",
    "name": "maxConcurrency",
    "description": "Maximum number of concurrent HTTP requests.",
    "required": false,
    "default": 10,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 30
    }
  },
  {
    "displayName": "Debug mode",
    "name": "debugMode",
    "description": "Enable verbose logging and save failing HTML/JSON payloads to the Key-Value Store.",
    "required": false,
    "default": false,
    "type": "boolean"
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
