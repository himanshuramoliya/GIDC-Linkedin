const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Ports of the existing services
const FRONTEND_DEV_PORT = process.env.FRONTEND_PORT || 3000;
const BACKEND_PORT = process.env.BACKEND_PORT || 5000;

// Port this gateway will listen on
const GATEWAY_PORT = process.env.PORT || 8080;

const app = express();

// Proxy API (and uploads) to backend
app.use(
  ['/api', '/uploads'],
  createProxyMiddleware({
    target: `http://localhost:${BACKEND_PORT}`,
    changeOrigin: true,
    ws: false,
  })
);

// Everything else goes to the frontend dev server
app.use(
  '/',
  createProxyMiddleware({
    target: `http://localhost:${FRONTEND_DEV_PORT}`,
    changeOrigin: true,
    ws: true, // allow CRA websocket/HMR
  })
);

app.listen(GATEWAY_PORT, () => {
  console.log(
    `Gateway running on port ${GATEWAY_PORT} -> frontend:${FRONTEND_DEV_PORT}, backend:${BACKEND_PORT}`
  );
});

