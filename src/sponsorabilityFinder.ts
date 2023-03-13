import { Config } from './config';
import { ContributionCountOfUserIntoRepo, ContributorFetcher } from './contributorFetcher';
import { SponsorableContributorsFetcher, Sponsor } from './sponsorableContributorsFetcher';
import { RepoLanguagesFetcher } from './reposFetcher';
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

export type RepositoryName = string;

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

export class SponsorabilityFinder {
    private readonly config: Config;

    public constructor(config: Config) {
        this.config = config;
    }

    public async fetchSponsorabilityInformation(
        token: string,
        repositoryIdentifiers: string[]
    ): Promise<Map<string, SponsorRepoContributionHistory[]>> {
        const fetchAllContributors = new ContributorFetcher(this.config);
        const sponsorableContributorsFetcher = new SponsorableContributorsFetcher(this.config);

        const allContributorHistorys = await fetchAllContributors.fetchContributorsByRepoName(
            token,
            repositoryIdentifiers
        );

        const sponsorable =
            await sponsorableContributorsFetcher.fetchSponsorableContributorsInformation(
                token,
                queryTemplate,
                allContributorHistorys
            );

        let allSponsorable: SponsorRepoContributionHistory[] = [];
        const sponsorMap = new Map<RepositoryName, SponsorRepoContributionHistory[]>();

        allContributorHistorys.forEach((contributionCountOfUser, index) => {
            const repositoryName = index;
            allSponsorable = this.convertSponsorableToUsersWithContributionCount(
                sponsorable,
                contributionCountOfUser
            );
            sponsorMap.set(repositoryName, allSponsorable);
        });

        const repositoryFetcher = new RepoLanguagesFetcher(this.config);
        const reposLanguageAndContributions = await repositoryFetcher.fetchAllReposLanguages(
            token,
            repositoryIdentifiers
        );
        console.log('\ninside sponsorabilityFinder line 98: ', reposLanguageAndContributions, '\n');

        return sponsorMap;
    }

    public getContributionCountOfUserAndRepo(
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
            const contributionAndRepoId = this.getContributionCountOfUserAndRepo(
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
