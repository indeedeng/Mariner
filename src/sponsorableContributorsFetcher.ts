import { Config } from './config';
import { ContributionCountOfUserIntoRepo } from './types';
import { graphql } from '@octokit/graphql';
import { GraphQlQueryResponseData, RequestParameters } from '@octokit/graphql/dist-types/types';

export interface GithubSponsorable {
    __typename: string;
    email?: string;
    login: string;
    url: string;
    sponsorsListing: {
        name: string | null;
        dashboard: string | null;
    };
}

// query WIP: fetchiing first 10 sponsors, need to add pagination
export const queryTemplate = `query fetchSponsorable($queryString: String!) {
  search(query: $queryString, type: USER, first: 10) {
    nodes {
      ... on User {
        __typename
        email
        login
        url
        sponsorsListing {
          name
          dashboardUrl
        }
      }
        ... on Organization {
        __typename
        login
        url
        sponsorsListing {
          name
          dashboardUrl
        }
      }
    }
  }
}`;

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
        contributors: ContributionCountOfUserIntoRepo[]
    ): Promise<GithubSponsorable[]> {
        const sponsorableUsers = [];

        for (const contributor of contributors) {
            const userLogin = contributor.login;

            const variables: Variables = { queryString: userLogin };
            const response = await this.fetchSponsorableContributor(token, variables, query);

            for (const user of response) {
                if (user.sponsorsListing?.name && user.__typename === 'User') {
                    sponsorableUsers.push(user);
                }
            }
        }

        return sponsorableUsers;
    }

    public async fetchSponsorableContributor(
        token: string,
        variables: Variables,
        query: string
    ): Promise<GithubSponsorable[]> {
        const graphqlWithAuth = graphql.defaults({
            headers: { authorization: `token ${token}` },
        });

        const response: GraphQlQueryResponseData = await graphqlWithAuth(query, variables);

        const result = response.search.nodes as GithubSponsorable[];

        return result;
    }
}
