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
		// Max Items (maxItems)
		maxItems: context.getNodeParameter('maxItems', itemIndex),
		// Scrape Full Post Details (scrapePostsFromLists)
		scrapePostsFromLists: context.getNodeParameter('scrapePostsFromLists', itemIndex),
		// Scrape Comments (scrapeComments)
		scrapeComments: context.getNodeParameter('scrapeComments', itemIndex),
		// Max Comments per Post (maxComments)
		maxComments: context.getNodeParameter('maxComments', itemIndex),
		// Debug Mode (debugMode)
		debugMode: context.getNodeParameter('debugMode', itemIndex),
		// Proxy Configuration (proxyConfiguration)
		...getJsonParam(context, 'proxyConfiguration', itemIndex),
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
    "description": "URLs to scrape from TeamBlind. Supports post lists (/?sort=pop, /?sort=id, /channels/*, /company/*) and individual post pages (/post/*).",
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
    "displayName": "Max Items",
    "name": "maxItems",
    "description": "Maximum number of posts to scrape. Set to 0 for unlimited.",
    "required": false,
    "default": 100,
    "type": "number",
    "typeOptions": {
      "minValue": 0,
      "maxValue": 10000
    }
  },
  {
    "displayName": "Scrape Full Post Details",
    "name": "scrapePostsFromLists",
    "description": "When enabled, follows each post link from list pages to scrape full content and poll data. Additional pay-per-event charges apply.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Scrape Comments",
    "name": "scrapeComments",
    "description": "When enabled, extracts comments from post detail pages. Disabling this significantly improves speed.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Max Comments per Post",
    "name": "maxComments",
    "description": "Maximum number of comments to extract per post. Set to 0 for all comments.",
    "required": false,
    "default": 10,
    "type": "number",
    "typeOptions": {
      "minValue": 0,
      "maxValue": 100
    }
  },
  {
    "displayName": "Debug Mode",
    "name": "debugMode",
    "description": "When enabled, saves screenshots and HTML to Key-Value Store on extraction failures for troubleshooting.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Proxy Configuration",
    "name": "proxyConfiguration",
    "description": "Proxy settings. TeamBlind requires residential proxies to avoid blocks.",
    "required": false,
    "default": "{\"useApifyProxy\":true,\"apifyProxyGroups\":[\"RESIDENTIAL\"],\"apifyProxyCountry\":\"US\"}",
    "type": "json"
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
