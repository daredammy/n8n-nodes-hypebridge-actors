import { IExecuteFunctions, INodeProperties } from 'n8n-workflow';

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
		// Influencer Handle (influencerHandle)
		influencerHandle: context.getNodeParameter('influencerHandle', itemIndex, "natgeo"),
		// Platform (platform)
		...getOptionalParam(context, 'platform', itemIndex),
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
    "description": "One Instagram or TikTok handle or matching profile URL. Instagram handles allow 1-30 letters, numbers, periods, or underscores; periods cannot lead, trail, or repeat. TikTok handles allow 1-24 letters, numbers, periods, or underscores; a period cannot be last.",
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
