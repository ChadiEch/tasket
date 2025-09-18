# Deploying Tasket Frontend to Railway

This guide explains how to deploy the Tasket frontend as a standalone service on Railway.

## Prerequisites

1. A Railway account (https://railway.app)
2. A deployed backend service (separate deployment)

## Deployment Steps

1. **Create a new Railway project**
   - Go to https://railway.app/new
   - Select "Deploy from GitHub repo" or "Deploy from template"

2. **Connect your repository**
   - Select the repository containing the Tasket frontend code
   - Make sure to select the correct branch

3. **Configure environment variables**
   - In your Railway project, go to Settings → Variables
   - Add the following environment variables:
     ```
     VITE_API_BASE_URL=https://your-backend-service.up.railway.app/api
     VITE_WS_BASE_URL=wss://your-backend-service.up.railway.app
     ```

4. **Configure the service**
   - Railway should automatically detect the Dockerfile.frontend
   - The build process will:
     - Install dependencies
     - Build the React application
     - Serve the static files using `serve`

5. **Deploy**
   - Railway will automatically deploy your frontend
   - The service will be available at the provided URL

## Important Notes

- The frontend Dockerfile is configured to use the PORT environment variable provided by Railway
- Make sure your backend service is deployed and accessible before deploying the frontend
- Update the VITE_API_BASE_URL to point to your actual backend service URL
- The frontend uses WebSockets for real-time updates, so ensure WebSocket connections are allowed

## Troubleshooting

If you encounter issues:

1. Check that all environment variables are correctly set
2. Verify that your backend service is running and accessible
3. Check the Railway logs for any build or runtime errors
4. Ensure the PORT variable is being used correctly in the Dockerfile