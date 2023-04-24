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
}

export class GitHubContributorFetcher {
    public async fetchContributors(
        token: string,
        repositoryIdentifiers: string[]
    ): Promise<Map<string, GitHubContributor[]>> {
        const ownerAndRepos = this.extractOwnerAndRepoNames(repositoryIdentifiers);

        const gitHubContributorsByRepoName = await this.fetchGitHubContributorsByRepoName(
            token,
            ownerAndRepos
        );

        return gitHubContributorsByRepoName;
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

    public async fetchGitHubContributorsByRepoName(
        token: string,
        ownerAndRepos: RepoOwnerAndName[]
    ): Promise<Map<string, GitHubContributor[]>> {
        const octokit = new Octokit({
            auth: token,
        });

        const gitHubContributorsByRepoName = new Map<string, GitHubContributor[]>();

        for (const ownerAndRepoName of ownerAndRepos.values()) {
            const repoIdentifier = {
                owner: ownerAndRepoName.owner,
                repo: ownerAndRepoName.repo,
            };

            const response = await octokit.repos?.listContributors(repoIdentifier);

            if (response.status !== 200) {
                throw new Error(`Could not retrieve repositories for ${ownerAndRepoName}`);
            }

            if (!response.data) {
                throw new Error(`No data for ${ownerAndRepoName}`);
            }
            const ownerRepo = `${repoIdentifier.owner}/${repoIdentifier.repo}`;

            gitHubContributorsByRepoName.set(ownerRepo, response.data);
        }

        return gitHubContributorsByRepoName;
    }
}
