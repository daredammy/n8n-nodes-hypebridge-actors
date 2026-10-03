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
		// Influencer Handle or Profile URL (influencerHandle)
		...getOptionalParam(context, 'influencerHandle', itemIndex),
		// Social Platform (platform)
		...getOptionalParam(context, 'platform', itemIndex),
		// Existing Evaluation ID (Optional) (evaluationId)
		...getOptionalParam(context, 'evaluationId', itemIndex),
		// Niche Override (Optional) (nicheOverride)
		...getOptionalParam(context, 'nicheOverride', itemIndex),
		// Include Live Marketplace UGC Comps (includeUgcComps)
		includeUgcComps: context.getNodeParameter('includeUgcComps', itemIndex, true),
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
    "displayName": "Influencer Handle or Profile URL",
    "name": "influencerHandle",
    "description": "Instagram or TikTok handle (e.g. '@carsandbids') or a profile URL. Required if Evaluation ID is omitted.",
    "required": false,
    "default": "@carsandbids",
    "type": "string"
  },
  {
    "displayName": "Social Platform",
    "name": "platform",
    "description": "Platform to price. Ignored when a profile URL or an Evaluation ID decides the platform.",
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
    "displayName": "Existing Evaluation ID (Optional)",
    "name": "evaluationId",
    "description": "ID from a previous HypeBridge evaluation or Brand Fit run (the `evaluationId` field in the Brand Fit output). Skips the evaluation step; handle and platform are read from the evaluation itself.",
    "required": false,
    "default": "",
    "type": "string"
  },
  {
    "displayName": "Niche Override (Optional)",
    "name": "nicheOverride",
    "description": "Force a niche category instead of detecting it from the creator's content themes.",
    "required": false,
    "default": "auto",
    "type": "options",
    "options": [
      {
        "name": "Auto-Detect from Profile Content",
        "value": "auto"
      },
      {
        "name": "Tech & SaaS (2.00x)",
        "value": "tech_saas"
      },
      {
        "name": "Finance, Business & Crypto (2.00x)",
        "value": "finance_business"
      },
      {
        "name": "Parenting & Family (1.40x)",
        "value": "parenting_family"
      },
      {
        "name": "Health, Fitness & Wellness (1.30x)",
        "value": "health_fitness"
      },
      {
        "name": "Automotive & Hardware (1.40x)",
        "value": "automotive"
      },
      {
        "name": "Beauty, Skincare & Fashion (1.20x)",
        "value": "beauty_fashion"
      },
      {
        "name": "Home, Interior & DIY (1.25x)",
        "value": "home_diy"
      },
      {
        "name": "Pet Care & Animals (1.10x)",
        "value": "pet_care"
      },
      {
        "name": "Travel & Hospitality (1.20x)",
        "value": "travel_hospitality"
      },
      {
        "name": "Food, Beverage & Cooking (1.15x)",
        "value": "food_beverage"
      },
      {
        "name": "General Lifestyle (1.00x)",
        "value": "lifestyle"
      },
      {
        "name": "Entertainment & Comedy (1.00x)",
        "value": "entertainment_comedy"
      },
      {
        "name": "Gaming & Esports (1.00x)",
        "value": "gaming_esports"
      }
    ]
  },
  {
    "displayName": "Include Live Marketplace UGC Comps",
    "name": "includeUgcComps",
    "description": "Queries the live JoinBrands UGC creator directory to attach asset-production fee benchmarks.",
    "required": false,
    "default": true,
    "type": "boolean"
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
