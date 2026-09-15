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
		// Start URLs (startUrls)
		...getFixedCollectionParam(context, 'startUrls', itemIndex, 'items', 'passthrough'),
		// Max items (maxItems)
		maxItems: context.getNodeParameter('maxItems', itemIndex, 200),
		// Get full event details (getEventDetails)
		getEventDetails: context.getNodeParameter('getEventDetails', itemIndex, true),
		// Keyword search (searchQuery)
		...getOptionalParam(context, 'searchQuery', itemIndex),
		// State (UF) (stateFilter)
		...getOptionalParam(context, 'stateFilter', itemIndex),
		// City slug (cityFilter)
		...getOptionalParam(context, 'cityFilter', itemIndex),
		// Category (categoryFilter)
		...getOptionalParam(context, 'categoryFilter', itemIndex),
		// Event format (eventTypeFilter)
		...getOptionalParam(context, 'eventTypeFilter', itemIndex),
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
    "displayName": "Start URLs",
    "name": "startUrls",
    "description": "Sympla event directories, city or category pages, individual standard or Bileto events, and producer profiles. Leave empty when using the advanced search filters.",
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
    "description": "Maximum number of event records saved across all inputs.",
    "required": false,
    "default": 200,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 100000
    }
  },
  {
    "displayName": "Get full event details",
    "name": "getEventDetails",
    "description": "Fetch descriptions, policies, payment options, ticket tiers, live inventory, installments, sessions, and Bileto seating. Direct event URLs are always enriched.",
    "required": false,
    "default": true,
    "type": "boolean"
  },
  {
    "displayName": "Keyword search",
    "name": "searchQuery",
    "description": "Search event titles and metadata, for example tecnologia, rock, or startup.",
    "required": false,
    "default": "",
    "type": "string"
  },
  {
    "displayName": "State (UF)",
    "name": "stateFilter",
    "description": "Brazilian state abbreviation. Nationwide runs are partitioned by state to avoid source result ceilings.",
    "required": false,
    "default": "ALL",
    "type": "options",
    "options": [
      {
        "name": "All states",
        "value": "ALL"
      },
      {
        "name": "São Paulo",
        "value": "SP"
      },
      {
        "name": "Rio de Janeiro",
        "value": "RJ"
      },
      {
        "name": "Minas Gerais",
        "value": "MG"
      },
      {
        "name": "Rio Grande do Sul",
        "value": "RS"
      },
      {
        "name": "Paraná",
        "value": "PR"
      },
      {
        "name": "Santa Catarina",
        "value": "SC"
      },
      {
        "name": "Bahia",
        "value": "BA"
      },
      {
        "name": "Distrito Federal",
        "value": "DF"
      },
      {
        "name": "Pernambuco",
        "value": "PE"
      },
      {
        "name": "Ceará",
        "value": "CE"
      },
      {
        "name": "Goiás",
        "value": "GO"
      },
      {
        "name": "Espírito Santo",
        "value": "ES"
      },
      {
        "name": "Pará",
        "value": "PA"
      },
      {
        "name": "Amazonas",
        "value": "AM"
      },
      {
        "name": "Rio Grande do Norte",
        "value": "RN"
      },
      {
        "name": "Paraíba",
        "value": "PB"
      },
      {
        "name": "Mato Grosso",
        "value": "MT"
      },
      {
        "name": "Mato Grosso do Sul",
        "value": "MS"
      },
      {
        "name": "Maranhão",
        "value": "MA"
      },
      {
        "name": "Alagoas",
        "value": "AL"
      },
      {
        "name": "Piauí",
        "value": "PI"
      },
      {
        "name": "Sergipe",
        "value": "SE"
      },
      {
        "name": "Tocantins",
        "value": "TO"
      },
      {
        "name": "Rondônia",
        "value": "RO"
      },
      {
        "name": "Acre",
        "value": "AC"
      },
      {
        "name": "Amapá",
        "value": "AP"
      },
      {
        "name": "Roraima",
        "value": "RR"
      }
    ]
  },
  {
    "displayName": "City slug",
    "name": "cityFilter",
    "description": "Sympla city slug such as sao-paulo, rio-de-janeiro, or belo-horizonte.",
    "required": false,
    "default": "",
    "type": "string"
  },
  {
    "displayName": "Category",
    "name": "categoryFilter",
    "description": "Event category used by Sympla discovery.",
    "required": false,
    "default": "ALL",
    "type": "options",
    "options": [
      {
        "name": "All categories",
        "value": "ALL"
      },
      {
        "name": "Shows, music and parties",
        "value": "show-musica-festa"
      },
      {
        "name": "Courses and workshops",
        "value": "curso-workshop"
      },
      {
        "name": "Congresses and seminars",
        "value": "congresso-seminario"
      },
      {
        "name": "Food",
        "value": "gastronomia"
      },
      {
        "name": "Theater and performances",
        "value": "teatro-espetaculo"
      },
      {
        "name": "Sports",
        "value": "esporte"
      },
      {
        "name": "Health and wellness",
        "value": "saude-e-bem-estar"
      },
      {
        "name": "Experiences",
        "value": "experiencias"
      }
    ]
  },
  {
    "displayName": "Event format",
    "name": "eventTypeFilter",
    "description": "Limit discovery to in-person, online, or on-demand events.",
    "required": false,
    "default": "ALL",
    "type": "options",
    "options": [
      {
        "name": "All formats",
        "value": "ALL"
      },
      {
        "name": "In person",
        "value": "NORMAL"
      },
      {
        "name": "Online",
        "value": "ONLINE"
      },
      {
        "name": "On demand",
        "value": "ONDEMAND"
      }
    ]
  },
  {
    "displayName": "Max concurrency",
    "name": "maxConcurrency",
    "description": "Maximum simultaneous HTTP requests. Ten is the tested default.",
    "required": false,
    "default": 10,
    "type": "number",
    "typeOptions": {
      "minValue": 1,
      "maxValue": 25
    }
  }
];

export const properties: INodeProperties[] = [...actorProperties, ...authenticationProperties];
