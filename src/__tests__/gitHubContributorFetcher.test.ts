import nock from 'nock';
import {
    GitHubContributorFetcher,
    Contributor,
    GitHubContributor,
} from '../gitHubContributorFetcher';

describe('contributor fetcher class', () => {
    const someToken = 'fakeToken';
    const contributorsFetcher = new GitHubContributorFetcher(someToken);

    it('should extract owner and repo names', async () => {
        const data = 'someOwner/someRepoName';
        const expectedOutput1 = { owner: 'someOwner', repo: 'someRepoName' };

        const extracted = contributorsFetcher.extractOwnerAndRepoName(data);

        expect(expectedOutput1).toEqual(extracted);
    });

    it('fetches Contributors', async () => {
        const fakeContributor: Contributor[] = [
            {
                login: 'awesomeContributor',
            },
        ];

        const contributorMap = new Map<string, Contributor[]>();
        contributorMap.set('fakeRepo1', fakeContributor);

        const repo = 'fakeRepo/someCoolProject';
        const fakeRepositoryIdentifiers = [repo];

        const getList = jest
            .spyOn(contributorsFetcher, 'fetchGitHubContributorsByRepoName')
            .mockResolvedValue(Promise.resolve(contributorMap));

        const contributorListMock = await contributorsFetcher.fetchGitHubContributorsByRepoName(
            someToken,
            fakeRepositoryIdentifiers
        );

        expect(getList).toHaveBeenCalled();
        expect(getList).toBeCalledWith(someToken, fakeRepositoryIdentifiers);
        expect(contributorListMock).toBe(contributorMap);
    });

    it('fetches a GitHubContributor', async () => {
        const fakeContributor: GitHubContributor[] = [
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
        const scope = nock('https://api.github.com')
            .get(`/repos/${fakeOwner.owner}/${fakeOwner.repo}/contributors`)
            .reply(200, fakeContributor);

        const gitHubContributor = await contributorsFetcher.fetchListOfGithubContributors(
            someToken,
            fakeOwner
        );

        expect(gitHubContributor).toEqual(fakeContributor);
        expect(scope.isDone()).toBe(true);
        nock.cleanAll();
    });
});
