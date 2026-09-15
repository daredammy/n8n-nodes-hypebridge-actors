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
		// URLs (startUrls)
		...getFixedCollectionParam(context, 'startUrls', itemIndex, 'items', 'passthrough'),
		// Enrich with product detail (enrichProductDetail)
		enrichProductDetail: context.getNodeParameter('enrichProductDetail', itemIndex, false),
		// Max items (maxItems)
		maxItems: context.getNodeParameter('maxItems', itemIndex, 20),
		// Search terms (searchTerms)
		...getFixedCollectionParam(context, 'searchTerms', itemIndex, 'values', 'mapValues'),
		// Debug mode (debugMode)
		debugMode: context.getNodeParameter('debugMode', itemIndex, false),
		// Proxy configuration (proxyConfiguration)
		...getJsonParam(context, 'proxyConfiguration', itemIndex),
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
    "displayName": "URLs",
    "name": "startUrls",
    "description": "Shop.app URLs to scrape — search results, category pages, the offers page (https://shop.app/offers), or product pages.",
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
    "displayName": "Enrich with product detail",
    "name": "enrichProductDetail",
    "description": "Open each product page to extract full descriptions, options, variants, reviews, and media. Disable for faster list-only snapshots.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Max items",
    "name": "maxItems",
    "description": "Maximum number of products to extract across all sources. Set to 0 for unlimited.",
    "required": false,
    "default": 20,
    "type": "number",
    "typeOptions": {
      "minValue": 0,
      "maxValue": 10000
    }
  },
  {
    "displayName": "Search terms",
    "name": "searchTerms",
    "description": "Keywords to search for on Shop.app. Runs after any provided URLs.",
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
    "displayName": "Debug mode",
    "name": "debugMode",
    "description": "Save screenshots and HTML to the key-value store when a request fails after retries.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Proxy configuration",
    "name": "proxyConfiguration",
    "description": "Optional proxy settings. Start without a proxy and add residential proxies only if the site begins blocking your runs.",
    "required": false,
    "default": "{\"useApifyProxy\":false}",
    "type": "json"
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
