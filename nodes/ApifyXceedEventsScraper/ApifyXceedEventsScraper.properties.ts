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
		// Max events (maxEvents)
		maxEvents: context.getNodeParameter('maxEvents', itemIndex, 100),
		// Get event details and ticket offers (getEventDetails)
		getEventDetails: context.getNodeParameter('getEventDetails', itemIndex, false),
		// Country (homepage URL only) (country)
		...getOptionalParam(context, 'country', itemIndex),
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
    "description": "Xceed city events page (xceed.me/en/barcelona/events), event, venue or artist URL, or the xceed.me homepage to list events across Spain, Italy, France, Portugal and Germany.",
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
    "description": "Maximum number of events returned across all start URLs. Venue and artist URLs are not counted.",
    "required": false,
    "default": 100,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 5000
    }
  },
  {
    "displayName": "Get event details and ticket offers",
    "name": "getEventDetails",
    "description": "Visit each event page for the full description, line-up, ticket tiers, prices, fees and availability. Off returns basic listing fields only. Event URLs you paste directly always return full details.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Country (homepage URL only)",
    "name": "country",
    "description": "Which country to list when a start URL is the xceed.me homepage. Ignored for city, event, venue and artist URLs.",
    "required": false,
    "default": "any",
    "type": "options",
    "options": [
      {
        "name": "All five supported countries",
        "value": "any"
      },
      {
        "name": "Spain",
        "value": "spain"
      },
      {
        "name": "Italy",
        "value": "italy"
      },
      {
        "name": "France",
        "value": "france"
      },
      {
        "name": "Portugal",
        "value": "portugal"
      },
      {
        "name": "Germany",
        "value": "germany"
      }
    ]
  },
  {
    "displayName": "Max concurrency",
    "name": "maxConcurrency",
    "description": "Number of requests to run in parallel. Keep this low to stay polite to Xceed.",
    "required": false,
    "default": 5,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 10
    }
  },
  {
    "displayName": "Debug mode",
    "name": "debugMode",
    "description": "Verbose logging, and save the HTML of up to 5 pages that could not be read completely to the key-value store.",
    "required": false,
    "default": false,
    "type": "boolean"
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
