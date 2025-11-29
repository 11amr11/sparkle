# Deployment Guide for Sparkle

This guide will help you deploy Sparkle to the web so you can test it on your phone and browser.

## 1. Backend Deployment (Render.com)
Since GitHub Pages only hosts static websites (frontend), we need to host the backend server somewhere else. **Render.com** offers a free tier that supports Node.js and WebSockets.

1.  **Create a GitHub Repository**:
    *   Go to [GitHub.com](https://github.com) and create a new repository named `sparkle`.
    *   Push your code to this repository.

2.  **Deploy to Render**:
    *   Sign up at [Render.com](https://render.com).
    *   Click **New +** -> **Web Service**.
    *   Connect your GitHub account and select the `sparkle` repository.
    *   **Root Directory**: `server`
    *   **Build Command**: `npm install && npm run build`
    *   **Start Command**: `npm start`
    *   **Environment Variables**: Add the following:
        *   `MONGO_URI`: Your MongoDB connection string (from MongoDB Atlas).
        *   `JWT_SECRET`: A secret random string.
        *   `CLIENT_URL`: Your future GitHub Pages URL (e.g., `https://yourusername.github.io`).

3.  **Get Backend URL**:
    *   Once deployed, Render will give you a URL (e.g., `https://sparkle-api.onrender.com`). Copy this.

## 2. Frontend Deployment (GitHub Pages)

Now we will deploy the React frontend to GitHub Pages.

1.  **Update API URL**:
    *   Open `client/.env` (create it if missing).
    *   Set `VITE_API_URL` to your Render Backend URL:
        ```
        VITE_API_URL=https://sparkle-api.onrender.com
        ```

2.  **Install `gh-pages`**:
    *   Open a terminal in the `client` folder:
        ```bash
        cd client
        npm install gh-pages --save-dev
        ```

3.  **Update `package.json`**:
    *   Open `client/package.json` and add these lines:
        ```json
        "homepage": "https://yourusername.github.io/sparkle",
        "scripts": {
          ...
          "predeploy": "npm run build",
          "deploy": "gh-pages -d dist"
        }
        ```
    *   Replace `yourusername` with your GitHub username.

4.  **Deploy**:
    *   Run this command in the `client` terminal:
        ```bash
        npm run deploy
        ```

5.  **Visit your App**:
    *   Go to `https://yourusername.github.io/sparkle`.
    *   It should work on both your computer and mobile phone!

## 3. Important Notes
*   **Free Tier Limitations**: The Render free tier "sleeps" after 15 minutes of inactivity. The first request might take 30-60 seconds to wake it up.
*   **Mobile Testing**: Open the GitHub Pages URL on your phone's browser (Chrome/Safari). You can "Add to Home Screen" to make it look like an app.
