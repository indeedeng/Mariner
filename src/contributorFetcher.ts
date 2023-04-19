import { Config } from './config';
// import { Octokit } from '@octokit/rest';

export interface GitHubContributor {
    login?: string | undefined;
    id?: number | undefined;
    node_id?: string | undefined;
    avatar_url?: string | undefined;
    gravatar_id?: string | null | undefined;
    url?: string | undefined;
    html_url?: string | undefined;
    followers_url?: string | undefined;
    following_url?: string | undefined;
    gists_url?: string | undefined;
    starred_url?: string | undefined;
    subscriptions_url?: string | undefined;
    organizations_url?: string | undefined;
    repos_url?: string | undefined;
    events_url?: string | undefined;
    received_events_url?: string | undefined;
    type?: string | undefined;
    site_admin?: boolean | undefined;
    contributions?: number | undefined;
}

export type RepoOwnerAndName = {
    owner: string;
    repo: string;
};

export class ContributorFetcher {
    private readonly config: Config;

    public constructor(config: Config) {
        this.config = config;
    }

    public async fetchContributorsByRepoName(
        token: string,
        repositoryIdentifiers: string[]
    ): Promise<string[]> {
        const ownerAndRepo = this.extractOwnerAndRepoNames(repositoryIdentifiers);

        console.log(ownerAndRepo);

        return [];
    }

    public extractOwnerAndRepoNames(repositoryIdentifiers: string[]): RepoOwnerAndName[] {
        return repositoryIdentifiers.map((contributorInfo) => {
            const ownerAndRepo = contributorInfo.split('/');
            const owner = ownerAndRepo[0];
            const repo = ownerAndRepo[1];
            const contributorOwnerAndRepo: RepoOwnerAndName = { owner, repo };

            return contributorOwnerAndRepo;
        });
    }
}
