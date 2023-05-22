// jest.mock('@octokit/rest');
import { GitHubContributorFetcher, Contributor } from '../gitHubContributorFetcher'; // GitHubContributor

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

    // it('should get a list of GitHub contributors', () => {
    //     jest.mock('@octokit/rest');

    //     const mockOctokit = new Octokit({
    //         auth: someToken,
    //     });

    // If necessary, you can place a mock implementation like this:
    // mockOctokit.repos.listContributors()

    // describe('myModule', () => {
    //     it('calls the dependency once with double the input', () => {
    //         myModule(2);

    //         expect(dependency).toHaveBeenCalledTimes(1);
    //         expect(dependency).toHaveBeenCalledWith(4);
    //     });
    // });

    //     jest.mock('@octokit/rest');
    //     const token = 'fakeToken';
    //     const mockOctokit = new Octokit({
    //         auth: token,
    //     });
    //     const fakeContributor1: GitHubContributor[] = [
    //         {
    //             login: 'someContributor',
    //             id: 6993258,
    //             node_id: 'MDQ6VXNlcjY5OTMyN23=',
    //             avatar_url: 'https://avatars.githubusercontent.com/u/6993258?v=4',
    //             gravatar_id: '',
    //             url: 'https://api.github.com/users/someContributor',
    //             html_url: 'https://github.com/someContributor',
    //             followers_url: 'https://api.github.com/users/someContributor/followers',
    //             following_url:
    //                 'https://api.github.com/users/someContributor/following{/other_user}',
    //             gists_url: 'https://api.github.com/users/someContributor/gists{/gist_id}',
    //             starred_url: 'https://api.github.com/users/someContributor/starred{/owner}{/repo}',
    //             subscriptions_url: 'https://api.github.com/users/someContributor/subscriptions',
    //             organizations_url: 'https://api.github.com/users/someContributor/orgs',
    //             repos_url: 'https://api.github.com/users/someContributor/repos',
    //             events_url: 'https://api.github.com/users/someContributor/events{/privacy}',
    //             received_events_url: 'https://api.github.com/users/someContributor/received_events',
    //             type: 'User',
    //             site_admin: false,
    //             contributions: 4,
    //         },
    //     ];
    //     const fakeContributor2: GitHubContributor[] = [
    //         {
    //             login: 'anotherContributor',
    //             id: 4829874,
    //             node_id: 'MDQ6VXNlchI4Mjk4NzQ=',
    //             avatar_url: 'https://avatars.githubusercontent.com/u/4829874?v=4',
    //             gravatar_id: '',
    //             url: 'https://api.github.com/users/anotherContributor',
    //             html_url: 'https://github.com/anotherContributor',
    //             followers_url: 'https://api.github.com/users/anotherContributor/followers',
    //             following_url:
    //                 'https://api.github.com/users/anotherContributor/following{/other_user}',
    //             gists_url: 'https://api.github.com/users/anotherContributor/gists{/gist_id}',
    //             starred_url:
    //                 'https://api.github.com/users/anotherContributor/starred{/owner}{/repo}',
    //             subscriptions_url: 'https://api.github.com/users/anotherContributor/subscriptions',
    //             organizations_url: 'https://api.github.com/users/anotherContributor/orgs',
    //             repos_url: 'https://api.github.com/users/anotherContributor/repos',
    //             events_url: 'https://api.github.com/users/anotherContributor/events{/privacy}',
    //             received_events_url:
    //                 'https://api.github.com/users/anotherContributor/received_events',
    //             type: 'User',
    //             site_admin: false,
    //             contributions: 7,
    //         },
    //     ];
    //     const repo1 = 'fakeRepo1/someAwesomeProject';
    //     const repo2 = 'fakeRepo1/someCoolProject';
    //     const fakeRepositoryIdentifiers = [repo1, repo2];
    //     const fakeOwnerAndRepos = [
    //         { owner: 'fakeRepo1', repo: 'someAwesomeProject' },
    //         { owner: 'fakeRepo2', repo: 'someCoolProject' },
    //     ];
    //     const a = mockOctokit.repos.listCollaborators(fakeOwnerAndRepos[0]);
    //     const b = mockOctokit.repos.listCollaborators(fakeOwnerAndRepos[1]);
    // });
});
