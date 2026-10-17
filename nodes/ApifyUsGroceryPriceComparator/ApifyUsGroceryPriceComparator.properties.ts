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
		// Grocery items (queries)
		...getFixedCollectionParam(context, 'queries', itemIndex, 'values', 'mapValues'),
		// Preset Staple Basket (presetBasket)
		...getOptionalParam(context, 'presetBasket', itemIndex),
		// Stores (stores)
		stores: context.getNodeParameter('stores', itemIndex, ["walmart","target","kroger"]),
		// ZIP code (local prices) (zipCode)
		...getOptionalParam(context, 'zipCode', itemIndex),
		// Candidates per store (candidatesPerStore)
		candidatesPerStore: context.getNodeParameter('candidatesPerStore', itemIndex, 8),
		// Matching mode (matchMode)
		...getOptionalParam(context, 'matchMode', itemIndex),
		// Kroger Developer Client ID (krogerClientId)
		...getOptionalParam(context, 'krogerClientId', itemIndex),
		// Kroger Developer Client Secret (krogerClientSecret)
		...getOptionalParam(context, 'krogerClientSecret', itemIndex),
		// Max child actor spend (USD) (maxChildSpendUsd)
		maxChildSpendUsd: context.getNodeParameter('maxChildSpendUsd', itemIndex, 5),
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
    "displayName": "Grocery items",
    "name": "queries",
    "description": "Grocery staples to compare across supermarkets (e.g., 'whole milk 1 gallon', 'large white eggs 12 ct'). Max 50 items per run. Can be combined with or replaced by a Preset Staple Basket.",
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
    "displayName": "Preset Staple Basket",
    "name": "presetBasket",
    "description": "Optional pre-configured grocery basket for instant benchmarking or CPI/inflation tracking. Merged with any custom Grocery items above (up to 50 total).",
    "required": false,
    "default": "none",
    "type": "options",
    "options": [
      {
        "name": "None (Use custom Grocery items only)",
        "value": "none"
      },
      {
        "name": "USDA Thrifty Food Plan Staples (15 items)",
        "value": "usda_thrifty_15"
      },
      {
        "name": "BLS / CPI Core Food-at-Home Basket (25 items)",
        "value": "cpi_core_25"
      },
      {
        "name": "Low-Carb / Keto Household Staples (10 items)",
        "value": "keto_10"
      },
      {
        "name": "Baking Essentials Basket (8 items)",
        "value": "baking_essentials_8"
      }
    ]
  },
  {
    "displayName": "Stores",
    "name": "stores",
    "description": "Supermarket chains to compare (11 supported banners). Every store is priced at the nearest store to your ZIP code. A banner with no store within ~25 miles of the ZIP is skipped (null in storeLocations) rather than priced from another region.",
    "required": false,
    "default": [
      "walmart",
      "target",
      "kroger"
    ],
    "type": "multiOptions",
    "options": [
      {
        "name": "Walmart",
        "value": "walmart"
      },
      {
        "name": "Target",
        "value": "target"
      },
      {
        "name": "Kroger (Midwest / South)",
        "value": "kroger"
      },
      {
        "name": "Fred Meyer (Pacific Northwest)",
        "value": "fred_meyer"
      },
      {
        "name": "Ralphs (Southern California)",
        "value": "ralphs"
      },
      {
        "name": "Harris Teeter (Mid-Atlantic / Carolinas)",
        "value": "harris_teeter"
      },
      {
        "name": "King Soopers (Colorado / Rocky Mountains)",
        "value": "king_soopers"
      },
      {
        "name": "Fry's Food Stores (Arizona)",
        "value": "frys"
      },
      {
        "name": "Mariano's (Chicagoland)",
        "value": "marianos"
      },
      {
        "name": "Smith's Food & Drug (Mountain West / Nevada / Utah)",
        "value": "smiths"
      },
      {
        "name": "QFC - Quality Food Centers (Seattle / Puget Sound)",
        "value": "qfc"
      }
    ]
  },
  {
    "displayName": "ZIP code (local prices)",
    "name": "zipCode",
    "description": "5-digit US ZIP code. Walmart, Target and every Kroger banner are priced at the nearest store to this ZIP, so all prices come from the same neighbourhood. Kroger banners only exist in some regions (e.g. Fred Meyer in the Pacific Northwest); one with no store near the ZIP is skipped. Default: 45202 (Cincinnati, OH), where Walmart, Target and Kroger all have stores.",
    "required": false,
    "default": "45202",
    "type": "string"
  },
  {
    "displayName": "Candidates per store",
    "name": "candidatesPerStore",
    "description": "Number of search results inspected per store. Higher numbers improve store-brand matching accuracy.",
    "required": false,
    "default": 8,
    "type": "number",
    "typeOptions": {
      "minValue": 3,
      "maxValue": 12
    }
  },
  {
    "displayName": "Matching mode",
    "name": "matchMode",
    "description": "Choose matching strategy: all available tiers (store brand + national brand + organic), equivalent store private labels only, or exact national brands only.",
    "required": false,
    "default": "all_tiers",
    "type": "options",
    "options": [
      {
        "name": "All matching tiers (Store Brand, National Brand, Organic)",
        "value": "all_tiers"
      },
      {
        "name": "Store brand equivalent only (Great Value ≈ Good & Gather ≈ Kroger / Simple Truth)",
        "value": "private_label_equivalent"
      },
      {
        "name": "Exact national brand only",
        "value": "exact_brand_only"
      }
    ]
  },
  {
    "displayName": "Kroger Developer Client ID",
    "name": "krogerClientId",
    "description": "Optional custom Kroger OAuth2 client_id from developer.kroger.com. Falls back to default environment credentials.",
    "required": false,
    "default": "",
    "type": "string"
  },
  {
    "displayName": "Kroger Developer Client Secret",
    "name": "krogerClientSecret",
    "description": "Optional custom Kroger OAuth2 client_secret from developer.kroger.com.",
    "required": false,
    "default": "",
    "type": "string"
  },
  {
    "displayName": "Max child actor spend (USD)",
    "name": "maxChildSpendUsd",
    "description": "Hard budget cap on pass-through Walmart/Target scraper charges for this run (about $0.10 per Walmart query and $0.07 per Target query at 8 candidates, free-tier rates). Queries beyond the cap are skipped. Kroger banners cost $0.",
    "required": false,
    "default": 5,
    "type": "number",
    "typeOptions": {
      "minValue": 0.1,
      "maxValue": 20
    }
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
