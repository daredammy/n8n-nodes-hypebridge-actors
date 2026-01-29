import { IExecuteFunctions, INodeProperties } from 'n8n-workflow';

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
		// Platform (platform)
		platform: context.getNodeParameter('platform', itemIndex),
		// Minimum Followers (minFollowers)
		minFollowers: context.getNodeParameter('minFollowers', itemIndex),
		// Maximum Followers (maxFollowers)
		maxFollowers: context.getNodeParameter('maxFollowers', itemIndex),
		// Location (location)
		...getOptionalParam(context, 'location', itemIndex),
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
    "type": "string"
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
    "description": "Minimum follower count (optional filter)",
    "required": false,
    "default": 0,
    "type": "number",
    "typeOptions": {}
  },
  {
    "displayName": "Maximum Followers",
    "name": "maxFollowers",
    "description": "Maximum follower count (optional filter)",
    "required": false,
    "default": 0,
    "type": "number",
    "typeOptions": {}
  },
  {
    "displayName": "Location",
    "name": "location",
    "description": "Preferred location (optional filter)",
    "required": false,
    "default": "United States",
    "type": "string"
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
