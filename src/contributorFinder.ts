import { GitHubContributor, GitHubContributorFetcher } from './gitHubContributorFetcher';

export class ContributorFinder {
    public async findContributors(
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
