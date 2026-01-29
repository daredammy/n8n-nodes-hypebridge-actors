import { IExecuteFunctions, INodeProperties } from 'n8n-workflow';

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

function getOptionalParam(context: IExecuteFunctions, paramName: string, itemIndex: number): Record<string, any> {
	const value = context.getNodeParameter(paramName, itemIndex);
	return value !== undefined && value !== null && value !== '' ? { [paramName]: value } : {};
}

export function buildActorInput(
	context: IExecuteFunctions,
	itemIndex: number,
	defaultInput: Record<string, any>,
): Record<string, any> {
	return {
		...defaultInput,
		// Sports / Category (sportsCategory)
		sportsCategory: context.getNodeParameter('sportsCategory', itemIndex),
		// Subcategory (subcategory)
		...getOptionalParam(context, 'subcategory', itemIndex),
		// Maximum Results (maxResults)
		maxResults: context.getNodeParameter('maxResults', itemIndex),
		// Include More Markets (includeMoreMarkets)
		includeMoreMarkets: context.getNodeParameter('includeMoreMarkets', itemIndex),
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
    "displayName": "Sports / Category",
    "name": "sportsCategory",
    "description": "Select which sports or categories to scrape. Leave empty for all categories.",
    "required": true,
    "default": [],
    "type": "multiOptions",
    "options": [
      {
        "name": "Featured",
        "value": "featured"
      },
      {
        "name": "NFL",
        "value": "nfl"
      },
      {
        "name": "College Football (CFB)",
        "value": "cfb"
      },
      {
        "name": "NBA",
        "value": "nba"
      },
      {
        "name": "NHL",
        "value": "nhl"
      },
      {
        "name": "College Basketball (CBB)",
        "value": "cbb"
      },
      {
        "name": "Economics",
        "value": "economics"
      },
      {
        "name": "Stock Market",
        "value": "stock-market"
      },
      {
        "name": "Crypto",
        "value": "crypto"
      },
      {
        "name": "Commodities",
        "value": "commodities"
      }
    ]
  },
  {
    "displayName": "Subcategory",
    "name": "subcategory",
    "description": "Subcategory to scrape. For sports: 'games' (head-to-head matchups) or 'futures' (outright winners). For financial categories, use specific market types: stock-market (s&p, nasdaq, dow, russell), commodities (oil-gas, gold, silver, copper, currency), crypto (bitcoin). Leave empty for default behavior.",
    "required": false,
    "default": "bitcoin",
    "type": "string"
  },
  {
    "displayName": "Maximum Results",
    "name": "maxResults",
    "description": "Maximum number of items to return. Set to 0 for unlimited results.",
    "required": false,
    "default": 20,
    "type": "number",
    "typeOptions": {
      "minValue": 0
    }
  },
  {
    "displayName": "Include More Markets",
    "name": "includeMoreMarkets",
    "description": "When enabled, scrapes additional market lines from each event's detail page (e.g., alternate spreads, alternate totals). Charged per event detail page scraped.",
    "required": false,
    "default": true,
    "type": "boolean"
  },
  {
    "displayName": "Proxy Configuration",
    "name": "proxyConfiguration",
    "description": "Proxy settings. DraftKings requires residential proxies for sports pages. Financial pages may work with datacenter proxies.",
    "required": false,
    "default": "{\"useApifyProxy\":true,\"apifyProxyGroups\":[\"RESIDENTIAL\"],\"apifyProxyCountry\":\"US\"}",
    "type": "json"
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
