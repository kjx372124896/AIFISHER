import { NodeType } from '../types';

/**
 * 图像画质比例
 */
export const IMAGE_RESOLUTIONS = ["512", "1K", "2K", "4K"];
export const IMAGE_RATIOS = ["1:1", "2:3", "3:2", "9:16", "16:9", "3:4", "4:3", "5:4", "4:5", "21:9", "1:4", "1:8", "4:1", "8:1", "2:1"];
/**
 * 视频画质比例
 */
export const VIDEO_RESOLUTIONS   = ["480p", "720p", "1080p"];
export const VIDEO_ASPECT_RATIOS = ["1:1", "2:3", "3:2", "9:16", "16:9", "3:4", "4:3", "5:4", "4:5", "21:9"];

/**
 * 文本频画质比例
 */
export const TEXT_RESOLUTIONS = [];
export const TEXT_ASPECT_RATIOS = [];

/**
 * 文本模型配置
 * maxInputs: 最大连线数量
 * languageModes: 模式配置，包含该模式下允许的输入类型及数量
 * cost: 生成开销
 */
export const TEXT_MODELS = [
    {
        name:                       '豆包大语言2.0-mini',
        description:                '低成本、高并发、多模态极致速度',
        timeEstimate:               '2min',
        provider:                   'DoubaoTextProvider',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image', 'video'],
        supportedImageFormats:      ['jpeg', 'png', 'webp', 'bmp', 'tiff'],
        maxImageSizeMb:             10,
        maxResolution:              '4096*4096',
        resolutions:                [],
        aspectRatios:               [],
        cost:                       0.01,
        languageModes: [
            { label: '多模态对话', value: 'multimodal-chat', allowedInputs: { 'text': 10, 'image': 10, 'video': 1 } }
        ],
        endpoint: {
            'multimodal-chat': {
                url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
                model: 'doubao-seed-2-0-mini-260428'
            }
        },
        advancedParams: [
            {
                key: 'reasoning', label: '思考强度', type: 'select', default: 'minimal', options: [
                    { label: '高', value: 'high' },
                    { label: '中等', value: 'medium' },
                    { label: '低', value: 'low' },
                    { label: '关闭', value: 'minimal' }
                ]
            },
            {
                key: 'detail', label: '图片细节', type: 'select', default: 'low', options: [
                    { label: '超高', value: 'xhigh' },
                    { label: '高', value: 'high' },
                    { label: '低', value: 'low' }
                ]
            }
        ]
    },
    {
        name:                       '豆包大语言2.0-lite',
        description:                '豆包 2.0 lite 官方多模态大语言模型，费用以官方账单为准',
        timeEstimate:               '2min',
        provider:                   'DoubaoTextProvider',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image', 'video'],
        supportedImageFormats:      ['jpeg', 'png', 'webp', 'bmp', 'tiff'],
        maxImageSizeMb:             10,
        maxResolution:              '4096*4096',
        resolutions:                [],
        aspectRatios:               [],
        languageModes: [
            { label: '多模态对话', value: 'multimodal-chat', allowedInputs: { 'text': 10, 'image': 10, 'video': 1 } }
        ],
        endpoint: {
            'multimodal-chat': {
                url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
                model: 'doubao-seed-2-0-lite-260428'
            }
        },
        advancedParams: [
            {
                key: 'reasoning', label: '思考强度', type: 'select', default: 'medium', options: [
                    { label: '高', value: 'high' },
                    { label: '中等', value: 'medium' },
                    { label: '低', value: 'low' },
                    { label: '关闭', value: 'minimal' }
                ]
            },
            {
                key: 'detail', label: '图片细节', type: 'select', default: 'low', options: [
                    { label: '超高', value: 'xhigh' },
                    { label: '高', value: 'high' },
                    { label: '低', value: 'low' }
                ]
            }
        ]
    },
    {
        name:                       '豆包大语言2.1-pro',
        description:                '豆包 2.1 pro 官方多模态大语言模型，费用以官方账单为准',
        timeEstimate:               '2min',
        provider:                   'DoubaoTextProvider',
        selectable:                 false,
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image', 'video'],
        supportedImageFormats:      ['jpeg', 'png', 'webp', 'bmp', 'tiff'],
        maxImageSizeMb:             10,
        maxResolution:              '4096*4096',
        resolutions:                [],
        aspectRatios:               [],
        languageModes: [
            { label: '多模态对话', value: 'multimodal-chat', allowedInputs: { 'text': 10, 'image': 10, 'video': 1 } }
        ],
        endpoint: {
            'multimodal-chat': {
                url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
                model: 'doubao-seed-2-1-pro-260628'
            }
        },
        advancedParams: [
            {
                key: 'reasoning', label: '思考强度', type: 'select', default: 'high', options: [
                    { label: '高', value: 'high' },
                    { label: '中等', value: 'medium' },
                    { label: '低', value: 'low' },
                    { label: '关闭', value: 'minimal' }
                ]
            },
            {
                key: 'detail', label: '图片细节', type: 'select', default: 'low', options: [
                    { label: '超高', value: 'xhigh' },
                    { label: '高', value: 'high' },
                    { label: '低', value: 'low' }
                ]
            }
        ]
    },
    {
        name:                       '豆包大语言2.1-turbo',
        description:                '豆包 2.1 turbo 官方多模态大语言模型，费用以官方账单为准',
        timeEstimate:               '2min',
        provider:                   'DoubaoTextProvider',
        selectable:                 false,
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image', 'video'],
        supportedImageFormats:      ['jpeg', 'png', 'webp', 'bmp', 'tiff'],
        maxImageSizeMb:             10,
        maxResolution:              '4096*4096',
        resolutions:                [],
        aspectRatios:               [],
        languageModes: [
            { label: '多模态对话', value: 'multimodal-chat', allowedInputs: { 'text': 10, 'image': 10, 'video': 1 } }
        ],
        endpoint: {
            'multimodal-chat': {
                url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
                model: 'doubao-seed-2-1-turbo-260628'
            }
        },
        advancedParams: [
            {
                key: 'reasoning', label: '思考强度', type: 'select', default: 'high', options: [
                    { label: '高', value: 'high' },
                    { label: '中等', value: 'medium' },
                    { label: '低', value: 'low' },
                    { label: '关闭', value: 'minimal' }
                ]
            },
            {
                key: 'detail', label: '图片细节', type: 'select', default: 'low', options: [
                    { label: '超高', value: 'xhigh' },
                    { label: '高', value: 'high' },
                    { label: '低', value: 'low' }
                ]
            }
        ]
    },
    {
        name:                       '豆包大语言2.0-pro',
        description:                '高性能、高精度、多模态深度推理',
        timeEstimate:               '2min',
        provider:                   'DoubaoTextProvider',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image', 'video'],
        supportedImageFormats:      ['jpeg', 'png', 'webp', 'bmp', 'tiff'],
        maxImageSizeMb:             10,
        maxResolution:              '4096*4096',
        resolutions:                [],
        aspectRatios:               [],
        cost:                       0.05,
        languageModes: [
            { label: '多模态对话', value: 'multimodal-chat', allowedInputs: { 'text': 10, 'image': 10, 'video': 1 } }
        ],
        endpoint: {
            'multimodal-chat': {
                url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
                model: 'doubao-seed-2-0-pro-260215'
            }
        },
        advancedParams: [
            {
                key: 'reasoning', label: '思考强度', type: 'select', default: 'minimal', options: [
                    { label: '高', value: 'high' },
                    { label: '中等', value: 'medium' },
                    { label: '低', value: 'low' },
                    { label: '关闭', value: 'minimal' }
                ]
            },
            {
                key: 'detail', label: '图片细节', type: 'select', default: 'low', options: [
                    { label: '超高', value: 'xhigh' },
                    { label: '高', value: 'high' },
                    { label: '低', value: 'low' }
                ]
            }
        ]
    },
    {
        name:                       'DeepSeek-V4-Flash',
        description:                '极速文本推理与深度思考，不支持图片或视频输入',
        timeEstimate:               '1min',
        provider:                   'DeepSeekProvider',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text'],
        supportedImageFormats:      [],
        maxImageSizeMb:             0,
        maxResolution:              '',
        resolutions:                [],
        aspectRatios:               [],
        cost:                       0.02,
        languageModes: [
            { label: '文本对话', value: 'multimodal-chat', allowedInputs: { 'text': 10 } }
        ],
        endpoint: {
            'multimodal-chat': {
                url: 'https://api.deepseek.com/chat/completions',
                model: 'deepseek-v4-flash'
            }
        },
        advancedParams: [
            {
                key: 'reasoning_effort', label: '思考强度', type: 'select', default: 'high', options: [
                    { label: '低', value: 'low' },
                    { label: '高', value: 'high' },
                    { label: '最高', value: 'max' }
                ]
            }]
    },
    {
        name:                       'DeepSeek-V4-Pro',
        description:                '高性能文本推理与深度思考，不支持图片或视频输入',
        timeEstimate:               '1min',
        provider:                   'DeepSeekProvider',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text'],
        supportedImageFormats:      [],
        maxImageSizeMb:             0,
        maxResolution:              '',
        resolutions:                [],
        aspectRatios:               [],
        cost:                       0.025,
        languageModes: [
            { label: '文本对话', value: 'multimodal-chat', allowedInputs: { 'text': 10 } }
        ],
        endpoint: {
            'multimodal-chat': {
                url: 'https://api.deepseek.com/chat/completions',
                model: 'deepseek-v4-pro'
            }
        },
        advancedParams: [
            {
                key: 'reasoning_effort', label: '思考强度', type: 'select', default: 'high', options: [
                    { label: '低', value: 'low' },
                    { label: '高', value: 'high' },
                    { label: '最高', value: 'max' }
                ]
            }]
    },
    {
        name:                       'DeepSeek-V4.1-Flash',
        description:                'DeepSeek V4.1 Flash 文本推理与深度思考，不支持图片或视频输入。',
        timeEstimate:               '1min',
        provider:                   'DeepSeekProvider',
        source:                     'official',
        canonicalModel:             'DeepSeek-V4.1-Flash',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text'],
        supportedImageFormats:      [],
        maxImageSizeMb:             0,
        maxResolution:              '',
        resolutions:                [],
        aspectRatios:               [],
        cost:                       0,
        priceTextByMode: {
            'multimodal-chat': { 'default': '按官方 Token 账单结算' }
        },
        languageModes: [
            { label: '文本对话', value: 'multimodal-chat', allowedInputs: { 'text': 10 } }
        ],
        endpoint: {
            'multimodal-chat': {
                url: 'https://api.deepseek.com/chat/completions',
                model: 'deepseek-flash'
            }
        },
        advancedParams: [
            {
                key: 'reasoning_effort', label: '思考强度', type: 'select', default: 'high', options: [
                    { label: '低', value: 'low' },
                    { label: '高', value: 'high' },
                    { label: '最高', value: 'max' }
                ]
            }
        ]
    },
    {
        name:                       'DeepSeek-V4-Flash-Vision-Exp',
        description:                'DeepSeek 官方实验性视觉理解模型；支持图片、截图与图表分析，不生成图片。',
        timeEstimate:               '1min',
        provider:                   'DeepSeekProvider',
        source:                     'official',
        canonicalModel:             'DeepSeek-V4-Flash-Vision-Exp',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image'],
        supportedImageFormats:      ['jpeg', 'png', 'gif', 'webp'],
        maxImageSizeMb:             32,
        maxResolution:              '8192*8192',
        resolutions:                [],
        aspectRatios:               [],
        cost:                       0,
        priceTextByMode: {
            'multimodal-chat': { 'default': '按官方峰/谷 Token 账单结算（图片折算为输入 Token）' }
        },
        languageModes: [
            { label: '视觉理解', value: 'multimodal-chat', allowedInputs: { 'text': 10, 'image': 10 } }
        ],
        endpoint: {
            'multimodal-chat': {
                url: 'https://api.deepseek.com/chat/completions',
                model: 'deepseek-v4-flash-vision-exp'
            }
        },
        advancedParams: [
            {
                key: 'reasoning_effort', label: '思考强度', type: 'select', default: 'high', options: [
                    { label: '低', value: 'low' },
                    { label: '高', value: 'high' },
                    { label: '最高', value: 'max' }
                ]
            },
            {
                key: 'detail', label: '图片细节', type: 'select', default: 'auto', options: [
                    { label: '自动', value: 'auto' },
                    { label: '原图', value: 'original' },
                    { label: '低（更快）', value: 'low' }
                ]
            }
        ]
    },
    {
        name:                       'GLM 5.3',
        description:                '智谱 GLM 5.3 官方直连；支持低、高、最大三档思考强度。',
        timeEstimate:               '2min',
        provider:                   'GlmTextProvider',
        source:                     'official',
        canonicalModel:             'GLM 5.3',
        brand:                      'GLM',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text'],
        resolutions:                [],
        aspectRatios:               [],
        cost:                       0,
        priceTextByMode: {
            'multimodal-chat': { 'default': '按官方 Token 账单结算' }
        },
        languageModes: [
            { label: '文本对话', value: 'multimodal-chat', allowedInputs: { 'text': 10 } }
        ],
        endpoint: {
            'multimodal-chat': { url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions', model: 'glm-5.3' }
        },
        advancedParams: [
            {
                key: 'reasoning_effort', label: '思考强度', type: 'select', default: 'max', options: [
                    { label: '低', value: 'low' },
                    { label: '高', value: 'high' },
                    { label: '最大', value: 'max' }
                ]
            }
        ]
    },
    {
        name:                       'GLM 5.3 Flash',
        description:                '智谱 GLM 5.3 Flash 官方直连；低延迟、高性价比。',
        timeEstimate:               '1min',
        provider:                   'GlmTextProvider',
        source:                     'official',
        canonicalModel:             'GLM 5.3 Flash',
        brand:                      'GLM',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image'],
        supportedImageFormats:      ['jpeg', 'png', 'gif', 'webp'],
        maxImageSizeMb:             32,
        maxResolution:              '8192*8192',
        resolutions:                [],
        aspectRatios:               [],
        cost:                       0,
        priceTextByMode: {
            'multimodal-chat': { 'default': '按官方 Token 账单结算' }
        },
        languageModes: [
            { label: '多模态对话', value: 'multimodal-chat', allowedInputs: { 'text': 10, 'image': 10 } }
        ],
        endpoint: {
            'multimodal-chat': { url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions', model: 'glm-5.3-flash' }
        },
        advancedParams: [
            {
                key: 'reasoning_effort', label: '思考强度', type: 'select', default: 'max', options: [
                    { label: '低', value: 'low' },
                    { label: '高', value: 'high' },
                    { label: '最大', value: 'max' }
                ]
            }
        ]
    },
    {
        name:                       'Kimi K3',
        description:                'Kimi 官方直连；按官方输入与输出 Token 账单结算。',
        timeEstimate:               '2min',
        provider:                   'KimiTextProvider',
        source:                     'official',
        canonicalModel:             'Kimi K3',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image'],
        resolutions:                [],
        aspectRatios:               [],
        cost:                       0,
        priceTextByMode: {
            'multimodal-chat': { 'default': '按官方 Token 账单结算' }
        },
        languageModes: [
            { label: '图文对话', value: 'multimodal-chat', allowedInputs: { 'text': 10, 'image': 9 } }
        ],
        endpoint: {
            'multimodal-chat': { url: 'https://api.moonshot.cn/v1/chat/completions', model: 'kimi-k3' }
        },
        advancedParams: [
            {
                key: 'reasoning_effort', label: '思考强度', type: 'select', default: 'max', options: [
                    { label: '低', value: 'low' },
                    { label: '高', value: 'high' },
                    { label: '最高', value: 'max' }
                ]
            }
        ]
    },
];

/**
 * 图像模型配置
 * maxInputs: 最大连线数量
 * imageModes: 模式配置，包含该模式下允许的输入类型及数量
 * aspectRatios: 支持的比例
 * resolutions: 支持的分辨率
 * cost: 生成开销
 */
export const IMAGE_MODELS = [
    {
        name: 'Lib Image 2.5 Fast · LibTV CLI', brand: 'Lib Image',
        description: '使用当前画布账号绑定的 LibTV CLI，按 LibTV 积分账单扣费。',
        timeEstimate: '30min', provider: 'LibTvCliImageProvider', source: 'libtv_cli',
        canonicalModel: 'Lib Image 2.5 Fast', maxConcurrent: 1, useProxy: false,
        maxInputs: 14, supportedReferenceTypes: ['text', 'image'],
        supportedImageFormats: ['jpeg', 'png', 'webp'], maxImageSizeMb: 25,
        resolutions: ['1K', '2K', '4K'],
        aspectRatios: ['1:1','1:2','2:1','9:16','16:9','3:4','4:3','3:2','2:3','5:4','4:5','21:9','9:21'],
        cost: 0,
        imageModes: [
            { label: '文生图', value: 'text-to-image', allowedInputs: { text: 10 } },
            { label: '图生图', value: 'image-to-image', allowedInputs: { text: 10, image: 14 } }
        ],
        endpoint: {
            'text-to-image': { url: 'local:libtv-cli', model: 'Lib Image 2.5 Fast' },
            'image-to-image': { url: 'local:libtv-cli', model: 'Lib Image 2.5 Fast' }
        },
        advancedParams: [{ key: 'generateCount', label: '生成数量', type: 'select', default: 1, options: [{ label: '1', value: 1 }, { label: '2', value: 2 }, { label: '4', value: 4 }] }]
    },
    {
        name:                       'Seedream 5.0 Pro · 即梦 CLI',
        brand:                      'Seedream',
        description:                '使用当前账号登录的即梦 CLI；按即梦积分账单扣费，1K 档会按 CLI 的 1.5K 档提交。',
        timeEstimate:               '15min',
        provider:                   'DreaminaCliImageProvider',
        source:                     'dreamina_cli',
        canonicalModel:             'Seedream v5 Pro',
        maxConcurrent:              1,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image'],
        supportedImageFormats:      ['jpeg', 'png', 'webp'],
        maxImageSizeMb:             25,
        maxResolution:              '6240*6240',
        resolutions:                ['1K', '2K', '4K'],
        aspectRatios:               ['1:1', '2:3', '3:2', '9:16', '16:9', '3:4', '4:3', '21:9'],
        cost:                       0,
        imageModes: [
            { label: '文生图', value: 'text-to-image', allowedInputs: { 'text': 10 } },
            { label: '图生图', value: 'image-to-image', allowedInputs: { 'text': 10, 'image': 10 } }
        ],
        endpoint: {
            'text-to-image': { url: 'local:dreamina-cli', model: '5.0Pro' },
            'image-to-image': { url: 'local:dreamina-cli', model: '5.0Pro' }
        },
        advancedParams: [
            { key: 'generateCount', label: '生成数量', type: 'slider', default: 1, min: 1, max: 10 }
        ]
    },
    {
        name:                       '即梦图片3.0',
        description:                '影视质感,文字更准',
        timeEstimate:               '1min',
        provider:                   'JimengImageProvider',
        selectable:                 false,
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image'],
        supportedImageFormats:      ['jpeg', 'png'],
        maxImageSizeMb:             4.7,
        maxResolution:              '4096*4096',
        resolutions:                ["1K", "2K"],
        aspectRatios:               ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"],
        cost: {
            "512": 0.2,
            "1K": 0.2,
            "2K": 0.2,
            "4K": 0.2
        },
        imageModes: [
            { label: '文生图', value: 'text-to-image', allowedInputs: { 'text': 10 } },
            { label: '图生图', value: 'image-to-image', allowedInputs: { 'text': 10, 'image': 1 } }
        ],
        endpoint: {
            'text-to-image': {
                url: 'https://visual.volcengineapi.com/?Action=CVSync2AsyncSubmitTask&Version=2022-08-31',
                model: 'jimeng_t2i_v30'
            },
            'image-to-image': {
                url: 'https://visual.volcengineapi.com/?Action=CVSync2AsyncSubmitTask&Version=2022-08-31',
                model: 'jimeng_i2i_v30'
            }
        },
        advancedParams: [
            { key: 'use_pre_llm', label: '提示词优化', type: 'toggle', default: true },
            { key: 'generateCount', label: '生成数量', type: 'slider', default: 1, min: 1, max: 1 }
        ]
    },
    {
        name:                       '即梦图片3.1',
        description:                '丰富的美学多样性,画面鲜明生动',
        timeEstimate:               '1min',
        provider:                   'JimengImageProvider',
        selectable:                 false,
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text'],
        supportedImageFormats:      [],
        maxImageSizeMb:             0,
        maxResolution:              '',
        resolutions:                ["1K", "2K"],
        aspectRatios:               ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"],
        cost: {
            "512": 0.2,
            "1K": 0.2,
            "2K": 0.2,
            "4K": 0.2
        },
        imageModes: [
            { label: '文生图', value: 'text-to-image', allowedInputs: { 'text': 10 } }
        ],
        endpoint: {
            'text-to-image': {
                url: 'https://visual.volcengineapi.com/?Action=CVSync2AsyncSubmitTask&Version=2022-08-31',
                model: 'jimeng_t2i_v31'
            }
        },
        advancedParams: [
            { key: 'use_pre_llm', label: '提示词优化', type: 'toggle', default: true },
            { key: 'generateCount', label: '生成数量', type: 'slider', default: 1, min: 1, max: 1 }
        ]
    },
    {
        name:                       '豆包图片4.0(多参考)',
        description:                '美感、匹配、一致与速度',
        timeEstimate:               '1min',
        provider:                   'DoubaoImageProvider',
        selectable:                 false,
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image'],
        supportedImageFormats:      ['jpeg', 'png', 'webp', 'bmp', 'tiff'],
        maxImageSizeMb:             10,
        maxResolution:              '4096*4096',
        resolutions:                ["1K", "2K", "4K"],
        aspectRatios:               ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"],
        cost: {
            "512": 0.2,
            "1K": 0.2,
            "2K": 0.2,
            "4K": 0.2
        },
        imageModes: [
            { label: '文生图', value: 'text-to-image', allowedInputs: { 'text': 10 } },
            { label: '图生图', value: 'image-to-image', allowedInputs: { 'text': 10, 'image': 10} }
        ],
        endpoint: {
            'text-to-image': {
                url: 'https://ark.cn-beijing.volces.com/api/v3/images/generations',
                model: 'doubao-seedream-4-0-250828'
            },
            'image-to-image': {
                url: 'https://ark.cn-beijing.volces.com/api/v3/images/generations',
                model: 'doubao-seedream-4-0-250828'
            }
        },
        advancedParams: [
            { key: 'generateCount', label: '生成数量', type: 'slider', default: 1, min: 1, max: 4 }
        ]
    },
    {
        name:                       '豆包图片4.5(多参考)',
        description:                '美感、匹配、一致与速度++',
        timeEstimate:               '1min',
        provider:                   'DoubaoImageProvider',
        selectable:                 false,
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image'],
        supportedImageFormats:      ['jpeg', 'png', 'webp', 'bmp', 'tiff'],
        maxImageSizeMb:             10,
        maxResolution:              '4096*4096',
        resolutions:                ["2K", "4K"],
        aspectRatios:               ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"],
        cost: {
            "512": 0.25,
            "1K": 0.25,
            "2K": 0.25,
            "4K": 0.25
        },
        imageModes: [
            { label: '文生图', value: 'text-to-image', allowedInputs: { 'text': 10 } },
            { label: '图生图', value: 'image-to-image', allowedInputs: { 'text': 10, 'image': 10 } }
        ],
        endpoint: {
            'text-to-image': {
                url: 'https://ark.cn-beijing.volces.com/api/v3/images/generations',
                model: 'doubao-seedream-4-5-251128'
            },
            'image-to-image': {
                url: 'https://ark.cn-beijing.volces.com/api/v3/images/generations',
                model: 'doubao-seedream-4-5-251128'
            }
        },
        advancedParams: [
            { key: 'generateCount', label: '生成数量', type: 'slider', default: 1, min: 1, max: 4 }
        ]
    },
    {
        name:                       '豆包图片5.0-lite',
        description:                '知识广、一致性、支持联网搜索',
        timeEstimate:               '1min',
        provider:                   'DoubaoImageProvider',
        selectable:                 false,
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image'],
        supportedImageFormats:      ['jpeg', 'png', 'webp', 'bmp', 'tiff'],
        maxImageSizeMb:             10,
        maxResolution:              '4096*4096',
        resolutions:                ["2K", "4K"],
        aspectRatios:               ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"],
        cost: {
            "512": 0.22,
            "1K": 0.22,
            "2K": 0.22,
            "4K": 0.22
        },
        imageModes: [
            { label: '文生图', value: 'text-to-image', allowedInputs: { 'text': 10 } },
            { label: '图生图', value: 'image-to-image', allowedInputs: { 'text': 10, 'image': 10 } }
        ],
        endpoint: {
            'text-to-image': {
                url: 'https://ark.cn-beijing.volces.com/api/v3/images/generations',
                model: 'doubao-seedream-5-0-260128'
            },
            'image-to-image': {
                url: 'https://ark.cn-beijing.volces.com/api/v3/images/generations',
                model: 'doubao-seedream-5-0-260128'
            }
        },
        advancedParams: [
            { key: 'web_search', label: '联网搜索', type: 'toggle', default: false },
            { key: 'generateCount', label: '生成数量', type: 'slider', default: 1, min: 1, max: 4 }
        ]
    },
    {
        name:                       'GPT Image 2',
        canonicalModel:             'GPT Image 2',
        description:                'GPT 强力图像生成模型',
        timeEstimate:               '2min',
        provider:                   'GptImageProvider',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image'],
        supportedImageFormats:      ['jpeg', 'png', 'webp'],
        maxImageSizeMb:             10,
        maxResolution:              '4096*4096',
        resolutions:                ["1K", "2K", "4K"],
        aspectRatios:               ["1:1", "2:3", "3:2", "9:16", "16:9", "3:4", "4:3", "5:4", "4:5", "21:9", "2:1"],
        cost: {
            "1K": 0.20,
            "2K": 0.30,
            "4K": 0.75
        },
        imageModes: [
            { label: '文生图', value: 'text-to-image', allowedInputs: { 'text': 10 } },
            { label: '图生图', value: 'image-to-image', allowedInputs: { 'text': 10, 'image': 10 } },
            { label: '遮罩修图', value: 'image-inpainting', allowedInputs: { 'text': 10, 'image': 2 } }
        ],
        endpoint: {
            'text-to-image': {
                url: 'https://api.openai.com/v1/images/generations',
                model: 'gpt-image-2'
            },
            'image-to-image': {
                url: 'https://api.openai.com/v1/images/edits',
                model: 'gpt-image-2'
            },
            'image-inpainting': {
                url: 'https://api.openai.com/v1/images/edits',
                model: 'gpt-image-2'
            }
        },
        advancedParams: [
            {
                key: 'quality', label: '生成质量', type: 'select', default: 'auto', options: [
                    { label: '自动', value: 'auto' },
                    { label: '低', value: 'low' },
                    { label: '中', value: 'medium' },
                    { label: '高', value: 'high' }
                ]
            },
            { key: 'generateCount', label: '生成数量', type: 'slider', default: 1, min: 1, max: 4 }
        ]
    },

    /* ========================================================================
     * RH AI 站（www.runninghub.ai）
     *
     * 2026-08-12 实测：RunningHub 已把整个「全能图片」标准模型系列从 CN 站下线，
     * CN 站每个该系列模型的详情页都渲染「该模型在当前 CN 站已下线，请前往
     * RunningHub 全球站继续使用」（对照组：可灵系列没有这条横幅，说明是条件渲染）。
     * 迁站只换域名：openapi/v2 前缀与 slug 都没动，全球站显示的
     * nano-banana-2 image-to-image economy 只是展示名，接口仍是 rhart-image-n-g31-flash。
     *
     * 两站账号不互通（各自注册、充值、API Key），所以走独立的
     * RunningHubGlobalImageProvider + RUNNINGHUB_GLOBAL_API_KEY。
     *
     * 价格：直接采用 RH AI 站当前价格表已经换算并展示的人民币数字，不再自行按美元汇率折算。
     *
     * 条目内部一律不写 // 注释：构建期注入脚本会压掉换行，行尾注释会吃掉后面所有代码。
     * ======================================================================== */
    {
        name:                       'GPT Image 2 · RH AI站',
        description:                'RH AI 站 gpt-image-2 官方稳定版；采用当前画布 medium 画质档人民币价格',
        timeEstimate:               '5min',
        provider:                   'RunningHubGlobalImageProvider',
        source:                     'runninghub_global',
        canonicalModel:             'GPT Image 2',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image'],
        supportedImageFormats:      ['jpeg', 'png', 'webp'],
        maxImageSizeMb:             20,
        resolutions:                ["1K", "2K", "4K"],
        aspectRatios:               ["1:1", "2:3", "3:2", "9:16", "16:9", "3:4", "4:3"],
        cost:                       { "1K": 0.38, "2K": 0.76, "4K": 1.13 },
        imageModes: [
            { label: '文生图', value: 'text-to-image', allowedInputs: { 'text': 10 } },
            { label: '图生图', value: 'image-to-image', allowedInputs: { 'text': 10, 'image': 10 } }
        ],
        endpoint: {
            'text-to-image':  { url: 'https://www.runninghub.ai/openapi/v2/rhart-image-g-2-official/text-to-image', model: 'rhart-image-g-2-official' },
            'image-to-image': { url: 'https://www.runninghub.ai/openapi/v2/rhart-image-g-2-official/image-to-image', model: 'rhart-image-g-2-official' }
        },
        advancedParams: [
            { key: 'generateCount', label: '生成数量', type: 'slider', default: 1, min: 1, max: 1 }
        ]
    },
    {
        name:                       'GPT Image 2 · RH AI站低价',
        premium:                    true,
        tier:                       'budget',
        description:                'RH AI 站低价渠道，当前画布人民币一口价；分辨率不可控，介意请用官方稳定版',
        timeEstimate:               '5min',
        provider:                   'RunningHubGlobalImageProvider',
        source:                     'runninghub_global',
        canonicalModel:             'GPT Image 2',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image'],
        supportedImageFormats:      ['jpeg', 'png', 'webp'],
        maxImageSizeMb:             20,
        resolutions:                ["1K", "2K", "4K"],
        aspectRatios:               ["1:1", "2:3", "3:2", "9:16", "16:9", "3:4", "4:3"],
        cost:                       0.10,
        imageModes: [
            { label: '文生图', value: 'text-to-image', allowedInputs: { 'text': 10 } },
            { label: '图生图', value: 'image-to-image', allowedInputs: { 'text': 10, 'image': 10 } }
        ],
        endpoint: {
            'text-to-image':  { url: 'https://www.runninghub.ai/openapi/v2/rhart-image-g-2/text-to-image', model: 'rhart-image-g-2' },
            'image-to-image': { url: 'https://www.runninghub.ai/openapi/v2/rhart-image-g-2/image-to-image', model: 'rhart-image-g-2' }
        },
        advancedParams: [
            { key: 'generateCount', label: '生成数量', type: 'slider', default: 1, min: 1, max: 1 }
        ]
    },
    {
        name:                       'Nano Banana Pro · RH AI站',
        description:                'RH AI 站 nano-banana-pro 官方稳定版；采用当前画布人民币价格',
        timeEstimate:               '5min',
        provider:                   'RunningHubGlobalImageProvider',
        source:                     'runninghub_global',
        canonicalModel:             'Nano Banana Pro',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image'],
        supportedImageFormats:      ['jpeg', 'png', 'webp'],
        maxImageSizeMb:             20,
        resolutions:                ["1K", "2K", "4K"],
        aspectRatios:               ["1:1", "2:3", "3:2", "9:16", "16:9", "3:4", "4:3", "21:9"],
        cost:                       { "1K": 0.80, "2K": 1.00, "4K": 1.50 },
        imageModes: [
            { label: '文生图', value: 'text-to-image', allowedInputs: { 'text': 10 } },
            { label: '图生图', value: 'image-to-image', allowedInputs: { 'text': 10, 'image': 10 } }
        ],
        endpoint: {
            'text-to-image':  { url: 'https://www.runninghub.ai/openapi/v2/rhart-image-n-pro-official/text-to-image', model: 'rhart-image-n-pro-official' },
            'image-to-image': { url: 'https://www.runninghub.ai/openapi/v2/rhart-image-n-pro-official/edit', model: 'rhart-image-n-pro-official' }
        },
        advancedParams: [
            { key: 'generateCount', label: '生成数量', type: 'slider', default: 1, min: 1, max: 1 }
        ]
    },
    {
        name:                       'Nano Banana Pro · RH AI站低价',
        premium:                    true,
        tier:                       'budget',
        description:                'RH AI 站低价渠道；采用当前画布人民币价格，稳定性不保证',
        timeEstimate:               '5min',
        provider:                   'RunningHubGlobalImageProvider',
        source:                     'runninghub_global',
        canonicalModel:             'Nano Banana Pro',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image'],
        supportedImageFormats:      ['jpeg', 'png', 'webp'],
        maxImageSizeMb:             20,
        resolutions:                ["1K", "2K", "4K"],
        aspectRatios:               ["1:1", "2:3", "3:2", "9:16", "16:9", "3:4", "4:3", "21:9"],
        cost:                       { "1K": 0.40, "2K": 0.40, "4K": 0.50 },
        imageModes: [
            { label: '文生图', value: 'text-to-image', allowedInputs: { 'text': 10 } },
            { label: '图生图', value: 'image-to-image', allowedInputs: { 'text': 10, 'image': 10 } }
        ],
        endpoint: {
            'text-to-image':  { url: 'https://www.runninghub.ai/openapi/v2/rhart-image-n-pro/text-to-image', model: 'rhart-image-n-pro' },
            'image-to-image': { url: 'https://www.runninghub.ai/openapi/v2/rhart-image-n-pro/edit', model: 'rhart-image-n-pro' }
        },
        advancedParams: [
            { key: 'generateCount', label: '生成数量', type: 'slider', default: 1, min: 1, max: 1 }
        ]
    },
    {
        name:                       'Nano Banana 2 · RH AI站',
        description:                'RH AI 站 nano-banana-2 官方稳定版；采用当前画布人民币价格',
        timeEstimate:               '5min',
        provider:                   'RunningHubGlobalImageProvider',
        source:                     'runninghub_global',
        canonicalModel:             'Nano Banana 2',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  14,
        supportedReferenceTypes:    ['text', 'image'],
        supportedImageFormats:      ['jpeg', 'png', 'webp'],
        maxImageSizeMb:             20,
        resolutions:                ["1K", "2K", "4K"],
        aspectRatios:               ["1:1", "2:3", "3:2", "9:16", "16:9", "3:4", "4:3", "21:9"],
        cost:                       { "1K": 0.49, "2K": 0.74, "4K": 0.99 },
        imageModes: [
            { label: '文生图', value: 'text-to-image', allowedInputs: { 'text': 14 } },
            { label: '图生图', value: 'image-to-image', allowedInputs: { 'text': 14, 'image': 14 } }
        ],
        endpoint: {
            'text-to-image':  { url: 'https://www.runninghub.ai/openapi/v2/rhart-image-n-g31-flash-official/text-to-image', model: 'rhart-image-n-g31-flash-official' },
            'image-to-image': { url: 'https://www.runninghub.ai/openapi/v2/rhart-image-n-g31-flash-official/image-to-image', model: 'rhart-image-n-g31-flash-official' }
        },
        advancedParams: [
            { key: 'generateCount', label: '生成数量', type: 'slider', default: 1, min: 1, max: 1 }
        ]
    },
    {
        name:                       'Nano Banana 2 · RH AI站低价',
        premium:                    true,
        tier:                       'budget',
        description:                'RH AI 站低价渠道；采用当前画布人民币价格，稳定性不保证',
        timeEstimate:               '5min',
        provider:                   'RunningHubGlobalImageProvider',
        source:                     'runninghub_global',
        canonicalModel:             'Nano Banana 2',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  14,
        supportedReferenceTypes:    ['text', 'image'],
        supportedImageFormats:      ['jpeg', 'png', 'webp'],
        maxImageSizeMb:             20,
        resolutions:                ["1K", "2K", "4K"],
        aspectRatios:               ["1:1", "2:3", "3:2", "9:16", "16:9", "3:4", "4:3", "21:9"],
        cost:                       { "1K": 0.19, "2K": 0.19, "4K": 0.30 },
        imageModes: [
            { label: '文生图', value: 'text-to-image', allowedInputs: { 'text': 14 } },
            { label: '图生图', value: 'image-to-image', allowedInputs: { 'text': 14, 'image': 14 } }
        ],
        endpoint: {
            'text-to-image':  { url: 'https://www.runninghub.ai/openapi/v2/rhart-image-n-g31-flash/text-to-image', model: 'rhart-image-n-g31-flash' },
            'image-to-image': { url: 'https://www.runninghub.ai/openapi/v2/rhart-image-n-g31-flash/image-to-image', model: 'rhart-image-n-g31-flash' }
        },
        advancedParams: [
            { key: 'generateCount', label: '生成数量', type: 'slider', default: 1, min: 1, max: 1 }
        ]
    },
    {
        name:                       'Nano Banana 1 · RH AI站',
        description:                'RH AI 站初代 nano-banana 官方稳定版；采用当前画布人民币一口价',
        timeEstimate:               '3min',
        provider:                   'RunningHubGlobalImageProvider',
        source:                     'runninghub_global',
        canonicalModel:             'Nano Banana 1',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image'],
        supportedImageFormats:      ['jpeg', 'png', 'webp'],
        maxImageSizeMb:             20,
        resolutions:                ["1K"],
        aspectRatios:               ["1:1", "2:3", "3:2", "9:16", "16:9", "3:4", "4:3"],
        cost:                       0.20,
        imageModes: [
            { label: '文生图', value: 'text-to-image', allowedInputs: { 'text': 10 } },
            { label: '图生图', value: 'image-to-image', allowedInputs: { 'text': 10, 'image': 10 } }
        ],
        endpoint: {
            'text-to-image':  { url: 'https://www.runninghub.ai/openapi/v2/rhart-image-v1-official/text-to-image', model: 'rhart-image-v1-official' },
            'image-to-image': { url: 'https://www.runninghub.ai/openapi/v2/rhart-image-v1-official/edit', model: 'rhart-image-v1-official' }
        },
        advancedParams: [
            { key: 'generateCount', label: '生成数量', type: 'slider', default: 1, min: 1, max: 1 }
        ]
    },
    {
        name:                       'Nano Banana 1 · RH AI站低价',
        premium:                    true,
        tier:                       'budget',
        description:                'RH AI 站低价渠道，折算自 $0.01 一口价；稳定性不保证',
        timeEstimate:               '3min',
        provider:                   'RunningHubGlobalImageProvider',
        source:                     'runninghub_global',
        canonicalModel:             'Nano Banana 1',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image'],
        supportedImageFormats:      ['jpeg', 'png', 'webp'],
        maxImageSizeMb:             20,
        resolutions:                ["1K"],
        aspectRatios:               ["1:1", "2:3", "3:2", "9:16", "16:9", "3:4", "4:3"],
        cost:                       0.07,
        imageModes: [
            { label: '文生图', value: 'text-to-image', allowedInputs: { 'text': 10 } },
            { label: '图生图', value: 'image-to-image', allowedInputs: { 'text': 10, 'image': 10 } }
        ],
        endpoint: {
            'text-to-image':  { url: 'https://www.runninghub.ai/openapi/v2/rhart-image-v1/text-to-image', model: 'rhart-image-v1' },
            'image-to-image': { url: 'https://www.runninghub.ai/openapi/v2/rhart-image-v1/edit', model: 'rhart-image-v1' }
        },
        advancedParams: [
            { key: 'generateCount', label: '生成数量', type: 'slider', default: 1, min: 1, max: 1 }
        ]
    },
    {
        name:                       'Nano Banana 2 Lite · RH AI站',
        description:                'RH AI 站 nano-banana-2-lite 官方稳定版；采用当前画布人民币一口价',
        timeEstimate:               '3min',
        provider:                   'RunningHubGlobalImageProvider',
        source:                     'runninghub_global',
        canonicalModel:             'Nano Banana 2 Lite',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image'],
        supportedImageFormats:      ['jpeg', 'png', 'webp'],
        maxImageSizeMb:             20,
        resolutions:                ["1K"],
        aspectRatios:               ["1:1", "2:3", "3:2", "9:16", "16:9", "3:4", "4:3"],
        cost:                       0.22,
        imageModes: [
            { label: '文生图', value: 'text-to-image', allowedInputs: { 'text': 10 } },
            { label: '图生图', value: 'image-to-image', allowedInputs: { 'text': 10, 'image': 10 } }
        ],
        endpoint: {
            'text-to-image':  { url: 'https://www.runninghub.ai/openapi/v2/rhart-image-n-g31-flash-lite/text-to-image', model: 'rhart-image-n-g31-flash-lite' },
            'image-to-image': { url: 'https://www.runninghub.ai/openapi/v2/rhart-image-n-g31-flash-lite/image-to-image', model: 'rhart-image-n-g31-flash-lite' }
        },
        advancedParams: [
            { key: 'generateCount', label: '生成数量', type: 'slider', default: 1, min: 1, max: 1 }
        ]
    },
    {
        name:                       'Nano Banana 2 Lite · RH AI站低价',
        premium:                    true,
        tier:                       'budget',
        description:                'RH AI 站低价渠道，折算自 $0.01 一口价；稳定性不保证',
        timeEstimate:               '3min',
        provider:                   'RunningHubGlobalImageProvider',
        source:                     'runninghub_global',
        canonicalModel:             'Nano Banana 2 Lite',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image'],
        supportedImageFormats:      ['jpeg', 'png', 'webp'],
        maxImageSizeMb:             20,
        resolutions:                ["1K"],
        aspectRatios:               ["1:1", "2:3", "3:2", "9:16", "16:9", "3:4", "4:3"],
        cost:                       0.07,
        imageModes: [
            { label: '文生图', value: 'text-to-image', allowedInputs: { 'text': 10 } },
            { label: '图生图', value: 'image-to-image', allowedInputs: { 'text': 10, 'image': 10 } }
        ],
        endpoint: {
            'text-to-image':  { url: 'https://www.runninghub.ai/openapi/v2/rhart-image-n-g31-flash-lite/text-to-image', model: 'rhart-image-n-g31-flash-lite' },
            'image-to-image': { url: 'https://www.runninghub.ai/openapi/v2/rhart-image-n-g31-flash-lite/image-to-image', model: 'rhart-image-n-g31-flash-lite' }
        },
        advancedParams: [
            { key: 'generateCount', label: '生成数量', type: 'slider', default: 1, min: 1, max: 1 }
        ]
    },
    {
        name:                       'Grok 2 · RH AI站',
        brand:                      'Grok 2',
        description:                'RH AI 站 grok-imagine-image 官方稳定版；采用当前画布人民币一口价',
        timeEstimate:               '3min',
        provider:                   'RunningHubGlobalImageProvider',
        source:                     'runninghub_global',
        canonicalModel:             'Grok 2',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  1,
        supportedReferenceTypes:    ['text', 'image'],
        supportedImageFormats:      ['jpeg', 'png', 'webp'],
        maxImageSizeMb:             20,
        resolutions:                ["1K", "2K"],
        aspectRatios:               ["1:1", "2:3", "3:2", "9:16", "16:9", "3:4", "4:3"],
        cost:                       0.14,
        imageModes: [
            { label: '文生图', value: 'text-to-image', allowedInputs: { 'text': 1 } },
            { label: '图生图', value: 'image-to-image', allowedInputs: { 'text': 1, 'image': 1 } }
        ],
        endpoint: {
            'text-to-image':  { url: 'https://www.runninghub.ai/openapi/v2/rhart-image-x-official/text-to-image', model: 'rhart-image-x-official' },
            'image-to-image': { url: 'https://www.runninghub.ai/openapi/v2/rhart-image-x-official/edit', model: 'rhart-image-x-official' }
        },
        advancedParams: [
            { key: 'generateCount', label: '生成数量', type: 'slider', default: 1, min: 1, max: 1 }
        ]
    },
    {
        name:                       'Grok 2 · RH AI站低价',
        brand:                      'Grok 2',
        premium:                    true,
        tier:                       'budget',
        description:                'RH AI 站低价渠道；采用当前画布人民币一口价，稳定性不保证',
        timeEstimate:               '3min',
        provider:                   'RunningHubGlobalImageProvider',
        source:                     'runninghub_global',
        canonicalModel:             'Grok 2',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  1,
        supportedReferenceTypes:    ['text', 'image'],
        supportedImageFormats:      ['jpeg', 'png', 'webp'],
        maxImageSizeMb:             20,
        resolutions:                ["1K", "2K"],
        aspectRatios:               ["1:1", "2:3", "3:2", "9:16", "16:9", "3:4", "4:3"],
        cost:                       0.08,
        imageModes: [
            { label: '文生图', value: 'text-to-image', allowedInputs: { 'text': 1 } },
            { label: '图生图', value: 'image-to-image', allowedInputs: { 'text': 1, 'image': 1 } }
        ],
        endpoint: {
            'text-to-image':  { url: 'https://www.runninghub.ai/openapi/v2/rhart-image-g/text-to-image', model: 'rhart-image-g' },
            'image-to-image': { url: 'https://www.runninghub.ai/openapi/v2/rhart-image-g/image-to-image', model: 'rhart-image-g' }
        },
        advancedParams: [
            { key: 'generateCount', label: '生成数量', type: 'slider', default: 1, min: 1, max: 1 }
        ]
    },

    /* ========================================================================
     * RH CN 站（www.runninghub.cn）标准模型
     *
     * 迁走的只有「全能图片」那一族。Seedream、千问、即梦、悠船、Z-Image 等分类
     * 2026-08-12 实测全部仍在 CN 站在线（详情页没有迁移横幅）。
     * 这里只补当前目录中可直接比较的模型。
     *
     * 价格直接抄 CN 站价格页的人民币牌价，不折算。
     * 接口路径取自各模型详情页的「接口:」字段，前缀 openapi/v2 与全球站一致。
     * 条目内部一律不写 // 注释：注入脚本会压掉换行，行尾注释会吃掉后面所有代码。
     * ======================================================================== */
    {
        name:                       'Seedream v5 Pro · RH CN站',
        description:                'RH CN 站 seedream-v5-pro，牌价 236 万像素以内每张 0.27 元、超出 0.54 元；图生图另计输入图 0.018 元一张，首张免费',
        timeEstimate:               '3min',
        provider:                   'RunningHubImageProvider',
        source:                     'runninghub',
        canonicalModel:             'Seedream v5 Pro',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image'],
        supportedImageFormats:      ['jpeg', 'png', 'webp'],
        maxImageSizeMb:             20,
        resolutions:                ["1K", "2K", "4K"],
        aspectRatios:               ["1:1", "2:3", "3:2", "9:16", "16:9", "3:4", "4:3"],
        cost:                       { "1K": 0.27, "2K": 0.54, "4K": 0.54 },
        rhPriceRules: {
            'total|text-to-image|1k|*|*|*': 0.27,
            'total|text-to-image|2k|*|*|*': 0.54,
            'total|text-to-image|4k|*|*|*': 0.54,
            'total|image-to-image|1k|*|*|*': 0.27,
            'total|image-to-image|2k|*|*|*': 0.54,
            'total|image-to-image|4k|*|*|*': 0.54,
            'image-surcharge|image-to-image|*|1|*|1+': 0.018
        },
        imageModes: [
            { label: '文生图', value: 'text-to-image', allowedInputs: { 'text': 10 } },
            { label: '图生图', value: 'image-to-image', allowedInputs: { 'text': 10, 'image': 10 } }
        ],
        endpoint: {
            'text-to-image':  { url: 'https://www.runninghub.cn/openapi/v2/seedream-v5-pro/text-to-image', model: 'seedream-v5-pro' },
            'image-to-image': { url: 'https://www.runninghub.cn/openapi/v2/seedream-v5-pro/image-to-image', model: 'seedream-v5-pro' }
        },
        advancedParams: [
            { key: 'generateCount', label: '生成数量', type: 'slider', default: 1, min: 1, max: 1 }
        ]
    },
    {
        name:                       'Qwen Image 3.0 · RH CN站',
        description:                'RH CN 站千问 3.0，牌价每张 0.16 元；图像编辑另计输入图 0.02 元一张',
        timeEstimate:               '3min',
        provider:                   'RunningHubImageProvider',
        source:                     'runninghub',
        canonicalModel:             'Qwen Image 3.0',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image'],
        supportedImageFormats:      ['jpeg', 'png', 'webp'],
        maxImageSizeMb:             20,
        resolutions:                ["1K", "2K"],
        aspectRatios:               ["1:1", "2:3", "3:2", "9:16", "16:9", "3:4", "4:3"],
        cost:                       { "1K": 0.16, "2K": 0.16 },
        rhPriceRules: {
            'total|text-to-image|1k|*|*|*': 0.16,
            'total|text-to-image|2k|*|*|*': 0.16,
            'total|image-to-image|1k|*|*|*': 0.16,
            'total|image-to-image|2k|*|*|*': 0.16,
            'image-surcharge|image-to-image|*|0|*|1+': 0.02
        },
        imageModes: [
            { label: '文生图', value: 'text-to-image', allowedInputs: { 'text': 10 } },
            { label: '图生图', value: 'image-to-image', allowedInputs: { 'text': 10, 'image': 10 } }
        ],
        endpoint: {
            'text-to-image':  { url: 'https://www.runninghub.cn/openapi/v2/alibaba/qwen-image-3.0/text-to-image', model: 'alibaba/qwen-image-3.0' },
            'image-to-image': { url: 'https://www.runninghub.cn/openapi/v2/alibaba/qwen-image-3.0/image-edit', model: 'alibaba/qwen-image-3.0' }
        },
        advancedParams: [
            { key: 'generateCount', label: '生成数量', type: 'slider', default: 1, min: 1, max: 1 }
        ]
    },
    {
        name:                       'Qwen Image 3.0 Pro · RH CN站',
        description:                'RH CN 站千问 3.0 Pro，牌价 1K 每张 0.23 元、2K 0.45 元；图像编辑另计输入图 0.02 元一张',
        timeEstimate:               '3min',
        provider:                   'RunningHubImageProvider',
        source:                     'runninghub',
        canonicalModel:             'Qwen Image 3.0 Pro',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image'],
        supportedImageFormats:      ['jpeg', 'png', 'webp'],
        maxImageSizeMb:             20,
        resolutions:                ["1K", "2K"],
        aspectRatios:               ["1:1", "2:3", "3:2", "9:16", "16:9", "3:4", "4:3"],
        cost:                       { "1K": 0.23, "2K": 0.45 },
        rhPriceRules: {
            'total|text-to-image|1k|*|*|*': 0.23,
            'total|text-to-image|2k|*|*|*': 0.45,
            'total|image-to-image|1k|*|*|*': 0.23,
            'total|image-to-image|2k|*|*|*': 0.45,
            'image-surcharge|image-to-image|*|0|*|1+': 0.02
        },
        imageModes: [
            { label: '文生图', value: 'text-to-image', allowedInputs: { 'text': 10 } },
            { label: '图生图', value: 'image-to-image', allowedInputs: { 'text': 10, 'image': 10 } }
        ],
        endpoint: {
            'text-to-image':  { url: 'https://www.runninghub.cn/openapi/v2/alibaba/qwen-image-3.0-pro/text-to-image', model: 'alibaba/qwen-image-3.0-pro' },
            'image-to-image': { url: 'https://www.runninghub.cn/openapi/v2/alibaba/qwen-image-3.0-pro/image-edit', model: 'alibaba/qwen-image-3.0-pro' }
        },
        advancedParams: [
            { key: 'generateCount', label: '生成数量', type: 'slider', default: 1, min: 1, max: 1 }
        ]
    },
    {
        name: 'SeedVR2 高清放大 · RH',
        description: '图片工具栏专用；按 RH 云端应用公开字段接入，使用应用默认放大设置。费用以 RunningHub 账单为准。',
        provider: 'SeedVr2ImageProvider', source: 'runninghub', canonicalModel: 'SeedVR2',
        timeEstimate: '20min', maxConcurrent: 1, useProxy: false, maxInputs: 1,
        supportedReferenceTypes: ['image'], supportedImageFormats: ['png', 'jpeg', 'webp'],
        maxImageSizeMb: 30, resolutions: ['Auto'], aspectRatios: ['Auto'], cost: undefined,
        imageModes: [{ label: '高清放大', value: 'image-to-image', allowedInputs: { image: 1 } }],
        endpoint: { 'image-to-image': { url: 'https://www.runninghub.cn/task/openapi/ai-app/run', model: '2097920992202022914' } },
        advancedParams: [],
    },
];

/**
 * 音频模型配置
 */
export const AUDIO_MODELS = [
    {
        name:                       'Mureka 音乐',
        description:                '支持音乐与音效生成',
        timeEstimate:               '5min',
        provider:                   'MurekaAudioProvider',
        selectable:                 false,
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'audio'],
        supportedAudioFormats:      ['mp3', 'm4a'],
        maxAudioDurationSec:        30,
        resolutions:                [],
        aspectRatios:               [],
        cost:                       0.2,
        audioModes: [
            { label: '歌词音乐', value: 'lyrics-to-music', allowedInputs: { 'text': 10 } },
            { label: '背景音乐', value: 'instrumental', allowedInputs: { 'text': 10 } }
        ],
        endpoint: {
            'lyrics-to-music': {
                url: 'https://api.mureka.cn/v1/song/generate',
                model: 'auto'
            },
            'instrumental': {
                url: 'https://api.mureka.cn/v1/instrumental/generate',
                model: 'auto'
            }
        },
        advancedParams: [
            { key: 'generateCount', label: '生成数量', type: 'slider', default: 1, min: 1, max: 1 }
        ]
    },
];

/**
 * 视频模型配置
 */
export const VIDEO_MODELS = [
    {
        name: 'Seedance 2.5 · LibTV CLI', brand: 'Seedance',
        description: '通过 LibTV CLI 生成视频，支持首帧、首尾帧和图像/视频/音频参考，按 LibTV 积分账单扣费。',
        timeEstimate: '30min', provider: 'LibTvCliVideoProvider', source: 'libtv_cli',
        canonicalModel: 'Seedance 2.5', maxConcurrent: 1, useProxy: false,
        maxInputs: 50, supportedReferenceTypes: ['text', 'image', 'video', 'audio'],
        resolutions: ['480p', '720p', '1080p'], aspectRatios: ['1:1','3:4','16:9','4:3','9:16','21:9'], cost: 0,
        videoModes: [
            { label: '文生视频', value: 'text-to-video', allowedInputs: { text: 10 } },
            { label: '首帧', value: 'first-frame', allowedInputs: { text: 10, image: 1 } },
            { label: '首尾帧', value: 'i2v-first-last-frame', allowedInputs: { text: 10, image: 2 } },
            { label: '全能参考', value: 'multimodal', allowedInputs: { text: 10, image: 30, video: 10, audio: 10 } }
        ],
        endpoint: {
            'text-to-video': { url: 'local:libtv-cli', model: 'Seedance 2.5' },
            'first-frame': { url: 'local:libtv-cli', model: 'Seedance 2.5' },
            'i2v-first-last-frame': { url: 'local:libtv-cli', model: 'Seedance 2.5' },
            multimodal: { url: 'local:libtv-cli', model: 'Seedance 2.5' }
        },
        advancedParams: [{ key: 'duration', label: '生成时长', type: 'slider', default: 5, min: 4, max: 30, unit: 's' }]
    },
    {
        name:                       'Seedance 2.5 · 即梦 CLI',
        brand:                      'Seedance',
        description:                '即梦 CLI 的 Seedance 2.5（仅限具备权限的即梦账号）；按即梦积分账单扣费。',
        timeEstimate:               '30min',
        provider:                   'DreaminaCliVideoProvider',
        source:                     'dreamina_cli',
        canonicalModel:             'Seedance 2.5',
        maxConcurrent:              1,
        useProxy:                   false,
        maxInputs:                  50,
        supportedReferenceTypes:    ['text', 'image', 'video', 'audio'],
        resolutions:                ['480p', '720p', '1080p'],
        aspectRatios:               ['1:1', '3:4', '16:9', '4:3', '9:16', '21:9'],
        cost:                       0,
        videoModes: [
            { label: '文生视频', value: 'text-to-video', allowedInputs: { 'text': 10 } },
            { label: '首帧', value: 'first-frame', allowedInputs: { 'text': 10, 'image': 1 } },
            { label: '首尾帧', value: 'i2v-first-last-frame', allowedInputs: { 'text': 10, 'image': 2 } },
            { label: '全能参考', value: 'multimodal', allowedInputs: { 'text': 10, 'image': 30, 'video': 10, 'audio': 10 } }
        ],
        endpoint: {
            'text-to-video': { url: 'local:dreamina-cli', model: 'seedance2.5' },
            'first-frame': { url: 'local:dreamina-cli', model: 'seedance2.5' },
            'i2v-first-last-frame': { url: 'local:dreamina-cli', model: 'seedance2.5' },
            'multimodal': { url: 'local:dreamina-cli', model: 'seedance2.5' }
        },
        advancedParams: [
            { key: 'duration', label: '生成时长', type: 'slider', default: 5, min: 4, max: 30, unit: 's' }
        ]
    },
    {
        name:                       'Seedance 2.0 Fast · 即梦 CLI',
        brand:                      'Seedance',
        description:                '即梦 CLI 的 Seedance 2.0 Fast；当前公开命令只支持 720p，按即梦积分账单扣费。',
        timeEstimate:               '15min',
        provider:                   'DreaminaCliVideoProvider',
        source:                     'dreamina_cli',
        canonicalModel:             'Seedance 2.0 Fast',
        maxConcurrent:              1,
        useProxy:                   false,
        maxInputs:                  12,
        supportedReferenceTypes:    ['text', 'image', 'video', 'audio'],
        resolutions:                ['720p'],
        aspectRatios:               ['1:1', '3:4', '16:9', '4:3', '9:16', '21:9'],
        cost:                       0,
        videoModes: [
            { label: '文生视频', value: 'text-to-video', allowedInputs: { 'text': 10 } },
            { label: '首帧', value: 'first-frame', allowedInputs: { 'text': 10, 'image': 1 } },
            { label: '首尾帧', value: 'i2v-first-last-frame', allowedInputs: { 'text': 10, 'image': 2 } },
            { label: '全能参考', value: 'multimodal', requiresVisualReference: true, allowedInputs: { 'text': 10, 'image': 9, 'video': 3, 'audio': 3 } }
        ],
        endpoint: {
            'text-to-video': { url: 'local:dreamina-cli', model: 'seedance2.0fast' },
            'first-frame': { url: 'local:dreamina-cli', model: 'seedance2.0fast' },
            'i2v-first-last-frame': { url: 'local:dreamina-cli', model: 'seedance2.0fast' },
            'multimodal': { url: 'local:dreamina-cli', model: 'seedance2.0fast' }
        },
        advancedParams: [
            { key: 'duration', label: '生成时长', type: 'slider', default: 5, min: 4, max: 15, unit: 's' }
        ]
    },
    {
        name:                       'Seedance 2.0 Mini · 即梦 CLI',
        brand:                      'Seedance',
        description:                '即梦 CLI 的 Seedance 2.0 Mini；当前公开命令只支持 720p，按即梦积分账单扣费。',
        timeEstimate:               '15min',
        provider:                   'DreaminaCliVideoProvider',
        source:                     'dreamina_cli',
        canonicalModel:             'Seedance 2.0 Mini',
        maxConcurrent:              1,
        useProxy:                   false,
        maxInputs:                  12,
        supportedReferenceTypes:    ['text', 'image', 'video', 'audio'],
        resolutions:                ['720p'],
        aspectRatios:               ['1:1', '3:4', '16:9', '4:3', '9:16', '21:9'],
        cost:                       0,
        videoModes: [
            { label: '文生视频', value: 'text-to-video', allowedInputs: { 'text': 10 } },
            { label: '首帧', value: 'first-frame', allowedInputs: { 'text': 10, 'image': 1 } },
            { label: '首尾帧', value: 'i2v-first-last-frame', allowedInputs: { 'text': 10, 'image': 2 } },
            { label: '全能参考', value: 'multimodal', requiresVisualReference: true, allowedInputs: { 'text': 10, 'image': 9, 'video': 3, 'audio': 3 } }
        ],
        endpoint: {
            'text-to-video': { url: 'local:dreamina-cli', model: 'seedance2.0mini' },
            'first-frame': { url: 'local:dreamina-cli', model: 'seedance2.0mini' },
            'i2v-first-last-frame': { url: 'local:dreamina-cli', model: 'seedance2.0mini' },
            'multimodal': { url: 'local:dreamina-cli', model: 'seedance2.0mini' }
        },
        advancedParams: [
            { key: 'duration', label: '生成时长', type: 'slider', default: 5, min: 4, max: 15, unit: 's' }
        ]
    },
    {
        name:                       'Seedance 2.0 · 即梦 CLI',
        brand:                      'Seedance',
        description:                '即梦 CLI 的 Seedance 2.0；当前公开命令只支持 720p，按即梦积分账单扣费。',
        timeEstimate:               '15min',
        provider:                   'DreaminaCliVideoProvider',
        source:                     'dreamina_cli',
        canonicalModel:             'Seedance 2.0',
        maxConcurrent:              1,
        useProxy:                   false,
        maxInputs:                  12,
        supportedReferenceTypes:    ['text', 'image', 'video', 'audio'],
        resolutions:                ['720p'],
        aspectRatios:               ['1:1', '3:4', '16:9', '4:3', '9:16', '21:9'],
        cost:                       0,
        videoModes: [
            { label: '文生视频', value: 'text-to-video', allowedInputs: { 'text': 10 } },
            { label: '首帧', value: 'first-frame', allowedInputs: { 'text': 10, 'image': 1 } },
            { label: '首尾帧', value: 'i2v-first-last-frame', allowedInputs: { 'text': 10, 'image': 2 } },
            { label: '全能参考', value: 'multimodal', requiresVisualReference: true, allowedInputs: { 'text': 10, 'image': 9, 'video': 3, 'audio': 3 } }
        ],
        endpoint: {
            'text-to-video': { url: 'local:dreamina-cli', model: 'seedance2.0' },
            'first-frame': { url: 'local:dreamina-cli', model: 'seedance2.0' },
            'i2v-first-last-frame': { url: 'local:dreamina-cli', model: 'seedance2.0' },
            'multimodal': { url: 'local:dreamina-cli', model: 'seedance2.0' }
        },
        advancedParams: [
            { key: 'duration', label: '生成时长', type: 'slider', default: 5, min: 4, max: 15, unit: 's' }
        ]
    },
    {
        name:                       'Seedance 2.5 · RH CN站',
        brand:                      'Seedance',
        description:                'RH CN站 Seedance 2.5。按 completion tokens 动态计费；来源比价会按当前比例、分辨率与时长换算为任务估价。',
        timeEstimate:               '15min',
        provider:                   'RunningHubVideoProvider',
        source:                     'runninghub',
        canonicalModel:             'Seedance 2.5',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image', 'video'],
        resolutions:                ['480p', '720p', '1080p', '2k', '4k'],
        aspectRatios:               ["1:1", "9:16", "16:9", "3:4", "4:3", "21:9"],
        priceFormula:               'seedance-output-tokens',
        tokenPricePerMillion:       87.5,
        tokenVideoPricePerMillion:  52.5,
        resolutionSurcharge:        { '1080p': 0.32, '2k': 0.42, '4k': 0.63 },
        priceTextByMode: {
            'text-to-video': {
                'default': '¥87.5/百万 tokens',
                '480p': '¥87.5/百万 tokens',
                '720p': '¥87.5/百万 tokens',
                '1080p': '¥87.5/百万 tokens + ¥0.32/秒',
                '2k': '¥87.5/百万 tokens + ¥0.42/秒',
                '4k': '¥87.5/百万 tokens + ¥0.63/秒'
            },
            'first-frame': {
                'default': '¥87.5/百万 tokens',
                '480p': '¥87.5/百万 tokens',
                '720p': '¥87.5/百万 tokens',
                '1080p': '¥87.5/百万 tokens + ¥0.32/秒',
                '2k': '¥87.5/百万 tokens + ¥0.42/秒',
                '4k': '¥87.5/百万 tokens + ¥0.63/秒'
            },
            'multimodal': {
                'default': '¥52.5–87.5/百万 tokens',
                '480p': '¥52.5–87.5/百万 tokens',
                '720p': '¥52.5–87.5/百万 tokens',
                '1080p': '¥52.5–87.5/百万 tokens + ¥0.32/秒',
                '2k': '¥52.5–87.5/百万 tokens + ¥0.42/秒',
                '4k': '¥52.5–87.5/百万 tokens + ¥0.63/秒'
            }
        },
        videoModes: [
            { label: '文生视频', value: 'text-to-video', allowedInputs: { 'text': 10 } },
            { label: '首帧', value: 'first-frame', allowedInputs: { 'text': 10, 'image': 2 } },
            { label: '全能参考', value: 'multimodal', allowedInputs: { 'text': 10, 'image': 9, 'video': 3, 'audio': 3 } }
        ],
        endpoint: {
            'text-to-video': { url: 'https://www.runninghub.cn/openapi/v2/bytedance/seedance-2.5-token/text-to-video', model: 'seedance-2.5-token' },
            'first-frame': { url: 'https://www.runninghub.cn/openapi/v2/bytedance/seedance-2.5-token/image-to-video', model: 'seedance-2.5-token' },
            'multimodal': { url: 'https://www.runninghub.cn/openapi/v2/bytedance/seedance-2.5-token/multimodal-video', model: 'seedance-2.5-token' }
        },
        advancedParams: [
            { key: 'duration', label: '生成时长', type: 'slider', default: 5, min: 4, max: 30, unit: 's' }
        ]
    },
    {
        name:                       'Seedance 2.0 · RH CN站',
        brand:                      'Seedance',
        description:                'RH CN站 Seedance 2.0 当前画布价；无参考按生成秒计费，有参考按 RH 时长档计费。',
        timeEstimate:               '15min',
        provider:                   'RunningHubVideoProvider',
        source:                     'runninghub',
        canonicalModel:             'Seedance 2.0',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image', 'video'],
        resolutions:                ['480p', '720p', '1080p', '2k', '4k'],
        aspectRatios:               ["1:1", "9:16", "16:9", "3:4", "4:3", "21:9"],
        cost:                       { '480p': 0.6, '720p': 1.2, '1080p': 1.48, '2k': 1.62, '4k': 1.83 },
        rhPriceRules: {
            'rate|text-to-video|480p|*|*|*': 0.6,
            'rate|text-to-video|720p|*|*|*': 1.2,
            'rate|text-to-video|1080p|*|*|*': 1.48,
            'rate|text-to-video|2k|*|*|*': 1.62,
            'rate|text-to-video|4k|*|*|*': 1.83,
            'rate|first-frame|480p|*|*|*': 0.6,
            'rate|first-frame|720p|*|*|*': 1.2,
            'rate|first-frame|1080p|*|*|*': 1.48,
            'rate|first-frame|2k|*|*|*': 1.62,
            'rate|first-frame|4k|*|*|*': 1.83,
            'rate|multimodal|480p|*|*|0': 0.6,
            'rate|multimodal|720p|*|*|0': 1.2,
            'rate|multimodal|1080p|*|*|0': 1.48,
            'rate|multimodal|2k|*|*|0': 1.62,
            'rate|multimodal|4k|*|*|0': 1.83,
            'floor-rate|multimodal|480p|*|*|1+': 0.4,
            'floor-rate|multimodal|720p|*|*|1+': 0.8,
            'floor-rate|multimodal|1080p|*|*|1+': 0.8,
            'floor-rate|multimodal|2k|*|*|1+': 0.8,
            'floor-rate|multimodal|4k|*|*|1+': 0.8,
            'floor-duration|multimodal|*|4|*|1+': 7,
            'floor-duration|multimodal|*|5|*|1+': 9,
            'floor-duration|multimodal|*|6|*|1+': 10,
            'floor-duration|multimodal|*|7|*|1+': 12,
            'floor-duration|multimodal|*|8|*|1+': 14,
            'floor-duration|multimodal|*|9|*|1+': 15,
            'floor-duration|multimodal|*|10|*|1+': 17,
            'floor-duration|multimodal|*|11|*|1+': 19,
            'floor-duration|multimodal|*|12|*|1+': 20,
            'floor-duration|multimodal|*|13|*|1+': 22,
            'floor-duration|multimodal|*|14|*|1+': 24,
            'floor-duration|multimodal|*|15|*|1+': 25,
            'surcharge-rate|multimodal|1080p|*|*|1+': 0.28,
            'surcharge-rate|multimodal|2k|*|*|1+': 0.42,
            'surcharge-rate|multimodal|4k|*|*|1+': 0.63
        },
        videoModes: [
            { label: '文生视频', value: 'text-to-video', allowedInputs: { 'text': 10 } },
            { label: '首帧', value: 'first-frame', allowedInputs: { 'text': 10, 'image': 2 } },
            { label: '全能参考', value: 'multimodal', allowedInputs: { 'text': 10, 'image': 9, 'video': 3, 'audio': 3 } }
        ],
        endpoint: {
            'text-to-video': { url: 'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0/text-to-video', model: 'sparkvideo-2.0' },
            'first-frame': { url: 'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0/image-to-video', model: 'sparkvideo-2.0' },
            'multimodal': { url: 'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0/multimodal-video', model: 'sparkvideo-2.0' }
        },
        advancedParams: [
            { key: 'duration', label: '生成时长', type: 'slider', default: 5, min: 4, max: 15, unit: 's' }
        ]
    },
    {
        name:                       'Seedance 2.0 Fast · RH CN站',
        brand:                      'Seedance',
        description:                'RH CN站 Seedance 2.0 Fast 当前画布价；无参考按生成秒计费，有参考按 RH 时长档计费。',
        timeEstimate:               '15min',
        provider:                   'RunningHubVideoProvider',
        source:                     'runninghub',
        canonicalModel:             'Seedance 2.0 Fast',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image', 'video'],
        resolutions:                ['480p', '720p', '1080p', '2k', '4k'],
        aspectRatios:               ["1:1", "9:16", "16:9", "3:4", "4:3", "21:9"],
        cost:                       { '480p': 0.5, '720p': 1.0, '1080p': 1.28, '2k': 1.42, '4k': 1.63 },
        rhPriceRules: {
            'rate|text-to-video|480p|*|*|*': 0.5,
            'rate|text-to-video|720p|*|*|*': 1.0,
            'rate|text-to-video|1080p|*|*|*': 1.28,
            'rate|text-to-video|2k|*|*|*': 1.42,
            'rate|text-to-video|4k|*|*|*': 1.63,
            'rate|first-frame|480p|*|*|*': 0.5,
            'rate|first-frame|720p|*|*|*': 1.0,
            'rate|first-frame|1080p|*|*|*': 1.28,
            'rate|first-frame|2k|*|*|*': 1.42,
            'rate|first-frame|4k|*|*|*': 1.63,
            'rate|multimodal|480p|*|*|0': 0.5,
            'rate|multimodal|720p|*|*|0': 1.0,
            'rate|multimodal|1080p|*|*|0': 1.28,
            'rate|multimodal|2k|*|*|0': 1.42,
            'rate|multimodal|4k|*|*|0': 1.63,
            'floor-rate|multimodal|480p|*|*|1+': 0.3,
            'floor-rate|multimodal|720p|*|*|1+': 0.6,
            'floor-rate|multimodal|1080p|*|*|1+': 0.6,
            'floor-rate|multimodal|2k|*|*|1+': 0.6,
            'floor-rate|multimodal|4k|*|*|1+': 0.6,
            'floor-duration|multimodal|*|4|*|1+': 7,
            'floor-duration|multimodal|*|5|*|1+': 9,
            'floor-duration|multimodal|*|6|*|1+': 10,
            'floor-duration|multimodal|*|7|*|1+': 12,
            'floor-duration|multimodal|*|8|*|1+': 14,
            'floor-duration|multimodal|*|9|*|1+': 15,
            'floor-duration|multimodal|*|10|*|1+': 17,
            'floor-duration|multimodal|*|11|*|1+': 19,
            'floor-duration|multimodal|*|12|*|1+': 20,
            'floor-duration|multimodal|*|13|*|1+': 22,
            'floor-duration|multimodal|*|14|*|1+': 24,
            'floor-duration|multimodal|*|15|*|1+': 25,
            'surcharge-rate|multimodal|1080p|*|*|1+': 0.28,
            'surcharge-rate|multimodal|2k|*|*|1+': 0.42,
            'surcharge-rate|multimodal|4k|*|*|1+': 0.63
        },
        videoModes: [
            { label: '文生视频', value: 'text-to-video', allowedInputs: { 'text': 10 } },
            { label: '首帧', value: 'first-frame', allowedInputs: { 'text': 10, 'image': 2 } },
            { label: '全能参考', value: 'multimodal', allowedInputs: { 'text': 10, 'image': 9, 'video': 3, 'audio': 3 } }
        ],
        endpoint: {
            'text-to-video': { url: 'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0-fast/text-to-video', model: 'sparkvideo-2.0-fast' },
            'first-frame': { url: 'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0-fast/image-to-video', model: 'sparkvideo-2.0-fast' },
            'multimodal': { url: 'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0-fast/multimodal-video', model: 'sparkvideo-2.0-fast' }
        },
        advancedParams: [
            { key: 'duration', label: '生成时长', type: 'slider', default: 5, min: 4, max: 15, unit: 's' }
        ]
    },
    {
        name:                       'Seedance 2.0 Mini · RH CN站',
        brand:                      'Seedance',
        description:                'RH CN站 Seedance 2.0 Mini 当前画布价；无参考按生成秒计费，有参考按 RH 时长档计费。',
        timeEstimate:               '15min',
        provider:                   'RunningHubVideoProvider',
        source:                     'runninghub',
        canonicalModel:             'Seedance 2.0 Mini',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image', 'video'],
        resolutions:                ['480p', '720p', '1080p', '2k', '4k'],
        aspectRatios:               ["1:1", "9:16", "16:9", "3:4", "4:3", "21:9"],
        cost:                       { '480p': 0.3, '720p': 0.6, '1080p': 0.88, '2k': 1.02, '4k': 1.23 },
        rhPriceRules: {
            'rate|text-to-video|480p|*|*|*': 0.3,
            'rate|text-to-video|720p|*|*|*': 0.6,
            'rate|text-to-video|1080p|*|*|*': 0.88,
            'rate|text-to-video|2k|*|*|*': 1.02,
            'rate|text-to-video|4k|*|*|*': 1.23,
            'rate|first-frame|480p|*|*|*': 0.3,
            'rate|first-frame|720p|*|*|*': 0.6,
            'rate|first-frame|1080p|*|*|*': 0.88,
            'rate|first-frame|2k|*|*|*': 1.02,
            'rate|first-frame|4k|*|*|*': 1.23,
            'rate|multimodal|480p|*|*|0': 0.3,
            'rate|multimodal|720p|*|*|0': 0.6,
            'rate|multimodal|1080p|*|*|0': 0.88,
            'rate|multimodal|2k|*|*|0': 1.02,
            'rate|multimodal|4k|*|*|0': 1.23,
            'floor-rate|multimodal|480p|*|*|1+': 0.2,
            'floor-rate|multimodal|720p|*|*|1+': 0.4,
            'floor-rate|multimodal|1080p|*|*|1+': 0.4,
            'floor-rate|multimodal|2k|*|*|1+': 0.4,
            'floor-rate|multimodal|4k|*|*|1+': 0.4,
            'floor-duration|multimodal|*|4|*|1+': 7,
            'floor-duration|multimodal|*|5|*|1+': 9,
            'floor-duration|multimodal|*|6|*|1+': 10,
            'floor-duration|multimodal|*|7|*|1+': 12,
            'floor-duration|multimodal|*|8|*|1+': 14,
            'floor-duration|multimodal|*|9|*|1+': 15,
            'floor-duration|multimodal|*|10|*|1+': 17,
            'floor-duration|multimodal|*|11|*|1+': 19,
            'floor-duration|multimodal|*|12|*|1+': 20,
            'floor-duration|multimodal|*|13|*|1+': 22,
            'floor-duration|multimodal|*|14|*|1+': 24,
            'floor-duration|multimodal|*|15|*|1+': 25,
            'surcharge-rate|multimodal|1080p|*|*|1+': 0.28,
            'surcharge-rate|multimodal|2k|*|*|1+': 0.42,
            'surcharge-rate|multimodal|4k|*|*|1+': 0.63
        },
        videoModes: [
            { label: '文生视频', value: 'text-to-video', allowedInputs: { 'text': 10 } },
            { label: '首帧', value: 'first-frame', allowedInputs: { 'text': 10, 'image': 2 } },
            { label: '全能参考', value: 'multimodal', allowedInputs: { 'text': 10, 'image': 9, 'video': 3, 'audio': 3 } }
        ],
        endpoint: {
            'text-to-video': { url: 'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0-mini/text-to-video', model: 'sparkvideo-2.0-mini' },
            'first-frame': { url: 'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0-mini/image-to-video', model: 'sparkvideo-2.0-mini' },
            'multimodal': { url: 'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0-mini/multimodal-video', model: 'sparkvideo-2.0-mini' }
        },
        advancedParams: [
            { key: 'duration', label: '生成时长', type: 'slider', default: 5, min: 4, max: 15, unit: 's' }
        ]
    },
    {
        name:                       'Kling O3 · RH CN站',
        brand:                      'Kling',
        description:                'RH CN站 Kling O3 带声音牌价（¥/秒）。文生/首帧、参考、编辑分别计费。',
        timeEstimate:               '15min',
        provider:                   'RunningHubVideoProvider',
        source:                     'runninghub',
        canonicalModel:             'Kling O3',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image', 'video'],
        resolutions:                ['720p', '1080p'],
        aspectRatios:               ["1:1", "9:16", "16:9", "3:4", "4:3", "21:9"],
        cost:                       { '720p': 0.69, '1080p': 0.69 },
        costByMode: {
            'text-to-video': { '720p': 0.69, '1080p': 0.69 },
            'first-frame': { '720p': 0.69, '1080p': 0.69 },
            'reference-video': { '720p': 0.72, '1080p': 0.72 },
            'video-edit': { '720p': 0.81, '1080p': 0.81 }
        },
        rhPriceRules: {
            'rate|text-to-video|*|*|*|*': 0.69,
            'rate|text-to-video|*|*|false|*': 0.52,
            'rate|first-frame|*|*|*|*': 0.69,
            'rate|first-frame|*|*|false|*': 0.52,
            'rate|reference-video|*|*|*|*': 0.72,
            'rate|reference-video|*|*|false|*': 0.54,
            'input-video-rate|video-edit|*|*|*|*': 0.81
        },
        videoModes: [
            { label: '文生视频', value: 'text-to-video', allowedInputs: { 'text': 10 } },
            { label: '首帧', value: 'first-frame', allowedInputs: { 'text': 10, 'image': 2 } },
            { label: '多图参考', value: 'reference-video', allowedInputs: { 'text': 10, 'image': 9 } },
            { label: '视频编辑', value: 'video-edit', allowedInputs: { 'text': 10, 'video': 1 } }
        ],
        endpoint: {
            'text-to-video': { url: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-std/text-to-video', model: 'kling-video-o3-std' },
            'first-frame': { url: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-std/image-to-video', model: 'kling-video-o3-std' },
            'reference-video': { url: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-std/reference-to-video', model: 'kling-video-o3-std' },
            'video-edit': { url: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-std/video-edit', model: 'kling-video-o3-std' }
        },
        advancedParams: [
            { key: 'duration', label: '生成时长', type: 'slider', default: 5, min: 4, max: 15, unit: 's' }
        ]
    },
    {
        name:                       'Kling O3 Pro · RH CN站',
        brand:                      'Kling',
        description:                'RH CN站 Kling O3 Pro 带声音牌价（¥/秒）。文生/首帧、参考、编辑分别计费。',
        timeEstimate:               '15min',
        provider:                   'RunningHubVideoProvider',
        source:                     'runninghub',
        canonicalModel:             'Kling O3',
        variantLabel:               'Pro',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image', 'video', 'audio'],
        resolutions:                ['720p', '1080p'],
        aspectRatios:               ["1:1", "9:16", "16:9", "3:4", "4:3", "21:9"],
        cost:                       { '720p': 0.87, '1080p': 0.87 },
        costByMode: {
            'text-to-video': { '720p': 0.87, '1080p': 0.87 },
            'first-frame': { '720p': 0.87, '1080p': 0.87 },
            'reference-video': { '720p': 0.90, '1080p': 0.90 },
            'video-edit': { '720p': 1.08, '1080p': 1.08 }
        },
        rhPriceRules: {
            'rate|text-to-video|*|*|*|*': 0.87,
            'rate|text-to-video|*|*|false|*': 0.69,
            'rate|first-frame|*|*|*|*': 0.87,
            'rate|first-frame|*|*|false|*': 0.69,
            'rate|reference-video|*|*|*|*': 0.90,
            'rate|reference-video|*|*|false|*': 0.72,
            'input-video-rate|video-edit|*|*|*|*': 1.08
        },
        videoModes: [
            { label: '文生视频', value: 'text-to-video', allowedInputs: { 'text': 10 } },
            { label: '首帧', value: 'first-frame', allowedInputs: { 'text': 10, 'image': 2 } },
            { label: '多图参考', value: 'reference-video', allowedInputs: { 'text': 10, 'image': 7 } },
            { label: '视频编辑', value: 'video-edit', allowedInputs: { 'text': 10, 'image': 4, 'video': 1 } }
        ],
        endpoint: {
            'text-to-video': { url: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-pro/text-to-video', model: 'kling-video-o3-pro' },
            'first-frame': { url: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-pro/image-to-video', model: 'kling-video-o3-pro' },
            'reference-video': { url: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-pro/reference-to-video', model: 'kling-video-o3-pro' },
            'video-edit': { url: 'https://www.runninghub.cn/openapi/v2/kling-video-o3-pro/video-edit', model: 'kling-video-o3-pro' }
        },
        advancedParams: [
            { key: 'duration', label: '生成时长', type: 'slider', default: 5, min: 4, max: 15, unit: 's' }
        ]
    },
    {
        name:                       'Kling V3 Turbo · RH CN站',
        brand:                      'Kling',
        description:                'RH CN站 Kling V3 Turbo。版本切法与 RunningHub 自己的模型选择器一致。',
        timeEstimate:               '15min',
        provider:                   'RunningHubVideoProvider',
        source:                     'runninghub',
        canonicalModel:             'Kling V3 Turbo',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image', 'video'],
        resolutions:                ['720p', '1080p'],
        aspectRatios:               ["1:1", "9:16", "16:9", "3:4", "4:3", "21:9"],
        cost:                       { '720p': 0.74, '1080p': 0.74 },
        rhPriceRules: {
            'rate|text-to-video|*|*|*|*': 0.74,
            'rate|first-frame|*|*|*|*': 0.74
        },
        videoModes: [
            { label: '文生视频', value: 'text-to-video', allowedInputs: { 'text': 10 } },
            { label: '首帧', value: 'first-frame', allowedInputs: { 'text': 10, 'image': 2 } }
        ],
        endpoint: {
            'text-to-video': { url: 'https://www.runninghub.cn/openapi/v2/kling-v3-turbo-std/text-to-video', model: 'kling-v3-turbo-std' },
            'first-frame': { url: 'https://www.runninghub.cn/openapi/v2/kling-v3-turbo-std/image-to-video', model: 'kling-v3-turbo-std' }
        },
        advancedParams: [
            { key: 'duration', label: '生成时长', type: 'slider', default: 5, min: 3, max: 15, unit: 's' }
        ]
    },
    {
        name:                       'Kling V3.0 · RH CN站',
        brand:                      'Kling',
        description:                'RH CN站 Kling V3.0。版本切法与 RunningHub 自己的模型选择器一致。',
        timeEstimate:               '15min',
        provider:                   'RunningHubVideoProvider',
        source:                     'runninghub',
        canonicalModel:             'Kling V3.0',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image', 'video'],
        resolutions:                ['720p', '1080p'],
        aspectRatios:               ["1:1", "9:16", "16:9", "3:4", "4:3", "21:9"],
        cost:                       { '720p': 0.78, '1080p': 0.78 },
        rhPriceRules: {
            'rate|text-to-video|*|*|*|*': 0.78,
            'rate|text-to-video|*|*|false|*': 0.52,
            'rate|first-frame|*|*|*|*': 0.78,
            'rate|first-frame|*|*|false|*': 0.52
        },
        videoModes: [
            { label: '文生视频', value: 'text-to-video', allowedInputs: { 'text': 10 } },
            { label: '首帧', value: 'first-frame', allowedInputs: { 'text': 10, 'image': 2 } }
        ],
        endpoint: {
            'text-to-video': { url: 'https://www.runninghub.cn/openapi/v2/kling-v3.0-std/text-to-video', model: 'kling-v3.0-std' },
            'first-frame': { url: 'https://www.runninghub.cn/openapi/v2/kling-v3.0-std/image-to-video', model: 'kling-v3.0-std' }
        },
        advancedParams: [
            { key: 'duration', label: '生成时长', type: 'slider', default: 5, min: 3, max: 15, unit: 's' }
        ]
    },
    {
        name:                       'Kling V3 4K · RH CN站',
        brand:                      'Kling',
        description:                'RH CN站 Kling V3 4K。版本切法与 RunningHub 自己的模型选择器一致。',
        timeEstimate:               '15min',
        provider:                   'RunningHubVideoProvider',
        source:                     'runninghub',
        canonicalModel:             'Kling V3 4K',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image', 'video'],
        resolutions:                ['4k'],
        aspectRatios:               ["1:1", "9:16", "16:9", "3:4", "4:3", "21:9"],
        cost:                       { '4k': 2.7 },
        rhPriceRules: {
            'rate|text-to-video|4k|*|*|*': 2.7,
            'rate|first-frame|4k|*|*|*': 2.7
        },
        videoModes: [
            { label: '文生视频', value: 'text-to-video', allowedInputs: { 'text': 10 } },
            { label: '首帧', value: 'first-frame', allowedInputs: { 'text': 10, 'image': 2 } }
        ],
        endpoint: {
            'text-to-video': { url: 'https://www.runninghub.cn/openapi/v2/kling-v3-4k/text-to-video', model: 'kling-v3-4k' },
            'first-frame': { url: 'https://www.runninghub.cn/openapi/v2/kling-v3-4k/image-to-video', model: 'kling-v3-4k' }
        },
        advancedParams: [
            { key: 'duration', label: '生成时长', type: 'slider', default: 5, min: 3, max: 15, unit: 's' }
        ]
    },
    {
        name:                       'MiniMax H3 · RH CN站',
        brand:                      'MiniMax',
        description:                'RH CN站 MiniMax H3 当前画布价；输出视频按分辨率与生成秒计费，多参图片前 5 张免费，超出后每张 ¥0.20。',
        timeEstimate:               '15min',
        provider:                   'RunningHubVideoProvider',
        source:                     'runninghub',
        canonicalModel:             'MiniMax H3',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image', 'video'],
        resolutions:                ['768p', '2k'],
        aspectRatios:               ["1:1", "9:16", "16:9", "3:4", "4:3", "21:9"],
        cost:                       { '768p': 0.38, '2k': 0.62 },
        rhPriceRules: {
            'rate|text-to-video|768p|*|*|*': 0.38,
            'rate|text-to-video|2k|*|*|*': 0.62,
            'rate|first-frame|768p|*|*|*': 0.38,
            'rate|first-frame|2k|*|*|*': 0.62,
            'rate|multimodal|768p|*|*|*': 0.38,
            'rate|multimodal|2k|*|*|*': 0.62,
            'image-surcharge|multimodal|*|5|*|1+': 0.20
        },
        videoModes: [
            { label: '文生视频', value: 'text-to-video', allowedInputs: { 'text': 10 } },
            { label: '首帧', value: 'first-frame', allowedInputs: { 'text': 10, 'image': 2 } },
            { label: '全能参考', value: 'multimodal', allowedInputs: { 'text': 10, 'image': 9, 'video': 3, 'audio': 3 } }
        ],
        endpoint: {
            'text-to-video': { url: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-h3/text-to-video', model: 'hailuo-h3' },
            'first-frame': { url: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-h3/image-to-video', model: 'hailuo-h3' },
            'multimodal': { url: 'https://www.runninghub.cn/openapi/v2/minimax/hailuo-h3/multimodal-to-video', model: 'hailuo-h3' }
        },
        advancedParams: [
            { key: 'duration', label: '生成时长', type: 'slider', default: 5, min: 5, max: 15, unit: 's' }
        ]
    },
    {
        name:                       'Vidu Q3 Pro · RH CN站',
        brand:                      'Vidu',
        description:                'RH CN站 Vidu Q3 Pro。版本切法与 RunningHub 自己的模型选择器一致。',
        timeEstimate:               '15min',
        provider:                   'RunningHubVideoProvider',
        source:                     'runninghub',
        canonicalModel:             'Vidu Q3 Pro',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image', 'video'],
        resolutions:                ['540p', '720p', '1080p', '2k'],
        aspectRatios:               ["1:1", "9:16", "16:9", "3:4", "4:3", "21:9"],
        cost:                       { '540p': 0.31, '720p': 0.66, '1080p': 0.70, '2k': 1.09 },
        rhPriceRules: {
            'rate|text-to-video|540p|*|*|*': 0.31,
            'rate|text-to-video|720p|*|*|*': 0.66,
            'rate|text-to-video|1080p|*|*|*': 0.70,
            'rate|first-frame|540p|*|*|*': 0.31,
            'rate|first-frame|720p|*|*|*': 0.66,
            'rate|first-frame|1080p|*|*|*': 0.70,
            'rate|first-frame|2k|*|*|*': 1.09,
            'rate|i2v-first-last-frame|540p|*|*|*': 0.31,
            'rate|i2v-first-last-frame|720p|*|*|*': 0.66,
            'rate|i2v-first-last-frame|1080p|*|*|*': 0.70
        },
        videoModes: [
            { label: '文生视频', value: 'text-to-video', allowedInputs: { 'text': 10 } },
            { label: '首帧', value: 'first-frame', allowedInputs: { 'text': 10, 'image': 2 } },
            { label: '首尾帧', value: 'i2v-first-last-frame', allowedInputs: { 'text': 10, 'image': 2 } }
        ],
        endpoint: {
            'text-to-video': { url: 'https://www.runninghub.cn/openapi/v2/vidu/text-to-video-q3-pro', model: 'vidu' },
            'first-frame': { url: 'https://www.runninghub.cn/openapi/v2/vidu/image-to-video-q3-pro', model: 'vidu' },
            'i2v-first-last-frame': { url: 'https://www.runninghub.cn/openapi/v2/vidu/start-end-to-video-q3-pro', model: 'vidu' }
        },
        advancedParams: [
            { key: 'duration', label: '生成时长', type: 'slider', default: 5, min: 1, max: 16, unit: 's' }
        ]
    },
    {
        name:                       'Vidu Q3 Turbo · RH CN站',
        brand:                      'Vidu',
        description:                'RH CN站 Vidu Q3 Turbo 牌价（¥/秒）；文生、首帧、首尾帧同价。',
        timeEstimate:               '15min',
        provider:                   'RunningHubVideoProvider',
        source:                     'runninghub',
        canonicalModel:             'Vidu Q3 Turbo',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image'],
        resolutions:                ['540p', '720p', '1080p'],
        aspectRatios:               ["1:1", "9:16", "16:9", "3:4", "4:3", "21:9"],
        cost:                       { '540p': 0.18, '720p': 0.27, '1080p': 0.35 },
        rhPriceRules: {
            'rate|text-to-video|540p|*|*|*': 0.18,
            'rate|text-to-video|720p|*|*|*': 0.27,
            'rate|text-to-video|1080p|*|*|*': 0.35,
            'rate|first-frame|540p|*|*|*': 0.18,
            'rate|first-frame|720p|*|*|*': 0.27,
            'rate|first-frame|1080p|*|*|*': 0.35,
            'rate|i2v-first-last-frame|540p|*|*|*': 0.18,
            'rate|i2v-first-last-frame|720p|*|*|*': 0.27,
            'rate|i2v-first-last-frame|1080p|*|*|*': 0.35
        },
        videoModes: [
            { label: '文生视频', value: 'text-to-video', allowedInputs: { 'text': 10 } },
            { label: '首帧', value: 'first-frame', allowedInputs: { 'text': 10, 'image': 2 } },
            { label: '首尾帧', value: 'i2v-first-last-frame', allowedInputs: { 'text': 10, 'image': 2 } }
        ],
        endpoint: {
            'text-to-video': { url: 'https://www.runninghub.cn/openapi/v2/vidu/text-to-video-q3-turbo', model: 'vidu' },
            'first-frame': { url: 'https://www.runninghub.cn/openapi/v2/vidu/image-to-video-q3-turbo', model: 'vidu' },
            'i2v-first-last-frame': { url: 'https://www.runninghub.cn/openapi/v2/vidu/start-end-to-video-q3-turbo', model: 'vidu' }
        },
        advancedParams: [
            { key: 'duration', label: '生成时长', type: 'slider', default: 5, min: 3, max: 15, unit: 's' }
        ]
    },
    {
        name:                       'Vidu Q3 Reference · RH CN站',
        brand:                      'Vidu',
        description:                'RH CN站 Vidu Q3 独立参考生视频。支持 1–7 张参考图、3–16 秒和 540p/720p/1080p。',
        timeEstimate:               '15min',
        provider:                   'RunningHubVideoProvider',
        source:                     'runninghub',
        canonicalModel:             'Vidu Q3 Reference',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image'],
        resolutions:                ['540p', '720p', '1080p'],
        aspectRatios:               ["1:1", "9:16", "16:9", "3:4", "4:3"],
        cost:                       { '540p': 0.22, '720p': 0.44, '1080p': 0.55 },
        rhPriceRules: {
            'rate|reference-video|540p|*|*|*': 0.22,
            'rate|reference-video|720p|*|*|*': 0.44,
            'rate|reference-video|1080p|*|*|*': 0.55
        },
        videoModes: [
            { label: '多图参考', value: 'reference-video', allowedInputs: { 'text': 10, 'image': 7 } }
        ],
        endpoint: {
            'reference-video': { url: 'https://www.runninghub.cn/openapi/v2/vidu/reference-to-video-q3', model: 'vidu' }
        },
        advancedParams: [
            { key: 'duration', label: '生成时长', type: 'slider', default: 5, min: 3, max: 16, unit: 's' }
        ]
    },
    {
        name:                       'Seedance 2.0 Fast · RH AI站',
        brand:                      'Seedance',
        description:                'RH AI站 Seedance 2.0 Fast 当前画布人民币价；无参考按生成秒计费，有参考按 RH 时长档计费。',
        timeEstimate:               '15min',
        provider:                   'RunningHubGlobalVideoProvider',
        source:                     'runninghub_global',
        canonicalModel:             'Seedance 2.0 Fast',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image', 'video', 'audio'],
        resolutions:                ['480p', '720p', '1080p', '2k', '4k'],
        aspectRatios:               ["1:1", "9:16", "16:9", "3:4", "4:3", "21:9"],
        cost:                       { '480p': 0.56, '720p': 1.12, '1080p': 1.40, '2k': 1.54, '4k': 1.75 },
        rhPriceRules: {
            'rate|text-to-video|480p|*|*|*': 0.56,
            'rate|text-to-video|720p|*|*|*': 1.12,
            'rate|text-to-video|1080p|*|*|*': 1.40,
            'rate|text-to-video|2k|*|*|*': 1.54,
            'rate|text-to-video|4k|*|*|*': 1.75,
            'rate|first-frame|480p|*|*|*': 0.56,
            'rate|first-frame|720p|*|*|*': 1.12,
            'rate|first-frame|1080p|*|*|*': 1.40,
            'rate|first-frame|2k|*|*|*': 1.54,
            'rate|first-frame|4k|*|*|*': 1.75,
            'rate|multimodal|480p|*|*|0': 0.56,
            'rate|multimodal|720p|*|*|0': 1.12,
            'rate|multimodal|1080p|*|*|0': 1.40,
            'rate|multimodal|2k|*|*|0': 1.54,
            'rate|multimodal|4k|*|*|0': 1.75,
            'floor-rate|multimodal|480p|*|*|1+': 0.35,
            'floor-rate|multimodal|720p|*|*|1+': 0.70,
            'floor-rate|multimodal|1080p|*|*|1+': 0.70,
            'floor-rate|multimodal|2k|*|*|1+': 0.70,
            'floor-rate|multimodal|4k|*|*|1+': 0.70,
            'floor-duration|multimodal|*|4|*|1+': 7,
            'floor-duration|multimodal|*|5|*|1+': 9,
            'floor-duration|multimodal|*|6|*|1+': 10,
            'floor-duration|multimodal|*|7|*|1+': 12,
            'floor-duration|multimodal|*|8|*|1+': 14,
            'floor-duration|multimodal|*|9|*|1+': 15,
            'floor-duration|multimodal|*|10|*|1+': 17,
            'floor-duration|multimodal|*|11|*|1+': 19,
            'floor-duration|multimodal|*|12|*|1+': 20,
            'floor-duration|multimodal|*|13|*|1+': 22,
            'floor-duration|multimodal|*|14|*|1+': 24,
            'floor-duration|multimodal|*|15|*|1+': 25,
            'surcharge-rate|multimodal|1080p|*|*|1+': 0.28,
            'surcharge-rate|multimodal|2k|*|*|1+': 0.42,
            'surcharge-rate|multimodal|4k|*|*|1+': 0.63
        },
        videoModes: [
            { label: '文生视频', value: 'text-to-video', allowedInputs: { 'text': 10 } },
            { label: '首帧', value: 'first-frame', allowedInputs: { 'text': 10, 'image': 2 } },
            { label: '全能参考', value: 'multimodal', allowedInputs: { 'text': 10, 'image': 9, 'video': 3, 'audio': 3 } }
        ],
        endpoint: {
            'text-to-video': { url: 'https://www.runninghub.ai/openapi/v2/rhart-video/sparkvideo-2.0-fast/text-to-video', model: 'sparkvideo-2.0-fast' },
            'first-frame': { url: 'https://www.runninghub.ai/openapi/v2/rhart-video/sparkvideo-2.0-fast/image-to-video', model: 'sparkvideo-2.0-fast' },
            'multimodal': { url: 'https://www.runninghub.ai/openapi/v2/rhart-video/sparkvideo-2.0-fast/multimodal-video', model: 'sparkvideo-2.0-fast' }
        },
        advancedParams: [
            { key: 'duration', label: '生成时长', type: 'slider', default: 5, min: 4, max: 15, unit: 's' }
        ]
    },
    {
        name:                       'Kling O3 · RH AI站',
        brand:                      'Kling',
        description:                'RH AI站 Kling O3 带声音牌价（¥/秒）。与 CN 站为独立账号和 API Key；文生/首帧、参考、编辑分别计费。',
        timeEstimate:               '15min',
        provider:                   'RunningHubGlobalVideoProvider',
        source:                     'runninghub_global',
        canonicalModel:             'Kling O3',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image', 'video', 'audio'],
        resolutions:                ['720p', '1080p'],
        aspectRatios:               ["1:1", "9:16", "16:9", "3:4", "4:3", "21:9"],
        cost:                       { '720p': 0.70, '1080p': 0.70 },
        costByMode: {
            'text-to-video': { '720p': 0.70, '1080p': 0.70 },
            'first-frame': { '720p': 0.70, '1080p': 0.70 },
            'reference-video': { '720p': 0.70, '1080p': 0.70 },
            'video-edit': { '720p': 0.77, '1080p': 0.77 }
        },
        rhPriceRules: {
            'rate|text-to-video|*|*|*|*': 0.70,
            'rate|text-to-video|*|*|false|*': 0.56,
            'rate|first-frame|*|*|*|*': 0.70,
            'rate|first-frame|*|*|false|*': 0.56,
            'rate|reference-video|*|*|*|*': 0.70,
            'rate|reference-video|*|*|false|*': 0.56,
            'input-video-rate|video-edit|*|*|*|*': 0.77
        },
        videoModes: [
            { label: '文生视频', value: 'text-to-video', allowedInputs: { 'text': 10 } },
            { label: '首帧', value: 'first-frame', allowedInputs: { 'text': 10, 'image': 2 } },
            { label: '多图参考', value: 'reference-video', allowedInputs: { 'text': 10, 'image': 9 } },
            { label: '视频编辑', value: 'video-edit', allowedInputs: { 'text': 10, 'video': 1 } }
        ],
        endpoint: {
            'text-to-video': { url: 'https://www.runninghub.ai/openapi/v2/kling-video-o3-std/text-to-video', model: 'kling-video-o3-std' },
            'first-frame': { url: 'https://www.runninghub.ai/openapi/v2/kling-video-o3-std/image-to-video', model: 'kling-video-o3-std' },
            'reference-video': { url: 'https://www.runninghub.ai/openapi/v2/kling-video-o3-std/reference-to-video', model: 'kling-video-o3-std' },
            'video-edit': { url: 'https://www.runninghub.ai/openapi/v2/kling-video-o3-std/video-edit', model: 'kling-video-o3-std' }
        },
        advancedParams: [
            { key: 'duration', label: '生成时长', type: 'slider', default: 5, min: 4, max: 15, unit: 's' }
        ]
    },
    {
        name:                       'Kling O3 Pro · RH AI站',
        brand:                      'Kling',
        description:                'RH AI站 Kling O3 Pro 带声音牌价（¥/秒）。与 CN 站为独立账号和 API Key；文生/首帧、参考、编辑分别计费。',
        timeEstimate:               '15min',
        provider:                   'RunningHubGlobalVideoProvider',
        source:                     'runninghub_global',
        canonicalModel:             'Kling O3',
        variantLabel:               'Pro',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image', 'video'],
        resolutions:                ['720p', '1080p'],
        aspectRatios:               ["1:1", "9:16", "16:9", "3:4", "4:3", "21:9"],
        cost:                       { '720p': 0.91, '1080p': 0.91 },
        costByMode: {
            'text-to-video': { '720p': 0.91, '1080p': 0.91 },
            'first-frame': { '720p': 0.91, '1080p': 0.91 },
            'reference-video': { '720p': 0.91, '1080p': 0.91 },
            'video-edit': { '720p': 1.05, '1080p': 1.05 }
        },
        rhPriceRules: {
            'rate|text-to-video|*|*|*|*': 0.91,
            'rate|text-to-video|*|*|false|*': 0.70,
            'rate|first-frame|*|*|*|*': 0.91,
            'rate|first-frame|*|*|false|*': 0.70,
            'rate|reference-video|*|*|*|*': 0.91,
            'rate|reference-video|*|*|false|*': 0.70,
            'input-video-rate|video-edit|*|*|*|*': 1.05
        },
        videoModes: [
            { label: '文生视频', value: 'text-to-video', allowedInputs: { 'text': 10 } },
            { label: '首帧', value: 'first-frame', allowedInputs: { 'text': 10, 'image': 2 } },
            { label: '多图参考', value: 'reference-video', allowedInputs: { 'text': 10, 'image': 7 } },
            { label: '视频编辑', value: 'video-edit', allowedInputs: { 'text': 10, 'image': 4, 'video': 1 } }
        ],
        endpoint: {
            'text-to-video': { url: 'https://www.runninghub.ai/openapi/v2/kling-video-o3-pro/text-to-video', model: 'kling-video-o3-pro' },
            'first-frame': { url: 'https://www.runninghub.ai/openapi/v2/kling-video-o3-pro/image-to-video', model: 'kling-video-o3-pro' },
            'reference-video': { url: 'https://www.runninghub.ai/openapi/v2/kling-video-o3-pro/reference-to-video', model: 'kling-video-o3-pro' },
            'video-edit': { url: 'https://www.runninghub.ai/openapi/v2/kling-video-o3-pro/video-edit', model: 'kling-video-o3-pro' }
        },
        advancedParams: [
            { key: 'duration', label: '生成时长', type: 'slider', default: 5, min: 4, max: 15, unit: 's' }
        ]
    },
    {
        name:                       'Vidu Q3 Turbo · RH AI站',
        brand:                      'Vidu',
        description:                'RH AI站 Vidu Q3 Turbo 牌价（¥/秒）。与 CN 站为独立账号和 API Key；文生、首帧、首尾帧同价。',
        timeEstimate:               '15min',
        provider:                   'RunningHubGlobalVideoProvider',
        source:                     'runninghub_global',
        canonicalModel:             'Vidu Q3 Turbo',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image'],
        resolutions:                ['540p', '720p', '1080p'],
        aspectRatios:               ["1:1", "9:16", "16:9", "3:4", "4:3", "21:9"],
        cost:                       { '540p': 0.21, '720p': 0.28, '1080p': 0.42 },
        rhPriceRules: {
            'rate|text-to-video|540p|*|*|*': 0.21,
            'rate|text-to-video|720p|*|*|*': 0.28,
            'rate|text-to-video|1080p|*|*|*': 0.42,
            'rate|first-frame|540p|*|*|*': 0.21,
            'rate|first-frame|720p|*|*|*': 0.28,
            'rate|first-frame|1080p|*|*|*': 0.42,
            'rate|i2v-first-last-frame|540p|*|*|*': 0.21,
            'rate|i2v-first-last-frame|720p|*|*|*': 0.28,
            'rate|i2v-first-last-frame|1080p|*|*|*': 0.42
        },
        videoModes: [
            { label: '文生视频', value: 'text-to-video', allowedInputs: { 'text': 10 } },
            { label: '首帧', value: 'first-frame', allowedInputs: { 'text': 10, 'image': 2 } },
            { label: '首尾帧', value: 'i2v-first-last-frame', allowedInputs: { 'text': 10, 'image': 2 } }
        ],
        endpoint: {
            'text-to-video': { url: 'https://www.runninghub.ai/openapi/v2/vidu/text-to-video-q3-turbo', model: 'vidu' },
            'first-frame': { url: 'https://www.runninghub.ai/openapi/v2/vidu/image-to-video-q3-turbo', model: 'vidu' },
            'i2v-first-last-frame': { url: 'https://www.runninghub.ai/openapi/v2/vidu/start-end-to-video-q3-turbo', model: 'vidu' }
        },
        advancedParams: [
            { key: 'duration', label: '生成时长', type: 'slider', default: 5, min: 3, max: 15, unit: 's' }
        ]
    },
    {
        name:                       'Vidu Q3 Reference · RH AI站',
        brand:                      'Vidu',
        description:                'RH AI站 Vidu Q3 独立参考生视频。与 CN 站为独立账号和 API Key；支持 1–7 张参考图、3–16 秒和 540p/720p/1080p。',
        timeEstimate:               '15min',
        provider:                   'RunningHubGlobalVideoProvider',
        source:                     'runninghub_global',
        canonicalModel:             'Vidu Q3 Reference',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image'],
        resolutions:                ['540p', '720p', '1080p'],
        aspectRatios:               ["1:1", "9:16", "16:9", "3:4", "4:3"],
        cost:                       { '540p': 0.28, '720p': 0.49, '1080p': 0.63 },
        rhPriceRules: {
            'rate|reference-video|540p|*|*|*': 0.28,
            'rate|reference-video|720p|*|*|*': 0.49,
            'rate|reference-video|1080p|*|*|*': 0.63
        },
        videoModes: [
            { label: '多图参考', value: 'reference-video', allowedInputs: { 'text': 10, 'image': 7 } }
        ],
        endpoint: {
            'reference-video': { url: 'https://www.runninghub.ai/openapi/v2/vidu/reference-to-video-q3', model: 'vidu' }
        },
        advancedParams: [
            { key: 'duration', label: '生成时长', type: 'slider', default: 5, min: 3, max: 16, unit: 's' }
        ]
    },
    {
        name:                       'Grok · RH AI站',
        brand:                      'Grok',
        description:                'RH AI站 Grok-官方稳定版。版本切法与 RunningHub 自己的模型选择器一致。',
        timeEstimate:               '15min',
        provider:                   'RunningHubGlobalVideoProvider',
        source:                     'runninghub_global',
        canonicalModel:             'Grok',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image', 'video'],
        resolutions:                ['480p', '720p', '1080p'],
        aspectRatios:               ["1:1", "9:16", "16:9", "3:4", "4:3", "21:9"],
        cost:                       { '480p': 0.56, '720p': 0.98, '1080p': 1.75 },
        rhPriceRules: {
            'rate|text-to-video|480p|*|*|*': 0.56,
            'rate|text-to-video|720p|*|*|*': 0.98,
            'rate|text-to-video|1080p|*|*|*': 1.75,
            'rate|first-frame|480p|*|*|*': 0.56,
            'rate|first-frame|720p|*|*|*': 0.98,
            'image-surcharge|first-frame|*|0|*|1+': 0.07,
            'rate|reference-video|480p|*|*|*': 0.56,
            'rate|reference-video|720p|*|*|*': 0.98,
            'image-surcharge|reference-video|*|0|*|1+': 0.07,
            'input-video-rate|video-edit|*|*|*|*': 0.42,
            'total|video-extend|*|6|*|*': 1.89,
            'total|video-extend|*|10|*|*': 3.15
        },
        videoModes: [
            { label: '文生视频', value: 'text-to-video', allowedInputs: { 'text': 10 } },
            { label: '首帧', value: 'first-frame', allowedInputs: { 'text': 10, 'image': 2 } },
            { label: '多图参考', value: 'reference-video', allowedInputs: { 'text': 10, 'image': 9 } },
            { label: '视频编辑', value: 'video-edit', allowedInputs: { 'text': 10, 'video': 1 } },
            { label: '视频延长', value: 'video-extend', allowedInputs: { 'text': 10, 'video': 1 } }
        ],
        endpoint: {
            'text-to-video': { url: 'https://www.runninghub.ai/openapi/v2/rhart-video-g-official/text-to-video-v1.5', model: 'rhart-video-g-official' },
            'first-frame': { url: 'https://www.runninghub.ai/openapi/v2/rhart-video-g-official/image-to-video-v1.5', model: 'rhart-video-g-official' },
            'reference-video': { url: 'https://www.runninghub.ai/openapi/v2/rhart-video-g-official/reference-to-video-v1.5', model: 'rhart-video-g-official' },
            'video-edit': { url: 'https://www.runninghub.ai/openapi/v2/rhart-video-g-official/edit-video', model: 'rhart-video-g-official' },
            'video-extend': { url: 'https://www.runninghub.ai/openapi/v2/rhart-video-g-official/video-extend', model: 'rhart-video-g-official' }
        },
        advancedParams: [
            { key: 'duration', label: '生成时长', type: 'slider', default: 5, min: 3, max: 15, unit: 's' }
        ]
    },
    {
        name:                       'Grok · RH AI站低价',
        brand:                      'Grok',
        description:                'RH AI站 Grok-低价渠道版。版本切法与 RunningHub 自己的模型选择器一致。',
        timeEstimate:               '15min',
        provider:                   'RunningHubGlobalVideoProvider',
        source:                     'runninghub_global',
        canonicalModel:             'Grok',
        tier:                       'budget',
        premium:                    true,
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image', 'video'],
        resolutions:                ['480p', '720p'],
        aspectRatios:               ["1:1", "9:16", "16:9", "3:4", "4:3", "21:9"],
        cost:                       { '480p': 0.21, '720p': 0.21 },
        rhPriceRules: {
            'rate|text-to-video|480p|*|*|*': 0.21,
            'rate|text-to-video|720p|*|*|*': 0.21,
            'rate|first-frame|480p|*|*|*': 0.21,
            'rate|first-frame|720p|*|*|*': 0.21
        },
        videoModes: [
            { label: '文生视频', value: 'text-to-video', allowedInputs: { 'text': 10 } },
            { label: '首帧', value: 'first-frame', allowedInputs: { 'text': 10, 'image': 2 } }
        ],
        endpoint: {
            'text-to-video': { url: 'https://www.runninghub.ai/openapi/v2/rhart-video-g/text-to-video', model: 'rhart-video-g' },
            'first-frame': { url: 'https://www.runninghub.ai/openapi/v2/rhart-video-g/image-to-video', model: 'rhart-video-g' }
        },
        advancedParams: [
            { key: 'duration', label: '生成时长', type: 'slider', default: 6, min: 6, max: 15, unit: 's' }
        ]
    },
    {
        name:                       'Veo 3.1 Lite · RH AI站',
        brand:                      'Veo',
        description:                'RH AI站 Veo-Lite。版本切法与 RunningHub 自己的模型选择器一致。',
        timeEstimate:               '15min',
        provider:                   'RunningHubGlobalVideoProvider',
        source:                     'runninghub_global',
        canonicalModel:             'Veo 3.1 Lite',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image', 'video'],
        resolutions:                ['720p', '1080p'],
        aspectRatios:               ["1:1", "9:16", "16:9", "3:4", "4:3", "21:9"],
        fixedDuration:              8,
        cost:                       { '720p': 0.35, '1080p': 0.56 },
        rhPriceRules: {
            'rate|text-to-video|720p|8|*|*': 0.35,
            'rate|text-to-video|1080p|8|*|*': 0.56,
            'rate|first-frame|720p|8|*|*': 0.35,
            'rate|first-frame|1080p|8|*|*': 0.56,
            'total|i2v-first-last-frame|720p|8|*|*': 2.52,
            'total|i2v-first-last-frame|1080p|8|*|*': 4.06
        },
        videoModes: [
            { label: '文生视频', value: 'text-to-video', allowedInputs: { 'text': 10 } },
            { label: '首帧', value: 'first-frame', allowedInputs: { 'text': 10, 'image': 2 } },
            { label: '首尾帧', value: 'i2v-first-last-frame', allowedInputs: { 'text': 10, 'image': 2 } }
        ],
        endpoint: {
            'text-to-video': { url: 'https://www.runninghub.ai/openapi/v2/rhart-video-v3.1-lite-official/text-to-video', model: 'rhart-video-v3.1-lite-official' },
            'first-frame': { url: 'https://www.runninghub.ai/openapi/v2/rhart-video-v3.1-lite-official/image-to-video', model: 'rhart-video-v3.1-lite-official' },
            'i2v-first-last-frame': { url: 'https://www.runninghub.ai/openapi/v2/rhart-video-v3.1-lite-official/start-end-to-video', model: 'rhart-video-v3.1-lite-official' }
        },
        advancedParams: [
            { key: 'duration', label: '生成时长', type: 'slider', default: 5, min: 3, max: 15, unit: 's' }
        ]
    },
    {
        name:                       'Veo 3.1 Fast · RH AI站',
        brand:                      'Veo',
        description:                'RH AI站 Veo-Fast。版本切法与 RunningHub 自己的模型选择器一致。',
        timeEstimate:               '15min',
        provider:                   'RunningHubGlobalVideoProvider',
        source:                     'runninghub_global',
        canonicalModel:             'Veo 3.1 Fast',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image', 'video'],
        resolutions:                ['720p', '1080p'],
        aspectRatios:               ["1:1", "9:16", "16:9", "3:4", "4:3", "21:9"],
        fixedDuration:              8,
        cost:                       { '720p': 0.8925, '1080p': 0.8925, '4k': 0.8925 },
        rhPriceRules: {
            'total|text-to-video|720p|8|*|*': 7.14,
            'total|text-to-video|720p|8|false|*': 4.76,
            'total|text-to-video|1080p|8|*|*': 7.14,
            'total|text-to-video|1080p|8|false|*': 4.76,
            'total|text-to-video|4k|8|*|*': 7.14,
            'total|text-to-video|4k|8|false|*': 4.76,
            'total|first-frame|720p|8|*|*': 7.14,
            'total|first-frame|720p|8|false|*': 4.76,
            'total|first-frame|1080p|8|*|*': 7.14,
            'total|first-frame|1080p|8|false|*': 4.76,
            'total|first-frame|4k|8|*|*': 7.14,
            'total|first-frame|4k|8|false|*': 4.76,
            'total|reference-video|720p|8|*|*': 5.04,
            'total|reference-video|720p|8|false|*': 4.06,
            'total|reference-video|1080p|8|*|*': 6.02,
            'total|reference-video|1080p|8|false|*': 5.04,
            'total|video-extend|*|8|*|*': 6.65
        },
        videoModes: [
            { label: '文生视频', value: 'text-to-video', allowedInputs: { 'text': 10 } },
            { label: '首帧', value: 'first-frame', allowedInputs: { 'text': 10, 'image': 2 } },
            { label: '多图参考', value: 'reference-video', allowedInputs: { 'text': 10, 'image': 9 } },
            { label: '视频延长', value: 'video-extend', allowedInputs: { 'text': 10, 'video': 1 } }
        ],
        endpoint: {
            'text-to-video': { url: 'https://www.runninghub.ai/openapi/v2/rhart-video-v3.1-fast-official/text-to-video', model: 'rhart-video-v3.1-fast-official' },
            'first-frame': { url: 'https://www.runninghub.ai/openapi/v2/rhart-video-v3.1-fast-official/image-to-video', model: 'rhart-video-v3.1-fast-official' },
            'reference-video': { url: 'https://www.runninghub.ai/openapi/v2/rhart-video-v3.1-fast-official/reference-to-video', model: 'rhart-video-v3.1-fast-official' },
            'video-extend': { url: 'https://www.runninghub.ai/openapi/v2/rhart-video-v3.1-fast-official/video-extend', model: 'rhart-video-v3.1-fast-official' }
        },
        advancedParams: [
            { key: 'duration', label: '生成时长', type: 'slider', default: 5, min: 3, max: 15, unit: 's' }
        ]
    },
    {
        name:                       'Veo 3.1 Pro · RH AI站',
        brand:                      'Veo',
        description:                'RH AI站 Veo-Pro。版本切法与 RunningHub 自己的模型选择器一致。',
        timeEstimate:               '15min',
        provider:                   'RunningHubGlobalVideoProvider',
        source:                     'runninghub_global',
        canonicalModel:             'Veo 3.1 Pro',
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image', 'video'],
        resolutions:                ['720p', '1080p', '4k'],
        aspectRatios:               ["1:1", "9:16", "16:9", "3:4", "4:3", "21:9"],
        fixedDuration:              8,
        cost:                       { '720p': 2.38, '1080p': 2.38, '4k': 2.38 },
        rhPriceRules: {
            'total|text-to-video|720p|8|*|*': 19.04,
            'total|text-to-video|720p|8|false|*': 9.52,
            'total|text-to-video|1080p|8|*|*': 19.04,
            'total|text-to-video|1080p|8|false|*': 9.52,
            'total|text-to-video|4k|8|*|*': 19.04,
            'total|text-to-video|4k|8|false|*': 9.52,
            'total|first-frame|720p|8|*|*': 19.04,
            'total|first-frame|720p|8|false|*': 9.52,
            'total|first-frame|1080p|8|*|*': 19.04,
            'total|first-frame|1080p|8|false|*': 9.52,
            'total|first-frame|4k|8|*|*': 19.04,
            'total|first-frame|4k|8|false|*': 9.52,
            'total|reference-video|720p|8|*|*': 19.04,
            'total|reference-video|720p|8|false|*': 9.52,
            'total|reference-video|1080p|8|*|*': 19.04,
            'total|reference-video|1080p|8|false|*': 9.52,
            'total|reference-video|4k|8|*|*': 19.04,
            'total|reference-video|4k|8|false|*': 9.52,
            'total|video-extend|*|8|*|*': 17.64
        },
        videoModes: [
            { label: '文生视频', value: 'text-to-video', allowedInputs: { 'text': 10 } },
            { label: '首帧', value: 'first-frame', allowedInputs: { 'text': 10, 'image': 2 } },
            { label: '多图参考', value: 'reference-video', allowedInputs: { 'text': 10, 'image': 9 } },
            { label: '视频延长', value: 'video-extend', allowedInputs: { 'text': 10, 'video': 1 } }
        ],
        endpoint: {
            'text-to-video': { url: 'https://www.runninghub.ai/openapi/v2/rhart-video-v3.1-pro-official/text-to-video', model: 'rhart-video-v3.1-pro-official' },
            'first-frame': { url: 'https://www.runninghub.ai/openapi/v2/rhart-video-v3.1-pro-official/image-to-video', model: 'rhart-video-v3.1-pro-official' },
            'reference-video': { url: 'https://www.runninghub.ai/openapi/v2/rhart-video-v3.1-pro-official/reference-to-video', model: 'rhart-video-v3.1-pro-official' },
            'video-extend': { url: 'https://www.runninghub.ai/openapi/v2/rhart-video-v3.1-pro-official/video-extend', model: 'rhart-video-v3.1-pro-official' }
        },
        advancedParams: [
            { key: 'duration', label: '生成时长', type: 'slider', default: 5, min: 3, max: 15, unit: 's' }
        ]
    },
    {
        name:                       'Veo 3.1 Fast · RH AI站低价',
        brand:                      'Veo',
        description:                'RH AI站 Veo-Fast-低价渠道版。版本切法与 RunningHub 自己的模型选择器一致。',
        timeEstimate:               '15min',
        provider:                   'RunningHubGlobalVideoProvider',
        source:                     'runninghub_global',
        canonicalModel:             'Veo 3.1 Fast',
        tier:                       'budget',
        premium:                    true,
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image', 'video'],
        resolutions:                ['720p', '1080p', '4k'],
        aspectRatios:               ["1:1", "9:16", "16:9", "3:4", "4:3", "21:9"],
        fixedDuration:              8,
        cost:                       { '720p': 0.175, '1080p': 0.175, '4k': 0.175 },
        rhPriceRules: {
            'total|text-to-video|720p|8|*|*': 1.40,
            'total|text-to-video|1080p|8|*|*': 1.40,
            'total|text-to-video|4k|8|*|*': 1.40,
            'total|first-frame|720p|8|*|*': 1.40,
            'total|first-frame|1080p|8|*|*': 1.40,
            'total|first-frame|4k|8|*|*': 1.40,
            'total|i2v-first-last-frame|720p|8|*|*': 1.40,
            'total|i2v-first-last-frame|1080p|8|*|*': 1.40,
            'total|i2v-first-last-frame|4k|8|*|*': 1.40
        },
        videoModes: [
            { label: '文生视频', value: 'text-to-video', allowedInputs: { 'text': 10 } },
            { label: '首帧', value: 'first-frame', allowedInputs: { 'text': 10, 'image': 2 } },
            { label: '首尾帧', value: 'i2v-first-last-frame', allowedInputs: { 'text': 10, 'image': 2 } }
        ],
        endpoint: {
            'text-to-video': { url: 'https://www.runninghub.ai/openapi/v2/rhart-video-v3.1-fast/text-to-video', model: 'rhart-video-v3.1-fast' },
            'first-frame': { url: 'https://www.runninghub.ai/openapi/v2/rhart-video-v3.1-fast/image-to-video', model: 'rhart-video-v3.1-fast' },
            'i2v-first-last-frame': { url: 'https://www.runninghub.ai/openapi/v2/rhart-video-v3.1-fast/start-end-to-video', model: 'rhart-video-v3.1-fast' }
        },
        advancedParams: [
            { key: 'duration', label: '生成时长', type: 'slider', default: 5, min: 3, max: 15, unit: 's' }
        ]
    },
    {
        name:                       'Veo 3.1 Pro · RH AI站低价',
        brand:                      'Veo',
        description:                'RH AI站 Veo-Pro-低价渠道版。版本切法与 RunningHub 自己的模型选择器一致。',
        timeEstimate:               '15min',
        provider:                   'RunningHubGlobalVideoProvider',
        source:                     'runninghub_global',
        canonicalModel:             'Veo 3.1 Pro',
        tier:                       'budget',
        premium:                    true,
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image', 'video'],
        resolutions:                ['720p', '1080p', '4k'],
        aspectRatios:               ["1:1", "9:16", "16:9", "3:4", "4:3", "21:9"],
        fixedDuration:              8,
        cost:                       { '720p': 0.11375, '1080p': 0.14875, '4k': 0.20125 },
        rhPriceRules: {
            'total|text-to-video|720p|8|*|*': 0.91,
            'total|text-to-video|1080p|8|*|*': 1.19,
            'total|text-to-video|4k|8|*|*': 1.61,
            'total|first-frame|720p|8|*|*': 0.91,
            'total|first-frame|1080p|8|*|*': 1.19,
            'total|first-frame|4k|8|*|*': 1.61,
            'total|i2v-first-last-frame|720p|8|*|*': 0.91,
            'total|i2v-first-last-frame|1080p|8|*|*': 1.19,
            'total|i2v-first-last-frame|4k|8|*|*': 1.61
        },
        videoModes: [
            { label: '文生视频', value: 'text-to-video', allowedInputs: { 'text': 10 } },
            { label: '首帧', value: 'first-frame', allowedInputs: { 'text': 10, 'image': 2 } },
            { label: '首尾帧', value: 'i2v-first-last-frame', allowedInputs: { 'text': 10, 'image': 2 } }
        ],
        endpoint: {
            'text-to-video': { url: 'https://www.runninghub.ai/openapi/v2/rhart-video-v3.1-pro/text-to-video', model: 'rhart-video-v3.1-pro' },
            'first-frame': { url: 'https://www.runninghub.ai/openapi/v2/rhart-video-v3.1-pro/image-to-video', model: 'rhart-video-v3.1-pro' },
            'i2v-first-last-frame': { url: 'https://www.runninghub.ai/openapi/v2/rhart-video-v3.1-pro/start-end-to-video', model: 'rhart-video-v3.1-pro' }
        },
        advancedParams: [
            { key: 'duration', label: '生成时长', type: 'slider', default: 5, min: 3, max: 15, unit: 's' }
        ]
    },
    {
        name:                       '豆包视频2.0',
        canonicalModel:             'Seedance 2.0',
        description:                '字节视频生成seedance 2.0',
        timeEstimate:               '5min',
        provider:                   'DoubaoVideoProvider',
        selectable:                 false,
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image', 'audio', 'video'],
        cost: {
            '480p': 0.60,
            '720p': 1.35,
            '1080p': 1.35
        },
        resolutions:                ['480p', '720p', '1080p'],
        aspectRatios:               ["1:1", "9:16", "16:9", "3:4", "4:3", "21:9"],
        videoModes: [
            { label: '文生视频', value: 'text-to-video', allowedInputs: { 'text': 10 } },
            { label: '首尾帧', value: 'i2v-first-last-frame', allowedInputs: { 'text': 10, 'image': 2 } },
            { label: '多模态', value: 'multimodal', allowedInputs: { 'text': 10, 'image': 9, 'audio': 3, 'video': 3 } },
        ],
        endpoint: {
            'text-to-video': {
                url: 'https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks',
                model: 'doubao-seedance-2-0-260128'
            },
            'i2v-first-last-frame': {
                url: 'https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks',
                model: 'doubao-seedance-2-0-260128'
            },
            'multimodal': {
                url: 'https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks',
                model: 'doubao-seedance-2-0-260128'
            }
        },
        generate_audio:             true,
        advancedParams: [
            { key: 'duration', label: '生成时长', type: 'slider', default: 4, min: 4, max: 15, unit: 's' }
        ]
    },
    {
        name:                       '豆包视频2.0 fast',
        canonicalModel:             'Seedance 2.0 Fast',
        description:                '字节视频生成seedance 2.0 fast',
        timeEstimate:               '5min',
        provider:                   'DoubaoVideoProvider',
        selectable:                 false,
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image', 'audio', 'video'],
        cost: {
            '480p': 0.37,
            '720p': 1.35,
            '1080p': 1.35
        },
        resolutions:                ['480p', '720p'],
        aspectRatios:               ["1:1", "9:16", "16:9", "3:4", "4:3", "21:9"],
        videoModes: [
            { label: '文生视频', value: 'text-to-video', allowedInputs: { 'text': 1 } },
            { label: '首尾帧', value: 'i2v-first-last-frame', allowedInputs: { 'text': 1, 'image': 2 } },
            { label: '多模态', value: 'multimodal', allowedInputs: { 'text': 10, 'image': 9, 'audio': 3, 'video': 3 } },
        ],
        endpoint: {
            'text-to-video': {
                url: 'https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks',
                model: 'doubao-seedance-2-0-fast-260128'
            },
            'i2v-first-last-frame': {
                url: 'https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks',
                model: 'doubao-seedance-2-0-fast-260128'
            },
            'multimodal': {
                url: 'https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks',
                model: 'doubao-seedance-2-0-fast-260128'
            }
        },
        generate_audio:             true,
        advancedParams: [
            { key: 'duration', label: '生成时长', type: 'slider', default: 4, min: 4, max: 15, unit: 's' }
        ]
    },
    {
        name:                       '可灵 Kling-V3',
        canonicalModel:             'Kling V3.0',
        description:                '快手旗舰级视频生成模型 V3',
        timeEstimate:               '5min',
        provider:                   'KlingVideoProvider',
        selectable:                 false,
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image', 'video'],
        cost: {
            '720p': 0.8,
            '1080p': 1.2
        },
        resolutions:                ['720p'],
        aspectRatios:               ["1:1", "9:16", "16:9"],
        videoModes: [
            { label: '文生视频', value: 'text-to-video', allowedInputs: { 'text': 10 } },
            { label: '首尾帧', value: 'i2v-first-last-frame', allowedInputs: { 'text': 10, 'image': 2 } },
            { label: '动作控制', value: 'motion-control', allowedInputs: { 'text': 10, 'image': 1, 'video': 1 } },
        ],
        endpoint: {
            'text-to-video': {
                url: 'https://api-beijing.klingai.com/v1/videos/text2video',
                model: 'kling-v3'
            },
            'i2v-first-last-frame': {
                url: 'https://api-beijing.klingai.com/v1/videos/image2video',
                model: 'kling-v3'
            },
            'motion-control': {
                url: 'https://api-beijing.klingai.com/v1/videos/motion-control',
                model: 'kling-v3'
            }
        },
        generate_audio:             true,
        advancedParams: [
            {
                key: 'mode', label: '模式', type: 'select', default: 'std', options: [
                    { label: '标准', value: 'std' },
                    { label: '高级', value: 'pro' },
                    { label: '4K', value: '4k' }
                ]
            },
            {
                key: 'character_orientation', label: '动作朝向', type: 'select', default: 'video', options: [
                    { label: '按图片角色', value: 'image' },
                    { label: '按视频角色', value: 'video' }
                ]
            },
            { key: 'duration', label: '生成时长', type: 'slider', default: 5, min: 3, max: 15, unit: 's' }
        ]
    },
    {
        name:                       '可灵 Kling-V3-Omni',
        canonicalModel:             'Kling O3',
        description:                '快手旗舰级全模态视频生成模型',
        timeEstimate:               '5min',
        provider:                   'KlingVideoProvider',
        selectable:                 false,
        maxConcurrent:              0,
        useProxy:                   false,
        maxInputs:                  10,
        supportedReferenceTypes:    ['text', 'image', 'video'],
        cost: {
            '720p': 0.8,
            '1080p': 1.2
        },
        resolutions:                ['720p'],
        aspectRatios:               ["1:1", "9:16", "16:9"],
        videoModes: [
            { label: '文生视频', value: 'omni-text-to-video', allowedInputs: { 'text': 10 } },
            { label: '图生视频', value: 'omni-image-to-video', allowedInputs: { 'text': 10, 'image': 4 } },
            { label: '首尾帧', value: 'omni-first-last-frame', allowedInputs: { 'text': 10, 'image': 2 } },
            { label: '视频编辑', value: 'omni-video-edit', allowedInputs: { 'text': 10, 'image': 4, 'video': 1 } },
            { label: '视频参考', value: 'omni-video-ref', allowedInputs: { 'text': 10, 'image': 4, 'video': 1 } },
        ],
        endpoint: {
            'omni-text-to-video': {
                url: 'https://api-beijing.klingai.com/v1/videos/omni-video',
                model: 'kling-v3-omni'
            },
            'omni-image-to-video': {
                url: 'https://api-beijing.klingai.com/v1/videos/omni-video',
                model: 'kling-v3-omni'
            },
            'omni-first-last-frame': {
                url: 'https://api-beijing.klingai.com/v1/videos/omni-video',
                model: 'kling-v3-omni'
            },
            'omni-video-edit': {
                url: 'https://api-beijing.klingai.com/v1/videos/omni-video',
                model: 'kling-v3-omni'
            },
            'omni-video-ref': {
                url: 'https://api-beijing.klingai.com/v1/videos/omni-video',
                model: 'kling-v3-omni'
            }
        },
        generate_audio:             true,
        advancedParams: [
            {
                key: 'mode', label: '模式', type: 'select', default: 'std', options: [
                    { label: '标准', value: 'std' },
                    { label: '高级', value: 'pro' },
                    { label: '4K', value: '4k' }
                ]
            },
            { key: 'duration', label: '生成时长', type: 'slider', default: 5, min: 3, max: 10, unit: 's' }
        ]
    },
];

export type ModelNodeType = NodeType;
