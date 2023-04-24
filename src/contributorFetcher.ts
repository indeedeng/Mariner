import { GitHubContributorFetcher } from './gitHubContributorFetcher';

export class ContributorFetcher {
    public async fetchContributors(token: string, repositoryIdentifiers: string[]): Promise<any> {
        const gitHubContributors = new GitHubContributorFetcher();

        const allGitHubContributors = await gitHubContributors.fetchContributors(
            token,
            repositoryIdentifiers
        );
    }
}
