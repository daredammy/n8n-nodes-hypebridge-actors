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
		// Max Items (maxItems)
		maxItems: context.getNodeParameter('maxItems', itemIndex, 100),
		// Scrape Full Post Details (scrapePostsFromLists)
		scrapePostsFromLists: context.getNodeParameter('scrapePostsFromLists', itemIndex, false),
		// Include Public Comments (scrapeComments)
		scrapeComments: context.getNodeParameter('scrapeComments', itemIndex, false),
		// Max Comments per Post (maxComments)
		maxComments: context.getNodeParameter('maxComments', itemIndex, 10),
		// Debug Mode (debugMode)
		debugMode: context.getNodeParameter('debugMode', itemIndex, false),
		// Maximum Feed Pages per Start URL (maxPages)
		maxPages: context.getNodeParameter('maxPages', itemIndex, 20),
		// Maximum Comment Pages per Post (maxCommentPages)
		maxCommentPages: context.getNodeParameter('maxCommentPages', itemIndex, 10),
		// Maximum Parallel Requests (maxConcurrency)
		maxConcurrency: context.getNodeParameter('maxConcurrency', itemIndex, 3),
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
    "description": "English TeamBlind public feeds, channels, company discussions, keyword search or /post/ URLs on teamblind.com or www.teamblind.com. Direct post URLs always receive details. Up to 100 start URLs. Private groups and localized market URLs are unsupported and skipped with a warning.",
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
    "description": "Maximum delivered posts across the run, capped at 10,000. For compatibility, 0 uses the 10,000-post safety cap.",
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
    "description": "Follow post links from feed, company, channel and search pages to extract the full available post text and public poll data. The post is delivered once. Direct post URLs always receive detail extraction.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Include Public Comments",
    "name": "scrapeComments",
    "description": "Include available public comments on post detail pages, up to Max comments per post. Enable full details when starting from a feed. Login-restricted comments and replies may be unavailable.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Max Comments per Post",
    "name": "maxComments",
    "description": "Maximum public comments per post, capped at 100. For compatibility, 0 uses the 100-comment safety cap. The source may expose fewer comments than its displayed total.",
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
    "description": "Save at most two diagnostic HTML snippets, each capped at 200,000 characters, when extraction cannot complete.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Maximum Feed Pages per Start URL",
    "name": "maxPages",
    "description": "Stop after this many public feed, company, channel or search pages per start URL, or sooner when Max items is reached or no more public pages are available. Collected results are kept if another page is refused.",
    "required": false,
    "default": 20,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 100
    }
  },
  {
    "displayName": "Maximum Comment Pages per Post",
    "name": "maxCommentPages",
    "description": "Maximum additional public comment pages per post, when the source exposes them. Stop sooner at Max comments. If another page is refused, available comments are kept; signed-in comments may remain inaccessible.",
    "required": false,
    "default": 10,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 20
    }
  },
  {
    "displayName": "Maximum Parallel Requests",
    "name": "maxConcurrency",
    "description": "Limit requests processed at once. Lower this value when the site is limiting requests.",
    "required": false,
    "default": 3,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 10
    }
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
