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

export function buildActorInput(
	context: IExecuteFunctions,
	itemIndex: number,
	defaultInput: Record<string, any>,
): Record<string, any> {
	return {
		...defaultInput,
		// Start URLs (startUrls)
		...getFixedCollectionParam(context, 'startUrls', itemIndex, 'items', 'passthrough'),
		// Maximum Events Per URL (maxEvents)
		maxEvents: context.getNodeParameter('maxEvents', itemIndex),
		// Scrape Full Event Details (scrapeEventDetails)
		scrapeEventDetails: context.getNodeParameter('scrapeEventDetails', itemIndex),
		// Scrape Full Guest Lists (scrapeGuests)
		scrapeGuests: context.getNodeParameter('scrapeGuests', itemIndex),
		// Scrape User Attended Events (scrapeUserAttendedEvents)
		scrapeUserAttendedEvents: context.getNodeParameter('scrapeUserAttendedEvents', itemIndex),
		// Scrape Event Posts (scrapePosts)
		scrapePosts: context.getNodeParameter('scrapePosts', itemIndex),
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
    "description": "Luma URLs to scrape. Supports direct event pages, category pages, city/place pages, calendar/community pages, discover, and user profile URLs.",
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
    "displayName": "Maximum Events Per URL",
    "name": "maxEvents",
    "description": "Maximum number of events to scrape per start URL. Set to 0 for unlimited pagination.",
    "required": false,
    "default": 25,
    "type": "number",
    "typeOptions": {
      "minValue": 0
    }
  },
  {
    "displayName": "Scrape Full Event Details",
    "name": "scrapeEventDetails",
    "description": "When enabled, fetches `/event/get` for each discovered event and returns description, ticket types, categories, sessions, registration questions, and other high-signal event metadata. Additional charges apply per detailed event pushed.",
    "required": false,
    "default": true,
    "type": "boolean"
  },
  {
    "displayName": "Scrape Full Guest Lists",
    "name": "scrapeGuests",
    "description": "When enabled, fetches the entire attendee list for each event, including guest names, social handles, and RSVP details. This can significantly increase run time and may require more proxies.",
    "required": false,
    "default": true,
    "type": "boolean"
  },
  {
    "displayName": "Scrape User Attended Events",
    "name": "scrapeUserAttendedEvents",
    "description": "When scraping user profiles, also fetch events the user has attended in addition to events they are hosting.",
    "required": false,
    "default": true,
    "type": "boolean"
  },
  {
    "displayName": "Scrape Event Posts",
    "name": "scrapePosts",
    "description": "Fetch the posts/insights attached to each event.",
    "required": false,
    "default": true,
    "type": "boolean"
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
