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
		// Stores (stores)
		stores: context.getNodeParameter('stores', itemIndex, ["walmart","target","kroger","fred_meyer"]),
		// Candidates per store (candidatesPerStore)
		candidatesPerStore: context.getNodeParameter('candidatesPerStore', itemIndex, 8),
		// Matching mode (matchMode)
		...getOptionalParam(context, 'matchMode', itemIndex),
		// Kroger ZIP Code (krogerZipCode)
		...getOptionalParam(context, 'krogerZipCode', itemIndex),
		// Fred Meyer ZIP Code (fredMeyerZipCode)
		...getOptionalParam(context, 'fredMeyerZipCode', itemIndex),
		// Kroger Developer Client ID (krogerClientId)
		...getOptionalParam(context, 'krogerClientId', itemIndex),
		// Kroger Developer Client Secret (krogerClientSecret)
		...getOptionalParam(context, 'krogerClientSecret', itemIndex),
		// Max child actor spend (USD) (maxChildSpendUsd)
		maxChildSpendUsd: context.getNodeParameter('maxChildSpendUsd', itemIndex, 1),
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
    "description": "Grocery staples to compare across supermarkets (e.g., 'whole milk 1 gallon', 'large white eggs 12 ct'). Max 20 items per run.",
    "required": true,
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
    "displayName": "Stores",
    "name": "stores",
    "description": "Supermarket chains to compare. Walmart & Target use national online pricing; Kroger & Fred Meyer use store-specific regional pricing.",
    "required": false,
    "default": [
      "walmart",
      "target",
      "kroger",
      "fred_meyer"
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
        "name": "Kroger",
        "value": "kroger"
      },
      {
        "name": "Fred Meyer",
        "value": "fred_meyer"
      }
    ]
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
        "name": "Store brand equivalent only (Great Value ≈ Good & Gather ≈ Kroger / Private Selection)",
        "value": "private_label_equivalent"
      },
      {
        "name": "Exact national brand only",
        "value": "exact_brand_only"
      }
    ]
  },
  {
    "displayName": "Kroger ZIP Code",
    "name": "krogerZipCode",
    "description": "ZIP code used to resolve local Kroger store pricing and inventory. Default: 45202 (Cincinnati, OH).",
    "required": false,
    "default": "45202",
    "type": "string"
  },
  {
    "displayName": "Fred Meyer ZIP Code",
    "name": "fredMeyerZipCode",
    "description": "ZIP code used to resolve local Fred Meyer store pricing and inventory. Default: 97201 (Portland, OR).",
    "required": false,
    "default": "97201",
    "type": "string"
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
    "description": "Hard budget cap on pass-through child scraper execution charges for this run.",
    "required": false,
    "default": 1,
    "type": "number",
    "typeOptions": {
      "minValue": 0.1,
      "maxValue": 10
    }
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
