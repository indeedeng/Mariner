import { Config } from './config';
import { ContributionCountOfUserIntoRepo, ContributorFetcher } from './contributorFetcher';
import {
    SponsorableContributorsFetcher,
    Sponsor,
    queryTemplate,
} from './sponsorableContributorsFetcher';
import { Languages, RepoLanguagesFetcher } from './reposFetcher';

// import { createTsv } from './createTsv';

export interface SponsorRepoContributionHistory {
    login: string;
    email?: string;
    url: string;
    sponsorListingName: string;
    sponsorsLink: string;
    // contributionsCount: number;
    // JavaScript: number;
    // Java: number;
    // Python: number;
    // Go: number;
    // Other: number;
}

export interface SponsorableWithContributionCount {
    type: string; // may not be needed here after sorting in Node
    // repoIdentifier: string;
    email?: string;
    login: string;
    url: string;
    sponsorListingName: string;
    sponsorsLink: string;
    contributionsCount: number;
}

export type OwnerAndRepoName = string;

// interface Organization {
//     type: string;
//     login: string;
//     url: string;
//     sponsorListingName: string;
// }

// interface Response {
//     search: Sponsorable;
// }

export class SponsorabilityFinder {
    private readonly config: Config;

    public constructor(config: Config) {
        this.config = config;
    }

    public async fetchSponsorabilityInformation(
        token: string,
        repositoryIdentifiers: string[]
    ): Promise<Map<string, SponsorableWithContributionCount[]>> {
        //SponsorWithRepoIdAndContribution
        const fetchAllContributors = new ContributorFetcher(this.config);
        const sponsorableContributorsFetcher = new SponsorableContributorsFetcher(this.config);

        const allContributorHistorys = await fetchAllContributors.fetchContributorsByRepoName(
            token,
            repositoryIdentifiers
        );

        const sponsorables =
            await sponsorableContributorsFetcher.fetchSponsorableContributorsInformation(
                token,
                queryTemplate,
                allContributorHistorys
            );

        // console.log(sponsorables, 'did it make it line 76');

        let allSponsorable: SponsorableWithContributionCount[] = [];
        const sponsorableContributorWithContributonCounts = new Map<
            OwnerAndRepoName,
            SponsorableWithContributionCount[]
        >();

        for (const [repositoryName, contributionCountOfUser] of allContributorHistorys) {
            allSponsorable = this.convertSponsorableToUsersWithContributionCount(
                sponsorables,
                contributionCountOfUser
            );

            sponsorableContributorWithContributonCounts.set(repositoryName, allSponsorable);
        }

        // console.log(sponsorableContributorWithContributonCounts);

        const repositoryFetcher = new RepoLanguagesFetcher(this.config);
        const repositoryLanguages = await repositoryFetcher.fetchAllRepositoryLanguages(
            token,
            repositoryIdentifiers
        );
        console.log('\ninside sponsorabilityFinder line 98: ', repositoryLanguages.size, '\n');

        const countsForAllLanguages = this.countLanguagesForEachContribution(
            repositoryLanguages,
            sponsorableContributorWithContributonCounts
        );

        console.log(countsForAllLanguages, 'language count');

        return sponsorableContributorWithContributonCounts;
    }

    /*

    for each repo count the number of contributions that were made,
    // incrementing language by only one per contributor
    */
    public countLanguagesForEachContribution(
        repoLanguages: Map<string, Languages[]>,
        sponsorableWithContributions: Map<string, SponsorableWithContributionCount[]>
    ): any {
        // let languagesKey;
        // const langs: { key: string; totalCounts: number }[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const languageCountByRepo: any = {};
        for (const [key, val] of sponsorableWithContributions) {
            if (repoLanguages.has(key)) {
                val.forEach((userContribution) => {
                    // console.log(element.contributionsCount, key);
                    if (userContribution.contributionsCount > 0) {
                        // langs.push({ key: key, totalCounts: element.contributionsCount });
                        if (!(key in languageCountByRepo)) {
                            languageCountByRepo[key] = 0;
                        }
                        languageCountByRepo[key] += 1;
                    }
                });

                repoLanguages.forEach((languages, repoID) => {
                    const newArray = Object.entries(languageCountByRepo);
                    const countMap = new Map(newArray);

                    countMap.forEach((contributionCount, idx) => {
                        console.log(idx);
                        if (repoID === idx) {
                            console.log('add count to each language here: ', languages);

                            // console.log(contributionCount);
                            // console.log(repoID, ' this is repo ID');
                        }
                    });
                });
            }

            // console.log(langs);
            console.log(languageCountByRepo, 'contribution count by repo');
            // output { 'pypa/pipenv': 5, 'indeedeng/util': 1 }
        }
    }

    public getContributionCountOfUser(
        userLogin: string,
        contributors: ContributionCountOfUserIntoRepo[]
    ): number {
        let contributionCounts = 0;

        contributors.forEach((contributor) => {
            if (userLogin === contributor.login) {
                contributionCounts = contributor.contributions;
            }
        });

        return contributionCounts;
    }

    public convertSponsorableToUsersWithContributionCount(
        sponsorableContributor: Map<string, Sponsor[]>,
        contributors: ContributionCountOfUserIntoRepo[]
    ): SponsorableWithContributionCount[] {
        const allSponsorable: Sponsor[][] = [];
        for (const [repoId, sponsors] of sponsorableContributor) {
            allSponsorable.push(sponsors);
        }

        const sponsors = allSponsorable.flat();

        const allUsers = sponsors.map((sponsorable) => {
            const contributionsCount = this.getContributionCountOfUser(
                sponsorable.login,
                contributors
            );

            return {
                type: sponsorable.__typename,
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

// public countLanguages(repo: string[]): string[] {
//     const a = repo.map((type) => {
//         let language = '';
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         const languages: any = {
//             java: function () {
//                 language = 'Java';
//             },
//             javascript: function () {
//                 language = 'Javascript';
//             },
//             python: function () {
//                 language = 'Python';
//             },
//             go: function () {
//                 language = 'Go';
//             },
//             default: function () {
//                 language = 'Other';
//             },
//         };
//         console.log(`the language for this repo is ${language}`);

//         return (languages[type] || languages.default)();
//     });

//     return a;
// }
