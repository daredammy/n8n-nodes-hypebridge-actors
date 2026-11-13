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
		// Max races (maxRaces)
		maxRaces: context.getNodeParameter('maxRaces', itemIndex, 100),
		// Get registration details (getRaceDetails)
		getRaceDetails: context.getNodeParameter('getRaceDetails', itemIndex, false),
		// Registration filter (registrationStatus)
		...getOptionalParam(context, 'registrationStatus', itemIndex),
		// State / province codes (stateCodes)
		...getFixedCollectionParam(context, 'stateCodes', itemIndex, 'values', 'mapValues'),
		// Races from (dateFrom)
		...getDateParam(context, 'dateFrom', itemIndex),
		// Races until (dateTo)
		...getDateParam(context, 'dateTo', itemIndex),
		// Include registered-entrant counts (entrantCounts)
		entrantCounts: context.getNodeParameter('entrantCounts', itemIndex, false),
		// Change tracking (changeTracking)
		...getOptionalParam(context, 'changeTracking', itemIndex),
		// Snapshot name (snapshotName)
		...getOptionalParam(context, 'snapshotName', itemIndex),
		// Max concurrency (maxConcurrency)
		maxConcurrency: context.getNodeParameter('maxConcurrency', itemIndex, 5),
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
    "description": "Paste UltraSignup URLs: the event search page (all upcoming races), an organizer page (groups.aspx?gid=…), or specific race pages (register, waitlist, entrants or results URLs). Leave empty to scrape the whole open-registration catalog. Direct race URLs always return full registration, waitlist and price detail.",
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
    "displayName": "Max races",
    "name": "maxRaces",
    "description": "Maximum number of races to process across all start URLs, soonest first. In change-tracking mode this counts races checked, not races returned.",
    "required": false,
    "default": 100,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 2000
    }
  },
  {
    "displayName": "Get registration details",
    "name": "getRaceDetails",
    "description": "Visit each race's registration page to add per-distance spots remaining, fill percentage, sold-out and waitlist size, current and next price, organizer, website and social links. Off: basic catalog fields only (cheaper, faster).",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Registration filter",
    "name": "registrationStatus",
    "description": "Applies to the search-page catalog. 'Open' returns races you can register for or join a waitlist for (including sold-out races with a waitlist); 'All upcoming' also returns closed and not-yet-open races dated up to 2030.",
    "required": false,
    "default": "open",
    "type": "options",
    "options": [
      {
        "name": "Open registration",
        "value": "open"
      },
      {
        "name": "All upcoming races",
        "value": "all-upcoming"
      }
    ]
  },
  {
    "displayName": "State / province codes",
    "name": "stateCodes",
    "description": "Only keep races whose region code (as UltraSignup lists it) is in this list, e.g. CA, TX, BC. Races outside the US and Canada usually have no code; they are only returned when this list is empty. Use 2 or 3 letters, e.g. TX or BC.",
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
    "displayName": "Races from",
    "name": "dateFrom",
    "description": "Earliest race date (YYYY-MM-DD). Defaults to today.",
    "required": false,
    "default": "",
    "type": "dateTime"
  },
  {
    "displayName": "Races until",
    "name": "dateTo",
    "description": "Latest race date (YYYY-MM-DD).",
    "required": false,
    "default": "",
    "type": "dateTime"
  },
  {
    "displayName": "Include registered-entrant counts",
    "name": "entrantCounts",
    "description": "Adds 'entrantCount' per distance. Requires registration details. Each distance costs an extra page request (up to about 0.6 MB for large races), so leave off unless you need it. Runner names are never collected.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Change tracking",
    "name": "changeTracking",
    "description": "Compare each race with its snapshot from your previous run and add 'changeStatus' and 'changes'. 'Annotate' returns every race; 'Only changes' returns just races whose spots, sold-out state, waitlist size, price or registration status changed. The first run has no baseline and returns everything marked 'baseline'. Turns on registration details automatically.",
    "required": false,
    "default": "off",
    "type": "options",
    "options": [
      {
        "name": "Off",
        "value": "off"
      },
      {
        "name": "Annotate every race",
        "value": "annotate"
      },
      {
        "name": "Only races that changed",
        "value": "only-changes"
      }
    ]
  },
  {
    "displayName": "Snapshot name",
    "name": "snapshotName",
    "description": "Label for the stored snapshot used by change tracking. Use different names to keep independent monitors (for example one per region). Lowercase letters, digits and hyphens.",
    "required": false,
    "default": "default",
    "type": "string"
  },
  {
    "displayName": "Max concurrency",
    "name": "maxConcurrency",
    "description": "Parallel registration/waitlist page requests. UltraSignup slows down above this range; the default is the measured sweet spot.",
    "required": false,
    "default": 5,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 6
    }
  },
  {
    "displayName": "Debug mode",
    "name": "debugMode",
    "description": "Log per-request details and save the HTML of pages that fail to parse to the key-value store (capped at 10 files).",
    "required": false,
    "default": false,
    "type": "boolean"
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
