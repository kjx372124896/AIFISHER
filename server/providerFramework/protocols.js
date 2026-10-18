import { TASK_PROTOCOLS } from './taskProtocols.js';

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
  // 「提交任务 → 轮询 → 取直链」的异步任务协议（Seedance 中转等）。图片/视频/音频
  // 分别对应 /v1/image/generations、/v1/videos、/v1/video/generations、/v1/audio/generations，
  // 另外补充 Suno 音乐与 Midjourney 两组独立接口。
  ...TASK_PROTOCOLS,
]);

export function protocolById(state, id) {
  return [...BUILTIN_PROTOCOLS, ...(state.protocols || [])].find((item) => item.id === id) || null;
}
