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
		// Spotify URLs (startUrls)
		...getFixedCollectionParam(context, 'startUrls', itemIndex, 'items', 'passthrough'),
		// Max items (maxItems)
		maxItems: context.getNodeParameter('maxItems', itemIndex, 1000),
		// Include 30-second preview MP3 URLs (includePreviewUrls)
		includePreviewUrls: context.getNodeParameter('includePreviewUrls', itemIndex, false),
		// Search keywords (searchQueries)
		...getFixedCollectionParam(context, 'searchQueries', itemIndex, 'values', 'mapValues'),
		// Search for (searchType)
		...getOptionalParam(context, 'searchType', itemIndex),
		// Max results per search (maxSearchResults)
		maxSearchResults: context.getNodeParameter('maxSearchResults', itemIndex, 20),
		// Search country (searchMarket)
		...getOptionalParam(context, 'searchMarket', itemIndex),
		// Find playlist curator contacts (curatorContacts)
		curatorContacts: context.getNodeParameter('curatorContacts', itemIndex, false),
		// Max playlists per artist (maxCuratorPlaylistsPerSeed)
		maxCuratorPlaylistsPerSeed: context.getNodeParameter('maxCuratorPlaylistsPerSeed', itemIndex, 20),
		// Include tracks of albums and playlists (includeTracks)
		...getOptionalParam(context, 'includeTracks', itemIndex),
		// Attach artist stats to tracks (includeArtistStats)
		includeArtistStats: context.getNodeParameter('includeArtistStats', itemIndex, false),
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
    "displayName": "Spotify URLs",
    "name": "startUrls",
    "description": "Track, album, artist or playlist URLs (open.spotify.com/... or spotify:track:... URIs). Search URLs (open.spotify.com/search/...) also work.",
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
    "displayName": "Max items",
    "name": "maxItems",
    "description": "Hard cap on dataset items for the whole run (albums and playlists expand into one item per track). Billing stops at this number.",
    "required": false,
    "default": 1000,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 100000
    }
  },
  {
    "displayName": "Include 30-second preview MP3 URLs",
    "name": "includePreviewUrls",
    "description": "Adds previewUrl to each track. Costs one extra request per track, so it is slower on large albums and playlists. All other fields are returned either way.",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Search keywords",
    "name": "searchQueries",
    "description": "Keywords to search on Spotify. Each query returns up to 'Max results per search'.",
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
    "displayName": "Search for",
    "name": "searchType",
    "description": "Entity type returned by keyword searches.",
    "required": false,
    "default": "tracks",
    "type": "options",
    "options": [
      {
        "name": "Tracks",
        "value": "tracks"
      },
      {
        "name": "Artists",
        "value": "artists"
      },
      {
        "name": "Albums",
        "value": "albums"
      },
      {
        "name": "Playlists",
        "value": "playlists"
      }
    ]
  },
  {
    "displayName": "Max results per search",
    "name": "maxSearchResults",
    "description": "Maximum search hits per query, bounded to 200.",
    "required": false,
    "default": 20,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 200
    }
  },
  {
    "displayName": "Search country",
    "name": "searchMarket",
    "description": "Spotify ranks search results by the country of the requester. Only affects search keywords. Track, album, artist and playlist data is identical in every country.",
    "required": false,
    "default": "US",
    "type": "options",
    "options": [
      {
        "name": "United States",
        "value": "US"
      },
      {
        "name": "Brazil",
        "value": "BR"
      },
      {
        "name": "India",
        "value": "IN"
      },
      {
        "name": "United Kingdom",
        "value": "GB"
      },
      {
        "name": "Mexico",
        "value": "MX"
      }
    ]
  },
  {
    "displayName": "Find playlist curator contacts",
    "name": "curatorContacts",
    "description": "For artist URLs: finds third-party playlists the artist is discovered on. For playlist URLs and playlist searches: extracts contact details from the description. In curator mode, track rows are suppressed by default to prevent unwanted per-track charges. Only curators with at least one contact are returned (and billed).",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Max playlists per artist",
    "name": "maxCuratorPlaylistsPerSeed",
    "description": "Maximum discovered playlists examined per seed: artists support up to 20; playlist searches up to 50.",
    "required": false,
    "default": 20,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 50
    }
  },
  {
    "displayName": "Include tracks of albums and playlists",
    "name": "includeTracks",
    "description": "Turn off to get only the album or playlist record without one item per track. Defaults to true for metadata runs, but automatically defaults to false when curatorContacts is enabled unless explicitly overridden. Leave unset for the automatic default.",
    "required": false,
    "default": "",
    "type": "options",
    "options": [
      {
        "name": "Automatic",
        "value": ""
      },
      {
        "name": "Yes",
        "value": true
      },
      {
        "name": "No",
        "value": false
      }
    ]
  },
  {
    "displayName": "Attach artist stats to tracks",
    "name": "includeArtistStats",
    "description": "Adds monthly listeners, followers and top cities of the main artist to every track (one extra request per unique artist).",
    "required": false,
    "default": false,
    "type": "boolean"
  },
  {
    "displayName": "Max concurrency",
    "name": "maxConcurrency",
    "description": "Maximum concurrent requests. Preview requests use a separate cap of five.",
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
