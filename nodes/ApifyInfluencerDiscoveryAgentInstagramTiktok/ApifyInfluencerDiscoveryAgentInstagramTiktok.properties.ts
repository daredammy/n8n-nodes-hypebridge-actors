import { IExecuteFunctions, INodeProperties } from 'n8n-workflow';

function getFixedCollectionParam(
	context: IExecuteFunctions,
	paramName: string,
	itemIndex: number,
	optionName: string,
	transformType: 'passthrough' | 'mapValues',
): Record<string, any> {
	const param = context.getNodeParameter(paramName, itemIndex, {}) as { [key: string]: any[] };
	if (!param?.[optionName]?.length) return {};

	let result = param[optionName];
	if (transformType === 'mapValues') {
		result = result.map((item: any) => item.value);
	}
	return { [paramName]: result };
}

function getOptionalParam(context: IExecuteFunctions, paramName: string, itemIndex: number): Record<string, any> {
	const value = context.getNodeParameter(paramName, itemIndex);
	return value !== undefined && value !== null && value !== '' ? { [paramName]: value } : {};
}

export function buildActorInput(
	context: IExecuteFunctions,
	itemIndex: number,
	defaultInput: Record<string, any>,
): Record<string, any> {
	return {
		...defaultInput,
		// Influencer Description (request)
		request: context.getNodeParameter('request', itemIndex),
		// Target Quantity (targetQuantity)
		targetQuantity: context.getNodeParameter('targetQuantity', itemIndex),
		// Exclude Accounts (excludeHandles)
		...getFixedCollectionParam(context, 'excludeHandles', itemIndex, 'values', 'mapValues'),
		// Platform (platform)
		platform: context.getNodeParameter('platform', itemIndex),
		// Minimum Followers (minFollowers)
		minFollowers: context.getNodeParameter('minFollowers', itemIndex),
		// Location (location)
		...getOptionalParam(context, 'location', itemIndex),
		// Similar To — Instagram Seeds (seedHandlesInstagram)
		...getFixedCollectionParam(context, 'seedHandlesInstagram', itemIndex, 'values', 'mapValues'),
		// Similar To — TikTok Seeds (seedHandlesTikTok)
		...getFixedCollectionParam(context, 'seedHandlesTikTok', itemIndex, 'values', 'mapValues'),
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
    "displayName": "Influencer Description",
    "name": "request",
    "description": "Describe your ideal influencer and the actor will find matches (Instagram and TikTok only).",
    "required": true,
    "default": "Fashion influencer on Instagram with 100k+ followers who focuses on sustainable clothing and lifestyle",
    "type": "string",
    "typeOptions": {
      "rows": 5
    }
  },
  {
    "displayName": "Target Quantity",
    "name": "targetQuantity",
    "description": "Number of influencers to find (optional, defaults to 10). Note that result quantity may vary based on platform and filters.",
    "required": false,
    "default": 10,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 30
    }
  },
  {
    "displayName": "Exclude Accounts",
    "name": "excludeHandles",
    "description": "Accounts you already have. Never scraped, never evaluated, never billed. For long rosters, pass this as a JSON array via the API.",
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
    "displayName": "Platform",
    "name": "platform",
    "description": "Social media platform (optional filter)",
    "required": false,
    "default": "",
    "type": "options",
    "options": [
      {
        "name": "Instagram",
        "value": "instagram"
      },
      {
        "name": "TikTok",
        "value": "tiktok"
      },
      {
        "name": "Mixed",
        "value": "mixed"
      }
    ]
  },
  {
    "displayName": "Minimum Followers",
    "name": "minFollowers",
    "description": "Minimum follower count (optional filter).",
    "required": false,
    "default": 0,
    "type": "number",
    "typeOptions": {
      "minValue": 0
    }
  },
  {
    "displayName": "Location",
    "name": "location",
    "description": "Preferred location (optional filter)",
    "required": false,
    "default": "United States",
    "type": "string"
  },
  {
    "displayName": "Similar To — Instagram Seeds",
    "name": "seedHandlesInstagram",
    "description": "Find Instagram creators similar to these handles (with or without '@'). Seeds are crawl starting points and are never returned as results.",
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
    "displayName": "Similar To — TikTok Seeds",
    "name": "seedHandlesTikTok",
    "description": "Find TikTok creators similar to these handles (with or without '@').",
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
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
