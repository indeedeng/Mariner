import { Config } from './config';
import { ContributionCountOfUserIntoRepo, ContributorFetcher } from './contributorFetcher';
import {
    SponsorableContributorsInformationFetcher,
    Sponsor,
} from './sponsorableContributorsInformationFetcher';
// import { ReposFetcher } from './reposFetcher';
// import { createTsv } from './createTsv';

export interface SponsorRepoContributionHistory {
    type: string; // may not be needed here after sorting in Node
    repoIdentifier: string;
    email?: string;
    login: string;
    sponsorListingName: string;
    sponsorsLink: string;
    contributionsCount: number;
}

// interface Organization {
//     type: string;
//     login: string;
//     url: string;
//     sponsorListingName: string;
// }

// interface Response {
//     search: Sponsorable;
// }

// query WIP: fetchiing first 10 sponsors, need to add pagination
const queryTemplate = `query fetchSponsorable($queryString: String!) {
  search(query: $queryString, type: USER, first: 10) {
    nodes {
      ... on User {
        __typename
        email
        login
        url
        sponsorsListing {
          name
          dashboardUrl
        }
      }
        ... on Organization {
        __typename
        login
        url
        sponsorsListing {
          name
          dashboardUrl
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
        repositoryIdentifiers: string[]
    ): Promise<SponsorRepoContributionHistory[]> {
        const fetchAllContributors = new ContributorFetcher(this.config);
        const fetchSponsorableContributors = new SponsorableContributorsInformationFetcher(
            this.config
        );

        const allContributorHistorys = await fetchAllContributors.fetchContributorsByRepoName(
            token,
            repositoryIdentifiers
        );

        const sponsorable =
            await fetchSponsorableContributors.fetchSponsorableContributorsInformation(
                token,
                queryTemplate,
                allContributorHistorys
            );

        let allSponsorableUsers: SponsorRepoContributionHistory[] = [];

        allContributorHistorys.forEach((ContributionCountOfUser) => {
            allSponsorableUsers = this.convertSponsorableToUsersWithContributionCount(
                sponsorable,
                ContributionCountOfUser
            );
        });

        // const allSponsorableUsers = this.convertToUsers(sponsorable, allContributorHistorys);

        // createTsv(allRepos);
        //

        return allSponsorableUsers;
    }

    public fetchContributionCountOfUserAndRepo(
        userLogin: string,
        contributors: ContributionCountOfUserIntoRepo[]
    ): [number, string] {
        const contributionsAndRepoIds: [number, string] = [0, '']; // Tuples

        contributors.forEach((contributor) => {
            if (userLogin === contributor.login) {
                contributionsAndRepoIds[0] = contributor.contributions;
                contributionsAndRepoIds[1] = contributor.repoIdentifier;
            }
        });

        return contributionsAndRepoIds;
    }

    public convertSponsorableToUsersWithContributionCount(
        sponsorableContributor: Sponsor[],
        contributors: ContributionCountOfUserIntoRepo[]
    ): SponsorRepoContributionHistory[] {
        const allUsers = sponsorableContributor.map((sponsorable) => {
            const contributionAndRepoId = this.fetchContributionCountOfUserAndRepo(
                sponsorable.login,
                contributors
            );
            const contributionsCount = contributionAndRepoId[0];
            const repoIdentifier = contributionAndRepoId[1];

            return {
                type: sponsorable.__typename,
                repoIdentifier: repoIdentifier ?? '',
                email: sponsorable.email ?? '',
                login: sponsorable.login,
                url: `https://github.com/${sponsorable.login}`,
                sponsorListingName: sponsorable.sponsorsListing.name ?? '',
                sponsorsLink: sponsorable.sponsorsListing.dashboard ?? '',
                contributionsCount: contributionsCount ?? 0,
            };
        });

        return allUsers;
    }
}

//   public filterUserAndOrganization(sponsorable: Node[]): any {
//         sponsorable.forEach((data) => {
//             console.log(data.__typename);
//         });
//     }

// deall with orgs later
// if (sponsorable.sponsorListing !== null && sponsorable.__typename === 'Organization') {
//     const organization: Organization = {
//         type: sponsorable.__typename,
//         login: sponsorable.login,
//         url: sponsorable.url,
//         sponsorListingName: sponsorable.sponsorListing.name,
//     };

//     return organization;
// }
// /
//     public filterOutDependabots(githubContributors: GitHubContributor[]): GitHubContributor[] {
//         const result = githubContributors.filter(
//             (userLogin) => userLogin.login !== 'dependabot[bot]'
//         );

//         return result;
//     }
