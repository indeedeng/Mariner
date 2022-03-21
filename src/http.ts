import axios, { AxiosResponse } from 'axios';
import { TabDepthLogger } from './tab-level-logger';

export interface HttpClient {
    get(url: string): Promise<string>;
}

type Headers = { 'User-Agent': string; Authorization: string };

export class FetchHttpClient {
    private readonly headers: Headers;

    constructor(authorizationToken: string) {
        this.headers = {
            'User-Agent': 'request',
            Authorization: 'token ' + authorizationToken,
        };
    }

    public get(url: string): Promise<string> {
        return axios(url, { headers: this.headers }).then((resp) => {
            this.checkForRateLimiting(resp);

            return resp.data();
        });
    }

    private checkForRateLimiting(response: AxiosResponse): void {
        if (response.status === 403) {
            TabDepthLogger.error(0, 'RATE LIMITED');
        }

        return;
    }
}
