// ==UserScript==
// @name         ChatGPT Prompt Manager (Smart Segmenter v8.2)
// @namespace    http://tampermonkey.net/
// @version      8.2.0
// @description  ChatGPT 增强：智能分词(Intl.Segmenter)、精准覆盖、全文模糊匹配
// @author       Gemini & You
// @match        https://chatgpt.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @connect      api.github.com
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // 调试开关
    const DEBUG = true;
    function log(...args) { if (DEBUG) console.log('%c[CPM]', 'color: #00ffff; font-weight: bold;', ...args); }
    function error(...args) { console.error('%c[CPM ERROR]', 'color: #ff0000; font-weight: bold;', ...args); }

    const CONFIG_KEY = 'cpm_config_v8_2';
    const GIST_FILENAME = 'chatgpt_prompts.json';
    const EDITOR_SELECTOR = '#prompt-textarea';

    const DEFAULT_DATA = {
        prompts: [],
        gistId: '',
        gistToken: '',
        isExpanded: true
    };

    const TEXT = {
        add: "新建", settings: "设置", sync: "同步", save: "保存", cancel: "取消",
        delete: "删除", edit: "编辑", fold: "收起", unfold: "展开",
        emptyError: "标题和内容不能为空",
        uploadSuccess: "✅ 上传成功", downloadSuccess: "✅ 同步成功",
    };

    // ==========================================
    // 样式
    // ==========================================
    const STYLES = `
        #cpm-container {
            background: var(--cpm-bg, #ffffff);
            border: 1px solid var(--cpm-border, #d1d5db);
            border-radius: 8px; margin-bottom: 8px; padding: 10px;
            display: flex; flex-direction: column; gap: 0;
        }
        #cpm-chip-container {
            display: flex; flex-wrap: wrap; gap: 6px;
            max-height: 120px; overflow-y: auto; transition: max-height 0.3s ease;
            border-bottom: 1px solid var(--cpm-border, #f0f0f0);
            padding-bottom: 10px; margin-bottom: 10px;
        }
        .cpm-chip {
            font-size: 12px; padding: 4px 10px; border-radius: 12px;
            background: var(--cpm-chip-bg, #f3f4f6); color: var(--cpm-text, #333);
            border: 1px solid transparent; cursor: pointer; user-select: none;
            max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            transition: all 0.2s;
        }
        .cpm-chip:hover {
            background: #10a37f; color: white; border-color: #10a37f; transform: translateY(-1px);
        }
        .cpm-footer { display: flex; justify-content: space-between; align-items: center; }
        .cpm-tools { display: flex; gap: 8px; }
        .cpm-btn-icon {
            background: transparent; border: 1px solid var(--cpm-border, #ccc);
            border-radius: 4px; padding: 4px 8px; font-size: 11px;
            cursor: pointer; color: var(--cpm-text, #555); transition: all 0.2s;
        }
        .cpm-btn-icon:hover { background: var(--cpm-hover, #f0f0f0); border-color: #10a37f; color: #10a37f; }

        #cpm-autocomplete-box {
            position: fixed !important; z-index: 2147483647 !important;
            background: var(--cpm-bg, #fff); border: 1px solid #9ca3af;
            border-radius: 6px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            width: 300px; max-height: 200px; overflow-y: auto;
            display: none; flex-direction: column; font-family: sans-serif;
        }
        .cpm-ac-item {
            padding: 8px 12px; cursor: pointer;
            border-bottom: 1px solid var(--cpm-border, #f0f0f0);
            display: flex; flex-direction: column; color: var(--cpm-text, #333);
        }
        .cpm-ac-item.selected, .cpm-ac-item:hover { background: #10a37f; color: white !important; }
        .cpm-ac-title { font-weight: bold; font-size: 13px; }
        .cpm-ac-desc { font-size: 11px; opacity: 0.8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .cpm-modal-overlay {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.5); z-index: 2147483647;
            display: flex; justify-content: center; align-items: center;
        }
        .cpm-modal {
            background: var(--cpm-bg, #fff); color: var(--cpm-text, #333);
            padding: 20px; border-radius: 8px; width: 360px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }
        .cpm-modal input, .cpm-modal textarea {
            width: 100%; margin-bottom: 10px; padding: 8px; box-sizing: border-box;
            border: 1px solid #ccc; border-radius: 4px;
            background: var(--cpm-input-bg, #fff); color: var(--cpm-text, #333);
        }
        .cpm-modal-actions { display: flex; justify-content: flex-end; gap: 8px; }

        body.cpm-dark {
            --cpm-bg: #2f2f2f; --cpm-border: #444; --cpm-text: #eee;
            --cpm-hover: #3e3e3e; --cpm-input-bg: #40414f; --cpm-chip-bg: #40414f;
        }
    `;

    const styleEl = document.createElement('style');
    styleEl.innerHTML = STYLES;
    document.head.appendChild(styleEl);

    // ==========================================
    // 数据 & 网络
    // ==========================================
    const Store = {
        data: { ...DEFAULT_DATA },
        init() {
            const saved = localStorage.getItem(CONFIG_KEY);
            if (saved) try { this.data = { ...DEFAULT_DATA, ...JSON.parse(saved) }; } catch (e) {}
            if (this.data.prompts.length === 0) {
                this.data.prompts.push({title: "翻译", content: "请担任翻译专家，将以下内容翻译成中文，信达雅："});
                this.data.prompts.push({title: "中英文翻译", content: "请将以下内容进行中英文互译："});
                this.data.prompts.push({title: "润色", content: "请帮我润色这段文字，使其更加学术和专业："});
            }
        },
        save() {
            localStorage.setItem(CONFIG_KEY, JSON.stringify(this.data));
            if (UI.isMounted) UI.renderToolbar();
        },
        addPrompt(t, c) { this.data.prompts.push({ title: t, content: c }); this.save(); },
        updatePrompt(i, t, c) { this.data.prompts[i] = { title: t, content: c }; this.save(); },
        deletePrompt(i) { this.data.prompts.splice(i, 1); this.save(); }
    };

    const Sync = {
        upload() {
            const { gistId, gistToken, prompts } = Store.data;
            if (!gistId || !gistToken) return alert("请在设置中填写 Gist ID 和 Token");
            GM_xmlhttpRequest({
                method: "PATCH", url: `https://api.github.com/gists/${gistId}`,
                headers: { "Authorization": `token ${gistToken}`, "Content-Type": "application/json" },
                data: JSON.stringify({ files: { [GIST_FILENAME]: { content: JSON.stringify(prompts, null, 2) } } }),
                onload: (res) => alert(res.status === 200 ? TEXT.uploadSuccess : "Error: " + res.status)
            });
        },
        download() {
            const { gistId, gistToken } = Store.data;
            if (!gistId || !gistToken) return alert("请在设置中填写 Gist ID 和 Token");
            GM_xmlhttpRequest({
                method: "GET", url: `https://api.github.com/gists/${gistId}`,
                headers: { "Authorization": `token ${gistToken}` },
                onload: (res) => {
                    if (res.status === 200) {
                        try {
                            const content = JSON.parse(res.responseText).files[GIST_FILENAME]?.content;
                            if (content) {
                                Store.data.prompts = JSON.parse(content);
                                Store.save();
                                alert(TEXT.downloadSuccess);
                            }
                        } catch(e) { alert("解析失败"); }
                    } else alert("Error: " + res.status);
                }
            });
        }
    };

    // ==========================================
    // 核心逻辑：智能分词 + 稳健替换
    // ==========================================
    const Utils = {
        isDarkMode: () => document.documentElement.classList.contains('dark'),

        // 初始化原生分词器
        segmenter: null,
        initSegmenter: () => {
            if (!Utils.segmenter && window.Intl && window.Intl.Segmenter) {
                try {
                    // granularity: 'word' 是关键，精准切分中文词汇
                    Utils.segmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' });
                } catch (e) {
                    error("Intl.Segmenter init failed", e);
                }
            }
        },

        // 获取光标前的所有文本
        getTextBeforeCursor: () => {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return null;
            let node = selection.anchorNode;
            let offset = selection.anchorOffset;

            // 节点修正 (Node Drilling for <p>)
            if (node.nodeType === Node.ELEMENT_NODE) {
                if (offset > 0) {
                    const child = node.childNodes[offset - 1];
                    if (child && child.nodeType === Node.TEXT_NODE) {
                        node = child;
                        offset = child.textContent.length;
                    }
                }
            }

            if (node.nodeType === Node.TEXT_NODE) {
                return node.textContent.slice(0, offset);
            }
            return "";
        },

        // 【智能提取】使用浏览器原生分词获取最后一个词
        getLastSegment: (text) => {
            if (!text) return "";

            // 1. 优先使用原生分词器
            if (Utils.segmenter) {
                const segments = [...Utils.segmenter.segment(text)];
                if (segments.length > 0) {
                    const last = segments[segments.length - 1];
                    // 过滤掉纯标点符号，只保留像词的东西
                    if (last.isWordLike || /[\u4e00-\u9fa5a-zA-Z0-9]/.test(last.segment)) {
                        return last.segment;
                    }
                    return "";
                }
            }

            // 2. 降级方案 (正则提取末尾连续字符)
            const match = text.match(/([\u4e00-\u9fa5a-zA-Z0-9]+)$/);
            return match ? match[0] : "";
        },

        // 【核心修复】选中即替换 (Select & Overwrite)
        // 解决了 v8.0 中无法删除触发词的问题
        insertPrompt: (promptContent, lengthToDelete) => {
            const editor = document.querySelector(EDITOR_SELECTOR);
            if (editor) editor.focus();

            // 1. 选中触发词
            if (lengthToDelete > 0) {
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    let container = range.endContainer;
                    let offset = range.endOffset;

                    // 再次进行节点穿透，确保操作的是 TextNode
                    if (container.nodeType === Node.ELEMENT_NODE) {
                        if (offset > 0) {
                            const child = container.childNodes[offset - 1];
                            if (child && child.nodeType === Node.TEXT_NODE) {
                                container = child;
                                offset = child.textContent.length;
                            }
                        }
                    }

                    if (container.nodeType === Node.TEXT_NODE) {
                        try {
                            const start = Math.max(0, offset - lengthToDelete);
                            const newRange = document.createRange();
                            newRange.setStart(container, start);
                            newRange.setEnd(container, offset);

                            // 选中它！
                            selection.removeAllRanges();
                            selection.addRange(newRange);
                        } catch(e) { error(e); }
                    }
                }
            }

            // 2. 执行插入 (浏览器会自动用新内容替换选中的内容)
            document.execCommand('insertText', false, promptContent);
            if (editor) editor.dispatchEvent(new Event('input', { bubbles: true }));
        }
    };

    // ==========================================
    // UI
    // ==========================================
    const UI = {
        isMounted: false, acIndex: 0, acMatches: [], isAcVisible: false,
        currentTriggerLen: 0,

        init() {
            Utils.initSegmenter(); // 必须初始化
            this.renderToolbar();
            this.createAutocompleteBox();
            this.updateTheme();
            this.isMounted = true;
            this.setupListeners();
        },

        setupListeners() {
            document.addEventListener('input', (e) => {
                const editor = e.target.closest && e.target.closest(EDITOR_SELECTOR);
                if (editor) {
                    const text = Utils.getTextBeforeCursor();
                    this.handleInput(text, editor);
                }
            });
            document.addEventListener('keydown', (e) => {
                const editor = e.target.closest && e.target.closest(EDITOR_SELECTOR);
                if (editor) this.handleKeydown(e);
            }, true);
            document.addEventListener('click', (e) => {
                if (!e.target.closest('#cpm-autocomplete-box')) this.hideAutocomplete();
            });
        },

        // 智能匹配逻辑
        handleInput(text, editorRef) {
            if (!text) { this.hideAutocomplete(); return; }

            // 使用 Intl.Segmenter 获取最后一个语义词
            const token = Utils.getLastSegment(text);

            if (!token || token.length < 1) {
                this.hideAutocomplete();
                return;
            }

            const lowerToken = token.toLowerCase();

            // 包含匹配 (Fuzzy Include)
            // 只要 Prompt 标题包含该词，或者 Prompt 内容包含该词
            this.acMatches = Store.data.prompts.filter(p => {
                return p.title.toLowerCase().includes(lowerToken) ||
                       p.content.toLowerCase().includes(lowerToken);
            });

            // 排序优化：标题匹配的排前面
            this.acMatches.sort((a, b) => {
                const aTitle = a.title.toLowerCase().includes(lowerToken);
                const bTitle = b.title.toLowerCase().includes(lowerToken);
                if (aTitle && !bTitle) return -1;
                if (!aTitle && bTitle) return 1;
                return 0;
            });

            if (this.acMatches.length > 0) {
                // 记录触发词长度，上屏时将删除这么长的字符
                this.currentTriggerLen = token.length;
                this.acIndex = 0;
                this.renderAutocomplete(editorRef);
            } else {
                this.hideAutocomplete();
            }
        },

        handleKeydown(e) {
            if (!this.isAcVisible) return;
            if (e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); this.acIndex = (this.acIndex - 1 + this.acMatches.length) % this.acMatches.length; this.renderAutocomplete(); }
            else if (e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); this.acIndex = (this.acIndex + 1) % this.acMatches.length; this.renderAutocomplete(); }
            else if (e.key === 'Tab') { e.preventDefault(); e.stopPropagation(); this.confirmSelection(); }
            else if (e.key === 'Escape') { e.preventDefault(); this.hideAutocomplete(); }
            else if (e.key === 'Enter') { this.hideAutocomplete(); }
        },

        confirmSelection() {
            const item = this.acMatches[this.acIndex];
            if (item) {
                Utils.insertPrompt(item.content, this.currentTriggerLen);
                this.hideAutocomplete();
            }
        },

        createAutocompleteBox() {
            if (document.getElementById('cpm-autocomplete-box')) return;
            const box = document.createElement('div'); box.id = 'cpm-autocomplete-box'; document.body.appendChild(box);
        },

        renderAutocomplete(editorRef) {
            try {
                let box = document.getElementById('cpm-autocomplete-box');
                if (!box) { box = document.createElement('div'); box.id = 'cpm-autocomplete-box'; document.body.appendChild(box); }
                box.innerHTML = '';
                this.acMatches.forEach((p, idx) => {
                    const div = document.createElement('div');
                    div.className = `cpm-ac-item ${idx === this.acIndex ? 'selected' : ''}`;
                    div.innerHTML = `<span class="cpm-ac-title">${p.title}</span><span class="cpm-ac-desc">${p.content}</span>`;
                    div.onmousedown = (e) => { e.preventDefault(); this.acIndex = idx; this.confirmSelection(); };
                    box.appendChild(div);
                });
                const editor = editorRef || document.querySelector(EDITOR_SELECTOR);
                if (editor) {
                    const rect = (editor.closest('form') || editor).getBoundingClientRect();
                    if (rect.width > 0) { box.style.display = 'flex'; box.style.left = `${rect.left}px`; box.style.bottom = `${window.innerHeight - rect.top}px`; this.isAcVisible = true; }
                }
                const active = box.children[this.acIndex];
                if (active) active.scrollIntoView({ block: 'nearest' });
            } catch (e) { error('Render crash:', e); }
        },

        hideAutocomplete() { const box = document.getElementById('cpm-autocomplete-box'); if (box) box.style.display = 'none'; this.isAcVisible = false; },

        renderToolbar() {
            const old = document.getElementById('cpm-container'); if (old) old.remove();
            const form = document.querySelector('form'); if (!form) return;
            const container = document.createElement('div'); container.id = 'cpm-container';
            const chipContainer = document.createElement('div'); chipContainer.id = 'cpm-chip-container';
            if (!Store.data.isExpanded) chipContainer.style.display = 'none';
            Store.data.prompts.forEach((p, idx) => {
                const chip = document.createElement('span'); chip.className = 'cpm-chip'; chip.textContent = p.title; chip.title = p.content;
                chip.onclick = () => Utils.insertPrompt(p.content, 0);
                chip.oncontextmenu = (e) => { e.preventDefault(); this.showEditor(idx); };
                chipContainer.appendChild(chip);
            });
            container.appendChild(chipContainer);
            const footer = document.createElement('div'); footer.className = 'cpm-footer';
            const tools = document.createElement('div'); tools.className = 'cpm-tools';
            const toggle = document.createElement('button'); toggle.className = 'cpm-btn-icon'; toggle.textContent = Store.data.isExpanded ? `🔼 ${TEXT.fold}` : `🔽 ${TEXT.unfold}`;
            toggle.onclick = (e) => { e.preventDefault(); Store.data.isExpanded = !Store.data.isExpanded; Store.save(); const chips = document.getElementById('cpm-chip-container'); if(chips) chips.style.display = Store.data.isExpanded ? 'flex' : 'none'; toggle.textContent = Store.data.isExpanded ? `🔼 ${TEXT.fold}` : `🔽 ${TEXT.unfold}`; };
            tools.appendChild(toggle);
            [{label:`➕ ${TEXT.add}`, fn:()=>this.showEditor()}, {label:`⚙️ ${TEXT.settings}`, fn:()=>this.showSettings()}, {label:`☁️ ${TEXT.sync}`, fn:()=>Sync.download()}].forEach(b => {
                const btn = document.createElement('button'); btn.className = 'cpm-btn-icon'; btn.textContent = b.label; btn.onclick = (e) => { e.preventDefault(); b.fn(); }; tools.appendChild(btn);
            });
            footer.appendChild(tools); container.appendChild(footer); form.insertBefore(container, form.firstChild);
        },

        createModal(html) { const overlay = document.createElement('div'); overlay.className = 'cpm-modal-overlay'; overlay.innerHTML = `<div class="cpm-modal">${html}</div>`; document.body.appendChild(overlay); overlay.onmousedown = (e) => { if(e.target===overlay) overlay.remove(); }; return overlay; },
        showSettings() {
            const overlay = this.createModal(`<h3>${TEXT.settings}</h3><label>Gist ID</label><input id="cpm-set-id" value="${Store.data.gistId}"><label>GitHub Token</label><input type="password" id="cpm-set-token" value="${Store.data.gistToken}"><div class="cpm-modal-actions"><button id="cpm-btn-upload" style="margin-right:auto;background:#3b82f6;color:white;border:none;padding:6px 12px;border-radius:4px">⬆️ 上传</button><button id="cpm-set-save" style="cursor:pointer;padding:6px 12px;background:#10a37f;color:white;border:none;border-radius:4px">${TEXT.save}</button></div>`);
            overlay.querySelector('#cpm-set-save').onclick = () => { Store.data.gistId = document.getElementById('cpm-set-id').value.trim(); Store.data.gistToken = document.getElementById('cpm-set-token').value.trim(); Store.save(); overlay.remove(); };
            overlay.querySelector('#cpm-btn-upload').onclick = () => { Store.data.gistId = document.getElementById('cpm-set-id').value.trim(); Store.data.gistToken = document.getElementById('cpm-set-token').value.trim(); Store.save(); Sync.upload(); };
        },
        showEditor(index = null) {
            const isEdit = index !== null; const item = isEdit ? Store.data.prompts[index] : { title: '', content: '' };
            const overlay = this.createModal(`<h3>${isEdit ? TEXT.edit : TEXT.add}</h3><input id="cpm-edit-title" placeholder="标题" value="${item.title}"><textarea id="cpm-edit-content" rows="8" placeholder="内容">${item.content}</textarea><div class="cpm-modal-actions">${isEdit ? `<button id="cpm-btn-del" style="background:#ef4444;color:white;border:none;padding:6px 12px;border-radius:4px;margin-right:auto">${TEXT.delete}</button>` : ''}<button id="cpm-btn-save" style="cursor:pointer;padding:6px 12px;background:#10a37f;color:white;border:none;border-radius:4px">${TEXT.save}</button></div>`);
            if (isEdit) overlay.querySelector('#cpm-btn-del').onclick = () => { if(confirm("Confirm delete?")) { Store.deletePrompt(index); overlay.remove(); } };
            overlay.querySelector('#cpm-btn-save').onclick = () => { const t = document.getElementById('cpm-edit-title').value.trim(); const c = document.getElementById('cpm-edit-content').value.trim(); if(!t || !c) return alert(TEXT.emptyError); isEdit ? Store.updatePrompt(index, t, c) : Store.addPrompt(t, c); overlay.remove(); };
        },
        updateTheme() { Utils.isDarkMode() ? document.body.classList.add('cpm-dark') : document.body.classList.remove('cpm-dark'); }
    };

    Store.init(); UI.init();
    new MutationObserver(() => { if (!document.getElementById('cpm-container')) UI.renderToolbar(); }).observe(document.body, { childList: true, subtree: true });
    new MutationObserver(() => UI.updateTheme()).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
})();
