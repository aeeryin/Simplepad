const { ipcRenderer, shell } = require('electron');

let notes = [];
let currentNoteId = null;
let isPreviewMode = false;
let currentLang = localStorage.getItem('language') || 'en';

const screenNotepad = document.getElementById('screen-notepad');
const screenSettings = document.getElementById('screen-settings');
const emptyState = document.getElementById('empty-state');
const noteEditor = document.getElementById('note-editor');
const tabsContainer = document.getElementById('tabs-container');
const btnAddTab = document.getElementById('btn-add-tab');
const btnBigAdd = document.getElementById('btn-big-add');
const noteHeaderContent = document.getElementById('note-header-content');
const noteTitle = document.getElementById('note-title');
const textEditor = document.getElementById('text-editor');
const textPreview = document.getElementById('text-preview');
const wordCounter = document.getElementById('word-counter');
const noteDate = document.getElementById('note-date');
const noteColor = document.getElementById('note-color');
const tagButtons = document.querySelectorAll('.tag-toggle');
const btnFavorite = document.getElementById('btn-favorite');
const btnLock = document.getElementById('btn-lock');
const btnHistory = document.getElementById('btn-history');
const btnPreview = document.getElementById('btn-preview');
const passwordOverlay = document.getElementById('password-overlay');
const inputUnlock = document.getElementById('input-unlock');
const btnUnlock = document.getElementById('btn-unlock');
const modalPassword = document.getElementById('modal-password');
const inputNewPassword = document.getElementById('input-new-password');
const modalPasswordTitle = document.getElementById('modal-password-title');
const modalPasswordDesc = document.getElementById('modal-password-desc');
const btnSavePassword = document.getElementById('btn-save-password');
const btnCancelPassword = document.getElementById('btn-cancel-password');
const btnSettings = document.getElementById('btn-settings');
const btnCloseSettings = document.getElementById('btn-close-settings');
const setTheme = document.getElementById('set-theme');
const setLang = document.getElementById('set-lang');
const btnGithub = document.getElementById('btn-github');
const updateBanner = document.getElementById('update-banner');
const updateVersions = document.getElementById('update-versions');
const btnUpdateDownload = document.getElementById('btn-update-download');
const btnUpdateClose = document.getElementById('btn-update-close');

btnSettings.addEventListener('click', () => {
    screenNotepad.classList.remove('screen-active');
    screenNotepad.classList.add('screen-hidden');
    screenSettings.classList.remove('screen-hidden');
    screenSettings.classList.add('screen-active');
    ipcRenderer.send('settings-mode', true);
});

btnCloseSettings.addEventListener('click', () => {
    screenSettings.classList.remove('screen-active');
    screenSettings.classList.add('screen-hidden');
    screenNotepad.classList.remove('screen-hidden');
    screenNotepad.classList.add('screen-active');
    ipcRenderer.send('settings-mode', false);
    if (currentNoteId !== null && !isPreviewMode) setTimeout(() => textEditor.focus(), 350); 
});

btnGithub.addEventListener('click', () => shell.openExternal('https://github.com/aeeryin/Simplepad'));

setTheme.addEventListener('change', (e) => {
    if (e.target.value === 'light') document.body.classList.add('light-theme');
    else document.body.classList.remove('light-theme');
});

ipcRenderer.on('update-available', (event, info) => {
    updateVersions.textContent = `v${info.currentVersion} ➔ v${info.latestVersion}`;
    updateBanner.classList.remove('hidden');
});

ipcRenderer.on('update-ready', () => {
    btnUpdateDownload.textContent = currentLang === 'en' ? 'Restart & Install' : 'Reiniciar e Instalar';
    btnUpdateDownload.dataset.ready = "true";
    btnUpdateDownload.style.backgroundColor = "#28a745";
});

btnUpdateClose.addEventListener('click', () => updateBanner.classList.add('hidden'));

btnUpdateDownload.addEventListener('click', () => {
    if (btnUpdateDownload.dataset.ready === "true") ipcRenderer.send('install-update');
    else {
        btnUpdateDownload.textContent = currentLang === 'en' ? 'Downloading...' : 'Baixando...';
        btnUpdateDownload.style.opacity = "0.7";
        btnUpdateDownload.disabled = true;
    }
});

