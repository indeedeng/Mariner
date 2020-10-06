import fs from 'fs';

export interface Config {
    labelsToSearch: string[];
    numberOfReposPerCall: number;
    inputFilePath: string;
    outputFilePath: string;
    daysAgoCreated?: number;
}

export function readConfigFile(filePath: string): Config {
    const configFilePath = `${filePath}`;
    const configJSON = fs.readFileSync(configFilePath, {
        encoding: 'utf8',
    });
    const entireConfig = JSON.parse(configJSON) as Config;

    return entireConfig;
}
