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

function getDateParam(context: IExecuteFunctions, paramName: string, itemIndex: number): Record<string, any> {
	const value = context.getNodeParameter(paramName, itemIndex);
	if (value === undefined || value === null || value === '') return {};
	const date = String(value).slice(0, 10);
	return { [paramName]: date };
}

function getJsonParam(context: IExecuteFunctions, paramName: string, itemIndex: number): Record<string, any> {
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
		// Start URLs (startUrls)
		...getFixedCollectionParam(context, 'startUrls', itemIndex, 'items', 'passthrough'),
		// Maximum festivals (maxFestivals)
		maxFestivals: context.getNodeParameter('maxFestivals', itemIndex),
		// Get deadlines and entry fees (getFestivalDetails)
		getFestivalDetails: context.getNodeParameter('getFestivalDetails', itemIndex),
		// Open submissions only (openSubmissionsOnly)
		openSubmissionsOnly: context.getNodeParameter('openSubmissionsOnly', itemIndex),
		// Search keyword (searchQuery)
		...getOptionalParam(context, 'searchQuery', itemIndex),
		// Entry deadline before (deadlineBefore)
		...getDateParam(context, 'deadlineBefore', itemIndex),
		// Entry deadline after (deadlineAfter)
		...getDateParam(context, 'deadlineAfter', itemIndex),
		// Event date before (eventDateBefore)
		...getDateParam(context, 'eventDateBefore', itemIndex),
		// Event date after (eventDateAfter)
		...getDateParam(context, 'eventDateAfter', itemIndex),
		// Project categories (projectCategories)
		projectCategories: context.getNodeParameter('projectCategories', itemIndex),
		// Genres and niches (niches)
		niches: context.getNodeParameter('niches', itemIndex),
		// Maximum entry fee (maxEntryFee)
		maxEntryFee: context.getNodeParameter('maxEntryFee', itemIndex),
		// Academy Award qualifying only (academyAwardQualifyingOnly)
		academyAwardQualifyingOnly: context.getNodeParameter('academyAwardQualifyingOnly', itemIndex),
		// FilmFreeway Gold discount only (goldDiscountOnly)
		goldDiscountOnly: context.getNodeParameter('goldDiscountOnly', itemIndex),
		// Countries (countries)
		...getFixedCollectionParam(context, 'countries', itemIndex, 'values', 'mapValues'),
		// Sort by (sortBy)
		sortBy: context.getNodeParameter('sortBy', itemIndex),
		// Curated collection (curatedCollection)
		curatedCollection: context.getNodeParameter('curatedCollection', itemIndex),
		// Enumerate from sitemap (enumerateFromSitemap)
		enumerateFromSitemap: context.getNodeParameter('enumerateFromSitemap', itemIndex),
		// Maximum sticky sessions (maxConcurrency)
		maxConcurrency: context.getNodeParameter('maxConcurrency', itemIndex),
		// Proxy configuration (proxyConfiguration)
		...getJsonParam(context, 'proxyConfiguration', itemIndex),
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
    "displayName": "Start URLs",
    "name": "startUrls",
    "description": "FilmFreeway directory, curated collection, or festival profile URLs. Direct profile URLs always receive full detail extraction.",
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
    "displayName": "Maximum festivals",
    "name": "maxFestivals",
    "description": "Hard cap on returned festivals.",
    "required": false,
    "default": 100,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 15000
    }
  },
  {
    "displayName": "Get deadlines and entry fees",
    "name": "getFestivalDetails",
    "description": "Visit each profile for full dates, categories, and fee tiers. Direct profile URLs ignore this toggle.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Open submissions only",
    "name": "openSubmissionsOnly",
    "description": "Restrict generated searches to festivals currently accepting entries.",
    "required": false,
    "default": true,
    "type": "boolean"
  },
  {
    "displayName": "Search keyword",
    "name": "searchQuery",
    "description": "Free-text festival search.",
    "required": false,
    "default": "",
    "type": "string"
  },
  {
    "displayName": "Entry deadline before",
    "name": "deadlineBefore",
    "description": "Return festivals with an entry deadline before this date.",
    "required": false,
    "default": "",
    "type": "dateTime"
  },
  {
    "displayName": "Entry deadline after",
    "name": "deadlineAfter",
    "description": "Return festivals with an entry deadline after this date.",
    "required": false,
    "default": "",
    "type": "dateTime"
  },
  {
    "displayName": "Event date before",
    "name": "eventDateBefore",
    "description": "Return festivals taking place before this date.",
    "required": false,
    "default": "",
    "type": "dateTime"
  },
  {
    "displayName": "Event date after",
    "name": "eventDateAfter",
    "description": "Return festivals taking place after this date.",
    "required": false,
    "default": "",
    "type": "dateTime"
  },
  {
    "displayName": "Project categories",
    "name": "projectCategories",
    "description": "Project types accepted by the festival.",
    "required": false,
    "default": [],
    "type": "multiOptions",
    "options": [
      {
        "name": "Animation",
        "value": "1"
      },
      {
        "name": "Documentary",
        "value": "3"
      },
      {
        "name": "Experimental",
        "value": "30"
      },
      {
        "name": "Feature",
        "value": "5"
      },
      {
        "name": "Music Video",
        "value": "7"
      },
      {
        "name": "Short",
        "value": "9"
      },
      {
        "name": "Student",
        "value": "26"
      },
      {
        "name": "Television",
        "value": "11"
      },
      {
        "name": "Virtual Reality",
        "value": "31"
      },
      {
        "name": "Web / New Media",
        "value": "25"
      },
      {
        "name": "Screenplay",
        "value": "13"
      },
      {
        "name": "Short Script",
        "value": "15"
      },
      {
        "name": "Stage Play",
        "value": "17"
      },
      {
        "name": "Television Script",
        "value": "19"
      }
    ]
  },
  {
    "displayName": "Genres and niches",
    "name": "niches",
    "description": "Festival genre filters.",
    "required": false,
    "default": [],
    "type": "multiOptions",
    "options": [
      {
        "name": "Action / Adventure",
        "value": "1"
      },
      {
        "name": "Asian",
        "value": "2"
      },
      {
        "name": "Black / African",
        "value": "3"
      },
      {
        "name": "Children",
        "value": "4"
      },
      {
        "name": "Comedy",
        "value": "5"
      },
      {
        "name": "Dance",
        "value": "6"
      },
      {
        "name": "Environmental / Outdoor",
        "value": "7"
      },
      {
        "name": "Horror",
        "value": "8"
      },
      {
        "name": "Human Rights",
        "value": "9"
      },
      {
        "name": "Indigenous / Native Peoples",
        "value": "10"
      },
      {
        "name": "Latino / Hispanic",
        "value": "11"
      },
      {
        "name": "LGBTQ",
        "value": "12"
      },
      {
        "name": "Religious",
        "value": "13"
      },
      {
        "name": "Sci-fi / Fantasy / Thriller",
        "value": "14"
      },
      {
        "name": "Sports",
        "value": "15"
      },
      {
        "name": "Women",
        "value": "16"
      }
    ]
  },
  {
    "displayName": "Maximum entry fee",
    "name": "maxEntryFee",
    "description": "Approximate FilmFreeway server-side fee filter.",
    "required": false,
    "default": 0,
    "type": "number",
    "typeOptions": {
      "minValue": 0,
      "maxValue": 100
    }
  },
  {
    "displayName": "Academy Award qualifying only",
    "name": "academyAwardQualifyingOnly",
    "description": "Only Academy Award qualifying festivals.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "FilmFreeway Gold discount only",
    "name": "goldDiscountOnly",
    "description": "Only festivals with Gold discounts.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Countries",
    "name": "countries",
    "description": "Country names matched against listing locations.",
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
    "displayName": "Sort by",
    "name": "sortBy",
    "description": "FilmFreeway directory sort order.",
    "required": false,
    "default": "all_deadlines",
    "type": "options",
    "options": [
      {
        "name": "Next Deadlines",
        "value": "all_deadlines"
      },
      {
        "name": "Final Deadlines",
        "value": "final_deadline"
      },
      {
        "name": "Early Deadlines",
        "value": "first_deadline"
      },
      {
        "name": "Most Popular",
        "value": "popular"
      },
      {
        "name": "Best Reviewed",
        "value": "rating"
      },
      {
        "name": "Recently Added",
        "value": "recent"
      },
      {
        "name": "Entry Fees: Lowest First",
        "value": "price_low"
      },
      {
        "name": "Entry Fees: Highest First",
        "value": "price_high"
      },
      {
        "name": "Years Running",
        "value": "years"
      },
      {
        "name": "Event Date",
        "value": "event_date"
      },
      {
        "name": "Tickets Available",
        "value": "tickets_available"
      }
    ]
  },
  {
    "displayName": "Curated collection",
    "name": "curatedCollection",
    "description": "Use one verified FilmFreeway curated collection when Start URLs is empty.",
    "required": false,
    "default": "",
    "type": "options",
    "options": [
      {
        "name": "Academy Award Qualifying",
        "value": "academy-award-qualifying-festivals"
      },
      {
        "name": "Top 100 Best Reviewed",
        "value": "top-100-best-reviewed-festivals"
      },
      {
        "name": "Most Popular",
        "value": "most-popular"
      },
      {
        "name": "Trending Now",
        "value": "trending-now"
      },
      {
        "name": "Gold",
        "value": "gold"
      },
      {
        "name": "Film Festival Alliance",
        "value": "filmfestivalalliance"
      },
      {
        "name": "Short Film",
        "value": "short-film"
      },
      {
        "name": "Documentary",
        "value": "documentary"
      },
      {
        "name": "Horror",
        "value": "horror"
      },
      {
        "name": "Sci-Fi",
        "value": "sci-fi"
      },
      {
        "name": "Screenwriting",
        "value": "screenwriting"
      },
      {
        "name": "Visionaries",
        "value": "visionaries"
      },
      {
        "name": "Luminaries",
        "value": "luminaries"
      },
      {
        "name": "In the Spotlight",
        "value": "in-the-spotlight"
      },
      {
        "name": "Tickets Available",
        "value": "tickets-available"
      }
    ]
  },
  {
    "displayName": "Enumerate from sitemap",
    "name": "enumerateFromSitemap",
    "description": "Enumerate the corpus directly, still capped by Maximum festivals.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Maximum sticky sessions",
    "name": "maxConcurrency",
    "description": "One worker is bound to each validated residential identity. Capped at three to bound memory, proxy churn, and request rate.",
    "required": false,
    "default": 3,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 3
    }
  },
  {
    "displayName": "Proxy configuration",
    "name": "proxyConfiguration",
    "description": "Untargeted Apify Residential proxy is the tested default. Each validated session retains one IP, cookie jar, and Chrome wire fingerprint.",
    "required": false,
    "default": "{\"useApifyProxy\":true,\"apifyProxyGroups\":[\"RESIDENTIAL\"]}",
    "type": "json"
  },
  {
    "displayName": "Debug mode",
    "name": "debugMode",
    "description": "Save at most 20 failing HTML and metadata artifacts.",
    "required": false,
    "default": false,
    "type": "boolean"
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
