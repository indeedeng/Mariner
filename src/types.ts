export type RepositoryContributorInfo = {
    owner: string;
    repo: string;
};
export interface ContributionCountOfUserIntoRepo {
    repoIdentifier: string;
    login: string;
    contributions: number;
}

export type ContributorsByRepoName = Map<string, ContributionCountOfUserIntoRepo[]>;

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

export interface Sponsorable {
    __typename: string;
    email?: string;
    login: string;
    url: string;
    sponsorsListing: {
        name: string | null;
        dashboard: string | null;
    };
}
