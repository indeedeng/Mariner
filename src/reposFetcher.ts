import { Config } from './config';
import { GraphQlQueryResponseData, RequestParameters } from '@octokit/graphql/dist-types/types';
import { graphql } from '@octokit/graphql';

export type RepositoryContributorInfo = {
    owner: string;
    name: string;
};

interface GitHubLanguageNode {
    node: {
        name: string;
    };
}

export interface Languages {
    name: string;
}

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

export class RepoLanguagesFetcher {
    private readonly config: Config;

    public constructor(config: Config) {
        this.config = config;
    }

    public async fetchAllRepositoryLanguages(
        token: string,
        repositoryIdentifiers: string[]
    ): Promise<Map<string, Languages[]>> {
        const repoLanguageByRepoIdentifier = new Map<string, Languages[]>();

        for (const repoIdentifier of repositoryIdentifiers) {
            const languages = await this.fetchLanguagesForSingleRepo(token, repoIdentifier);

            repoLanguageByRepoIdentifier.set(repoIdentifier, languages);
        }

        return repoLanguageByRepoIdentifier;
    }

    public extractOwnerAndRepoName(repoIdentifier: string): RepositoryContributorInfo {
        const ownerAndRepo = repoIdentifier.split('/');
        const owner = ownerAndRepo[0];
        const name = ownerAndRepo[1];
        const contributorOwnerAndRepo: RepositoryContributorInfo = { owner, name };

        return contributorOwnerAndRepo;
    }

    public extractLanguagesArray(repositoryLanguages: GitHubLanguageNode[]): Languages[] {
        const languages = repositoryLanguages.map((languageName) => {
            return {
                name: languageName.node.name,
            };
        });

        return languages;
    }

    public async fetchLanguagesForSingleRepo(
        token: string,
        repoIdentifier: string
    ): Promise<Languages[]> {
        const graphqlWithAuth = graphql.defaults({
            headers: { authorization: `token ${token}` },
        });

        const ownerAndRepoName = this.extractOwnerAndRepoName(repoIdentifier);

        const owner = ownerAndRepoName.owner;
        const name = ownerAndRepoName.name;
        const variables: Variables = { owner, name };

        const response: GraphQlQueryResponseData = await graphqlWithAuth(queryTemplate, variables);
        const result = response.repository.languages.edges as GitHubLanguageNode[];

        const languages = this.extractLanguagesArray(result);

        return languages;
    }
}
