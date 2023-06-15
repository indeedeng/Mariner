import { Contributor, GitHubContributorFetcher } from './gitHubContributorFetcher';

export class ContributorsFinder {
    private readonly token: string;

    public constructor(token: string) {
        this.token = token;
    }
    public async findContributors(
        repositoryIdentifiers: string[]
    ): Promise<Map<string, Contributor[]>> {
        const fetcher = new GitHubContributorFetcher(this.token);

        const allContributors = await fetcher.fetchContributorsForMultipleRepos(
            repositoryIdentifiers
        );

        return allContributors;
    }
}
