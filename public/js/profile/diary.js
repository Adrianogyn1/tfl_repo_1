/**
 * ============================================================================
 * TFL DIARY MODULE — Diário Secreto & Cantinho de Desabafo Anônimo
 * ============================================================================
 * Gerencia:
 * - Diário Pessoal Privado & Caderno Aconchegante
 * - Personalização de Papel/Tema e Caligrafia com persistência local
 * - Adesivos & Selos Emocionais Táteis
 * - Mural Público 100% Anônimo (sem vazamento de IDs numéricos)
 * - Reações empáticas (🫂 Abraço, ❤️ Acolher, 🤝 Te entendo, 🌟 Força, 🕯️ Paz)
 * - Comentários e Apoios Anônimos
 * - Leitor Acolhedor com leitura atenta e respeitosa
 */
(function () {
  const state = {
    currentSubtab: 'public',
    filterCategory: 'ALL',
    filterMood: 'ALL',
    filterSort: 'recent',
    myFilter: 'ALL',
    customization: {
      paperTheme: localStorage.getItem('tfl_diary_paper_theme') || 'paper-parchment',
      fontFamily: localStorage.getItem('tfl_diary_font') || 'font-diary-handwriting',
    },
    editorSelectedStickers: [],
    data: {
      moods: [],
      categories: [],
      reactions: [],
      stickers: [],
      rewardRules: {
        minReadSeconds: 30,
        readerRewardPerPageCoins: 0.25,
        authorRewardPerReadCoins: 0.5,
        authorBonusPer10MinCoins: 5.0,
        readerDailyLimitPages: 20,
      },
      stats: {},
      myPages: [],
      publicFeed: [],
    },
    reader: {
      activePageId: null,
      secondsRead: 0,
      unsentSeconds: 0,
      rewarded: false,
      isMine: false,
      timerId: null,
      sendingHeartbeat: false,
    },
  };

  function toast(msg, type = 'info') {
    if (window.TFL && typeof window.TFL.toast === 'function') {
      window.TFL.toast(msg, type);
    } else if (typeof window.showToast === 'function') {
      window.showToast(msg, type);
    }
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function hydrateInitialData() {
    const el = document.getElementById('tflDiaryInitialData');
    if (el) {
      try {
        const parsed = JSON.parse(el.textContent || '{}');
        if (parsed && typeof parsed === 'object') {
          state.data = {
            ...state.data,
            ...parsed,
          };
        }
      } catch (err) {
        console.warn('Falha ao ler dados iniciais do Diário:', err);
      }
    }
    applyCustomizations();
  }

  function findPageById(pageId) {
    const id = Number(pageId);
    return (
      (state.data.publicFeed || []).find((p) => Number(p.id) === id) ||
      (state.data.myPages || []).find((p) => Number(p.id) === id) ||
      null
    );
  }

  // ==================== PERSONALIZAÇÃO DO CADERNO ====================
  function toggleCustomizerPanel() {
    const panel = document.getElementById('diaryCustomizerPanel');
    if (panel) {
      panel.classList.toggle('hidden');
    }
  }

  function setPaperTheme(themeClass) {
    if (!themeClass) return;
    state.customization.paperTheme = themeClass;
    try {
      localStorage.setItem('tfl_diary_paper_theme', themeClass);
    } catch (_) {}
    applyCustomizations();
  }

  function setFontFamily(fontClass) {
    if (!fontClass) return;
    state.customization.fontFamily = fontClass;
    try {
      localStorage.setItem('tfl_diary_font', fontClass);
    } catch (_) {}
    applyCustomizations();
  }

  function applyCustomizations() {
    const paper = state.customization.paperTheme || 'paper-parchment';
    const font = state.customization.fontFamily || 'font-diary-handwriting';

    // Aplica tema de papel aos containers do caderno
    const surfaces = document.querySelectorAll(
      '.diary-notebook-surface, .diary-card-surface, .diary-editor-surface, .diary-reader-surface'
    );
    surfaces.forEach((el) => {
      el.classList.remove(
        'paper-parchment',
        'paper-lavender',
        'paper-lined',
        'paper-graphite',
        'paper-rose'
      );
      el.classList.add(paper);
    });

    // Aplica fonte aos textos do corpo
    const fontEls = document.querySelectorAll(
      '.diary-page-body-preview, .diary-reader-body-content, #diaryInputContent'
    );
    fontEls.forEach((el) => {
      el.classList.remove(
        'font-diary-handwriting',
        'font-diary-casual',
        'font-diary-poetic',
        'font-diary-clean'
      );
      el.classList.add(font);
    });

    // Atualiza botões ativos no painel de customização
    document.querySelectorAll('.btn-diary-paper').forEach((btn) => {
      const p = btn.getAttribute('data-paper');
      if (p === paper) {
        btn.classList.add('border-amber-500/60', 'bg-amber-950/50', 'text-amber-200');
        btn.classList.remove('border-white/10', 'bg-zinc-900/80', 'text-zinc-300');
      } else {
        btn.classList.remove('border-amber-500/60', 'bg-amber-950/50', 'text-amber-200');
        btn.classList.add('border-white/10', 'bg-zinc-900/80', 'text-zinc-300');
      }
    });

    document.querySelectorAll('.btn-diary-font').forEach((btn) => {
      const f = btn.getAttribute('data-font');
      if (f === font) {
        btn.classList.add('border-rose-500/60', 'bg-rose-950/50', 'text-rose-200');
        btn.classList.remove('border-white/10', 'bg-zinc-900/80', 'text-zinc-300');
      } else {
        btn.classList.remove('border-rose-500/60', 'bg-rose-950/50', 'text-rose-200');
        btn.classList.add('border-white/10', 'bg-zinc-900/80', 'text-zinc-300');
      }
    });
  }

  // ==================== ADESIVOS & SELOS EMOCIONAIS ====================
  function toggleEditorSticker(key, btn) {
    if (!key) return;
    const idx = state.editorSelectedStickers.indexOf(key);
    if (idx >= 0) {
      state.editorSelectedStickers.splice(idx, 1);
    } else {
      if (state.editorSelectedStickers.length >= 3) {
        toast('Você pode escolher até 3 adesivos para cada página.', 'info');
        return;
      }
      state.editorSelectedStickers.push(key);
    }
    updateEditorStickersUI();
  }

  function updateEditorStickersUI() {
    const hiddenInput = document.getElementById('diaryInputStickers');
    if (hiddenInput) {
      hiddenInput.value = state.editorSelectedStickers.join(',');
    }

    const container = document.getElementById('diaryStickersPickerContainer');
    if (!container) return;

    const btns = container.querySelectorAll('.btn-sticker-toggle');
    btns.forEach((btn) => {
      const key = btn.getAttribute('data-sticker-key');
      const isSelected = state.editorSelectedStickers.includes(key);
      if (isSelected) {
        btn.className =
          'btn-sticker-toggle diary-sticker-badge bg-amber-500/30 border-amber-400 text-amber-100 ring-2 ring-amber-400/40 shadow-md transition scale-105';
      } else {
        btn.className =
          'btn-sticker-toggle diary-sticker-badge bg-zinc-900/80 hover:bg-amber-950/60 border-zinc-700/80 text-zinc-300 hover:text-amber-200 transition';
      }
    });
  }

  // ==================== NAVEGAÇÃO ENTRE SUB-ABAS ====================
  function switchSubtab(tab) {
    state.currentSubtab = tab === 'mine' ? 'mine' : 'public';
    const pubEl = document.getElementById('diarySubtabPublic');
    const mineEl = document.getElementById('diarySubtabMine');
    const btnPub = document.getElementById('btnDiarySubtabPublic');
    const btnMine = document.getElementById('btnDiarySubtabMine');

    if (pubEl && mineEl) {
      if (state.currentSubtab === 'mine') {
        pubEl.classList.add('hidden');
        mineEl.classList.remove('hidden');
      } else {
        mineEl.classList.add('hidden');
        pubEl.classList.remove('hidden');
      }
    }

    if (btnPub && btnMine) {
      if (state.currentSubtab === 'mine') {
        btnMine.className =
          'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 bg-amber-600 text-white shadow-md shadow-amber-600/20';
        btnPub.className =
          'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 bg-zinc-900/90 text-zinc-400 hover:text-white border border-white/5';
      } else {
        btnPub.className =
          'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 bg-amber-600 text-white shadow-md shadow-amber-600/20';
        btnMine.className =
          'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 bg-zinc-900/90 text-zinc-400 hover:text-white border border-white/5';
      }
    }
  }

  // ==================== FILTROS DO MURAL ====================
  function setFilterCategory(category) {
    state.filterCategory = category || 'ALL';
    const pills = document.querySelectorAll('#diaryCategoryFilterBar .diary-cat-pill');
    pills.forEach((btn) => {
      const isAct = btn.getAttribute('data-category') === state.filterCategory;
      if (isAct) {
        btn.className =
          'diary-cat-pill px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 text-white shrink-0 transition flex items-center gap-1.5';
      } else {
        btn.className =
          'diary-cat-pill px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 shrink-0 transition flex items-center gap-1.5';
      }
    });
    applyFeedFilters();
  }

  function applyFeedFilters() {
    const moodSel = document.getElementById('diaryFilterMood');
    const sortSel = document.getElementById('diaryFilterSort');
    if (moodSel) state.filterMood = moodSel.value || 'ALL';
    if (sortSel) state.filterSort = sortSel.value || 'recent';

    const grid = document.getElementById('diaryPublicFeedGrid');
    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll('.diary-public-card'));
    cards.forEach((card) => {
      const cat = card.getAttribute('data-category') || '';
      const mood = card.getAttribute('data-mood') || '';
      const matchCat = state.filterCategory === 'ALL' || cat === state.filterCategory;
      const matchMood = state.filterMood === 'ALL' || mood === state.filterMood;
      card.style.display = matchCat && matchMood ? '' : 'none';
    });

    cards.sort((a, b) => {
      if (state.filterSort === 'popular') {
        return Number(b.getAttribute('data-reactions') || 0) - Number(a.getAttribute('data-reactions') || 0);
      }
      if (state.filterSort === 'most_read') {
        return Number(b.getAttribute('data-reads') || 0) - Number(a.getAttribute('data-reads') || 0);
      }
      return Number(b.getAttribute('data-created') || 0) - Number(a.getAttribute('data-created') || 0);
    });

    cards.forEach((card) => grid.appendChild(card));
  }

  function filterMyPages(filterType) {
    state.myFilter = filterType || 'ALL';
    const btns = document.querySelectorAll('.diary-myfilter-btn');
    btns.forEach((btn) => {
      const isAct = btn.getAttribute('data-myfilter') === state.myFilter;
      btn.className = isAct
        ? 'diary-myfilter-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 text-white transition'
        : 'diary-myfilter-btn px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 text-zinc-300 border border-zinc-800 hover:bg-zinc-800 transition';
    });

    const cards = document.querySelectorAll('#diaryMyPagesList .diary-mine-card');
    cards.forEach((card) => {
      const vis = card.getAttribute('data-visibility');
      const show = state.myFilter === 'ALL' || vis === state.myFilter;
      card.style.display = show ? '' : 'none';
    });
  }

  async function refreshOverview() {
    const prevTab = state.currentSubtab;
    if (window.TFL && typeof window.TFL.refreshPartial === 'function') {
      await window.TFL.refreshPartial(['view-diary', 'header-profile']);
      hydrateInitialData();
      switchSubtab(prevTab);
    }
  }

  // ==================== MODAL DE ESCREVER / EDITAR PÁGINA ====================
  function updateEditorWordCount() {
    const contentEl = document.getElementById('diaryInputContent');
    const infoEl = document.getElementById('diaryEditorCharInfo');
    if (!contentEl || !infoEl) return;

    const text = String(contentEl.value || '').trim();
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    const estMin = Math.max(1, Math.ceil(words / 160));
    infoEl.textContent = `${words} palavra(s) • ~${estMin} min`;
  }

  // ==================== SELETORES DE HUMOR & ASSUNTO DO CADERNO ====================
  function selectEditorMood(moodKey) {
    if (!moodKey) return;
    const moodInput = document.getElementById('diaryInputMood');
    if (moodInput) moodInput.value = moodKey;
    updateEditorMoodPillsUI(moodKey);
  }

  function updateEditorMoodPillsUI(activeKey) {
    const key = activeKey || document.getElementById('diaryInputMood')?.value || 'reflexivo';
    document.querySelectorAll('.btn-editor-mood-pill').forEach((btn) => {
      const bKey = btn.getAttribute('data-mood-key');
      if (bKey === key) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function selectEditorCategory(catKey) {
    if (!catKey) return;
    const catInput = document.getElementById('diaryInputCategory');
    if (catInput) catInput.value = catKey;
    updateEditorCategoryPillsUI(catKey);
  }

  function updateEditorCategoryPillsUI(activeKey) {
    const key = activeKey || document.getElementById('diaryInputCategory')?.value || 'Desabafo';
    document.querySelectorAll('.btn-editor-category-pill').forEach((btn) => {
      const bKey = btn.getAttribute('data-cat-key');
      if (bKey === key) {
        btn.className =
          'btn-editor-category-pill px-3 py-1 rounded-xl text-[11px] font-semibold border transition flex items-center gap-1.5 bg-amber-600/30 border-amber-400/60 text-amber-200 shadow-sm';
      } else {
        btn.className =
          'btn-editor-category-pill px-3 py-1 rounded-xl text-[11px] font-semibold border transition flex items-center gap-1.5 bg-black/30 border-white/10 text-zinc-400 hover:text-zinc-200';
      }
    });
  }

  function openEditorModal(preset = {}) {
    hydrateInitialData();
    const modal = document.getElementById('modalDiaryEditor');
    if (!modal) return;

    const titleModal = document.getElementById('diaryEditorModalTitle');
    const idInput = document.getElementById('diaryInputPageId');
    const titleInput = document.getElementById('diaryInputTitle');
    const moodInput = document.getElementById('diaryInputMood');
    const catInput = document.getElementById('diaryInputCategory');
    const contentInput = document.getElementById('diaryInputContent');
    const visPrivate = document.getElementById('diaryVisPrivate');
    const visPublic = document.getElementById('diaryVisPublic');
    const allowComm = document.getElementById('diaryInputAllowComments');

    if (idInput) idInput.value = preset.id ? String(preset.id) : '';
    if (titleModal) {
      titleModal.textContent = preset.id ? 'Editar Página do Caderno' : 'Nova Página no Meu Caderno';
    }
    if (titleInput) titleInput.value = preset.title || '';
    
    const selectedMood = preset.mood || preset.moodKey || 'reflexivo';
    const selectedCat = preset.category || 'Desabafo';
    if (moodInput) moodInput.value = selectedMood;
    if (catInput) catInput.value = selectedCat;
    updateEditorMoodPillsUI(selectedMood);
    updateEditorCategoryPillsUI(selectedCat);

    const dateDisplay = document.getElementById('diaryEditorDateDisplay');
    if (dateDisplay) {
      const d = new Date();
      dateDisplay.textContent = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    }

    if (contentInput) contentInput.value = preset.content || '';
    if (allowComm) allowComm.checked = preset.allowComments !== false;

    // Carrega adesivos
    if (Array.isArray(preset.stickers)) {
      state.editorSelectedStickers = [...preset.stickers];
    } else if (typeof preset.stickers === 'string' && preset.stickers) {
      state.editorSelectedStickers = preset.stickers.split(',').map((s) => s.trim()).filter(Boolean);
    } else {
      state.editorSelectedStickers = [];
    }
    updateEditorStickersUI();

    const isPub = Boolean(preset.isPublicAnonymous);
    if (visPublic && visPrivate) {
      visPublic.checked = isPub;
      visPrivate.checked = !isPub;
    }

    updateEditorWordCount();
    applyCustomizations();

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  function openEditorModalById(pageId) {
    hydrateInitialData();
    const page = (state.data.myPages || []).find((p) => Number(p.id) === Number(pageId));
    if (!page) {
      toast('Página não encontrada no seu diário.', 'error');
      return;
    }
    openEditorModal(page);
  }

  function closeEditorModal() {
    const modal = document.getElementById('modalDiaryEditor');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  async function submitPageForm(event) {
    if (event) event.preventDefault();
    const idInput = document.getElementById('diaryInputPageId');
    const titleInput = document.getElementById('diaryInputTitle');
    const moodInput = document.getElementById('diaryInputMood');
    const catInput = document.getElementById('diaryInputCategory');
    const contentInput = document.getElementById('diaryInputContent');
    const visPublic = document.getElementById('diaryVisPublic');
    const allowComm = document.getElementById('diaryInputAllowComments');
    const stickersInput = document.getElementById('diaryInputStickers');
    const btn = document.getElementById('btnDiarySaveSubmit');

    const payload = {
      pageId: idInput?.value || null,
      title: titleInput?.value || '',
      moodKey: moodInput?.value || 'reflexivo',
      category: catInput?.value || 'Desabafo',
      content: contentInput?.value || '',
      isPublicAnonymous: Boolean(visPublic?.checked),
      allowComments: Boolean(allowComm?.checked),
      stickers: stickersInput?.value || '',
      paperTheme: state.customization.paperTheme,
      fontFamily: state.customization.fontFamily,
    };

    if (btn) btn.disabled = true;
    try {
      const res = await fetch('/profile/diary/page/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) {
        toast(json.error || 'Erro ao salvar página.', 'error');
        return;
      }

      toast(json.message || 'Página salva com sucesso!', 'success');
      closeEditorModal();
      const targetTab = payload.isPublicAnonymous ? 'public' : 'mine';
      state.currentSubtab = targetTab;
      await refreshOverview();
    } catch (err) {
      toast('Falha de conexão ao salvar página.', 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async function togglePageVisibility(pageId, makePublic) {
    try {
      const res = await fetch(`/profile/diary/page/${pageId}/visibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ isPublicAnonymous: Boolean(makePublic) }),
      });
      const json = await res.json();
      if (!json.success) {
        toast(json.error || 'Não foi possível alterar a visibilidade.', 'error');
        return;
      }
      toast(json.message || 'Visibilidade atualizada!', 'success');
      await refreshOverview();
    } catch (err) {
      toast('Erro ao alterar visibilidade.', 'error');
    }
  }

  async function deletePage(pageId) {
    try {
      const res = await fetch(`/profile/diary/page/${pageId}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      });
      const json = await res.json();
      if (!json.success) {
        toast(json.error || 'Não foi possível excluir a página.', 'error');
        return;
      }
      toast(json.message || 'Página removida.', 'info');
      await refreshOverview();
    } catch (err) {
      toast('Erro ao excluir página.', 'error');
    }
  }

  // ==================== REAÇÕES EMPÁTICAS ====================
  async function reactToPage(pageId, reactionType, btnEl) {
    try {
      const res = await fetch(`/profile/diary/page/${pageId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ reactionType }),
      });
      const json = await res.json();
      if (!json.success) {
        toast(json.error || 'Erro ao reagir.', 'error');
        return;
      }

      const page = findPageById(pageId);
      if (page) {
        page.myReaction = json.myReaction;
        page.reactionsSummary = json.reactionsSummary || {};
        page.totalReactions = json.totalReactions || 0;
      }

      if (state.reader.activePageId && Number(state.reader.activePageId) === Number(pageId)) {
        renderReaderReactions(page);
      }

      await refreshOverview();
    } catch (err) {
      toast('Erro ao registrar reação.', 'error');
    }
  }

  // ==================== LEITOR ACOLHEDOR IMERSIVO ====================
  function stopReadingTimer() {
    if (state.reader.timerId) {
      clearInterval(state.reader.timerId);
      state.reader.timerId = null;
    }
  }

  function updateReaderTimerUI() {
    const box = document.getElementById('diaryReaderTimerBox');
    const label = document.getElementById('diaryReaderTimerLabel');
    const counter = document.getElementById('diaryReaderTimerCounter');
    const progress = document.getElementById('diaryReaderTimerProgress');
    if (!box || !label || !counter || !progress) return;

    const minSec = Number(state.data.rewardRules?.minReadSeconds || 30);

    if (state.reader.isMine) {
      label.innerHTML = `<i class="fa-solid fa-heart text-amber-400"></i> <span>Esta página é sua. Agradecemos por compartilhar seus sentimentos com carinho.</span>`;
      counter.textContent = 'Autor(a)';
      progress.style.width = '100%';
      return;
    }

    if (state.reader.rewarded) {
      label.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-400"></i> <span class="text-emerald-300">Leitura Acolhida! Obrigado pela sua presença e atenção.</span>`;
      counter.textContent = `${Math.max(state.reader.secondsRead, minSec)}s / ${minSec}s`;
      progress.style.width = '100%';
      return;
    }

    const pct = Math.min(100, Math.round((state.reader.secondsRead / minSec) * 100));
    label.innerHTML = `<i class="fa-solid fa-heart text-rose-400 animate-pulse"></i> <span>Lendo com atenção e acolhimento...</span>`;
    counter.textContent = `${state.reader.secondsRead}s / ${minSec}s`;
    progress.style.width = `${pct}%`;
  }

  async function sendReadingHeartbeat(forceDelta) {
    if (!state.reader.activePageId || state.reader.isMine || state.reader.sendingHeartbeat) return;
    const delta = forceDelta || state.reader.unsentSeconds;
    if (delta <= 0) return;

    state.reader.sendingHeartbeat = true;
    state.reader.unsentSeconds = 0;

    try {
      const res = await fetch(`/profile/diary/page/${state.reader.activePageId}/read-reward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ secondsReadDelta: delta }),
      });
      const json = await res.json();
      if (json.success) {
        if (typeof json.secondsRead === 'number') {
          state.reader.secondsRead = Math.max(state.reader.secondsRead, json.secondsRead);
        }
        if (json.rewarded) {
          state.reader.rewarded = true;
          const page = findPageById(state.reader.activePageId);
          if (page) {
            page.viewerReadState = { secondsRead: state.reader.secondsRead, rewarded: true };
          }
        }
        updateReaderTimerUI();

        if (json.rewardGranted && json.message) {
          toast('Obrigado por acolher esta leitura!', 'success');
          if (window.TFL && typeof window.TFL.refreshPartial === 'function') {
            window.TFL.refreshPartial(['header-profile']);
          }
        }
      }
    } catch (_) {
      // Silencioso
    } finally {
      state.reader.sendingHeartbeat = false;
    }
  }

  function startReadingTimer(page) {
    stopReadingTimer();
    const minSec = Number(state.data.rewardRules?.minReadSeconds || 30);
    state.reader.activePageId = page.id;
    state.reader.isMine = Boolean(page.isMine);
    state.reader.secondsRead = Number(page.viewerReadState?.secondsRead || 0);
    state.reader.rewarded = Boolean(page.viewerReadState?.rewarded);
    state.reader.unsentSeconds = 0;

    updateReaderTimerUI();
    if (state.reader.isMine) return;

    state.reader.timerId = setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      state.reader.secondsRead += 1;
      state.reader.unsentSeconds += 1;
      updateReaderTimerUI();

      if (
        (!state.reader.rewarded && state.reader.secondsRead >= minSec && state.reader.unsentSeconds > 0) ||
        state.reader.unsentSeconds >= 10
      ) {
        sendReadingHeartbeat();
      }
    }, 1000);
  }

  function renderReaderReactions(page) {
    const bar = document.getElementById('diaryReaderReactionsBar');
    if (!bar || !page) return;
    const reactions = state.data.reactions || [
      { type: 'hug', emoji: '🫂', label: 'Abraço' },
      { type: 'heart', emoji: '❤️', label: 'Acolher' },
      { type: 'relate', emoji: '🤝', label: 'Te entendo' },
      { type: 'strength', emoji: '🌟', label: 'Força' },
      { type: 'peace', emoji: '🕯️', label: 'Paz' },
    ];

    bar.innerHTML = reactions
      .map((r) => {
        const count = Number((page.reactionsSummary && page.reactionsSummary[r.type]) || 0);
        const active = page.myReaction === r.type;
        return `
          <button type="button" onclick="window.TFLDiary.reactToPage(${page.id}, '${r.type}')"
            class="px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
              active
                ? 'bg-amber-600/35 border-amber-400 text-white shadow-sm'
                : 'bg-black/50 border-white/10 text-zinc-300 hover:border-zinc-700'
            }">
            <span>${r.emoji}</span>
            <span>${escapeHtml(r.label)}</span>
            <span class="px-1.5 py-0.5 rounded-lg bg-black/40 text-[10px] ${count > 0 ? 'text-amber-300' : 'text-zinc-500'}">${count}</span>
          </button>
        `;
      })
      .join('');
  }

  function renderReaderComments(page) {
    const countEl = document.getElementById('diaryReaderCommentsCount');
    const listEl = document.getElementById('diaryReaderCommentsList');
    const formEl = document.getElementById('formDiaryComment');
    if (!listEl || !page) return;

    const comments = Array.isArray(page.comments) ? page.comments : [];
    if (countEl) countEl.textContent = String(comments.length);

    if (formEl) {
      formEl.style.display = page.allowComments === false ? 'none' : '';
    }

    if (comments.length === 0) {
      listEl.innerHTML = `
        <div class="p-4 rounded-2xl bg-black/30 border border-white/5 text-center text-xs text-zinc-400">
          Nenhuma mensagem de apoio ainda. Seja a primeira pessoa a deixar uma palavra de carinho!
        </div>
      `;
      return;
    }

    listEl.innerHTML = comments
      .map((c) => {
        const isAuthorBadge = c.isAuthorReply
          ? '<span class="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold">Autor(a) da Página</span>'
          : '';
        const canDelete = c.isMine || page.isMine;
        const dateStr = c.createdAt
          ? new Date(c.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
          : '';
        return `
          <div class="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-start justify-between gap-3">
            <div class="space-y-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs font-bold ${c.isAuthorReply ? 'text-amber-300' : 'text-zinc-200'}">${escapeHtml(c.anonymousAlias || 'Ouvinte Anônimo')}</span>
                ${isAuthorBadge}
                <span class="text-[10px] text-zinc-500">${escapeHtml(dateStr)}</span>
              </div>
              <p class="text-xs text-zinc-300 leading-relaxed whitespace-pre-line font-diary-clean">${escapeHtml(c.content || c.text || '')}</p>
            </div>
            ${
              canDelete
                ? `<button type="button" onclick="window.TFLDiary.deleteComment(${c.id}, ${page.id})"
                    class="text-zinc-500 hover:text-rose-400 text-xs p-1 shrink-0" title="Excluir">
                    <i class="fa-solid fa-trash"></i>
                   </button>`
                : ''
            }
          </div>
        `;
      })
      .join('');
  }

  function openReaderModal(pageId, scrollToComments = false) {
    hydrateInitialData();
    const page = findPageById(pageId);
    if (!page) {
      toast('Página não encontrada.', 'error');
      return;
    }

    const modal = document.getElementById('modalDiaryReader');
    const moodIcon = document.getElementById('diaryReaderMoodIcon');
    const aliasEl = document.getElementById('diaryReaderAlias');
    const privBadge = document.getElementById('diaryReaderPrivacyBadge');
    const metaEl = document.getElementById('diaryReaderMeta');
    const titleEl = document.getElementById('diaryReaderTitle');
    const contentEl = document.getElementById('diaryReaderContent');
    const stickersBar = document.getElementById('diaryReaderStickersBar');

    const moodInfo = page.moodInfo || { emoji: '🌧️', label: 'Desabafo' };
    const catInfo = page.categoryInfo || { label: page.category || 'Desabafo' };

    if (moodIcon) moodIcon.textContent = moodInfo.emoji || '🌧️';
    if (aliasEl) aliasEl.textContent = page.isPublicAnonymous ? page.anonymousAlias : '🔒 Meu Caderno Privado';
    if (privBadge) {
      privBadge.textContent = page.isPublicAnonymous ? '🎭 Anônimo' : '🔒 Privado (Só Você)';
    }
    if (metaEl) {
      metaEl.textContent = `${moodInfo.emoji} ${moodInfo.label} • ${catInfo.label} • ~${page.estimatedReadMinutes || 1} min`;
    }
    if (titleEl) titleEl.textContent = page.title || '';
    if (contentEl) contentEl.textContent = page.content || '';

    // Renderiza selos/adesivos no leitor
    if (stickersBar) {
      const stickers = Array.isArray(page.stickers) ? page.stickers : [];
      if (stickers.length > 0) {
        const stickersMap = {
          paz: { emoji: '✨', label: 'Paz Interior' },
          cafe: { emoji: '☕', label: 'Café & Pensamento' },
          chuva: { emoji: '🌧️', label: 'Dia Chuvoso' },
          respira: { emoji: '🌿', label: 'Respira Fundo' },
          delicadeza: { emoji: '🌸', label: 'Delicadeza' },
          madrugada: { emoji: '🌙', label: 'Madrugada' },
          abraco: { emoji: '🫂', label: 'Acolhimento' },
          coragem: { emoji: '🔥', label: 'Superação' },
          musica: { emoji: '🎧', label: 'Na Minha Vibe' },
          desabafo: { emoji: '💭', label: 'Desabafo' },
          recomeco: { emoji: '🍃', label: 'Recomeço' },
          companhia: { emoji: '🐾', label: 'Companhia' },
        };
        stickersBar.innerHTML = stickers
          .map((stk, sIdx) => {
            const sItem = stickersMap[stk] || { emoji: '🏷️', label: stk };
            const tilt = sIdx % 2 === 0 ? 'tilt-left' : 'tilt-right';
            return `<span class="diary-sticker-badge ${tilt} bg-amber-950/60 text-amber-200"><span>${sItem.emoji}</span> <span>${escapeHtml(sItem.label)}</span></span>`;
          })
          .join('');
      } else {
        stickersBar.innerHTML = '';
      }
    }

    renderReaderReactions(page);
    renderReaderComments(page);
    applyCustomizations();

    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    if (page.isPublicAnonymous) {
      startReadingTimer(page);
    } else {
      stopReadingTimer();
      const box = document.getElementById('diaryReaderTimerBox');
      if (box) {
        const label = document.getElementById('diaryReaderTimerLabel');
        const counter = document.getElementById('diaryReaderTimerCounter');
        const progress = document.getElementById('diaryReaderTimerProgress');
        if (label) label.innerHTML = '<i class="fa-solid fa-lock text-amber-400"></i> <span>Esta página é confidencial no seu Caderno Privado.</span>';
        if (counter) counter.textContent = 'Privado';
        if (progress) progress.style.width = '100%';
      }
    }

    if (scrollToComments) {
      setTimeout(() => {
        const commSec = document.getElementById('diaryReaderCommentsSection');
        if (commSec) commSec.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  }

  async function closeReaderModal() {
    if (state.reader.unsentSeconds > 0 && !state.reader.isMine) {
      await sendReadingHeartbeat();
    }
    stopReadingTimer();
    state.reader.activePageId = null;

    const modal = document.getElementById('modalDiaryReader');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
    await refreshOverview();
  }

  async function submitComment(event) {
    if (event) event.preventDefault();
    const pageId = state.reader.activePageId;
    const input = document.getElementById('diaryCommentInput');
    const btn = document.getElementById('btnDiaryCommentSubmit');
    if (!pageId || !input) return;

    const content = String(input.value || '').trim();
    if (!content) return;

    if (btn) btn.disabled = true;
    try {
      const res = await fetch(`/profile/diary/page/${pageId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ content }),
      });
      const json = await res.json();
      if (!json.success) {
        toast(json.error || 'Erro ao enviar apoio.', 'error');
        return;
      }

      input.value = '';
      toast(json.message || 'Mensagem de apoio enviada com carinho!', 'success');

      const page = findPageById(pageId);
      if (page && json.comment) {
        if (!Array.isArray(page.comments)) page.comments = [];
        page.comments.push(json.comment);
        page.commentsCount = page.comments.length;
        renderReaderComments(page);
      }
    } catch (err) {
      toast('Falha ao enviar comentário.', 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async function deleteComment(commentId, pageId) {
    try {
      const res = await fetch(`/profile/diary/comment/${commentId}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      });
      const json = await res.json();
      if (!json.success) {
        toast(json.error || 'Erro ao excluir apoio.', 'error');
        return;
      }

      toast('Mensagem removida.', 'info');
      const page = findPageById(pageId);
      if (page && Array.isArray(page.comments)) {
        page.comments = page.comments.filter((c) => Number(c.id) !== Number(commentId));
        page.commentsCount = page.comments.length;
        renderReaderComments(page);
      }
    } catch (err) {
      toast('Erro ao remover mensagem.', 'error');
    }
  }

  document.addEventListener('DOMContentLoaded', hydrateInitialData);

  window.TFLDiary = {
    switchSubtab,
    setFilterCategory,
    applyFeedFilters,
    filterMyPages,
    refreshOverview,
    openEditorModal,
    openEditorModalById,
    closeEditorModal,
    updateEditorWordCount,
    submitPageForm,
    togglePageVisibility,
    deletePage,
    reactToPage,
    openReaderModal,
    closeReaderModal,
    submitComment,
    deleteComment,
    toggleCustomizerPanel,
    setPaperTheme,
    setFontFamily,
    toggleEditorSticker,
    selectEditorMood,
    selectEditorCategory,
  };
})();
