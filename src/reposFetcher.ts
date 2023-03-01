import { Config } from './config';
import { RequestParameters } from '@octokit/graphql/dist-types/types';

const queryTemplate = `query fetchRepos($userLogins: String!) {
  search(query: $userLogins, type: REPOSITORY, first: 10) {
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
    userLogin: string;
}

export class ReposFetcher {
    private readonly config: Config;

    public constructor(config: Config) {
        this.config = config;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async fetchSponsorabilityInformation(token: string, allUsers: string[]): Promise<any> {
        // create a loop through allUsers..

        const variables: Variables = { userLogin: 'userLogin' };
        const sponsorable = await this.fetchContributorRepos(token, queryTemplate, variables);

        return sponsorable;
    }

    public async fetchContributorRepos(
        token: string,
        query: string,
        variables: Variables

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): Promise<any> {
        // get repos;
    }
    //To-do:
    /*
    . add repo fetcher functions
    . added types/interfaces
    . fix contributorFetcher.ts file - may need support
    */
}
