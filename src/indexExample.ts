import { DependencyDetailsRetriever } from './dependency-details-retreiver';

//we'll be converting these to use environment variables in the next commit
const outputFilePath = '/Users/{yourUserHere}/{path}/{to}/exampleData/analysisOutputRaw.json';
const inputFilePath = '/Users/{yourUserHere}/{path}/{to}/exampleData/mini.json';
const token = '<token here>';

// This is an example of how to invoke DependencyDetailsRetriever
// It mostly exists to be able to test and debug while working on the library code
const ddr = new DependencyDetailsRetriever();
ddr.run(false, outputFilePath, inputFilePath, token);
