#!/bin/bash

# 中国近代史时间轴静态网站部署脚本
# 使用方法: ./deploy.sh [部署目录]

set -e

# 配置变量
REPO_URL="https://github.com/occultskyrong/mch-prc.git"
BRANCH="master"
PROJECT_DIR="/tmp/mch-prc-deploy"
DEPLOY_DIR=${1:-"/var/www/mch-prc"}

echo "======================================"
echo "中国近代史时间轴部署脚本"
echo "======================================"
echo "部署目录: $DEPLOY_DIR"
echo ""

# 1. 清理临时目录
echo "[1/5] 清理临时目录..."
rm -rf "$PROJECT_DIR"

# 2. 克隆代码
echo "[2/5] 克隆代码..."
git clone --branch "$BRANCH" --depth 1 "$REPO_URL" "$PROJECT_DIR"
cd "$PROJECT_DIR"

# 3. 安装依赖
echo "[3/5] 安装依赖..."
npm install --production

# 4. 构建静态资源
echo "[4/5] 构建静态资源..."
npm run build

# 5. 部署到目标目录
echo "[5/5] 部署到目标目录..."
# 创建目标目录（如果不存在）
mkdir -p "$DEPLOY_DIR"

# 清理旧文件
rm -rf "$DEPLOY_DIR/*"

# 复制构建产物
cp -r dist/* "$DEPLOY_DIR/"
cp -r public/data "$DEPLOY_DIR/"

# 设置权限
chmod -R 755 "$DEPLOY_DIR"

echo ""
echo "======================================"
echo "部署完成!"
echo "静态文件已部署到: $DEPLOY_DIR"
echo "======================================"

# 清理临时目录
rm -rf "$PROJECT_DIR"