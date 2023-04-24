import { GitHubContributorFetcher } from './gitHubContributorFetcher';
import { GithubSponsorable, SponsorableFetcher, queryTemplate } from './sponsorableFetcher';

export class ContributorFetcher {
    public async fetchContributors(
        token: string,
        repositoryIdentifiers: string[]
    ): Promise<Map<string, GithubSponsorable[]>> {
        const gitHubContributors = new GitHubContributorFetcher();

        const allGitHubContributors = await gitHubContributors.fetchContributors(
            token,
            repositoryIdentifiers
        );

        const sponsorableContributors = new SponsorableFetcher();

        const sponsorable = await sponsorableContributors.fetchSponsorablesInformation(
            token,
            queryTemplate,
            allGitHubContributors
        );

        return sponsorable;
    }
}
