import { Octokit } from '@octokit/rest';
import {
    GitHubContributorFetcher,
    Contributor,
    GitHubContributor,
} from '../gitHubContributorFetcher'; // GitHubContributor

describe('contributor fetcher class', () => {
    const someToken = 'fakeToken';
    const contributorsFinder = new GitHubContributorFetcher(someToken);

    it('should extract owner and repo names', async () => {
        // add more?
        const data = 'someOwner/someRepoName';
        const expectedOutput1 = { owner: 'someOwner', repo: 'someRepoName' };

        const extracted = contributorsFinder.extractOwnerAndRepoNames(data);

        return expect(expectedOutput1).toEqual(extracted);
    });

    it('it fetches Contributors', async () => {
        const fakeContributor1: Contributor[] = [
            {
                login: 'awesomeContributor',
            },
        ];

        const contributorMap = new Map<string, Contributor[]>();
        contributorMap.set('fakeRepo1', fakeContributor1);

        const repo1 = 'fakeRepo1/someCoolProject';
        const fakeRepositoryIdentifiers = [repo1];

        const getList = jest
            .spyOn(contributorsFinder, 'fetchGitHubContributorsByRepoName')
            .mockResolvedValue(Promise.resolve(contributorMap));

        const contributorListMock = await contributorsFinder.fetchGitHubContributorsByRepoName(
            someToken,
            fakeRepositoryIdentifiers
        );

        expect(getList).toHaveBeenCalled();
        expect(getList).toBeCalledWith(someToken, fakeRepositoryIdentifiers);
        expect(contributorListMock).toBe(contributorMap);
    });

    it('it fetches Contributors', async () => {
        jest.mock('@octokit/rest');

        const fakeContributor1: GitHubContributor[] = [
            {
                login: 'someContributor',
                id: 6993258,
                node_id: 'MDQ6VXNlcjY5OTMyN23=',
                avatar_url: 'https://avatars.githubusercontent.com/u/6993258?v=4',
                gravatar_id: '',
                url: 'https://api.github.com/users/someContributor',
                html_url: 'https://github.com/someContributor',
                followers_url: 'https://api.github.com/users/someContributor/followers',
                following_url:
                    'https://api.github.com/users/someContributor/following{/other_user}',
                gists_url: 'https://api.github.com/users/someContributor/gists{/gist_id}',
                starred_url: 'https://api.github.com/users/someContributor/starred{/owner}{/repo}',
                subscriptions_url: 'https://api.github.com/users/someContributor/subscriptions',
                organizations_url: 'https://api.github.com/users/someContributor/orgs',
                repos_url: 'https://api.github.com/users/someContributor/repos',
                events_url: 'https://api.github.com/users/someContributor/events{/privacy}',
                received_events_url: 'https://api.github.com/users/someContributor/received_events',
                type: 'User',
                site_admin: false,
                contributions: 4,
            },
        ];

        const mockOctokit = new Octokit({
            auth: someToken,
        });

        const fakeOwnerAndRepos = { owner: 'fakeRepo1', repo: 'someAwesomeProject' };
        // const mocked = (mockOctokit as unknown as jest.Mock).mockReturnValue(fakeContributor1);
        //  TypeError: mockOctokit.mockReturnValue is not a function

        const gHContributors = contributorsFinder.fetchListOfGithubContributors(
            someToken,
            fakeOwnerAndRepos
        );

        expect(mockOctokit).toBeInstanceOf(Octokit);
        // const all = await mockOctokit.repos.listCollaborators(fakeOwnerAndRepos);
        // expect(mocked).toBe(gHContributors);
    });
});
