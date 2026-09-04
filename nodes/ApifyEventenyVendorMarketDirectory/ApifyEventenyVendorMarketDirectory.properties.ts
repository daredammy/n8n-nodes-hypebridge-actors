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
		// Start URLs (startUrls)
		...getFixedCollectionParam(context, 'startUrls', itemIndex, 'items', 'passthrough'),
		// Maximum items (maxItems)
		maxItems: context.getNodeParameter('maxItems', itemIndex),
		// Scrape detail pages (getDetails)
		getDetails: context.getNodeParameter('getDetails', itemIndex),
		// Search keywords (searchQuery)
		...getOptionalParam(context, 'searchQuery', itemIndex),
		// Application type (applicationType)
		applicationType: context.getNodeParameter('applicationType', itemIndex),
		// Event category (category)
		category: context.getNodeParameter('category', itemIndex),
		// Month (month)
		...getOptionalParam(context, 'month', itemIndex),
		// Location filter (locationFilter)
		...getOptionalParam(context, 'locationFilter', itemIndex),
		// Include ticket tiers (includeTicketTiers)
		includeTicketTiers: context.getNodeParameter('includeTicketTiers', itemIndex),
		// Include organizer profiles (scrapeOrganizers)
		scrapeOrganizers: context.getNodeParameter('scrapeOrganizers', itemIndex),
		// Maximum concurrency (maxConcurrency)
		maxConcurrency: context.getNodeParameter('maxConcurrency', itemIndex),
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
    "description": "Eventeny URLs to scrape. Supported: the events directory, a state or city directory, the application hub, an event, a vendor or volunteer application, a ticket page, or an organizer profile. Add ?search=your+keywords to a directory URL to filter by keyword.",
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
    "displayName": "Maximum items",
    "name": "maxItems",
    "description": "Stop after this many event, application, and organizer records. Keep a cap in place unless you intend a full crawl.",
    "required": false,
    "default": 200,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 100000
    }
  },
  {
    "displayName": "Scrape detail pages",
    "name": "getDetails",
    "description": "Open discovered events and applications for booth fee tables, deadlines, terms, files, questions, venue details, and organizer data. Direct detail URLs are always fully scraped.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Search keywords",
    "name": "searchQuery",
    "description": "Keyword filter for directory start URLs without their own ?search= or ?q= value.",
    "required": false,
    "default": "craft fair",
    "type": "string"
  },
  {
    "displayName": "Application type",
    "name": "applicationType",
    "description": "Application feed to read from the Eventeny application hub.",
    "required": false,
    "default": "vendor",
    "type": "options",
    "options": [
      {
        "name": "Artists, exhibitors & vendors",
        "value": "vendor"
      },
      {
        "name": "Volunteers",
        "value": "volunteer"
      },
      {
        "name": "Ticketed events",
        "value": "ticket"
      }
    ]
  },
  {
    "displayName": "Event category",
    "name": "category",
    "description": "Category filter for event directory URLs. Leave empty for every category.",
    "required": false,
    "default": "",
    "type": "options",
    "options": [
      {
        "name": "All categories",
        "value": ""
      },
      {
        "name": "Top",
        "value": "top"
      },
      {
        "name": "Happening now",
        "value": "now"
      },
      {
        "name": "Trending",
        "value": "trending"
      },
      {
        "name": "New",
        "value": "new"
      },
      {
        "name": "Festivals",
        "value": "festival"
      },
      {
        "name": "Art",
        "value": "art"
      },
      {
        "name": "Education",
        "value": "education"
      },
      {
        "name": "Pop culture",
        "value": "pop"
      },
      {
        "name": "Food",
        "value": "food"
      },
      {
        "name": "Conventions",
        "value": "convention"
      },
      {
        "name": "Community",
        "value": "community"
      },
      {
        "name": "Holiday",
        "value": "holiday"
      },
      {
        "name": "Markets",
        "value": "markets"
      },
      {
        "name": "Fairs",
        "value": "fair"
      }
    ]
  },
  {
    "displayName": "Month",
    "name": "month",
    "description": "Restrict directory results to one month in YYYY-MM format, for example 2026-10.",
    "required": false,
    "default": "2026-10",
    "type": "string"
  },
  {
    "displayName": "Location filter",
    "name": "locationFilter",
    "description": "Application-hub location using Eventeny's keys, such as United States-Georgia, United States-California, or Canada.",
    "required": false,
    "default": "United States-Georgia",
    "type": "string"
  },
  {
    "displayName": "Include ticket tiers",
    "name": "includeTicketTiers",
    "description": "For detailed events that sell tickets, attach every published tier with base price, tax, processing fee, refund policy, and sale status.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Include organizer profiles",
    "name": "scrapeOrganizers",
    "description": "Push a separate organizer record for each distinct event host, with public profile details and hosted events.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Maximum concurrency",
    "name": "maxConcurrency",
    "description": "Parallel requests. Detail pages can be large, so the default 10 is recommended on a 2 GB run.",
    "required": false,
    "default": 10,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 30
    }
  },
  {
    "displayName": "Debug mode",
    "name": "debugMode",
    "description": "Save bounded HTML and JSON diagnostics for failed requests in the default key-value store.",
    "required": false,
    "default": false,
    "type": "boolean"
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
