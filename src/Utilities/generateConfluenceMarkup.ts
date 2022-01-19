import { DateTime } from 'luxon';
import { Issue } from '../mariner';

export function generateConfluenceMarkup(
    issuesByDependency: Map<string, Issue[]>,
    maxIssuesAge = 30
): string {
    const now = DateTime.utc();

    const markupArray: string[] = [];

    markupArray.push(`h2. Updated: ${now.toISO()}`);

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

        markupArray.push('\n');
        markupArray.push(`h3. ${dependency}`);
        markupArray.push('||*Title*||*Age*||');

        relevantIssues.forEach((issue) => {
            const ageInWholeDays = calculateAgeInWholeDays(issue.createdAt, now);

            const cleanedTitleMarkup = cleanMarkup(issue.title);
            markupArray.push(`|[${cleanedTitleMarkup}|${issue.url}]|${ageInWholeDays}&nbsp;days|`);
        });
    }

    return markupArray.join('\n');
}

export function calculateAgeInWholeDays(isoDateString: string, now: DateTime): number {
    const createdAt = DateTime.fromISO(isoDateString);
    const ageInDays = now.diff(createdAt, 'days').days;
    const ageInWholeDays = Math.round(ageInDays);

    return ageInWholeDays;
}

export function cleanMarkup(issueTitle: string): string {
    const withoutBracesOrBrackets = issueTitle
        .replace(/{/g, '(')
        .replace(/}/g, ')')
        .replace(/\[/g, '(')
        .replace(/\]/g, ')');

    return withoutBracesOrBrackets;
}
