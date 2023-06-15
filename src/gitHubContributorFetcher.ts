import { Octokit } from '@octokit/rest';

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

export interface Contributor {
    login: string;
    contributionsCount: number;
}

export class GitHubContributorFetcher {
    private readonly token: string;

    public constructor(token: string) {
        this.token = token;
    }

    public async fetchContributorsForMultipleRepos(
        repositoryIdentifiers: string[]
    ): Promise<Map<string, Contributor[]>> {
        const gitHubContributorsByRepoName = new Map<string, Contributor[]>();

        for (const id of repositoryIdentifiers) {
            const ownerAndRepoName = this.extractOwnerAndRepoName(id);

            const githubContributorLogins = await this.fetchRawContributorsForRepo(
                ownerAndRepoName
            );

            const contributorLogins = this.convertToContributors(githubContributorLogins);

            gitHubContributorsByRepoName.set(id, contributorLogins);
        }

        return gitHubContributorsByRepoName;
    }

    public extractOwnerAndRepoName(repositoryIdentifiers: string): RepoOwnerAndName {
        const ownerAndRepo = repositoryIdentifiers.split('/');
        if (ownerAndRepo.length < 2) {
            throw new Error(`Could not split() ${repositoryIdentifiers}`);
        }

        const owner = ownerAndRepo[0];
        const repo = ownerAndRepo[1];
        const contributorOwnerAndRepo: RepoOwnerAndName = { owner, repo };

        return contributorOwnerAndRepo;
    }

    public convertToContributors(githubContributors: GitHubContributor[]): Contributor[] {
        return githubContributors.map((contributor) => {
            return {
                login: contributor.login ?? '',
                contributionsCount: contributor.contributions ?? -1,
            };
        });
    }

    public async fetchRawContributorsForRepo(
        ownerAndRepoName: RepoOwnerAndName
    ): Promise<GitHubContributor[]> {
        const octokit = new Octokit({
            auth: this.token,
        });
        const response = await octokit.repos?.listContributors({
            owner: ownerAndRepoName.owner,
            repo: ownerAndRepoName.repo,
        });

        if (response.status !== 200) {
            throw new Error(`Could not retrieve repositories for ${ownerAndRepoName}`);
        }

        if (!response.data) {
            throw new Error(`No data for ${ownerAndRepoName}`);
        }

        return response.data;
    }
}
