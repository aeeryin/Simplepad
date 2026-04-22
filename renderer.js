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
const noteHeaderContent = document.querySelector('.note-header');
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
const searchBar = document.getElementById('search-bar');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

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

ipcRenderer.invoke('get-stored-notes').then(stored => {
    notes = stored || [];
    renderTabs();
});

ipcRenderer.invoke('get-app-version').then(v => {
    document.getElementById('app-version').innerText = v;
});

function applyTranslation(lang) {
    currentLang = lang;
    localStorage.setItem('language', lang);
    setLang.value = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dictionary[lang][key]) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = dictionary[lang][key];
            else el.textContent = dictionary[lang][key];
        }
    });
    renderTabs();
    updateCounter();
}

setLang.addEventListener('change', (e) => applyTranslation(e.target.value));

function persistNotes() {
    ipcRenderer.invoke('save-stored-notes', notes);
}

function createNote(data = null) {
    if (notes.length >= 9) { alert(dictionary[currentLang]['alert_limit']); return; }
    const newNote = {
        id: Date.now().toString(),
        title: data ? data.title : '',
        content: data ? data.content : '',
        date: new Date().toLocaleString(),
        color: '#333333',
        tags: [],
        favorite: false,
        password: null,
        history: []
    };
    notes.push(newNote);
    persistNotes();
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
        noteHeaderContent.style.visibility = 'hidden';
        textEditor.classList.add('hidden');
        textPreview.classList.add('hidden');
        inputUnlock.value = '';
        inputUnlock.focus();
    } else {
        unlockInterface(note);
    }
    renderTabs();
}

function unlockInterface(note) {
    passwordOverlay.classList.add('hidden');
    noteHeaderContent.style.visibility = 'visible';
    if (isPreviewMode) {
        textPreview.classList.remove('hidden');
        textPreview.innerHTML = formatText(note.content);
    } else {
        textEditor.classList.remove('hidden');
    }
    noteTitle.value = note.title;
    textEditor.value = note.content;
    noteDate.textContent = note.date;
    noteColor.value = note.color;
    btnFavorite.classList.toggle('icon-btn-favorite', note.favorite);
    btnLock.classList.toggle('icon-btn-favorite', note.password !== null);
    updateCounter();
    setTimeout(() => textEditor.focus(), 50);
}

function closeNote(id) {
    notes = notes.filter(n => n.id !== id);
    persistNotes();
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
        let content = note.favorite ? '<span class="tab-star">★</span>' : '';
        content += `<small style="opacity:0.5; margin-right:5px;">${index + 1}</small>`;
        content += note.title.trim() === '' ? `${dictionary[currentLang]['default_note_name']} ${index + 1}` : note.title;
        tab.innerHTML = `<span>${content}</span>`;
        const closeBtn = document.createElement('span');
        closeBtn.className = 'tab-close';
        closeBtn.innerHTML = '✕';
        closeBtn.onclick = (e) => { e.stopPropagation(); closeNote(note.id); };
        tab.appendChild(closeBtn);
        tab.onclick = () => openNote(note.id);
        tabsContainer.appendChild(tab);
    });
}

function formatText(text) {
    return text.replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/__(.*?)__/g, '<u>$1</u>')
        .replace(/\*(.*?)\*/g, '<i>$1</i>')
        .replace(/~~(.*?)~~/g, '<del>$1</del>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\n/g, '<br>');
}

function updateCounter() {
    const text = textEditor.value;
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    wordCounter.textContent = `${words} ${dictionary[currentLang]['word_count']} | ${text.length} ${dictionary[currentLang]['char_count']}`;
}

btnSettings.onclick = () => {
    screenNotepad.classList.replace('screen-active', 'screen-hidden');
    screenSettings.classList.replace('screen-hidden', 'screen-active');
    ipcRenderer.send('settings-mode', true);
};

btnCloseSettings.onclick = () => {
    screenSettings.classList.replace('screen-active', 'screen-hidden');
    screenNotepad.classList.replace('screen-hidden', 'screen-active');
    ipcRenderer.send('settings-mode', false);
};

