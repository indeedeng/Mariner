import { Config } from './config';
import { Contributor, ContributorFetcher } from './contributorFetcher';
import { graphql } from '@octokit/graphql'; // GraphQlQueryResponseData
import { RequestParameters } from '@octokit/graphql/dist-types/types';

interface User {
    login: string;
    name: string;
    url: string;
}

interface Organization {
    login: string;
    url: string;
    bio: string;
}
interface Sponsorable {
    user: {
        sponsors: {
            totalCount: number; // total  sponsor count
            nodes: {
                user: User[];
                organization: Organization[];
            };
        };
    };
}
// query WIP: fetchiing first 10 sponsors, need to add pagination
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

        console.log(sponsorData.length);

        return allContributors;
    }

    public async fetchContributorsSponsorInformation(
        token: string,
        query: string,
        contributors: Contributor[]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): Promise<any> {
        console.log(contributors.length);
        // const testContributorArray = [{ login: 'filiptronicek' }, { login: 'mvdan' }]; // test data

        const contributorSponsorInfo = new Map();

        for (const contributor of contributors) {
            // Add Contributors here
            const userLogin = contributor.login;

            const variables: Variables = { userLogin };

            const response = await this.fetchSponsorData(token, variables, query);

            console.log(response);
            // console.log(response.user.sponsors.nodes.user);

            // contributorSponsorInfo.set(
            //     response.user.sponsors.nodes.user,
            //     response.user.sponsors.nodes.organization
            // );
        }

        return contributorSponsorInfo;
        // outputs : { user: { sponsors: { totalCount: 5, nodes: [Array] } } }
    }

    public async fetchSponsorData(
        token: string,
        variables: Variables,
        query: string
    ): Promise<Sponsorable> {
        const graphqlWithAuth = graphql.defaults({
            headers: { authorization: `token ${token}` },
        });

        const response: Sponsorable = await graphqlWithAuth(query, variables);

        return response;
    }
}
