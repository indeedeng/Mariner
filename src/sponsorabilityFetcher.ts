import { Config } from './config';
import { Contributor, ContributorFetcher } from './contributorFetcher';
import { graphql } from '@octokit/graphql'; // GraphQlQueryResponseData
import { RequestParameters } from '@octokit/graphql/dist-types/types';

// interface User {
//     name: string;
//     email: string;
//     login: string;
//     url: string;
//     bio: string;
//     sponsorListing: {
//         name: string;
//     };
// }

// interface Organization {
//     login: string;
//     url: string;
//     sponsorListing: {
//         name: string;
//     };
// }
// interface Sponsorable {
//     user: {
//         sponsors: {
//             totalCount: number; // total  sponsor count
//             nodes: {
//                 user: User[];
//                 organization: Organization[];
//             };
//         };
//     };
// }
// query WIP: fetchiing first 10 sponsors, need to add pagination
const queryTemplate = `query fetchSponsorable($userLogin: String!) {
  search(query: $userLogin, type: USER, first: 100) {
    nodes {
      ... on Organization {
        login
        url
        sponsorsListing {
          name
        }
      }
      ... on User {
        name
        email
        login
        url
        bio
        sponsorsListing {
          name
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
        console.log(`Line 69 ${JSON.stringify(sponsorData)}`);
        console.log(sponsorData.length);

        return allContributors;
    }

    public async fetchContributorsSponsorInformation(
        token: string,
        query: string,
        contributors: Contributor[]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): Promise<any> {
        console.log(`LINE 81 ${contributors.length}`);
        // const testContributorArray = [{ login: 'filiptronicek' }, { login: 'mvdan' }]; // test data

        const contributorSponsorInfo = new Map();

        for (const contributor of contributors) {
            // Add Contributors here
            const userLogin = contributor.login;

            const variables: Variables = { userLogin };

            const response = await this.fetchSponsorData(token, variables, query);

            console.log(`Line 94 ${JSON.stringify(response)}`);
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): Promise<any> {
        const graphqlWithAuth = graphql.defaults({
            headers: { authorization: `token ${token}` },
        });

        const response = await graphqlWithAuth(query, variables);

        return response;
    }
}

// add needed scopes to read me
/*
message: "Your token has not been granted the required scopes to execute this query.
The 'email' field requires one of the following scopes: ['user:email', 'read:user'],
but your token has only been granted the: ['read:org'] scopes.
Please modify your token's scopes at: https://github.com/settings/tokens."
*/
