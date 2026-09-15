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

function getDateParam(context: IExecuteFunctions, paramName: string, itemIndex: number): Record<string, any> {
	const value = context.getNodeParameter(paramName, itemIndex, undefined);
	if (value === undefined || value === null || value === '') return {};
	const date = String(value).slice(0, 10);
	return { [paramName]: date };
}

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
		// Start URLs (startUrls)
		...getFixedCollectionParam(context, 'startUrls', itemIndex, 'items', 'passthrough'),
		// Maximum races (maxRaces)
		maxRaces: context.getNodeParameter('maxRaces', itemIndex, 100),
		// Get sponsor rosters (getSponsors)
		getSponsors: context.getNodeParameter('getSponsors', itemIndex, false),
		// Race name contains (nameQuery)
		...getOptionalParam(context, 'nameQuery', itemIndex),
		// States / provinces (states)
		...getFixedCollectionParam(context, 'states', itemIndex, 'values', 'mapValues'),
		// Country (country)
		...getOptionalParam(context, 'country', itemIndex),
		// Races on or after (startDate)
		...getDateParam(context, 'startDate', itemIndex),
		// Races on or before (endDate)
		...getDateParam(context, 'endDate', itemIndex),
		// Event types (eventTypes)
		eventTypes: context.getNodeParameter('eventTypes', itemIndex, []),
		// Minimum distance (minDistance)
		minDistance: context.getNodeParameter('minDistance', itemIndex, 0),
		// Maximum distance (maxDistance)
		maxDistance: context.getNodeParameter('maxDistance', itemIndex, 0),
		// Distance units (distanceUnits)
		...getOptionalParam(context, 'distanceUnits', itemIndex),
		// ZIP code (zipcode)
		...getOptionalParam(context, 'zipcode', itemIndex),
		// Search radius (radius)
		radius: context.getNodeParameter('radius', itemIndex, 25),
		// Modified since (modifiedSince)
		...getDateParam(context, 'modifiedSince', itemIndex),
		// Only races with published results (onlyRacesWithResults)
		onlyRacesWithResults: context.getNodeParameter('onlyRacesWithResults', itemIndex, false),
		// Include information sections (includeInfoSections)
		includeInfoSections: context.getNodeParameter('includeInfoSections', itemIndex, true),
		// Maximum sponsor lookups (maxSponsorLookups)
		maxSponsorLookups: context.getNodeParameter('maxSponsorLookups', itemIndex, 200),
		// RunSignup API key (apiKey)
		...getOptionalParam(context, 'apiKey', itemIndex),
		// RunSignup API secret (apiSecret)
		...getOptionalParam(context, 'apiSecret', itemIndex),
		// Maximum API concurrency (maxConcurrency)
		maxConcurrency: context.getNodeParameter('maxConcurrency', itemIndex, 2),
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
    "description": "RunSignup search URLs or race URLs, including /Race/Info/, /Race/Events/, /Race/Sponsors/, and /Race/Register/. TriSignup, BikeSignup, and GiveSignup URLs are accepted.",
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
    "displayName": "Maximum races",
    "name": "maxRaces",
    "description": "Global maximum number of unique races returned across all start URLs and query partitions.",
    "required": true,
    "default": 100,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 50000
    }
  },
  {
    "displayName": "Get sponsor rosters",
    "name": "getSponsors",
    "description": "Fetch each race's sponsor list. This uses sequential race-page checks and is billed at the detailed rate. Direct race URLs always include sponsors.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Race name contains",
    "name": "nameQuery",
    "description": "Filter search inputs by race name.",
    "required": false,
    "default": "",
    "type": "string"
  },
  {
    "displayName": "States / provinces",
    "name": "states",
    "description": "Two-letter state or province codes. Leave empty to cover every region in the selected country.",
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
    "displayName": "Country",
    "name": "country",
    "description": "Selects the region list and post-filters records by country.",
    "required": false,
    "default": "US",
    "type": "options",
    "options": [
      {
        "name": "United States",
        "value": "US"
      },
      {
        "name": "Canada",
        "value": "CA"
      },
      {
        "name": "United States and Canada",
        "value": "any"
      }
    ]
  },
  {
    "displayName": "Races on or after",
    "name": "startDate",
    "description": "Earliest race date as YYYY-MM-DD or a relative period such as 1 month.",
    "required": false,
    "default": "2026-09-03",
    "type": "dateTime"
  },
  {
    "displayName": "Races on or before",
    "name": "endDate",
    "description": "Latest race date as YYYY-MM-DD or a relative period. Defaults to one year after the start date.",
    "required": false,
    "default": "1 year",
    "type": "dateTime"
  },
  {
    "displayName": "Event types",
    "name": "eventTypes",
    "description": "Discipline filters. Leave empty for every type.",
    "required": false,
    "default": [],
    "type": "multiOptions",
    "options": [
      {
        "name": "running_race",
        "value": "running_race"
      },
      {
        "name": "virtual_race",
        "value": "virtual_race"
      },
      {
        "name": "nonprofit_event",
        "value": "nonprofit_event"
      },
      {
        "name": "running_only",
        "value": "running_only"
      },
      {
        "name": "walking_only",
        "value": "walking_only"
      },
      {
        "name": "race_walk",
        "value": "race_walk"
      },
      {
        "name": "wheelchair",
        "value": "wheelchair"
      },
      {
        "name": "triathlon",
        "value": "triathlon"
      },
      {
        "name": "duathlon",
        "value": "duathlon"
      },
      {
        "name": "bike_race",
        "value": "bike_race"
      },
      {
        "name": "bike_ride",
        "value": "bike_ride"
      },
      {
        "name": "mountain_bike_race",
        "value": "mountain_bike_race"
      },
      {
        "name": "gravel_grinder",
        "value": "gravel_grinder"
      },
      {
        "name": "fundraising_ride",
        "value": "fundraising_ride"
      },
      {
        "name": "trail_race",
        "value": "trail_race"
      },
      {
        "name": "open_course_trail",
        "value": "open_course_trail"
      },
      {
        "name": "ultra",
        "value": "ultra"
      },
      {
        "name": "hike",
        "value": "hike"
      },
      {
        "name": "obstacle_course",
        "value": "obstacle_course"
      },
      {
        "name": "adventure_race",
        "value": "adventure_race"
      },
      {
        "name": "swim",
        "value": "swim"
      },
      {
        "name": "swim_run",
        "value": "swim_run"
      },
      {
        "name": "aqua_bike",
        "value": "aqua_bike"
      },
      {
        "name": "ski",
        "value": "ski"
      },
      {
        "name": "paddle_sports",
        "value": "paddle_sports"
      },
      {
        "name": "disc_golf",
        "value": "disc_golf"
      },
      {
        "name": "clinic",
        "value": "clinic"
      },
      {
        "name": "expo",
        "value": "expo"
      },
      {
        "name": "skate",
        "value": "skate"
      },
      {
        "name": "ruck",
        "value": "ruck"
      },
      {
        "name": "other",
        "value": "other"
      }
    ]
  },
  {
    "displayName": "Minimum distance",
    "name": "minDistance",
    "description": "Numeric minimum event distance in the selected units.",
    "required": false,
    "default": 0,
    "type": "number",
    "typeOptions": {
      "minValue": 0,
      "maxValue": 10000
    }
  },
  {
    "displayName": "Maximum distance",
    "name": "maxDistance",
    "description": "Numeric maximum event distance in the selected units.",
    "required": false,
    "default": 0,
    "type": "number",
    "typeOptions": {
      "minValue": 0,
      "maxValue": 10000
    }
  },
  {
    "displayName": "Distance units",
    "name": "distanceUnits",
    "description": "Units used by the minimum and maximum distance filters.",
    "required": false,
    "default": "K",
    "type": "options",
    "options": [
      {
        "name": "Kilometres",
        "value": "K"
      },
      {
        "name": "Miles",
        "value": "M"
      }
    ]
  },
  {
    "displayName": "ZIP code",
    "name": "zipcode",
    "description": "US ZIP code at the centre of a radius search.",
    "required": false,
    "default": "",
    "type": "string"
  },
  {
    "displayName": "Search radius",
    "name": "radius",
    "description": "Miles around the ZIP code. Ignored when no ZIP code is set.",
    "required": false,
    "default": 25,
    "type": "number",
    "typeOptions": {
      "minValue": 5,
      "maxValue": 100
    }
  },
  {
    "displayName": "Modified since",
    "name": "modifiedSince",
    "description": "Return only races changed since this date, as YYYY-MM-DD or a relative period.",
    "required": false,
    "default": "",
    "type": "dateTime"
  },
  {
    "displayName": "Only races with published results",
    "name": "onlyRacesWithResults",
    "description": "Limit search inputs to races that report published results.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Include information sections",
    "name": "includeInfoSections",
    "description": "Include free-text race sections such as packet pickup, course maps, and results. This costs no extra requests.",
    "required": false,
    "default": true,
    "type": "boolean"
  },
  {
    "displayName": "Maximum sponsor lookups",
    "name": "maxSponsorLookups",
    "description": "Hard cap on sequential sponsor checks per run. Direct race URLs are always checked and raise this cap when needed.",
    "required": false,
    "default": 200,
    "type": "number",
    "typeOptions": {
      "minValue": 0,
      "maxValue": 10000
    }
  },
  {
    "displayName": "RunSignup API key",
    "name": "apiKey",
    "description": "Optional RunSignup API key. Supply it together with the API secret.",
    "required": false,
    "default": "",
    "type": "string"
  },
  {
    "displayName": "RunSignup API secret",
    "name": "apiSecret",
    "description": "Optional RunSignup API secret. Supply it together with the API key.",
    "required": false,
    "default": "",
    "type": "string"
  },
  {
    "displayName": "Maximum API concurrency",
    "name": "maxConcurrency",
    "description": "Simultaneous RunSignup data requests. The maximum of two follows RunSignup's published policy.",
    "required": false,
    "default": 2,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 2
    }
  },
  {
    "displayName": "Debug mode",
    "name": "debugMode",
    "description": "Log partition filters and store a bounded set of sanitized failed-response artifacts.",
    "required": false,
    "default": false,
    "type": "boolean"
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
