import { Config } from './config';
import { ContributionCountOfUserIntoRepo, ContributorFetcher } from './contributorFetcher';
import { graphql } from '@octokit/graphql';
import { RequestParameters } from '@octokit/graphql/dist-types/types';
import { ReposFetcher } from './reposFetcher';
import { createTsv } from './createTsv';

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

export interface User {
    type: string; // may not be needed here after sorting in Node
    repoIdentifier: string;
    email?: string;
    login: string;
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

    public async fetchSponsorabilityInformation(
        token: string,
        repositoryIdentifiers: string[]
    ): Promise<User[]> {
        const fetchSponsorableContributors = new ContributorFetcher(this.config);
        const allContributors = await fetchSponsorableContributors.fetchContributors(
            token,
            repositoryIdentifiers
        );

        const sponsorable = await this.fetchContributorsSponsorInformation(
            token,
            queryTemplate,
            allContributors
        );

        const allSponsorableUsers = this.convertToUsers(sponsorable, allContributors);

        // WIP
        const fetchRepos = new ReposFetcher(this.config);
        const allRepos = await fetchRepos.fetchSponsorableRepoInfo(token, allSponsorableUsers);

        createTsv(allRepos);
        //

        return allSponsorableUsers;
    }

    public fetchContributionCountOfUserAndRepo(
        userLogin: string,
        contributors: ContributionCountOfUserIntoRepo[]
    ): [number, string] {
        const contributionsAndRepoIds: [number, string] = [0, '']; // Tuples

        contributors.forEach((contributor) => {
            if (userLogin === contributor.login) {
                contributionsAndRepoIds[0] = contributor.contributions;
                contributionsAndRepoIds[1] = contributor.repoIdentifier;
            }
        });

        return contributionsAndRepoIds;
    }

    public convertToUsers(nodes: Node[], contributors: ContributionCountOfUserIntoRepo[]): User[] {
        const allUsers = nodes.map((node) => {
            const contributionAndRepoId = this.fetchContributionCountOfUserAndRepo(
                node.login,
                contributors
            );
            const contributionsCount = contributionAndRepoId[0];
            const repoIdentifier = contributionAndRepoId[1];

            return {
                type: node.__typename,
                repoIdentifier: repoIdentifier ?? '',
                email: node.email ?? '',
                login: node.login,
                url: `https://github.com/${node.login}`,
                sponsorListingName: node.sponsorsListing.name ?? '',
                sponsorsLink: node.sponsorsListing.dashboard ?? '',
                contributionsCount: contributionsCount ?? 0,
            };
        });

        return allUsers;
    }

    public async fetchContributorsSponsorInformation(
        token: string,
        query: string,
        contributors: ContributionCountOfUserIntoRepo[]
    ): Promise<Node[]> {
        // const testContributorsArray = [
        //     { login: 'mvdan', contributions: 4 },
        //     { login: 'zkat', contributions: 2 },
        //     { login: 'IngridGdesigns', contributions: 2 },
        // ]; // test data

        // console.log(typeof contributors); // currently not being used

        const allSponsorableUsersInfo: Node[] = [];

        for (const contributor of contributors) {
            const userLogin = contributor.login;
            const variables: Variables = { userLogin };
            const response = await this.fetchSponsorData(token, variables, query);

            response.nodes.forEach((user) => {
                if (user.sponsorsListing?.name && user.__typename === 'User') {
                    allSponsorableUsersInfo.push(...[user]);
                }
            });
        }

        return allSponsorableUsersInfo;
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
