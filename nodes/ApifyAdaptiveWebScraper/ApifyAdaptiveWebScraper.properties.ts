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
		// What do you want to extract? (extractionGoal)
		extractionGoal: context.getNodeParameter('extractionGoal', itemIndex, "Extract each event's title, date, venue, and ticket link."),
		// This site has detail pages (followLinks)
		followLinks: context.getNodeParameter('followLinks', itemIndex, false),
		// How should I find the detail pages? (Optional) (detailPageGuidance)
		...getOptionalParam(context, 'detailPageGuidance', itemIndex),
		// Max crawl depth (maxDepth)
		maxDepth: context.getNodeParameter('maxDepth', itemIndex, 1),
		// Max items (maxItems)
		maxItems: context.getNodeParameter('maxItems', itemIndex, 0),
		// Required fields (requiredFields)
		...getFixedCollectionParam(context, 'requiredFields', itemIndex, 'values', 'mapValues'),
		// Proxy configuration (proxyConfiguration)
		...getJsonParam(context, 'proxyConfiguration', itemIndex),
		// Auth cookies (cookies)
		...getJsonParam(context, 'cookies', itemIndex),
		// Bearer token (bearerToken)
		...getOptionalParam(context, 'bearerToken', itemIndex),
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
    "description": "URLs to scrape. For two-pass mode, these are listing or index pages.",
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
    "displayName": "What do you want to extract?",
    "name": "extractionGoal",
    "description": "Describe the final data you want. If this site has detail pages, this is what the actor will extract from each detail page.",
    "required": true,
    "default": "Extract each event's title, date, venue, and ticket link.",
    "type": "string",
    "typeOptions": {
      "rows": 5
    }
  },
  {
    "displayName": "This site has detail pages",
    "name": "followLinks",
    "description": "Turn this on when your start URLs are listing pages and the actor should open each result page before extracting the final data.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "How should I find the detail pages? (Optional)",
    "name": "detailPageGuidance",
    "description": "Optional extra guidance for sites with detail pages. Leave this blank unless the actor needs help choosing which links to follow from listing pages.",
    "required": false,
    "default": "Open links to the individual event pages, not category, city, or organizer pages.",
    "type": "string",
    "typeOptions": {
      "rows": 5
    }
  },
  {
    "displayName": "Max crawl depth",
    "name": "maxDepth",
    "description": "Maximum detail-link depth from the start URLs.",
    "required": false,
    "default": 1,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 5
    }
  },
  {
    "displayName": "Max items",
    "name": "maxItems",
    "description": "Stop after extracting this many records. Set to 0 for unlimited.",
    "required": false,
    "default": 0,
    "type": "number",
    "typeOptions": {
      "minValue": 0
    }
  },
  {
    "displayName": "Required fields",
    "name": "requiredFields",
    "description": "Field names that must exist in every record. This overrides inferred requiredness from the first pages.",
    "required": false,
    "default": {},
    "type": "fixedCollection",
    "typeOptions": {
      "multipleValues": true
    },
    "options": [
      {
        "name": "values",
        "displayName": "Values",
        "values": [
          {
            "displayName": "Value",
            "name": "value",
            "type": "string",
            "default": ""
          }
        ]
      }
    ]
  },
  {
    "displayName": "Proxy configuration",
    "name": "proxyConfiguration",
    "description": "Apify Proxy settings. Use residential proxies for bot-protected sites.",
    "required": false,
    "default": "",
    "type": "json"
  },
  {
    "displayName": "Auth cookies",
    "name": "cookies",
    "description": "Cookies to inject before navigation for login-walled sites. Format: [{name, value, domain}].",
    "required": false,
    "default": "",
    "type": "json"
  },
  {
    "displayName": "Bearer token",
    "name": "bearerToken",
    "description": "Injected as Authorization: Bearer <token> on page requests and direct API fetches.",
    "required": false,
    "default": "",
    "type": "string"
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
