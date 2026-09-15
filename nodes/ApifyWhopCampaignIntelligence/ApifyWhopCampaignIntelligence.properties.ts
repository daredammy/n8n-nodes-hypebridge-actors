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
		maxItems: context.getNodeParameter('maxItems', itemIndex, 25),
		// Get full campaign details (getCampaignDetails)
		getCampaignDetails: context.getNodeParameter('getCampaignDetails', itemIndex, true),
		// Modes (modes)
		modes: context.getNodeParameter('modes', itemIndex, ["campaigns"]),
		// Campaign search queries (campaignSearchQueries)
		...getFixedCollectionParam(context, 'campaignSearchQueries', itemIndex, 'values', 'mapValues'),
		// Catalog search queries (catalogSearchQueries)
		...getFixedCollectionParam(context, 'catalogSearchQueries', itemIndex, 'values', 'mapValues'),
		// Category URLs (categoryUrls)
		...getFixedCollectionParam(context, 'categoryUrls', itemIndex, 'items', 'passthrough'),
		// Include completed campaigns (includeCompletedCampaigns)
		includeCompletedCampaigns: context.getNodeParameter('includeCompletedCampaigns', itemIndex, false),
		// Max search queries (maxSearchQueries)
		maxSearchQueries: context.getNodeParameter('maxSearchQueries', itemIndex, 5),
		// Max categories (maxCategories)
		maxCategories: context.getNodeParameter('maxCategories', itemIndex, 10),
		// Max pages per catalog query (maxPagesPerQuery)
		maxPagesPerQuery: context.getNodeParameter('maxPagesPerQuery', itemIndex, 5),
		// Max catalog listings (maxListings)
		maxListings: context.getNodeParameter('maxListings', itemIndex, 500),
		// Max campaigns (maxCampaigns)
		maxCampaigns: context.getNodeParameter('maxCampaigns', itemIndex, 500),
		// Max campaign detail requests (maxCampaignDetails)
		maxCampaignDetails: context.getNodeParameter('maxCampaignDetails', itemIndex, 25),
		// Max company enrichments (maxEnrichments)
		maxEnrichments: context.getNodeParameter('maxEnrichments', itemIndex, 100),
		// Max concurrency (maxConcurrency)
		maxConcurrency: context.getNodeParameter('maxConcurrency', itemIndex, 5),
		// Max campaign response bytes (maxResponseBytes)
		maxResponseBytes: context.getNodeParameter('maxResponseBytes', itemIndex, 12582912),
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
    "description": "Whop search, browse, company/product, Content Rewards discovery, or campaign detail URLs. Direct detail URLs are always fully enriched.",
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
    "displayName": "Max items",
    "name": "maxItems",
    "description": "Maximum records across all selected modes.",
    "required": true,
    "default": 25,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 1000
    }
  },
  {
    "displayName": "Get full campaign details",
    "name": "getCampaignDetails",
    "description": "Fetch requirements, resources, payouts, views, daily metrics, and top earners. Direct campaign URLs are always detailed.",
    "required": false,
    "default": true,
    "type": "boolean"
  },
  {
    "displayName": "Modes",
    "name": "modes",
    "description": "Campaigns returns campaign records; Catalog searches Whop; Enriched leads joins campaigns to public company data. Campaigns and Enriched leads cannot be combined.",
    "required": true,
    "default": [
      "campaigns"
    ],
    "type": "multiOptions",
    "options": [
      {
        "name": "Campaigns",
        "value": "campaigns"
      },
      {
        "name": "Catalog",
        "value": "catalog"
      },
      {
        "name": "Enriched leads",
        "value": "enrichedLeads"
      }
    ]
  },
  {
    "displayName": "Campaign search queries",
    "name": "campaignSearchQueries",
    "description": "Optional public Content Rewards searches.",
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
    "displayName": "Catalog search queries",
    "name": "catalogSearchQueries",
    "description": "Keywords for bounded Whop catalog search.",
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
    "displayName": "Category URLs",
    "name": "categoryUrls",
    "description": "Whop /discover/browse category URLs. Only Max categories are accepted.",
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
    "displayName": "Include completed campaigns",
    "name": "includeCompletedCampaigns",
    "description": "Also fetch the separate, large completed campaign collection.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Max search queries",
    "name": "maxSearchQueries",
    "description": "Maximum combined campaign and catalog query count.",
    "required": false,
    "default": 5,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 20
    }
  },
  {
    "displayName": "Max categories",
    "name": "maxCategories",
    "description": "Maximum Whop categories scheduled.",
    "required": false,
    "default": 10,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 50
    }
  },
  {
    "displayName": "Max pages per catalog query",
    "name": "maxPagesPerQuery",
    "description": "Hard page-number pagination cap per catalog query.",
    "required": false,
    "default": 5,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 50
    }
  },
  {
    "displayName": "Max catalog listings",
    "name": "maxListings",
    "description": "Maximum catalog candidates collected across searches and categories.",
    "required": false,
    "default": 500,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 1000
    }
  },
  {
    "displayName": "Max campaigns",
    "name": "maxCampaigns",
    "description": "Maximum unique campaigns collected before detail scheduling.",
    "required": false,
    "default": 500,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 1000
    }
  },
  {
    "displayName": "Max campaign detail requests",
    "name": "maxCampaignDetails",
    "description": "Maximum unique campaigns enriched with full detail.",
    "required": false,
    "default": 25,
    "type": "number",
    "typeOptions": {
      "minValue": 0,
      "maxValue": 500
    }
  },
  {
    "displayName": "Max company enrichments",
    "name": "maxEnrichments",
    "description": "Maximum campaign companies joined in Enriched leads mode.",
    "required": false,
    "default": 100,
    "type": "number",
    "typeOptions": {
      "minValue": 0,
      "maxValue": 500
    }
  },
  {
    "displayName": "Max concurrency",
    "name": "maxConcurrency",
    "description": "Global concurrency cap; Content Rewards requests remain capped at two.",
    "required": false,
    "default": 5,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 10
    }
  },
  {
    "displayName": "Max campaign response bytes",
    "name": "maxResponseBytes",
    "description": "Abort an unexpectedly large campaign response before it exhausts memory.",
    "required": false,
    "default": 12582912,
    "type": "number",
    "typeOptions": {
      "minValue": 1048576,
      "maxValue": 25165824
    }
  },
  {
    "displayName": "Debug mode",
    "name": "debugMode",
    "description": "Enable verbose bounded diagnostics.",
    "required": false,
    "default": false,
    "type": "boolean"
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
