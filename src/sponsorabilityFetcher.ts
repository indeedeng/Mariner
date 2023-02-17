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
        const allContributors = await fetchSponsorableContributors.fetchContributors(
            token,
            fileDir
        );

        const sponsorData = await this.fetchContributorsSponsorInformation(
            token,
            queryTemplate,
            allContributors
        );

        console.log(sponsorData);

        return allContributors;
    }

    public async fetchContributorsSponsorInformation(
        token: string,
        query: string,
        contributors: Contributor[]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): Promise<any> {
        console.log(contributors.length);
        const testContributorArray = [{ login: 'filiptronicek' }, { login: 'IngridGdesigns' }]; // test data
        let contributorSponsorInfo;

        for (const contributor of testContributorArray) {
            // Add Contributors here
            const userLogin = contributor.login;
            const variables: Variables = { userLogin };
            console.log(variables);

            const response = await this.fetchSponsorData(token, variables, query);
            console.log(response);
            // contributorSponsorInfo.push(...[response]);
        }

        return contributorSponsorInfo;
        // outputs : { user: { sponsors: { totalCount: 5, nodes: [Array] } } }
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
