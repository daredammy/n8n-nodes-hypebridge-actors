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
		// Eater URLs (startUrls)
		...getFixedCollectionParam(context, 'startUrls', itemIndex, 'items', 'passthrough'),
		// Max Items (maxItems)
		maxItems: context.getNodeParameter('maxItems', itemIndex),
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
    "displayName": "Eater URLs",
    "name": "startUrls",
    "description": "List of Eater.com map/guide URLs to scrape for restaurant data. Supports any city's maps (e.g., dallas.eater.com, nyc.eater.com, austin.eater.com).",
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
    "description": "Maximum number of restaurants to scrape (0 = unlimited)",
    "required": false,
    "default": 0,
    "type": "number",
    "typeOptions": {
      "minValue": 0,
      "maxValue": 10000
    }
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
