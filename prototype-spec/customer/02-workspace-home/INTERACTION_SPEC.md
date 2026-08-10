# Workspace Home — Interaction Specification

Version: `V1.0`

---

## 1. Header Navigation

- logo → `/workspace`
- 工作台首页 → `/workspace`
- AI导演 → approved application route
- 项目工坊 → approved application route
- 系列规划 → approved future route
- 剧本与分镜 → approved future route
- 资产库 → approved application route
- 成片交付 → approved application route

Workspace Home does not create destination pages or invent route contracts. Phase 1
receives availability and approved destinations from the application boundary.
Unavailable destinations use disabled/guided presentation and never navigate to a
broken page.

---

## 2. Theme Toggle

- toggles Light/Dark；
- preserves preference；
- keyboard accessible；
- icon and accessible label both update；
- no page reload。

---

## 3. Global Search

Desktop:

- input or command trigger；
- shortcut hint `Ctrl/⌘ K`。

Phase 1:

- may open a non-functional approved search drawer；
- must clearly label placeholder status；
- must not fabricate results。

---

## 4. Welcome Hero Actions

Primary:

`继续制作`

- opens the most recently active project when an approved destination is supplied；
- otherwise shows a guided local placeholder without fabricating a route。

Secondary:

`查看项目`

- opens Project Workshop when an approved destination is supplied；otherwise shows
  the guided local placeholder state。

---

## 5. Quick Start

Each action is a semantic interactive control (button for commands, link for
approved navigation) with:

- icon；
- title；
- description；
- clear focus state。

Actions:

- 新建项目 → approved application route or guided placeholder
- AI导演助手 → approved application route or guided placeholder
- 上传脚本 → placeholder modal
- 导入素材 → placeholder modal
- 智能分镜 → future route / disabled explanation
- 项目模板 → future template gallery

Unavailable actions must show a guided state, not do nothing.

---

## 6. Project Cards

Hover:

- subtle lift；
- cover zoom；
- next action becomes visually clearer。

Click:

- cover/title or explicit next-action link opens the project workspace when an
  approved destination is supplied。

Keyboard:

- explicit links/buttons are focusable；
- `ACSCard interactive` is visual feedback only and must not be treated as a button；
- nested interactive controls must not create invalid nested buttons or links。

---

## 7. AI Assistant

Suggested prompt click:

- copies prompt into input；
- does not submit automatically。

Submit:

- Phase 1 may show a local approved preview state；
- no backend/Provider call。

AI response controls:

- 查看建议；
- 应用（future, disabled/guided）；
- dismiss。

---

## 8. Production Overview

Period selector:

- `近 7 天`
- `近 30 天`

Phase 1 may use local static data.

Chart points may show tooltips.

No complex chart configuration UI.

---

## 9. Project Activity

Activity item click opens the relevant project/object route.

If route is not implemented, use a guided placeholder.

---

## 10. Motion

- card hover uses `--acs-motion-base` (`180ms`)；
- drawer uses `--acs-motion-slow` (`240ms`)；
- optional page entrance uses `--acs-motion-slow` (`240ms`)；
- AI online indicator soft pulse；
- respect reduced motion。

---

## 11. Accessibility

- all controls reachable by keyboard；
- visible focus ring uses ACS token；
- semantic heading order；
- images include meaningful alt text；
- status is not conveyed by color alone；
- minimum touch target 44px；
- modal/drawer focus trap required。
