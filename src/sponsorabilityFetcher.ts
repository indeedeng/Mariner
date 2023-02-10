import { Config } from './config';
import { Octokit } from '@octokit/rest';
import fs from 'fs';

export type GitHubContributorRepo = {
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
          3. create function to loop through
          each dependeny and pass each one in fetchContributors
        */
        const dependencies = this.readDependenciesFile();
        console.log(typeof dependencies);

        return this.fetchContributors(token);
    }

    public readDependenciesFile(): string {
        const fileDir = './examples/exampleData.json';
        const data = fs.readFileSync(fileDir, { encoding: 'utf8' });

        return data;
    }

    public async fetchContributors(token: string) {
        const octokit = new Octokit({
            auth: token,
        });

        const listOfContributors = await octokit.repos.listContributors({
            // will removce when looping through
            owner: 'indeedeng', // user or org name
            repo: 'mariner', // repoName
        });

        return listOfContributors.data;
    }
}
