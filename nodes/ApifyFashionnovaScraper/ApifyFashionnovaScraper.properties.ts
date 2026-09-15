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
		// Enrich product detail (enrichProductDetail)
		enrichProductDetail: context.getNodeParameter('enrichProductDetail', itemIndex, true),
		// Max items (maxItems)
		maxItems: context.getNodeParameter('maxItems', itemIndex, 50),
		// Max concurrency (maxConcurrency)
		maxConcurrency: context.getNodeParameter('maxConcurrency', itemIndex, 15),
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
    "description": "Fashion Nova homepage, collection URLs, search URLs, direct product URLs, or other same-site URLs. Invalid or unsupported entries are skipped with warnings.",
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
    "displayName": "Enrich product detail",
    "name": "enrichProductDetail",
    "description": "Enrich discovered products. Disable for faster list-only snapshots.",
    "required": false,
    "default": true,
    "type": "boolean"
  },
  {
    "displayName": "Max items",
    "name": "maxItems",
    "description": "Maximum number of product records to produce across the full run. Set to 0 for unlimited.",
    "required": false,
    "default": 50,
    "type": "number",
    "typeOptions": {
      "minValue": 0,
      "maxValue": 10000
    }
  },
  {
    "displayName": "Max concurrency",
    "name": "maxConcurrency",
    "description": "Crawler concurrency for bootstrap, listing, and product batch requests.",
    "required": false,
    "default": 15,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 25
    }
  },
  {
    "displayName": "Proxy configuration",
    "name": "proxyConfiguration",
    "description": "Optional proxy settings. Start without a proxy first and only add one if Fashion Nova begins throttling or blocking your runs.",
    "required": false,
    "default": "{\"useApifyProxy\":false}",
    "type": "json"
  },
  {
    "displayName": "Debug mode",
    "name": "debugMode",
    "description": "Save request context and response bodies from failed requests to the key-value store.",
    "required": false,
    "default": false,
    "type": "boolean"
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
