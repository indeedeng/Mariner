import { DateTime } from 'luxon';
import { Issue } from '../mariner';

export function generateConfluenceMarkdown(
    issuesByDependency: Map<string, Issue[]>,
    maxIssuesAge = 30
): string {
    const now = DateTime.local();

    const markdownArray: string[] = [];

    markdownArray.push(`## Updated: ${now.toLocaleString(DateTime.DATETIME_FULL)}`);

    for (const [dependency, issues] of issuesByDependency) {
        if (!issues || !issues.length) {
            continue;
        }
        issues.forEach((issue) => {
            const createdAt = DateTime.fromISO(issue.createdAt);
            const ageInDays = now.diff(createdAt, 'days').days;
            const ageInWholeDays = Math.round(ageInDays);

            if (ageInWholeDays < maxIssuesAge) {
                markdownArray.push('\n');
                markdownArray.push(`h3. ${dependency}`);
                markdownArray.push('||*Title*||*Age*||');
                const cleanedTitleMarkdown = cleanMarkdown(issue.title);
                markdownArray.push(
                    `|[${cleanedTitleMarkdown}|${issue.url} ]|${ageInWholeDays}&nbsp;days|`
                );
            }
        });
    }

    return markdownArray.join('\n');
}

export function cleanMarkdown(issueTitle: string): string {
    const removedCurlyBraces = issueTitle.replace(/{|}/g, '');

    return removedCurlyBraces;
}
