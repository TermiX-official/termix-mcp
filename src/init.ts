import prompts, { PromptObject } from 'prompts';
import figlet from 'figlet';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import { fileURLToPath } from 'url';

import dotenv from "dotenv";
dotenv.config();

// TERMIX Gold Color
const yellow = chalk.hex('#F0B90B');

// ESModule __dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cancel handler
const onCancel = () => {
    console.log(chalk.red('\n❌ Configuration cancelled by user (Ctrl+C or ESC). Exiting...'));
    process.exit(0);
};

// Show Banner
const showBanner = () => {
    const banner = figlet.textSync('TermiX MCP ', { font: 'Big' });
    console.log(yellow(banner));
    console.log(yellow('🚀 Welcome to the TermiX MCP Configurator\n'));
};

// User Input Types
interface UserInputs {
    TERMIX_API_KEY: string;
    TERMIX_API_SECRET: string;
}

// Ask for credentials
const getInputs = async (): Promise<UserInputs> => {
    const questions: PromptObject[] = [
        {
            type: 'password',
            name: 'TERMIX_API_KEY',
            message: '🔑Enter your TERMIX API KEY:',
            validate: (val: string) => 
            val.trim() === '' ? 'TERMIX API KEY is required!' : true,
        },
        {
            type: 'password',
            name: 'TERMIX_API_SECRET',
            message: ' 🔐 Enter your TERMIX API SECRET:',
            validate: (val: string) =>
                val.trim() === '' ? 'TERMIX API SECRET is required!' : true,
        },
    ];

    return await prompts(questions, { onCancel }) as UserInputs;
};

// Generate .env file
const generateEnvFile = async (TERMIX_API_KEY: string, TERMIX_API_SECRET: string,): Promise<void> => {
    const envContent = `
TERMIX_API_KEY=${TERMIX_API_KEY}
TERMIX_API_SECRET=${TERMIX_API_SECRET}
`.trim();

    await fs.writeFile('.env', envContent);
    console.log(yellow('✅ .env file generated.'));
};

// Generate config object
const generateConfig = async (TERMIX_API_KEY: string, TERMIX_API_SECRET: string,): Promise<any> => {
    const indexPath = path.resolve(__dirname, '..', 'build', 'index.js'); // one level up from cli/

    return {
        'termix-mcp': {
            command: 'node',
            args: [indexPath],
            env: {
                TERMIX_API_KEY: TERMIX_API_KEY,
                TERMIX_API_SECRET: TERMIX_API_SECRET,
            },
            disabled: false,
            autoApprove: []
        }
    };
};

// Configure Claude Desktop
const configureClaude = async (config: object): Promise<boolean> => {
    const userHome = os.homedir();
    let claudePath;
    const platform = os.platform();
    if (platform == "darwin") {
        claudePath = path.join(userHome, 'Library/Application Support/Claude/claude_desktop_config.json');
    } else if (platform == "win32") {
        claudePath = path.join(userHome, 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json');
    } else {
        console.log(chalk.red('❌ Unsupported platform.'));
        return false;
    }
    
    if (!fs.existsSync(claudePath)) {
        console.log(chalk.yellow('⚠️ Claude config file not found. Creating a new one with default configuration.'));
        // Create a default configuration object
        const defaultConfig = {
            mcpServers: {}
        };
        // Write the default configuration to the file
        await fs.writeJSON(claudePath, defaultConfig, { spaces: 2 });
    }

    
    const jsonData = fs.readFileSync(claudePath, 'utf8');
    const data = JSON.parse(jsonData);
    
    data.mcpServers = {
        ...data.mcpServers,
        ...config,
    };
    
    await fs.writeJSON(claudePath, data, { spaces: 2 });
    console.log(yellow('✅ TermiX MCP configured for Claude Desktop. Please RESTART your Claude to enjoy it 🎉'));
    return true;
};

// Save fallback config file
const saveFallbackConfig = async (config: object): Promise<void> => {
    await fs.writeJSON('config.json', config, { spaces: 2 });
    console.log(yellow('📁 Saved config.json in root project folder.'));
};

// Main logic
const init = async () => {
    showBanner();

    const { TERMIX_API_KEY, TERMIX_API_SECRET } = await getInputs();


    await generateEnvFile(TERMIX_API_KEY, TERMIX_API_SECRET);

    const config = await generateConfig(TERMIX_API_KEY, TERMIX_API_SECRET);

    const { setupClaude } = await prompts({
        type: 'confirm',
        name: 'setupClaude',
        message: '🧠 Do you want to configure in Claude Desktop?',
        initial: true
    }, { onCancel });

    if (setupClaude) {
        const success = await configureClaude(config);
        if (!success) {
            await saveFallbackConfig(config);
        }
    } else {
        await saveFallbackConfig(config);
    }
};

init(); 