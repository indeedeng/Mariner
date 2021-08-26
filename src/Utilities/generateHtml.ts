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

        const dependencyName = encode(dependency);
        arrayOfHtmlFragments.push(`<h3>${dependencyName}</h3>`);
        arrayOfHtmlFragments.push('<table><tr><th>Title</th><th>Age</th></tr>');

        relevantIssues.forEach((issue) => {
            const ageInWholeDays = calculateAgeInWholeDays(issue.createdAt, now);

            const title = encode(issue.title);
            const url = encode(issue.url);
            arrayOfHtmlFragments.push(
                `<tr><td><a href="${url}">${title}</a></td><td>${ageInWholeDays}&nbsp;days</td></tr>`
            );
        });

        arrayOfHtmlFragments.push('</table>');
    }

    return arrayOfHtmlFragments.join('\n');
}
