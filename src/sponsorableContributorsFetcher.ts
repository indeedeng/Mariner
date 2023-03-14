import { Config } from './config';
import { ContributionCountOfUserIntoRepo, RepositoryName } from './contributorFetcher';
import { graphql } from '@octokit/graphql';
import { RequestParameters } from '@octokit/graphql/dist-types/types';

export interface Sponsor {
    __typename: string;
    email?: string;
    login: string;
    url: string;
    sponsorsListing: {
        name: string | null;
        dashboard: string | null;
    };
}
export interface GithubSponsor {
    __typename: string;
    email?: string;
    login: string;
    url: string;
    sponsorsListing: {
        name: string | null;
        dashboard: string | null;
    };
}

interface Response {
    search: Sponsorable;
}
interface Sponsorable {
    nodes: Sponsor[];
}

interface Variables extends RequestParameters {
    queryString: string;
}

export class SponsorableContributorsFetcher {
    private readonly config: Config;

    public constructor(config: Config) {
        this.config = config;
    }

    public async fetchSponsorableContributorsInformation(
        token: string,
        query: string,
        contributors: Map<RepositoryName, ContributionCountOfUserIntoRepo[]>
    ): Promise<Sponsor[]> {
        const allSponsorableUsersInfo: Sponsor[] = [];

        for (const [repoIdentifier, githubUsers] of contributors) {
            console.log(
                `For each ${repoIdentifier}, the length of contributors: ${contributors.size}`
            ); //  remove later
            for (const contributor of githubUsers) {
                const userLogin = contributor.login;
                const variables: Variables = { queryString: userLogin };
                const response = await this.fetchSponsorData(token, variables, query);

                const results = response.nodes;

                for (const user of results) {
                    if (user.sponsorsListing?.name && user.__typename === 'User') {
                        allSponsorableUsersInfo.push(...[user]);
                    }
                }
            }
        }

        return allSponsorableUsersInfo;
    }

    public async fetchSponsorData(
        token: string,
        variables: Variables,
        query: string
    ): Promise<Sponsorable> {
        const graphqlWithAuth = graphql.defaults({
            headers: { authorization: `token ${token}` },
        });

        const response: Response = await graphqlWithAuth(query, variables);

        const result: Sponsorable = response.search;

        return result;
    }
}

// const testContributorsArray = [
//     { login: 'mvdan', contributions: 4 },
//     { login: 'zkat', contributions: 2 },
//     { login: 'IngridGdesigns', contributions: 2 },
// ]; // test data

// console.log(typeof contributors); // currently not being used
