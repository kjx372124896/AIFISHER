import express from 'express';
import { BaseProvider } from '../providers/baseProvider.js';
import { providerFrameworkStore } from './store.js';
import { BUILTIN_PROTOCOLS } from './protocols.js';

function joinUrl(baseUrl, path) {
  return `${String(baseUrl || '').replace(/\/+$/, '')}/${String(path || '').replace(/^\/+/, '')}`;
}

function publicProvider(provider) {
  const { apiKey, ...rest } = provider;
  return { ...rest, apiKey: apiKey ? '********' : '', configured: Boolean(provider.baseUrl) };
}

function errorResponse(response, error) {
  response.status(400).json({ error: error instanceof Error ? error.message : String(error) });
}

function readableUpstreamMessage(body, status) {
  const raw = body?.error?.message || body?.message || body?.error || body?.raw || '';
  const text = String(raw || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
  return text || `上游返回 HTTP ${status}`;
}

export function createProviderFrameworkRouter({ store = providerFrameworkStore } = {}) {
  const router = express.Router();

  router.get('/', (_request, response) => {
    const state = store.publicState();
    response.json({ ...state, builtinProtocols: BUILTIN_PROTOCOLS });
  });

  router.post('/providers', (request, response) => {
    try { response.json(publicProvider(store.upsertProvider(request.body || {}))); }
    catch (error) { errorResponse(response, error); }
  });

  router.delete('/providers/:id', (request, response) => {
    store.deleteProvider(request.params.id);
    response.json({ success: true });
  });

  router.post('/providers/:id/test', async (request, response) => {
    try {
      const state = store.read();
      const provider = state.providers.find((item) => item.id === request.params.id);
      if (!provider) throw new Error('供应商不存在');
      const url = joinUrl(provider.baseUrl, provider.modelsPath || '/v1/models');
      const options = {
        method: 'GET',
        headers: {
          ...(provider.apiKey ? { Authorization: `Bearer ${provider.apiKey}` } : {}),
          ...(provider.headers || {}),
        },
      };
      const upstream = await BaseProvider.fetchWithSystemProxyFallback(url, options);
      const text = await upstream.text();
      let body;
      try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
      if (!upstream.ok) throw new Error(readableUpstreamMessage(body, upstream.status));
      response.json({ success: true, status: upstream.status });
    } catch (error) { errorResponse(response, error); }
  });

  router.post('/providers/:id/discover', async (request, response) => {
    try {
      const state = store.read();
      const provider = state.providers.find((item) => item.id === request.params.id);
      if (!provider) throw new Error('供应商不存在');
      const upstream = await BaseProvider.fetchWithSystemProxyFallback(joinUrl(provider.baseUrl, provider.modelsPath || '/v1/models'), {
        method: 'GET',
        headers: {
          ...(provider.apiKey ? { Authorization: `Bearer ${provider.apiKey}` } : {}),
          ...(provider.headers || {}),
        },
      });
      const text = await upstream.text();
      let body;
      try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
      if (!upstream.ok) throw new Error(readableUpstreamMessage(body, upstream.status));
      if (!body || typeof body !== 'object' || Array.isArray(body) && body.length === 0) {
        throw new Error('模型列表接口没有返回可识别的数据');
      }
      const raw = Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : Array.isArray(body?.models) ? body.models : [];
      const models = raw.map((item) => typeof item === 'string' ? item : item?.id || item?.name || item?.model).filter(Boolean);
      response.json({ models: [...new Set(models.map(String))] });
    } catch (error) { errorResponse(response, error); }
  });

  router.post('/models', (request, response) => {
    try { response.json(store.upsertModel(request.body || {})); }
    catch (error) { errorResponse(response, error); }
  });

  router.delete('/models/:id', (request, response) => {
    store.deleteModel(request.params.id);
    response.json({ success: true });
  });

  router.post('/protocols', (request, response) => {
    try { response.json(store.upsertProtocol(request.body || {})); }
    catch (error) { errorResponse(response, error); }
  });

  router.delete('/protocols/:id', (request, response) => {
    store.deleteProtocol(request.params.id);
    response.json({ success: true });
  });

  return router;
}
