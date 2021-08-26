import * as mariner from '../mariner/index';
import { Issue } from '../issueFinder';
import { DateTime, Duration } from 'luxon';
import { encode } from 'html-entities';

const eightDaysAgo = DateTime.utc().minus(Duration.fromISO('P8D')).toISO();
const twoDaysAgo = DateTime.utc().minus(Duration.fromISO('P2D')).toISO();
const maxAgeInDays = 30;

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

const singleIssue: Issue[] = [
    {
        title: 'ToC: links to markdown headings',
        createdAt: eightDaysAgo,
        repositoryNameWithOwner: 'marmelab/react-admin',
        url: 'https://github.com/marmelab/react-admin/issues/5620',
        updatedAt: twoDaysAgo,
        labels: ['good first issue', 'documentation'],
    },
];

describe('generateHtml function', () => {
    it('should properly format a dependency with an issue', () => {
        const mockDependencyMap: Map<string, Issue[]> = new Map();
        const dependency = 'Babel';

        mockDependencyMap.set(dependency, singleIssue);

        const results = mariner.generateHtml(mockDependencyMap, maxAgeInDays);
        expect(results).toContain(`<h3>${dependency}</h3>`);
        expect(results).toContain('<table><tr><th>Title</th><th>Age</th></tr>');
        const issue = singleIssue[0];
        const titleCellContents = `<a href="${encode(issue.url)}">${encode(issue.title)}</a>`;
        const ageCellContents = '8&nbsp;days';
        expect(results).toContain(
            `<tr><td>${titleCellContents}</td><td>${ageCellContents}</td></tr>`
        );
        expect(results).toContain('</table>');
    });

    it('should include both issues for a dependency', () => {
        const mockDependencyMap: Map<string, Issue[]> = new Map();
        const dependency = 'NodeJsDependency';

        const twoIssues = mockDependencyMap.set(dependency, fakeIssues);
        const results = mariner.generateHtml(twoIssues, maxAgeInDays);

        expect(results).toContain(dependency);
        expect(results).toContain(encode(fakeIssues[0].title));
        expect(results).toContain(encode(fakeIssues[0].url));
        expect(results).toContain(encode(fakeIssues[1].title));
        expect(results).toContain(encode(fakeIssues[1].url));
    });

    it('should include both dependencies that have issues', () => {
        const mockDependencyMap: Map<string, Issue[]> = new Map();
        const dependency1 = 'Graphql';
        const dependency2 = 'TypeStrong';

        mockDependencyMap.set(dependency1, fakeIssues);
        mockDependencyMap.set(dependency2, singleIssue);

        const results = mariner.generateHtml(mockDependencyMap, maxAgeInDays);

        expect(results).toContain(dependency1);
        expect(results).toContain(encode(fakeIssues[0].title));
        expect(results).toContain(encode(fakeIssues[0].url));
        expect(results).toContain(encode(fakeIssues[1].title));
        expect(results).toContain(encode(fakeIssues[1].url));

        expect(results).toContain(dependency2);
        expect(results).toContain(encode(singleIssue[0].title));
        expect(results).toContain(encode(singleIssue[0].url));
    });

    it('should not generate the dependencies table if there are no issues', () => {
        const issuesByDependency: Map<string, Issue[]> = new Map();
        const noIssues: Issue[] = [];
        const dependency = 'TestDependency';

        const oneDependencyNoIssue = issuesByDependency.set(dependency, noIssues);
        const results = mariner.generateHtml(oneDependencyNoIssue, maxAgeInDays);
        expect(results).not.toContain(dependency);
        expect(results).not.toContain('Title');
        expect(results).not.toContain('Age');
        expect(results).not.toContain('days');
    });

    it('should handle special characters in an issue title', () => {
        const mockDependencyMap: Map<string, Issue[]> = new Map();
        const dependency = 'React';
        singleIssue[0].title =
            '[Navigation Editor] Dropdown & menus too narrow {braces} <angle brackets>';

        mockDependencyMap.set(dependency, singleIssue);
        const results = mariner.generateHtml(mockDependencyMap, maxAgeInDays);

        expect(results).not.toContain(singleIssue[0].title);
        expect(results).toContain(encode(singleIssue[0].title));
    });

    it('should not list a dependency with no issues if its issue is too old', () => {
        const mockDependencyMap: Map<string, Issue[]> = new Map();
        const dependency = 'Badges/shields';
        singleIssue[0].createdAt = '2021-01-02T10:22:41Z'; // old issue

        mockDependencyMap.set(dependency, singleIssue);
        const results = mariner.generateHtml(mockDependencyMap, maxAgeInDays);
        expect(results).not.toContain(dependency);
    });
});
