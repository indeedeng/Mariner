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
    ): Promise<Map<string, ContributionCountOfUserIntoRepo[]>> {
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

        const sponsorableContributorWithContributonCounts =
            this.extractContributionCountsOfAllSponsorableUsers(
                sponsorables,
                allContributorHistorys
            );

        const repositoryFetcher = new RepoLanguagesFetcher(this.config);
        const repositoryLanguages = await repositoryFetcher.fetchAllRepositoryLanguages(
            token,
            repositoryIdentifiers
        );

        const countsForAllLanguages = this.countLanguagesForEachContribution(
            repositoryLanguages,
            sponsorableContributorWithContributonCounts
        );

        console.log(countsForAllLanguages, 'language count');

        return allContributorHistorys;
    }

    public extractContributionCountsOfAllSponsorableUsers(
        sponsorables: Map<string, Sponsor[]>,
        allContributorHistorys: Map<string, ContributionCountOfUserIntoRepo[]>
    ): Map<string, SponsorableWithContributionCount[]> {
        const withContributionCounts = new Map<
            OwnerAndRepoName,
            SponsorableWithContributionCount[]
        >();

        let withCounts: {
            repoId: string;
            contributor: SponsorableWithContributionCount;
        }[];

        for (const [key, contributionCountOfUser] of allContributorHistorys) {
            withCounts = this.addContributionCount(sponsorables, contributionCountOfUser);

            const storeSponsorableContributors: SponsorableWithContributionCount[] = [];
            withCounts.forEach((objectWithContributorData) => {
                if (key === objectWithContributorData.repoId) {
                    storeSponsorableContributors.push(...[objectWithContributorData.contributor]);
                    withContributionCounts.set(
                        objectWithContributorData.repoId,
                        storeSponsorableContributors
                    );
                }
            });
        }

        return withContributionCounts;
    }

    public addContributionCount(
        sponsorableContributor: Map<string, Sponsor[]>,
        contributors: ContributionCountOfUserIntoRepo[]
    ): {
        repoId: string;
        contributor: SponsorableWithContributionCount;
    }[] {
        const allSponsorableWithCount: {
            repoId: string;
            contributor: SponsorableWithContributionCount;
        }[] = [];

        for (const [key, sponsors] of sponsorableContributor) {
            sponsors.forEach((sponsorable) => {
                const contributionsCount = this.getContributionCountOfUser(
                    sponsorable.login,
                    contributors
                );

                const withContributionCount: SponsorableWithContributionCount =
                    this.convertToSponsorableWithCounts(sponsorable, contributionsCount);

                allSponsorableWithCount.push({ repoId: key, contributor: withContributionCount });
            });
        }

        return allSponsorableWithCount;
    }

    public convertToSponsorableWithCounts(
        sponsorable: Sponsor,
        contributionsCount: number
    ): SponsorableWithContributionCount {
        const withContributionCount: SponsorableWithContributionCount = {
            type: sponsorable.__typename,
            email: sponsorable.email ?? '',
            login: sponsorable.login,
            url: `https://github.com/${sponsorable.login}`,
            sponsorListingName: sponsorable.sponsorsListing.name ?? '',
            sponsorsLink: sponsorable.sponsorsListing.dashboard ?? '',
            contributionsCount: contributionsCount ?? 0,
        };

        return withContributionCount;
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
            }

            console.log(languageCountByRepo, 'contribution count by repo');
            // output { 'pypa/pipenv': 5, 'indeedeng/util': 1 }
        }

        const languageCountarrs: any = [];

        repoLanguages.forEach((languages, repoID) => {
            const newArray = Object.entries(languageCountByRepo);
            const countMap = new Map(newArray);

            countMap.forEach((contributionCount, idx) => {
                // console.log(idx);
                if (repoID === idx) {
                    for (const language of languages) {
                        // console.log(language, repoID);

                        if (!(idx in languageCountarrs)) {
                            languageCountarrs[language.name] = contributionCount;
                        }
                    }

                    // console.log(contributionCount);
                    // console.log(repoID, ' this is repo ID');
                }
            });
        });
        console.log(languageCountarrs);
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
