/**
 * Backend server for vlayer API proxy
 * Handles CORS and proxies requests to vlayer Web Prover
 */

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

// vlayer credentials
const VLAYER_PROVER_URL = 'https://web-prover.vlayer.xyz/api/v1';
const VLAYER_CLIENT_ID = '4f028e97-b7c7-4a81-ade2-6b1a2917380c';
const VLAYER_AUTH_TOKEN = 'jUWXi1pVUoTHgc7MOgh5X0zMR12MHtAhtjVgMc2DM3B3Uc8WEGQAEix83VwZ';

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'vlayer proxy server running' });
});

// POST /api/vlayer/prove - Generate Web Proof
app.post('/api/vlayer/prove', async (req, res) => {
  try {
    const { url, method = 'GET', headers = [], body } = req.body;

    console.log('🔐 Proxying vlayer prove request:', { url, method });

    const response = await fetch(`${VLAYER_PROVER_URL}/prove`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': VLAYER_CLIENT_ID,
        'Authorization': `Bearer ${VLAYER_AUTH_TOKEN}`,
      },
      body: JSON.stringify({
        url,
        method,
        headers,
        body,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ vlayer error:', error);
      return res.status(response.status).json({ error });
    }

    const result = await response.json();
    console.log('✅ Proof generated successfully');

    return res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error proxying vlayer request:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/vlayer/verify - Verify Web Proof
app.post('/api/vlayer/verify', async (req, res) => {
  try {
    const presentation = req.body;

    console.log('🔍 Proxying vlayer verify request');

    const response = await fetch(`${VLAYER_PROVER_URL}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': VLAYER_CLIENT_ID,
        'Authorization': `Bearer ${VLAYER_AUTH_TOKEN}`,
      },
      body: JSON.stringify(presentation),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ vlayer verification error:', error);
      return res.status(response.status).json({ error });
    }

    const result = await response.json();
    console.log('✅ Proof verified successfully');

    return res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error proxying vlayer verification:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 vlayer proxy server running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Prove endpoint: http://localhost:${PORT}/api/vlayer/prove`);
  console.log(`🔍 Verify endpoint: http://localhost:${PORT}/api/vlayer/verify`);
});
