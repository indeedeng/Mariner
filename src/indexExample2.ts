/*  This is an example of how to invoke mariner
    It mostly exists to be able to test and debug while working on the library code

    To use it, you will need to add a variable to your environment:
        export GITHUB_TOKEN="<token here>"
    Optionally, you can have environment variables for INPUT_FILE_PATH and OUTPUT_FILE_PATH,
        but they have defaults that will work with the standard development environment.
    Then, run `npm run build`
    Finally, run `node dist/indexExample.js`

    FYI, if it's running correctly, your first logged output in the console
    will likely say "ERROR". Sorry about that ;-)
        You'll know it's run correctly if you have a new file
        exampleData/output.json with some GitHub issues in it.
*/
const { graphql } = require("@octokit/graphql");

import fs from 'fs';
import * as mariner from './mariner/index'; // This is used during development
// import * as mariner from 'oss-mariner'    // This is how the npm package would normally be used

import * as path from 'path';

function getFromEnvOrThrow(configField: string): string {
    const value = process.env[configField];
    if (!value) {
        throw new Error(`${configField} is required`);
    }

    return value as string;
}

const token = getFromEnvOrThrow('MARINER_GITHUB_TOKEN');
const inputFilePath =
    process.env.INPUT_FILE_PATH || path.join(__dirname, '..', 'exampleData/mini2.json');
const outputFilePath =
    process.env.OUTPUT_FILE_PATH || path.join(__dirname, '..', 'exampleData/output.json');

/*  This demonstrates instructing mariner to use a custom logger.
    It is optional, and if you don't call setLogger,
    output will simply be sent to console.log()
    */
class FancyLogger implements mariner.Logger {
    public info(message: string): void {
        console.log('***INFO: ' + message);
    }
    public error(message: string): void {
        console.log('***ERROR: ' + message);
    }
}

const logger = new FancyLogger();
mariner.setLogger(logger);

logger.info(`Input:  ${inputFilePath}`);
logger.info(`Output: ${outputFilePath}`);

// NOTE: See https://docs.github.com/en/graphql/reference/objects#searchresultitemconnection
interface Edge {
    node: unknown;
}

interface IssueCountAndIssues {
    issueCount: number
    edges: Edge[]
}

// NOTE: See https://docs.github.com/en/github/searching-for-information-on-github/searching-issues-and-pull-requests
const query = `
query findByLabel($queryString:String!) {
    search(
        type: ISSUE, 
        query: $queryString
        first: 100, 
    )
    {
        issueCount
        edges {
        node {
            ... on Issue {
            title
            labels(first: 100) {
                edges {
                node {
                    id
                }
                }
            }
            }
        }
        }
    }
  }`;

class GraphQlRetriever {
    public async run(token: string, label: string, repositoryIdentifiers: string[]): Promise<IssueCountAndIssues> {
        const graphqlWithAuth = graphql.defaults({
            headers: {
                authorization: `token ${token}`,
            },
        });

        const listOfRepos = this.createListOfRepos(repositoryIdentifiers);
        const variables = {
            queryString: `label:\"${label}\" state:open ${listOfRepos}`
        };
        logger.info(variables.queryString);
        const { search } = await graphqlWithAuth(query, variables);
        return search as IssueCountAndIssues;
    }

    private createListOfRepos(repos: string[]): string {
        const withPrefixes = repos.map((repo) => { return `repo:${repo}`; });
        return withPrefixes.join(' ');
    }
}

const contents = fs.readFileSync(inputFilePath, {
    encoding: 'utf8',
});
const countsByLibrary = JSON.parse(contents) as Record<string, number>;
const repositoryIdentifiers = Object.keys(countsByLibrary);


const label = 'good first issue';
const ddr = new GraphQlRetriever();
ddr.run(token, label, repositoryIdentifiers)
    .then((result) => logger.info(`Found ${result.issueCount} issues`))
    .catch((err) => logger.error(err.message));