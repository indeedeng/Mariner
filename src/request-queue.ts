import { OrderedMap } from './utils';
import { DataFetcher, RequestParams } from './data-fetcher';
import { TabDepthLogger } from './tab-level-logger';

export class RequesteQueueEntry {
    public requestParams: RequestParams;
    // tslint:disable-next-line: no-any
    public dataFetcher: DataFetcher<any>;

    // tslint:disable-next-line: no-any
    constructor(requestParams: RequestParams, dataFetcher: DataFetcher<any>) {
        this.requestParams = requestParams;
        this.dataFetcher = dataFetcher;
    }
}

export class RequestQueue {
    private readonly requestQueue: OrderedMap<string, RequesteQueueEntry> = new OrderedMap();

    // tslint:disable-next-line: no-any
    public queueRequest(requestParams: RequestParams, dataFetcher: DataFetcher<any>): void {
        const key = this.createKeyFromParams(requestParams);
        this.requestQueue.add(key, new RequesteQueueEntry(requestParams, dataFetcher));
    }

    public dequeueRequest(requestParams: RequestParams): void {
        const key = this.createKeyFromParams(requestParams);
        TabDepthLogger.info(5, `Dequeuing: ${key}`);
        this.requestQueue.remove(key);
    }

    public popRequest(): RequesteQueueEntry | undefined {
        const key = this.requestQueue.firstKey();
        let request;
        if (key) {
            request = this.requestQueue.get(key);
            this.requestQueue.remove(key);
        }
        return request;
    }

    private createKeyFromParams(params: RequestParams): string {
        const key = `${params.owner}'-'${params.repo}'-'${params.type}'-'${params.label}`;
        return key;
    }
}
