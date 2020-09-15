import { GitHubIssueFetcher, GitHubIssue } from './gitHubIssueFetcher';
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
            const node = edge.node;
            const issue = this.convertFromGitHubIssue(node);
            return issue;
        });

        return issues;
    }

    private convertFromGitHubIssue(node: GitHubIssue): Issue {
        const issue: Issue = {
            title: node.title,
            createdAt: node.createdAt,
            repositoryNameWithOwner: node.repository.nameWithOwner,
            url: node.url,
        };
        return issue;
    }
}
