import { Config } from './config';
import { GraphQlQueryResponseData, RequestParameters } from '@octokit/graphql/dist-types/types';
import { User } from './sponsorabilityFetcher';
import { graphql } from '@octokit/graphql';

interface GitHubResponse {
    search: Repos;
}
interface Repos {
    nodes: Node[];
}

interface Node {
    name: string; // repositoryName
    languages: { edges: Languages[] };
}

interface Languages {
    node: {
        name: string;
    };
}

const queryTemplate = `query fetchRepoInfo($login: String!) {
  search(query: $login, type: REPOSITORY, first: 10) {
 nodes {
      ... on Repository {
        name
        languages(first: 10) {
          edges {
            node {
              name
            }
          }
        }
      }
    }
  }
}`;

interface Variables extends RequestParameters {
    login: string;
}

export interface UserRepo {
    login: string;
    projectCount: number;
    impactCount: number;
    java: number;
    javascript: number;
    python: number;
    go: number;
    other: number;
}

export class ReposFetcher {
    private readonly config: Config;

    public constructor(config: Config) {
        this.config = config;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async fetchSponsorableRepoInfo(token: string, allUsers: User[]): Promise<any> {
        const repoNameAndLanguages = [];
        for (const user of allUsers) {
            const login = user.login;

            const variables: Variables = { login };
            const sponsorable = await this.fetchRepos(token, variables, queryTemplate);
            // console.log(sponsorable);
            repoNameAndLanguages.push({ login: user.login, repo: sponsorable }); // temporary
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const count: any = {};

        for (const userRepo of repoNameAndLanguages) {
            const countProjects = userRepo.repo.reduce((counter, obj) => {
                if (obj.name) {
                    console.log(obj.name);
                    counter += 1;
                }

                return counter;
            }, 0);

            console.log(countProjects); // project counts
            const userProjectLanguages = Object.values(userRepo.repo);

            for (const project of userProjectLanguages) {
                project.languages.edges.forEach((language) => {
                    // console.log(language.node.name, userRepo.login);
                    // const name = project.name;
                    if (count[language.node.name]) {
                        count[language.node.name] += 1;
                    } else {
                        count[language.node.name] = 1;
                    }
                });
            }
        }

        return repoNameAndLanguages;
    }

    public async fetchRepos(token: string, variables: Variables, query: string): Promise<Node[]> {
        const graphqlWithAuth = graphql.defaults({
            headers: { authorization: `token ${token}` },
        });

        const response: GraphQlQueryResponseData = (await graphqlWithAuth(
            query,
            variables
        )) as GitHubResponse;

        const result: Repos = response.search;
        // console.log(`fetchRepos function line 81: ${JSON.stringify(result, null, 2)}`);

        return result.nodes;
    }
    //To-do:
    /*
    . added types/interfaces - test them
    . add function
    */

    public countLanguages(repo: string[]): string[] {
        const a = repo.map((type) => {
            let language = '';
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const languages: any = {
                java: function () {
                    language = 'Java';
                },
                javascript: function () {
                    language = 'Javascript';
                },
                python: function () {
                    language = 'Python';
                },
                go: function () {
                    language = 'Go';
                },
                default: function () {
                    language = 'Other';
                },
            };
            console.log(`the language for this repo is ${language}`);

            return (languages[type] || languages.defualt)();
        });

        return a;
    }
}
