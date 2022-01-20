import { DateTime } from 'luxon';

export function calculateAgeInWholeDays(isoDateString: string, now: DateTime): number {
    const createdAt = DateTime.fromISO(isoDateString);
    const ageInDays = now.diff(createdAt, 'days').days;
    const ageInWholeDays = Math.round(ageInDays);

    return ageInWholeDays;
}

export function removeBracesAndBrackets(issueTitle: string): string {
    const withoutBracesOrBrackets = issueTitle
        .replace(/{/g, '(')
        .replace(/}/g, ')')
        .replace(/\[/g, '(')
        .replace(/\]/g, ')');

    return withoutBracesOrBrackets;
}
