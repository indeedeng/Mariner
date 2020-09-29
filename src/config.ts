import fs from 'fs';
import * as path from 'path';

export interface Config {
    labelsToSearch: string[];
    numberOfReposPerCall: number;
    inputFilePath: string;
    outputFilePath: string;
}

export function getConfig(): Config {
    const configFilePath = path.join(__dirname, '..', '..', 'examples', 'config.json');
    const configJSON = fs.readFileSync(configFilePath, {
        encoding: 'utf8',
    });
    const entireConfig = JSON.parse(configJSON) as Config;

    return entireConfig;
}
