import * as mariner from './mariner/index'; // This is used during development
import { graphql } from '@octokit/graphql';

// NOTE: See https://docs.github.com/en/graphql/reference/objects#searchresultitemconnection
interface Edge {
    node: unknown;
}

interface IssueCountAndIssues {
    issueCount: number
    edges: Edge[]
}

const query = `
query findByLabel($queryString:String!) {
    search(
        type: ISSUE, 
        query: $queryString
        first: 100, 
    )
    {
        issueCount
        edges {
        node {
            ... on Issue {
            title
            labels(first: 100) {
                edges {
                node {
                    id
                }
                }
            }
            }
        }
        }
    }
  }`;

export class GitHubIssueFetcher {
    private readonly logger: mariner.Logger;

    public constructor(logger: mariner.Logger) {
        this.logger = logger;
    }

    public async fetchMatchingIssues(token: string, label: string, repositoryIdentifiers: string[]): Promise<IssueCountAndIssues> {
        const graphqlWithAuth = graphql.defaults({
            headers: {
                authorization: `token ${token}`,
            },
        });

        const listOfRepos = this.createListOfRepos(repositoryIdentifiers);
        const variables = {
            // NOTE: See https://docs.github.com/en/github/searching-for-information-on-github/searching-issues-and-pull-requests
            queryString: `label:\"${label}\" state:open ${listOfRepos}`
        };
        this.logger.info(variables.queryString);
        const { search } = await graphqlWithAuth(query, variables);
        return search as IssueCountAndIssues;
    }

    private createListOfRepos(repos: string[]): string {
        const withPrefixes = repos.map((repo) => { return `repo:${repo}`; });
        return withPrefixes.join(' ');
    }
}
