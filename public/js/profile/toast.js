/**
 * ============================================================================
 * TFL PROFILE — CORNER TOAST & DIALOG PLUGIN (Substitui alert, confirm e prompt)
 * ============================================================================
 */
(function (window, $) {
    'use strict';

    const TFL = window.TFL = window.TFL || {};
    const STORAGE_KEY = 'TFL_PENDING_TOASTS_V1';
    let lastShownToast = null;

    const TOAST_THEMES = {
        success: {
            title: 'Sucesso',
            icon: 'fa-solid fa-circle-check',
            border: 'border-emerald-500/40',
            badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            bar: 'bg-emerald-500',
            titleColor: 'text-emerald-400'
        },
        error: {
            title: 'Atenção / Erro',
            icon: 'fa-solid fa-circle-exclamation',
            border: 'border-red-500/40',
            badgeBg: 'bg-red-500/20 text-red-400 border-red-500/30',
            bar: 'bg-red-500',
            titleColor: 'text-red-400'
        },
        warning: {
            title: 'Aviso',
            icon: 'fa-solid fa-triangle-exclamation',
            border: 'border-amber-500/40',
            badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
            bar: 'bg-amber-500',
            titleColor: 'text-amber-400'
        },
        info: {
            title: 'Notificação',
            icon: 'fa-solid fa-bell',
            border: 'border-sky-500/40',
            badgeBg: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
            bar: 'bg-sky-500',
            titleColor: 'text-sky-400'
        },
        match: {
            title: 'Deu Match! 💘',
            icon: 'fa-solid fa-fire-flame-curved',
            border: 'border-pink-500/60',
            badgeBg: 'bg-pink-500/25 text-pink-300 border-pink-400/40',
            bar: 'bg-gradient-to-r from-pink-500 to-rose-500',
            titleColor: 'text-pink-400'
        }
    };

    function escapeText(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function ensureContainer() {
        let $container = $('#tflToastContainer');
        if (!$container.length) {
            $container = $(`
                <div id="tflToastContainer"
                     class="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 w-[92vw] max-w-sm pointer-events-none">
                </div>
            `);
            $('body').append($container);
        }
        return $container;
    }

    function inferTypeFromMessage(message) {
        const lower = String(message || '').toLowerCase();
        if (lower.includes('match') || lower.includes('💘')) return 'match';
        if (
            lower.includes('erro') ||
            lower.includes('falha') ||
            lower.includes('insuficiente') ||
            lower.includes('inválid') ||
            lower.includes('não são permitidos') ||
            lower.includes('não são suportados')
        ) {
            return 'error';
        }
        if (
            lower.includes('informe') ||
            lower.includes('selecione') ||
            lower.includes('escolha') ||
            lower.includes('escreva') ||
            lower.includes('mínimo') ||
            lower.includes('atenção') ||
            lower.includes('aguarda aprovação')
        ) {
            return 'warning';
        }
        if (
            lower.includes('sucesso') ||
            lower.includes('concluída') ||
            lower.includes('confirmado') ||
            lower.includes('aprovado') ||
            lower.includes('publicada') ||
            lower.includes('cancelad') ||
            lower.includes('enviada') ||
            lower.includes('agora são amigos')
        ) {
            return 'success';
        }
        return 'info';
    }

    /**
     * Exibe um Toast flutuante no canto superior direito
     */
    function showToast(message, type, customTitle, durationMs) {
        if (!message) return;
        const resolvedType = TOAST_THEMES[type] ? type : inferTypeFromMessage(message);
        const theme = TOAST_THEMES[resolvedType] || TOAST_THEMES.info;
        const title = customTitle || theme.title;
        const duration = Number(durationMs) || (resolvedType === 'error' || resolvedType === 'match' ? 5000 : 4000);

        lastShownToast = {
            message: String(message),
            type: resolvedType,
            title: title,
            timestamp: Date.now()
        };

        const $container = ensureContainer();
        const toastId = 'tflToast_' + Date.now() + '_' + Math.floor(Math.random() * 10000);

        const $toast = $(`
            <div id="${toastId}"
                 class="pointer-events-auto relative overflow-hidden rounded-2xl bg-slate-900/95 backdrop-blur-xl border ${theme.border} shadow-2xl shadow-black/60 p-3.5 text-zinc-100 transform transition-all duration-300 translate-x-8 opacity-0">
                <div class="flex items-start gap-3">
                    <div class="w-9 h-9 rounded-xl border ${theme.badgeBg} flex items-center justify-center flex-shrink-0 text-sm">
                        <i class="${theme.icon}"></i>
                    </div>
                    <div class="flex-1 min-w-0 pr-2">
                        <div class="text-xs font-black uppercase tracking-wider ${theme.titleColor}">${escapeText(title)}</div>
                        <p class="text-xs text-zinc-200 leading-relaxed break-words mt-0.5">${escapeText(message)}</p>
                    </div>
                    <button type="button" class="btn-dismiss-tfl-toast text-zinc-500 hover:text-white text-xs p-1 transition flex-shrink-0" title="Fechar">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="absolute bottom-0 left-0 right-0 h-1 bg-slate-950/80">
                    <div class="tfl-toast-progress h-full ${theme.bar}" style="animation-duration: ${duration}ms;"></div>
                </div>
            </div>
        `);

        $container.append($toast);

        // Anima entrada
        requestAnimationFrame(function () {
            $toast.removeClass('translate-x-8 opacity-0').addClass('translate-x-0 opacity-100');
        });

        let timeoutId = null;
        function removeToast() {
            clearTimeout(timeoutId);
            $toast.addClass('translate-x-8 opacity-0');
            setTimeout(function () {
                $toast.remove();
            }, 250);
        }

        timeoutId = setTimeout(removeToast, duration);

        $toast.on('mouseenter', function () {
            clearTimeout(timeoutId);
            $toast.find('.tfl-toast-progress').css('animation-play-state', 'paused');
        });

        $toast.on('mouseleave', function () {
            $toast.find('.tfl-toast-progress').css('animation-play-state', 'running');
            timeoutId = setTimeout(removeToast, 2200);
        });

        $toast.find('.btn-dismiss-tfl-toast').on('click', removeToast);
    }

    /**
     * Salva um Toast na fila do sessionStorage para ser exibido no canto após location.reload()
     */
    function queueToastForReload(message, type, title) {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            const list = raw ? JSON.parse(raw) : [];
            list.push({
                message: String(message),
                type: type || inferTypeFromMessage(message),
                title: title || null
            });
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        } catch (e) {
            // Ignora falha de sessionStorage
        }
    }

    /**
     * Se um Toast acabou de ser disparado (< 600ms) e a página entrou em reload imediatamente,
     * preserva-o para que o usuário consiga lê-lo após o recarregamento.
     */
    window.addEventListener('beforeunload', function () {
        if (lastShownToast && (Date.now() - lastShownToast.timestamp) < 600) {
            queueToastForReload(lastShownToast.message, lastShownToast.type, lastShownToast.title);
            lastShownToast = null;
        }
    });

    function flushQueuedToasts() {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            sessionStorage.removeItem(STORAGE_KEY);
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
                list.forEach(function (item) {
                    showToast(item.message, item.type, item.title);
                });
            }
        } catch (e) {
            // Ignora erro
        }
    }

    // API Principal TFL.toast
    const toastApi = function (message, type, title, durationMs) {
        showToast(message, type, title, durationMs);
    };
    toastApi.success = function (message, title, durationMs) {
        showToast(message, 'success', title, durationMs);
    };
    toastApi.error = function (message, title, durationMs) {
        showToast(message, 'error', title, durationMs);
    };
    toastApi.warning = function (message, title, durationMs) {
        showToast(message, 'warning', title, durationMs);
    };
    toastApi.info = function (message, title, durationMs) {
        showToast(message, 'info', title, durationMs);
    };
    toastApi.match = function (message, title, durationMs) {
        showToast(message, 'match', title || 'Deu Match! 💘', durationMs || 5500);
    };
    toastApi.fromText = function (message) {
        showToast(message, inferTypeFromMessage(message));
    };
    toastApi.queueAfterReload = queueToastForReload;

    TFL.toast = toastApi;

    TFL.reloadWithToast = function (message, type, title) {
        lastShownToast = null;
        queueToastForReload(message, type, title);
        window.location.reload();
    };

    /**
     * Modal de Confirmação Assíncrono (Substitui window.confirm)
     * Retorna Promise<boolean>
     */
    TFL.confirm = function (options) {
        const opts = typeof options === 'string' ? { text: options } : (options || {});
        const title = opts.title || 'Confirmar Ação';
        const text = opts.text || 'Deseja realmente prosseguir?';
        const confirmText = opts.confirmText || 'Confirmar';
        const cancelText = opts.cancelText || 'Cancelar';
        const isDanger = opts.danger !== false;

        if (window.Swal && typeof window.Swal.fire === 'function') {
            return window.Swal.fire({
                title: title,
                text: text,
                icon: opts.icon || 'warning',
                showCancelButton: true,
                confirmButtonText: confirmText,
                cancelButtonText: cancelText,
                background: '#0f172a',
                color: '#f4f4f5',
                confirmButtonColor: isDanger ? '#dc2626' : '#2563eb',
                cancelButtonColor: '#334155',
                reverseButtons: true,
                customClass: {
                    popup: 'rounded-3xl border border-white/10 shadow-2xl'
                }
            }).then(function (result) {
                return Boolean(result && result.isConfirmed);
            });
        }

        // Fallback em Tailwind caso CDN não tenha carregado
        return new Promise(function (resolve) {
            const $modal = $(`
                <div class="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div class="bg-slate-900 border border-white/10 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
                        <h4 class="text-sm font-black uppercase tracking-wider text-white">${escapeText(title)}</h4>
                        <p class="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">${escapeText(text)}</p>
                        <div class="flex items-center justify-end gap-2 pt-2">
                            <button type="button" class="btn-tfl-cancel px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-zinc-300 text-xs font-bold transition">${escapeText(cancelText)}</button>
                            <button type="button" class="btn-tfl-confirm px-4 py-2 rounded-xl ${isDanger ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'} text-white text-xs font-bold transition">${escapeText(confirmText)}</button>
                        </div>
                    </div>
                </div>
            `);
            $('body').append($modal);
            $modal.find('.btn-tfl-cancel').on('click', function () {
                $modal.remove();
                resolve(false);
            });
            $modal.find('.btn-tfl-confirm').on('click', function () {
                $modal.remove();
                resolve(true);
            });
        });
    };

    /**
     * Modal de Prompt Assíncrono (Substitui window.prompt)
     * Retorna Promise<string|null>
     */
    TFL.prompt = function (options) {
        const opts = typeof options === 'string' ? { title: options } : (options || {});
        const title = opts.title || 'Digite uma mensagem';
        const placeholder = opts.placeholder || 'Escreva aqui...';
        const confirmText = opts.confirmText || 'Confirmar';
        const cancelText = opts.cancelText || 'Cancelar';

        if (window.Swal && typeof window.Swal.fire === 'function') {
            return window.Swal.fire({
                title: title,
                input: 'text',
                inputPlaceholder: placeholder,
                inputValue: opts.defaultValue || '',
                showCancelButton: true,
                confirmButtonText: confirmText,
                cancelButtonText: cancelText,
                background: '#0f172a',
                color: '#f4f4f5',
                confirmButtonColor: '#10b981',
                cancelButtonColor: '#334155',
                reverseButtons: true,
                customClass: {
                    popup: 'rounded-3xl border border-white/10 shadow-2xl'
                }
            }).then(function (result) {
                if (result && result.isConfirmed) {
                    return String(result.value || '');
                }
                return null;
            });
        }

        // Fallback em Tailwind
        return new Promise(function (resolve) {
            const $modal = $(`
                <div class="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div class="bg-slate-900 border border-white/10 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
                        <h4 class="text-sm font-black uppercase tracking-wider text-white">${escapeText(title)}</h4>
                        <input type="text" class="input-tfl-prompt w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500" placeholder="${escapeText(placeholder)}">
                        <div class="flex items-center justify-end gap-2 pt-2">
                            <button type="button" class="btn-tfl-cancel px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-zinc-300 text-xs font-bold transition">${escapeText(cancelText)}</button>
                            <button type="button" class="btn-tfl-confirm px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition">${escapeText(confirmText)}</button>
                        </div>
                    </div>
                </div>
            `);
            $('body').append($modal);
            const $input = $modal.find('.input-tfl-prompt');
            $input.focus();
            $modal.find('.btn-tfl-cancel').on('click', function () {
                $modal.remove();
                resolve(null);
            });
            $modal.find('.btn-tfl-confirm').on('click', function () {
                const val = $input.val();
                $modal.remove();
                resolve(String(val || ''));
            });
        });
    };

    // Sobrescreve window.alert globalmente para garantir que nenhum alert nativo trave a tela
    window.alert = function (msg) {
        TFL.toast.fromText(msg);
    };

    $(document).ready(function () {
        ensureContainer();
        flushQueuedToasts();
    });

})(window, jQuery);
