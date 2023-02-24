import { Config } from './config';
import { Contributor, ContributorFetcher } from './contributorFetcher';
import { graphql } from '@octokit/graphql'; // GraphQlQueryResponseData
import { RequestParameters } from '@octokit/graphql/dist-types/types';

interface Node {
    __typename: string;
    email?: string;
    login: string;
    url: string;
    sponsorsListing: {
        name: string | null;
    };
}

interface User {
    type: string;
    email?: string;
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

        const allUsers = this.convertToUsers(sponsorable);

        return allUsers;
    }

    // const users = await this.filterUserAndOrganization(sponsorable); // mvp returning users for now;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // public filterUserAndOrganization(sponsorable: string[]): any {
    //     sponsorable.forEach((data) => {
    //         console.log(data);
    //     });
    // }

    public convertToUsers(nodes: Node[]): User[] {
        return nodes.map((node) => {
            const user: User = {
                type: node.__typename,
                email: node.email ?? '',
                login: node.login,
                url: node.url,
                sponsorListingName: node.sponsorsListing.name ?? '',
            };

            return user;
        });
    }

    public async fetchContributorsSponsorInformation(
        token: string,
        query: string,
        contributors: Contributor[]
    ): Promise<Node[]> {
        const testContributorsArray = [
            { login: 'mvdan' },
            { login: 'zkat' },
            { login: 'IngridGdesigns' },
        ]; // test data

        // const sponsorInfo: object[] = [];
        console.log(typeof contributors); // currently not being used

        const allcontributorSponsorInfo: Node[] = [];
        for (const contributor of testContributorsArray) {
            const userLogin = contributor.login;
            const variables: Variables = { userLogin };

            const response = await this.fetchSponsorData(token, variables, query);

            response.nodes.forEach((user) => {
                if (user.sponsorsListing?.name && user.__typename === 'User') {
                    allcontributorSponsorInfo.push(...[user]);
                }
            });
        }

        return allcontributorSponsorInfo;
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
