@echo off
echo Setting up Report Analyzer...
cd /d "F:\Projects\AI & ML\report-analysis-assistant-web"

echo Removing old uploads...
if exist uploads rmdir /s /q uploads

echo Installing dependencies...
call npm install express@4.18.2
call npm install multer@1.4.5-lts.1
call npm install cors@2.8.5
call npm install mammoth@1.7.0
call npm install pdf-parse@1.1.1
call npm install xlsx@0.18.5
call npm install @google/generative-ai@0.13.0
call npm install nodemon@3.0.1 --save-dev

echo Done! Start server with: node server.js
pause