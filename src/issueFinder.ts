import { GitHubIssueFetcher } from './gitHubIssueFetcher';
import * as mariner from './mariner/index'; // This is used during development

interface Issue {
    // TODO: Flesh this out
}

export class IssueFinder {
    private readonly logger: mariner.Logger;
    private readonly fetcher: GitHubIssueFetcher;

    public constructor(logger: mariner.Logger) {
        this.logger = logger;
        this.fetcher = new GitHubIssueFetcher(logger);
    }

    public async findIssues(token: string, labels: string[], repositoryIdentifiers: string[]): Promise<Issue[]> {
        // TODO: loop through all the labels
        const label = labels.shift() || '';

        const result = await this.fetcher.fetchMatchingIssues(token, label, repositoryIdentifiers);
        const issues = result.edges.map((edge) => {
            // TODO: Create a real issue here
            return {};
        });

        return issues;
    }
}

