//to-do: get sponsorable contributors
import { graphql } from '@octokit/graphql';
import { GraphQlQueryResponseData, RequestParameters } from '@octokit/graphql/dist-types/types';

export interface GithubSponsorable {
    login: string;
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
