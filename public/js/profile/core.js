/**
 * ============================================================================
 * TFL PROFILE — CORE MODULE (Config, Helpers Globais, Navegação, Modais e Privacidade)
 * ============================================================================
 */
(function (window, $) {
    'use strict';

    const TFL = window.TFL = window.TFL || {};
    TFL.config = window.TFL_CONFIG || {};

    TFL.getActiveAvatarId = function () {
        return Number($('#selectActiveAvatar').val() || TFL.config.activeAvatarId || 0);
    };

    TFL.REACTION_META = {
        like:  { emoji: '👍', label: 'Curtir', color: 'text-sky-400' },
        love:  { emoji: '❤️', label: 'Amei',   color: 'text-rose-400' },
        care:  { emoji: '🥰', label: 'Força',  color: 'text-amber-400' },
        haha:  { emoji: '😂', label: 'Haha',   color: 'text-yellow-400' },
        wow:   { emoji: '😮', label: 'Uau',    color: 'text-purple-400' },
        sad:   { emoji: '😢', label: 'Triste', color: 'text-blue-300' },
        angry: { emoji: '😡', label: 'Grr',    color: 'text-orange-500' }
    };

    TFL.escapeHtml = function (str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    };

    TFL.getAvatarThumb = function (av) {
        if (av && av.thumbnail) return av.thumbnail;
        const name = (av && av.name) ? av.name : 'Avatar';
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0284c7&color=fff`;
    };

    TFL.buildReactionsSummaryPills = function (summary) {
        if (!summary || typeof summary !== 'object') return '';
        const pills = [];
        Object.keys(TFL.REACTION_META).forEach(key => {
            const count = Number(summary[key] || 0);
            if (count > 0) {
                pills.push(`<span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-slate-950 border border-white/10 text-[10px] text-zinc-300" title="${TFL.REACTION_META[key].label}">${TFL.REACTION_META[key].emoji} ${count}</span>`);
            }
        });
        return pills.join(' ');
    };

    /**
     * Constrói o widget universal de Curtida + Seletor de Reações (post, photo, comment, profile, room, reel)
     */
    TFL.buildReactionBarHtml = function (targetType, targetId, likedByMe, myReaction, likesCount, reactionsSummary, compact) {
        const activeKey = (likedByMe && myReaction && TFL.REACTION_META[myReaction]) ? myReaction : null;
        const meta = activeKey ? TFL.REACTION_META[activeKey] : { emoji: '🤍', label: 'Curtir', color: 'text-zinc-400 hover:text-rose-400' };

        let pickerButtons = '';
        Object.keys(TFL.REACTION_META).forEach(rKey => {
            const r = TFL.REACTION_META[rKey];
            pickerButtons += `
                <button type="button" class="btn-universal-react hover:scale-125 transition px-1 text-sm"
                        data-targettype="${targetType}" data-targetid="${targetId}" data-reaction="${rKey}" data-force="true"
                        title="${r.label}">
                    ${r.emoji}
                </button>
            `;
        });

        const summaryPills = !compact ? TFL.buildReactionsSummaryPills(reactionsSummary) : '';

        return `
            <div class="reaction-widget inline-flex items-center gap-1.5 relative group" data-widget="${targetType}_${targetId}">
                <button type="button" class="btn-universal-react inline-flex items-center gap-1 font-bold transition ${activeKey ? meta.color : 'text-zinc-400 hover:text-rose-400'} ${compact ? 'text-[11px]' : 'text-xs'}"
                        data-targettype="${targetType}" data-targetid="${targetId}" data-reaction="${activeKey || 'like'}" data-force="false">
                    <span class="react-emoji">${meta.emoji}</span>
                    <span class="react-label">${meta.label}</span>
                    <span class="react-count px-1.5 py-0.5 rounded-full bg-slate-950 border border-white/10 text-[10px] text-zinc-300">${likesCount || 0}</span>
                </button>

                <!-- Menu suspenso de Mais Ações / Reações -->
                <div class="hidden group-hover:flex items-center gap-0.5 absolute bottom-full left-0 mb-1 px-2 py-1 rounded-2xl bg-slate-950/95 border border-white/15 shadow-2xl z-30 backdrop-blur-md">
                    ${pickerButtons}
                </div>

                <div class="react-summary-pills flex items-center gap-1">${summaryPills}</div>
            </div>
        `;
    };

    TFL.buildMatchButtonHtml = function (targetAvatarId, matchStatus, extraClass) {
        let label = 'Dar Match';
        let icon = 'fa-fire-flame-curved';
        let style = 'bg-pink-600/20 hover:bg-pink-600 border-pink-500/40 text-pink-300 hover:text-white';

        if (matchStatus === 'matched') {
            label = 'Deu Match! 💘';
            style = 'bg-gradient-to-r from-pink-600 to-rose-600 border-pink-400 text-white shadow-lg shadow-pink-600/30';
        } else if (matchStatus === 'crush_sent') {
            label = 'Crush Enviado 💘';
            style = 'bg-pink-500/25 border-pink-500/50 text-pink-300';
        } else if (matchStatus === 'crush_received') {
            label = 'Te deu Crush! Dar Match 💘';
            style = 'bg-amber-500/20 hover:bg-pink-600 border-amber-400/50 text-amber-300 hover:text-white animate-pulse';
        }

        return `
            <button type="button" class="btn-toggle-match px-3.5 py-2 rounded-xl border text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 ${style} ${extraClass || ''}"
                    data-targetid="${targetAvatarId}">
                <i class="fa-solid ${icon}"></i>
                <span>${label}</span>
            </button>
        `;
    };

    TFL.buildUserMiniListItemHtml = function (av, isMatch) {
        const lastSeen = av.lastSeenLabel || (isMatch ? '💘 Match' : (av.online ? 'Online agora' : 'Visto recentemente'));
        return `
            <div class="p-3 rounded-2xl bg-slate-900/80 border ${isMatch ? 'border-pink-500/30' : 'border-white/10'} flex items-center justify-between gap-2.5 hover:border-blue-500/30 transition">
                <button type="button" class="btn-open-mini-profile flex items-center gap-2.5 overflow-hidden text-left group flex-1"
                        data-avatarid="${av.id}">
                    <div class="relative flex-shrink-0">
                        <img src="${TFL.getAvatarThumb(av)}" class="w-10 h-10 rounded-xl object-cover">
                        <span class="w-2.5 h-2.5 rounded-full ${av.online ? 'bg-emerald-400' : 'bg-zinc-500'} ring-2 ring-slate-950 absolute -bottom-0.5 -right-0.5"></span>
                    </div>
                    <div class="overflow-hidden">
                        <div class="text-xs font-bold text-white group-hover:text-sky-400 transition truncate">${TFL.escapeHtml(av.name)}</div>
                        <div class="text-[10px] text-zinc-400 flex items-center gap-1">${lastSeen}</div>
                    </div>
                </button>
                <div class="flex items-center gap-1.5 flex-shrink-0">
                    ${isMatch ? `
                        <button type="button" class="btn-open-dm px-2.5 py-1.5 rounded-xl bg-pink-600/20 hover:bg-pink-600 text-pink-300 hover:text-white text-xs font-bold transition flex items-center gap-1"
                                data-profileid="${av.id}" data-name="${TFL.escapeHtml(av.name)}" title="Conversar no Chat">
                            <i class="fa-solid fa-comment-dots"></i>
                            <span class="text-[10px]">Chat</span>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    };

    TFL.buildRecursiveCommentHtml = function (c, depth) {
        const level = Number(depth || 0);
        const activeId = TFL.getActiveAvatarId();
        const cAuthor = c.profile || { id: c.profileId, name: c.name || 'Viajante' };
        const isMyComment = Number(c.profileId) === activeId;
        const timeStr = c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

        const replies = Array.isArray(c.replies) ? c.replies : [];
        let repliesHtml = '';
        replies.forEach(rep => {
            repliesHtml += TFL.buildRecursiveCommentHtml(rep, level + 1);
        });

        const indentClass = level > 0 ? 'ml-4 sm:ml-6 pl-3 border-l-2 border-blue-500/20 mt-2' : '';

        return `
            <div class="comment-tree-node ${indentClass}" id="commentNode_${c.id}" data-commentid="${c.id}">
                <div class="flex items-start gap-2.5 p-2.5 rounded-2xl bg-slate-950/85 border border-white/5">
                    <button type="button" class="btn-open-mini-profile flex-shrink-0" data-avatarid="${cAuthor.id}">
                        <img src="${TFL.getAvatarThumb(cAuthor)}" class="w-7 h-7 rounded-lg object-cover border border-white/10">
                    </button>
                    <div class="flex-1 overflow-hidden">
                        <div class="flex items-center justify-between gap-2">
                            <div class="flex items-center gap-2">
                                <button type="button" class="btn-open-mini-profile text-[11px] font-bold text-white hover:text-sky-400 transition" data-avatarid="${cAuthor.id}">
                                    ${TFL.escapeHtml(cAuthor.name)}
                                </button>
                                <span class="text-[9px] text-zinc-500">${timeStr}</span>
                            </div>
                            ${isMyComment ? `
                                <button type="button" class="btn-delete-comment text-[10px] text-zinc-600 hover:text-red-400 transition" data-commentid="${c.id}" title="Excluir comentário">
                                    <i class="fa-solid fa-trash-can"></i>
                                </button>
                            ` : ''}
                        </div>
                        <p class="text-xs text-zinc-300 break-words mt-0.5">${TFL.escapeHtml(c.text)}</p>

                        <!-- Ações do Comentário: Curtir/Reagir + Responder Recursivamente -->
                        <div class="flex flex-wrap items-center gap-3 mt-1.5 pt-1 border-t border-white/5 text-[11px]">
                            ${TFL.buildReactionBarHtml('comment', c.id, c.likedByMe, c.myReaction, c.likesCount || 0, c.reactionsSummary, true)}
                            <button type="button" class="btn-toggle-reply-box text-zinc-400 hover:text-sky-400 font-bold flex items-center gap-1 transition"
                                    data-commentid="${c.id}" data-author="${TFL.escapeHtml(cAuthor.name)}">
                                <i class="fa-solid fa-reply text-[10px]"></i>
                                <span>Responder</span>
                            </button>
                        </div>

                        <!-- Caixa de Resposta Recursiva para este Comentário -->
                        <form class="form-reply-comment hidden mt-2 flex items-center gap-1.5"
                              id="replyForm_${c.id}"
                              data-commentid="${c.id}"
                              data-postid="${c.postId || ''}"
                              data-photoid="${c.photoId || ''}"
                              data-reelid="${c.reelId || ''}">
                            <input type="text" class="input-reply-text flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
                                   placeholder="Responder a ${TFL.escapeHtml(cAuthor.name)}...">
                            <button type="submit" class="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold transition">
                                Enviar
                            </button>
                        </form>
                    </div>
                </div>

                <!-- Filhos Recursivos (Respostas ao Comentário) -->
                <div id="commentRepliesContainer_${c.id}" class="space-y-1.5">
                    ${repliesHtml}
                </div>
            </div>
        `;
    };

    /**
     * Atualização dinâmica de qualquer Partial EJS via AJAX sem recarregar toda a página
     * Exemplo: TFL.refreshPartial('view-friends') ou TFL.refreshPartial(['view-diary', 'sidebar'])
     */
    TFL.refreshPartial = function (partialName, callback) {
        const selectorMap = {
            'sidebar': '#appSidebar',
            'header-profile': '#appSidebar',
            'view-social': '#view-social',
            'view-user-profile': '#view-user-profile',
            'view-avatar': '#view-avatar',
            'view-shop': '#view-shop',
            'view-salas': '#view-salas',
            'view-account': '#view-profile',
            'view-market': '#view-market',
            'view-vip': '#view-vip',
            'view-cassino': '#view-cassino',
            'view-diary': '#view-diary',
            'view-ads': '#view-ads',
            'view-friends': '#view-friends',
            'view-chat': '#view-chat'
        };

        if (Array.isArray(partialName)) {
            const uniqueNames = Array.from(new Set(partialName.map(n => n === 'header-profile' ? 'sidebar' : n)));
            return Promise.all(uniqueNames.map(name => TFL.refreshPartial(name)));
        }

        const resolvedName = partialName === 'header-profile' ? 'sidebar' : partialName;
        const targetSelector = selectorMap[resolvedName];
        if (!targetSelector) return Promise.resolve(null);

        const wasHidden = $(targetSelector).hasClass('hidden');

        return new Promise((resolve) => {
            $.get(`/profile/partial/${resolvedName}`, function (html) {
                if (!html) {
                    resolve(null);
                    return;
                }
                const $newEl = $(html);
                if (!wasHidden) {
                    $newEl.removeClass('hidden');
                }
                $(targetSelector).replaceWith($newEl);
                if (typeof callback === 'function') callback($newEl);
                resolve($newEl);
            }).fail(function () {
                resolve(null);
            });
        });
    };

    $(document).ready(function () {
        // 1. Toggle Sidebar (Avança e Recolhe)
        let isSidebarCollapsed = false;
        $(document).on('click', '#btnToggleSidebar', function () {
            isSidebarCollapsed = !isSidebarCollapsed;
            if (isSidebarCollapsed) {
                $('#appSidebar').removeClass('w-64').addClass('w-20');
                $('.sidebar-text').addClass('hidden');
            } else {
                $('#appSidebar').removeClass('w-20').addClass('w-64');
                $('.sidebar-text').removeClass('hidden');
            }
        });

        // Helper universal de paginação de 20 itens por página para containers DOM
        TFL.applyPagination20 = function (containerSelector, itemSelector, pageSize = 20) {
            const $container = $(containerSelector);
            if ($container.length === 0) return;
            const $items = itemSelector ? $container.find(itemSelector) : $container.children();
            const total = $items.length;
            const pagerId = 'tflPager20_' + String(containerSelector).replace(/[^a-zA-Z0-9]/g, '_');
            $('#' + pagerId).remove();

            if (total <= pageSize) {
                $items.removeClass('hidden-by-pager20').show();
                return;
            }

            let currentPage = 1;
            const totalPages = Math.ceil(total / pageSize);

            function renderPage(p) {
                currentPage = Math.max(1, Math.min(totalPages, p));
                const start = (currentPage - 1) * pageSize;
                const end = start + pageSize;
                $items.each(function (idx) {
                    if (idx >= start && idx < end) {
                        $(this).removeClass('hidden-by-pager20').show();
                    } else {
                        $(this).addClass('hidden-by-pager20').hide();
                    }
                });
                $(`#${pagerId} .lbl-pager20`).text(`Página ${currentPage} de ${totalPages} (${total} itens • ${pageSize}/pág)`);
                $(`#${pagerId} .btn-prev-pager20`).prop('disabled', currentPage <= 1);
                $(`#${pagerId} .btn-next-pager20`).prop('disabled', currentPage >= totalPages);
            }

            const pagerHtml = `
                <div id="${pagerId}" class="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <span class="lbl-pager20 text-zinc-400 font-bold">Página 1 de ${totalPages}</span>
                    <div class="flex items-center gap-2">
                        <button type="button" class="btn-prev-pager20 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-zinc-200 font-bold disabled:opacity-40">← Anterior</button>
                        <button type="button" class="btn-next-pager20 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-zinc-200 font-bold disabled:opacity-40">Próxima →</button>
                    </div>
                </div>
            `;
            $container.after(pagerHtml);
            $(document).off('click', `#${pagerId} .btn-prev-pager20`).on('click', `#${pagerId} .btn-prev-pager20`, function () {
                renderPage(currentPage - 1);
            });
            $(document).off('click', `#${pagerId} .btn-next-pager20`).on('click', `#${pagerId} .btn-next-pager20`, function () {
                renderPage(currentPage + 1);
            });
            renderPage(1);
        };

        // 2. Navegação entre Views & Sub-rotas por Ramo (/profile/:branch)
        const VIEW_TO_BRANCH = {
            'view-social': 'social',
            'view-avatar': 'avatar',
            'view-salas': 'salas',
            'view-shop': 'shop',
            'view-profile': 'account',
            'view-market': 'market',
            'view-vip': 'vip',
            'view-cassino': 'cassino',
            'view-diary': 'diary',
            'view-friends': 'friends',
            'view-ads': 'ads'
        };

        const BRANCH_TO_VIEW = {
            'social': 'view-social',
            'avatar': 'view-avatar',
            'salas': 'view-salas',
            'shop': 'view-shop',
            'account': 'view-profile',
            'market': 'view-market',
            'vip': 'view-vip',
            'cassino': 'view-cassino',
            'diary': 'view-diary',
            'friends': 'view-friends',
            'ads': 'view-ads'
        };

        function activateBranchView(branchOrView, updateHistory = true) {
            let targetView = branchOrView;
            let branch = VIEW_TO_BRANCH[branchOrView] || branchOrView;
            if (BRANCH_TO_VIEW[branchOrView]) {
                targetView = BRANCH_TO_VIEW[branchOrView];
                branch = branchOrView;
            }

            const $targetNav = $(`.nav-item[data-view="${targetView}"]`);
            if ($targetNav.length) {
                $('.nav-item').removeClass('bg-blue-600 text-white shadow-lg shadow-blue-600/30')
                              .addClass('text-zinc-400 hover:text-white hover:bg-slate-800/60');
                $targetNav.addClass('bg-blue-600 text-white shadow-lg shadow-blue-600/30')
                          .removeClass('text-zinc-400 hover:text-white hover:bg-slate-800/60');
            }

            $('.view-panel, .view-section').addClass('hidden');
            $('#' + targetView).removeClass('hidden');

            if (targetView === 'view-social') {
                if (typeof TFL.carregarFeed === 'function') TFL.carregarFeed();
                if (typeof TFL.carregarMiniReels === 'function') TFL.carregarMiniReels();
            } else if (targetView === 'view-shop') {
                if (typeof window.showSubPage === 'function') window.showSubPage('ShopPage');
                if (typeof TFL.loadShopAppData === 'function') TFL.loadShopAppData();
            } else if (targetView === 'view-ads') {
                if (window.TFLAds && typeof window.TFLAds.loadCampaigns === 'function') {
                    window.TFLAds.loadCampaigns();
                }
            }

            if (updateHistory && window.history && window.history.pushState) {
                const targetUrl = '/profile/' + branch;
                if (window.location.pathname !== targetUrl) {
                    window.history.pushState({ branch, targetView }, '', targetUrl);
                }
            }

            // Envia telemetria da sub-rota
            $.post('/profile/telemetry/branch-view', { branch: branch }).fail(function () {});
        }

        TFL.activateBranchView = activateBranchView;

        $(document).on('click', '#navBtnChat', function (e) {
            e.preventDefault();
            if (typeof TFL.toggleFloatingChatWindow === 'function') {
                TFL.toggleFloatingChatWindow('chats');
            }
        });

        $(document).on('click', '.nav-item', function () {
            const targetView = $(this).data('view');
            if (!targetView) return;

            if (targetView === 'view-chat') {
                if (typeof TFL.toggleFloatingChatWindow === 'function') {
                    TFL.toggleFloatingChatWindow('chats');
                }
                return;
            }

            activateBranchView(targetView, true);
        });

        window.addEventListener('popstate', function () {
            const pathParts = window.location.pathname.split('/').filter(Boolean);
            let branch = 'social';
            if (pathParts[0] === 'profile' && pathParts[1]) {
                branch = pathParts[1];
            }
            activateBranchView(branch, false);
        });

        // 3. Fechar Modais
        $(document).on('click', '.btn-close-modal', function () {
            $(this).closest('.fixed').addClass('hidden');
        });

        // 4. Salvar Privacidade diretamente no local de cada seção (Amigos, Seguidores, Fotos, Salas, Publicações)
        $(document).on('change', '.select-section-privacy', function () {
            const sel = $(this);
            const field = sel.data('field');
            const val = sel.val();
            const activeId = TFL.getActiveAvatarId();
            if (!field || !activeId) return;

            const payload = { avatarId: activeId };
            payload[field] = val;

            // Sincroniza outros selects da mesma seção na página
            $(`.select-section-privacy[data-field="${field}"]`).val(val);

            const statusBadge = sel.siblings('.privacy-save-status, .privacy-saved-badge');
            statusBadge.text('...').removeClass('hidden');

            $.post('/profile/avatar/customize', payload, function (res) {
                if (res.success) {
                    statusBadge.text('✔').removeClass('hidden');
                    setTimeout(() => statusBadge.addClass('hidden'), 2000);
                    if (TFL.toast) TFL.toast.success('Configuração de privacidade atualizada!', 'Privacidade');
                } else {
                    statusBadge.text('!').removeClass('hidden');
                    if (TFL.toast) TFL.toast.error(res.error || 'Erro ao salvar privacidade.');
                }
            }).fail(function () {
                statusBadge.text('!').removeClass('hidden');
                if (TFL.toast) TFL.toast.error('Falha na comunicação ao salvar privacidade.');
            });
        });

        // 5. Troca de Idioma (i18n: pt-BR, en-US, es-ES)
        $(document).on('click', '.btn-switch-lang', function () {
            const lang = $(this).data('lang') || 'pt-BR';
            document.cookie = `lang=${lang}; path=/; max-age=31536000`;
            $.post('/profile/locale', { lang: lang }, function (res) {
                if (res && res.success) {
                    if (TFL.toast) TFL.toast.info(`Idioma alterado para ${lang}`, 'Idioma');
                    setTimeout(() => window.location.reload(), 250);
                } else {
                    window.location.href = `/profile/locale/${encodeURIComponent(lang)}`;
                }
            }).fail(function () {
                window.location.href = `/profile/locale/${encodeURIComponent(lang)}`;
            });
        });

        // 6. Salvar Dados Pessoais da Conta
        $(document).on('click', '#btnSaveUserData', function (e) {
            e.preventDefault();
            const $btn = $(this);
            const payload = {
                name: $('#usrName').val(),
                email: $('#usrEmail').val(),
                phone: $('#usrPhone').val()
            };
            $btn.prop('disabled', true).addClass('opacity-60');
            $.post('/profile/account/update', payload, function (res) {
                $btn.prop('disabled', false).removeClass('opacity-60');
                if (res && res.success) {
                    if (TFL.toast) TFL.toast.success(res.message || 'Dados da conta atualizados!', 'Conta');
                } else {
                    if (TFL.toast) TFL.toast.error(res?.error || 'Erro ao salvar dados.');
                }
            }).fail(function (xhr) {
                $btn.prop('disabled', false).removeClass('opacity-60');
                if (TFL.toast) TFL.toast.error(xhr.responseJSON?.error || 'Falha na comunicação.');
            });
        });

        // 7. Salvar / Alterar PIN de Segurança da Carteira (4 Dígitos)
        $(document).on('submit', '#formUserWalletPin', function (e) {
            e.preventDefault();
            const currentPin = $('#inputCurrentPin').val() || '';
            const newPin = $('#inputNewWalletPin').val() || '';
            const confirmPin = $('#inputConfirmWalletPin').val() || '';

            if (!/^\d{4}$/.test(newPin)) {
                if (TFL.toast) TFL.toast.error('O PIN deve conter exatamente 4 números.');
                return;
            }
            if (newPin !== confirmPin) {
                if (TFL.toast) TFL.toast.error('A confirmação do PIN não confere.');
                return;
            }

            const $btn = $('#btnSaveWalletPin');
            $btn.prop('disabled', true).addClass('opacity-60');
            $.post('/profile/account/pin', { currentPin, newPin, confirmPin }, function (res) {
                $btn.prop('disabled', false).removeClass('opacity-60');
                if (res && res.success) {
                    if (TFL.toast) TFL.toast.success(res.message || 'PIN configurado com sucesso!', 'PIN de Segurança');
                    $('#inputCurrentPin').val('');
                    $('#inputNewWalletPin').val('');
                    $('#inputConfirmWalletPin').val('');
                    if (typeof TFL.refreshPartial === 'function') {
                        TFL.refreshPartial('view-account');
                    }
                } else {
                    if (TFL.toast) TFL.toast.error(res?.error || 'Não foi possível configurar o PIN.');
                }
            }).fail(function (xhr) {
                $btn.prop('disabled', false).removeClass('opacity-60');
                if (TFL.toast) TFL.toast.error(xhr.responseJSON?.error || 'Erro ao processar PIN.');
            });
        });

        // 8. Inicialização do ramo ativo via URL (/profile/:branch) ou TFL.config.activeTab
        const initialBranch = (function () {
            const pathParts = window.location.pathname.split('/').filter(Boolean);
            if (pathParts[0] === 'profile' && pathParts[1] && BRANCH_TO_VIEW[pathParts[1]]) {
                return pathParts[1];
            }
            if (TFL.config && TFL.config.activeTab && BRANCH_TO_VIEW[TFL.config.activeTab]) {
                return TFL.config.activeTab;
            }
            return 'social';
        })();

        if (initialBranch && initialBranch !== 'social') {
            activateBranchView(initialBranch, false);
        }
    });

})(window, jQuery);
