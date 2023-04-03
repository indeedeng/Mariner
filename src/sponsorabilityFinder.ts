import { Config } from './config';

import {
    SponsorableContributorsFetcher,
    queryTemplate,
    GithubSponsorable,
} from './sponsorableContributorsFetcher';
import { Languages, RepoLanguagesFetcher } from './reposFetcher'; // Languages,
import {
    // ContributionCountOfUserIntoRepo,
    ContributorContributionCountsByRepoIdentifier,
    SponsorableWithListingNameAndLink,
    SponsorContributionHistory,
} from './types';
import { ContributorFetcher } from './contributorFetcher';

export class SponsorabilityFinder {
    private readonly config: Config;

    public constructor(config: Config) {
        this.config = config;
    }

    public async fetchSponsorabilityInformation(
        token: string,
        repositoryIdentifiers: string[]
    ): Promise<SponsorContributionHistory[]> {
        //SponsorWithRepoIdAndContribution
        const contributorHistoryFetcher = new ContributorFetcher(this.config);
        const sponsorableContributorsFetcher = new SponsorableContributorsFetcher(this.config);

        const allContributorHistorys = await contributorHistoryFetcher.fetchContributorsByRepoName(
            token,
            repositoryIdentifiers
        );

        const contributionCount = allContributorHistorys.values();
        const allContributors = [...contributionCount].flat();

        const sponsorables =
            await sponsorableContributorsFetcher.fetchSponsorableContributorsInformation(
                token,
                queryTemplate,
                allContributors
            );

        console.log(sponsorables);

        const sponsorablesWithListingAndLink =
            this.convertToSponsorablesWithListingAndLink(sponsorables);

        const repositoryFetcher = new RepoLanguagesFetcher(this.config);
        const repositoryLanguages = await repositoryFetcher.fetchAllRepositoryLanguages(
            token,
            repositoryIdentifiers
        );

        const contributorContributionCountsByRepoIdentifier =
            this.countSponsorablesContributionsByRepoId(
                sponsorablesWithListingAndLink,
                allContributorHistorys,
                repositoryLanguages
            );

        console.log(
            contributorContributionCountsByRepoIdentifier.values(),
            'line 70',
            contributorContributionCountsByRepoIdentifier.keys()
        );

        // const contributorContributionCountsByRepoIdentifier =
        //     this.extractContributionCountsOfAllSponsorableUsers(
        //         sponsorables,
        //         allContributorHistorys
        //     );

        // const countsForAllLanguages = this.contributionCountsByReponame(
        //     repositoryLanguages,
        //     contributorContributionCountsByRepoIdentifier
        // );

        console.log(repositoryLanguages, 'language count');
        console.log(sponsorablesWithListingAndLink.length);

        // need to convert everything and return SponsorContributionHistory[]
        return [];
    }

    public convertToSponsorablesWithListingAndLink(
        sponsorables: GithubSponsorable[]
    ): SponsorableWithListingNameAndLink[] {
        return sponsorables.map((sponsorable) => {
            return {
                type: sponsorable.__typename,
                email: sponsorable.email ?? '',
                login: sponsorable.login,
                url: `https://github.com/${sponsorable.login}`,
                sponsorListingName: sponsorable.sponsorsListing.name ?? '',
                sponsorsLink: sponsorable.sponsorsListing.dashboard ?? '',
            };
        });
    }

    public countSponsorablesContributionsByRepoId(
        sponsorablesByReponame: SponsorableWithListingNameAndLink[],
        contributorContributionByRepoIdentifier: ContributorContributionCountsByRepoIdentifier,
        repoLanguages: Map<string, Languages[]>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): any {
        const contributionCountsByContributor = new Map<string, number[]>();
        const countsOfContributions: number[] = [];
        let contributionsCount = 0;
        for (const sponsorables of sponsorablesByReponame) {
            // console.log(sponsorables);

            for (const [contributor, users] of contributorContributionByRepoIdentifier) {
                // const users = contributorContributionByRepoIdentifier.get(contributor);

                if (!users) {
                    throw new Error(`Error when accessing this user: ${users} login `);
                }

                // const a = this.getContributionCountOfUser(sponsorables.login, users);
                // countsOfContributions.push(a);
                // output:
                //   [[2699], [], [479], [], [430], [], [369], [], [15], [], [], [1]];

                for (const user of users) {
                    // let idx = users.indexOf(user);
                    if (sponsorables.login === user.login) {
                        contributionsCount = user.contributions;

                        countsOfContributions.push(contributionsCount);
                        // idx = users.indexOf(user, idx + 1);
                    }
                }

                if (repoLanguages.has(contributor)) {
                    console.log('do something'); //placeholder
                }
            }
        }

        console.log(contributionCountsByContributor);

        return contributionCountsByContributor;
    }
}