const dictionary = {
    'pt': {
        'title_settings': 'Configurações',
        'lbl_theme': 'Tema do Aplicativo',
        'desc_theme': 'Alterna entre Dark Mode e Light Mode.',
        'opt_dark': 'Escuro',
        'opt_light': 'Claro',
        'lbl_lang': 'Idioma',
        'desc_lang': 'Muda o idioma da interface.',
        'lbl_autosave': 'Auto-salvar',
        'lbl_markdown': 'Modo Markdown',
        'desc_markdown': 'Ativa formatação rápida.',
        'lbl_fontsize': 'Tamanho da Fonte',
        'lbl_anim': 'Ativar Animações',
        'lbl_accent': 'Cor de Destaque',
        'desc_backup': 'Gerenciamento de dados salvos',
        'btn_export': 'Exportar Backup',
        'btn_delete': 'Apagar Tudo',
        'empty_title': 'Criar nova nota',
        'modal_lock_title': 'Bloquear Nota',
        'modal_unlock_title': 'Nota Bloqueada',
        'modal_lock_desc': 'A senha protegerá apenas esta nota.',
        'input_pass_placeholder': 'Digite a senha...',
        'btn_confirm': 'Confirmar',
        'btn_cancel': 'Cancelar',
        'btn_unlock': 'Desbloquear',
        'note_title_placeholder': 'Sem título...',
        'note_placeholder': 'Use **Negrito**, __Sublinhado__, *Itálico*, ~~Riscado~~, # Título, - Lista...',
        'word_count': 'palavras',
        'char_count': 'caracteres',
        'default_note_name': 'Nota',
        'alert_limit': 'Limite de 9 notas atingido!',
        'alert_wrong_pass': 'Senha Incorreta!',
        'alert_empty_pass': 'A senha não pode ser vazia!',
        'alert_no_history': 'Nenhum histórico de edição ainda.',
        'alert_history_title': 'ÚLTIMAS EDIÇÕES:',
        'update_available': 'Nova atualização disponível!',
        'btn_download_update': 'Baixar',
        'remove_pass_title': 'Remover Senha',
        'remove_pass_desc': 'Digite a senha atual para desproteger.'
    },
    'en': {
        'title_settings': 'Settings',
        'lbl_theme': 'App Theme',
        'desc_theme': 'Switch between Dark and Light mode.',
        'opt_dark': 'Dark',
        'opt_light': 'Light',
        'lbl_lang': 'Language',
        'desc_lang': 'Change application interface language.',
        'lbl_autosave': 'Auto-save',
        'lbl_markdown': 'Markdown Mode',
        'desc_markdown': 'Enable quick text formatting.',
        'lbl_fontsize': 'Font Size',
        'lbl_anim': 'Enable Animations',
        'lbl_accent': 'Accent Color',
        'desc_backup': 'Manage saved data',
        'btn_export': 'Export Backup',
        'btn_delete': 'Delete All',
        'empty_title': 'Create new note',
        'modal_lock_title': 'Lock Note',
        'modal_unlock_title': 'Note Locked',
        'modal_lock_desc': 'Password will protect this note only.',
        'input_pass_placeholder': 'Enter password...',
        'btn_confirm': 'Confirm',
        'btn_cancel': 'Cancel',
        'btn_unlock': 'Unlock',
        'note_title_placeholder': 'Untitled...',
        'note_placeholder': 'Use **Bold**, __Underline__, *Italic*, ~~Strikethrough~~, # Title, - List...',
        'word_count': 'words',
        'char_count': 'chars',
        'default_note_name': 'Note',
        'alert_limit': 'Maximum 9 notes limit reached!',
        'alert_wrong_pass': 'Incorrect Password!',
        'alert_empty_pass': 'Password cannot be empty!',
        'alert_no_history': 'No edit history yet.',
        'alert_history_title': 'LAST EDITS:',
        'update_available': 'New update available!',
        'btn_download_update': 'Download',
        'remove_pass_title': 'Remove Password',
        'remove_pass_desc': 'Enter current password to unprotect.'
    }
};

function applyTranslation(lang) {
    currentLang = lang;
    localStorage.setItem('language', lang);
    setLang.value = lang; 
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dictionary[lang] && dictionary[lang][key]) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = dictionary[lang][key];
            else el.textContent = dictionary[lang][key];
        }
    });
    renderTabs();
    updateCounter();
}

setLang.addEventListener('change', (e) => applyTranslation(e.target.value));

function createNote() {
    if (notes.length >= 9) { alert(dictionary[currentLang]['alert_limit']); return; }
    const newNote = {
        id: Date.now(),
        title: '',
        content: '',
        date: new Date().toLocaleString(),
        color: '#333333',
        tags: [],
        favorite: false,
        password: null,
        history: []
    };
    notes.push(newNote);
    openNote(newNote.id);
    renderTabs();
}

function openNote(id) {
    currentNoteId = id;
    const note = notes.find(n => n.id === id);
    emptyState.classList.add('hidden');
    noteEditor.classList.remove('hidden');
    modalPassword.classList.add('hidden'); 
    if (note.password) {
        passwordOverlay.classList.remove('hidden');
        noteHeaderContent.classList.add('hidden');
        textEditor.classList.add('hidden');
        textPreview.classList.add('hidden');
        inputUnlock.value = ''; 
        inputUnlock.focus();
    } else unlockInterface(note);
    renderTabs();
}

