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
    ): Promise<Record<string, Issue[]>> {
        const promises = labels.map(async (label) => {
            const result = await this.fetcher.fetchMatchingIssues(
                token,
                label,
                repositoryIdentifiers
            );
            return result.edges;
        });

        const arraysOfEdges = await Promise.all(promises);
        const edges = arraysOfEdges.flat();

        const arrayOfIssues = edges.map((edge) => {
            const node = edge.node;
            const issue = this.convertFromGitHubIssue(node);

            return issue;
        });

        const uniqueIssues = this.omitDuplicates(arrayOfIssues);

        const issuesByRepo: Record<string, Issue[]> = {};
        uniqueIssues.forEach((issue) => {
            const repo = issue.repositoryNameWithOwner;
            const existing = issuesByRepo[repo] || [];
            existing.push(issue);
            issuesByRepo[repo] = existing;
        });

        return issuesByRepo;
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

    private omitDuplicates(issues: Issue[]): Issue[] {
        const map = new Map<string, Issue>();
        issues.forEach((issue) => {
            map.set(issue.url, issue);
        });
        const uniqueIssues: Issue[] = Array.from(map.values());
        return uniqueIssues;
    }
}
