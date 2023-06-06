import nock from 'nock';
import {
    GitHubContributorFetcher,
    Contributor,
    GitHubContributor,
} from '../gitHubContributorFetcher';

let contributorsFetcher: GitHubContributorFetcher;
const someToken = 'fakeToken';

beforeEach(() => {
    contributorsFetcher = new GitHubContributorFetcher(someToken);
});

describe('extractOwnerAndRepoName', () => {
    it('extracts owner and repoName', async () => {
        const data = 'someOwner/someRepoName';
        const expectedOutput = { owner: 'someOwner', repo: 'someRepoName' };

        const extracted = contributorsFetcher.extractOwnerAndRepoName(data);
        expect(expectedOutput).toEqual(extracted);
    });

    it('expect to Throw if .split() fails or missing "/"', async () => {
        const missingSlash = 'ownerAndRepoWithoutSlash';
        expect(() => {
            contributorsFetcher.extractOwnerAndRepoName(missingSlash); // Code block that should throw error
        }).toThrow();
    });
});

describe('fetchGithubContributors', () => {
    const fakeGitHubContributor: GitHubContributor[] = [
        {
            login: 'someContributor',
            id: 6993258,
            node_id: 'MDQ6VXNlcjY5OTMyN23=',
            avatar_url: 'https://avatars.githubusercontent.com/u/6993258?v=4',
            gravatar_id: '',
            url: 'https://api.github.com/users/someContributor',
            html_url: 'https://github.com/someContributor',
            followers_url: 'https://api.github.com/users/someContributor/followers',
            following_url: 'https://api.github.com/users/someContributor/following{/other_user}',
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

    it('mocks call to fetch a GitHubContributor', async () => {
        const fakeRepo = { owner: 'fakeRepo1', repo: 'someAwesomeProject' };
        const scope = nock('https://api.github.com')
            .get(`/repos/${fakeRepo.owner}/${fakeRepo.repo}/contributors`)
            .reply(200, fakeGitHubContributor);

        const gitHubContributor = await contributorsFetcher.fetchListOfGithubContributors(
            someToken,
            fakeRepo
        );

        expect(gitHubContributor).toEqual(fakeGitHubContributor);
        expect(scope.isDone()).toBe(true);
        nock.cleanAll();
    });
});

describe('fetchListOfContributors', () => {
    it('fetches Contributor and returns login', async () => {
        const fakeContributorLogin: Contributor[] = [
            {
                login: 'awesomeContributor',
            },
        ];

        const contributorMap = new Map<string, Contributor[]>();
        contributorMap.set('fakeRepo', fakeContributorLogin);

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
});
