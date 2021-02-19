import { generateConfluenceMarkdown } from '../Utilities/generateConfluenceMarkdown';
import { Issue } from '../issueFinder';
import { DateTime, Duration } from 'luxon';

const eightDaysAgo = DateTime.utc().minus(Duration.fromISO('P8D')).toISO();
const twoDaysAgo = DateTime.utc().minus(Duration.fromISO('P2D')).toISO();
const fakeIssues: Issue[] = [
    {
        title: 'Formatting seems to use Prettier options by default',
        createdAt: eightDaysAgo,
        repositoryNameWithOwner: 'bc/typescript',
        url: 'https://github.com/bc/typescript/issues/30',
        updatedAt: '',
        labels: ['help wanted', 'documentation'],
    },

    {
        title: 'style config',
        createdAt: eightDaysAgo,
        repositoryNameWithOwner: 'material-ui/mui',
        url: 'https://github.com/material-ui/issues/24',
        updatedAt: '',
        labels: ['good first issue', 'help wanted', 'documentation'],
    },
];

const fakeIssues2: Issue[] = [
    {
        title: 'ToC: links to markdown headings',
        createdAt: eightDaysAgo,
        repositoryNameWithOwner: 'marmelab/react-admin',
        url: 'https://github.com/marmelab/react-admin/issues/5620',
        updatedAt: twoDaysAgo,
        labels: ['good first issue', 'documentation'],
    },
];

describe('generateConfluenceMarkdown function', () => {
    it('should pass in a dependency with no issues', () => {
        const mapWithoutIssues: Map<string, Issue[]> = new Map();
        const noIssues: Issue[] = [];
        const dependency = 'TestDependency';
        const oneDependency = mapWithoutIssues.set(dependency, noIssues);
        const results = generateConfluenceMarkdown(oneDependency, 30);

        expect(results).toContain(noIssues);
    });

    it('should return 2 issues for a single dependency', () => {
        const mockDependencyMap: Map<string, Issue[]> = new Map();
        const dependency = 'NodeJsDependency';
        const twoIssues = mockDependencyMap.set(dependency, fakeIssues);

        const results = generateConfluenceMarkdown(twoIssues);
        expect(results).toContain(fakeIssues[0].title);
        expect(results).toContain(fakeIssues[0].title);
    });
    it('should return two dependencies, each with their issue', () => {
        const mockDependencyMap: Map<string, Issue[]> = new Map();
        const dependency1 = 'Graphql';
        const dependency2 = 'TypeStrong';

        mockDependencyMap.set(dependency1, fakeIssues);
        mockDependencyMap.set(dependency2, fakeIssues2);

        const results = generateConfluenceMarkdown(mockDependencyMap);
        expect(results).toContain(dependency1);
        expect(results).toContain(fakeIssues[0].title);
        expect(results).toContain(fakeIssues[1].title);
        expect(results).toContain(dependency2);
        expect(results).toContain(fakeIssues2[0].title);
    });
    it('should return an issue that has square brackets and curly braces in its title', () => {
        const mockDependencyMap: Map<string, Issue[]> = new Map();
        const dependency = 'React';

        fakeIssues2[0].title = '[Navigation Editor] Dropdown menus too narrow {}';
        mockDependencyMap.set(dependency, fakeIssues2);

        const results = generateConfluenceMarkdown(mockDependencyMap);
        expect(results).toContain(fakeIssues2[0].title);
    });
    it('should pass in a dependency with one issue and make sure the all fields for that issue are correct', () => {
        const mockDependencyMap: Map<string, Issue[]> = new Map();
        const dependency = 'OSS';

        fakeIssues2[0].title = 'Added more info to readme.md';
        mockDependencyMap.set(dependency, fakeIssues2);

        const results = generateConfluenceMarkdown(mockDependencyMap);

        expect(results).toContain(fakeIssues2[0].title);
        expect(results).toContain('8&nbsp;days'); // keep getting errors   fakeIssues2[0].createdAt
        expect(results).toContain(fakeIssues2[0].repositoryNameWithOwner);
        expect(results).toContain(fakeIssues2[0].url);
    });
    // WIP
    // it('should pass in an issue that is too old', () => {
    //     const mockDependencyMap: Map<string, Issue[]> = new Map();
    //     const dependency = 'Badges/shields';

    //     fakeIssues2[0].createdAt = '2020-11-26T11:52:41Z';

    //     mockDependencyMap.set(dependency, fakeIssues2);
    //     const results = generateConfluenceMarkdown(mockDependencyMap, 30);

    // });
});
