/**
 * ============================================================================
 * TFL DIARY MODULE — Diário Secreto & Cantinho de Desabafo Anônimo
 * ============================================================================
 * Gerencia:
 * - Diário Pessoal Privado (criação, edição, exclusão e chaveamento Privado <-> Público Anônimo)
 * - Mural Público 100% Anônimo (filtros por categoria, humor e ordenação)
 * - Reações empáticas anônimas (🫂 Abraço, ❤️ Acolher, 🤝 Te entendo, 🌟 Força, 🕯️ Paz)
 * - Comentários de apoio anônimos
 * - Leitor Imersivo com Cronômetro de Leitura Premiada (Coins para Leitor e Autor)
 */
(function () {
  const state = {
    currentSubtab: 'public',
    filterCategory: 'ALL',
    filterMood: 'ALL',
    filterSort: 'recent',
    myFilter: 'ALL',
    data: {
      moods: [],
      categories: [],
      reactions: [],
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
    if (!el) return;
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

  function findPageById(pageId) {
    const id = Number(pageId);
    return (
      (state.data.publicFeed || []).find((p) => Number(p.id) === id) ||
      (state.data.myPages || []).find((p) => Number(p.id) === id) ||
      null
    );
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
        btnMine.className = 'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 bg-violet-600 text-white shadow-md shadow-violet-600/20';
        btnPub.className = 'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 bg-zinc-900/90 text-zinc-400 hover:text-white border border-zinc-800';
      } else {
        btnPub.className = 'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 bg-violet-600 text-white shadow-md shadow-violet-600/20';
        btnMine.className = 'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 bg-zinc-900/90 text-zinc-400 hover:text-white border border-zinc-800';
      }
    }
  }

  // ==================== FILTROS DO MURAL PÚBLICO ANÔNIMO ====================
  function setFilterCategory(category) {
    state.filterCategory = category || 'ALL';
    const pills = document.querySelectorAll('#diaryCategoryFilterBar .diary-cat-pill');
    pills.forEach((btn) => {
      const isAct = btn.getAttribute('data-category') === state.filterCategory;
      if (isAct) {
        btn.className = 'diary-cat-pill px-3 py-1.5 rounded-xl text-xs font-bold bg-violet-600 text-white shrink-0 transition flex items-center gap-1.5';
      } else {
        btn.className = 'diary-cat-pill px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 shrink-0 transition flex items-center gap-1.5';
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

    // Reordenação no DOM
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
        ? 'diary-myfilter-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-violet-600 text-white transition'
        : 'diary-myfilter-btn px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 text-zinc-300 border border-zinc-800 hover:bg-zinc-800 transition';
    });

    const cards = document.querySelectorAll('#diaryMyPagesList .diary-mine-card');
    cards.forEach((card) => {
      const vis = card.getAttribute('data-visibility');
      const show = state.myFilter === 'ALL' || vis === state.myFilter;
      card.style.display = show ? '' : 'none';
    });
  }

  // ==================== ATUALIZAR PARTIAL DO DIÁRIO ====================
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
    infoEl.textContent = `${words} palavra(s) • ~${estMin} min de leitura`;
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
      titleModal.textContent = preset.id ? 'Editar Página do Diário' : 'Escrever Nova Página no Diário';
    }
    if (titleInput) titleInput.value = preset.title || '';
    if (moodInput) moodInput.value = preset.moodKey || 'desabafo';
    if (catInput) catInput.value = preset.category || 'Desabafo';
    if (contentInput) contentInput.value = preset.content || '';
    if (allowComm) allowComm.checked = preset.allowComments !== false;

    const isPub = Boolean(preset.isPublicAnonymous);
    if (visPublic && visPrivate) {
      visPublic.checked = isPub;
      visPrivate.checked = !isPub;
    }

    updateEditorWordCount();
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
    const btn = document.getElementById('btnDiarySaveSubmit');

    const payload = {
      pageId: idInput?.value || null,
      title: titleInput?.value || '',
      moodKey: moodInput?.value || 'desabafo',
      category: catInput?.value || 'Desabafo',
      content: contentInput?.value || '',
      isPublicAnonymous: Boolean(visPublic?.checked),
      allowComments: Boolean(allowComm?.checked),
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
      toast('Falha de conexão ao salvar página do diário.', 'error');
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
      toast('Erro ao alterar visibilidade da página.', 'error');
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
      toast(json.message || 'Página removida do seu diário.', 'info');
      await refreshOverview();
    } catch (err) {
      toast('Erro ao excluir página do diário.', 'error');
    }
  }

  // ==================== REAÇÕES EMPÁTICAS ANÔNIMAS ====================
  async function reactToPage(pageId, reactionType) {
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

      // Atualiza estado em memória
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
      toast('Erro ao registrar reação anônima.', 'error');
    }
  }

  // ==================== LEITOR IMERSIVO & CRONÔMETRO DE LEITURA PREMIADA ====================
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
    const readerReward = Number(state.data.rewardRules?.readerRewardPerPageCoins || 0.25).toFixed(2);
    const authorReward = Number(state.data.rewardRules?.authorRewardPerReadCoins || 0.5).toFixed(2);

    if (state.reader.isMine) {
      box.className = 'p-3 rounded-2xl bg-violet-950/40 border border-violet-500/30 flex flex-col gap-1.5';
      label.innerHTML = `<i class="fa-solid fa-mask text-violet-400"></i> <span>Esta página é sua! Quando outros leitores leem por ${minSec}s, você ganha +${authorReward} Coins automaticamente.</span>`;
      counter.textContent = 'Autor(a)';
      progress.style.width = '100%';
      return;
    }

    if (state.reader.rewarded) {
      box.className = 'p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col gap-1.5';
      label.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-400"></i> <span class="text-emerald-300">Leitura Premiada Concluída! Você acolheu este desabafo e apoiou o autor anônimo.</span>`;
      counter.textContent = `${Math.max(state.reader.secondsRead, minSec)}s / ${minSec}s ✅`;
      progress.style.width = '100%';
      return;
    }

    const pct = Math.min(100, Math.round((state.reader.secondsRead / minSec) * 100));
    box.className = 'p-3 rounded-2xl bg-zinc-950/90 border border-amber-500/30 flex flex-col gap-1.5';
    label.innerHTML = `<i class="fa-solid fa-hourglass-half text-amber-400 animate-pulse"></i> <span>Lendo com atenção... Ganhe <strong>+${readerReward} Coins</strong> e envie <strong>+${authorReward} Coins</strong> ao autor anônimo!</span>`;
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
          toast(json.message, 'success');
          if (window.TFL && typeof window.TFL.refreshPartial === 'function') {
            window.TFL.refreshPartial(['header-profile']);
          }
        } else if (json.rewarded && json.message && state.reader.secondsRead <= Number(state.data.rewardRules?.minReadSeconds || 30) + 5) {
          toast(json.message, 'info');
        }
      }
    } catch (_) {
      // Silencioso para não interromper leitura
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

      // Dispara imediatamente ao atingir a meta mínima de leitura ou a cada 10s
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
                ? 'bg-violet-600/35 border-violet-400 text-white shadow-sm'
                : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
            }">
            <span>${r.emoji}</span>
            <span>${escapeHtml(r.label)}</span>
            <span class="px-1.5 py-0.5 rounded-lg bg-black/40 text-[10px] ${count > 0 ? 'text-violet-300' : 'text-zinc-500'}">${count}</span>
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
        <div class="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/70 text-center text-xs text-zinc-400">
          Nenhuma mensagem de apoio ainda. Seja o primeiro a deixar uma palavra acolhedora de forma 100% anônima!
        </div>
      `;
      return;
    }

    listEl.innerHTML = comments
      .map((c) => {
        const isAuthorBadge = c.isAuthorReply
          ? '<span class="px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/40 text-violet-300 text-[10px] font-bold">Autor(a) da Página</span>'
          : '';
        const canDelete = c.isMine || page.isMine;
        const dateStr = c.createdAt
          ? new Date(c.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
          : '';
        return `
          <div class="p-3.5 rounded-2xl bg-zinc-900/75 border border-zinc-800/80 flex items-start justify-between gap-3">
            <div class="space-y-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs font-bold ${c.isAuthorReply ? 'text-violet-300' : 'text-zinc-200'}">${escapeHtml(c.anonymousAlias || 'Ouvinte Anônimo')}</span>
                ${isAuthorBadge}
                <span class="text-[10px] text-zinc-500">${escapeHtml(dateStr)}</span>
              </div>
              <p class="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">${escapeHtml(c.content)}</p>
            </div>
            ${
              canDelete
                ? `<button type="button" onclick="window.TFLDiary.deleteComment(${c.id}, ${page.id})"
                    class="text-zinc-500 hover:text-rose-400 text-xs p-1 shrink-0" title="Excluir comentário">
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

    const moodInfo = page.moodInfo || { emoji: '🌧️', label: 'Desabafo' };
    const catInfo = page.categoryInfo || { label: page.category || 'Desabafo' };

    if (moodIcon) moodIcon.textContent = moodInfo.emoji || '🌧️';
    if (aliasEl) aliasEl.textContent = page.isPublicAnonymous ? page.anonymousAlias : '🔒 Meu Diário Privado';
    if (privBadge) {
      privBadge.textContent = page.isPublicAnonymous ? '🎭 100% Anônimo' : '🔒 Privado (Só Você)';
    }
    if (metaEl) {
      metaEl.textContent = `${moodInfo.emoji} ${moodInfo.label} • ${catInfo.label} • ~${page.estimatedReadMinutes || 1} min de leitura`;
    }
    if (titleEl) titleEl.textContent = page.title || '';
    if (contentEl) contentEl.textContent = page.content || '';

    renderReaderReactions(page);
    renderReaderComments(page);

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
        box.className = 'p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col gap-1';
        const label = document.getElementById('diaryReaderTimerLabel');
        const counter = document.getElementById('diaryReaderTimerCounter');
        const progress = document.getElementById('diaryReaderTimerProgress');
        if (label) label.innerHTML = '<i class="fa-solid fa-lock text-amber-400"></i> <span>Esta página é 100% privada no seu Diário Secreto.</span>';
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
        toast(json.error || 'Erro ao enviar comentário anônimo.', 'error');
        return;
      }

      input.value = '';
      toast(json.message || 'Comentário anônimo enviado!', 'success');

      const page = findPageById(pageId);
      if (page && json.comment) {
        if (!Array.isArray(page.comments)) page.comments = [];
        page.comments.push(json.comment);
        page.commentsCount = page.comments.length;
        renderReaderComments(page);
      }
    } catch (err) {
      toast('Falha ao enviar comentário anônimo.', 'error');
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
        toast(json.error || 'Erro ao excluir comentário.', 'error');
        return;
      }

      toast('Comentário removido.', 'info');
      const page = findPageById(pageId);
      if (page && Array.isArray(page.comments)) {
        page.comments = page.comments.filter((c) => Number(c.id) !== Number(commentId));
        page.commentsCount = page.comments.length;
        renderReaderComments(page);
      }
    } catch (err) {
      toast('Erro ao remover comentário.', 'error');
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
  };
})();
