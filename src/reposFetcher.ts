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
    ): Promise<any> {
        const repositoryLanguage = await this.fetchAllRepositoryInfos(token, allSponsorable);

        return repositoryLanguage;
    }

    // WIP
    // public countLanguages(repositoryLanguages: string[]): string[] {
    //     for (const language of repositoryLanguages) {
    //         console.log(language);
    //     }

    //     return ['something'];
    // }

    public async fetchAllRepositoryLanguages(
        token: string,
        allSponsorable: Map<RepositoryName, SponsorRepoContributionHistory[]>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): Promise<any> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const languages: any[] = [];

        allSponsorable.forEach(async (sponsorable, index) => {
            const repoIdentifier = index;
            const variables: Variables = { repoIdentifier: `repo:${repoIdentifier}` }; // get specific repo
            const repositoryLanguageAndProjectInfo = await this.fetchRepos(
                token,
                variables,
                queryTemplate
            );

            // output
            // [{ name: 'pipenv', languages: { edges: [Array] } }]
            // [{ name: 'util', languages: { edges: [Array] } }];

            languages.push(repositoryLanguageAndProjectInfo); // temporary, do we want an array?
        });

        return languages;
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
