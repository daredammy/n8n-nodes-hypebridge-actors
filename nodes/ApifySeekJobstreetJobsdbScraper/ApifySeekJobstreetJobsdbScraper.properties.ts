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
		// Maximum jobs (maxItems)
		maxItems: context.getNodeParameter('maxItems', itemIndex, 100),
		// Get full job details (getJobDetails)
		getJobDetails: context.getNodeParameter('getJobDetails', itemIndex, false),
		// Search keywords (searchKeywords)
		...getOptionalParam(context, 'searchKeywords', itemIndex),
		// Location (location)
		...getOptionalParam(context, 'location', itemIndex),
		// Market (market)
		...getOptionalParam(context, 'market', itemIndex),
		// Posted within (postedWithinDays)
		...getOptionalParam(context, 'postedWithinDays', itemIndex),
		// Max concurrency (maxConcurrency)
		maxConcurrency: context.getNodeParameter('maxConcurrency', itemIndex, 10),
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
    "description": "Search result URLs (e.g. https://www.seek.com.au/software-engineer-jobs/in-All-Sydney-NSW), company URLs (…/companies/granite-group-868093) or job URLs (…/job/95547646). Job URLs always return full details.",
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
    "displayName": "Maximum jobs",
    "name": "maxItems",
    "description": "Total jobs to return across all inputs, after removing duplicates. Above 500 per search, the scraper splits the search by category, job type and (Australia) city and salary to get past SEEK's 500-result limit.",
    "required": false,
    "default": 100,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 20000
    }
  },
  {
    "displayName": "Get full job details",
    "name": "getJobDetails",
    "description": "Fetch each job's full description and applicant insights (applicant count, % with resume and cover letter). One extra request per job and a higher per-job price. Job URLs always include details.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Search keywords",
    "name": "searchKeywords",
    "description": "Job title, skill or company, e.g. \"software engineer\".",
    "required": false,
    "default": "",
    "type": "string"
  },
  {
    "displayName": "Location",
    "name": "location",
    "description": "City, region or suburb as you would type it on the site, e.g. \"All Sydney NSW\", \"Auckland\", \"Kuala Lumpur\". Leave empty for the whole market.",
    "required": false,
    "default": "",
    "type": "string"
  },
  {
    "displayName": "Market",
    "name": "market",
    "description": "Which site the keyword search runs on.",
    "required": false,
    "default": "AU",
    "type": "options",
    "options": [
      {
        "name": "Australia (SEEK)",
        "value": "AU"
      },
      {
        "name": "New Zealand (SEEK)",
        "value": "NZ"
      },
      {
        "name": "Singapore (JobStreet)",
        "value": "SG"
      },
      {
        "name": "Malaysia (JobStreet)",
        "value": "MY"
      },
      {
        "name": "Philippines (JobStreet)",
        "value": "PH"
      },
      {
        "name": "Indonesia (JobStreet)",
        "value": "ID"
      },
      {
        "name": "Hong Kong (JobsDB)",
        "value": "HK"
      },
      {
        "name": "Thailand (JobsDB)",
        "value": "TH"
      }
    ]
  },
  {
    "displayName": "Posted within",
    "name": "postedWithinDays",
    "description": "Only jobs listed in this many days. Applies to the keyword search.",
    "required": false,
    "default": "any",
    "type": "options",
    "options": [
      {
        "name": "Any time",
        "value": "any"
      },
      {
        "name": "Last 24 hours",
        "value": "1"
      },
      {
        "name": "Last 3 days",
        "value": "3"
      },
      {
        "name": "Last 7 days",
        "value": "7"
      },
      {
        "name": "Last 14 days",
        "value": "14"
      },
      {
        "name": "Last 31 days",
        "value": "31"
      }
    ]
  },
  {
    "displayName": "Max concurrency",
    "name": "maxConcurrency",
    "description": "Parallel API requests.",
    "required": false,
    "default": 10,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 20
    }
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
