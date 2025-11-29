# Sparkle Messaging App

Sparkle is a modern, mobile-first messaging application built with React, Node.js, Socket.io, and MongoDB. It features real-time chat, image sharing, and 1:1 voice calls using WebRTC.

## Features

- **Real-time Messaging**: Instant message delivery using Socket.io.
- **Voice Calls**: 1:1 voice calls via WebRTC.
- **Media Sharing**: Upload and share images.
- **Presence**: Online/Offline status and typing indicators.
- **Authentication**: Secure JWT-based authentication.
- **Mobile-First UI**: Premium, responsive design inspired by 2025 standards.
- **Dark Mode**: Fully supported dark/light themes.

## Tech Stack

- **Frontend**: React, Vite, TypeScript, Tailwind CSS, Zustand, React Query.
- **Backend**: Node.js, Express, Socket.io, Mongoose (MongoDB), Redis.
- **Database**: MongoDB.
- **Storage**: Local filesystem (uploads).

## Prerequisites

- Node.js (v18+)
- MongoDB
- Redis

## Setup Instructions

### 1. Clone the repository
\`\`\`bash
git clone <repository-url>
cd sparkle
\`\`\`

### 2. Backend Setup
\`\`\`bash
cd server
npm install
cp .env.example .env # Configure your .env variables
npm run build
npm start
\`\`\`

**Environment Variables (.env)**:
\`\`\`env
PORT=5000
MONGO_URI=mongodb://localhost:27017/sparkle
JWT_SECRET=your_jwt_secret
REDIS_HOST=localhost
REDIS_PORT=6379
\`\`\`

### 3. Frontend Setup
\`\`\`bash
cd client
npm install
npm run dev
\`\`\`

The frontend will be available at `http://localhost:5173`.

## Docker Setup

You can run the entire stack using Docker Compose:

\`\`\`bash
docker-compose up --build
\`\`\`

## Project Structure

- \`client/\`: React frontend application.
- \`server/\`: Node.js backend application.
- \`uploads/\`: Directory for stored media files.

## License

MIT
