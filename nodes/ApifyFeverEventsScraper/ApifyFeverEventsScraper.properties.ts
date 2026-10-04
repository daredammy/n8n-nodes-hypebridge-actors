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

export function buildActorInput(
	context: IExecuteFunctions,
	itemIndex: number,
	defaultInput: Record<string, any>,
): Record<string, any> {
	return {
		...defaultInput,
		// Start URLs (startUrls)
		...getFixedCollectionParam(context, 'startUrls', itemIndex, 'items', 'passthrough'),
		// Max events (maxEvents)
		maxEvents: context.getNodeParameter('maxEvents', itemIndex, 100),
		// Get event details (getEventDetails)
		getEventDetails: context.getNodeParameter('getEventDetails', itemIndex, false),
		// Include ticket tiers and session availability (includeTicketTiers)
		includeTicketTiers: context.getNodeParameter('includeTicketTiers', itemIndex, false),
		// Session window (days) (sessionWindowDays)
		sessionWindowDays: context.getNodeParameter('sessionWindowDays', itemIndex, 14),
		// Max dates per event (maxSessionDates)
		maxSessionDates: context.getNodeParameter('maxSessionDates', itemIndex, 3),
		// Include reviews (includeReviews)
		includeReviews: context.getNodeParameter('includeReviews', itemIndex, false),
		// Max reviews per event (maxReviewsPerEvent)
		maxReviewsPerEvent: context.getNodeParameter('maxReviewsPerEvent', itemIndex, 15),
		// Include nearby cities from search (includeNearbyCities)
		includeNearbyCities: context.getNodeParameter('includeNearbyCities', itemIndex, false),
		// Max cities (maxCities)
		maxCities: context.getNodeParameter('maxCities', itemIndex, 3),
		// Max search pages per city (maxSearchPages)
		maxSearchPages: context.getNodeParameter('maxSearchPages', itemIndex, 30),
		// Max pages per category filter (maxPagesPerFilter)
		maxPagesPerFilter: context.getNodeParameter('maxPagesPerFilter', itemIndex, 5),
		// Max requests (maxRequests)
		maxRequests: context.getNodeParameter('maxRequests', itemIndex, 3000),
		// Max concurrency (maxConcurrency)
		maxConcurrency: context.getNodeParameter('maxConcurrency', itemIndex, 3),
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
    "description": "Fever city pages (https://feverup.com/en/chicago), category pages (https://feverup.com/en/chicago/things-to-do), country pages (https://feverup.com/en/country/united-states) or single event pages (https://feverup.com/m/588851). Supported markets: US, Brazil, Spain, UK, France.",
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
    "displayName": "Max events",
    "name": "maxEvents",
    "description": "Total events returned across all start URLs. The run stops as soon as this many are produced.",
    "required": false,
    "default": 100,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 5000
    }
  },
  {
    "displayName": "Get event details",
    "name": "getEventDetails",
    "description": "Visit each event's detail API for the full description, venue address and coordinates, photos, categories and default ticket. Off returns the listing fields only (cheaper and faster).",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Include ticket tiers and session availability",
    "name": "includeTicketTiers",
    "description": "Adds per-date availability and the ticket tier tree (price, service fee, availability) for the next bookable dates. Implies detail level. Uses the event's main venue only.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Session window (days)",
    "name": "sessionWindowDays",
    "description": "How many days ahead of today to look for bookable dates when ticket tiers are on.",
    "required": false,
    "default": 14,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 31
    }
  },
  {
    "displayName": "Max dates per event",
    "name": "maxSessionDates",
    "description": "Number of bookable dates per event to expand into ticket tiers. Each date is one 150-200 KB request.",
    "required": false,
    "default": 3,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 14
    }
  },
  {
    "displayName": "Include reviews",
    "name": "includeReviews",
    "description": "Adds text reviews. Implies detail level.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Max reviews per event",
    "name": "maxReviewsPerEvent",
    "description": "Reviews are fetched 15 per page. Rating counts are larger than text review counts, so fewer may be returned.",
    "required": false,
    "default": 15,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 200
    }
  },
  {
    "displayName": "Include nearby cities from search",
    "name": "includeNearbyCities",
    "description": "Search results can include events from other cities in the same country (for example Brighton or Cambridge when scraping London). Off keeps only events in the requested city, plus anything Fever itself lists on that city's page.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Max cities",
    "name": "maxCities",
    "description": "Hard cap on distinct cities processed in one run, including cities expanded from a country page.",
    "required": false,
    "default": 3,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 25
    }
  },
  {
    "displayName": "Max search pages per city",
    "name": "maxSearchPages",
    "description": "Search returns 100 rows per page. A large city such as London needs about 28 pages to exhaust. If this cap cuts the walk, the run summary reports truncation.",
    "required": false,
    "default": 30,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 60
    }
  },
  {
    "displayName": "Max pages per category filter",
    "name": "maxPagesPerFilter",
    "description": "Category grids appear to stop at about 250 results. A cap or early end is reported as a coverage warning.",
    "required": false,
    "default": 5,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 10
    }
  },
  {
    "displayName": "Max requests",
    "name": "maxRequests",
    "description": "Hard cap on HTTP requests for the whole run. Reaching it stops the run and reports truncation.",
    "required": false,
    "default": 3000,
    "type": "number",
    "typeOptions": {
      "minValue": 10,
      "maxValue": 50000
    }
  },
  {
    "displayName": "Max concurrency",
    "name": "maxConcurrency",
    "description": "Parallel requests. Fever's tolerance at volume is unmeasured; keep this low.",
    "required": false,
    "default": 3,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 8
    }
  },
  {
    "displayName": "Debug mode",
    "name": "debugMode",
    "description": "Saves up to 5 failing responses (status, headers, first 20 KB) to the key-value store.",
    "required": false,
    "default": false,
    "type": "boolean"
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
