import { graphql } from '@octokit/graphql';
import { RequestParameters } from '@octokit/graphql/dist-types/types';
import { Logger } from './tab-level-logger';

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
    };
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
    private readonly logger: Logger;

    public constructor(logger: Logger) {
        this.logger = logger;
    }

    public async fetchMatchingIssues(
        token: string,
        label: string,
        repositoryIdentifiers: string[]
    ): Promise<GitHubIssue[]> {
    
        const numberOfReposPerCall = 10;
        const chunks = this.splitArray(repositoryIdentifiers, numberOfReposPerCall);

        const repos = chunks.map(async (chunk) => {
            const listOfRepos = this.createListOfRepos(chunk);
            const variables: Variables = {
                queryString: `label:\"${label}\" state:open ${listOfRepos}`,
                pageSize: 10,
            };
            const issue = await this.fetchAllPages(token, query, variables);
            return issue.edges;
        });
        const edges = await Promise.all(repos);
        const edgeArray = edges.flat();

        const issues = edgeArray.flatMap((edge) => {
            return edge.node;
        });
    
        return issues;
    }

    private splitArray(repositoryIdentifiers: string[], size: number): string[][] {
        let chunkedArray = [];
        let i = 0;
        for (i; i < repositoryIdentifiers.length; i += size) {
            let chunk = repositoryIdentifiers.slice(i, i + size);
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
        variables: Variables
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
            this.logger.info(`Calling: ${JSON.stringify(variables)}`);
            const { search } = await graphqlWithAuth(query, variables);
            const issueCountsAndIssues = search as IssueCountAndIssues;
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
        return result;
    }
}
