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

export function buildActorInput(
	context: IExecuteFunctions,
	itemIndex: number,
	defaultInput: Record<string, any>,
): Record<string, any> {
	return {
		...defaultInput,
		// Podcast feed or publisher URLs (startUrls)
		...getFixedCollectionParam(context, 'startUrls', itemIndex, 'items', 'passthrough'),
		// Maximum episodes (maxItems)
		maxItems: context.getNodeParameter('maxItems', itemIndex, 100),
		// Mention keywords (keywords)
		...getFixedCollectionParam(context, 'keywords', itemIndex, 'values', 'mapValues'),
		// Maximum episodes per feed (maxEpisodesPerFeed)
		maxEpisodesPerFeed: context.getNodeParameter('maxEpisodesPerFeed', itemIndex, 20),
		// Published after (publishedAfter)
		...getDateParam(context, 'publishedAfter', itemIndex),
		// Include full transcript text (includeFullTranscript)
		includeFullTranscript: context.getNodeParameter('includeFullTranscript', itemIndex, false),
		// Include transcript segments (includeSegments)
		includeSegments: context.getNodeParameter('includeSegments', itemIndex, false),
		// Maximum bytes per transcript (maxTranscriptBytes)
		maxTranscriptBytes: context.getNodeParameter('maxTranscriptBytes', itemIndex, 5242880),
		// Maximum mentions per episode (maxMentionsPerEpisode)
		maxMentionsPerEpisode: context.getNodeParameter('maxMentionsPerEpisode', itemIndex, 100),
		// Maximum transcript bytes per run (maxTotalTranscriptBytes)
		maxTotalTranscriptBytes: context.getNodeParameter('maxTotalTranscriptBytes', itemIndex, 104857600),
		// Maximum HTTP requests (maxRequests)
		maxRequests: context.getNodeParameter('maxRequests', itemIndex, 2000),
		// Run deadline (runTimeoutSeconds)
		runTimeoutSeconds: context.getNodeParameter('runTimeoutSeconds', itemIndex, 900),
		// Maximum concurrency (maxConcurrency)
		maxConcurrency: context.getNodeParameter('maxConcurrency', itemIndex, 10),
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
    "displayName": "Podcast feed or publisher URLs",
    "name": "startUrls",
    "description": "Direct RSS, Atom, or RDF podcast feeds and publisher episode pages that advertise their feed.",
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
    "displayName": "Maximum episodes",
    "name": "maxItems",
    "description": "Global dataset item cap across every submitted URL.",
    "required": false,
    "default": 100,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 5000
    }
  },
  {
    "displayName": "Mention keywords",
    "name": "keywords",
    "description": "Literal terms to locate in available publisher transcripts.",
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
    "displayName": "Maximum episodes per feed",
    "name": "maxEpisodesPerFeed",
    "description": "Newest episode records accepted from any one direct feed.",
    "required": false,
    "default": 20,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 1000
    }
  },
  {
    "displayName": "Published after",
    "name": "publishedAfter",
    "description": "Optional ISO 8601 publication-date lower bound.",
    "required": false,
    "default": "",
    "type": "dateTime"
  },
  {
    "displayName": "Include full transcript text",
    "name": "includeFullTranscript",
    "description": "Include normalized transcript text. Disabled by default to limit redistribution and output size.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Include transcript segments",
    "name": "includeSegments",
    "description": "Include every normalized transcript cue. Disabled by default because output can be large.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Maximum bytes per transcript",
    "name": "maxTranscriptBytes",
    "description": "Per-resource decompressed download cap before parsing.",
    "required": false,
    "default": 5242880,
    "type": "number",
    "typeOptions": {
      "minValue": 1024,
      "maxValue": 26214400
    }
  },
  {
    "displayName": "Maximum mentions per episode",
    "name": "maxMentionsPerEpisode",
    "description": "Cap emitted keyword matches after overlapping context windows are merged.",
    "required": false,
    "default": 100,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 1000
    }
  },
  {
    "displayName": "Maximum transcript bytes per run",
    "name": "maxTotalTranscriptBytes",
    "description": "Global decompressed transcript download budget.",
    "required": false,
    "default": 104857600,
    "type": "number",
    "typeOptions": {
      "minValue": 1024,
      "maxValue": 1073741824
    }
  },
  {
    "displayName": "Maximum HTTP requests",
    "name": "maxRequests",
    "description": "Global request budget across feeds, publisher pages, redirects, and transcripts.",
    "required": false,
    "default": 2000,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 20000
    }
  },
  {
    "displayName": "Run deadline",
    "name": "runTimeoutSeconds",
    "description": "Stop scheduling work after this many seconds and finish validated records.",
    "required": false,
    "default": 900,
    "type": "number",
    "typeOptions": {
      "minValue": 30,
      "maxValue": 3600
    }
  },
  {
    "displayName": "Maximum concurrency",
    "name": "maxConcurrency",
    "description": "Global concurrent request limit; stricter per-host limits still apply.",
    "required": false,
    "default": 10,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 25
    }
  },
  {
    "displayName": "Proxy configuration",
    "name": "proxyConfiguration",
    "description": "Normally unnecessary. Publisher hosts may have independent restrictions.",
    "required": false,
    "default": "{\"useApifyProxy\":false}",
    "type": "json"
  },
  {
    "displayName": "Debug mode",
    "name": "debugMode",
    "description": "Store bounded, sanitized failure artifacts without full transcript bodies.",
    "required": false,
    "default": false,
    "type": "boolean"
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
