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
    "description": "Categories to scrape. Matches either a DraftKings Predictions category (e.g. crypto, politics) or a league directly (e.g. nfl, bitcoin). Leagues are resolved against the live catalogue at run time, so newly listed ones work without an update. Leave empty for everything.",
    "required": true,
    "default": [],
    "type": "multiOptions",
    "options": [
      {
        "name": "Featured",
        "value": "featured"
      },
      {
        "name": "Crypto",
        "value": "crypto"
      },
      {
        "name": "Economics",
        "value": "economics"
      },
      {
        "name": "Financials",
        "value": "financials"
      },
      {
        "name": "Politics",
        "value": "politics"
      },
      {
        "name": "Culture",
        "value": "culture"
      },
      {
        "name": "Climate",
        "value": "climate"
      },
      {
        "name": "NFL",
        "value": "nfl"
      },
      {
        "name": "College Football (NCAAF)",
        "value": "cfb"
      },
      {
        "name": "NBA",
        "value": "nba"
      },
      {
        "name": "WNBA",
        "value": "wnba"
      },
      {
        "name": "NHL",
        "value": "nhl"
      },
      {
        "name": "MLB",
        "value": "mlb"
      },
      {
        "name": "UFC",
        "value": "ufc"
      },
      {
        "name": "Stock Market (→ Financials)",
        "value": "stock-market"
      },
      {
        "name": "Commodities (→ Financials)",
        "value": "commodities"
      },
      {
        "name": "Baseball",
        "value": "baseball"
      },
      {
        "name": "Basketball",
        "value": "basketball"
      },
      {
        "name": "Boxing",
        "value": "boxing"
      },
      {
        "name": "Football",
        "value": "football"
      },
      {
        "name": "Golf",
        "value": "golf"
      },
      {
        "name": "Hockey",
        "value": "hockey"
      },
      {
        "name": "MMA",
        "value": "mma"
      },
      {
        "name": "Motorsports",
        "value": "motorsports"
      },
      {
        "name": "Sailing",
        "value": "sailing"
      },
      {
        "name": "Soccer",
        "value": "soccer"
      },
      {
        "name": "Tennis",
        "value": "tennis"
      }
    ]
  },
  {
    "displayName": "Subcategory",
    "name": "subcategory",
    "description": "Narrows to a specific league within the selected categories, matched on name (e.g. 'bitcoin', 'nba', 's&p'). Leave empty for every league in the category. Ignored if it matches nothing.",
    "required": false,
    "default": "",
    "type": "string"
  },
  {
    "displayName": "Maximum Results",
    "name": "maxResults",
    "description": "Maximum number of market rows to return. Each row is one market with all of its outcomes. Set to 0 for unlimited.",
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
    "description": "Include every market line per event, not just the primary market. Charged per event that has additional lines.",
    "required": false,
    "default": true,
    "type": "boolean"
  },
  {
    "displayName": "Proxy Configuration",
    "name": "proxyConfiguration",
    "description": "Optional. The API is reached over plain HTTPS with browser TLS impersonation and does not need residential proxies. A proxy is used only as an automatic fallback if the request is blocked.",
    "required": false,
    "default": "{\"useApifyProxy\":false}",
    "type": "json"
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
