import { Config } from './config';
import { Contributor, ContributorFetcher } from './contributorFetcher';
import { graphql } from '@octokit/graphql'; // GraphQlQueryResponseData
import { RequestParameters } from '@octokit/graphql/dist-types/types';

interface Node {
    __typename: string;
    name: string;
    email: string;
    login: string;
    url: string;
    sponsorListing: {
        name: string;
    };
}

interface User {
    type: string;
    name: string;
    email: string;
    login: string;
    url: string;
    sponsorListingName: string;
}

// interface Organization {
//     type: string;
//     login: string;
//     url: string;
//     sponsorListingName: string;
// }

interface Response {
    search: Sponsorable;
}
interface Sponsorable {
    nodes: Node[];
}

// query WIP: fetchiing first 10 sponsors, need to add pagination
const queryTemplate = `query fetchSponsorable($userLogin: String!) {
  search(query: $userLogin, type: USER, first: 10) {
    nodes {
      ... on User {
        __typename
        name
        email
        login
        url
        sponsorsListing {
          name
        }
      }
        ... on Organization {
        __typename
        login
        url
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

    public async fetchSponsorabilityInformation(token: string, fileDir: string): Promise<User[]> {
        const fetchSponsorableContributors = new ContributorFetcher(this.config);
        const allContributors = await fetchSponsorableContributors.fetchContributors(
            token,
            fileDir
        );

        const sponsorable = await this.fetchContributorsSponsorInformation(
            token,
            queryTemplate,
            allContributors
        );
        console.log(`Line 69 ${JSON.stringify(sponsorable)}`);

        const allUsers = this.convertToUsers(sponsorable);

        // const users = await this.filterUserAndOrganization(sponsorable); // mvp returning users for now;

        return allUsers;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // public filterUserAndOrganization(sponsorable: string[]): any {
    //     sponsorable.forEach((data) => {
    //         console.log(data);
    //     });
    // }

    public convertToUsers(nodes: Node[]): User[] {
        return nodes.map((node) => {
            return {
                type: node.__typename,
                name: node.name,
                email: node.email,
                login: node.login,
                url: node.url,
                sponsorListingName: node.sponsorListing.name,
            };
        });
    }

    public async fetchContributorsSponsorInformation(
        token: string,
        query: string,
        contributors: Contributor[]
    ): Promise<Node[]> {
        const testContributorsArray = [{ login: 'mvdan' }, { login: 'zkat' }]; // test data
        const contributorSponsorInfo: Node[] = [];
        console.log(contributors.length); // currently not being used

        for (const contributor of testContributorsArray) {
            const userLogin = contributor.login;
            const variables: Variables = { userLogin };

            const response = await this.fetchSponsorData(token, variables, query);

            response.nodes.forEach((node) => {
                // seperate function after mvp
                if (node.sponsorListing !== null && node.__typename === 'User') {
                    contributorSponsorInfo.push(node);
                }
            });
        }

        return contributorSponsorInfo;
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

//  if (sponsorable.sponsorListing !== null && sponsorable.__typename === 'User') {
//                 const user: User = {
//                     type: sponsorable.__typename,
//                     name: sponsorable.name,
//                     email: sponsorable.email,
//                     login: sponsorable.login,
//                     url: sponsorable.url,
//                     sponsorListingName: sponsorable.sponsorListing.name,
//                 };
// deall with orgs later
// if (sponsorable.sponsorListing !== null && sponsorable.__typename === 'Organization') {
//     const organization: Organization = {
//         type: sponsorable.__typename,
//         login: sponsorable.login,
//         url: sponsorable.url,
//         sponsorListingName: sponsorable.sponsorListing.name,
//     };

//     return organization;
// }

// response.nodes.forEach((node) => {
//     console.log('this is the node', node);
// if (node.sponsorListing !== null && node.__typename === 'User') {
//     const user: User = {
//         type: node.__typename,
//         name: node.name,
//         email: node.email,
//         login: node.login,
//         url: node.url,
//         sponsorListingName: node.sponsorListing.name,
//     };
//     contributorSponsorInfo.push(user);
// }
// });

// contributorSponsorInfo.push(response.nodes);
