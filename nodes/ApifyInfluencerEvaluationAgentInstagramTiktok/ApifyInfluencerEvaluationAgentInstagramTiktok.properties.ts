import { IExecuteFunctions, INodeProperties } from 'n8n-workflow';

export function buildActorInput(
	context: IExecuteFunctions,
	itemIndex: number,
	defaultInput: Record<string, any>,
): Record<string, any> {
	return {
		...defaultInput,
		// Influencer Handle (influencerHandle)
		influencerHandle: context.getNodeParameter('influencerHandle', itemIndex),
		// Platform (platform)
		platform: context.getNodeParameter('platform', itemIndex),
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
    "displayName": "Influencer Handle",
    "name": "influencerHandle",
    "description": "The Instagram or TikTok handle of the influencer to evaluate (e.g., 'natgeo' or '@natgeo'). The @ symbol is optional.",
    "required": true,
    "default": "natgeo",
    "type": "string"
  },
  {
    "displayName": "Platform",
    "name": "platform",
    "description": "Social media platform of the influencer. Defaults to Instagram if not specified.",
    "required": false,
    "default": "instagram",
    "type": "options",
    "options": [
      {
        "name": "Instagram",
        "value": "instagram"
      },
      {
        "name": "TikTok",
        "value": "tiktok"
      }
    ]
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
