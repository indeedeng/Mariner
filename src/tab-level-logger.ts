import Logger from '@indeed/logger';

const LOGGER = new Logger();
const TAB = '   ';

export class TabDepthLogger {
    public static info(depth: number, message: string): void {
        LOGGER.info(TAB.repeat(depth) + message);
    }

    public static error(depth: number, error: Error): void {
        LOGGER.error(TAB.repeat(depth) + error.message);
    }
}
