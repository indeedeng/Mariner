import { Config } from './config';
import { GraphQlQueryResponseData, RequestParameters } from '@octokit/graphql/dist-types/types';
import { User } from './sponsorabilityFetcher';
import { graphql } from '@octokit/graphql';

interface Response {
    search: Repos;
}
interface Repos {
    nodes: Node[];
}

interface Node {
    repositoryName: string;
    languages: { edges: Languages[] };
}

interface Languages {
    node: {
        name: string;
    };
}

const queryTemplate = `query fetchRepoInfo($login: String!) {
  search(query: $login, type: REPOSITORY, first: 10) {
    nodes {
      ... on Repository {
        name
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
    login: string;
}

export class ReposFetcher {
    private readonly config: Config;

    public constructor(config: Config) {
        this.config = config;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async fetchSponsorableRepoInfo(token: string, allUsers: User[]): Promise<any> {
        const repoNameAndLanguages: User[] = [];
        allUsers.forEach(async (user) => {
            // console.log(`Line 39: ${user.login[10]}`);
            const login = user.login;

            const variables: Variables = { login };
            const sponsorable = await this.fetchRepos(token, variables, queryTemplate);
            repoNameAndLanguages.push(sponsorable); // temporary
        });

        return repoNameAndLanguages;
    }

    public async fetchRepos(
        token: string,
        variables: Variables,
        query: string

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): Promise<any> {
        const graphqlWithAuth = graphql.defaults({
            headers: { authorization: `token ${token}` },
        });

        const response: GraphQlQueryResponseData = await graphqlWithAuth(query, variables);

        const result: Response = response.search;
        console.log(`fetchRepos function line 61: ${JSON.stringify(result, null, 2)}`);

        return result;
    }
    //To-do:
    /*
    . added types/interfaces - test them
    . add function
    */
}
