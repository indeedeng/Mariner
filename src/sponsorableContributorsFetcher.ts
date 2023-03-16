import { Config } from './config';
import { ContributionCountOfUserIntoRepo, RepositoryName } from './contributorFetcher';
import { graphql } from '@octokit/graphql';
import { GraphQlQueryResponseData, RequestParameters } from '@octokit/graphql/dist-types/types';

export interface Sponsorable {
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
        contributors: Map<RepositoryName, ContributionCountOfUserIntoRepo[]>
    ): Promise<Map<string, Sponsorable[]>> {
        const allSponsorableUsersInfo = [];
        const sponsorables = new Map<string, Sponsorable[]>();

        for (const [repoIdentifier] of contributors) {
            const users = contributors.get(repoIdentifier);

            if (!users) {
                throw new Error(`Error when accessing this user: ${users} login `);
            }

            for (const contributor of users) {
                const userLogin = contributor.login;

                const variables: Variables = { queryString: userLogin };
                const response = await this.fetchSponsorableContributor(token, variables, query);

                for (const user of response) {
                    if (user.sponsorsListing?.name && user.__typename === 'User') {
                        allSponsorableUsersInfo.push({ repoId: contributor.repoIdentifier, user });
                    }
                }
            }

            // need to refactor:
            //  - weird loop to help eliminate duplication error when inserting into map
            const all: Sponsorable[] = [];

            allSponsorableUsersInfo.forEach((sponsorable) => {
                if (repoIdentifier === sponsorable.repoId) {
                    all.push(...[sponsorable.user]);
                    sponsorables.set(repoIdentifier, all);
                }
            });
        }

        return sponsorables;
    }

    public async fetchSponsorableContributor(
        token: string,
        variables: Variables,
        query: string
    ): Promise<Sponsorable[]> {
        const graphqlWithAuth = graphql.defaults({
            headers: { authorization: `token ${token}` },
        });

        const response: GraphQlQueryResponseData = await graphqlWithAuth(query, variables);

        const result = response.search.nodes as Sponsorable[];

        return result;
    }
}

// const testContributorsArray = [
//     { login: 'mvdan', contributions: 4 },
//     { login: 'zkat', contributions: 2 },
//     { login: 'IngridGdesigns', contributions: 2 },
// ]; // test data
