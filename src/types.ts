export type RepoOwnerAndName = {
    owner: string;
    repo: string;
};
export interface ContributionCountOfUserIntoRepo {
    repoIdentifier: string; // delete or not?
    login: string;
    contributions: number;
}

export type ContributorContributionCountsByRepoIdentifier = Map<
    string,
    ContributionCountOfUserIntoRepo[]
>;

export type SponsorablesByRepoIdentifier = Map<string, SponsorableWithListingNameAndLink[]>; // not used yet

export interface SponsorableWithListingNameAndLink {
    type: string; // may not be needed here after sorting in Node
    email?: string;
    login: string;
    url: string;
    sponsorListingName: string;
    sponsorsLink: string;
}

export interface SponsorContributionHistory {
    login: string;
    email?: string;
    url: string;
    sponsorListingName: string;
    sponsorsLink: string;
    impactScore: string;
    contributionsCount: number;
    JavaScript: number;
    Java: number;
    Python: number;
    Go: number;
    Other: number;
}

export type LanguagesByRepoIdentifier = Map<string, string[]>;

// type RepoContributionsByContributor = Map<string, RepoContributions>;
// type ContributionCountsByRepo = Map<string, number>;

// repo names go to languages and add the counts and coutn the languages...
