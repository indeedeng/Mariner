import { Config } from './config';
import { Contributor, ContributorFetcher } from './contributorFetcher';

// query WIP:
const queryTemplate = `query ($login: String!) {
  user(login: $login) {
    ... on Sponsorable {
      sponsors(first: 10) {
        totalCount
        nodes {
          ... on User { login, name, url  }
          ... on Organization { login, name, url }
        }
      }
    }
  }
}`;

export class SponsorabilityFetcher {
    private readonly config: Config;

    public constructor(config: Config) {
        this.config = config;
    }

    public async fetchSponsorabilityInformation(
        token: string,
        fileDir: string
    ): Promise<Contributor[]> {
        const fetchSponsorableContributors = new ContributorFetcher(this.config);
        const allContributors = fetchSponsorableContributors.fetchContributors(token, fileDir);
        console.log(allContributors);

        return allContributors;
    }
}
