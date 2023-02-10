import { Config } from './config';
import { Octokit } from '@octokit/rest';

export class SponsorabilityFetcher {
    private readonly config: Config;

    public constructor(config: Config) {
        this.config = config;
    }
    public async fetchSponsorables(token: string) {
        /* To-do:
          1. Read file of deps
          2. create function to loop through
          each dependeny and pass each one in fetchContributors
        */
        return this.fetchContributors(token);
    }

    public async fetchContributors(token: string) {
        const octokit = new Octokit({
            auth: token,
        });

        const listOfContributors = await octokit.repos.listContributors({
            owner: 'indeedeng', // user or org name
            repo: 'mariner', // repoName
        });

        return listOfContributors.data;
    }
}
