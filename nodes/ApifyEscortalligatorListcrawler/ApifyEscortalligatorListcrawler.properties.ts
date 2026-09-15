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

export function buildActorInput(
	context: IExecuteFunctions,
	itemIndex: number,
	defaultInput: Record<string, any>,
): Record<string, any> {
	return {
		...defaultInput,
		// Start URLs (startUrls)
		...getFixedCollectionParam(context, 'startUrls', itemIndex, 'items', 'passthrough'),
		// Max listings (maxItems)
		maxItems: context.getNodeParameter('maxItems', itemIndex, 150),
		// Get listing details (getListingDetails)
		getListingDetails: context.getNodeParameter('getListingDetails', itemIndex, false),
		// Max pages per city URL (maxPages)
		maxPages: context.getNodeParameter('maxPages', itemIndex, 3),
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
    "description": "Escort Alligator city listing or individual listing-detail URLs. Invalid or unsupported individual entries are skipped; only escortalligator.com.listcrawler.eu URLs are collected.",
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
    "displayName": "Max listings",
    "name": "maxItems",
    "description": "Maximum number of unique final listing records across all start URLs.",
    "required": true,
    "default": 150,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 5000
    }
  },
  {
    "displayName": "Get listing details",
    "name": "getListingDetails",
    "description": "Visit each listing page for phone, identity, location, attributes, and full-size gallery URLs. Direct detail URLs are always fully extracted.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Max pages per city URL",
    "name": "maxPages",
    "description": "Safety cap for numbered pagination from each city start URL. Crawling also stops when max listings is reached.",
    "required": false,
    "default": 3,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 100
    }
  },
  {
    "displayName": "Debug mode",
    "name": "debugMode",
    "description": "Save up to 10 capped failed-response artifacts to the default key-value store. Artifacts may contain public listing content.",
    "required": false,
    "default": false,
    "type": "boolean"
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
