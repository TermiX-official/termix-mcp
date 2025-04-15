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
    mcpTokens: {
        token: string;
        name: string;
    }[] = [];
    termixUrl: string | undefined;


    constructor(apiKey: string, apiSecret: string) {
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;

        // this.termixUrl = process.env.TERMIX_URL || "http://localhost:3030";
        this.termixUrl = process.env.TERMIX_URL || "https://termix-server-backend-467866309844.asia-southeast2.run.app";
    }

    async login() {
        const tokenResp = await fetch(this.termixUrl + "/api/termixMcp/check", {
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
        if (!tokenRespJson.success) {
            throw new Error("Failed to login to Termix");
        }
        this.termixToken = tokenRespJson.data.termixServerToken;
        this.mcpTokens = tokenRespJson.data.mcpServerTokens;
    }

    private async getMcpList() {
        const url = this.termixUrl + "/api/termixMcp/list";
        const response = await fetch(url, {
            
            headers: {
                "Content-Type": "application/json",
                "authorization": `Bearer ${this.termixToken}`
            },
        });
        const mcpListResult = await response.json();
        const mcpList = mcpListResult.data;
        return mcpList as Mcp[]
    }

    async build(server: McpServer) {
        const mcpList = await this.getMcpList();
        logger({mcpList})

        for (const mcp of mcpList) {
            const mcpToken = this.mcpTokens.find(item => item.name === mcp.name);
            if (!mcpToken) {
                logger(`Failed to find MCP token for ${mcp.name}`);
                continue;
            }
            const mcpClient = new McpClient(mcp.url, mcpToken.token);
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
                        
                        const mcpClient = new McpClient(mcp.url, mcpToken.token);
                        await mcpClient.connect();
                        const result = await mcpClient.callTool(tool.name);
                        await mcpClient.disconnect();
                        return result
                    })
                } else {
                    const paramsSchema = jsonSchemaToZod(properties)
                    
                    server.tool(`${mcp.name}_${tool.name}`, tool.description || "", paramsSchema, async (params: any) => {
                        const mcpClient = new McpClient(mcp.url, mcpToken.token);
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