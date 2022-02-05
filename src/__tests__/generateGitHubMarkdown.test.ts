import * as mariner from '../mariner/index';
import { calculateAgeInWholeDays } from '../Utilities/outputHelpers';
import { Issue } from '../issueFinder';
import { DateTime, Duration } from 'luxon';

const eightDaysAgo = DateTime.utc().minus(Duration.fromISO('P8D')).toISO();
const twoDaysAgo = DateTime.utc().minus(Duration.fromISO('P2D')).toISO();
const fakeIssues: Issue[] = [
    {
        title: 'Sort Local Times',
        createdAt: eightDaysAgo,
        repositoryNameWithOwner: 'moment/luxon',
        url: 'https://github.com/moment/luxon/issues/1107',
        updatedAt: '',
        labels: ['help wanted', 'enhancement'],
    },

    {
        title: 'Run a function inside Express route and still render page in sendFile',
        createdAt: eightDaysAgo,
        repositoryNameWithOwner: 'expressjs/express',
        url: 'https://github.com/expressjs/express/issues/4769',
        updatedAt: '',
        labels: ['good first issue', 'help wanted', 'question'],
    },
];

const singleIssue: Issue[] = [
    {
        title: 'Document how we can control Promises',
        createdAt: eightDaysAgo,
        repositoryNameWithOwner: 'sinonjs/sinon',
        url: 'https://github.com/sinonjs/sinon/issues/1898',
        updatedAt: twoDaysAgo,
        labels: ['good first issue', 'documentation', 'help wanted'],
    },
];

describe('generateGithubMarkdown function', () => {
    it('should not list a dependency that has no issue', () => {
        const issuesByDependency: Map<string, Issue[]> = new Map();
        const noIssues: Issue[] = [];
        const dependency = 'TestDependency';

        const oneDependencyNoIssue = issuesByDependency.set(dependency, noIssues);
        const results = mariner.generateGitHubMarkdown(oneDependencyNoIssue);
        expect(results).not.toContain(dependency);
        expect(results).not.toContain('||*Title*||*Age*||');
        expect(results).not.toContain('days');
    });

    it('should include both issues for dependency', () => {
        const mockDependencyMap: Map<string, Issue[]> = new Map();
        const dependency = 'NodeJsDependency';

        const twoIssues = mockDependencyMap.set(dependency, fakeIssues);
        const results = mariner.generateGitHubMarkdown(twoIssues);

        expect(results).toContain(`|[${fakeIssues[0].title}|${fakeIssues[0].url}]|8&nbsp;days|`);
        expect(results).toContain(`|[${fakeIssues[1].title}|${fakeIssues[1].url}]|8&nbsp;days|`);
    });
    it('should include both dependencies that have issues', () => {
        const mockDependencyMap: Map<string, Issue[]> = new Map();
        const dependency1 = 'Graphql';
        const dependency2 = 'TypeStrong';

        mockDependencyMap.set(dependency1, fakeIssues);
        mockDependencyMap.set(dependency2, singleIssue);

        const results = mariner.generateGitHubMarkdown(mockDependencyMap);

        expect(results).toContain(`### ${dependency1}`);
        expect(results).toContain('|**Title**|**Age**|');
        expect(results).toContain(`|[${fakeIssues[0].title}|${fakeIssues[0].url}]|8&nbsp;days|`);
        expect(results).toContain(`|[${fakeIssues[1].title}|${fakeIssues[1].url}]|8&nbsp;days|`);

        expect(results).toContain(`### ${dependency2}`);
        expect(results).toContain('|**Title**|**Age**|');
        expect(results).toContain(`|[${singleIssue[0].title}|${singleIssue[0].url}]|8&nbsp;days|`);
    });
    it('should remove curly braces and square brackets from an issue title', () => {
        const mockDependencyMap: Map<string, Issue[]> = new Map();
        const dependency = 'React';
        singleIssue[0].title = '[Navigation Editor] Dropdown menus too narrow {}';

        mockDependencyMap.set(dependency, singleIssue);
        const results = mariner.generateGitHubMarkdown(mockDependencyMap);
        expect(results).not.toContain(singleIssue[0].title);
        expect(results).toMatch(
            `|[(Navigation Editor) Dropdown menus too narrow ()|${singleIssue[0].url}]|8&nbsp;days|`
        );
    });
    it('should return correct markup for a dependency and an issue', () => {
        const mockDependencyMap: Map<string, Issue[]> = new Map();
        const dependency = 'OSS';
        singleIssue[0].title = 'Fixed interface';
        const now = DateTime.utc();

        const ageInWholeDays = calculateAgeInWholeDays(singleIssue[0].createdAt, now);
        mockDependencyMap.set(dependency, singleIssue);
        const results = mariner.generateGitHubMarkdown(mockDependencyMap);
        expect(results).toContain(`### ${dependency}`);
        expect(results).toContain('|**Title**|**Age**|');
        expect(results).toContain(`|[${singleIssue[0].title}|${singleIssue[0].url}]|`);
        expect(results).toContain(`|${ageInWholeDays}&nbsp;days|`);
    });
    it('should not list a dependency with no issues if its issue is too old', () => {
        const mockDependencyMap: Map<string, Issue[]> = new Map();
        const dependency = 'Badges/shields';
        singleIssue[0].createdAt = '2021-01-02T10:22:41Z'; // old issue

        const now = DateTime.utc();
        const date = now.toISO();

        mockDependencyMap.set(dependency, singleIssue);
        const results = mariner.generateGitHubMarkdown(mockDependencyMap);
        expect(results).toContain(`## Updated: ${date}`);
        expect(results).not.toContainEqual(`### ${dependency}`);
        expect(results).not.toContainEqual('\n|**Title**|**Age**|');
        expect(results).not.toContainEqual(singleIssue[0].title);
    });
});
