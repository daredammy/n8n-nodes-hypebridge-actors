# n8n-nodes-hypebridge-actors

n8n community nodes for [Hypebridge](https://thehypebridge.com) Apify actors — event scrapers, influencer marketing tools, and more.

## Installation

In n8n:
1. Go to **Settings → Community Nodes**
2. Click **Install a community node**
3. Enter `n8n-nodes-hypebridge-actors`
4. Click **Install**

## Nodes Included

### Event Scrapers

| Node | Description | Apify Actor |
|------|-------------|-------------|
| **Eventbrite Search** | Scrape Eventbrite search, discovery, and event detail pages | [hypebridge/eventbrite-search](https://apify.com/hypebridge/eventbrite-search) |
| **Dice.fm** | Scrape concerts, festivals, DJ events, and live shows from Dice.fm | [hypebridge/dice-fm](https://apify.com/hypebridge/dice-fm) |
| **Shotgun Live** | Scrape electronic music, nightlife, and party events worldwide | [hypebridge/shotgun-live](https://apify.com/hypebridge/shotgun-live) |
| **Posh VIP** | Scrape nightlife, concerts, and party events from Posh.vip | [hypebridge/posh-vip](https://apify.com/hypebridge/posh-vip) |
| **Prekindle** | Scrape event listings and venue information from Prekindle.com | [hypebridge/prekindle](https://apify.com/hypebridge/prekindle) |
| **Eventnoire** | Scrape Black culture events from Eventnoire.com | [hypebridge/eventnoire](https://apify.com/hypebridge/eventnoire) |

### Influencer Marketing

| Node | Description | Apify Actor |
|------|-------------|-------------|
| **Influencer Discovery Agent** | Discover and rank influencers on Instagram + TikTok based on brand fit | [hypebridge/influencer-discovery-agent-instagram-tiktok](https://apify.com/hypebridge/influencer-discovery-agent-instagram-tiktok) |
| **Influencer Evaluation Agent** | Deep evaluation of influencer profiles with audience insights | [hypebridge/influencer-evaluation-agent-instagram-tiktok](https://apify.com/hypebridge/influencer-evaluation-agent-instagram-tiktok) |

### Other Scrapers

| Node | Description | Apify Actor |
|------|-------------|-------------|
| **Eater** | Scrape restaurant information from Eater.com maps and guides | [hypebridge/eater](https://apify.com/hypebridge/eater) |
| **TeamBlind** | Scrape posts and discussions from TeamBlind | [hypebridge/blind-post-comments-scraper](https://apify.com/hypebridge/blind-post-comments-scraper) |
| **DraftKings Predictions** | Scrape prediction markets and odds from DraftKings | [hypebridge/draftkings-predictions](https://apify.com/hypebridge/draftkings-predictions) |

## Authentication

These nodes require an Apify API token:

1. Sign up at [apify.com](https://apify.com)
2. Go to **Settings → Integrations → API tokens**
3. Copy your token
4. In n8n, create new credentials for **Apify API** and paste your token

## Usage Example

1. Add any Hypebridge node to your workflow
2. Configure your Apify credentials
3. Set the input parameters (URLs, search queries, etc.)
4. Execute the node to retrieve data

Each node's parameters match the corresponding Apify actor's input schema. See the individual actor pages linked above for detailed documentation.

## AI Agent Compatible

All nodes are configured with `usableAsTool: true`, making them available as tools for n8n AI agents.

## Support

- **Apify Actors**: [apify.com/hypebridge](https://apify.com/hypebridge)
- **Issues**: [GitHub Issues](https://github.com/hypebridge/n8n-nodes-hypebridge-actors/issues)

## License

MIT
