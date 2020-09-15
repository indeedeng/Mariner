import { GitHubIssueFetcher } from './gitHubIssueFetcher';
import * as mariner from './mariner/index'; // This is used during development

export interface Issue {
    title: string;
    createdAt: string;
    repositoryNameWithOwner: string;
    url: string;
}

export class IssueFinder {
    private readonly logger: mariner.Logger;
    private readonly fetcher: GitHubIssueFetcher;

    public constructor(logger: mariner.Logger) {
        this.logger = logger;
        this.fetcher = new GitHubIssueFetcher(logger);
    }

    public async findIssues(
        token: string,
        labels: string[],
        repositoryIdentifiers: string[]
    ): Promise<Issue[]> {
        // TODO: loop through all the labels
        const label = labels.shift() || '';
        const result = await this.fetcher.fetchMatchingIssues(token, label, repositoryIdentifiers);
        const issues = result.edges.map((edge) => {
            const issue: Issue = {
                title: edge.node.title,
                createdAt: edge.node.createdAt,
                repositoryNameWithOwner: edge.node.repository.nameWithOwner,
                url: edge.node.url,
            };

            return issue;
        });

        return issues;
    }
}
