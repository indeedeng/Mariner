import { Config } from './config';
import { Octokit } from '@octokit/rest'; // OctokitResponse

export type RepositoryContributorInfo = {
    owner: string;
    repo: string;
};
export type Contributor = {
    // repo information
    login: string;
    url: string;
    contributions: number;
};

// export interface Response {
//     status: 200;
//     url: string;
//     headers: {
//         connection: string;
//         date: string;
//         etag: string;
//         server: string;
//         vary: string;
//     };
//     data: [GitHubContributor];
// }
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

export type contributorsByRepoName = Map<RepositoryName, Contributor[]>;

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
        console.log(githubContributors);

        // const filteredContributors = this.filterOutDependabots(githubContributors); // remove dependabot

        // const contributors = this.convertToContributors(filteredContributors);
        const contributors: Contributor[] = [{ login: 'la', url: '', contributions: 2 }];

        return contributors;
    }

    // public filterOutDependabots(githubContributors: Map<string, GitHubContributor[]>[]): void {
    //Map<string, GitHubContributor[]>
    // githubContributors.forEach((values, key) => {
    //     for (const [index, value] of values.entries()) {
    //         console.log(key, index, value);
    //         for (const userLogin of value) {
    //            userLogin.login !== 'dependabot[bot]'
    //         }
    //     }
    // });
    // const result = githubContributors.filter(
    //     (userLogin) => userLogin.login !== 'dependabot[bot]'
    // );
    // return result;
    // }

    public convertToContributors(githubContributor: GitHubContributor[]): Contributor[] {
        return githubContributor.map((contributor) => {
            return {
                login: contributor.login ?? '',
                url: contributor.html_url ?? '',
                contributions: contributor.contributions ?? -1,
                // repo:
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
