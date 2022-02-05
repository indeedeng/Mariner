import { DateTime } from 'luxon';
import { Issue } from '../mariner';
import { removeBracesAndBrackets, calculateAgeInWholeDays } from '../Utilities/outputHelpers';

export function generateGitHubMarkdown(
    issuesByDependency: Map<string, Issue[]>,
    maxIssuesAge = 30
): string {
    const now = DateTime.utc();
    const markdownArray: string[] = [];
    markdownArray.push(`## Updated: ${now.toISO()}`);

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

        markdownArray.push('\n');
        markdownArray.push(`### ${dependency}`);
        markdownArray.push('|**Title**|**Age**|');
        markdownArray.push('|:----|:----|');

        relevantIssues.forEach((issue) => {
            const ageInWholeDays = calculateAgeInWholeDays(issue.createdAt, now);
            const cleanTitleMarkdown = removeBracesAndBrackets(issue.title);
            markdownArray.push(
                `|[${cleanTitleMarkdown}|${issue.url}]|${ageInWholeDays}&nbsp;days|`
            );
        });
    }

    return markdownArray.join('\n');
}
