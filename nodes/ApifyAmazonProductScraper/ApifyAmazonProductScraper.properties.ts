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
		// Max products (maxItems)
		maxItems: context.getNodeParameter('maxItems', itemIndex, 50),
		// Get full product details (getProductDetails)
		getProductDetails: context.getNodeParameter('getProductDetails', itemIndex, false),
		// Search keywords (searchQueries)
		...getFixedCollectionParam(context, 'searchQueries', itemIndex, 'values', 'mapValues'),
		// ASINs (asins)
		...getFixedCollectionParam(context, 'asins', itemIndex, 'values', 'mapValues'),
		// Max result pages per search (maxPages)
		maxPages: context.getNodeParameter('maxPages', itemIndex, 5),
		// Include sponsored results (includeSponsored)
		includeSponsored: context.getNodeParameter('includeSponsored', itemIndex, true),
		// Max concurrency (maxConcurrency)
		maxConcurrency: context.getNodeParameter('maxConcurrency', itemIndex, 2),
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
    "description": "amazon.com search result URLs (for example https://www.amazon.com/s?k=mechanical+keyboard) or product URLs (for example https://www.amazon.com/dp/B09LK1P1RD). Other Amazon domains and unsupported page types are skipped with a warning.",
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
    "displayName": "Max products",
    "name": "maxItems",
    "description": "Maximum number of unique products (ASINs) to return across all inputs.",
    "required": false,
    "default": 50,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 1000
    }
  },
  {
    "displayName": "Get full product details",
    "name": "getProductDetails",
    "description": "Off: search results return the fields shown on the results page (title, price, rating, placement). On: also open every product page for full details (specs, images, seller, variants, identifiers). Slower and costs more per product. Product URLs and ASINs always return full details.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Search keywords",
    "name": "searchQueries",
    "description": "Keywords to search on amazon.com. Each becomes a search results URL. Up to 20.",
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
    "displayName": "ASINs",
    "name": "asins",
    "description": "10-character Amazon product IDs (ASINs, including 10-digit ISBNs for books). Always returns full details. Duplicates are removed.",
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
    "displayName": "Max result pages per search",
    "name": "maxPages",
    "description": "Maximum search result pages to read for each search URL or keyword. The run also stops once Max products is reached or there are no more pages.",
    "required": false,
    "default": 5,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 20
    }
  },
  {
    "displayName": "Include sponsored results",
    "name": "includeSponsored",
    "description": "Off: skip products that appear only as ads. Products that also appear organically are always kept.",
    "required": false,
    "default": true,
    "type": "boolean"
  },
  {
    "displayName": "Max concurrency",
    "name": "maxConcurrency",
    "description": "Parallel requests. Lower it if you see many blocked-page retries in the log.",
    "required": false,
    "default": 2,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 10
    }
  },
  {
    "displayName": "Debug mode",
    "name": "debugMode",
    "description": "Save the raw HTML of up to 5 failed pages to the key-value store.",
    "required": false,
    "default": false,
    "type": "boolean"
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
