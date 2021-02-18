import { generateConfluenceMarkdown } from '../Utilities/generateConfluenceMarkdown';
import { Issue } from '../issueFinder';

const fakeIssues: Issue[] = [
    {
        title: 'Formatting seems to use Prettier options by default',
        createdAt: '2020-11-30T16:51:33Z',
        repositoryNameWithOwner: 'bc/typescript',
        url: 'https://github.com/bc/typescript/issues/30',
        updatedAt: '',
        labels: ['help wanted', 'documentation'],
    },

    {
        title: 'style config',
        createdAt: '2014-11-04T23:10:02Z',
        repositoryNameWithOwner: 'material-ui/mui',
        url: 'https://github.com/material-ui/issues/24',
        updatedAt: '',
        labels: ['good first issue', 'help wanted', 'documentation'],
    },
];

describe('generateConfluenceMarkdown function', () => {
    it('should pass in a dependency with no issues', () => {
        const mapWithoutIssues: Map<string, Issue[]> = new Map();
        // const noIssues: Issue[] = [];
        const dependency = 'TestDependency';
        const oneDependency = mapWithoutIssues.set(dependency, fakeIssues);

        const results = generateConfluenceMarkdown(oneDependency, 30);
        expect(results).toContain([]); // expecting it to fail because fakeIssues has two issues...
    });

    // Tests WIP
    // it('should return 2 issues for a single dependency', () => {
    //     const mockDependencyMap: Map<string, Issue[]> = new Map();
    //     const dependency2 = 'NodeJsDependency';
    //     const twoIssues = mockDependencyMap.set(dependency2, fakeIssues);
    //     const dep = mockDependencyMap.get(dependency2[1]);

    //     const results = generateConfluenceMarkdown(twoIssues);
    //     expect(results).toContain(dep);
    // });
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
});
