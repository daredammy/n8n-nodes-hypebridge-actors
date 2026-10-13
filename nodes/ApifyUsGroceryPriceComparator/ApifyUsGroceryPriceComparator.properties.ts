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
		stores: context.getNodeParameter('stores', itemIndex, ["walmart","target"]),
		// Candidates per store (candidatesPerStore)
		candidatesPerStore: context.getNodeParameter('candidatesPerStore', itemIndex, 8),
		// Matching mode (matchMode)
		...getOptionalParam(context, 'matchMode', itemIndex),
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
    "description": "Grocery staples to compare across Walmart and Target (e.g., 'whole milk 1 gallon', 'large white eggs 12 ct'). Max 20 items per run.",
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
    "description": "Stores to compare. Prices represent national online listing prices.",
    "required": false,
    "default": [
      "walmart",
      "target"
    ],
    "type": "multiOptions",
    "options": [
      {
        "name": "walmart",
        "value": "walmart"
      },
      {
        "name": "target",
        "value": "target"
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
    "description": "Choose whether to allow equivalent store private labels (Great Value ≈ Good & Gather) or strictly compare exact national brands.",
    "required": false,
    "default": "private_label_equivalent",
    "type": "options",
    "options": [
      {
        "name": "Equivalent store brands allowed",
        "value": "private_label_equivalent"
      },
      {
        "name": "Exact brand only",
        "value": "exact_brand_only"
      }
    ]
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
