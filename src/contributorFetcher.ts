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

export class ContributorFetcher {
    private readonly config: Config;

    public constructor(config: Config) {
        this.config = config;
    }

    public async fetchContributors(token: string, fileDir: string): Promise<Contributor[]> {
        const dependencies = this.readJsonFile(fileDir);

        const ownerAndRepos = this.extractContributorsOwnerAndRepo(dependencies);

        const githubContributors: GitHubContributor[] = await this.fetchGitHubContributors(
            token,
            ownerAndRepos
        );
        const filteredContributors = this.filterOutDependabots(githubContributors); // remove dependabot

        const contributors = this.convertToContributors(filteredContributors);

        return contributors;
    }

    public filterOutDependabots(githubContributors: GitHubContributor[]): GitHubContributor[] {
        const result = githubContributors.filter(
            (userLogin) => userLogin.login !== 'dependabot[bot]'
        );

        return result;
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

    public readJsonFile(fileDir: string): string[] {
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

    public async fetchGitHubContributors(
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