import { Config } from './config';

const queryTemplate = `
query fetchRepos($userLogins: String!) {
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

export class ReposFetcher {
    private readonly config: Config;

    public constructor(config: Config) {
        this.config = config;
    }
    //To-do:
    /*
    1. figure out query
    2. add repo fetcher functions
    3. added types/interfaces
    4. fix contributorFetcher.ts file - may need support
    */
}
