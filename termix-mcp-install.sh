#!/bin/bash

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "Node.js 未安装，开始安装..."
    
    if command -v nvm >/dev/null 2>&1; then
        echo "✅ 已检测到 nvm，使用 nvm 安装 Node.js..."
    else
        echo "⏳ 未检测到 nvm，开始安装 nvm..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
        \. "$HOME/.nvm/nvm.sh"
    fi
    nvm install 22
    if ! command -v node &> /dev/null; then
        echo "⚠️ Node.js 安装失败请重试..."
        exit 0
    else
        echo "✅  Node.js 安装成功"
    fi
else
    echo "Node.js 已安装，版本：$(node -v)"
fi

# 创建目录
TARGET_DIR="$HOME/Documents/Cline/MCP"
mkdir -p "$TARGET_DIR"

# 进入目录
cd "$TARGET_DIR" || exit 1

# 下载 termix-mcp.zip 文件
if [ ! -f "termix-mcp.zip" ]; then
    echo "termix-mcp.zip 不存在，开始下载..."
    curl -L -o termix-mcp.zip https://github.com/TermiX-official/termix-mcp/archive/refs/heads/main.zip
else
    echo "termix-mcp.zip 已存在，跳过下载。"
fi

# 解压
unzip -o termix-mcp.zip

# 进入项目目录
cd termix-mcp-main || {
    echo "未找到解压目录 termix-mcp-main"
    exit 1
}

# 安装依赖并初始化
npm install && npm run init:build