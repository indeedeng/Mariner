import { DateTime } from 'luxon';
import { Issue } from '../mariner';

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
            markdownArray.push(`|[${issue.title}|${issue.url}]|${ageInWholeDays}&nbsp;days|`);
        });
    }

    return markdownArray.join('\n');
}

export function calculateAgeInWholeDays(isoDateString: string, now: DateTime): number {
    const createdAt = DateTime.fromISO(isoDateString);
    const ageInDays = now.diff(createdAt, 'days').days;
    const ageInWholeDays = Math.round(ageInDays);

    return ageInWholeDays;
}
