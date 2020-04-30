import { DependencyDetailsRetriever } from './dependency-details-retriever';
import { Logger, setLogger } from './tab-level-logger';

/* This is an example of how to invoke DependencyDetailsRetriever
   It mostly exists to be able to test and debug while working on the library code

   To use it, you will need to add 3 variables to your environment:
       export GITHUB_TOKEN="<token here>"
       export INPUT_FILE_PATH="/Users/{yourUserHere}/{path}/{to}/exampleData/mini.json"
       export OUTPUT_FILE_PATH="/Users/{yourUserHere}/{path}/{to}/exampleData/analysisOutputRaw.json"
  Then, run `npm run build`
  Finally, run `node dist/indexExample.js`

  FYI, if it's running correctly, your first logged output in the console will likely say "ERROR". Sorry about that ;-)
       You'll know it's run correctly if you have a new file exampleData/analysisOutputRaw.json with some GitHub issues in it.
*/
function getFromEnvOrThrow(configField: string): string {
    const value = process.env[configField];
    if (!value) {
        throw new Error(`${configField} is required`);
    }

    return value as string;
}
const token = getFromEnvOrThrow('GITHUB_TOKEN');
const inputFilePath = getFromEnvOrThrow('INPUT_FILE_PATH');
const outputFilePath = getFromEnvOrThrow('OUTPUT_FILE_PATH');

class FancyLogger implements Logger {
    public info(message: string): void {
        console.log('***INFO: ' + message);
    }
    public error(message: string): void {
        console.log('***ERROR: ' + message);
    }
}

// Use a custom logger instead of the default console logger (this is optional!)
setLogger(new FancyLogger());

const ddr = new DependencyDetailsRetriever();
ddr.run(token, inputFilePath, outputFilePath);
