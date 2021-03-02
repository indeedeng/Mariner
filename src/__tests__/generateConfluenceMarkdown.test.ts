import * as mariner from '../mariner/index';
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

function calculateAgeInWholeDays(IsoString: string): number {
    const now = DateTime.local();
    const createdAt = DateTime.fromISO(IsoString);
    const ageInDays = now.diff(createdAt, 'days').days;
    const ageInWholeDays = Math.round(ageInDays);

    return ageInWholeDays;
}

describe('generateConfluenceMarkdown function', () => {
    it('should not list a dependency that has no issue', () => {
        const issuesByDependency: Map<string, Issue[]> = new Map();
        const noIssues: Issue[] = [];
        const dependency = 'TestDependency';

        const oneDependencyNoIssue = issuesByDependency.set(dependency, noIssues);
        const results = mariner.generateConfluenceMarkdown(oneDependencyNoIssue);

        expect(results).not.toContain(`h3. ${dependency}`);
        expect(results).not.toContain('\n ||*Title*||*Age*||');
        expect(results).not.toContain('|days|');
    });

    it('should include both issues for dependency', () => {
        const mockDependencyMap: Map<string, Issue[]> = new Map();
        const dependency = 'NodeJsDependency';

        const twoIssues = mockDependencyMap.set(dependency, fakeIssues);
        const results = mariner.generateConfluenceMarkdown(twoIssues);
        expect(results).toContain(`h3. ${dependency}`);
        expect(results).toContain(`|[${fakeIssues[0].title}|${fakeIssues[0].url}]|`);
        expect(results).toContain(`|[${fakeIssues[1].title}|${fakeIssues[1].url}]|`);
    });
    it('should include both dependencies that have issues', () => {
        const mockDependencyMap: Map<string, Issue[]> = new Map();
        const dependency1 = 'Graphql';
        const dependency2 = 'TypeStrong';

        mockDependencyMap.set(dependency1, fakeIssues);
        mockDependencyMap.set(dependency2, singleIssue);

        const results = mariner.generateConfluenceMarkdown(mockDependencyMap);
        expect(results).toContain(`h3. ${dependency1}`);
        expect(results).toContain(`|[${fakeIssues[0].title}|${fakeIssues[0].url}]|`);
        expect(results).toContain(`|[${fakeIssues[1].title}|${fakeIssues[1].url}]|`);

        expect(results).toContain(`h3. ${dependency2}`);
        expect(results).toContain(`|[${singleIssue[0].title}|${singleIssue[0].url}]|`);
    });
    it('should remove curly braces from an issue title', () => {
        const mockDependencyMap: Map<string, Issue[]> = new Map();
        const dependency = 'React';
        singleIssue[0].title = '[Navigation Editor] Dropdown menus too narrow {}';

        mockDependencyMap.set(dependency, singleIssue);
        const results = mariner.generateConfluenceMarkdown(mockDependencyMap);
        expect(results).not.toContain(`|[${singleIssue[0].title}|${singleIssue[0].url}]|`);
        expect(results).toMatch(
            `|[[Navigation Editor] Dropdown menus too narrow |${singleIssue[0].url}]|`
        );
    });
    it('should return correct markdown for a dependency and an issue', () => {
        const mockDependencyMap: Map<string, Issue[]> = new Map();
        const dependency = 'OSS';
        singleIssue[0].title = 'Fixed interface';

        const ageInWholeDays = calculateAgeInWholeDays(singleIssue[0].createdAt);
        mockDependencyMap.set(dependency, singleIssue);
        const results = mariner.generateConfluenceMarkdown(mockDependencyMap);
        expect(results).toContain(`h3. ${dependency}`);
        expect(results).toContain(`|[${singleIssue[0].title}|${singleIssue[0].url}]|`);
        expect(results).toContain(`|${ageInWholeDays}&nbsp;days|`);
    });
    it('should list a dependency but no issues if its issue is too old', () => {
        const mockDependencyMap: Map<string, Issue[]> = new Map();
        const dependency = 'Badges/shields';
        singleIssue[0].createdAt = '2021-01-02T10:22:41Z'; // old issue

        mockDependencyMap.set(dependency, singleIssue);
        const results = mariner.generateConfluenceMarkdown(mockDependencyMap);
        expect(results).toContain(`h3. ${dependency}`);
        expect(results).toContain('\n||*Title*||*Age*||');
        expect(results).not.toContain(`|[${singleIssue[0].title}|${singleIssue[0].url}]|`);
    });
});

describe('cleanMarkdown function', () => {
    it('should return string without altering it', () => {
        const title1 =
            '|[2020 upgrade edition menus too narrow|https://github.com/marmelab/react-admin/issues/7520]|8&nbsp;days|';
        const cleanedMarkdown = mariner.cleanMarkdown(title1);
        expect(cleanedMarkdown).toEqual(
            '|[2020 upgrade edition menus too narrow|https://github.com/marmelab/react-admin/issues/7520]|8&nbsp;days|'
        );
    });
    it('should remove a set of curly braces', () => {
        const title = '|[{WIP} updating frontend components|';
        const cleanedMarkdown = mariner.cleanMarkdown(title);
        expect(cleanedMarkdown).toEqual('|[WIP updating frontend components|');
    });
    it('should remove all curly braces', () => {
        const title =
            '|[{new babel} teardown do not fail tests in non-watch mode - {imports are removed}|';
        const cleanedMarkdown = mariner.cleanMarkdown(title);
        expect(cleanedMarkdown).toEqual(
            '|[new babel teardown do not fail tests in non-watch mode - imports are removed|'
        );
    });
    it('should not remove square brackets', () => {
        const title = '|[[es-lint] resolves deprecated code {updates}|';
        const cleanedMarkdown = mariner.cleanMarkdown(title);
        expect(cleanedMarkdown).toEqual('|[[es-lint] resolves deprecated code updates|');
    });
});
