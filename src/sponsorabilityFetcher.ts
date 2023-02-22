import { Config } from './config';
import { Contributor, ContributorFetcher } from './contributorFetcher';
import { graphql } from '@octokit/graphql'; // GraphQlQueryResponseData
import { GraphQlQueryResponseData, RequestParameters } from '@octokit/graphql/dist-types/types';

interface User {
    type: string;
    name: string;
    email: string;
    login: string;
    url: string;
    bio: string;
    sponsorListing: {
        name: string;
    };
}

interface Organization {
    type: string;
    login: string;
    url: string;
    sponsorListing: {
        name: string;
    };
}
interface Sponsorable {
    nodes: [User | Organization];
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
        bio
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

        return allContributors;
    }

    public async fetchContributorsSponsorInformation(
        token: string,
        query: string,
        contributors: Contributor[]
    ): Promise<Sponsorable[]> {
        console.log(`LINE 81 ${contributors.length}`);
        // const testContributorsArray = [{ login: 'mvdan' }]; // test data

        const contributorSponsorInfo = [];

        for (const contributor of contributors) {
            const userLogin = contributor.login;
            const variables: Variables = { userLogin };

            const response = await this.fetchSponsorData(token, variables, query);
            contributorSponsorInfo.push(response);
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

        const response: GraphQlQueryResponseData = await graphqlWithAuth(query, variables);

        const result: Sponsorable = response.search.nodes;

        return result;
    }
}

// const result: IssueCountAndIssues = {
//     issueCount: 0,
//     edges: [],
//     pageInfo: {
//         hasNextPage: true,
//     },
// };
// while (result.pageInfo.hasNextPage) {
//     getLogger().info(`Calling: ${queryId}`);
//     const response = (await graphqlWithAuth(query, variables)) as Response;
//     const issueCountsAndIssues = response.search;
//     getLogger().info(
//         `Fetched: ${queryId} => ` +
//             `${issueCountsAndIssues.edges.length}/${issueCountsAndIssues.issueCount} (${issueCountsAndIssues.pageInfo.hasNextPage})`
//     );
//     const rateLimit = response.rateLimit;
//     getLogger().info(`Rate limits: ${JSON.stringify(rateLimit)}`);
//     variables.after = issueCountsAndIssues.pageInfo.endCursor;
//     result.pageInfo.hasNextPage = issueCountsAndIssues.pageInfo.hasNextPage;
//     result.edges.push(...issueCountsAndIssues.edges);

// add needed scopes to read me
/*output users.... orgs later.
field requires one of the following scopes: ['user:email', 'read:user'],m['read:org'] scopes.
Please modify your token's scopes at: https://github.com/settings/tokens."
*/
