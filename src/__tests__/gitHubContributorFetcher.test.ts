// import { Octokit } from '@octokit/rest';
import { GitHubContributorFetcher } from '../gitHubContributorFetcher'; // GitHubContributor

describe('contributor fetcher class', () => {
    const someToken = 'token';
    const contributorsFinder = new GitHubContributorFetcher(someToken);

    it('should extract owner and repo names', () => {
        const data = ['owner/repoName', 'facebook/jest', 'square/retrofit'];
        const expectedOutput = [
            { owner: 'owner', repo: 'repoName' },
            { owner: 'facebook', repo: 'jest' },
            { owner: 'square', repo: 'retrofit' },
        ];

        const extracted = contributorsFinder.extractOwnerAndRepoNames(data);

        expect(extracted).toEqual(expectedOutput);
    });

    // it('should get a list of GitHub contributors', () => {
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

    //     mockOctokit.repos.listCollaborators(fakeOwnerAndRepos[0]);
    // });
});
