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
		// Max items (maxItems)
		maxItems: context.getNodeParameter('maxItems', itemIndex, 500),
		// Max pages per URL (maxPagesPerStartUrl)
		maxPagesPerStartUrl: context.getNodeParameter('maxPagesPerStartUrl', itemIndex, 10),
		// Get product details (getProductDetails)
		getProductDetails: context.getNodeParameter('getProductDetails', itemIndex, true),
		// Max concurrency (maxConcurrency)
		maxConcurrency: context.getNodeParameter('maxConcurrency', itemIndex, 2),
		// Warmup delay (navigationDelayMs)
		navigationDelayMs: context.getNodeParameter('navigationDelayMs', itemIndex, 8000),
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
    "displayName": "URLs",
    "name": "startUrls",
    "description": "SHEIN URLs to scrape — homepage, search results, category pages, product pages, store pages (/store/home?store_code=…), or other product-listing pages from shein.com country subdomains.",
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
    "displayName": "Max items",
    "name": "maxItems",
    "description": "Maximum number of products to extract across all sources. Set to 0 for unlimited.",
    "required": false,
    "default": 500,
    "type": "number",
    "typeOptions": {
      "minValue": 0
    }
  },
  {
    "displayName": "Max pages per URL",
    "name": "maxPagesPerStartUrl",
    "description": "Maximum number of paginated pages to crawl for each input URL. Each page returns up to 120 products.",
    "required": false,
    "default": 10,
    "type": "number",
    "typeOptions": {
      "minValue": 1
    }
  },
  {
    "displayName": "Get product details",
    "name": "getProductDetails",
    "description": "Attempt to collect product details for direct product URLs. This path is slower and more expensive than the default listing extraction flow.",
    "required": false,
    "default": true,
    "type": "boolean"
  },
  {
    "displayName": "Max concurrency",
    "name": "maxConcurrency",
    "description": "Browser pages processed in parallel. Keep low — SHEIN rate-limits warmed sessions aggressively.",
    "required": false,
    "default": 2,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 3
    }
  },
  {
    "displayName": "Warmup delay",
    "name": "navigationDelayMs",
    "description": "Milliseconds to wait after the SHEIN homepage warmup before calling session-native APIs. Keep this high enough for SHEIN's client SDKs to expose schttp.",
    "required": false,
    "default": 8000,
    "type": "number",
    "typeOptions": {
      "minValue": 1000,
      "maxValue": 15000
    }
  },
  {
    "displayName": "Proxy configuration",
    "name": "proxyConfiguration",
    "description": "Residential proxies are strongly recommended — datacenter IPs hit SHEIN's risk pages quickly.",
    "required": false,
    "default": "{\"useApifyProxy\":true,\"apifyProxyGroups\":[\"RESIDENTIAL\"]}",
    "type": "json"
  },
  {
    "displayName": "Debug mode",
    "name": "debugMode",
    "description": "Save screenshots and HTML to the key-value store when a block or malformed response is encountered.",
    "required": false,
    "default": false,
    "type": "boolean"
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
