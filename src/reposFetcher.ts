import { Config } from './config';
import { GraphQlQueryResponseData, RequestParameters } from '@octokit/graphql/dist-types/types';
import { graphql } from '@octokit/graphql';

export type RepositoryContributorInfo = {
    owner: string;
    name: string;
};

interface LanguageNode {
    node: {
        name: string;
    };
}

export type OwnerAndRepoName = string;

const queryTemplate = `query fetchLanguagesForRepo($owner: String!, $name: String!){
  repository(owner: $owner, name: $name) {
    languages(first:20) {
      edges {
        node {
          name
        }
      }
    }
  }
}`;

interface Variables extends RequestParameters {
    owner: string;
    name: string;
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
        repositoryIdentifiers: string[] // get list of repository names, not map
    ): Promise<Map<string, string[]>> {
        const repoLanguageInformation = new Map<string, string[]>();

        for (const repoIdentifier of repositoryIdentifiers) {
            const languages = await this.fetchLanguagesForSingleRepo(token, repoIdentifier);

            repoLanguageInformation.set(repoIdentifier, languages);
        }

        return repoLanguageInformation;
    }

    public extractLanguagesArray(repositoryLanguageAndOwnerWithName: unknown): string[] {
        // repositoryLanguageAndOwnerWithName.forEach((repository
        console.log('line 84', repositoryLanguageAndOwnerWithName);

        return [];
    }

    public extractOwnerAndRepoName(repoIdentifier: string): RepositoryContributorInfo {
        const ownerAndRepo = repoIdentifier.split('/');
        const owner = ownerAndRepo[0];
        const name = ownerAndRepo[1];
        const contributorOwnerAndRepo: RepositoryContributorInfo = { owner, name };

        return contributorOwnerAndRepo;
    }

    public async fetchLanguagesForSingleRepo(
        token: string,
        repoIdentifier: string
    ): Promise<string[]> {
        const graphqlWithAuth = graphql.defaults({
            headers: { authorization: `token ${token}` },
        });

        const ownerAndRepoName = this.extractOwnerAndRepoName(repoIdentifier);

        const owner = ownerAndRepoName.owner;
        const name = ownerAndRepoName.name;

        const variables: Variables = { owner, name };

        const response: GraphQlQueryResponseData = await graphqlWithAuth(queryTemplate, variables);

        const result: LanguageNode[] = response.repository.languages.edges;
        console.log(result, 'line 105');

        // conversion between nodes and edges into an array of strings
        // const languages = this.extractLanguagesArray(repositoryLanguageAndOwnerWithName)

        return [];
    }
}
