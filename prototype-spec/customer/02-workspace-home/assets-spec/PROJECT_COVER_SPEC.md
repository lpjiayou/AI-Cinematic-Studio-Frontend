# Workspace Home — Project Cover Asset Specification

Version: `V1.0`

---

## 1. General Rules

Format:

- preferred: WebP；
- fallback: PNG/JPEG。

Ratio:

- `16:9`

Minimum source size:

- `1600×900`

Recommended:

- `1920×1080` or larger。

No text baked into images.

Every image must include meaningful alt text.

---

## 2. Required Prototype Covers

Canonical root: `public/assets/workspace-home/projects/`

### `public/assets/workspace-home/projects/future-city.webp`

Project: `未来之城`

Visual:

- futuristic metropolis；
- lone character or spacecraft；
- blue/cyan cinematic lighting；
- premium science-fiction film look。

Alt:

`未来城市中人物面对高耸建筑的科幻电影画面`

### `public/assets/workspace-home/projects/silent-snow.webp`

Project: `雪落无声`

Visual:

- snow mountain or isolated winter landscape；
- restrained suspense mood；
- realistic film still；
- cold blue-gray color。

Alt:

`雪山与孤独人物构成的悬疑电影画面`

### `public/assets/workspace-home/projects/light-chaser.webp`

Project: `追光者`

Visual:

- warm canyon / sunrise / hot-air balloons or youth road movie；
- warm cinematic palette；
- emotional and hopeful。

Alt:

`暖色峡谷与晨光中的青春电影画面`

### `public/assets/workspace-home/projects/stellar-echo.webp`

Project: `星际回响`

Visual:

- astronaut / lunar surface / deep space；
- realistic science-fiction still；
- high contrast but not neon-heavy。

Alt:

`宇航员站在月面眺望宇宙的科幻电影画面`

---

## 3. Cropping

Important focal subject must stay within center 70%.

Covers must work at:

- 16:9 desktop card；
- cropped mobile carousel；
- high-DPI display。

---

## 4. Placeholder Policy

Final implementation should use approved local assets.

If an approved cover is temporarily unavailable:

Allowed:

- branded cinematic gradient plus a simple illustrative silhouette；
- project-specific color and composition；
- clear `演示封面` internal label in code, not user interface。

Forbidden:

- plain gray rectangle；
- black rectangle with `镜构智能` text；
- random external image URL；
- broken image icon。

---

## 5. Rights

Prototype assets must be:

- generated for this project；
- owned/licensed；
- or explicitly marked internal prototype reference。

Do not scrape commercial film stills.
