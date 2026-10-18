/**
 * providerFrameworkPresets.ts
 *
 * 拉取模型时给「模型类型 + 请求协议」一个合理默认值。
 *
 * 背景：一次拉取可能返回几百个模型（例如 Seedance 中转站），全部按
 * 「名字里有 image 就是图片，其它都是文本」来猜会让绝大多数行都要手工改。
 * 这里按模型名族给出默认能力，并在已知的中转站主机上进一步选出对应的
 * 异步任务协议，用户仍可在下拉框里随时改。
 */

export type FrameworkCapability = 'text' | 'image' | 'video' | 'audio';

/** 提供「提交任务 → 轮询 → 取直链」异步接口的中转站主机名。 */
export const TASK_RELAY_HOSTS: readonly string[] = ['seedance.nz'];

const MIDJOURNEY_PATTERN = /^midjourney[-_]/i;

const IMAGE_PATTERN =
  /seedream|dola-seedream|image|qwen-image|mai-image|flux-3-image|(?:^|[-_])nb-|gk-v\d|g-v2|(?:^|[-_])t2i(?:$|[-_])|(?:^|[-_])i2i(?:$|[-_])|layer-decomposition/i;

const AUDIO_PATTERN = /suno|music|song|bgm|(?:^|[-_])tts(?:$|[-_])|speech|voice|audio|vocal|mureka|lyrics/i;

const VIDEO_PATTERN =
  /(?:^|[-_/])(?:t2v|i2v|r2v|v2v|multi|start-end|short-play|video|motion|upscale|upscaler|lip-sync|dub|draft-enhance|animate)(?:$|[-_/])|kling|hailuo|vidu|seedance|wan-3|sora|veo|animate-|flashvsr|vosr2-video/i;

export function isTaskRelayBaseUrl(baseUrl: string): boolean {
  try {
    const host = new URL(String(baseUrl || '')).hostname.toLowerCase();
    return TASK_RELAY_HOSTS.some((item) => host === item || host.endsWith(`.${item}`));
  } catch {
    return false;
  }
}

export function suggestCapability(upstreamModelId: string): FrameworkCapability {
  const id = String(upstreamModelId || '');
  if (MIDJOURNEY_PATTERN.test(id)) return 'image';
  if (IMAGE_PATTERN.test(id)) return 'image';
  if (AUDIO_PATTERN.test(id)) return 'audio';
  if (VIDEO_PATTERN.test(id)) return 'video';
  return 'text';
}

/** 返回该能力下推荐的协议 id；未知时返回空串，由界面选第一个可用协议。 */
export function suggestProtocolId(
  capability: FrameworkCapability,
  upstreamModelId: string,
  options: { relay: boolean },
): string {
  if (!options.relay) return '';
  const id = String(upstreamModelId || '');
  if (capability === 'image') {
    return MIDJOURNEY_PATTERN.test(id) ? 'midjourney-images' : 'async-image-tasks';
  }
  if (capability === 'video') {
    // Seedance 2.x 与 Zhenzhen 视频走 /v1/videos，其余（Wan / Vidu / Kling 等）走通用任务接口。
    return /^seedance-2\.|^zhenzhen-video|^zhenzhen-upscaler/i.test(id)
      ? 'openai-videos'
      : 'async-video-tasks';
  }
  if (capability === 'audio') {
    return /^suno[-_]|^music-/i.test(id) ? 'suno-music' : 'async-audio-tasks';
  }
  return 'openai-chat-completions';
}

export function suggestModelPreset(
  upstreamModelId: string,
  baseUrl: string,
): { capability: FrameworkCapability; protocolId: string } {
  const capability = suggestCapability(upstreamModelId);
  return {
    capability,
    protocolId: suggestProtocolId(capability, upstreamModelId, {
      relay: isTaskRelayBaseUrl(baseUrl),
    }),
  };
}
