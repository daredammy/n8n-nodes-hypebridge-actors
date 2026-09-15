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
		// Brand Name (brandName)
		brandName: context.getNodeParameter('brandName', itemIndex, "Nightly Traffic"),
		// Brand Fit Criteria (criteria)
		criteria: context.getNodeParameter('criteria', itemIndex, "Must have lived in Dallas for >3 years.\nWent to High School or College in target city.\nIs younger than 35.\nHas more than 10K followers.\nHas an engaging voice and creates authentic content."),
		// Influencer Handle (Optional if Evaluation ID is provided) (influencerHandle)
		...getOptionalParam(context, 'influencerHandle', itemIndex),
		// Platform (platform)
		...getOptionalParam(context, 'platform', itemIndex),
		// Evaluation ID (Optional) (evaluationId)
		...getOptionalParam(context, 'evaluationId', itemIndex),
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
    "displayName": "Brand Name",
    "name": "brandName",
    "description": "Name of the brand or company conducting the fit analysis (1-100 characters).",
    "required": true,
    "default": "Nightly Traffic",
    "type": "string"
  },
  {
    "displayName": "Brand Fit Criteria",
    "name": "criteria",
    "description": "Detailed prompt or list of criteria to evaluate the influencer against (10-10,000 characters).",
    "required": true,
    "default": "Must have lived in Dallas for >3 years.\nWent to High School or College in target city.\nIs younger than 35.\nHas more than 10K followers.\nHas an engaging voice and creates authentic content.",
    "type": "string",
    "typeOptions": {
      "rows": 5
    }
  },
  {
    "displayName": "Influencer Handle (Optional if Evaluation ID is provided)",
    "name": "influencerHandle",
    "description": "Social media handle (e.g., 'natgeo' or '@natgeo'). Required if Evaluation ID is not provided.",
    "required": false,
    "default": "natgeo",
    "type": "string"
  },
  {
    "displayName": "Platform",
    "name": "platform",
    "description": "Social media platform (instagram or tiktok). Defaults to 'instagram'.",
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
  },
  {
    "displayName": "Evaluation ID (Optional)",
    "name": "evaluationId",
    "description": "Existing evaluation ID from a previous influencer evaluation run. If provided, skips initial evaluation step.",
    "required": false,
    "default": "",
    "type": "string"
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
