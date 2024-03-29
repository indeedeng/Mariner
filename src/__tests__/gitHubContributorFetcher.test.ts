import nock from 'nock';
import {
    GitHubContributorFetcher,
    Contributor,
    GitHubContributor,
} from '../gitHubContributorFetcher';

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

    it('should Throw if .split() fails or missing "/"', async () => {
        const missingSlash = 'ownerAndRepoWithoutSlash';
        expect(() => {
            contributorsFetcher.extractOwnerAndRepoName(missingSlash);
        }).toThrow();
    });
});

describe('fetchContributorsForRepo', () => {
    afterEach(() => {
        nock.cleanAll();
    });

    it('returns the contributor that it got from github', async () => {
        const fakeRepo = { owner: 'fakeRepo', repo: 'someAwesomeProject' };
        const scope = nock('https://api.github.com')
            .get(`/repos/${fakeRepo.owner}/${fakeRepo.repo}/contributors`)
            .reply(200, fakeGitHubContributor);

        const gitHubContributor = await contributorsFetcher.fetchRawContributorsForRepo(fakeRepo);

        expect(gitHubContributor).toEqual(fakeGitHubContributor);
        expect(scope.isDone()).toBe(true);
    });
    it('should throw if response status is not 200', async () => {
        const fakeRepo = { owner: 'someOwner', repo: 'someAwesomeProject' };
        const scope = nock('https://api.github.com')
            .get(`/repos/${fakeRepo.owner}/${fakeRepo.repo}/contributors`)
            .replyWithError({ message: 'Bad credentials', status: 400 });

        await expect(async () => {
            await contributorsFetcher.fetchRawContributorsForRepo(fakeRepo);
        }).rejects.toThrow();

        expect(scope.isDone()).toBe(true);
    });
    it('should throw if response data is null', async () => {
        const fakeRepo = { owner: 'someOwner', repo: 'thisProject' };
        const scope = nock('https://api.github.com')
            .get(`/repos/${fakeRepo.owner}/${fakeRepo.repo}/contributors`)
            .replyWithError({ message: 'No data found for request', status: 404 });

        await expect(async () => {
            await contributorsFetcher.fetchRawContributorsForRepo(fakeRepo);
        }).rejects.toThrow();

        expect(scope.isDone()).toBe(true);
    });
});

describe('fetchContributorsForMultipleRepos', () => {
    it('fetches Contributor and returns login', async () => {
        const fakeContributorsLogin: Contributor[] = [
            {
                login: 'awesomeContributor',
                contributionsCount: 3,
            },
            {
                login: 'epicContributorLogin',
                contributionsCount: 5,
            },
        ];

        const fakeContributorsLogin2: Contributor[] = [
            {
                login: 'greatContributor',
                contributionsCount: 8,
            },
        ];

        const contributorMap = new Map<string, Contributor[]>();
        contributorMap.set('fakeRepo', fakeContributorsLogin);
        contributorMap.set('anotherFakeRepo', fakeContributorsLogin2);

        const repo = 'fakeRepo/someCoolProject';
        const repo2 = 'anotherFakeRepo/greatProject';
        const fakeRepositoryIdentifiers = [repo, repo2];

        const getList = jest
            .spyOn(contributorsFetcher, 'fetchContributorsForMultipleRepos')
            .mockResolvedValue(Promise.resolve(contributorMap));

        const contributorListMock = await contributorsFetcher.fetchContributorsForMultipleRepos(
            fakeRepositoryIdentifiers
        );

        expect(getList).toHaveBeenCalled();
        expect(getList).toBeCalledWith(fakeRepositoryIdentifiers);
        expect(contributorListMock).toEqual(contributorMap);
        expect(contributorListMock.size).toEqual(contributorMap.size);
    });
});
