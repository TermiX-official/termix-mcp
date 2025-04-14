import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpClient } from "./mcpClient.js";
import { jsonSchemaToZod } from "./schemaUtils.js";
import { logger } from "./logger.js";

export type Mcp = {
    id: string
    name: string
    url: string
  }

export class Termix {
    apiKey: string;
    apiSecret: string;
    termixToken: string | undefined;
    termixUrl: string | undefined;


    constructor(apiKey: string, apiSecret: string) {
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;

        this.termixUrl = process.env.TERMIX_URL || "http://localhost:3030";
    }

    async login() {
        const tokenResp = await fetch(this.termixUrl + "/api/apikey/check", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                apiKey: this.apiKey,
                apiSecret: this.apiSecret,
            }),
        });

        if (tokenResp.status !== 200) {
            throw new Error("Failed to login to Termix");
        }
        const tokenRespJson = await tokenResp.json();
        this.termixToken = tokenRespJson.data;
    }

    private async getMcpList() {
        const url = this.termixUrl + "/api/mcp/list";
        const response = await fetch(url);
        const mcpListResult = await response.json();
        const mcpList = mcpListResult.data;
        return mcpList as Mcp[]
    }

    async build(server: McpServer) {
        if (!this.termixToken) {
            throw new Error("Termix token not set");
        }
        const mcpList = await this.getMcpList();
        logger({mcpList})

        const termixToken = this.termixToken;
        for (const mcp of mcpList) {
            const mcpClient = new McpClient(mcp.url, termixToken);
            let tools;
            try {
                await mcpClient.connect();
                tools = await mcpClient.tools();
                await mcpClient.disconnect();
            } catch (e) {
                logger(`Failed to connect to MCP ${mcp.name}`);
                continue;
            }
            
            for (const tool of tools) {
                
                const properties = tool.inputSchema.properties
                if (!properties) {
                    server.tool(`${mcp.name}_${tool.name}`, tool.description || "", async () => {
                        
                        const mcpClient = new McpClient(mcp.url, termixToken);
                        await mcpClient.connect();
                        const result = await mcpClient.callTool(tool.name);
                        await mcpClient.disconnect();
                        return result
                    })
                } else {
                    const paramsSchema = jsonSchemaToZod(properties)
                    
                    server.tool(`${mcp.name}_${tool.name}`, tool.description || "", paramsSchema, async (params: any) => {
                        const mcpClient = new McpClient(mcp.url, termixToken);
                        await mcpClient.connect();
                        const result = await mcpClient.callTool(tool.name, params);
                        await mcpClient.disconnect();
                        return result
                    })
                }
            }

        }
    }


}