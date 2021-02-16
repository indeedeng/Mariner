import { DateTime } from 'luxon';
import { Issue } from '../mariner';

export function generateConfluenceMarkdown(
    issuesByDependency: Map<string, Issue[]>,
    maxIssuesAge = 30
): string {
    const now = DateTime.local();

    const markdownArray: string[] = [];

    markdownArray.push(`## Updated: ${now.toLocaleString(DateTime.DATETIME_FULL)}`);
    for (const dependency in issuesByDependency) {
        const issues = issuesByDependency.get(dependency);
        if (!issues || !issues.length) {
            continue;
        }

        markdownArray.push('\n');
        markdownArray.push(`h3. ${dependency}`);
        markdownArray.push('||*Title*||*Age*||');

        issues?.forEach((issue) => {
            const createdAt = DateTime.fromISO(issue.createdAt);
            const ageInDays = now.diff(createdAt, 'days').days;
            const ageInWholeDays = Math.round(ageInDays);

            if (ageInWholeDays < maxIssuesAge) {
                markdownArray.push(`|[${issue.title}|${issue.url}]|${ageInWholeDays}&nbsp;days|`);
            }
        });
    }

    return markdownArray.join('\n');
}

// cleanMarkdown = markdownArray.replace(/{|}/g, ''); // TODO: this will be done somewhere else...
