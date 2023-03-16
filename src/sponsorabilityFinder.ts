import { Config } from './config';
import {
    ContributionCountOfUserIntoRepo,
    ContributorFetcher as ContributorHistoryFetcher,
} from './contributorFetcher';
import {
    SponsorableContributorsFetcher,
    Sponsorable,
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
        const contributorHistoryFetcher = new ContributorHistoryFetcher(this.config);
        const sponsorableContributorsFetcher = new SponsorableContributorsFetcher(this.config);

        const allContributorHistorys = await contributorHistoryFetcher.fetchContributorsByRepoName(
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

        const countsForAllLanguages = this.contributionCountsByReponame(
            repositoryLanguages,
            sponsorableContributorWithContributonCounts
        );

        console.log(countsForAllLanguages, 'language count');

        return allContributorHistorys;
    }

    public extractContributionCountsOfAllSponsorableUsers(
        sponsorables: Map<string, Sponsorable[]>,
        allContributorHistorys: Map<string, ContributionCountOfUserIntoRepo[]>
    ): Map<string, SponsorableWithContributionCount[]> {
        const withContributionCounts = new Map<
            OwnerAndRepoName,
            SponsorableWithContributionCount[]
        >();

        let withCountsAndRepoID: {
            repoId: string;
            contributor: SponsorableWithContributionCount;
        }[];

        for (const [key, contributionCountOfUser] of allContributorHistorys) {
            withCountsAndRepoID = this.countSponsorableContributionsByRepo(
                sponsorables,
                contributionCountOfUser
            );

            const storeSponsorableContributors: SponsorableWithContributionCount[] = [];
            withCountsAndRepoID.forEach((objectWithContributorData) => {
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

    /// flagging it to discuss during pairing session
    public countSponsorableContributionsByRepo(
        sponsorablesByReponame: Map<string, Sponsorable[]>,
        contributionCounts: ContributionCountOfUserIntoRepo[]
    ): {
        repoId: string;
        contributor: SponsorableWithContributionCount;
    }[] {
        const allSponsorableWithCount: {
            repoId: string;
            contributor: SponsorableWithContributionCount;
        }[] = [];

        for (const [repoId, sponsorables] of sponsorablesByReponame) {
            sponsorables.forEach((sponsorable) => {
                const contributionsCount = this.getContributionCountOfUser(
                    sponsorable.login,
                    contributionCounts
                );

                const withContributionCount: SponsorableWithContributionCount =
                    this.convertToSponsorableWithCounts(sponsorable, contributionsCount);

                allSponsorableWithCount.push({ repoId, contributor: withContributionCount });
            });
        }

        return allSponsorableWithCount;
    }

    public convertToSponsorableWithCounts(
        sponsorable: Sponsorable,
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
    // countLanguagesForEachContribution;
    public contributionCountsByReponame(
        repoLanguages: Map<string, Languages[]>,
        sponsorableWithContributions: Map<string, SponsorableWithContributionCount[]>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): any {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const languageCountByRepo: any = {};
        for (const [key, sponsorWithCounts] of sponsorableWithContributions) {
            if (repoLanguages.has(key)) {
                sponsorWithCounts.forEach((userContribution) => {
                    if (userContribution.contributionsCount > 0) {
                        if (!(key in languageCountByRepo)) {
                            languageCountByRepo[key] = 0;
                        }
                        languageCountByRepo[key] += 1;
                    } // output:  { 'pypa/pipenv': 5, 'indeedeng/util': 1 }
                });
            }
        }

        const languageCounts = this.languagesCount(repoLanguages, languageCountByRepo);

        return languageCounts;
    }

    public languagesCount(
        repoLanguages: Map<string, Languages[]>,
        languageCountByRepo: object
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): any {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const languageCountarrs: any = [];

        const newArray = Object.entries(languageCountByRepo);
        const countMap = new Map(newArray);

        repoLanguages.forEach((languages, languagesRepoID) => {
            for (const language of languages) {
                countMap.forEach((contributionCount, idx) => {
                    if (languagesRepoID === idx) {
                        // console.log(language.name, languagesRepoID);
                        if (!(idx in languageCountarrs)) {
                            languageCountarrs[language.name] = contributionCount;
                        }
                    }
                });
            }
        });
        console.log(languageCountarrs);
        // WIP need to debug why it returns one array instead of two, per key
        // output = [
        //   Python: 5,
        //   Roff: 5,
        //   Shell: 5,
        //   Batchfile: 5,
        //   Makefile: 1,
        //   Java: 1,
        //   C: 1,
        //   FreeMarker: 1
        // ]

        // expected:
        // array 1 =>
        //[
        //   Python: 5,
        //   Roff: 5,
        //   Shell: 5,
        //   Batchfile: 5,
        //]
        // array 2 =>
        //[
        //   Makefile: 1,
        //   Java: 1,
        //   C: 1,
        //   FreeMarker: 1
        // ]
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
