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
		// Max products (maxItems)
		maxItems: context.getNodeParameter('maxItems', itemIndex, 100),
		// Enrich product details (PDP) (getProductDetails)
		getProductDetails: context.getNodeParameter('getProductDetails', itemIndex, true),
		// Monitor mode (emit deltas only) (onlyDeltas)
		onlyDeltas: context.getNodeParameter('onlyDeltas', itemIndex, false),
		// Sort order (sortBy)
		...getOptionalParam(context, 'sortBy', itemIndex),
		// Make in India only (makeInIndiaOnly)
		makeInIndiaOnly: context.getNodeParameter('makeInIndiaOnly', itemIndex, false),
		// Max listing pages per category (maxPagesPerCategory)
		maxPagesPerCategory: context.getNodeParameter('maxPagesPerCategory', itemIndex, 10),
		// Max PDP enrichments per run (maxPdpEnrichments)
		maxPdpEnrichments: context.getNodeParameter('maxPdpEnrichments', itemIndex, 100),
		// Monitor state store name (stateStoreName)
		...getOptionalParam(context, 'stateStoreName', itemIndex),
		// Max concurrency (maxConcurrency)
		maxConcurrency: context.getNodeParameter('maxConcurrency', itemIndex, 3),
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
    "description": "Paste any mkp.gem.gov.in category URL (including pre-filtered #/?... URLs), direct product URL (p-*-cat.html), or browse_nodes.json URL.",
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
    "displayName": "Max products",
    "name": "maxItems",
    "description": "Maximum number of products to extract across all start URLs (20 products per listing page).",
    "required": false,
    "default": 100,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 2000
    }
  },
  {
    "displayName": "Enrich product details (PDP)",
    "name": "getProductDetails",
    "description": "When ON (default), visits each product detail page for exact stock quantity, Make-in-India %, BIS certifications, and Golden Parameters. When OFF, extracts listings from the fast JSON API only (prices, L1 rank, unmasked seller, MOQ) plus any cached Golden Parameters.",
    "required": false,
    "default": true,
    "type": "boolean"
  },
  {
    "displayName": "Monitor mode (emit deltas only)",
    "name": "onlyDeltas",
    "description": "Compare against the previous snapshot in the named KV store and emit only new listings, price changes, L1 rank shifts, or seller changes. First run establishes the baseline.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Sort order",
    "name": "sortBy",
    "description": "Server-side sort order applied to category searches.",
    "required": false,
    "default": "price_in_asc",
    "type": "options",
    "options": [
      {
        "name": "Price: Low to High (L1 first)",
        "value": "price_in_asc"
      },
      {
        "name": "Price: High to Low",
        "value": "price_in_desc"
      },
      {
        "name": "Popularity",
        "value": "popularity"
      },
      {
        "name": "Latest",
        "value": "latest"
      }
    ]
  },
  {
    "displayName": "Make in India only",
    "name": "makeInIndiaOnly",
    "description": "Apply GeM's server-side Make in India (MII) filter to category searches.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Max listing pages per category",
    "name": "maxPagesPerCategory",
    "description": "Hard cap on listing pages fetched per category (20 items/page).",
    "required": false,
    "default": 10,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 50
    }
  },
  {
    "displayName": "Max PDP enrichments per run",
    "name": "maxPdpEnrichments",
    "description": "Hard cap on product detail HTML pages fetched in a single run to control runtime and cost.",
    "required": false,
    "default": 100,
    "type": "number",
    "typeOptions": {
      "minValue": 0,
      "maxValue": 500
    }
  },
  {
    "displayName": "Monitor state store name",
    "name": "stateStoreName",
    "description": "Named Apify Key-Value Store used to persist product price/L1 snapshots and cached Golden Parameters across scheduled runs (30-day TTL).",
    "required": false,
    "default": "gem-mkp-l1-monitor-state",
    "type": "string"
  },
  {
    "displayName": "Max concurrency",
    "name": "maxConcurrency",
    "description": "Maximum concurrent HTTP requests over the Indian residential proxy.",
    "required": false,
    "default": 3,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 5
    }
  },
  {
    "displayName": "Debug mode",
    "name": "debugMode",
    "description": "Enable verbose debug logging and save raw HTML/JSON failure artifacts to the Key-Value Store.",
    "required": false,
    "default": false,
    "type": "boolean"
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
