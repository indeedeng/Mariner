import { DateTime } from 'luxon';
import { Issue } from '../mariner';
import { calculateAgeInWholeDays, removeBracesAndBrackets } from '../Utilities/outputHelpers';

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
        markupArray.push('||*Title*||*Age*||Languages*||');

        relevantIssues.forEach((issue) => {
            const ageInWholeDays = calculateAgeInWholeDays(issue.createdAt, now);
            const cleanedTitleMarkup = removeBracesAndBrackets(issue.title);
            markupArray.push(
                `|[${cleanedTitleMarkup}|${issue.url}]|${ageInWholeDays}&nbsp;days|${issue.languages}|`
            );
        });
    }

    return markupArray.join('\n');
}
