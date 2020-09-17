import * as mariner from './mariner/index'; // This is used during development
import { graphql } from '@octokit/graphql';
import { RequestParameters } from '@octokit/graphql/dist-types/types';

// NOTE: See https://docs.github.com/en/graphql/reference/objects#searchresultitemconnection
export interface Edge {
    node: GitHubIssue;
}

interface IssueCountAndIssues {
    issueCount: number;
    edges: Edge[];
    pageInfo: {
        startCursor?: string;
        hasNextPage: boolean;
        endCursor?: string;
    }

}

export interface GitHubIssue {
    title: string;
    createdAt: string;
    repository: GitHubRepository;
    url: string;
}

interface GitHubRepository {
    nameWithOwner: string;
}

interface Variables extends RequestParameters {
    queryString: string;
    pageSize: number;
    after?: string;
}
const query = `
query findByLabel($queryString:String!, $pageSize:Int, $after:String) {
    search(
        type: ISSUE, 
        query: $queryString
        first: $pageSize, 
        after: $after
    )
    {
        issueCount
        edges{
            node{
                ... on Issue{
                    title
                    createdAt
                        repository {
                        nameWithOwner
                    }
                    url
    	        }
            }
        }
        pageInfo {
            startCursor
            hasNextPage
            endCursor
        }
    }
}`;

export class GitHubIssueFetcher {
    private readonly logger: mariner.Logger;

    public constructor(logger: mariner.Logger) {
        this.logger = logger;
    }

    public async fetchMatchingIssues(
        token: string,
        label: string,
        repositoryIdentifiers: string[]
    ): Promise<IssueCountAndIssues> {
        const listOfRepos = this.createListOfRepos(repositoryIdentifiers);
        const variables: Variables = {
            // NOTE: See https://docs.github.com/en/github/searching-for-information-on-github/searching-issues-and-pull-requests
            queryString: `label:\"${label}\" state:open ${listOfRepos}`,
            pageSize: 10,
        };
        const issueCountAndIssues = await this.fetchAllPages(token, query, variables);

        return issueCountAndIssues;
    }

    private createListOfRepos(repos: string[]): string {
        const withPrefixes = repos.map((repo) => {
            return `repo:${repo}`;
        });

        return withPrefixes.join(' ');
    }

    private async fetchAllPages(token: string, query: string, variables: Variables): Promise<IssueCountAndIssues> {
        const graphqlWithAuth = graphql.defaults({
            headers: {
                authorization: `token ${token}`,
            },
        });

        const result: IssueCountAndIssues = {
            issueCount: 0,
            edges: [],
            pageInfo: {
                hasNextPage: true,
            }
        }
        while (result.pageInfo.hasNextPage) {
            const { search } = await graphqlWithAuth(query, variables);
            this.logger.info(JSON.stringify(search.pageInfo));
            const issueCountsAndIssues = search as IssueCountAndIssues;
            variables.after = issueCountsAndIssues.pageInfo.endCursor;
            result.pageInfo.hasNextPage = issueCountsAndIssues.pageInfo.hasNextPage;
            result.edges.push(...issueCountsAndIssues.edges);
        }

        result.issueCount = result.edges.length;
        return result;
    }
}
