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

export function buildActorInput(
	context: IExecuteFunctions,
	itemIndex: number,
	defaultInput: Record<string, any>,
): Record<string, any> {
	return {
		...defaultInput,
		// Start URLs (startUrls)
		...getFixedCollectionParam(context, 'startUrls', itemIndex, 'items', 'passthrough'),
		// Max agency leads (maxItems)
		maxItems: context.getNodeParameter('maxItems', itemIndex),
		// Get agency details (getAgencyDetails)
		getAgencyDetails: context.getNodeParameter('getAgencyDetails', itemIndex),
		// Include reviews (includeReviews)
		includeReviews: context.getNodeParameter('includeReviews', itemIndex),
		// Max reviews per agency (maxReviewsPerAgency)
		maxReviewsPerAgency: context.getNodeParameter('maxReviewsPerAgency', itemIndex),
		// Find emails on agency websites (enrichEmails)
		enrichEmails: context.getNodeParameter('enrichEmails', itemIndex),
		// Output format (outputFormat)
		outputFormat: context.getNodeParameter('outputFormat', itemIndex),
		// Sort by (sortBy)
		sortBy: context.getNodeParameter('sortBy', itemIndex),
		// Max listing pages (maxPages)
		maxPages: context.getNodeParameter('maxPages', itemIndex),
		// Max concurrency (maxConcurrency)
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
    "description": "Goodfirms directory, country, filtered, paginated, or company profile URLs.",
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
    "displayName": "Max agency leads",
    "name": "maxItems",
    "description": "Maximum number of agency records to return.",
    "required": true,
    "default": 100,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 5000
    }
  },
  {
    "displayName": "Get agency details",
    "name": "getAgencyDetails",
    "description": "Visit each Goodfirms profile for phone, email, address, socials, services, and richer reviews. Direct profile URLs always return detail records.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Include reviews",
    "name": "includeReviews",
    "description": "Collect recent review objects whenever agency profile pages are fetched (Get agency details or email enrichment). Has no effect on listing-only runs.",
    "required": false,
    "default": true,
    "type": "boolean"
  },
  {
    "displayName": "Max reviews per agency",
    "name": "maxReviewsPerAgency",
    "description": "Maximum reviews to collect for each agency when reviews are enabled.",
    "required": false,
    "default": 3,
    "type": "number",
    "typeOptions": {
      "minValue": 0,
      "maxValue": 25
    }
  },
  {
    "displayName": "Find emails on agency websites",
    "name": "enrichEmails",
    "description": "If Goodfirms does not expose an email, run the Contact Details Scraper on the agency website. That scraper's pay-per-event usage is billed to your account on top of this actor's per-lead price.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Output format",
    "name": "outputFormat",
    "description": "Full keeps nested JSON. Flat, HubSpot, and Salesforce produce CRM-friendly columns.",
    "required": false,
    "default": "full",
    "type": "options",
    "options": [
      {
        "name": "Full JSON",
        "value": "full"
      },
      {
        "name": "Flat CSV-friendly",
        "value": "flat"
      },
      {
        "name": "HubSpot",
        "value": "hubspot"
      },
      {
        "name": "Salesforce",
        "value": "salesforce"
      }
    ]
  },
  {
    "displayName": "Sort by",
    "name": "sortBy",
    "description": "Only applied when the actor builds the default Goodfirms category URL.",
    "required": false,
    "default": "default",
    "type": "options",
    "options": [
      {
        "name": "Default",
        "value": "default"
      },
      {
        "name": "Most reviews",
        "value": "reviews"
      },
      {
        "name": "Highly rated",
        "value": "rating"
      },
      {
        "name": "Leaders matrix",
        "value": "matrix"
      }
    ]
  },
  {
    "displayName": "Max listing pages",
    "name": "maxPages",
    "description": "Safety cap for listing pagination. The actor also stops when max agency leads is reached.",
    "required": false,
    "default": 25,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 200
    }
  },
  {
    "displayName": "Max concurrency",
    "name": "maxConcurrency",
    "description": "Maximum concurrent Goodfirms HTTP requests.",
    "required": false,
    "default": 8,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 20
    }
  },
  {
    "displayName": "Proxy configuration",
    "name": "proxyConfiguration",
    "description": "Residential proxy is enabled by default and required. Goodfirms blocks Apify datacenter IPs.",
    "required": false,
    "default": "{\"useApifyProxy\":true,\"apifyProxyGroups\":[\"RESIDENTIAL\"]}",
    "type": "json"
  },
  {
    "displayName": "Debug mode",
    "name": "debugMode",
    "description": "Save failed HTML responses and extra diagnostics to the key-value store.",
    "required": false,
    "default": false,
    "type": "boolean"
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
