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

export function buildActorInput(
	context: IExecuteFunctions,
	itemIndex: number,
	defaultInput: Record<string, any>,
): Record<string, any> {
	return {
		...defaultInput,
		// Threads post or profile links (startUrls)
		...getFixedCollectionParam(context, 'startUrls', itemIndex, 'items', 'passthrough'),
		// Max items per URL (maxItems)
		maxItems: context.getNodeParameter('maxItems', itemIndex, 100),
		// Get post details (reply trees) for profile posts (getPostDetails)
		getPostDetails: context.getNodeParameter('getPostDetails', itemIndex, true),
		// Max reply depth (maxReplyDepth)
		maxReplyDepth: context.getNodeParameter('maxReplyDepth', itemIndex, 5),
		// Max posts per profile (maxPostsPerProfile)
		maxPostsPerProfile: context.getNodeParameter('maxPostsPerProfile', itemIndex, 20),
		// Max replies per profile post (maxRepliesPerPost)
		maxRepliesPerPost: context.getNodeParameter('maxRepliesPerPost', itemIndex, 25),
		// Replies since (repliesSince)
		...getDateParam(context, 'repliesSince', itemIndex),
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
    "displayName": "Threads post or profile links",
    "name": "startUrls",
    "description": "Public Threads post links (threads.com or threads.net, including /t/ short links) or profile links like threads.com/@username. A post link returns the post and its full reply tree. A profile link returns the profile and its recent posts. Search, hashtag, home feed and profile tab links are not supported and stop the run.",
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
    "displayName": "Max items per URL",
    "name": "maxItems",
    "description": "Maximum records returned per link, counting everything: the post, its replies, and for a profile link its posts and their replies. Replies are collected breadth-first, so a low limit returns top-level replies first.",
    "required": false,
    "default": 100,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 5000
    }
  },
  {
    "displayName": "Get post details (reply trees) for profile posts",
    "name": "getPostDetails",
    "description": "For profile links: fetch every listed post's own page and its reply tree. Turn off to get only the profile and a plain list of its recent posts. Post links always return the full tree.",
    "required": false,
    "default": true,
    "type": "boolean"
  },
  {
    "displayName": "Max reply depth",
    "name": "maxReplyDepth",
    "description": "How many levels of replies to follow. 0 returns only the post, 1 returns direct replies, 5 follows nested conversations five levels deep. Profile posts need at least 1 to get reply trees.",
    "required": false,
    "default": 5,
    "type": "number",
    "typeOptions": {
      "minValue": 0,
      "maxValue": 10
    }
  },
  {
    "displayName": "Max posts per profile",
    "name": "maxPostsPerProfile",
    "description": "For profile links: how many recent posts to take. A post and the author's own follow-ups count once. Threads shows logged-out visitors a limited, uneven slice of a profile, typically tens to a few hundred recent posts, so a high value may not be reached.",
    "required": false,
    "default": 20,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 500
    }
  },
  {
    "displayName": "Max replies per profile post",
    "name": "maxRepliesPerPost",
    "description": "For profile links with post details: the most replies to collect under each post, so one popular post cannot use the whole budget.",
    "required": false,
    "default": 25,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 1000
    }
  },
  {
    "displayName": "Replies since",
    "name": "repliesSince",
    "description": "Only return replies posted on or after this date (UTC), for example 2026-09-01 or 7 days. The post itself is always returned. Older replies are not returned or charged, but their nested replies are still checked.",
    "required": false,
    "default": "",
    "type": "dateTime"
  },
  {
    "displayName": "Max concurrency",
    "name": "maxConcurrency",
    "description": "Links processed in parallel. Keep low; Threads rate-limits aggressive clients.",
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
    "description": "Save raw responses for failed requests to the key-value store (capped at 10 files).",
    "required": false,
    "default": false,
    "type": "boolean"
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
