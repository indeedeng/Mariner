import { encode } from 'html-entities';
import { DateTime } from 'luxon';
import { Issue } from '../issueFinder';
import { calculateAgeInWholeDays } from './generateConfluenceMarkdown';

export function generateHtml(issuesByDependency: Map<string, Issue[]>, maxIssuesAge = 30): string {
    const now = DateTime.utc();

    const arrayOfHtmlFragments: string[] = [];

    for (const [dependency, issues] of issuesByDependency) {
        if (!issues || !issues.length) {
            continue;
        }

        const relevantIssues = issues.filter((issue) => {
            const ageInWholeDays = calculateAgeInWholeDays(issue.createdAt, now);

            return ageInWholeDays < maxIssuesAge;
        });

        if (!relevantIssues.length) {
            continue;
        }

        const fragmentsForDependency = generateHtmlFragmentsForDependency(
            dependency,
            relevantIssues,
            now
        );
        arrayOfHtmlFragments.push(...fragmentsForDependency);
    }

    return arrayOfHtmlFragments.join('\n');
}

function generateHtmlFragmentsForDependency(
    dependencyName: string,
    relevantIssues: Issue[],
    now: DateTime
): string[] {
    const arrayOfHtmlFragments: string[] = [];

    const encodedDependencyName = encode(dependencyName);
    arrayOfHtmlFragments.push(`<h3 class="dependency-name">${encodedDependencyName}</h3>`);
    arrayOfHtmlFragments.push('<table class="issue-list">');
    arrayOfHtmlFragments.push('<tr class="issue-header-row"><th>Title</th><th>Age</th></tr>');

    relevantIssues.forEach((issue) => {
        const ageInWholeDays = calculateAgeInWholeDays(issue.createdAt, now);

        const title = encode(issue.title);
        const url = encode(issue.url);
        arrayOfHtmlFragments.push('<tr class="issue-row">');
        arrayOfHtmlFragments.push(`<td class="issue-title"><a href="${url}">${title}</a></td>`);
        arrayOfHtmlFragments.push(`<td class="issue-age">${ageInWholeDays}&nbsp;days</td>`);
        arrayOfHtmlFragments.push('</tr>');
    });

    arrayOfHtmlFragments.push('</table>');

    return arrayOfHtmlFragments;
}
