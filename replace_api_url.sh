#!/bin/bash
PROD_API_URL="https://filebox.zaunist.com/api/"

echo "在 GitHub Actions 中运行，替换为生产环境 API URL: $PROD_API_URL"
sed -i "s|API_URL|$PROD_API_URL|g" nginx.conf