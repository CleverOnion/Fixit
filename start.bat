@echo off
echo ========================================
echo Fixit 项目启动脚本
echo ========================================

echo.
echo [1/5] 检查 Docker 状态...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: Docker 未运行!
    echo 请先启动 Docker Desktop，然后重试。
    pause
    exit /b 1
)
echo OK - Docker 已运行

echo.
echo [2/5] 启动数据库和 MinIO...
docker-compose up -d
if %errorlevel% neq 0 (
    echo 错误: 启动容器失败
    pause
    exit /b 1
)
echo OK - 容器已启动

echo.
echo [3/5] 等待数据库就绪...
timeout /t 10 /nobreak >nul
echo OK - 数据库就绪

echo.
echo [4/5] 运行数据库迁移...
cd fixit-api
npx prisma migrate dev --name init
cd ..

echo.
echo [5/5] 启动后端服务...
cd fixit-api
start cmd /k "npm run start:dev"
cd ..

echo.
echo 启动完成!
echo.
echo 前端访问: http://localhost:5173
echo 后端API: http://localhost:3000
echo MinIO控制台: http://localhost:9001
echo.
echo 注意: 请在 fixit-api/.env 中设置 OPENAI_API_KEY
pause
