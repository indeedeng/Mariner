import fs from 'fs';
import { TabDepthLogger } from './tab-level-logger';

type IssueData = {
    title: string;
    url: string;
    createdAt: string;
    tagged: string[];
};

type RepoData = {
    htmlUrl?: string;
    openIssuesCount?: number;
    language?: string;
    fundingUrl?: string;
    count: number;
    issues: { [key: string]: IssueData };
};
type OwnerData = {
    fundingUrl?: string;
    htmlUrl: string;
    dependentCount: number;
    dependencyCount: number;
    repos: { [key: string]: RepoData };
};

export class OwnerDataCollection {
    private readonly libraryUrlToDependentCount: { [key: string]: number };
    private readonly OUTPUT_FILE_PATH = './Temp/analysisOutputRaw.json';
    private readonly abbreviated: boolean;
    private readonly abbreviationThreshold: number = 5;

    private readonly ownersArray: string[] = [];
    private readonly ownerDataMap: { [key: string]: OwnerData } = {};

    constructor(abbreviated: boolean) {
        this.abbreviated = abbreviated;
        const contents = fs.readFileSync('./CountSourceFiles/mini.json', {
            encoding: 'utf8',
        });
        this.libraryUrlToDependentCount = JSON.parse(contents);
        this.initialize();
    }

    public getSortedOwners(): string[] {
        // return a copy so that it cannot be manipulated externally.
        return this.ownersArray.slice();
    }

    public getRepos(owner: string): string[] {
        return Object.keys(this.ownerDataMap[owner].repos);
    }

    public updateOwnerData(
        owner: string,
        updateFunction: (ownerData: OwnerData) => OwnerData
    ): void {
        const ownerData = this.ownerDataMap[owner];
        this.ownerDataMap[owner] = updateFunction(ownerData);
    }

    public updateRepoData(
        owner: string,
        repo: string,
        updateFunction: (repoData: RepoData) => RepoData
    ): void {
        const repoData = this.ownerDataMap[owner].repos[repo];
        this.ownerDataMap[owner].repos[repo] = updateFunction(repoData);
    }

    public updateIssueData(
        owner: string,
        repo: string,
        issue: string,
        updateFunction: (issueData: IssueData) => IssueData
    ): void {
        const issueData = this.ownerDataMap[owner].repos[repo].issues[issue];
        this.ownerDataMap[owner].repos[repo].issues[issue] = updateFunction(issueData);
    }

    public getDependentCountForLibrary(library: string): number {
        return this.libraryUrlToDependentCount[library];
    }

    public hasIssue(owner: string, repo: string, issue: string): boolean {
        return this.ownerDataMap[owner].repos[repo].issues.hasOwnProperty(issue);
    }

    public save(): void {
        fs.writeFileSync(this.OUTPUT_FILE_PATH, JSON.stringify(this.ownerDataMap), {
            encoding: 'utf8',
        });
    }

    private initialize(): void {
        for (const libraryUrl in this.libraryUrlToDependentCount) {
            if (!this.libraryUrlToDependentCount.hasOwnProperty(libraryUrl)) {
                continue;
            }
            // skip the library if it's number of dependents is below the abbreviationThreshold
            const dependentCount = this.libraryUrlToDependentCount[libraryUrl];
            if (this.abbreviated && dependentCount < this.abbreviationThreshold) {
                continue;
            }

            if (libraryUrl.match(/^https:\/\/api.github.com\/repos\//)) {
                const [owner, repo] = libraryUrl
                    .replace('https://api.github.com/repos/', '')
                    .split('/');
                // parse owners master counts out of dependencies list
                if (this.ownerDataMap.hasOwnProperty(owner)) {
                    this.ownerDataMap[owner].dependentCount += dependentCount;
                } else {
                    this.ownersArray.push(owner);
                    this.ownerDataMap[owner] = {
                        htmlUrl: 'https://github.com/' + owner,
                        dependentCount: dependentCount,
                        dependencyCount: 1,
                        repos: {
                            [repo]: {
                                count: dependentCount,
                                issues: {},
                            },
                        },
                    };
                }
                const ownerData = this.ownerDataMap[owner];
                ownerData.dependencyCount = Object.keys(ownerData.repos).length;
            } else {
                TabDepthLogger.info(0, `Not a GitHub Library. Skipping: ${libraryUrl}`);
            }
        }

        // sort the owners master counts
        this.ownersArray.sort((a, b) => {
            const bb = this.ownerDataMap[b];
            const aa = this.ownerDataMap[a];

            return bb.dependentCount - aa.dependentCount;
        });
    }
}
