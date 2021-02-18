import { generateConfluenceMarkdown } from '../Utilities/generateConfluenceMarkdown';
import { Issue } from '../issueFinder';
import { DateTime, Duration } from 'luxon';

const eightDaysAgo = DateTime.utc().minus(Duration.fromISO('P8D')).toISO();
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
    //      it('should return two dependencies, each with their issue', () => {
    //         const depsMap: Map<string, Issue[]> = new Map();
    //         const a = generateConfluenceMarkdown(dependency);
    //      });
    //      it('should pass in an issue that is too old', () => {
    //
    //          // expect().toContain();
    //      });
    //       it('should return an issue that has square brackets and curly braces in its title', () => {
    //        // failing test

    //           expect(generateConfluenceMarkdown(a, b))
    //     });
    //       it('should pass in a dependency with one issue and make sure the all fields for that issue are correct', () => {
    //        // failing test

    //           expect(generateConfluenceMarkdown(a, b))
    //     });
});
