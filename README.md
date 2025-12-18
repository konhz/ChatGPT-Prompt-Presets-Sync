# 🤖 ChatGPT Prompt Manager (CPM)

**[English](#english) | [中文说明](#中文说明)**

---

<a name="english"></a>
## 🇬🇧 English Description

**ChatGPT Prompt Manager** is a powerful userscript designed to enhance your ChatGPT experience by providing a seamless, IDE-like prompt autocompletion workflow.

Unlike other scripts that rely on simple regex or require specific trigger keys, CPM uses the browser's native **`Intl.Segmenter`** for intelligent tokenization and a robust **"Select & Overwrite"** strategy to ensure perfect compatibility with ChatGPT's complex ProseMirror editor.

### ✨ Key Features

* **🧠 Smart Hybrid Matching**:
    * **Suffix Trigger**: Typing `...translate` triggers the "Translate" prompt.
    * **Fuzzy Search**: Typing `trans` finds "English Translation".
    * **Native Segmentation**: Uses `Intl.Segmenter` for accurate word boundary detection (supports Chinese/English mixed).
* **⚡ Seamless Interaction**:
    * **Auto-Popup**: Appears automatically when you type a keyword.
    * **Tab to Complete**: Press `Tab` to insert the prompt and automatically remove the trigger word.
    * **No Duplication**: Solves the common "double text" issue using atomic selection replacement.
* **☁️ Cloud Sync**: Sync your prompts across devices using GitHub Gist (supports private Gists).
* **🎨 Polished UI**:
    * Visual Prompt Chips (clickable).
    * Floating Autocomplete Menu (IDE style).
    * Dark Mode support.
    * Lazy loading & self-healing DOM logic.

### 🚀 Installation

1.  Install a userscript manager like **Tampermonkey** (Chrome/Edge/Firefox).
2.  Install this script.
3.  Open [ChatGPT](https://chatgpt.com/), and you will see the CPM toolbar above the input box.

### ⌨️ Usage

1.  **Trigger**: Just type! E.g., if you have a prompt named "Polish", type `Polish` or a sentence ending in `Polish`.
2.  **Navigate**: Use `↑` / `↓` arrows to select from the list.
3.  **Insert**: Press `Tab` to insert the prompt (replaces your trigger word).
4.  **Dismiss**: Press `Esc` or click outside to close the list.
5.  **Edit**: Right-click any prompt chip in the toolbar to edit or delete it.

### 🔄 Gist Sync Setup

1.  Click the **⚙️ Settings** button.
2.  **Gist ID**: Create a Gist on GitHub and paste its ID.
3.  **Token**: Generate a GitHub Personal Access Token (Classic) with `gist` scope.
4.  Click **Save**.
5.  Use **☁️ Sync** to download or **⬆️ Upload** to save local changes.

---

<a name="中文说明"></a>
## 🇨🇳 中文说明

**ChatGPT Prompt Manager (CPM)** 是一个专为 ChatGPT 打造的高级 Prompt 管理与自动补全脚本。

不同于其他依赖简单正则或强制快捷键的脚本，CPM 利用浏览器原生的 **`Intl.Segmenter`** API 进行智能分词，并采用 **“选中即替换” (Select & Overwrite)** 策略，完美解决了 ChatGPT (ProseMirror) 编辑器中常见的文本残留和光标定位问题。

### ✨ 核心功能

* **🧠 智能混合匹配引擎**：
    * **后缀触发**：输入“你是一个翻译家**翻译**”，自动匹配“翻译”Prompt。
    * **模糊检索**：输入“**润色**”，可以匹配到“学术**润色**”或“英文**润色**”。
    * **原生分词**：内置 `Intl.Segmenter`，无需第三方库即可精准识别中英文分词。
* **⚡ 丝滑的交互体验**：
    * **自动浮窗**：输入关键词即刻弹出，无需快捷键唤醒。
    * **Tab 上屏**：按 `Tab` 键确认，脚本会自动删除触发词并填入 Prompt，杜绝“翻译翻译”重复现象。
    * **节点穿透**：智能识别编辑器内部 DOM 结构，确保在空行或段落末尾也能精准触发。
* **☁️ 云端同步**：支持通过 GitHub Gist 在多设备间同步数据（支持私有 Gist）。
* **🎨 精致 UI 设计**：
    * 顶部可视化 Prompt 胶囊（Chips），支持点击上屏/右键编辑。
    * IDE 风格的自动补全悬浮窗。
    * 完美适配 ChatGPT 深色/浅色模式。

### 🚀 安装指南

1.  安装油猴插件 **Tampermonkey** (Chrome/Edge/Firefox)。
2.  安装本脚本。
3.  刷新 [ChatGPT](https://chatgpt.com/) 页面，即可在输入框上方看到 CPM 工具栏。

### ⌨️ 使用方法

1.  **触发**：直接在输入框打字。例如你有“润色”这个 Prompt，输入“润色”或句子结尾带“润色”即可触发。
2.  **选择**：使用键盘 `↑` / `↓` 键切换候选项。
3.  **上屏**：按下 `Tab` 键插入内容（脚本会自动替换掉你刚才输入的触发词）。
4.  **关闭**：按下 `Esc` 或点击空白处关闭列表。
5.  **管理**：在工具栏的按钮上**右键点击**可进行编辑或删除。

### 🔄 同步设置 (Gist)

1.  点击工具栏的 **⚙️ 设置** 按钮。
2.  **Gist ID**：在 GitHub 创建一个 Gist，复制 URL 末尾的 ID 填入。
3.  **Token**：在 GitHub Developer Settings 生成一个 Personal Access Token (Classic)，勾选 `gist` 权限。
4.  点击 **保存**。
5.  点击 **☁️ 同步** 拉取云端数据，或在设置中点击 **⬆️ 上传** 推送本地数据。

---

### 🛠️ Technical Stack / 技术栈

* **Core**: Vanilla JavaScript (ES6+)
* **DOM Manipulation**: Native Selection & Range API (ProseMirror Compatible)
* **NLP**: `Intl.Segmenter` (Native Browser API)
* **Styling**: Dynamic CSS Injection
* **Sync**: GM_xmlhttpRequest (GitHub API)

### 📄 License

MIT License
