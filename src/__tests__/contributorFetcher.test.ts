import { ContributorFetcher } from '../contributorFetcher';

describe('contributor fetcher class', () => {
    const contributorsFinder = new ContributorFetcher();

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
});
