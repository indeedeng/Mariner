const TAB = '   ';

function logInfo(message: string): void {
    console.log('INFO: ' + message);
}

function logError(message: string): void {
    console.log('ERROR: ' + message);
}

export class TabDepthLogger {
    public static info(depth: number, message: string): void {
        logInfo(TAB.repeat(depth) + message);
    }

    public static error(depth: number, error: Error): void {
        logError(TAB.repeat(depth) + error.message);
    }
}
