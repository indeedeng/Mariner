import { Config } from './config';
import { Octokit } from '@octokit/rest';

export interface Contributor {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
    contributions: number;
}

export class SponsorabilityFetcher {
    private readonly config: Config;

    public constructor(config: Config) {
        this.config = config;
    }
    public async fetchSponsorables(token: string) {
        /* To-do:
          1. Read file of deps
          2. Figure out types
          3. create function to loop through
          each dependeny and pass each one in fetchContributors
        */
        return this.fetchContributors(token);
    }

    public async fetchContributors(token: string) {
        const octokit = new Octokit({
            auth: token,
        });

        const listOfContributors = await octokit.repos.listContributors({
            // will removce when looping through
            owner: 'indeedeng', // user or org name
            repo: 'mariner', // repoName
        });

        return listOfContributors.data;
    }
}

/*
Response Schema
{
  "type": "array",
  "items": {
    "title": "Contributor",
    "description": "Contributor",
    "type": "object",
    "properties": {
      "login": {
        "type": "string"
      },
      "id": {
        "type": "integer"
      },
      "node_id": {
        "type": "string"
      },
      "avatar_url": {
        "type": "string",
        "format": "uri"
      },
      "gravatar_id": {
        "type": [
          "string",
          "null"
        ]
      },
      "url": {
        "type": "string",
        "format": "uri"
      },
      "html_url": {
        "type": "string",
        "format": "uri"
      },
      "followers_url": {
        "type": "string",
        "format": "uri"
      },
      "following_url": {
        "type": "string"
      },
      "gists_url": {
        "type": "string"
      },
      "starred_url": {
        "type": "string"
      },
      "subscriptions_url": {
        "type": "string",
        "format": "uri"
      },
      "organizations_url": {
        "type": "string",
        "format": "uri"
      },
      "repos_url": {
        "type": "string",
        "format": "uri"
      },
      "events_url": {
        "type": "string"
      },
      "received_events_url": {
        "type": "string",
        "format": "uri"
      },
      "type": {
        "type": "string"
      },
      "site_admin": {
        "type": "boolean"
      },
      "contributions": {
        "type": "integer"
      },
      "email": {
        "type": "string"
      },
      "name": {
        "type": "string"
      }
    },
    "required": [
      "contributions",
      "type"
    ]
  }
}
*/
