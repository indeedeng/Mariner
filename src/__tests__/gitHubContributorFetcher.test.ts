import nock from 'nock';
import {
    GitHubContributorFetcher,
    Contributor,
    GitHubContributor,
} from '../gitHubContributorFetcher';

describe('contributor fetcher class', () => {
    const someToken = 'fakeToken';
    const contributorsFinder = new GitHubContributorFetcher(someToken);

    it('should extract owner and repo names', async () => {
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

    it('it fetches GitHubContributors', async () => {
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

        const fakeOwner = { owner: 'fakeRepo1', repo: 'someAwesomeProject' };
        nock('https://api.github.com')
            .get(`/repos/${fakeOwner.owner}/${fakeOwner.repo}/contributors`)
            .reply(200, fakeContributor1);

        const gitHubContributor = await contributorsFinder.fetchListOfGithubContributors(
            someToken,
            fakeOwner
        );
        expect(gitHubContributor).toEqual(fakeContributor1);
        nock.cleanAll();
    });
});
