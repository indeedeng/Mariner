import { graphql } from '@octokit/graphql';
import { RequestParameters } from '@octokit/graphql/dist-types/types';
import { Logger } from './tab-level-logger';

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
    rateLimit {
        limit
        cost
        remaining
        resetAt
    }
}`;

export class GitHubIssueFetcher {
    private readonly logger: Logger;

    public constructor(logger: Logger) {
        this.logger = logger;
    }

    public async fetchMatchingIssues(
        token: string,
        label: string,
        repositoryIdentifiers: string[]
    ): Promise<GitHubIssue[]> {
        const pageSize = 100;
        const numberOfReposPerCall = 1000;
        const chunks = this.splitArray(repositoryIdentifiers, numberOfReposPerCall);

        const edgeArray: Edge[] = [];
        for (const chunk of chunks) {
            const listOfRepos = this.createListOfRepos(chunk);
            const variables: Variables = {
                queryString: `label:\"${label}\" state:open ${listOfRepos}`,
                pageSize,
            };
            const queryId = `${label}: ${chunk[0]}`;
            const issue = await this.fetchAllPages(token, query, variables, queryId);
            edgeArray.push(...issue.edges);
        }

        this.logger.info(`-----Fetched ${label}: ${edgeArray.length} matching issues`);

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
    ): Promise<IssueCountAndIssues> {
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
            this.logger.info(`Calling: ${queryId}`);
            const response = (await graphqlWithAuth(query, variables)) as Response;
            const issueCountsAndIssues = response.search;
            this.logger.info(
                `Fetched: ${queryId} => ` +
                    `${issueCountsAndIssues.edges.length}/${issueCountsAndIssues.issueCount} (${issueCountsAndIssues.pageInfo.hasNextPage})`
            );
            const rateLimit = response.rateLimit;
            this.logger.info(`Rate limits: ${JSON.stringify(rateLimit)}`);
            variables.after = issueCountsAndIssues.pageInfo.endCursor;
            result.pageInfo.hasNextPage = issueCountsAndIssues.pageInfo.hasNextPage;
            result.edges.push(...issueCountsAndIssues.edges);
        }
        result.edges = result.edges.filter((edge) => {
            if (!edge.node.repository) {
                console.log(`No repository for ${edge.node.title}`);
            }

            return edge.node.repository ? true : false;
        });

        result.issueCount = result.edges.length;
        this.logger.info(`Returning: ${queryId} => ${result.issueCount}`);

        return result;
    }
}
