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

export function buildActorInput(
	context: IExecuteFunctions,
	itemIndex: number,
	defaultInput: Record<string, any>,
): Record<string, any> {
	return {
		...defaultInput,
		// Start URLs (startUrls)
		...getFixedCollectionParam(context, 'startUrls', itemIndex, 'items', 'passthrough'),
		// Max items (maxItems)
		maxItems: context.getNodeParameter('maxItems', itemIndex),
		// Use product detail pages (useProductDetails)
		useProductDetails: context.getNodeParameter('useProductDetails', itemIndex),
		// Proxy configuration (proxyConfiguration)
		...getJsonParam(context, 'proxyConfiguration', itemIndex),
		// Max concurrency (maxConcurrency)
		maxConcurrency: context.getNodeParameter('maxConcurrency', itemIndex),
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
    "description": "Category, search, or sale URLs on nfm.com. The actor discovers pagination from the first page of each URL.",
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
    "displayName": "Max items",
    "name": "maxItems",
    "description": "Maximum number of products to emit. Use 0 for no limit.",
    "required": false,
    "default": 0,
    "type": "number",
    "typeOptions": {
      "minValue": 0
    }
  },
  {
    "displayName": "Use product detail pages",
    "name": "useProductDetails",
    "description": "Fetch each product detail page and enrich records with product copy, brand, images, GTIN, ratings, availability, and PDP price.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Proxy configuration",
    "name": "proxyConfiguration",
    "description": "Residential proxy configuration. Recommended for reliable production runs against NFM.",
    "required": false,
    "default": {
      "useApifyProxy": true,
      "apifyProxyGroups": [
        "RESIDENTIAL"
      ],
      "apifyProxyCountry": "US"
    },
    "type": "json"
  },
  {
    "displayName": "Max concurrency",
    "name": "maxConcurrency",
    "description": "Parallel HTTP workers. Keep this low to avoid anti-bot escalation.",
    "required": false,
    "default": 5,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 10
    }
  },
  {
    "displayName": "Debug mode",
    "name": "debugMode",
    "description": "Store blocked or malformed HTML responses in the key-value store and log extra anti-block diagnostics.",
    "required": false,
    "default": false,
    "type": "boolean"
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
