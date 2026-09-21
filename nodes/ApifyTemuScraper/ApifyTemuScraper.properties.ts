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
		// Max items (maxItems)
		maxItems: context.getNodeParameter('maxItems', itemIndex, 40),
		// Get product details (enrich from PDP) (getProductDetails)
		getProductDetails: context.getNodeParameter('getProductDetails', itemIndex, false),
		// Extract customer reviews (PDP) (extractReviews)
		extractReviews: context.getNodeParameter('extractReviews', itemIndex, false),
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
    "description": "Temu URLs to scrape: Homepage, Product Detail pages, Category catalogs, Store pages, or Deals channels. Search result URLs are NOT supported and will be rejected - Temu serves search only from a prerender cache that cannot be warmed on demand.",
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
    "displayName": "Max items",
    "name": "maxItems",
    "description": "Maximum number of product items/records to extract across the run.",
    "required": true,
    "default": 40,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 5000
    }
  },
  {
    "displayName": "Get product details (enrich from PDP)",
    "name": "getProductDetails",
    "description": "When scraping search results, categories, or home feeds, automatically fetch each product's full PDP page for SKU variant matrix, high-resolution galleries, and specifications.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Extract customer reviews (PDP)",
    "name": "extractReviews",
    "description": "When scraping Product Detail Pages (PDP), also extract top buyer reviews, star ratings, and buyer photos into the dataset.",
    "required": false,
    "default": false,
    "type": "boolean"
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
