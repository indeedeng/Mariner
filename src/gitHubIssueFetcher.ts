import { graphql } from '@octokit/graphql';
import { RequestParameters } from '@octokit/graphql/dist-types/types';
import { Config } from './config';
import { getLogger } from './tab-level-logger';
import { DateTime } from 'luxon';

// NOTE: See https://docs.github.com/en/graphql/reference/objects#searchresultitemconnection
export interface Edge {
    node: GitHubIssue;
}

interface Response {
    search: IssueCountAndIssues;
    rateLimit: RateLimit;
}

interface IssueCountAndIssues {
    issueCount: number;
    edges: Edge[];
    pageInfo: {
        startCursor?: string;
        hasNextPage: boolean;
        endCursor?: string;
    };
    rateLimit?: RateLimit;
}

interface RateLimit {
    limit: number;
    cost: number;
    remaining: number;
    resetAt: number;
}

interface Assignees {
    totalCount: number;
}

export interface GitHubIssue {
    title: string;
    assignees: Assignees;
    createdAt: string;
    repository: GitHubRepository;
    url: string;
    updatedAt: string;
    labels: { edges: GitHubLabelEdge[] };
}

interface GitHubRepository {
    nameWithOwner: string;
    languages: { edges: Languages[] };
}

export interface Languages {
    node: {
        name: string;
    };
}
export interface GitHubLabelEdge {
    node: {
        name: string;
    };
}

interface Variables extends RequestParameters {
    queryString: string;
    pageSize: number;
    maxLabelsToRetrieve: number;
    after?: string;
}

const queryTemplate = `
query findByLabel($queryString:String!, $pageSize:Int, $maxLabelsToRetrieve:Int, $after:String) {
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
                    assignees {
                        totalCount
                    }
                    createdAt
                        repository {
                        nameWithOwner
                        languages(first: 10) {
                            edges {
                                node {
                                name
                                }
                            }
                        }
                    }
                    url
                    updatedAt
                    labels(first: $maxLabelsToRetrieve) {
                        edges{
                            node{
                                name
                            }
                        }
                    }
                }
            }
        }
        pageInfo {
            startCursor
            hasNextPage
            endCursor
        }
    }
    rateLimit {
        limit
        cost
        remaining
        resetAt
    }
}`;

export class GitHubIssueFetcher {
    private readonly config: Config;

    public constructor(config: Config) {
        this.config = config;
    }

    public async fetchMatchingIssues(
        token: string,
        label: string,
        repositoryIdentifiers: string[]
    ): Promise<GitHubIssue[]> {
        const pageSize = 100;
        const maxLabelsToRetrieve = 100;
        const numberOfReposPerCall = this.config.numberOfReposPerCall;
        const reposForEachCall = this.splitArray(repositoryIdentifiers, numberOfReposPerCall);
        const daysAgoCreated = this.config.daysAgoCreated;
        const dateTimeStringForQuery = DateTime.local().minus({ days: daysAgoCreated }).toISO();

        const edgeArray: Edge[] = [];
        for (const chunk of reposForEachCall) {
            const listOfRepos = this.createListOfRepos(chunk);

            // Note on linked: https://docs.github.com/en/search-github/searching-on-github/searching-issues-and-pull-requests#search-for-linked-issues-and-pull-requests
            const variables: Variables = {
                queryString: `label:"${label}" state:open ${listOfRepos} created:>${dateTimeStringForQuery} -linked:pr`,
                pageSize,
                maxLabelsToRetrieve,
            };
            const queryId = `${label}: ${chunk[0]}`;
            const issue = await this.fetchAllPages(token, queryTemplate, variables, queryId);
            edgeArray.push(...issue);
        }

        getLogger().info(`-----Fetched ${label}: ${edgeArray.length} matching issues`);

        const issues = edgeArray.map((edge) => {
            return edge.node;
        });

        return issues;
    }

    private splitArray(allStrings: string[], size: number): string[][] {
        const chunkedArray = [];

        for (let i = 0; i < allStrings.length; i += size) {
            const chunk = allStrings.slice(i, i + size);
            chunkedArray.push(chunk);
        }

        return chunkedArray;
    }

    private createListOfRepos(repos: string[]): string {
        const withPrefixes = repos.map((repo) => {
            return `repo:${repo}`;
        });

        return withPrefixes.join(' ');
    }

    private async fetchAllPages(
        token: string,
        query: string,
        variables: Variables,
        queryId: string
    ): Promise<Edge[]> {
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
            },
        };
        while (result.pageInfo.hasNextPage) {
            getLogger().info(`Calling: ${queryId}`);
            const response = (await graphqlWithAuth(query, variables)) as Response;
            const issueCountsAndIssues = response.search;
            getLogger().info(
                `Fetched: ${queryId} => ` +
                    `${issueCountsAndIssues.edges.length}/${issueCountsAndIssues.issueCount} (${issueCountsAndIssues.pageInfo.hasNextPage})`
            );
            const rateLimit = response.rateLimit;
            getLogger().info(`Rate limits: ${JSON.stringify(rateLimit)}`);
            variables.after = issueCountsAndIssues.pageInfo.endCursor;
            result.pageInfo.hasNextPage = issueCountsAndIssues.pageInfo.hasNextPage;
            result.edges.push(...issueCountsAndIssues.edges);
        }
        result.edges = result.edges.filter((edge) => {
            if (!edge.node.repository) {
                getLogger().info(`\nNo repository for an edge in ${JSON.stringify(variables)}`);
            }

            return edge.node.repository;
        });

        result.issueCount = result.edges.length;
        getLogger().info(`Returning: ${queryId} => ${result.issueCount}`);

        return result.edges;
    }
}
