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

export function buildActorInput(
	context: IExecuteFunctions,
	itemIndex: number,
	defaultInput: Record<string, any>,
): Record<string, any> {
	return {
		...defaultInput,
		// Start URLs (startUrls)
		...getFixedCollectionParam(context, 'startUrls', itemIndex, 'items', 'passthrough'),
		// Maximum records (maxItems)
		maxItems: context.getNodeParameter('maxItems', itemIndex, 100),
		// Get full event details (getEventDetails)
		getEventDetails: context.getNodeParameter('getEventDetails', itemIndex, false),
		// From date (dateFrom)
		...getDateParam(context, 'dateFrom', itemIndex),
		// To date (dateTo)
		...getDateParam(context, 'dateTo', itemIndex),
		// Get full article details (getArticleDetails)
		getArticleDetails: context.getNodeParameter('getArticleDetails', itemIndex, false),
		// Maximum concurrency (maxConcurrency)
		maxConcurrency: context.getNodeParameter('maxConcurrency', itemIndex, 2),
		// Maximum HTTP requests (maxRequests)
		maxRequests: context.getNodeParameter('maxRequests', itemIndex, 2000),
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
    "description": "RA URLs: a city events page (https://ra.co/events/uk/london), an event (/events/{id}), venue (/clubs/{id}), promoter (/promoters/{id}), artist (/dj/{slug}), label (/labels/{id}), an article (/news/{id}, /reviews/{id}, /features/{id}, /podcast/{id}) or a feed (/news, /reviews, /features, /podcasts). City pages work for the UK, US, Germany, Netherlands, Spain, Australia and Japan. URLs are processed in order and share one result cap.",
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
    "displayName": "Maximum records",
    "name": "maxItems",
    "description": "Global maximum number of unique records returned across all start URLs.",
    "required": true,
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
    "description": "Fetch each listed event individually to add the description, raw lineup, venue capacity and coordinates, status and update timestamps. Direct event URLs always return full detail.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "From date",
    "name": "dateFrom",
    "description": "First day, inclusive. Use YYYY-MM-DD, or a relative value such as \"7 days\" meaning that long BEFORE today. Applies to city event pages and feeds. Default: today for events (in the city's time zone), 30 days ago for feeds.",
    "required": false,
    "default": "",
    "type": "dateTime"
  },
  {
    "displayName": "To date",
    "name": "dateTo",
    "description": "Last day, inclusive. Use YYYY-MM-DD, or a relative value such as \"30 days\" meaning that long AFTER today. Events: at most 366 days after the From date. Default: 30 days from the From date for events, today for feeds.",
    "required": false,
    "default": "",
    "type": "dateTime"
  },
  {
    "displayName": "Get full article details",
    "name": "getArticleDetails",
    "description": "For news, review, feature and podcast feeds, fetch each article by ID to add the blurb and full content. Direct article URLs always return full content.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Maximum concurrency",
    "name": "maxConcurrency",
    "description": "Maximum simultaneous requests. Keep it low; RA's sustained-rate tolerance is unproven.",
    "required": false,
    "default": 2,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 4
    }
  },
  {
    "displayName": "Maximum HTTP requests",
    "name": "maxRequests",
    "description": "Hard budget on HTTP attempts, retries included. A detailed event costs about one request, so raise this above 2,000 for detailed runs of more than about 1,500 events. The run stops gracefully and reports the cut-off.",
    "required": false,
    "default": 2000,
    "type": "number",
    "typeOptions": {
      "minValue": 10,
      "maxValue": 25000
    }
  },
  {
    "displayName": "Debug mode",
    "name": "debugMode",
    "description": "Verbose routing and window logs, plus up to 10 failed-response artifacts (64 KB each) in the key-value store.",
    "required": false,
    "default": false,
    "type": "boolean"
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
