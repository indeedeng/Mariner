import { Config } from './config';
import { Octokit } from '@octokit/rest';
import fs from 'fs';

export type RepositoryContributorInfo = {
    owner: string;
    repo: string;
};
export interface Contributor {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
    contributions: number;
}

export class SponsorabilityFetcher {
    private readonly config: Config;

    public constructor(config: Config) {
        this.config = config;
    }
    public async fetchSponsorables(token: string) {
        /* To-do:
          2. Figure out types -- still working on it/rough draft
        */
        const fileDir = './examples/exampleData.json';
        const dependencies = this.readJsonFile(fileDir);

        const ownerAndRepos = this.extractContributorsOwnerAndRepo(dependencies);
        const contributors = await this.fetchContributors(token, ownerAndRepos);
        const all = Promise.all(contributors);

        return all;
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
        // will update type
        try {
            const data = fs.readFileSync(fileDir, { encoding: 'utf8' });
            const contributors = JSON.parse(data);

            return contributors;
        } catch (err) {
            console.log('Error parsing JSON string');
        }
    }

    public async fetchContributors(
        token: string,
        ownerAndRepo: RepositoryContributorInfo[]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): Promise<any[]> {
        const octokit = new Octokit({
            auth: token,
        });

        const contributors = ownerAndRepo.map(async (contributor) => {
            const listOfContributors = await octokit.repos.listContributors({
                owner: contributor.owner,
                repo: contributor.repo,
            });

            return listOfContributors.data;
        });

        return contributors;
    }
}
