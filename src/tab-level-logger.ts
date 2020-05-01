export interface Logger {
    info(message: string): void;
    error(message: string): void;
}

const TAB = '   ';

class ConsoleLogger implements Logger {
    public info(message: string): void {
        console.log('INFO: ' + message);
    }
    public error(message: string): void {
        console.log('ERROR: ' + message);
    }
}

let currentLogger = new ConsoleLogger();

export function setLogger(newLogger: Logger): void {
    currentLogger = newLogger;
}

export class TabDepthLogger {
    public static info(depth: number, message: string): void {
        currentLogger.info(TAB.repeat(depth) + message);
    }

    public static error(depth: number, message: string): void {
        currentLogger.error(TAB.repeat(depth) + message);
    }
}
