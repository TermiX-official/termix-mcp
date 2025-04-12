import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";
import { Termix } from "./termix.js";
dotenv.config();



const apiKey = process.env.TERMIX_API_KEY;
const apiSecret = process.env.TERMIX_API_SECRET;
if (!apiKey) {
    throw new Error("TERMIX_API_KEY is not set");
}
if (!apiSecret) {
    throw new Error("TERMIX_API_SECRET is not set");
}

const termix = new Termix(apiKey, apiSecret)
export async function main() {
    const server = new McpServer({
        name: "bsc-mcp",
        version: "1.0.0"
    });

    await termix.login();
    await termix.build(server);

    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main();