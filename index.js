"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./src/server");
const logger_1 = require("./src/utils/logger");
async function bootstrap() {
    try {
        (0, logger_1.logInfo)('🔥 Starting IELTS EdTech Platform...');
        const server = new server_1.Server();
        server.start();
    }
    catch (error) {
        (0, logger_1.logError)('❌ Failed to start server', error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=index.js.map