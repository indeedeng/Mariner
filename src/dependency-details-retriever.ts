import { DateTime } from 'luxon';
import { RequestQueue, RequesteQueueEntry } from './request-queue';
import { OwnerDataCollection } from './owner-data-collection';
import { sleep } from './utils';
import { DataFetcher, RequestParams } from './data-fetcher';
import { TabDepthLogger } from './tab-level-logger';
import { FetchHttpClient, HttpClient } from './http';

const REQUEST_DELAY_MS = 1400;
const RELEVANT_LABELS = ['good+first+issue', 'help+wanted', 'documentation'];
const MIN_ISSUE_DATE = DateTime.local().minus({ days: 365 }).toISO();

abstract class BaseRestfulGithubDataFetcher<T> extends DataFetcher<T> {
    protected httpClient: HttpClient;

    constructor(httpClient: HttpClient) {
        super();
        this.httpClient = httpClient;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected extractFundingUrl(responseJson: any, requestUrl: string): string | null {
        if (Array.isArray(responseJson)) {
            for (const file of responseJson) {
                if (file.name.toLowerCase() === 'funding.yml') {
                    return file.html_url;
                }
            }
        } else if (Object.prototype.hasOwnProperty.call(responseJson, 'message')) {
            const err = new Error(responseJson.message);
            const errorMessage = this.createErrorMessage(err, requestUrl);
            TabDepthLogger.error(0, errorMessage);
        }

        return null;
    }
    protected createErrorMessage(err: Error, requestUrl: string): string {
        return `on request: ${requestUrl}\n${err.stack}`;
    }

    protected getURL(params: RequestParams, type: string | null = 'api'): string {
        let baseUrl = 'github.com';
        if (type === 'api') {
            baseUrl = `api.${baseUrl}/repos`;
        }

        return `https://${baseUrl}/${params.owner}/${params.repo}`;
    }

    // TODO: Factor out other commonalities between the three RESTful fetchers here.
}

class RestfulOwnersDataFetcher extends BaseRestfulGithubDataFetcher<string | null> {
    public executeRequest(params: RequestParams): Promise<string | null> {
        const requestUrl = 'https://api.github.com/repos/' + params.owner + '/.github/contents/';

        return this.httpClient
            .get(requestUrl)
            .then((responseText) => {
                const responseJson = JSON.parse(responseText);

                return this.extractFundingUrl(responseJson, requestUrl);
            })
            .catch((err) => {
                const errorMessage = this.createErrorMessage(err, requestUrl);
                throw new Error(errorMessage);
            });
    }

    public updateOwnerDataCollection(
        params: RequestParams,
        fundingUrl: string | null,
        ownerDataCollection: OwnerDataCollection
    ): void {
        ownerDataCollection.updateOwnerData(params.owner, (ownerData) => {
            ownerData.funding_url = fundingUrl;

            return ownerData;
        });
    }
}

class RestfulDependenciesDataFetcher extends BaseRestfulGithubDataFetcher<string | null> {
    public executeRequest(params: RequestParams): Promise<string | null> {
        const requestUrl = this.getURL(params) + '/contents/.github/';

        return this.httpClient
            .get(requestUrl)
            .then((responseText) => {
                const responseJson = JSON.parse(responseText);

                return this.extractFundingUrl(responseJson, requestUrl);
            })
            .catch((err) => {
                const errorMessage = this.createErrorMessage(err, requestUrl);
                throw new Error(errorMessage);
            });
    }

    public updateOwnerDataCollection(
        params: RequestParams,
        fundingUrl: string | null,
        ownerDataCollection: OwnerDataCollection
    ): void {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ownerDataCollection.updateRepoData(params.owner, params.repo as string, (_) => {
            const libraryUrl = this.getURL(params);

            return {
                funding_url: fundingUrl,
                html_url: this.getURL(params, null),
                count: ownerDataCollection.getDependentCountForLibrary(libraryUrl),
                issues: {},
            };
        });
    }
}

type LanguageAndOpenIssuesCount = { language: string; openIssuesCount: number; archived: boolean };

class RestfulLanguageAndIssuesDataFetcher extends BaseRestfulGithubDataFetcher<
    LanguageAndOpenIssuesCount
> {
    public executeRequest(params: RequestParams): Promise<LanguageAndOpenIssuesCount> {
        const requestUrl = this.getURL(params);
        TabDepthLogger.info(2, `Querying: ${requestUrl}`);

        return this.httpClient
            .get(requestUrl)
            .then((responseText) => {
                const responseJson = JSON.parse(responseText);

                return {
                    language: responseJson.language as string,
                    openIssuesCount: responseJson.open_issues_count as number,
                    archived: responseJson.archived as boolean,
                };
            })
            .catch((err) => {
                const errorMessage = this.createErrorMessage(err, requestUrl);
                throw new Error(errorMessage);
            });
    }

    public updateOwnerDataCollection(
        params: RequestParams,
        languageAndOpenIssuesCount: LanguageAndOpenIssuesCount,
        ownerDataCollection: OwnerDataCollection
    ): void {
        ownerDataCollection.updateRepoData(params.owner, params.repo as string, (repoData) => {
            repoData.language = languageAndOpenIssuesCount.language;
            repoData.open_issues_count = languageAndOpenIssuesCount.openIssuesCount;

            return repoData;
        });
    }

    public updateRequestQueue(
        params: RequestParams,
        languageAndOpenIssuesCount: LanguageAndOpenIssuesCount,
        requestQueue: RequestQueue
    ): void {
        if (
            languageAndOpenIssuesCount.openIssuesCount === 0 ||
            languageAndOpenIssuesCount.archived === true
        ) {
            TabDepthLogger.info(4, 'No Open Issues or Repo Is Archived. Skipping!');
            if (languageAndOpenIssuesCount.archived === true) {
                TabDepthLogger.info(3, `repoIsArchived "${params.owner}/${params.repo}"`);
            }
            RELEVANT_LABELS.forEach((label) => {
                const labelDataRequestParams = {
                    owner: params.owner,
                    repo: params.repo,
                    type: 'issues',
                    label,
                };
                requestQueue.dequeueRequest(labelDataRequestParams);
            });
        }
    }
}

class RestfulLabelDataFetcher extends BaseRestfulGithubDataFetcher<Record<string, unknown>[]> {
    public executeRequest(params: RequestParams): Promise<Record<string, unknown>[]> {
        const requestUrl =
            `${this.getURL(params)}/issues?` +
            `since=${MIN_ISSUE_DATE}&` +
            `labels=${params.label}`;
        TabDepthLogger.info(2, `Querying: ${requestUrl}`);

        return this.httpClient
            .get(requestUrl)
            .then((responseText) => {
                const listOfIssues = JSON.parse(responseText);

                return listOfIssues;
            })
            .catch((err) => {
                const errorMessage = this.createErrorMessage(err, requestUrl);
                TabDepthLogger.error(0, errorMessage);
            });
    }