function unlockInterface(note) {
    passwordOverlay.classList.add('hidden');
    noteHeaderContent.classList.remove('hidden');
    if (isPreviewMode) {
        textPreview.classList.remove('hidden');
        textPreview.innerHTML = formatText(note.content);
    } else textEditor.classList.remove('hidden');
    noteTitle.value = note.title;
    textEditor.value = note.content;
    noteDate.textContent = note.date;
    noteColor.value = note.color;
    btnFavorite.classList.toggle('icon-btn-favorite', note.favorite);
    btnLock.classList.toggle('icon-btn-favorite', note.password !== null);
    tagButtons.forEach(btn => {
        const tagId = btn.getAttribute('data-tag');
        btn.classList.toggle('tag-toggle-active', note.tags.includes(tagId));
    });
    updateCounter();
    setTimeout(() => textEditor.focus(), 50); 
}

function closeNote(id) {
    notes = notes.filter(n => n.id !== id);
    if (currentNoteId === id) {
        if (notes.length > 0) openNote(notes[notes.length - 1].id);
        else { currentNoteId = null; renderTabs(); }
    } else renderTabs();
}

function renderTabs() {
    tabsContainer.innerHTML = ''; 
    if (notes.length === 0) {
        emptyState.classList.remove('hidden');
        noteEditor.classList.add('hidden');
        return;
    }
    notes.forEach((note, index) => {
        const tab = document.createElement('div');
        tab.className = `tab ${note.id === currentNoteId ? 'tab-active' : ''}`;
        let tabContent = '';
        if (note.favorite) tabContent += '<span class="tab-star">★</span>';
        const shortcutNum = `<small style="opacity:0.5; margin-right:5px;">${index + 1}</small>`;
        const title = note.title.trim() === '' ? `${dictionary[currentLang]['default_note_name']} ${index + 1}` : note.title;
        tabContent += shortcutNum + title;
        const titleSpan = document.createElement('span');
        titleSpan.innerHTML = tabContent;
        tab.appendChild(titleSpan);
        const btnCloseTab = document.createElement('span');
        btnCloseTab.className = 'tab-close';
        btnCloseTab.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        btnCloseTab.onclick = (e) => { e.stopPropagation(); closeNote(note.id); };
        tab.appendChild(btnCloseTab);
        tab.onclick = () => openNote(note.id);
        tabsContainer.appendChild(tab);
    });
}

btnFavorite.addEventListener('click', () => {
    const note = notes.find(n => n.id === currentNoteId);
    if (!note) return;
    note.favorite = !note.favorite;
    btnFavorite.classList.toggle('icon-btn-favorite', note.favorite);
    renderTabs();
});

btnHistory.addEventListener('click', () => {
    const note = notes.find(n => n.id === currentNoteId);
    if (!note) return;
    if (note.history.length === 0) alert(dictionary[currentLang]['alert_no_history']);
    else {
        const log = note.history.slice(-5).map((h, i) => `${i + 1}. ${h.date}`).join('\n');
        alert(`${dictionary[currentLang]['alert_history_title']}\n\n${log}`);
    }
});

btnUnlock.addEventListener('click', () => {
    const note = notes.find(n => n.id === currentNoteId);
    if (inputUnlock.value === note.password) unlockInterface(note);
    else { alert(dictionary[currentLang]['alert_wrong_pass']); inputUnlock.focus(); }
});

inputUnlock.addEventListener('keypress', (e) => { if (e.key === 'Enter') btnUnlock.click(); });

btnLock.addEventListener('click', () => {
    const note = notes.find(n => n.id === currentNoteId);
    if (!note || !passwordOverlay.classList.contains('hidden')) return;
    modalPassword.classList.remove('hidden');
    inputNewPassword.value = '';
    inputNewPassword.focus();
    if (note.password) {
        modalPasswordTitle.textContent = dictionary[currentLang]['remove_pass_title'];
        modalPasswordDesc.textContent = dictionary[currentLang]['remove_pass_desc'];
    } else {
        modalPasswordTitle.textContent = dictionary[currentLang]['modal_lock_title'];
        modalPasswordDesc.textContent = dictionary[currentLang]['modal_lock_desc'];
    }
});

btnCancelPassword.addEventListener('click', () => {
    modalPassword.classList.add('hidden');
    textEditor.focus();
});

