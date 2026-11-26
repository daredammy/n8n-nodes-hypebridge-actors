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
		// Maximum listings (maxItems)
		maxItems: context.getNodeParameter('maxItems', itemIndex, 250),
		// Fetch full listing details & UPC preview (getListingDetails)
		getListingDetails: context.getNodeParameter('getListingDetails', itemIndex, false),
		// Keyword search (searchQuery)
		...getOptionalParam(context, 'searchQuery', itemIndex),
		// Countries (markets) (countries)
		countries: context.getNodeParameter('countries', itemIndex, []),
		// Currencies (currencies)
		currencies: context.getNodeParameter('currencies', itemIndex, []),
		// Storefronts / Retailers (storefronts)
		...getFixedCollectionParam(context, 'storefronts', itemIndex, 'values', 'mapValues'),
		// Categories (categories)
		...getFixedCollectionParam(context, 'categories', itemIndex, 'values', 'mapValues'),
		// Conditions (conditions)
		conditions: context.getNodeParameter('conditions', itemIndex, []),
		// Inventory types (inventoryTypes)
		inventoryTypes: context.getNodeParameter('inventoryTypes', itemIndex, []),
		// Shipment / Transport modes (transportModes)
		transportModes: context.getNodeParameter('transportModes', itemIndex, []),
		// Buy Now lots only (buyNowOnly)
		buyNowOnly: context.getNodeParameter('buyNowOnly', itemIndex, false),
		// Sort by (sortBy)
		...getOptionalParam(context, 'sortBy', itemIndex),
		// Sort direction (sortDirection)
		...getOptionalParam(context, 'sortDirection', itemIndex),
		// Include live Auction telemetry (US/CA) (includeAuctionTelemetry)
		includeAuctionTelemetry: context.getNodeParameter('includeAuctionTelemetry', itemIndex, false),
		// Max images per listing (imagesPerAuction)
		imagesPerAuction: context.getNodeParameter('imagesPerAuction', itemIndex, 10),
		// Enable stateful monitor mode (monitorMode)
		monitorMode: context.getNodeParameter('monitorMode', itemIndex, false),
		// Monitor state key (monitorStateKey)
		...getOptionalParam(context, 'monitorStateKey', itemIndex),
		// Output changed/alerted lots only (onlyChanges)
		onlyChanges: context.getNodeParameter('onlyChanges', itemIndex, true),
		// Closing-soon alert window (hours) (closingSoonHours)
		closingSoonHours: context.getNodeParameter('closingSoonHours', itemIndex, 2),
		// Max concurrency (maxConcurrency)
		maxConcurrency: context.getNodeParameter('maxConcurrency', itemIndex, 5),
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
    "description": "Optional B-Stock browse, storefront (e.g. Amazon Europe), or direct listing detail URLs. Leave default to sweep the live global catalog.",
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
    "displayName": "Maximum listings",
    "name": "maxItems",
    "description": "Maximum number of matched auction listings to output per run.",
    "required": false,
    "default": 250,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 2000
    }
  },
  {
    "displayName": "Fetch full listing details & UPC preview",
    "name": "getListingDetails",
    "description": "When enabled, visits each listing detail page (plus live Auction telemetry for US/CA) to extract 10-row manifest UPC previews, shipping notes, view count, and full image galleries. Direct detail URLs in Start URLs are always enriched.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Keyword search",
    "name": "searchQuery",
    "description": "Optional keyword filter passed to B-Stock search (e.g. 'apple', 'dewalt', 'kitchen').",
    "required": false,
    "default": "",
    "type": "string"
  },
  {
    "displayName": "Countries (markets)",
    "name": "countries",
    "description": "Filter listings by warehouse country code. Leave empty for all supported markets.",
    "required": false,
    "default": [],
    "type": "multiOptions",
    "options": [
      {
        "name": "United States (US)",
        "value": "US"
      },
      {
        "name": "Canada (CA)",
        "value": "CA"
      },
      {
        "name": "United Kingdom (GB)",
        "value": "GB"
      },
      {
        "name": "Spain (ES)",
        "value": "ES"
      },
      {
        "name": "Slovakia (SK)",
        "value": "SK"
      },
      {
        "name": "Poland (PL)",
        "value": "PL"
      },
      {
        "name": "Italy (IT)",
        "value": "IT"
      },
      {
        "name": "Netherlands (NL)",
        "value": "NL"
      }
    ]
  },
  {
    "displayName": "Currencies",
    "name": "currencies",
    "description": "Filter by ISO 4217 currency code.",
    "required": false,
    "default": [],
    "type": "multiOptions",
    "options": [
      {
        "name": "USD",
        "value": "USD"
      },
      {
        "name": "EUR",
        "value": "EUR"
      },
      {
        "name": "CAD",
        "value": "CAD"
      },
      {
        "name": "GBP",
        "value": "GBP"
      }
    ]
  },
  {
    "displayName": "Storefronts / Retailers",
    "name": "storefronts",
    "description": "Filter by storefront name (case-insensitive substring match, e.g. 'Target', 'Walmart', 'Amazon Europe', 'Home Depot').",
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
    "displayName": "Categories",
    "name": "categories",
    "description": "Filter by product category (e.g. 'Electronics', 'Home & Garden', 'Building & Industrial').",
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
    "displayName": "Conditions",
    "name": "conditions",
    "description": "Filter by item condition.",
    "required": false,
    "default": [],
    "type": "multiOptions",
    "options": [
      {
        "name": "New",
        "value": "New"
      },
      {
        "name": "Like New",
        "value": "Like New"
      },
      {
        "name": "Used Good",
        "value": "Used Good"
      },
      {
        "name": "Used Fair",
        "value": "Used Fair"
      },
      {
        "name": "Used",
        "value": "Used"
      },
      {
        "name": "Mixed",
        "value": "Mixed"
      },
      {
        "name": "Scratch & Dent",
        "value": "Scratch & Dent"
      },
      {
        "name": "Salvage",
        "value": "Salvage"
      }
    ]
  },
  {
    "displayName": "Inventory types",
    "name": "inventoryTypes",
    "description": "Filter by inventory type.",
    "required": false,
    "default": [],
    "type": "multiOptions",
    "options": [
      {
        "name": "Customer Returns",
        "value": "Customer Returns"
      },
      {
        "name": "Overstock",
        "value": "Overstock"
      },
      {
        "name": "Mixed/Other",
        "value": "Mixed/Other"
      },
      {
        "name": "Shelf Pulls",
        "value": "Shelf Pulls"
      },
      {
        "name": "Warehouse Damaged",
        "value": "Warehouse Damaged"
      },
      {
        "name": "B-Stock Blue",
        "value": "B-Stock Blue"
      }
    ]
  },
  {
    "displayName": "Shipment / Transport modes",
    "name": "transportModes",
    "description": "Filter by freight type.",
    "required": false,
    "default": [],
    "type": "multiOptions",
    "options": [
      {
        "name": "LTL",
        "value": "LTL"
      },
      {
        "name": "Truckload",
        "value": "Truckload"
      },
      {
        "name": "PARCEL",
        "value": "PARCEL"
      }
    ]
  },
  {
    "displayName": "Buy Now lots only",
    "name": "buyNowOnly",
    "description": "Return only listings with Buy Now enabled.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Sort by",
    "name": "sortBy",
    "description": "Field used to sort matched listings before applying maxItems.",
    "required": false,
    "default": "endTime",
    "type": "options",
    "options": [
      {
        "name": "Closing Soonest / End Time",
        "value": "endTime"
      },
      {
        "name": "Current Bid",
        "value": "currentBid"
      },
      {
        "name": "Retail Value (MSRP)",
        "value": "retailPrice"
      },
      {
        "name": "Bid Count",
        "value": "numberOfBids"
      },
      {
        "name": "Bid-to-MSRP %",
        "value": "recoveryRatePct"
      },
      {
        "name": "Unit Count",
        "value": "units"
      }
    ]
  },
  {
    "displayName": "Sort direction",
    "name": "sortDirection",
    "description": "Sort order for matched listings.",
    "required": false,
    "default": "asc",
    "type": "options",
    "options": [
      {
        "name": "asc",
        "value": "asc"
      },
      {
        "name": "desc",
        "value": "desc"
      }
    ]
  },
  {
    "displayName": "Include live Auction telemetry (US/CA)",
    "name": "includeAuctionTelemetry",
    "description": "Fetch startPrice, nextMinBidAmount, actualEndTime, and closed status for US/CA lots even when full detail fetching is off. Automatically skipped for legacy EU listings.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Max images per listing",
    "name": "imagesPerAuction",
    "description": "Cap on image URLs returned per enriched listing.",
    "required": false,
    "default": 10,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 50
    }
  },
  {
    "displayName": "Enable stateful monitor mode",
    "name": "monitorMode",
    "description": "Persist a named snapshot across scheduled runs to detect new_lot, bid_update, closing_soon, and closed_hammer_snapshot events.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Monitor state key",
    "name": "monitorStateKey",
    "description": "Named key for stateful diffing (1-64 alphanumeric, hyphen, or underscore characters).",
    "required": false,
    "default": "bstock-default",
    "type": "string"
  },
  {
    "displayName": "Output changed/alerted lots only",
    "name": "onlyChanges",
    "description": "When monitorMode is enabled, emit only new, bid-updated, closing-soon, or newly closed lots.",
    "required": false,
    "default": true,
    "type": "boolean"
  },
  {
    "displayName": "Closing-soon alert window (hours)",
    "name": "closingSoonHours",
    "description": "Emit closing_soon delta event when an active lot closes within this many hours.",
    "required": false,
    "default": 2,
    "type": "number",
    "typeOptions": {
      "minValue": 0.25,
      "maxValue": 72
    }
  },
  {
    "displayName": "Max concurrency",
    "name": "maxConcurrency",
    "description": "Maximum concurrent requests.",
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
    "description": "Enable verbose logging and save debug artifacts on errors.",
    "required": false,
    "default": false,
    "type": "boolean"
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