    public updateOwnerDataCollection(
        params: RequestParams,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        listOfIssues: any[],
        ownerDataCollection: OwnerDataCollection
    ): void {
        if (listOfIssues.length > 0) {
            TabDepthLogger.info(5, 'Found Issues!');
            listOfIssues.forEach((issue) => {
                // If the issue is actually a pull request, skip it and move on.
                if (Object.prototype.hasOwnProperty.call(issue, 'pull_request') === true) {
                    return;
                }

                ownerDataCollection.updateIssueData(
                    params.owner,
                    params.repo as string,
                    issue.html_url as string,
                    (issueData) => {
                        if (!issueData) {
                            return {
                                title: issue.title,
                                url: issue.html_url,
                                created_at: issue.created_at,
                                tagged: [(params.label as string).replace(/\+/g, ' ')],
                            };
                        } else {
                            issueData.tagged.push((params.label as string).replace(/\+/g, ' '));

                            return issueData;
                        }
                    }
                );
            });
        }
    }
}

export class DependencyDetailsRetriever {
    public async run(
        githubToken: string,
        inputFilePath: string,
        outputFilePath: string,
        abbreviated = false
    ): Promise<void> {
        const requestQueue = new RequestQueue();
        const ownerDataCollection = new OwnerDataCollection(
            inputFilePath,
            outputFilePath,
            abbreviated
        );
        this.populateRequestQueue(requestQueue, ownerDataCollection, githubToken);
        const totalNumberOfRequests = requestQueue.getNumberOfRequests();
        let nextRequest: RequesteQueueEntry | undefined = requestQueue.popRequest();
        TabDepthLogger.info(0, `Processing ${totalNumberOfRequests} requests`);
        while (nextRequest) {
            const dataFetcher = nextRequest.dataFetcher;
            const requestParams = nextRequest.requestParams;
            await dataFetcher
                .process(requestParams, ownerDataCollection, requestQueue)
                .catch((error) => {
                    TabDepthLogger.error(0, error.message);
                });
            const completedNumberOfRequests =
                totalNumberOfRequests - requestQueue.getNumberOfRequests();
            if (completedNumberOfRequests % 10 === 0) {
                TabDepthLogger.info(
                    0,
                    `Completed: ${completedNumberOfRequests} of ${totalNumberOfRequests}`
                );
            }
            nextRequest = requestQueue.popRequest();
            await sleep(REQUEST_DELAY_MS);
        }
        ownerDataCollection.save();
        TabDepthLogger.info(0, 'Process complete! File saved');
    }

    private populateRequestQueue(
        requestQueue: RequestQueue,
        ownerDataCollection: OwnerDataCollection,
        githubToken: string
    ): void {
        const httpClient = new FetchHttpClient(githubToken);
        const restfulOwnersDataFetcher = new RestfulOwnersDataFetcher(httpClient);
        const restfulDependenciesDataFetcher = new RestfulDependenciesDataFetcher(httpClient);
        const restfulLanguageAndIssuesDataFetcher = new RestfulLanguageAndIssuesDataFetcher(
            httpClient
        );
        const restfulLabelDataFetcher = new RestfulLabelDataFetcher(httpClient);
        for (const owner of ownerDataCollection.getSortedOwners()) {
            const ownerDataRequestParams: RequestParams = {
                owner,
                type: 'funding',
            };
            requestQueue.queueRequest(ownerDataRequestParams, restfulOwnersDataFetcher);
            // *************** */

            // iterate dependencies
            // *************** */
            for (const dependency of ownerDataCollection.getRepos(owner)) {
                // CREATE contents args
                const dependenciesDataRequestParams = {
                    owner,
                    repo: dependency,
                    type: 'funding',
                };
                // *************** */

                // CONTENTS
                requestQueue.queueRequest(
                    dependenciesDataRequestParams,
                    restfulDependenciesDataFetcher
                );

                // LANGUAGE AND OPEN ISSUES
                const languageAndOpenIssuesCountRequestParams = {
                    owner,
                    repo: dependency,
                    type: 'repo',
                };
                requestQueue.queueRequest(
                    languageAndOpenIssuesCountRequestParams,
                    restfulLanguageAndIssuesDataFetcher
                );

                // LABELS
                RELEVANT_LABELS.forEach((label) => {
                    // CREATE labels args
                    const labelDataRequestParams = {
                        owner,
                        repo: dependency,
                        type: 'issues',
                        label,
                    };
                    requestQueue.queueRequest(labelDataRequestParams, restfulLabelDataFetcher);
                });
            }
        }
    }
}
