import { IExecuteFunctions, INodeProperties } from 'n8n-workflow';

// Helper functions for parameter extraction
export function getFixedCollectionParam(
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

export function getJsonParam(context: IExecuteFunctions, paramName: string, itemIndex: number): Record<string, any> {
	try {
		const rawValue = context.getNodeParameter(paramName, itemIndex);
		if (typeof rawValue === 'string' && rawValue.trim() === '') {
			return {};
		}
		return { [paramName]: typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue };
	} catch (error) {
		throw new Error(`Invalid JSON in parameter "${paramName}": ${(error as Error).message}`);
	}
}

export function getOptionalParam(context: IExecuteFunctions, paramName: string, itemIndex: number): Record<string, any> {
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
		// Category (category)
		category: context.getNodeParameter('category', itemIndex),
		// City (city)
		city: context.getNodeParameter('city', itemIndex),
		// Time window (timeWindow)
		timeWindow: context.getNodeParameter('timeWindow', itemIndex),
		// Max events (maxEvents)
		maxEvents: context.getNodeParameter('maxEvents', itemIndex),
		// Get event details (getEventDetails)
		getEventDetails: context.getNodeParameter('getEventDetails', itemIndex),
		// Platforms (platforms)
		platforms: context.getNodeParameter('platforms', itemIndex),
		// Max cheap actors (maxCheapActors)
		maxCheapActors: context.getNodeParameter('maxCheapActors', itemIndex),
		// Use expensive fallbacks (useExpensiveFallbacks)
		useExpensiveFallbacks: context.getNodeParameter('useExpensiveFallbacks', itemIndex),
		// Min useful results (minUsefulResults)
		minUsefulResults: context.getNodeParameter('minUsefulResults', itemIndex),
		// Child run timeout (childRunTimeoutSecs)
		childRunTimeoutSecs: context.getNodeParameter('childRunTimeoutSecs', itemIndex),
		// Debug mode (debugMode)
		debugMode: context.getNodeParameter('debugMode', itemIndex),
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
    "description": "Platforms to include. Partiful runs only when the requested city maps to a supported metro region.",
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
      }
    ]
  },
  {
    "displayName": "Max cheap actors",
    "name": "maxCheapActors",
    "description": "Maximum number of cheap downstream actors to run before considering expensive fallbacks.",
    "required": false,
    "default": 5,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 8
    }
  },
  {
    "displayName": "Use expensive fallbacks",
    "name": "useExpensiveFallbacks",
    "description": "Allow Eventbrite and other expensive actors if cheap actors do not produce enough results.",
    "required": false,
    "default": true,
    "type": "boolean"
  },
  {
    "displayName": "Min useful results",
    "name": "minUsefulResults",
    "description": "If a platform returns fewer records than this and maxEvents is not reached, continue to the next platform.",
    "required": false,
    "default": 3,
    "type": "number",
    "typeOptions": {
      "minValue": 0,
      "maxValue": 50
    }
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
    "description": "Store route plans, child inputs, pricing decisions, and skipped-platform reasons in the key-value store.",
    "required": false,
    "default": false,
    "type": "boolean"
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];