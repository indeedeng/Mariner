import { Config } from './config';
import { RequestParameters } from '@octokit/graphql/dist-types/types';
import { User } from './sponsorabilityFetcher';

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
    public async fetchSponsorableRepoInfo(token: string, allUsers: User[]): Promise<any> {
        // create a loop through allUsers..
        const repoNameAndLanguages: User[] = [];
        allUsers.forEach(async (user) => {
            const variables: Variables = { userLogin: user.login };
            const sponsorable = await this.fetchRepos(token, queryTemplate, variables);
            repoNameAndLanguages.push(sponsorable); // temporary
        });

        return repoNameAndLanguages;
    }

    public async fetchRepos(
        token: string,
        query: string,
        variables: Variables

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): Promise<any> {
        // get repos;
        console.log(token.length, query.length, variables.userLogin);
    }
    //To-do:
    /*
    . add repo fetcher functions
    . added types/interfaces
    . fix contributorFetcher.ts file - may need support
    */
}
