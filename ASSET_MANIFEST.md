# ASSET MANIFEST

Әр ассет үшін: атауы · дереккөз · автор · лицензия · URL · өзгерістер · оңтайландырылған файл.
Лицензиясы тексерілмеген ешбір ассет жаңа қосымшаға (`public/`, `src/`) қосылмайды.

## Текстуралар (`public/assets/textures/`)

| Файл | Ассет | Дереккөз / Автор | Лицензия | URL | Өзгерістер |
|---|---|---|---|---|---|
| wood_diff.jpg, wood_nor.jpg, wood_rough.jpg | Wood Table 001 | Poly Haven | CC0 | https://polyhaven.com/a/wood_table_001 | legacy/textures-тен көшірілді; 2048², JPG. Фаза 9-да KTX2 + 1K-ға түсіру |
| floor_diff.jpg, floor_rough.jpg | Concrete Floor Painted | Poly Haven | CC0 | https://polyhaven.com/a/concrete_floor_painted | legacy/textures-тен көшірілді; 1024², JPG |

> Ескерту: автор аттары legacy manifest-те жазылмаған — Poly Haven бетінен тексеріп толықтыру керек (CC0 атрибуция талап етпейді).

## 3D модельдер (`public/assets/models/`)
Әзірге GLB жоқ. Hero сахнасындағы барлық құрылғы — жобаның өз процедуралық модельдері (`src/scenes/DeskScene/models/`, лицензия мәселесі жоқ), TODO.md-де `[PLACEHOLDER]`.

## HDRI (`public/assets/hdr/`)

| Файл | Ассет | Автор | Лицензия | URL | Өзгерістер |
|---|---|---|---|---|---|
| studio_small_09_1k.hdr | Studio Small 09 | Sergej Majboroda (Poly Haven) | CC0 | https://polyhaven.com/a/studio_small_09 | Өзгертілмеген, 1K (1.6 MB), тек шағылыс/IBL үшін (фон ретінде көрсетілмейді) |

Қосымша: `EnvironmentLighting` HDRI үстіне 3 процедуралық Lightformer (softbox жолақтар) қосады.

## Процедуралық текстуралар (файл емес, canvas арқылы runtime-да)
`src/lib/three/proceduralTextures.ts`: brushed metal, мата, перфорацияланған тор, тышқан қабығының сызықтары, монитор тұсқағазы (жобаның өз дизайны). Сыртқы ассет қолданылмайды.

## Аудио (`public/assets/audio/`)
Әзірге жоқ.

## Шрифттер (npm арқылы, бандлға кіреді)
| Пакет | Шрифт | Лицензия |
|---|---|---|
| @fontsource-variable/manrope | Manrope (Mikhail Sharanda) | SIL OFL 1.1 |
| @fontsource-variable/unbounded | Unbounded (NaN) | SIL OFL 1.1 |

## Декодерлер (`public/decoders/`, `npm install` кезінде көшіріледі)
| Файл | Дереккөз | Лицензия |
|---|---|---|
| draco/* | three.js `examples/jsm/libs/draco/gltf` (Google Draco) | Apache-2.0 |
| basis/* | three.js `examples/jsm/libs/basis` (Binomial Basis Universal) | Apache-2.0 |

## Кітапханалар
three (MIT), @react-three/fiber/drei/postprocessing (MIT), postprocessing (Zlib), gsap (Standard "no charge" license — https://gsap.com/standard-license), zustand (MIT), react / react-router (MIT), lucide-react (ISC).

## Legacy ассеттер (`legacy/assets`, `legacy/textures`) — тек мұрағат
- `legacy/assets/*.jpg` — пайдаланушы фотолары, дереккөзі белгісіз → жаңа қосымшада ҚОЛДАНЫЛМАЙДЫ.
- `legacy/assets/products/*` — Wikimedia Commons / Openverse (CC BY / CC BY-SA, авторлары нақтыланбаған) → жаңа қосымшада қолданбас бұрын әр файлдың Commons бетінен автор мен лицензияны тексеру керек.
- Толық тізім: `legacy/ASSET_MANIFEST.md`.
