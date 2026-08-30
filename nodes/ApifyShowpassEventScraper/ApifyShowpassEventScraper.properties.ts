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

function getJsonParam(context: IExecuteFunctions, paramName: string, itemIndex: number): Record<string, any> {
	try {
		const rawValue = context.getNodeParameter(paramName, itemIndex);
		if (typeof rawValue === 'string' && rawValue.trim() === '') {
			return {};
		}
		return { [paramName]: typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue };
	} catch (error) {
		throw new Error(`Invalid JSON in parameter "${paramName}": ${(error as Error).message}`);
	}
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
		// Maximum events (maxEvents)
		maxEvents: context.getNodeParameter('maxEvents', itemIndex),
		// Get full event details (getEventDetails)
		getEventDetails: context.getNodeParameter('getEventDetails', itemIndex),
		// Search query (searchQuery)
		...getOptionalParam(context, 'searchQuery', itemIndex),
		// Featured city (featuredCity)
		featuredCity: context.getNodeParameter('featuredCity', itemIndex),
		// Exact city (exactCity)
		...getOptionalParam(context, 'exactCity', itemIndex),
		// Include past events (includePastEvents)
		includePastEvents: context.getNodeParameter('includePastEvents', itemIndex),
		// Maximum concurrency (maxConcurrency)
		maxConcurrency: context.getNodeParameter('maxConcurrency', itemIndex),
		// Proxy configuration (proxyConfiguration)
		...getJsonParam(context, 'proxyConfiguration', itemIndex),
		// Debug mode (debugMode)
		debugMode: context.getNodeParameter('debugMode', itemIndex),
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
    "description": "Showpass homepage, event, organizer (/o/{slug}), or featured-city (/discover/{city}) URLs.",
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
    "displayName": "Maximum events",
    "name": "maxEvents",
    "description": "Global maximum number of unique event records returned across all start URLs.",
    "required": true,
    "default": 100,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 50000
    }
  },
  {
    "displayName": "Get full event details",
    "name": "getEventDetails",
    "description": "Fetch tags, event ratings, recurring-event data, sold-out messaging, and all-in fee/tax pricing for every collection event. Direct event URLs are always detailed.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Search query",
    "name": "searchQuery",
    "description": "Applied only to homepage inputs. Showpass matches event and venue names, not descriptions.",
    "required": false,
    "default": "",
    "type": "string"
  },
  {
    "displayName": "Featured city",
    "name": "featuredCity",
    "description": "Geo-radius city filter for homepage inputs. Overrides Exact city.",
    "required": false,
    "default": "none",
    "type": "options",
    "options": [
      {
        "name": "No featured-city filter",
        "value": "none"
      },
      {
        "name": "Calgary",
        "value": "calgary"
      },
      {
        "name": "Vancouver",
        "value": "vancouver"
      },
      {
        "name": "Toronto",
        "value": "toronto"
      },
      {
        "name": "Edmonton",
        "value": "edmonton"
      },
      {
        "name": "Winnipeg",
        "value": "winnipeg"
      },
      {
        "name": "Saskatoon",
        "value": "saskatoon"
      },
      {
        "name": "Kelowna",
        "value": "kelowna"
      },
      {
        "name": "Ottawa",
        "value": "ottawa"
      },
      {
        "name": "Victoria",
        "value": "victoria"
      },
      {
        "name": "Whistler",
        "value": "whistler"
      },
      {
        "name": "Hamilton",
        "value": "hamilton"
      },
      {
        "name": "Red Deer",
        "value": "red-deer"
      },
      {
        "name": "Prince Edward",
        "value": "prince-edward"
      },
      {
        "name": "Seattle",
        "value": "seattle"
      },
      {
        "name": "New York",
        "value": "new-york"
      },
      {
        "name": "Texas",
        "value": "texas"
      }
    ]
  },
  {
    "displayName": "Exact city",
    "name": "exactCity",
    "description": "Exact location city filter for homepage inputs, such as Halifax. Ignored when Featured city is selected.",
    "required": false,
    "default": "",
    "type": "string"
  },
  {
    "displayName": "Include past events",
    "name": "includePastEvents",
    "description": "For homepage and organizer collections, include archived events. Featured-city discovery remains upcoming-oriented because that is how Showpass exposes it.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Maximum concurrency",
    "name": "maxConcurrency",
    "description": "Maximum simultaneous detail API requests.",
    "required": false,
    "default": 5,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 10
    }
  },
  {
    "displayName": "Proxy configuration",
    "name": "proxyConfiguration",
    "description": "Optional proxy settings. Direct requests are recommended unless Showpass begins rate limiting.",
    "required": false,
    "default": "{\"useApifyProxy\":false}",
    "type": "json"
  },
  {
    "displayName": "Debug mode",
    "name": "debugMode",
    "description": "Enable verbose routing/filter logs and bounded failed-response artifacts.",
    "required": false,
    "default": false,
    "type": "boolean"
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