ipcRenderer.on('update-available', (e, info) => {
    updateVersions.textContent = `${info.currentVersion} ➔ ${info.latestVersion}`;
    updateBanner.classList.remove('hidden');
});

ipcRenderer.on('update-ready', () => {
    btnUpdateDownload.textContent = currentLang === 'en' ? 'Restart & Install' : 'Reiniciar e Instalar';
    btnUpdateDownload.dataset.ready = "true";
    btnUpdateDownload.style.backgroundColor = "#28a745";
});

btnUpdateDownload.onclick = () => {
    if (btnUpdateDownload.dataset.ready === "true") {
        ipcRenderer.send('install-update');
    } else {
        btnUpdateDownload.textContent = currentLang === 'en' ? 'Downloading...' : 'Baixando...';
        btnUpdateDownload.disabled = true;
        ipcRenderer.send('start-download');
    }
};

btnUpdateClose.onclick = () => updateBanner.classList.add('hidden');

textEditor.addEventListener('input', () => {
    const note = notes.find(n => n.id === currentNoteId);
    if (note) {
        note.content = textEditor.value;
        updateCounter();
        persistNotes();
    }
});

noteTitle.addEventListener('input', () => {
    const note = notes.find(n => n.id === currentNoteId);
    if (note) {
        note.title = noteTitle.value;
        renderTabs();
        persistNotes();
    }
});

btnPreview.onclick = () => {
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
};

searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    const content = textEditor.value.toLowerCase();
    if (!query) { searchResults.textContent = "0/0"; return; }
    const count = (content.match(new RegExp(query, 'g')) || []).length;
    searchResults.textContent = `${count} matches`;
    const index = content.indexOf(query);
    if (index !== -1) {
        textEditor.focus();
        textEditor.setSelectionRange(index, index + query.length);
    }
});

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        if (currentNoteId) {
            searchBar.classList.toggle('hidden');
            if (!searchBar.classList.contains('hidden')) searchInput.focus();
        }
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') createNote();
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        const note = notes.find(n => n.id === currentNoteId);
        if (note) ipcRenderer.invoke('file-save', note.title, note.content);
    }
});

btnUnlock.onclick = () => {
    const note = notes.find(n => n.id === currentNoteId);
    if (inputUnlock.value === note.password) unlockInterface(note);
    else alert(dictionary[currentLang]['alert_wrong_pass']);
};

btnLock.onclick = () => {
    const note = notes.find(n => n.id === currentNoteId);
    if (!note) return;
    modalPassword.classList.remove('hidden');
    inputNewPassword.value = '';
    inputNewPassword.focus();
    const isRemoving = note.password !== null;
    modalPasswordTitle.textContent = dictionary[currentLang][isRemoving ? 'remove_pass_title' : 'modal_lock_title'];
};

btnSavePassword.onclick = () => {
    const note = notes.find(n => n.id === currentNoteId);
    const pass = inputNewPassword.value;
    if (note.password) {
        if (pass === note.password) { note.password = null; modalPassword.classList.add('hidden'); unlockInterface(note); persistNotes(); }
        else alert(dictionary[currentLang]['alert_wrong_pass']);
    } else {
        if (!pass.trim()) return alert(dictionary[currentLang]['alert_empty_pass']);
        note.password = pass;
        modalPassword.classList.add('hidden');
        openNote(note.id);
        persistNotes();
    }
};

btnCancelPassword.onclick = () => modalPassword.classList.add('hidden');

btnPdf.onclick = () => {
    const note = notes.find(n => n.id === currentNoteId);
    if (note) {
        if (!isPreviewMode) btnPreview.click();
        setTimeout(() => ipcRenderer.invoke('export-pdf', note.title), 200);
    }
};

document.getElementById('btn-close').onclick = () => ipcRenderer.send('window-close');
document.getElementById('btn-minimize').onclick = () => ipcRenderer.send('window-minimize');
document.getElementById('btn-pin').onclick = () => ipcRenderer.send('window-pin');
btnGithub.onclick = () => shell.openExternal('https://github.com/aeeryin/Simplepad');
btnAddTab.onclick = createNote;
btnBigAdd.onclick = createNote;

applyTranslation(currentLang);