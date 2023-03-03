import { Config } from './config';
import { Octokit } from '@octokit/rest'; // OctokitResponse

export type RepositoryContributorInfo = {
    owner: string;
    repo: string;
};
export interface Contributor {
    repoIdentifier: string;
    login: string;
    url: string;
    contributions: number;
}
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

export type RepositoryName = string;

export type contributorsByRepoName = Map<RepositoryName, GitHubContributor[]>;

export class ContributorFetcher {
    private readonly config: Config;

    public constructor(config: Config) {
        this.config = config;
    }

    public async fetchContributors(
        token: string,
        repositoryIdentifiers: string[]
    ): Promise<Contributor[]> {
        const ownerAndRepos = this.extractContributorsOwnerAndRepo(repositoryIdentifiers);

        const githubContributors = await this.fetchGitHubContributors(token, ownerAndRepos);

        const contributorsWithRepoIdentifier = [];

        for (const [index, ghContributor] of githubContributors.entries()) {
            const repoIdentifier = index;
            const filteredGitHubContributors = this.filterOutDependabots(ghContributor);
            const allContributors = await this.convertToContributor(
                filteredGitHubContributors,
                repoIdentifier
            );

            contributorsWithRepoIdentifier.push(...allContributors);
        }

        return contributorsWithRepoIdentifier;
    }
    public filterOutDependabots(githubContributors: GitHubContributor[]): GitHubContributor[] {
        const result = githubContributors.filter(
            (userLogin) => userLogin.login !== 'dependabot[bot]'
        );

        return result;
    }

    public async convertToContributor(
        githubContributor: GitHubContributor[],
        repoIdentifier: string
    ): Promise<Contributor[]> {
        return githubContributor.map((ghContributor) => {
            return {
                repoIdentifier,
                login: ghContributor.login ?? '',
                url: ghContributor.html_url ?? '',
                contributions: ghContributor.contributions ?? -1,
            };
        });
    }

    public extractContributorsOwnerAndRepo(
        repositoryIdentifiers: string[]
    ): RepositoryContributorInfo[] {
        const contributorsInformation = Object.values(repositoryIdentifiers);

        return contributorsInformation.map((contributorInfo) => {
            const ownerAndRepo = contributorInfo.split('/');
            const owner = ownerAndRepo[0];
            const repo = ownerAndRepo[1];
            const contributorOwnerAndRepo: RepositoryContributorInfo = { owner, repo };

            return contributorOwnerAndRepo;
        });
    }

    public async fetchGitHubContributors(
        token: string,
        ownerAndRepos: RepositoryContributorInfo[]
    ): Promise<Map<RepositoryName, GitHubContributor[]>> {
        const octokit = new Octokit({
            auth: token,
        });

        const gitHubContributorsByRepoName = new Map<RepositoryName, GitHubContributor[]>();

        for (const contributor of ownerAndRepos.values()) {
            const fullRepoIdentifier = {
                owner: contributor.owner,
                repo: contributor.repo,
            };

            const response = await octokit.repos?.listContributors(fullRepoIdentifier);

            if (response.status !== 200) {
                throw new Error(`Could not retrieve repositories for ${contributor}`);
            }

            if (!response.data) {
                throw new Error(`No data for ${contributor}`);
            }
            const ownerRepo = `${fullRepoIdentifier.owner}/${fullRepoIdentifier.repo}`;

            gitHubContributorsByRepoName.set(ownerRepo, response.data);
        }

        return gitHubContributorsByRepoName;
    }
}
