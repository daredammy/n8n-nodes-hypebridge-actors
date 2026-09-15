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

function getJsonParam(context: IExecuteFunctions, paramName: string, itemIndex: number): Record<string, any> {
	try {
		const rawValue = context.getNodeParameter(paramName, itemIndex, undefined);
		if (rawValue === undefined || rawValue === null || rawValue === '' || (typeof rawValue === 'string' && rawValue.trim() === '')) {
			return {};
		}
		return { [paramName]: typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue };
	} catch (error) {
		throw new Error(`Invalid JSON in parameter "${paramName}": ${(error as Error).message}`);
	}
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
		// Get event details (getEventDetails)
		getEventDetails: context.getNodeParameter('getEventDetails', itemIndex, false),
		// Max concurrency (maxConcurrency)
		maxConcurrency: context.getNodeParameter('maxConcurrency', itemIndex, 20),
		// Proxy configuration (proxyConfiguration)
		...getJsonParam(context, 'proxyConfiguration', itemIndex),
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
    "description": "Meetup.com URLs to scrape. Supports city find pages (/find/us--tx--frisco/), keyword search pages (/find/?source=EVENTS&keywords=...), group pages (/{group-slug}/), and direct event URLs (/{group-slug}/events/{id}/).",
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
    "displayName": "Max events",
    "name": "maxEvents",
    "description": "Maximum number of unique events to extract across all start URLs. Search and group pagination stops once this cap is reached. Use 0 for no limit.",
    "required": false,
    "default": 100,
    "type": "number",
    "typeOptions": {
      "minValue": 0
    }
  },
  {
    "displayName": "Get event details",
    "name": "getEventDetails",
    "description": "When enabled, enriches each discovered event through the Meetup GraphQL API for complete fields such as full description, end time, and venue coordinates.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Max concurrency",
    "name": "maxConcurrency",
    "description": "Maximum number of parallel page requests.",
    "required": false,
    "default": 20,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 50
    }
  },
  {
    "displayName": "Proxy configuration",
    "name": "proxyConfiguration",
    "description": "Proxy settings. Datacenter proxies are sufficient based on the current target-site profile.",
    "required": false,
    "default": "{\"useApifyProxy\":false}",
    "type": "json"
  },
  {
    "displayName": "Debug mode",
    "name": "debugMode",
    "description": "Saves HTML snapshots for pages where expected Meetup SSR data is missing.",
    "required": false,
    "default": false,
    "type": "boolean"
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
