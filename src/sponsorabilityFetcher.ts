import { Config } from './config';
import { Contributor, ContributorFetcher } from './contributorFetcher';
import { graphql, GraphQlQueryResponseData } from '@octokit/graphql';
import { RequestParameters } from '@octokit/graphql/dist-types/types';

// query WIP:
const queryTemplate = `query fetchSponsorable($userLogin: String!) {
  user(login: $userLogin) {
    ... on Sponsorable {
      sponsors(first: 10) {
        totalCount
        nodes {
          ... on User { login, name, url  }
          ... on Organization { login, name, url }
        }
      }
    }
  }
}`;

interface Variables extends RequestParameters {
    userLogin: string;
}

export class SponsorabilityFetcher {
    private readonly config: Config;

    public constructor(config: Config) {
        this.config = config;
    }

    public async fetchSponsorabilityInformation(
        token: string,
        fileDir: string
    ): Promise<Contributor[]> {
        const fetchSponsorableContributors = new ContributorFetcher(this.config);
        const allContributors = fetchSponsorableContributors.fetchContributors(token, fileDir);
        // To-do:
        // Add types to unpack data from graphql query, look at docs to add what I miss
        // create function that loops thorugh each contributor and fetch sponsorable info
        //

        const login = 'filiptronicek'; // example data from community discussion  https://github.com/community/community/discussions/3818
        // outputs : { user: { sponsors: { totalCount: 5, nodes: [Array] } } }

        const variables: Variables = { userLogin: `${login}` };
        const sponsorableData = await this.fetchSponsorData(token, variables, queryTemplate);
        console.log(sponsorableData);

        return allContributors;
    }

    public async fetchSponsorData(
        token: string,
        variables: Variables,
        query: string
    ): Promise<GraphQlQueryResponseData> {
        const graphqlWithAuth = graphql.defaults({
            headers: { authorization: `token ${token}` },
        });

        const response: GraphQlQueryResponseData = await graphqlWithAuth(query, variables);

        return response;
    }
}