btnSavePassword.addEventListener('click', () => {
    const note = notes.find(n => n.id === currentNoteId);
    const typedPassword = inputNewPassword.value;
    if (note.password) {
        if (typedPassword === note.password) {
            note.password = null;
            btnLock.classList.remove('icon-btn-favorite');
            modalPassword.classList.add('hidden');
            textEditor.focus();
        } else { alert(dictionary[currentLang]['alert_wrong_pass']); inputNewPassword.focus(); }
    } else {
        if (typedPassword.trim() === '') { alert(dictionary[currentLang]['alert_empty_pass']); return; }
        note.password = typedPassword;
        btnLock.classList.add('icon-btn-favorite');
        modalPassword.classList.add('hidden');
        openNote(note.id); 
    }
});

function formatText(text) {
    return text.replace(/</g, "&lt;").replace(/>/g, "&gt;") 
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/__(.*?)__/g, '<u>$1</u>')
        .replace(/\*(.*?)\*/g, '<i>$1</i>')
        .replace(/~~(.*?)~~/g, '<del>$1</del>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^- (.*$)/gim, '<li>$1</li>')
        .replace(/\n/g, '<br>');
}

btnPreview.addEventListener('click', () => {
    isPreviewMode = !isPreviewMode;
    const note = notes.find(n => n.id === currentNoteId);
    if (isPreviewMode) {
        textEditor.classList.add('hidden');
        textPreview.classList.remove('hidden');
        textPreview.innerHTML = formatText(note.content);
    } else {
        textPreview.classList.add('hidden');
        textEditor.classList.remove('hidden');
        textEditor.focus();
    }
});

function updateCounter() {
    const text = textEditor.value;
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    wordCounter.textContent = `${words} ${dictionary[currentLang]['word_count']} | ${text.length} ${dictionary[currentLang]['char_count']}`;
}

btnAddTab.addEventListener('click', createNote);
btnBigAdd.addEventListener('click', createNote);

noteTitle.addEventListener('input', (e) => {
    const note = notes.find(n => n.id === currentNoteId);
    if (note) { note.title = e.target.value; renderTabs(); }
});

textEditor.addEventListener('input', (e) => {
    const note = notes.find(n => n.id === currentNoteId);
    if (note) {
        note.content = e.target.value;
        updateCounter();
        if (note.content.length % 50 === 0 && note.content.length > 0) {
            note.history.push({ date: new Date().toLocaleString() });
            note.date = new Date().toLocaleString(); 
            noteDate.textContent = note.date;
        }
    }
});

tagButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const note = notes.find(n => n.id === currentNoteId);
        if (!note) return;
        const tagId = btn.getAttribute('data-tag');
        if (note.tags.includes(tagId)) {
            note.tags = note.tags.filter(t => t !== tagId);
            btn.classList.remove('tag-toggle-active');
        } else {
            note.tags.push(tagId);
            btn.classList.add('tag-toggle-active');
        }
    });
});

document.addEventListener('keydown', (e) => {
    // Bloquear F12 e DevTools
    if (e.key === 'F12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key.toLowerCase() === 'i' || e.key.toLowerCase() === 'c'))) {
        e.preventDefault();
        return;
    }

    // SALVAR EM .TXT (Ctrl + S)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const note = notes.find(n => n.id === currentNoteId);
        
        // Se existe uma nota e ela não está com a tela de senha na frente, SALVA
        if (note && passwordOverlay.classList.contains('hidden')) {
            ipcRenderer.invoke('file-save', note.title, note.content).then(success => {
                if (success) console.log('File Saved');
            });
        }
    }

    // ABRIR .TXT (Ctrl + O)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        ipcRenderer.invoke('file-open').then(fileData => {
            if (fileData) {
                if (notes.length >= 9) {
                    alert(dictionary[currentLang]['alert_limit']);
                    return;
                }
                const newNote = {
                    id: Date.now(),
                    title: fileData.title,
                    content: fileData.content,
                    date: new Date().toLocaleString(),
                    color: '#333333',
                    tags: [],
                    favorite: false,
                    password: null,
                    history: []
                };
                notes.push(newNote);
                openNote(newNote.id);
                renderTabs();
            }
        });
    }

    // Atalhos de abas 1-9
    if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1; 
        if (notes[index]) { e.preventDefault(); openNote(notes[index].id); }
    }
    // Novo (Ctrl + T) e Fechar (Ctrl + W)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') { e.preventDefault(); createNote(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        if (currentNoteId !== null) closeNote(currentNoteId);
    }
});

document.getElementById('btn-close').addEventListener('click', () => ipcRenderer.send('window-close'));
document.getElementById('btn-minimize').addEventListener('click', () => ipcRenderer.send('window-minimize'));
document.getElementById('btn-pin').addEventListener('click', () => ipcRenderer.send('window-pin'));
ipcRenderer.on('pin-status', (e, isPinned) => document.getElementById('btn-pin').classList.toggle('window-btn-active', isPinned));

applyTranslation(currentLang);