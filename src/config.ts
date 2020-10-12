import fs from 'fs';

export interface Config {
    labelsToSearch: string[];
    numberOfReposPerCall: number;
    inputFilePath: string;
    outputFilePath: string;
    daysAgoCreated: number;
}

export function readConfigFile(configFilePath: string): Config {
    const configJSON = fs.readFileSync(configFilePath, {
        encoding: 'utf8',
    });
    const rawConfig = JSON.parse(configJSON);

    const daysAgoCreated = getValidDaysAgoCreated(rawConfig.daysAgoCreated);

    const entireConfig: Config = {
        labelsToSearch: rawConfig.labelsToSearch,
        numberOfReposPerCall: rawConfig.numberOfReposPerCall,
        inputFilePath: rawConfig.inputFilePath,
        outputFilePath: rawConfig.outputFilePath,
        daysAgoCreated: daysAgoCreated,
    };

    return entireConfig;
}

function getValidDaysAgoCreated(rawDaysAgoCreated: number): number {
    if (rawDaysAgoCreated >= 0) {
        return rawDaysAgoCreated;
    }

    const defaultNumberOfDays = 90;

    return defaultNumberOfDays;
}
