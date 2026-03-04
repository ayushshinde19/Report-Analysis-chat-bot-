
DOCUMENT ANALYSIS SERVER - SETUP INSTRUCTIONS


Thank you for testing our application! 

📦 WHAT'S IN THE ZIP FILE:
--------------------------
- server.js         (Main application file)
- package.json      (Project configuration)
- README.txt        (This file - you're reading it!)

🎯 WHAT THIS APPLICATION DOES:
-----------------------------
This is a document analysis server that allows you to:
- Upload documents (PDF, Word, Excel, images, text files)
- View all uploaded documents
- Chat with the server about your documents
- Delete documents when no longer needed

⚙️ HOW TO RUN THE APPLICATION:
-----------------------------
Follow these simple steps:

STEP 1: Install Node.js
   • Go to https://nodejs.org
   • Download the "LTS" version (recommended for most users)
   • Install it like any other program (keep clicking "Next")
   • Restart your computer after installation

STEP 2: Extract the ZIP file
   • Right-click the ZIP file
   • Select "Extract All" (Windows) or double-click (Mac)
   • Remember the folder location where you extracted it

STEP 3: Open Visual Studio / Terminal
   • Open File directory which is extracted 
   
STEP 4: Navigate to the extracted folder
   • Open the project Folder drag Server .env file and serveer.js file 
   • Replace APIKey in .env file  

   TIP: You can drag the folder into the command prompt to paste the path automatically

STEP 5: Install required software
   • In the command prompt, type: npm install
   • Press Enter
   • Wait for installation to complete (you'll see a progress bar)

STEP 6: Start the server
   • In the VS code runner terminal, type: node server.js
   • Press Enter
   • You should see a colorful box with server information

✅ SUCCESS! The server is now running.

🌐 HOW TO USE THE APPLICATION:
-----------------------------
Once the server is running:

1. Open your web browser (Chrome, Edge, Firefox, etc.)
2. Type this address: http://localhost:3002/api/health
3. You should see a success message

📝 AVAILABLE FEATURES TO TEST:
-----------------------------
Copy and paste these URLs in your browser:

• Check server health:
  http://localhost:3002/api/health

• View all uploaded documents:
  http://localhost:3002/api/documents

⚠️ IMPORTANT NOTES:
------------------
• The server runs on port 3002
• Make sure APIKEY should be Paid version open .env file and replace your APIKEY form https://aistudio.google.com/api-keys
• Maximum file size: 50MB
• Supported files: PDF, DOCX, TXT, CSV, XLSX, XLS, PNG, JPG, JPEG
• Keep the command prompt window open while testing
• To stop the server: Press Ctrl + C in the command prompt

❓ HAVING ISSUES?
----------------
Common problems and solutions:

"Port 3002 already in use":
   • Close other programs that might be using this port
   • Or restart your computer

"npm is not recognized":
   • Node.js wasn't installed correctly
   • Try installing Node.js again and restart computer

Can't access the server:
   • Make sure the command prompt shows the server is running
   • Check if you typed http://localhost:3002 correctly
   • Try http://127.0.0.1:3002 instead

📞 NEED HELP?
------------
Contact: ayushshinde495@gmail.com 
Phone: 8766722758

Thank you for testing! 🚀



