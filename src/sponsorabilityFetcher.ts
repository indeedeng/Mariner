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
        dashboard: string | null;
    };
}

interface User {
    type: string; // may not be needed here after sorting in Node
    email?: string;
    login: string;
    url: string;
    sponsorListingName: string;
    sponsorsLink: string;
    contributionsCount: number;
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

        const allUsers = this.convertToUsers(sponsorable, allContributors);

        return allUsers;
    }

    public getContributionCount(nodeLogin: string, contributors: Contributor[]): number {
        let count = 0;
        contributors.forEach((contributor) => {
            if (nodeLogin === contributor.login) {
                count = contributor.contributions;
            }
        });

        return count;
    }

    public convertToUsers(nodes: Node[], contributors: Contributor[]): User[] {
        const allUsers = nodes.map((node) => {
            return {
                type: node.__typename,
                email: node.email ?? '',
                login: node.login,
                url: node.url,
                sponsorListingName: node.sponsorsListing.name ?? '',
                sponsorsLink: node.sponsorsListing.dashboard ?? '',
                contributionsCount: this.getContributionCount(node.login, contributors) ?? '',
            };
        });

        return allUsers;
    }

    public async fetchContributorsSponsorInformation(
        token: string,
        query: string,
        contributors: Contributor[]
    ): Promise<Node[]> {
        // const testContributorsArray = [
        //     { login: 'mvdan' },
        //     { login: 'zkat' },
        //     { login: 'IngridGdesigns' },
        // ]; // test data

        console.log(typeof contributors); // currently not being used

        const allcontributorSponsorInfo: Node[] = [];
        for (const contributor of contributors) {
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

//   public filterUserAndOrganization(sponsorable: Node[]): any {
//         sponsorable.forEach((data) => {
//             console.log(data.__typename);
//         });
//     }

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
