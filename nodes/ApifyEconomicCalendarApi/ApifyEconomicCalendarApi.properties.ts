import { IExecuteFunctions, INodeProperties } from 'n8n-workflow';

function getDateParam(context: IExecuteFunctions, paramName: string, itemIndex: number): Record<string, any> {
	const value = context.getNodeParameter(paramName, itemIndex, undefined);
	if (value === undefined || value === null || value === '') return {};
	const date = String(value).slice(0, 10);
	return { [paramName]: date };
}

function getJsonParam(context: IExecuteFunctions, paramName: string, itemIndex: number): Record<string, any> {
	try {
		const rawValue = context.getNodeParameter(paramName, itemIndex, undefined);
		if (rawValue === undefined || rawValue === null || rawValue === '' || (typeof rawValue === 'string' && rawValue.trim() === '')) {
			return {};
		}
		return { [paramName]: typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue };
	} catch (error) {
		throw new Error(`Invalid JSON in parameter "${paramName}": ${(error as Error).message}`);
	}
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
		// Date window (dateWindow)
		dateWindow: context.getNodeParameter('dateWindow', itemIndex, "next_30_days"),
		// Max events (maxEvents)
		maxEvents: context.getNodeParameter('maxEvents', itemIndex, 50),
		// Get release values (getReleaseValues)
		getReleaseValues: context.getNodeParameter('getReleaseValues', itemIndex, true),
		// Sources (sources)
		sources: context.getNodeParameter('sources', itemIndex, ["fred","bls","bea","census","treasury","federal_reserve","ecb","eurostat","ons","bank_of_england"]),
		// Minimum importance (minImportance)
		...getOptionalParam(context, 'minImportance', itemIndex),
		// Include observation series (includeObservationSeries)
		includeObservationSeries: context.getNodeParameter('includeObservationSeries', itemIndex, false),
		// Regions (regions)
		regions: context.getNodeParameter('regions', itemIndex, ["us","uk","euro_area","eu"]),
		// Event types (eventTypes)
		eventTypes: context.getNodeParameter('eventTypes', itemIndex, ["data_release","policy_meeting","auction","rates","central_bank_event"]),
		// Custom start date (customStartDate)
		...getDateParam(context, 'customStartDate', itemIndex),
		// Custom end date (customEndDate)
		...getDateParam(context, 'customEndDate', itemIndex),
		// Proxy configuration (proxyConfiguration)
		...getJsonParam(context, 'proxyConfiguration', itemIndex),
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
    "displayName": "Date window",
    "name": "dateWindow",
    "description": "Calendar window to collect across official macro sources.",
    "required": true,
    "default": "next_30_days",
    "type": "options",
    "options": [
      {
        "name": "Past 30 + next 90 days",
        "value": "recent_and_next_90_days"
      },
      {
        "name": "Past 30 days",
        "value": "past_30_days"
      },
      {
        "name": "Next 30 days",
        "value": "next_30_days"
      },
      {
        "name": "Next 90 days",
        "value": "next_90_days"
      },
      {
        "name": "Next 12 months",
        "value": "next_12_months"
      },
      {
        "name": "Custom",
        "value": "custom"
      }
    ]
  },
  {
    "displayName": "Max events",
    "name": "maxEvents",
    "description": "Maximum normalized events to return across all enabled sources.",
    "required": true,
    "default": 50,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 5000
    }
  },
  {
    "displayName": "Get release values",
    "name": "getReleaseValues",
    "description": "Fetch exact period-matched official metrics from the maintained mapping catalog. BLS mappings currently cover CPI, Employment Situation (payrolls and unemployment), PPI Final Demand, and JOLTS. Calendar events are enriched in place; standalone series are controlled separately.",
    "required": false,
    "default": true,
    "type": "boolean"
  },
  {
    "displayName": "Sources",
    "name": "sources",
    "description": "Official sources to include.",
    "required": false,
    "default": [
      "fred",
      "bls",
      "bea",
      "census",
      "treasury",
      "federal_reserve",
      "ecb",
      "eurostat",
      "ons",
      "bank_of_england"
    ],
    "type": "multiOptions",
    "options": [
      {
        "name": "FRED",
        "value": "fred"
      },
      {
        "name": "BLS",
        "value": "bls"
      },
      {
        "name": "BEA",
        "value": "bea"
      },
      {
        "name": "Census",
        "value": "census"
      },
      {
        "name": "Treasury",
        "value": "treasury"
      },
      {
        "name": "Federal Reserve",
        "value": "federal_reserve"
      },
      {
        "name": "ECB",
        "value": "ecb"
      },
      {
        "name": "Eurostat",
        "value": "eurostat"
      },
      {
        "name": "ONS",
        "value": "ons"
      },
      {
        "name": "Bank of England",
        "value": "bank_of_england"
      }
    ]
  },
  {
    "displayName": "Minimum importance",
    "name": "minImportance",
    "description": "Keep all events or require a curated minimum expected market impact before the result cap is applied.",
    "required": false,
    "default": "medium",
    "type": "options",
    "options": [
      {
        "name": "All events",
        "value": "all"
      },
      {
        "name": "Low and above",
        "value": "low"
      },
      {
        "name": "Medium and above",
        "value": "medium"
      },
      {
        "name": "High only",
        "value": "high"
      }
    ]
  },
  {
    "displayName": "Include observation series",
    "name": "includeObservationSeries",
    "description": "Include supported standalone official observation records, such as Treasury yield curves and Fiscal Data, when release values are enabled.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Regions",
    "name": "regions",
    "description": "Region filter used to select sources and normalized records.",
    "required": false,
    "default": [
      "us",
      "uk",
      "euro_area",
      "eu"
    ],
    "type": "multiOptions",
    "options": [
      {
        "name": "United States",
        "value": "us"
      },
      {
        "name": "United Kingdom",
        "value": "uk"
      },
      {
        "name": "Euro area",
        "value": "euro_area"
      },
      {
        "name": "European Union",
        "value": "eu"
      }
    ]
  },
  {
    "displayName": "Event types",
    "name": "eventTypes",
    "description": "Optional event-type filter applied after normalization.",
    "required": false,
    "default": [
      "data_release",
      "policy_meeting",
      "auction",
      "rates",
      "central_bank_event"
    ],
    "type": "multiOptions",
    "options": [
      {
        "name": "Data releases",
        "value": "data_release"
      },
      {
        "name": "Policy meetings",
        "value": "policy_meeting"
      },
      {
        "name": "Auctions",
        "value": "auction"
      },
      {
        "name": "Rates",
        "value": "rates"
      },
      {
        "name": "Central-bank events",
        "value": "central_bank_event"
      }
    ]
  },
  {
    "displayName": "Custom start date",
    "name": "customStartDate",
    "description": "YYYY-MM-DD start date used only when Date window is Custom.",
    "required": false,
    "default": "",
    "type": "dateTime"
  },
  {
    "displayName": "Custom end date",
    "name": "customEndDate",
    "description": "YYYY-MM-DD end date used only when Date window is Custom.",
    "required": false,
    "default": "",
    "type": "dateTime"
  },
  {
    "displayName": "Proxy configuration",
    "name": "proxyConfiguration",
    "description": "Proxy settings for supported sources. A residential Apify Proxy connection is used internally where required.",
    "required": true,
    "default": "{\"useApifyProxy\":true}",
    "type": "json"
  },
  {
    "displayName": "Debug mode",
    "name": "debugMode",
    "description": "Store bounded source plans, failed-response excerpts, raw samples, and dedupe decisions for troubleshooting.",
    "required": false,
    "default": false,
    "type": "boolean"
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
