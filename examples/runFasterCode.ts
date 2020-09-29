/*  This is an example of how to invoke mariner using the new GraphQL code.
    It mostly exists to be able to test and debug while working on the library code

    To use it, you will need to add a variable to your environment:
        export MARINER_GITHUB_TOKEN="<token here>"
    Optionally, you can have environment variables for INPUT_FILE_PATH and OUTPUT_FILE_PATH,
        but they have defaults that will work with the standard development environment.
    Then, run `npm run build`
    Finally, run `node dist/examples/runFasterCode.js`

    You'll know it's run correctly if you have a new file
        examples/output.json with some GitHub issues in it.
*/

import fs from 'fs';
import * as mariner from '../src/mariner/index'; // This is used during development
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
    process.env.MARINER_INPUT_FILE_PATH ||
    path.join(__dirname, '..', '..', 'examples', 'exampleData.json');
const outputFilePath =
    process.env.MARINER_OUTPUT_FILE_PATH ||
    path.join(__dirname, '..', '..', 'examples', 'output.json');

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

const contents = fs.readFileSync(inputFilePath, {
    encoding: 'utf8',
});
const countsByLibrary = JSON.parse(contents) as Record<string, number>;
const repositoryIdentifiers = Object.keys(countsByLibrary);
const prefix = 'https://api.github.com/repos/';
const repositoryLookupName = repositoryIdentifiers.map((identifier) => {
    if (identifier.startsWith(prefix)) {
        return identifier.substr(prefix.length);
    } else {
        return identifier;
    }
});

const labels = ['good first issue', 'help wanted', 'documentation'];
const finder = new mariner.IssueFinder();

function convertToRecord(issues: Map<string, mariner.Issue[]>): void {
    const record: Record<string, mariner.Issue[]> = {};
    issues.forEach((issuesForRepo: any, repo: any) => {
        record[repo] = issuesForRepo;
    });
    const jsonFile = outputToJson(record);

    return jsonFile;
}

function outputToJson(record: Record<string, mariner.Issue[]>): void {
    const noReplacer = undefined;
    const indent = 2;
    const jsonResults = JSON.stringify(record, noReplacer, indent);
    const data = fs.writeFileSync(outputFilePath, jsonResults);

    return data;
}

finder
    .findIssues(token, labels, repositoryLookupName)
    .then((issues) => {
        let issueCount = 0;
        issues.forEach((issuesForRepo) => {
            issueCount += issuesForRepo.length;
        });

        convertToRecord(issues);
        logger.info(`Found ${issueCount} issues in ${issues.size} projects\n`);
        logger.info(`Saved issue results to: ${outputFilePath}`);
    })
    .catch((err) => {
        logger.error(err.message);
        console.log(err);
    });
