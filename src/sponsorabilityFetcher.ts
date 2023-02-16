import { Config } from './config';
import { Octokit } from '@octokit/rest'; // OctokitResponse

import fs from 'fs';

export type RepositoryContributorInfo = {
    owner: string;
    repo: string;
};
export type Contributor = {
    login: string;
    url: string;
    contributions: number;
};
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

export class SponsorabilityFetcher {
    private readonly config: Config;

    public constructor(config: Config) {
        this.config = config;
    }

    public async fetchSponsorables(token: string): Promise<Contributor[]> {
        const fileDir = './examples/exampleData.json';
        const dependencies = this.readJsonFile(fileDir);

        const ownerAndRepos = this.extractContributorsOwnerAndRepo(dependencies);

        const githubContributors: GitHubContributor[] = await this.fetchContributors(
            token,
            ownerAndRepos
        );

        const contributors = this.convertToContributors(githubContributors);
        console.log('Returning contributors: ', contributors.length);

        return contributors;
    }

    public convertToContributors(githubContributor: GitHubContributor[]): Contributor[] {
        return githubContributor.map((contributor) => {
            return {
                login: contributor.login ?? '',
                url: contributor.html_url ?? '',
                contributions: contributor.contributions ?? -1,
            };
        });
    }

    public extractContributorsOwnerAndRepo(dependencies: string[]): RepositoryContributorInfo[] {
        const contributorsInformation = Object.keys(dependencies);

        return contributorsInformation.map((contributorInfo) => {
            const ownerAndRepo = contributorInfo.split('/');
            const owner = ownerAndRepo[0];
            const repo = ownerAndRepo[1];
            const contributorOwnerAndRepo: RepositoryContributorInfo = { owner, repo };

            return contributorOwnerAndRepo;
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public readJsonFile(fileDir: string): any {
        if (fs.existsSync(fileDir)) {
            try {
                const data = fs.readFileSync(fileDir, { encoding: 'utf8' });
                const contributors = JSON.parse(data);

                return contributors;
            } catch (err) {
                console.log('Error parsing JSON string');
            }
        }
        throw new Error(`Can't find data in file directory: ${fileDir}`);
    }

    public async fetchContributors(
        token: string,
        ownerAndRepo: RepositoryContributorInfo[]
    ): Promise<GitHubContributor[]> {
        const octokit = new Octokit({
            auth: token,
        });

        const contributors: GitHubContributor[] = [];
        const promises = ownerAndRepo.map(async (contributor) => {
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

            contributors.push(...response.data); // optimize later
        });

        await Promise.all(promises);

        return contributors;
    }
}

// export interface Contributor {
//     login: string;
//     id: number;
//     node_id: string;
//     avatar_url: string;
//     gravatar_id: string;
//     url: string;
//     html_url: string;
//     followers_url: string;
//     following_url: string;
//     gists_url: string;
//     starred_url: string;
//     subscriptions_url: string;
//     organizations_url: string;
//     repos_url: string;
//     events_url: string;
//     received_events_url: string;
//     type: string;
//     site_admin: boolean;
//     contributions: number;
// }

// export type RepoName = string;
// export type ContributorsByRepoName = Map<RepoName, Contributor[]>;
