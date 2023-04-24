//to-do: get sponsorable contributors
import { graphql } from '@octokit/graphql';
import { GraphQlQueryResponseData, RequestParameters } from '@octokit/graphql/dist-types/types';
import { Contributor } from './gitHubContributorFetcher';

export interface GithubSponsorable {
    login: string;
    sponsorsListing: {
        name: string | null;
        dashboard: string | null;
    };
}

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

export class SponsorableFetcher {
    public async fetchSponsorablesInformation(
        token: string,
        query: string,
        contributors: Map<string, Contributor[]>
    ): Promise<Map<string, GithubSponsorable[]>> {
        const sponsorableUsers = [];
        const sponsorableUsersAndOrgs = new Map<string, GithubSponsorable[]>();

        for (const [repoId, users] of contributors) {
            for (const contributor of users) {
                const userLogin = contributor.login;

                const variables: Variables = { queryString: userLogin };
                const response = await this.fetchSponsorable(token, variables, query);

                for (const user of response) {
                    if (user.sponsorsListing?.name) {
                        sponsorableUsers.push(user);
                    }
                }

                sponsorableUsersAndOrgs.set(repoId, sponsorableUsers);
            }
        }

        return sponsorableUsersAndOrgs;
    }

    public async fetchSponsorable(
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
