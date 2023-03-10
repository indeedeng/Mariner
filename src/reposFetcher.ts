import { Config } from './config';
import { GraphQlQueryResponseData, RequestParameters } from '@octokit/graphql/dist-types/types';
import { SponsorRepoContributionHistory } from './sponsorabilityFinder';
import { graphql } from '@octokit/graphql';

interface GitHubResponse {
    search: Repos;
}
interface Repos {
    nodes: GitHubRepoNameWithOwnerAndLanguages[];
}

interface GitHubRepoNameWithOwnerAndLanguages {
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
export class RepoLanguagesFetcher {
    private readonly config: Config;

    public constructor(config: Config) {
        this.config = config;
    }

    public async fetchAllReposLanguages(
        token: string,
        allSponsorable: Map<RepositoryName, SponsorRepoContributionHistory[]>
    ): Promise<Map<OwnerAndRepoName, GitHubRepoNameWithOwnerAndLanguages[][]>> {
        const repositoryLanguages = await this.fetchAllGitHubRepositoryLanguages(
            token,
            allSponsorable
        );

        let languagesCount;
        repositoryLanguages.forEach(async (repo, index) => {
            const repoId = index;
            console.log(repoId.length);
            languagesCount = await this.countLanguages(repo);
        });

        console.log(languagesCount);

        return repositoryLanguages;
    }

    // WIP
    public async countLanguages(
        gitHubRepoNamesWithOwnerAndLanguages: GitHubRepoNameWithOwnerAndLanguages[][]
    ): Promise<string[]> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const languageCount: any = [];
        gitHubRepoNamesWithOwnerAndLanguages.forEach((githubRepoWithLanguages) => {
            // clean up forEach??
            githubRepoWithLanguages.forEach((repoWithLanguages) => {
                repoWithLanguages.languages.edges.forEach((language) => {
                    //buggy code, needs refactoring
                    if (languageCount[language.node.name]) {
                        languageCount[language.node.name] += 1;
                    } else {
                        languageCount[language.node.name] = 1;
                    }
                });
            });
        });
        console.log(languageCount);

        //  WIP - its mushin everything in both arrays...
        // [
        //   Python: 1,
        //   Roff: 1,
        //   Shell: 1,
        //   Batchfile: 1,
        //   Makefile: 2,
        //   Java: 1,
        //   C: 1,
        //   FreeMarker: 1
        // ]
        // 14
        // [
        //   Python: 1,
        //   Roff: 1,
        //   Shell: 1,
        //   Batchfile: 1,
        //   Makefile: 2,
        //   Java: 1,
        //   C: 1,
        //   FreeMarker: 1
        // ]

        return [];
    }

    public async fetchAllGitHubRepositoryLanguages(
        token: string,
        allSponsorable: Map<RepositoryName, SponsorRepoContributionHistory[]>
    ): Promise<Map<OwnerAndRepoName, GitHubRepoNameWithOwnerAndLanguages[][]>> {
        const languages: GitHubRepoNameWithOwnerAndLanguages[][] = [];
        const repoLanguageInformation = new Map<
            OwnerAndRepoName,
            GitHubRepoNameWithOwnerAndLanguages[][]
        >();

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

    public async fetchRepos(
        token: string,
        variables: Variables,
        query: string
    ): Promise<GitHubRepoNameWithOwnerAndLanguages[]> {
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
