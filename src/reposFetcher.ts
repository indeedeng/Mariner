import { Config } from './config';
import { GraphQlQueryResponseData, RequestParameters } from '@octokit/graphql/dist-types/types';
import { SponsorRepoContributionHistory } from './sponsorabilityFinder';
import { graphql } from '@octokit/graphql';

interface GitHubResponse {
    search: Repos;
}
interface Repos {
    nodes: Node[];
}

interface Node {
    nameWithOwner: string; // repositoryName
    languages: { edges: Languages[] };
}

interface Languages {
    node: {
        name: string;
    };
}

export type OwnerAndRepoName = string;

const queryTemplate = `query fetchRepoInfo($repoIdentifier: String!) {
  search(query: $repoIdentifier, type: REPOSITORY, first: 10) {
 nodes {
      ... on Repository {
        nameWithOwner
        languages(first: 10) {
          edges {
            node {
              name
            }
          }
        }
      }
    }
  }
}`;

interface Variables extends RequestParameters {
    repoIdentifier: string;
}

export interface UserRepo {
    login: string;
    projectCount: number;
    impactCount: number;
    java: number;
    javascript: number;
    python: number;
    go: number;
    other: number;
}

export type RepositoryName = string;
export class ReposLanguageAndProjectCountsFetcher {
    private readonly config: Config;

    public constructor(config: Config) {
        this.config = config;
    }

    public async fetchAllRepositoryInfos(
        token: string,
        allSponsorable: Map<RepositoryName, SponsorRepoContributionHistory[]>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): Promise<Map<OwnerAndRepoName, Node[][]>> {
        const repositoryLanguage = await this.fetchAllRepositoryLanguages(token, allSponsorable);

        return repositoryLanguage;
    }

    // WIP
    public countLanguages(repositoryLanguages: Map<string, Node[][]>): string[] {
        for (const language of repositoryLanguages) {
            console.log(language);
        }

        return ['something'];
    }

    public async fetchAllRepositoryLanguages(
        token: string,
        allSponsorable: Map<RepositoryName, SponsorRepoContributionHistory[]>
    ): Promise<Map<OwnerAndRepoName, Node[][]>> {
        const languages: Node[][] = [];
        const repoLanguageInformation = new Map<OwnerAndRepoName, Node[][]>();

        for (const [repos] of allSponsorable.entries()) {
            const repoIdentifier = repos;
            const variables: Variables = { repoIdentifier: `repo:${repoIdentifier}` }; // get specific repo
            const repositoryLanguageAndOwnerWithName = await this.fetchRepos(
                token,
                variables,
                queryTemplate
            );

            languages.push(repositoryLanguageAndOwnerWithName); // temporary, do we want an array?
            repoLanguageInformation.set(repoIdentifier, languages);
        }

        //     // output
        //     // [{ name: 'pipenv', languages: { edges: [Array] } }]
        //     // [{ name: 'util', languages: { edges: [Array] } }];

        return repoLanguageInformation;
    }

    public async fetchRepos(token: string, variables: Variables, query: string): Promise<Node[]> {
        const graphqlWithAuth = graphql.defaults({
            headers: { authorization: `token ${token}` },
        });

        const response: GraphQlQueryResponseData = (await graphqlWithAuth(
            query,
            variables
        )) as GitHubResponse;

        const result: Repos = response.search;
        // console.log(`fetchRepos function line 81: ${JSON.stringify(result, null, 2)}`);

        return result.nodes;
    }
}

// [({ node: { name: 'Python' } },
// { node: { name: 'Roff' } },
// { node: { name: 'Shell' } },
// { node: { name: 'Batchfile' } },
// { node: { name: 'Makefile' } })];

// [({ node: { name: 'Java' } },
// { node: { name: 'C' } },
// { node: { name: 'Makefile' } },
// { node: { name: 'FreeMarker' } })];
