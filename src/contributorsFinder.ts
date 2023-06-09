import { Contributor, GitHubContributorFetcher } from './gitHubContributorFetcher';

export class ContributorsFinder {
    private readonly token: string;

    public constructor(token: string) {
        this.token = token;
    }
    public async findContributors(
        repositoryIdentifiers: string[]
    ): Promise<Map<string, Contributor[]>> {
        const gitHubContributors = new GitHubContributorFetcher(this.token);

        const allContributors = await gitHubContributors.fetchContributorsForMultipleRepos(
            this.token,
            repositoryIdentifiers
        );

        return allContributors;
    }
}
