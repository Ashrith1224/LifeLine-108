@echo off
echo ==========================================
echo      LifeLine-108 Deployment Script
echo ==========================================

echo [1/1] Building and Deploying to Supabase...
call npm run deploy
if %errorlevel% neq 0 (
    echo Deployment failed! Please check the errors above.
    pause
    exit /b %errorlevel%
)

echo.
echo ==========================================
echo      SUCCESS! Website is live on Supabase.
echo ==========================================
pause
