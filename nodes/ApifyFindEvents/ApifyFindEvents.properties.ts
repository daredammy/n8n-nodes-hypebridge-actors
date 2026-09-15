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
	const rawSelectedPlatforms = context.getNodeParameter('platforms', itemIndex, []);
	const selectedPlatforms = Array.isArray(rawSelectedPlatforms)
		? rawSelectedPlatforms.filter((value): value is string => typeof value === 'string' && value.length > 0)
		: [];
	return {
		...defaultInput,
		// Category (category)
		category: context.getNodeParameter('category', itemIndex, "all"),
		// City (city)
		city: context.getNodeParameter('city', itemIndex, "Dallas, TX"),
		// Time window (timeWindow)
		...getOptionalParam(context, 'timeWindow', itemIndex),
		// Max events (maxEvents)
		maxEvents: context.getNodeParameter('maxEvents', itemIndex, 50),
		// Get event details (getEventDetails)
		getEventDetails: context.getNodeParameter('getEventDetails', itemIndex, false),
		// Platforms (platforms)
		...(selectedPlatforms.length > 0 ? { platforms: selectedPlatforms } : {}),
		// Child run timeout (childRunTimeoutSecs)
		childRunTimeoutSecs: context.getNodeParameter('childRunTimeoutSecs', itemIndex, 240),
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
    "displayName": "Category",
    "name": "category",
    "description": "Canonical event category used to route across supported platforms.",
    "required": true,
    "default": "all",
    "type": "options",
    "options": [
      {
        "name": "All",
        "value": "all"
      },
      {
        "name": "Music",
        "value": "music"
      },
      {
        "name": "Nightlife",
        "value": "nightlife"
      },
      {
        "name": "Business",
        "value": "business"
      },
      {
        "name": "Technology",
        "value": "technology"
      },
      {
        "name": "Food & Drink",
        "value": "food_drink"
      },
      {
        "name": "Arts & Culture",
        "value": "arts_culture"
      },
      {
        "name": "Comedy",
        "value": "comedy"
      },
      {
        "name": "Sports & Fitness",
        "value": "sports_fitness"
      },
      {
        "name": "Wellness",
        "value": "wellness"
      },
      {
        "name": "Community & Culture",
        "value": "community_culture"
      },
      {
        "name": "Family & Education",
        "value": "family_education"
      }
    ]
  },
  {
    "displayName": "City",
    "name": "city",
    "description": "Free-form city, optionally including state or country, for example Dallas, TX or New York.",
    "required": true,
    "default": "Dallas, TX",
    "type": "string"
  },
  {
    "displayName": "Time window",
    "name": "timeWindow",
    "description": "Filter events to a simple time window. Resolved to concrete start/end dates internally using the resolved city timezone.",
    "required": false,
    "default": "this_month",
    "type": "options",
    "options": [
      {
        "name": "This week",
        "value": "this_week"
      },
      {
        "name": "This month",
        "value": "this_month"
      },
      {
        "name": "All",
        "value": "all"
      }
    ]
  },
  {
    "displayName": "Max events",
    "name": "maxEvents",
    "description": "Maximum number of normalized events to return across all platforms.",
    "required": true,
    "default": 50,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 500
    }
  },
  {
    "displayName": "Get event details",
    "name": "getEventDetails",
    "description": "Ask supported child actors to enrich listings with full event-page details. Unsupported child actors ignore this setting.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Platforms",
    "name": "platforms",
    "description": "Optional source allowlist. Leave empty for Auto; select values only to restrict the search.",
    "required": false,
    "default": [],
    "type": "multiOptions",
    "options": [
      {
        "name": "Eventbrite",
        "value": "eventbrite"
      },
      {
        "name": "Meetup",
        "value": "meetup"
      },
      {
        "name": "Luma",
        "value": "luma"
      },
      {
        "name": "Partiful",
        "value": "partiful"
      },
      {
        "name": "Dice",
        "value": "dice"
      },
      {
        "name": "Eventnoire",
        "value": "eventnoire"
      },
      {
        "name": "Posh",
        "value": "posh"
      },
      {
        "name": "Prekindle",
        "value": "prekindle"
      },
      {
        "name": "Shotgun",
        "value": "shotgun"
      },
      {
        "name": "Showpass",
        "value": "showpass"
      },
      {
        "name": "Sympla",
        "value": "sympla"
      },
      {
        "name": "RunSignup",
        "value": "runsignup"
      },
      {
        "name": "Eventeny",
        "value": "eventeny"
      }
    ]
  },
  {
    "displayName": "Child run timeout",
    "name": "childRunTimeoutSecs",
    "description": "Maximum seconds to wait for any one downstream actor.",
    "required": false,
    "default": 240,
    "type": "number",
    "typeOptions": {
      "minValue": 30,
      "maxValue": 900
    }
  },
  {
    "displayName": "Debug mode",
    "name": "debugMode",
    "description": "Store route plans, child inputs, affinity decisions, and skipped-platform reasons in the key-value store.",
    "required": false,
    "default": false,
    "type": "boolean"
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
