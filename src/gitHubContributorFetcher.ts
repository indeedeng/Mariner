import { Octokit } from '@octokit/rest';

export interface GitHubContributor {
    login?: string;
    id?: number;
    node_id?: string;
    avatar_url?: string;
    gravatar_id?: string | null;
    url?: string;
    html_url?: string;
    followers_url?: string;
    following_url?: string;
    gists_url?: string;
    starred_url?: string;
    subscriptions_url?: string;
    organizations_url?: string;
    repos_url?: string;
    events_url?: string;
    received_events_url?: string;
    type: string;
    site_admin?: boolean;
    contributions: number;
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
