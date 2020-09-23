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

        const gitHubIssues: GitHubIssue[] = [];
        for (const label of labels) {
            const result = await this.fetcher.fetchMatchingIssues(
                token,
                label,
                repositoryIdentifiers
            );
            gitHubIssues.push(...result);
        }

        const arrayOfIssues = gitHubIssues.map((gitHubIssue) => {
            const issue = this.convertFromGitHubIssue(gitHubIssue);

            return issue;
        });

        return arrayOfIssues;
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
