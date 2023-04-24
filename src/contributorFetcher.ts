import { GitHubContributor, GitHubContributorFetcher } from './gitHubContributorFetcher';

export class ContributorFetcher {
    public async fetchContributors(
        token: string,
        repositoryIdentifiers: string[]
    ): Promise<Map<string, GitHubContributor[]>> {
        const gitHubContributors = new GitHubContributorFetcher();

        const allGitHubContributors = await gitHubContributors.fetchContributors(
            token,
            repositoryIdentifiers
        );

        return allGitHubContributors;
    }
}
