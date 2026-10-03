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
		// Marketplaces (marketplaces)
		marketplaces: context.getNodeParameter('marketplaces', itemIndex, ["US"]),
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
		// Max page requests (maxRequests)
		maxRequests: context.getNodeParameter('maxRequests', itemIndex, 250),
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
    "description": "Amazon search or product URLs from any supported storefront (for example amazon.de/s?k=maus or amazon.co.jp/dp/4837979653). Each URL keeps its own country marketplace.",
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
    "displayName": "Marketplaces",
    "name": "marketplaces",
    "description": "Select storefronts for Search keywords and ASINs. Start URLs always use their own storefront. Default is US for existing workflows. Choose all 23 for a global run.",
    "required": false,
    "default": [
      "US"
    ],
    "type": "multiOptions",
    "options": [
      {
        "name": "US",
        "value": "US"
      },
      {
        "name": "CA",
        "value": "CA"
      },
      {
        "name": "MX",
        "value": "MX"
      },
      {
        "name": "BR",
        "value": "BR"
      },
      {
        "name": "IE",
        "value": "IE"
      },
      {
        "name": "ES",
        "value": "ES"
      },
      {
        "name": "UK",
        "value": "UK"
      },
      {
        "name": "FR",
        "value": "FR"
      },
      {
        "name": "BE",
        "value": "BE"
      },
      {
        "name": "NL",
        "value": "NL"
      },
      {
        "name": "DE",
        "value": "DE"
      },
      {
        "name": "IT",
        "value": "IT"
      },
      {
        "name": "SE",
        "value": "SE"
      },
      {
        "name": "ZA",
        "value": "ZA"
      },
      {
        "name": "PL",
        "value": "PL"
      },
      {
        "name": "SA",
        "value": "SA"
      },
      {
        "name": "EG",
        "value": "EG"
      },
      {
        "name": "TR",
        "value": "TR"
      },
      {
        "name": "AE",
        "value": "AE"
      },
      {
        "name": "IN",
        "value": "IN"
      },
      {
        "name": "SG",
        "value": "SG"
      },
      {
        "name": "AU",
        "value": "AU"
      },
      {
        "name": "JP",
        "value": "JP"
      }
    ]
  },
  {
    "displayName": "Max products",
    "name": "maxItems",
    "description": "Maximum number of unique marketplace and ASIN pairs across the whole run. A multi-market search may reach this cap before every market returns a product; increase the cap to cover more markets.",
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
    "description": "Keywords to search in every selected marketplace. Up to 20 per run.",
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
    "description": "10-character product IDs, including book ISBN-10 values. Each ASIN is opened in every selected marketplace; duplicates are removed by marketplace and ASIN.",
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
    "displayName": "Max page requests",
    "name": "maxRequests",
    "description": "Hard cap on page requests across all selected marketplaces, including pagination and product details.",
    "required": false,
    "default": 250,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 1000
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
