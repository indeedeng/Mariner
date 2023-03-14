import { Config } from './config';
import { Octokit } from '@octokit/rest';

export type RepositoryContributorInfo = {
    owner: string;
    repo: string;
};
export interface ContributionCountOfUserIntoRepo {
    repoIdentifier: string;
    login: string;
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

export type githubContributorsByRepoName = Map<RepositoryName, GitHubContributor[]>;
export type contributorsByRepoName = Map<RepositoryName, ContributionCountOfUserIntoRepo[]>;

export class ContributorFetcher {
    private readonly config: Config;

    public constructor(config: Config) {
        this.config = config;
    }

    public async fetchContributorsByRepoName(
        token: string,
        repositoryIdentifiers: string[]
    ): Promise<Map<string, ContributionCountOfUserIntoRepo[]>> {
        const ownerAndRepos = this.extractOwnerAndRepoNames(repositoryIdentifiers);

        const gitHubContributorsByRepoName = await this.fetchGitHubContributorsByRepoName(
            token,
            ownerAndRepos
        );

        const contributionCountOfUserIntoRepos = [];
        const contributorsByRepoName = new Map<RepositoryName, ContributionCountOfUserIntoRepo[]>();

        for (const [index, ghContributor] of gitHubContributorsByRepoName.entries()) {
            const repoIdentifier = index;
            const allContributors = await this.convertToContributor(ghContributor, repoIdentifier);

            contributionCountOfUserIntoRepos.push(...allContributors);
            contributorsByRepoName.set(repoIdentifier, allContributors);
        }

        return contributorsByRepoName;
    }

    public async convertToContributor(
        githubContributors: GitHubContributor[],
        repoIdentifier: string
    ): Promise<ContributionCountOfUserIntoRepo[]> {
        return githubContributors.map((ghContributor) => {
            return {
                repoIdentifier,
                login: ghContributor.login ?? '',
                url: ghContributor.html_url ?? '',
                contributions: ghContributor.contributions ?? -1,
            };
        });
    }

    public extractOwnerAndRepoNames(repositoryIdentifiers: string[]): RepositoryContributorInfo[] {
        return repositoryIdentifiers.map((contributorInfo) => {
            const ownerAndRepo = contributorInfo.split('/');
            const owner = ownerAndRepo[0];
            const repo = ownerAndRepo[1];
            const contributorOwnerAndRepo: RepositoryContributorInfo = { owner, repo };

            return contributorOwnerAndRepo;
        });
    }

    public async fetchGitHubContributorsByRepoName(
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

/*
get a list of all the contributors by repoName
- After, I would need information on the languages of each sponsorableContributor contributed to
- const sponsorableRepoLanuageUsed = fetchLanguagesByRepositoryContribution()
*/
