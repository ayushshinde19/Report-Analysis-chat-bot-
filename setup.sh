#!/bin/bash

echo "🚀 Setting up Smart Report Analyzer..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ from https://nodejs.org/"
    exit 1
fi

# Check npm version
echo "📦 Node.js version: $(node --version)"
echo "📦 npm version: $(npm --version)"

# Create necessary directories
echo "📁 Creating project structure..."
mkdir -p uploads
mkdir -p logs

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOL
# Gemini AI Configuration
GEMINI_API_KEY=AIzaSyAa9xTGFEChT739UpX-4Na1nOCsoh6j4xQ
GEMINI_MODEL=gemini-pro

# Server Configuration
PORT=3002
NODE_ENV=development

# File Upload Configuration
MAX_FILE_SIZE=52428800
UPLOAD_DIR=./uploads

# Security
CORS_ORIGINS=http://localhost:3002,http://127.0.0.1:3002
SESSION_SECRET=$(openssl rand -hex 32)

# Logging
LOG_LEVEL=info
LOG_DIR=./logs
EOL
    echo "⚠️  Please edit .env file and add your Gemini API key!"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Get a free Gemini API key from: https://makersuite.google.com/app/apikey"
echo "2. Edit .env file and add your API key"
echo "3. Start the server: npm run dev"
echo "4. Open browser: http://localhost:3002"
echo ""
echo "🎉 Happy analyzing!"