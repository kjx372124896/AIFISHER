export const BUILTIN_PROTOCOLS = Object.freeze([
  {
    id: 'openai-chat-completions',
    label: 'OpenAI Chat Completions',
    capability: 'text',
    adapter: 'openai-chat-completions',
    createPath: '/v1/chat/completions',
    contentType: 'application/json',
  },
  {
    id: 'openai-responses',
    label: 'OpenAI Responses',
    capability: 'text',
    adapter: 'openai-responses',
    createPath: '/v1/responses',
    contentType: 'application/json',
  },
  {
    id: 'openai-images',
    label: 'OpenAI Images',
    capability: 'image',
    adapter: 'openai-images',
    createPath: '/v1/images/generations',
    editPath: '/v1/images/edits',
    contentType: 'application/json',
  },
]);

export function protocolById(state, id) {
  return [...BUILTIN_PROTOCOLS, ...(state.protocols || [])].find((item) => item.id === id) || null;
}
