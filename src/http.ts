import fetch, { Response } from 'node-fetch';

export interface IHttpClient {
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
        return fetch(url, { headers: this.headers }).then((resp) => {
            this.checkForRateLimiting(resp);

            return resp.text();
        });
    }

    private checkForRateLimiting(response: Response): void {
        if (response.status === 403) {
            console.error('RATE LIMITED');
        }

        return;
    }
}
