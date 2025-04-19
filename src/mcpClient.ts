import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { CallToolResultSchema, ListToolsResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

export class McpClient {
    clientTransport: SSEClientTransport;
    client: Client;

    constructor(seeUrl: string, jwtToken: string) {

        this.clientTransport = new SSEClientTransport(new URL(seeUrl), {
            authProvider: {
                tokens() {
                    return {
                        access_token: jwtToken,
                        token_type: "Bearer"
                    };
                },

                get redirectUrl() { return ""; },
                get clientMetadata() { return { redirect_uris: [""] }; },
                clientInformation: () => undefined,
                saveTokens: () => { },
                redirectToAuthorization: () => { },
                saveCodeVerifier: () => { },
                codeVerifier: () => { return "" },
            },
        });

        this.client = new Client(
            {
                name: "mcp-typescript test client",
                version: "0.1.0",
            },
            {
                capabilities: {
                    sampling: {},
                },
            }
        );
    }

    async connect() {
        await this.client.connect(this.clientTransport);
    }

    async disconnect() {
        await this.client.close();
    }

    async tools() {

        const toolsResult = await this.client.request(
            {
                method: "tools/list",
            },
            ListToolsResultSchema
        );

        return toolsResult.tools;
    }

    async callTool(toolName: string, params?: any) {
        const testResult = await this.client.request(
            {
                method: "tools/call",
                params: {
                    name: toolName,
                    arguments: !!params ? params : {},
                }
            },
            CallToolResultSchema,
            {
                timeout: 1000 * 60 * 3,
            }
        );
        return testResult;
    }
}