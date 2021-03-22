import { DateTime } from 'luxon';
import { Issue } from '../mariner';

export function generateConfluenceMarkdown(
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
        markdownArray.push(`h3. ${dependency}`);
        markdownArray.push('||*Title*||*Age*||');

        relevantIssues.forEach((issue) => {
            const ageInWholeDays = calculateAgeInWholeDays(issue.createdAt, now);

            const cleanedTitleMarkdown = cleanMarkdown(issue.title);
            markdownArray.push(
                `|[${cleanedTitleMarkdown}|${issue.url}]|${ageInWholeDays}&nbsp;days|`
            );
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

export function cleanMarkdown(issueTitle: string): string {
    const withoutBracesOrBrackets = issueTitle
        .replace(/{/g, '(')
        .replace(/}/g, ')')
        .replace(/\[/g, '(')
        .replace(/\]/g, ')');

    return withoutBracesOrBrackets;
}
