/**
 * ============================================================================
 * TFL PROFILE — AMIGOS & CENTRAL DE CHAT REAL-TIME (DM, GRUPOS, GLOBAL & WEBSOCKET)
 * ============================================================================
 */
(function (window, $) {
    'use strict';

    const TFL = window.TFL = window.TFL || {};

    let chatRoomsCache = [];
    let activeRoomObj = null;
    let currentChatListFilter = 'all';
    let chatSocket = null;
    let typingTimeout = null;
    const renderedMessageUids = new Set();

    // ================= 1. BUSCA E GESTÃO DE AMIGOS =================
    TFL.performFriendSearch = function () {
        const q = ($('#inputSearchFriend').val() || '').trim();
        const container = $('#friendSearchResultsContainer');
        const ACTIVE_AVATAR_ID = TFL.getActiveAvatarId();
        container.removeClass('hidden').html('<div class="text-xs text-zinc-400 py-2"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Buscando avatares...</div>');

        $.get('/profile/friends/search', { avatarId: ACTIVE_AVATAR_ID, q: q }, function (res) {
            if (!res.success || !res.results || res.results.length === 0) {
                container.html('<div class="p-4 rounded-xl bg-slate-950 border border-white/5 text-xs text-zinc-500 text-center">Nenhum avatar encontrado com esse termo.</div>');
                return;
            }

            let html = '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">';
            res.results.forEach(function (av) {
                const thumb = TFL.getAvatarThumb(av);
                let actionBtn = '';
                if (av.relationStatus === 'friends') {
                    actionBtn = `
                        <button type="button" class="btn-open-dm px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold transition" data-profileid="${av.id}" data-name="${TFL.escapeHtml(av.name)}">
                            <i class="fa-solid fa-comment-dots mr-1"></i>DM
                        </button>
                    `;
                } else if (av.relationStatus === 'pending_sent') {
                    actionBtn = `<span class="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold">Convite Enviado</span>`;
                } else if (av.relationStatus === 'pending_received') {
                    actionBtn = `
                        <button type="button" class="btn-accept-friend px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition" data-id="${av.friendshipId}">
                            Aceitar
                        </button>
                    `;
                } else {
                    actionBtn = `
                        <button type="button" class="btn-send-friend-request px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition" data-targetid="${av.id}">
                            <i class="fa-solid fa-user-plus mr-1"></i>Adicionar
                        </button>
                    `;
                }

                html += `
                    <div class="p-3.5 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-between gap-2.5">
                        <button type="button" class="btn-open-mini-profile flex items-center gap-2.5 overflow-hidden text-left group flex-1" data-avatarid="${av.id}">
                            <img src="${thumb}" class="w-10 h-10 rounded-xl object-cover flex-shrink-0">
                            <div class="overflow-hidden">
                                <div class="text-xs font-bold text-white group-hover:text-sky-400 transition truncate">${TFL.escapeHtml(av.name)}</div>
                                <div class="text-[10px] text-zinc-500">ID: #${av.id}</div>
                            </div>
                        </button>
                        <div class="flex items-center gap-1.5">
                            <button type="button" class="btn-navigate-user-profile p-2 rounded-xl bg-slate-900 hover:bg-blue-600 text-zinc-400 hover:text-white text-xs transition" data-avatarid="${av.id}" title="Ver Perfil">
                                <i class="fa-solid fa-id-card"></i>
                            </button>
                            ${actionBtn}
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            container.html(html);
        });
    };

    // ================= 2. CENTRAL DE CHAT REAL-TIME =================
    TFL.showChatListScreen = function () {
        activeRoomObj = null;
        $('#activeChatRoomUid').val('');
        $('#chatConversationScreen').addClass('hidden');
        $('#chatListScreen').removeClass('hidden');
        TFL.renderChatRoomsList();
    };

    TFL.showChatConversationScreen = function () {
        $('#chatListScreen').addClass('hidden');
        $('#chatConversationScreen').removeClass('hidden');
    };

    function getRoomDisplayInfo(room) {
        const ACTIVE_AVATAR_ID = TFL.getActiveAvatarId();
        if (room.type === 'global') {
            return {
                title: room.name || 'Chat Global Metaverso',
                sub: 'Canal público de todos os avatares',
                badge: 'GLOBAL',
                badgeClass: 'bg-sky-500/20 text-sky-400',
                avatarHtml: '<i class="fa-solid fa-earth-americas text-lg text-sky-400"></i>',
                peerId: null
            };
        }
        if (room.type === 'group') {
            const count = Array.isArray(room.profiles) ? room.profiles.length : '';
            return {
                title: room.name || 'Grupo de Chat',
                sub: count ? `${count} participantes • Clique para ver membros` : 'Grupo privado • Ver participantes',
                badge: 'GRUPO',
                badgeClass: 'bg-purple-500/20 text-purple-400',
                avatarHtml: '<i class="fa-solid fa-users text-lg text-purple-400"></i>',
                peerId: null
            };
        }
        let peer = room.peerProfile;
        if (!peer && Array.isArray(room.profiles)) {
            peer = room.profiles.find(p => Number(p.id) !== ACTIVE_AVATAR_ID) || room.profiles[0];
        }
        const name = peer?.name || `Conversa #${room.id}`;
        const thumb = TFL.getAvatarThumb(peer || { name });
        return {
            title: name,
            sub: peer?.id ? `Mensagem Direta • Avatar #${peer.id}` : 'Mensagem Direta Privada',
            badge: 'DM',
            badgeClass: 'bg-emerald-500/20 text-emerald-400',
            avatarHtml: `<img src="${thumb}" class="w-full h-full object-cover">`,
            peerId: peer?.id || null
        };
    }

    function updateTotalUnreadBadge() {
        const total = chatRoomsCache.reduce((acc, r) => acc + (Number(r.unread) || 0), 0);
        const badge = $('#sidebarChatUnreadBadge');
        if (total > 0) {
            badge.text(total).removeClass('hidden');
        } else {
            badge.addClass('hidden');
        }
    }

    TFL.renderChatRoomsList = function () {
        const container = $('#chatRoomsListContainer');
        if (!container.length) return;
        container.empty();

        if (!chatRoomsCache || chatRoomsCache.length === 0) {
            container.html('<div class="p-8 text-center text-xs text-zinc-500">Nenhuma conversa disponível.</div>');
            return;
        }

        const filtered = chatRoomsCache.filter(r => {
            if (currentChatListFilter === 'all') return true;
            return r.type === currentChatListFilter;
        });

        if (filtered.length === 0) {
            container.html('<div class="p-8 text-center text-xs text-zinc-500">Nenhuma conversa encontrada neste filtro.</div>');
            return;
        }

        const sorted = [...filtered].sort((a, b) => {
            if (a.type === 'global' && b.type !== 'global') return -1;
            if (b.type === 'global' && a.type !== 'global') return 1;
            return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
        });

        sorted.forEach(function (room) {
            const info = getRoomDisplayInfo(room);
            const lastMsgText = room.lastMessage
                ? (room.lastMessage.text || ((room.lastMessage.hasImage || room.lastMessage.has_image) ? '📷 Foto enviada' : ((room.lastMessage.hasAudio || room.lastMessage.has_audio) ? '🎤 Mensagem de voz' : '📎 Anexo enviado')))
                : 'Toque para abrir a conversa';
            const unreadCount = Number(room.unread || 0);

            const itemHtml = `
                <div class="p-3.5 rounded-2xl bg-slate-900/70 hover:bg-slate-900 border border-white/5 hover:border-sky-500/40 transition flex items-center justify-between gap-3">
                    <button type="button" class="btn-select-chat-room flex items-center gap-3.5 overflow-hidden text-left flex-1"
                            data-uid="${room.uid}">
                        <div class="w-12 h-12 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            ${info.avatarHtml}
                        </div>
                        <div class="overflow-hidden flex-1">
                            <div class="flex items-center gap-2">
                                <span class="text-xs sm:text-sm font-bold text-white truncate">${TFL.escapeHtml(info.title)}</span>
                                <span class="text-[9px] font-black px-2 py-0.5 rounded-md ${info.badgeClass}">${info.badge}</span>
                            </div>
                            <p class="text-[11px] text-zinc-400 truncate mt-0.5">${TFL.escapeHtml(lastMsgText)}</p>
                        </div>
                    </button>

                    <div class="flex items-center gap-2 flex-shrink-0">
                        ${info.peerId ? `
                            <button type="button" class="btn-open-mini-profile p-2 rounded-xl bg-slate-950 hover:bg-sky-600/20 border border-white/10 text-zinc-400 hover:text-sky-400 text-xs transition"
                                    data-avatarid="${info.peerId}" title="Ver Mini Profile">
                                <i class="fa-solid fa-id-badge"></i>
                            </button>
                        ` : ''}
                        ${room.type === 'group' ? `
                            <button type="button" class="btn-quick-group-members px-2.5 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-[11px] font-bold transition"
                                    data-uid="${room.uid}" title="Participantes e Adicionar Amigos">
                                <i class="fa-solid fa-users mr-1"></i>${Array.isArray(room.profiles) ? room.profiles.length : ''}
                            </button>
                        ` : ''}
                        ${unreadCount > 0 ? `<span class="px-2.5 py-1 rounded-full bg-sky-500 text-slate-950 font-black text-[10px]">${unreadCount}</span>` : ''}
                        <button type="button" class="btn-select-chat-room px-3 py-2 rounded-xl bg-sky-600/15 hover:bg-sky-600 text-sky-400 hover:text-white text-xs font-bold transition"
                                data-uid="${room.uid}">
                            Abrir <i class="fa-solid fa-chevron-right ml-1 text-[10px]"></i>
                        </button>
                    </div>
                </div>
            `;
            container.append(itemHtml);
        });

        updateTotalUnreadBadge();
    };

    function parseRoomInviteFromMsg(msg) {
        if (!msg) return null;
        const rawLink = msg.linkFile || msg.link_file || '';
        if (!rawLink) return null;
        try {
            const parsed = typeof rawLink === 'string' ? JSON.parse(rawLink) : rawLink;
            if (parsed && parsed.kind === 'room_invite' && parsed.roomId) {
                return parsed;
            }
        } catch (_e) {
            return null;
        }
        return null;
    }

    TFL.renderMessageItem = function (msg) {
        if (!msg || (msg.uid && renderedMessageUids.has(msg.uid))) return;
        if (msg.uid) renderedMessageUids.add(msg.uid);

        const ACTIVE_AVATAR_ID = TFL.getActiveAvatarId();
        const isMine = Number(msg.profileId || msg.profile_id) === ACTIVE_AVATAR_ID;
        const timeStr = (msg.createdAt || msg.created_at) ? new Date(msg.createdAt || msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        const roomUid = activeRoomObj?.uid || $('#activeChatRoomUid').val() || '';
        const senderThumb = TFL.getAvatarThumb(msg.sender || { name: msg.senderName || `Avatar ${msg.profileId || msg.profile_id}` });

        const hasImage = Boolean(msg.hasImage || msg.has_image);
        const hasAudio = Boolean(msg.hasAudio || msg.has_audio);
        const hasVideo = Boolean(msg.hasVideo || msg.has_video);
        const hasFile = Boolean(msg.hasFile || msg.has_file);
        const roomInvite = parseRoomInviteFromMsg(msg);

        let mediaHtml = '';
        if (hasImage && msg.uid && roomUid) {
            const fileUrl = `/api/chats/${roomUid}/messages/${msg.uid}/file?profileId=${ACTIVE_AVATAR_ID}`;
            mediaHtml = `<a href="${fileUrl}" target="_blank" class="block mb-1.5"><img src="${fileUrl}" class="max-h-56 rounded-xl border border-white/10 object-cover"></a>`;
        } else if (hasAudio && msg.uid && roomUid) {
            const fileUrl = `/api/chats/${roomUid}/messages/${msg.uid}/file?profileId=${ACTIVE_AVATAR_ID}`;
            mediaHtml = `<div class="my-1"><audio controls src="${fileUrl}" class="max-w-[230px] sm:max-w-[280px] h-9"></audio></div>`;
        } else if (hasVideo && msg.uid && roomUid) {
            const fileUrl = `/api/chats/${roomUid}/messages/${msg.uid}/file?profileId=${ACTIVE_AVATAR_ID}`;
            mediaHtml = `<video controls src="${fileUrl}" class="max-h-56 rounded-xl my-1"></video>`;
        } else if (hasFile && msg.uid && roomUid) {
            const fileUrl = `/api/chats/${roomUid}/messages/${msg.uid}/file?profileId=${ACTIVE_AVATAR_ID}`;
            mediaHtml = `<a href="${fileUrl}" target="_blank" class="inline-flex items-center gap-1.5 text-sky-300 underline text-xs mb-1"><i class="fa-solid fa-file-arrow-down"></i> Baixar arquivo anexo</a>`;
        }

        let roomInviteHtml = '';
        if (roomInvite) {
            const rId = Number(roomInvite.roomId);
            const srvId = Number(roomInvite.serverId || 0);
            const rName = TFL.escapeHtml(roomInvite.roomName || `Sala #${rId}`);
            const instLabel = TFL.escapeHtml(roomInvite.instanceLabel || `Instância #${roomInvite.instanceNumber || 1}`);
            const addr = TFL.escapeHtml(roomInvite.connectAddress || `${roomInvite.ip || '127.0.0.1'}:${roomInvite.publicPort || '10018'}`);
            const tflUri = TFL.escapeHtml(roomInvite.tflUri || `tfl://join?roomId=${rId}`);
            const scene = TFL.escapeHtml(roomInvite.scene || 'house');
            const pCount = Number(roomInvite.playersCount || 0);
            const mPlayers = Math.max(1, Number(roomInvite.maxPlayers || 30));
            const occPct = Math.min(100, Math.round((pCount / mPlayers) * 100));
            const isFull = pCount >= mPlayers;
            const instTotal = Math.max(1, Number(roomInvite.instancesCount || 1));
            const entryVal = Number(roomInvite.entryValue || 0);
            const entryBadge = entryVal > 0
                ? `<span class="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-black">🎟️ Passe 24h: ${entryVal} Coins</span>`
                : `<span class="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[9px] font-black">Entrada Grátis</span>`;

            roomInviteHtml = `
                <div class="room-invite-chat-card mt-1.5 mb-1.5 p-3 rounded-2xl bg-slate-950/95 border border-indigo-500/40 text-left space-y-2.5 shadow-xl min-w-[250px] sm:min-w-[310px]"
                     data-room-id="${rId}" data-server-id="${srvId}">
                    <div class="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                        <div class="flex items-center gap-1.5">
                            <span class="w-2 h-2 rounded-full ${isFull ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}"></span>
                            <span class="text-[10px] font-black uppercase tracking-wider text-indigo-300">🖧 Endereço de Sala &amp; Servidor</span>
                        </div>
                        <div class="flex items-center gap-1">
                            <span class="lbl-invite-instance-badge px-2 py-0.5 rounded-md bg-sky-500/20 border border-sky-500/40 text-sky-300 text-[9px] font-black">${instLabel}</span>
                            <span class="lbl-invite-replicas-count px-1.5 py-0.5 rounded-md bg-slate-800 text-zinc-300 text-[9px] font-bold" title="Total de réplicas abertas desta sala na tabela servers">${instTotal} inst.</span>
                        </div>
                    </div>

                    <div class="flex items-start justify-between gap-2">
                        <div class="min-w-0">
                            <div class="text-xs sm:text-sm font-black text-white truncate">🏠 ${rName}</div>
                            <div class="text-[10px] text-zinc-400">Cena: <strong class="text-zinc-200">${scene}</strong> • ID Sala: <strong class="text-zinc-200">#${rId}</strong></div>
                        </div>
                        ${entryBadge}
                    </div>

                    <!-- Dados da Tabela servers -->
                    <div class="p-2.5 rounded-xl bg-slate-900/90 border border-white/5 space-y-1.5 text-[10px]">
                        <div class="flex items-center justify-between gap-2">
                            <span class="text-zinc-400">Servidor (<code class="text-sky-400">servers</code>):</span>
                            <code class="lbl-invite-connect-addr font-mono font-bold text-emerald-300 bg-slate-950 px-1.5 py-0.5 rounded">${addr}</code>
                        </div>
                        <div class="flex items-center justify-between gap-2">
                            <span class="text-zinc-400">Endereço Direto:</span>
                            <code class="lbl-invite-tfl-uri font-mono text-[9px] text-sky-300 truncate max-w-[175px]" title="${tflUri}">${tflUri}</code>
                        </div>
                        <div class="space-y-1 pt-0.5">
                            <div class="flex items-center justify-between">
                                <span class="text-zinc-400">Lotação da Instância:</span>
                                <span class="lbl-invite-occupancy font-black ${isFull ? 'text-amber-300' : 'text-white'}">${pCount} / ${mPlayers} jogadores ${isFull ? '(Lotada • Auto-Replica)' : ''}</span>
                            </div>
                            <div class="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                                <div class="bar-invite-occupancy h-full ${isFull ? 'bg-amber-500' : 'bg-gradient-to-r from-emerald-500 to-sky-400'} rounded-full transition-all" style="width: ${Math.max(5, occPct)}%"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Botões de Ação Direta no Card do Chat -->
                    <div class="flex flex-wrap items-center gap-1.5 pt-1">
                        <button type="button"
                                class="btn-chat-join-room-instance flex-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider transition flex items-center justify-center gap-1 shadow-md shadow-emerald-600/20"
                                data-room-id="${rId}"
                                data-server-id="${srvId}"
                                data-room-name="${rName}">
                            <span class="material-symbols-outlined text-[14px]">login</span>
                            <span>Entrar na Sala</span>
                        </button>
                        <button type="button"
                                class="btn-open-room-instances-modal px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[10px] font-black uppercase transition flex items-center gap-1"
                                data-room-id="${rId}"
                                data-room-name="${rName}"
                                title="Ver todas as instâncias replicadas desta sala na tabela servers">
                            <i class="fa-solid fa-server"></i>
                            <span>Instâncias</span>
                        </button>
                        <button type="button"
                                class="btn-copy-room-address p-1.5 rounded-xl bg-slate-800 hover:bg-sky-600 text-zinc-300 hover:text-white text-[10px] font-bold transition"
                                data-address="${addr}"
                                data-uri="${tflUri}"
                                title="Copiar Endereço IP:Porta e Link tfl://join">
                            <span class="material-symbols-outlined text-[15px]">content_copy</span>
                        </button>
                    </div>
                </div>
            `;
        }

        const bubbleHtml = `
            <div class="flex items-end gap-2.5 ${isMine ? 'justify-end' : 'justify-start'}">
                ${!isMine ? `
                    <button type="button" class="btn-open-mini-profile w-8 h-8 rounded-xl overflow-hidden bg-slate-950 border border-white/10 flex-shrink-0 hover:scale-105 transition"
                            data-avatarid="${msg.profileId}" title="Ver Mini Profile de ${TFL.escapeHtml(msg.senderName)}">
                        <img src="${senderThumb}" class="w-full h-full object-cover">
                    </button>
                ` : ''}
                <div class="max-w-[88%] sm:max-w-[74%] rounded-2xl px-4 py-2.5 text-xs ${isMine ? 'bg-sky-600 text-white rounded-br-none shadow-lg shadow-sky-600/20' : 'bg-slate-800/90 text-zinc-200 border border-white/5 rounded-bl-none'}">
                    ${!isMine ? `
                        <button type="button" class="btn-open-mini-profile text-[10px] font-black text-sky-400 hover:underline mb-0.5 block text-left"
                                data-avatarid="${msg.profileId}">
                            ${TFL.escapeHtml(msg.senderName || 'Avatar #' + msg.profileId)}
                        </button>
                    ` : ''}
                    ${mediaHtml}
                    ${msg.text ? `<p class="leading-relaxed break-words">${TFL.escapeHtml(msg.text)}</p>` : ''}
                    ${roomInviteHtml}
                    <div class="text-[9px] ${isMine ? 'text-sky-200' : 'text-zinc-500'} text-right mt-1">${timeStr}</div>
                </div>
            </div>
        `;

        const container = $('#chatMessagesContainer');
        container.append(bubbleHtml);
        if (container[0]) {
            container.scrollTop(container[0].scrollHeight);
        }
    };

    TFL.selectChatRoom = function (roomUid) {
        const room = chatRoomsCache.find(r => r.uid === roomUid);
        if (!room) return;
        const ACTIVE_AVATAR_ID = TFL.getActiveAvatarId();

        activeRoomObj = room;
        room.unread = 0;
        $('#activeChatRoomUid').val(room.uid);
        updateTotalUnreadBadge();

        TFL.showChatConversationScreen();

        const info = getRoomDisplayInfo(room);
        $('#chatActiveAvatarBox').html(info.avatarHtml);
        $('#chatActiveHeaderTitle').text(info.title);
        $('#chatActiveHeaderSub').text(info.sub);

        $('#btnChatHeaderMiniProfile, #btnChatHeaderFullProfile, #btnOpenGroupParticipants, #btnOpenGroupAddFriends').addClass('hidden').removeClass('flex');

        if (room.type === 'private' && info.peerId) {
            $('#btnChatHeaderMiniProfile').removeClass('hidden').addClass('flex').data('avatarid', info.peerId);
            $('#btnChatHeaderFullProfile').removeClass('hidden').addClass('flex').data('avatarid', info.peerId);
        } else if (room.type === 'group') {
            const count = Array.isArray(room.profiles) ? room.profiles.length : '';
            $('#labelGroupParticipantsBtn').text(count ? `Participantes (${count})` : 'Participantes');
            $('#btnOpenGroupParticipants, #btnOpenGroupAddFriends').removeClass('hidden').addClass('flex');
        }

        const msgContainer = $('#chatMessagesContainer');
        msgContainer.html('<div class="p-6 text-center text-xs text-zinc-500"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Carregando histórico...</div>');
        renderedMessageUids.clear();

        $.ajax({
            url: `/api/chats/${room.uid}/messages?limit=50`,
            type: 'GET',
            headers: { 'x-profile-id': ACTIVE_AVATAR_ID },
            success: function (res) {
                msgContainer.empty();
                const list = (res?.messages || []).slice().reverse();
                if (list.length === 0) {
                    msgContainer.html(`
                        <div class="h-full flex flex-col items-center justify-center text-center text-zinc-500 text-xs p-6">
                            <i class="fa-regular fa-comments text-2xl text-zinc-600 mb-2"></i>
                            <p>Nenhuma mensagem nesta conversa ainda. Envie um "Olá"!</p>
                        </div>
                    `);
                } else {
                    list.forEach(TFL.renderMessageItem);
                }

                $.ajax({
                    url: `/api/chats/${room.uid}/read`,
                    type: 'POST',
                    headers: { 'x-profile-id': ACTIVE_AVATAR_ID }
                });
            }
        });
    };

    TFL.loadChatRooms = function (selectUidAfter = null) {
        const ACTIVE_AVATAR_ID = TFL.getActiveAvatarId();
        if (!ACTIVE_AVATAR_ID) return;
        $.ajax({
            url: '/api/chats',
            type: 'GET',
            headers: { 'x-profile-id': ACTIVE_AVATAR_ID },
            success: function (rooms) {
                chatRoomsCache = Array.isArray(rooms) ? rooms : [];
                TFL.renderChatRoomsList();

                if (selectUidAfter) {
                    TFL.selectChatRoom(selectUidAfter);
                }
            }
        });
    };

    // ================= 3. GRUPO: PARTICIPANTES & ADICIONAR AMIGOS =================
    TFL.openGroupParticipantsModal = function (roomUid) {
        const targetUid = roomUid || activeRoomObj?.uid;
        if (!targetUid) return;
        const ACTIVE_AVATAR_ID = TFL.getActiveAvatarId();

        $('#modalGroupParticipants').removeClass('hidden');
        $('#groupCurrentParticipantsContainer').html('<div class="text-xs text-zinc-500 py-3 text-center"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Carregando participantes...</div>');
        $('#groupAddFriendsListContainer').html('<div class="text-xs text-zinc-500 py-2 text-center"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Carregando seus amigos...</div>');

        $.when(
            $.ajax({ url: `/api/chats/${targetUid}`, type: 'GET', headers: { 'x-profile-id': ACTIVE_AVATAR_ID } }),
            $.get('/profile/friends/list', { avatarId: ACTIVE_AVATAR_ID })
        ).done(function (roomResp, friendsResp) {
            const roomData = roomResp[0];
            const friendsDataRes = friendsResp[0];

            $('#modalGroupTitle').html(`<i class="fa-solid fa-users text-purple-400"></i> ${TFL.escapeHtml(roomData.name || 'Grupo de Chat')}`);

            const participants = Array.isArray(roomData.participants) ? roomData.participants : [];
            const memberSet = new Set(participants.map(p => Number(p.profileId)));
            const myParticipant = participants.find(p => Number(p.profileId) === ACTIVE_AVATAR_ID);
            const amIAdmin = myParticipant && (myParticipant.role === 'owner' || myParticipant.role === 'admin');

            $('#groupParticipantsCountLabel').text(participants.length);

            let partHtml = '';
            participants.forEach(p => {
                const prof = p.profile || { id: p.profileId, name: `Avatar #${p.profileId}` };
                const isMe = Number(p.profileId) === ACTIVE_AVATAR_ID;
                const roleBadge = p.role === 'owner'
                    ? '<span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[9px] font-black uppercase">Dono</span>'
                    : p.role === 'admin'
                        ? '<span class="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[9px] font-black uppercase">Admin</span>'
                        : '<span class="px-2 py-0.5 rounded bg-slate-800 text-zinc-400 text-[9px] font-bold uppercase">Membro</span>';

                let removeBtn = '';
                if (isMe && p.role !== 'owner') {
                    removeBtn = `
                        <button type="button" class="btn-remove-group-member px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/30 text-red-400 text-[10px] font-bold transition"
                                data-uid="${targetUid}" data-profileid="${p.profileId}">
                            Sair
                        </button>
                    `;
                } else if (!isMe && amIAdmin && p.role !== 'owner') {
                    removeBtn = `
                        <button type="button" class="btn-remove-group-member px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/30 text-red-400 text-[10px] font-bold transition"
                                data-uid="${targetUid}" data-profileid="${p.profileId}" title="Remover do grupo">
                            Remover
                        </button>
                    `;
                }

                partHtml += `
                    <div class="p-3 rounded-2xl bg-slate-950 border border-white/5 flex items-center justify-between gap-2.5">
                        <button type="button" class="btn-open-mini-profile flex items-center gap-3 overflow-hidden text-left group flex-1"
                                data-avatarid="${prof.id}">
                            <img src="${TFL.getAvatarThumb(prof)}" class="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-white/10">
                            <div class="overflow-hidden">
                                <div class="flex items-center gap-2">
                                    <span class="text-xs font-bold text-white group-hover:text-sky-400 transition truncate">${TFL.escapeHtml(prof.name)}</span>
                                    ${roleBadge}
                                </div>
                                <span class="text-[10px] text-zinc-500">ID: #${prof.id} • Clique para Mini Profile</span>
                            </div>
                        </button>
                        <div class="flex items-center gap-1.5 flex-shrink-0">
                            <button type="button" class="btn-navigate-user-profile p-2 rounded-xl bg-slate-900 hover:bg-blue-600 text-zinc-400 hover:text-white text-xs transition"
                                    data-avatarid="${prof.id}" title="Navegar ao Perfil">
                                <i class="fa-solid fa-id-card"></i>
                            </button>
                            ${removeBtn}
                        </div>
                    </div>
                `;
            });
            $('#groupCurrentParticipantsContainer').html(partHtml || '<p class="text-xs text-zinc-500 text-center py-3">Nenhum participante.</p>');

            const allFriends = friendsDataRes?.friendsList || [];
            const availableFriends = allFriends.filter(f => f.avatar && !memberSet.has(Number(f.avatar.id)));

            if (availableFriends.length === 0) {
                $('#groupAddFriendsListContainer').html('<p class="text-xs text-zinc-500 text-center py-2">Todos os seus amigos já estão neste grupo (ou adicione novos amigos na aba Amigos).</p>');
            } else {
                let addHtml = '';
                availableFriends.forEach(f => {
                    const av = f.avatar;
                    addHtml += `
                        <div class="p-2.5 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-between gap-2">
                            <button type="button" class="btn-open-mini-profile flex items-center gap-2.5 overflow-hidden text-left flex-1"
                                    data-avatarid="${av.id}">
                                <img src="${TFL.getAvatarThumb(av)}" class="w-8 h-8 rounded-lg object-cover flex-shrink-0">
                                <span class="text-xs font-bold text-white truncate">${TFL.escapeHtml(av.name)} <span class="text-[10px] text-zinc-500">#${av.id}</span></span>
                            </button>
                            <button type="button" class="btn-add-friend-to-group px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition flex items-center gap-1 flex-shrink-0"
                                    data-uid="${targetUid}" data-profileid="${av.id}">
                                <i class="fa-solid fa-plus"></i> Adicionar
                            </button>
                        </div>
                    `;
                });
                $('#groupAddFriendsListContainer').html(addHtml);
            }
        });
    };

    // ================= 4. WEBSOCKET REAL-TIME (/ws/chat) =================
    TFL.connectChatWebSocket = function () {
        const ACTIVE_AVATAR_ID = TFL.getActiveAvatarId();
        if (!ACTIVE_AVATAR_ID) return;
        const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${proto}//${window.location.host}/ws/chat?profileId=${ACTIVE_AVATAR_ID}`;

        try {
            chatSocket = new WebSocket(wsUrl);

            chatSocket.onopen = function () {
                $('#wsStatusDot').removeClass('bg-amber-400 bg-red-500').addClass('bg-emerald-500');
                $('#wsStatusText').text('Online em tempo real');
            };

            chatSocket.onmessage = function (ev) {
                try {
                    const packet = JSON.parse(ev.data);
                    const event = packet.event;
                    const data = packet.data;

                    if (event === 'chat:message' && data) {
                        const targetRoom = chatRoomsCache.find(r => Number(r.id) === Number(data.chatId));
                        if (activeRoomObj && Number(activeRoomObj.id) === Number(data.chatId)) {
                            if ($('#chatMessagesContainer').find('.fa-comments').length > 0) {
                                $('#chatMessagesContainer').empty();
                            }
                            TFL.renderMessageItem(data);
                            activeRoomObj.lastMessage = data;
                            TFL.renderChatRoomsList();
                        } else if (targetRoom) {
                            targetRoom.lastMessage = data;
                            targetRoom.unread = Number(targetRoom.unread || 0) + 1;
                            TFL.renderChatRoomsList();
                        } else {
                            TFL.loadChatRooms();
                        }
                    } else if (event === 'chat:typing' && data) {
                        if (activeRoomObj && activeRoomObj.uid === data.roomUid && Number(data.profileId) !== TFL.getActiveAvatarId()) {
                            $('#chatTypingIndicator').text(`${data.senderName || 'Alguém'} está digitando...`).removeClass('hidden');
                            clearTimeout(typingTimeout);
                            typingTimeout = setTimeout(() => {
                                $('#chatTypingIndicator').addClass('hidden');
                            }, 3000);
                        }
                    } else if (event === 'chat:room:new' || event === 'chat:participants:added' || event === 'chat:participants:removed') {
                        TFL.loadChatRooms(activeRoomObj ? activeRoomObj.uid : null);
                    } else if (event === 'friend:request' || event === 'friend:accepted') {
                        const badge = $('#sidebarFriendsBadge');
                        const cur = parseInt(badge.text(), 10) || 0;
                        badge.text(cur + 1).removeClass('hidden');
                        if (event === 'friend:request') {
                            TFL.toast.info('Você recebeu uma nova solicitação de amizade!', 'Novo Convite');
                        } else {
                            TFL.toast.success('Uma solicitação de amizade foi aceita!', 'Novo Amigo');
                        }
                        if (typeof TFL.refreshPartial === 'function') {
                            TFL.refreshPartial('view-friends');
                        }
                    }
                } catch (e) {
                    console.error('Erro ao processar pacote WS:', e);
                }
            };

            chatSocket.onclose = function () {
                $('#wsStatusDot').removeClass('bg-emerald-500').addClass('bg-amber-400');
                $('#wsStatusText').text('Reconectando...');
                setTimeout(TFL.connectChatWebSocket, 4000);
            };
        } catch (err) {
            console.error('Falha ao iniciar WS do chat:', err);
        }
    };

    // ================= EVENT LISTENERS DELEGADOS =================
    $(document).ready(function () {
        $(document).on('click', '#btnSearchFriend', TFL.performFriendSearch);
        $(document).on('keypress', '#inputSearchFriend', function (e) {
            if (e.which === 13) {
                e.preventDefault();
                TFL.performFriendSearch();
            }
        });

        // Enviar solicitação de amizade
        $(document).on('click', '.btn-send-friend-request', function () {
            const btn = $(this);
            const targetProfileId = btn.data('targetid');
            btn.prop('disabled', true).text('Enviando...');

            $.post('/profile/friends/request', {
                avatarId: TFL.getActiveAvatarId(),
                targetProfileId: targetProfileId
            }, function (res) {
                if (res.success) {
                    if (res.autoAccepted) {
                        TFL.toast.success('O outro jogador já havia enviado um convite! Vocês agora são amigos.');
                    } else {
                        TFL.toast.success('Solicitação de amizade enviada com sucesso!');
                    }
                    if (typeof TFL.refreshPartial === 'function') {
                        TFL.refreshPartial('view-friends');
                    } else {
                        location.reload();
                    }
                } else {
                    TFL.toast.error(res.error || 'Erro ao enviar solicitação.');
                    btn.prop('disabled', false).text('Adicionar');
                }
            }).fail(function (xhr) {
                TFL.toast.error(xhr.responseJSON?.error || 'Erro ao enviar solicitação.');
                btn.prop('disabled', false).text('Adicionar');
            });
        });

        // Aceitar solicitação de amizade
        $(document).on('click', '.btn-accept-friend', function () {
            const friendshipId = $(this).data('id');
            $.post('/profile/friends/accept', {
                avatarId: TFL.getActiveAvatarId(),
                friendshipId: friendshipId
            }, function (res) {
                if (res.success) {
                    TFL.toast.success('Solicitação de amizade aceita!');
                    if (typeof TFL.refreshPartial === 'function') {
                        TFL.refreshPartial('view-friends');
                    } else {
                        location.reload();
                    }
                } else {
                    TFL.toast.error(res.error || 'Erro ao aceitar amizade.');
                }
            }).fail(function (xhr) {
                TFL.toast.error(xhr.responseJSON?.error || 'Erro ao aceitar amizade.');
            });
        });

        // Remover amigo / recusar ou cancelar solicitação
        $(document).on('click', '.btn-remove-friend', async function () {
            const friendshipId = $(this).data('id');
            const confirmed = await TFL.confirm({
                title: 'Remover vínculo de amizade?',
                text: 'Deseja remover este amigo ou cancelar a solicitação de amizade?',
                confirmText: 'Sim, remover',
                danger: true
            });
            if (!confirmed) return;

            $.post('/profile/friends/remove', {
                avatarId: TFL.getActiveAvatarId(),
                friendshipId: friendshipId
            }, function (res) {
                if (res.success) {
                    TFL.toast.info('Vínculo de amizade removido.');
                    if (typeof TFL.refreshPartial === 'function') {
                        TFL.refreshPartial('view-friends');
                    } else {
                        location.reload();
                    }
                } else {
                    TFL.toast.error(res.error || 'Erro ao remover amizade.');
                }
            }).fail(function (xhr) {
                TFL.toast.error(xhr.responseJSON?.error || 'Erro ao remover amizade.');
            });
        });

        // Chat
        $(document).on('click', '#btnBackToChatList', function () {
            TFL.showChatListScreen();
        });

        $(document).on('click', '.btn-chat-list-filter', function () {
            currentChatListFilter = $(this).data('filter') || 'all';
            $('.btn-chat-list-filter').removeClass('bg-sky-600 text-white').addClass('bg-slate-950 text-zinc-400');
            $(this).removeClass('bg-slate-950 text-zinc-400').addClass('bg-sky-600 text-white');
            TFL.renderChatRoomsList();
        });

        $(document).on('click', '.btn-select-chat-room', function () {
            const uid = $(this).data('uid');
            TFL.selectChatRoom(uid);
        });

        $(document).on('click', '#btnChatHeaderAction', function () {
            if (!activeRoomObj) return;
            if (activeRoomObj.type === 'group') {
                TFL.openGroupParticipantsModal(activeRoomObj.uid);
            } else if (activeRoomObj.type === 'private') {
                const info = getRoomDisplayInfo(activeRoomObj);
                if (info.peerId) TFL.openMiniProfile(info.peerId);
            }
        });

        $(document).on('click', '#btnChatHeaderMiniProfile', function () {
            const id = $(this).data('avatarid');
            if (id) TFL.openMiniProfile(id);
        });

        $(document).on('click', '#btnChatHeaderFullProfile', function () {
            const id = $(this).data('avatarid');
            if (id) TFL.openUserProfileView(id);
        });

        $(document).on('click', '#btnOpenGroupParticipants, #btnOpenGroupAddFriends', function () {
            if (activeRoomObj) TFL.openGroupParticipantsModal(activeRoomObj.uid);
        });

        $(document).on('click', '.btn-quick-group-members', function (e) {
            e.stopPropagation();
            const uid = $(this).data('uid');
            if (uid) TFL.openGroupParticipantsModal(uid);
        });

        $(document).on('click', '.btn-add-friend-to-group', function () {
            const btn = $(this);
            const roomUid = btn.data('uid');
            const profileId = Number(btn.data('profileid'));
            if (!roomUid || !profileId) return;

            btn.prop('disabled', true).text('Adicionando...');

            $.ajax({
                url: `/api/chats/${roomUid}/participants`,
                type: 'POST',
                headers: { 'x-profile-id': TFL.getActiveAvatarId() },
                contentType: 'application/json',
                data: JSON.stringify({ profileIds: [profileId] }),
                success: function () {
                    TFL.toast.success('Amigo adicionado ao grupo!');
                    TFL.openGroupParticipantsModal(roomUid);
                    TFL.loadChatRooms(activeRoomObj ? activeRoomObj.uid : null);
                },
                error: function (xhr) {
                    TFL.toast.error(xhr.responseJSON?.error || 'Erro ao adicionar amigo ao grupo.');
                    btn.prop('disabled', false).text('+ Adicionar');
                }
            });
        });

        $(document).on('click', '.btn-remove-group-member', async function () {
            const roomUid = $(this).data('uid');
            const targetId = Number($(this).data('profileid'));
            const isSelf = targetId === TFL.getActiveAvatarId();
            const confirmed = await TFL.confirm({
                title: isSelf ? 'Sair deste grupo?' : 'Remover participante?',
                text: isSelf
                    ? 'Deseja realmente sair deste grupo de chat?'
                    : 'Deseja remover este participante do grupo?',
                confirmText: isSelf ? 'Sair do grupo' : 'Remover',
                danger: true
            });
            if (!confirmed) return;

            $.ajax({
                url: `/api/chats/${roomUid}/participants/${targetId}`,
                type: 'DELETE',
                headers: { 'x-profile-id': TFL.getActiveAvatarId() },
                success: function () {
                    if (isSelf) {
                        TFL.toast.info('Você saiu do grupo.');
                        $('#modalGroupParticipants').addClass('hidden');
                        TFL.showChatListScreen();
                        TFL.loadChatRooms();
                    } else {
                        TFL.toast.info('Participante removido do grupo.');
                        TFL.openGroupParticipantsModal(roomUid);
                        TFL.loadChatRooms(activeRoomObj ? activeRoomObj.uid : null);
                    }
                },
                error: function (xhr) {
                    TFL.toast.error(xhr.responseJSON?.error || 'Erro ao remover participante.');
                }
            });
        });

        // Atualizar banner de cotas VIP do Chat
        TFL.refreshChatVipQuota = function () {
            const ACTIVE_AVATAR_ID = TFL.getActiveAvatarId();
            if (!ACTIVE_AVATAR_ID) return;
            $.ajax({
                url: '/api/chats/vip-quota',
                type: 'GET',
                headers: { 'x-profile-id': ACTIVE_AVATAR_ID },
                success: function (res) {
                    if (res && res.success && res.usageToday && res.limits) {
                        $('#lblChatQuotaDm').text(`${res.usageToday.dmOpens || 0}/${res.limits.maxChatOpensPerDay || '∞'}`);
                        $('#lblChatQuotaImg').text(`${res.usageToday.imagesSent || 0}/${res.limits.maxChatImagesPerDay || '∞'}`);
                        $('#lblChatQuotaAud').text(`${res.usageToday.audioSent || 0}/${res.limits.maxChatAudioPerDay || '∞'}`);
                    }
                }
            });
        };

        // Abrir DM direto
        $(document).on('click', '.btn-open-dm', function () {
            const targetProfileId = Number($(this).data('profileid'));
            if (!targetProfileId) return;

            $('#modalMiniProfile').addClass('hidden');

            $.ajax({
                url: '/api/chats/direct',
                type: 'POST',
                headers: { 'x-profile-id': TFL.getActiveAvatarId() },
                contentType: 'application/json',
                data: JSON.stringify({ profileId: targetProfileId }),
                success: function (room) {
                    $('#navBtnChat').trigger('click');
                    TFL.loadChatRooms(room.uid);
                    TFL.refreshChatVipQuota();
                },
                error: function (xhr) {
                    TFL.toast.error(xhr.responseJSON?.error || 'Erro ao abrir conversa direta.');
                }
            });
        });

        // Enviar mensagem de texto no Chat
        $(document).on('submit', '#formSendChatMessage', function (e) {
            e.preventDefault();
            const roomUid = $('#activeChatRoomUid').val();
            const text = $('#inputChatMessageText').val().trim();
            if (!roomUid || !text) return;

            $('#inputChatMessageText').val('');

            $.ajax({
                url: `/api/chats/${roomUid}/messages`,
                type: 'POST',
                headers: { 'x-profile-id': TFL.getActiveAvatarId() },
                contentType: 'application/json',
                data: JSON.stringify({ text: text }),
                success: function (msg) {
                    if ($('#chatMessagesContainer').find('.fa-comments').length > 0) {
                        $('#chatMessagesContainer').empty();
                    }
                    TFL.renderMessageItem(msg);
                    if (activeRoomObj) {
                        activeRoomObj.lastMessage = msg;
                        TFL.renderChatRoomsList();
                    }
                },
                error: function (xhr) {
                    TFL.toast.error(xhr.responseJSON?.error || 'Erro ao enviar mensagem.');
                }
            });
        });

        function uploadChatMediaBlobOrFile(fileOrBlob, filename, forcedType) {
            const roomUid = $('#activeChatRoomUid').val();
            if (!fileOrBlob || !roomUid) return;

            const formData = new FormData();
            formData.append('file', fileOrBlob, filename || fileOrBlob.name || 'media.bin');
            if (forcedType) formData.append('type', forcedType);
            const caption = $('#inputChatMessageText').val().trim();
            if (caption) formData.append('text', caption);

            $.ajax({
                url: `/api/chats/${roomUid}/messages/media`,
                type: 'POST',
                headers: { 'x-profile-id': TFL.getActiveAvatarId() },
                data: formData,
                processData: false,
                contentType: false,
                success: function (msg) {
                    $('#inputChatMessageText').val('');
                    $('#fileChatMedia, #fileChatImageOnly, #fileChatAudioOnly').val('');
                    if ($('#chatMessagesContainer').find('.fa-comments').length > 0) {
                        $('#chatMessagesContainer').empty();
                    }
                    TFL.renderMessageItem(msg);
                    if (activeRoomObj) {
                        activeRoomObj.lastMessage = msg;
                        TFL.renderChatRoomsList();
                    }
                    TFL.refreshChatVipQuota();
                    TFL.toast.success(forcedType === 'audio' ? 'Mensagem de voz enviada!' : 'Imagem enviada no chat!');
                },
                error: function (xhr) {
                    TFL.toast.error(xhr.responseJSON?.error || 'Erro ao enviar mídia no chat.');
                }
            });
        }

        // Enviar Mídia/Foto no Chat
        $(document).on('click', '#btnAttachChatMedia', function () {
            if (!$('#activeChatRoomUid').val()) return TFL.toast.warning('Selecione uma conversa primeiro.');
            $('#fileChatMedia').click();
        });

        $(document).on('click', '#btnAttachChatImage', function () {
            if (!$('#activeChatRoomUid').val()) return TFL.toast.warning('Selecione uma conversa primeiro.');
            $('#fileChatImageOnly').click();
        });

        $(document).on('change', '#fileChatMedia', function () {
            const file = this.files && this.files[0];
            if (file) uploadChatMediaBlobOrFile(file, file.name, null);
        });

        $(document).on('change', '#fileChatImageOnly', function () {
            const file = this.files && this.files[0];
            if (file) uploadChatMediaBlobOrFile(file, file.name, 'image');
        });

        $(document).on('change', '#fileChatAudioOnly', function () {
            const file = this.files && this.files[0];
            if (file) uploadChatMediaBlobOrFile(file, file.name, 'audio');
        });

        // Gravação de Voz (MediaRecorder) ou Seleção de Áudio
        let mediaRecorder = null;
        let audioChunks = [];
        let voiceTimerInterval = null;
        let voiceSeconds = 0;

        function stopVoiceStreamAndTimer() {
            if (voiceTimerInterval) {
                clearInterval(voiceTimerInterval);
                voiceTimerInterval = null;
            }
            if (mediaRecorder && mediaRecorder.stream) {
                mediaRecorder.stream.getTracks().forEach(t => t.stop());
            }
            $('#voiceRecordingBar').addClass('hidden');
        }

        $(document).on('click', '#btnRecordChatVoice', async function () {
            if (!$('#activeChatRoomUid').val()) return TFL.toast.warning('Selecione uma conversa primeiro.');

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined') {
                $('#fileChatAudioOnly').click();
                return;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                audioChunks = [];
                mediaRecorder = new MediaRecorder(stream);

                mediaRecorder.ondataavailable = function (ev) {
                    if (ev.data && ev.data.size > 0) audioChunks.push(ev.data);
                };

                voiceSeconds = 0;
                $('#voiceRecordingTimer').text('00:00');
                $('#voiceRecordingBar').removeClass('hidden');
                voiceTimerInterval = setInterval(function () {
                    voiceSeconds++;
                    const mm = String(Math.floor(voiceSeconds / 60)).padStart(2, '0');
                    const ss = String(voiceSeconds % 60).padStart(2, '0');
                    $('#voiceRecordingTimer').text(`${mm}:${ss}`);
                    if (voiceSeconds >= 60) {
                        $('#btnStopAndSendVoice').trigger('click');
                    }
                }, 1000);

                mediaRecorder.start();
            } catch (err) {
                // Caso o navegador/dispositivo bloqueie o microfone, abre o seletor de arquivo de áudio
                $('#fileChatAudioOnly').click();
            }
        });

        $(document).on('click', '#btnCancelVoiceRecord', function () {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.onstop = null;
                mediaRecorder.stop();
            }
            stopVoiceStreamAndTimer();
            audioChunks = [];
        });

        $(document).on('click', '#btnStopAndSendVoice', function () {
            if (!mediaRecorder || mediaRecorder.state === 'inactive') {
                stopVoiceStreamAndTimer();
                return;
            }
            mediaRecorder.onstop = function () {
                const mime = mediaRecorder.mimeType || 'audio/webm';
                const ext = mime.includes('ogg') ? 'ogg' : (mime.includes('mp4') ? 'm4a' : 'webm');
                const blob = new Blob(audioChunks, { type: mime });
                stopVoiceStreamAndTimer();
                if (blob.size > 0) {
                    uploadChatMediaBlobOrFile(blob, `voz_${Date.now()}.${ext}`, 'audio');
                }
            };
            mediaRecorder.stop();
        });

        $(document).on('input', '#inputChatMessageText', function () {
            const roomUid = $('#activeChatRoomUid').val();
            if (!roomUid || !chatSocket || chatSocket.readyState !== WebSocket.OPEN) return;
            chatSocket.send(JSON.stringify({
                type: 'chat:typing',
                data: { roomUid: roomUid, isTyping: true }
            }));
        });

        $(document).on('click', '#btnOpenCreateGroupModal', function () {
            $('#modalCreateGroupChat').removeClass('hidden');
        });

        $(document).on('submit', '#formCreateGroupChat', function (e) {
            e.preventDefault();
            const groupName = $('#inputNewGroupName').val().trim();
            if (!groupName) return;

            const memberIds = [];
            $('.chk-group-member:checked').each(function () {
                memberIds.push(Number($(this).val()));
            });

            $.ajax({
                url: '/api/chats/group',
                type: 'POST',
                headers: { 'x-profile-id': TFL.getActiveAvatarId() },
                contentType: 'application/json',
                data: JSON.stringify({ name: groupName, memberIds: memberIds }),
                success: function (room) {
                    $('#modalCreateGroupChat').addClass('hidden');
                    $('#inputNewGroupName').val('');
                    $('.chk-group-member').prop('checked', false);
                    TFL.toast.success(`Grupo "${groupName}" criado com sucesso!`);
                    TFL.loadChatRooms(room.uid);
                },
                error: function (xhr) {
                    TFL.toast.error(xhr.responseJSON?.error || 'Erro ao criar grupo.');
                }
            });
        });

        // =========================================================================
        // 5. COMPARTILHAR ENDEREÇO DE SALA & INSTÂNCIAS DO SERVIDOR (`servers`) NO CHAT
        // =========================================================================
        let shareableRoomsCache = [];

        function renderShareModalInstancesForRoom(roomId, preselectServerId) {
            const room = shareableRoomsCache.find(r => Number(r.id) === Number(roomId));
            const listEl = $('#shareRoomServerInstancesList');
            const summaryEl = $('#lblShareRoomInstancesSummary');

            if (!room) {
                summaryEl.text('0 instâncias');
                listEl.html('<div class="text-xs text-zinc-500 text-center py-2">Selecione uma sala acima para ver as instâncias do servidor.</div>');
                return;
            }

            const instances = Array.isArray(room.serverInstances) ? room.serverInstances : [];
            summaryEl.text(`${instances.length} instância(s) ativa(s) • ${room.livePlayersOnline || 0}/${room.totalCapacityOnline || room.maxPlayers || 30} online`);

            let html = `
                <label class="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900 border border-indigo-500/30 cursor-pointer hover:border-indigo-400 transition text-xs">
                    <div class="flex items-center gap-2">
                        <input type="radio" name="shareRoomServerId" value="0" ${!preselectServerId ? 'checked' : ''} class="text-indigo-600 focus:ring-0">
                        <div>
                            <div class="font-black text-indigo-300">⚡ Automático (Instância com vaga ou Nova Réplica)</div>
                            <div class="text-[10px] text-zinc-400">Se todas as instâncias estiverem cheias, cria outra sala automaticamente na tabela servers</div>
                        </div>
                    </div>
                </label>
            `;

            instances.forEach(srv => {
                const isSelected = Number(preselectServerId) === Number(srv.id);
                const isFull = Number(srv.playersCount || 0) >= Number(srv.maxPlayers || 30);
                html += `
                    <label class="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900 border ${isFull ? 'border-amber-500/40' : 'border-white/5'} cursor-pointer hover:border-sky-500/40 transition text-xs">
                        <div class="flex items-center gap-2 min-w-0">
                            <input type="radio" name="shareRoomServerId" value="${srv.id}" ${isSelected ? 'checked' : ''} class="text-sky-600 focus:ring-0">
                            <div class="min-w-0">
                                <div class="font-bold text-white flex items-center gap-1.5">
                                    <span class="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-black">${TFL.escapeHtml(srv.instanceLabel || 'Instância #' + srv.instanceNumber)}</span>
                                    <code class="text-[11px] text-emerald-300 font-mono">${TFL.escapeHtml(srv.connectAddress)}</code>
                                </div>
                                <div class="text-[10px] text-zinc-400 truncate">Cena: ${TFL.escapeHtml(srv.scene || 'house')} • PID: ${srv.pid || '-'} • Server #${srv.id}</div>
                            </div>
                        </div>
                        <span class="px-2 py-0.5 rounded-lg ${isFull ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'} text-[10px] font-black flex-shrink-0">
                            ${srv.playersCount || 0}/${srv.maxPlayers || 30} ${isFull ? 'LOTADA' : 'VAGAS'}
                        </span>
                    </label>
                `;
            });

            listEl.html(html);
        }

        TFL.openShareRoomInChatModal = function (preselectRoomId = null, preselectServerId = null) {
            const ACTIVE_AVATAR_ID = TFL.getActiveAvatarId();
            $('#modalShareRoomChat').removeClass('hidden');
            $('#chkShareForceNewReplica').prop('checked', false);

            // Popula conversas disponíveis
            const populateConversations = function (roomsList) {
                const selChat = $('#selectShareRoomTargetChat');
                selChat.empty();
                const currentActiveUid = $('#activeChatRoomUid').val() || activeRoomObj?.uid || '';

                if (!roomsList || roomsList.length === 0) {
                    selChat.append('<option value="">Nenhuma conversa aberta</option>');
                    return;
                }

                roomsList.forEach(r => {
                    const info = getRoomDisplayInfo(r);
                    const selected = (currentActiveUid && r.uid === currentActiveUid) ? 'selected' : '';
                    selChat.append(`<option value="${r.uid}" ${selected}>[${info.badge}] ${TFL.escapeHtml(info.title)}</option>`);
                });
            };

            if (chatRoomsCache && chatRoomsCache.length > 0) {
                populateConversations(chatRoomsCache);
            } else {
                $.ajax({
                    url: '/api/chats',
                    type: 'GET',
                    headers: { 'x-profile-id': ACTIVE_AVATAR_ID },
                    success: function (rooms) {
                        chatRoomsCache = Array.isArray(rooms) ? rooms : [];
                        populateConversations(chatRoomsCache);
                    }
                });
            }

            // Carrega salas e instâncias ativas na tabela `servers`
            $('#selectShareRoomId').html('<option value="">Carregando salas e servidores...</option>');
            $.ajax({
                url: '/api/chats/shareable-rooms',
                type: 'GET',
                headers: { 'x-profile-id': ACTIVE_AVATAR_ID },
                success: function (res) {
                    const myRooms = Array.isArray(res?.myRooms) ? res.myRooms : [];
                    const publicRooms = Array.isArray(res?.publicRooms) ? res.publicRooms : [];
                    shareableRoomsCache = [...myRooms, ...publicRooms];

                    const selRoom = $('#selectShareRoomId');
                    selRoom.empty();

                    if (shareableRoomsCache.length === 0) {
                        selRoom.append('<option value="">Nenhuma sala 3D encontrada (crie uma na aba Salas 3D)</option>');
                        renderShareModalInstancesForRoom(0, null);
                        return;
                    }

                    if (myRooms.length > 0) {
                        const grpMine = $('<optgroup label="🏠 Minhas Salas 3D"></optgroup>');
                        myRooms.forEach(r => {
                            const entryTxt = Number(r.entryValue || 0) > 0 ? `Passe 24h: ${r.entryValue} Coins` : 'Grátis';
                            const instTxt = `${r.instancesCount || 0} inst. (${r.livePlayersOnline || 0}/${r.totalCapacityOnline || r.maxPlayers || 30} on)`;
                            grpMine.append(`<option value="${r.id}">${TFL.escapeHtml(r.name)} — ${instTxt} • ${entryTxt}</option>`);
                        });
                        selRoom.append(grpMine);
                    }

                    if (publicRooms.length > 0) {
                        const grpPub = $('<optgroup label="🌐 Salas Públicas Populares"></optgroup>');
                        publicRooms.forEach(r => {
                            const entryTxt = Number(r.entryValue || 0) > 0 ? `Passe 24h: ${r.entryValue} Coins` : 'Grátis';
                            const instTxt = `${r.instancesCount || 0} inst. (${r.livePlayersOnline || 0}/${r.totalCapacityOnline || r.maxPlayers || 30} on)`;
                            grpPub.append(`<option value="${r.id}">${TFL.escapeHtml(r.name)} — ${instTxt} • ${entryTxt}</option>`);
                        });
                        selRoom.append(grpPub);
                    }

                    const chosenRoomId = preselectRoomId || shareableRoomsCache[0]?.id;
                    if (chosenRoomId) {
                        selRoom.val(String(chosenRoomId));
                        renderShareModalInstancesForRoom(chosenRoomId, preselectServerId);
                    }
                },
                error: function () {
                    $('#selectShareRoomId').html('<option value="">Erro ao carregar salas</option>');
                }
            });
        };

        $(document).on('click', '#btnShareRoomInChat', function () {
            TFL.openShareRoomInChatModal(null, null);
        });

        $(document).on('click', '.btn-share-room-to-chat', function () {
            const roomId = Number($(this).data('room-id') || $(this).data('id'));
            const serverId = Number($(this).data('server-id') || 0) || null;
            TFL.openShareRoomInChatModal(roomId, serverId);
        });

        $(document).on('click', '.btn-close-share-room-modal', function () {
            $('#modalShareRoomChat').addClass('hidden');
        });

        $(document).on('change', '#selectShareRoomId', function () {
            const roomId = Number($(this).val());
            renderShareModalInstancesForRoom(roomId, null);
        });

        $(document).on('submit', '#formShareRoomInChat', function (e) {
            e.preventDefault();
            const targetChatUid = $('#selectShareRoomTargetChat').val();
            const roomId = Number($('#selectShareRoomId').val());
            const serverId = Number($('input[name="shareRoomServerId"]:checked').val() || 0) || null;
            const forceNewReplica = $('#chkShareForceNewReplica').is(':checked');
            const customText = ($('#inputShareRoomCustomText').val() || '').trim();

            if (!targetChatUid) return TFL.toast.warning('Selecione uma conversa para enviar o endereço da sala.');
            if (!roomId) return TFL.toast.warning('Selecione uma sala 3D para compartilhar.');

            const $btn = $('#btnConfirmSendRoomInvite');
            $btn.prop('disabled', true).addClass('opacity-60');

            $.ajax({
                url: `/api/chats/${targetChatUid}/messages/room-invite`,
                type: 'POST',
                headers: { 'x-profile-id': TFL.getActiveAvatarId() },
                contentType: 'application/json',
                data: JSON.stringify({
                    roomId,
                    serverId,
                    forceNewReplica,
                    text: customText
                }),
                success: function (res) {
                    $btn.prop('disabled', false).removeClass('opacity-60');
                    $('#modalShareRoomChat').addClass('hidden');
                    $('#inputShareRoomCustomText').val('');

                    const inv = res?.invite || {};
                    TFL.toast.success(
                        `Endereço ${inv.connectAddress || ''} (${inv.instanceLabel || 'Instância #1'}) enviado no chat!`,
                        '🏠 Sala Compartilhada'
                    );

                    // Se já estiver na conversa de destino, renderiza a mensagem imediatamente
                    if (res?.message && activeRoomObj && activeRoomObj.uid === targetChatUid) {
                        if ($('#chatMessagesContainer').find('.fa-comments').length > 0) {
                            $('#chatMessagesContainer').empty();
                        }
                        TFL.renderMessageItem(res.message);
                    } else {
                        // Abre a aba de chat na conversa para onde foi enviado
                        $('.nav-item[data-view="view-chat"]').first().trigger('click');
                        TFL.loadChatRooms(targetChatUid);
                    }
                },
                error: function (xhr) {
                    $btn.prop('disabled', false).removeClass('opacity-60');
                    TFL.toast.error(xhr.responseJSON?.error || 'Erro ao enviar endereço da sala no chat.');
                }
            });
        });

        // ================= MODAL DE INSTÂNCIAS ATIVAS (`servers`) & AUTO-REPLICAÇÃO =================
        TFL.openRoomServerInstancesModal = function (roomId, roomName) {
            if (!roomId) return;
            $('#modalInstancesRoomId').val(roomId);
            $('#modalInstancesRoomName').val(roomName || `Sala #${roomId}`);
            $('#modalInstancesRoomTitle').text(`🖧 Instâncias do Servidor — ${roomName || 'Sala #' + roomId}`);
            $('#modalRoomServerInstances').removeClass('hidden');
            $('#modalRoomInstancesListContainer').html('<div class="p-6 text-center text-xs text-zinc-400"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Consultando tabela servers...</div>');

            $.get(`/profile/room/${roomId}/servers`, function (res) {
                if (!res || !res.success) {
                    $('#modalRoomInstancesListContainer').html('<div class="p-4 text-center text-xs text-red-400">Não foi possível carregar as instâncias desta sala.</div>');
                    return;
                }

                const instances = Array.isArray(res.instances) ? res.instances : [];
                $('#lblModalInstancesCount').text(instances.length);
                $('#lblModalInstancesPlayers').text(`${res.totalPlayersOnline || 0} / ${res.totalCapacity || 0}`);

                if (instances.length === 0) {
                    $('#modalRoomInstancesListContainer').html(`
                        <div class="p-6 rounded-2xl bg-slate-950 border border-dashed border-white/10 text-center space-y-2">
                            <div class="text-xs font-bold text-zinc-300">Nenhuma instância aberta no momento para esta sala.</div>
                            <p class="text-[11px] text-zinc-500">Assim que o primeiro jogador entrar ou você clicar em <strong>"Abrir Nova Réplica"</strong>, o servidor aloca automaticamente a <strong>Instância #1</strong> na tabela <code>servers</code>.</p>
                        </div>
                    `);
                    return;
                }

                let html = '';
                instances.forEach(srv => {
                    const pCount = Number(srv.playersCount || 0);
                    const mPlayers = Math.max(1, Number(srv.maxPlayers || 30));
                    const occPct = Math.min(100, Math.round((pCount / mPlayers) * 100));
                    const isFull = pCount >= mPlayers;

                    html += `
                        <div class="p-3.5 rounded-2xl bg-slate-950 border ${isFull ? 'border-amber-500/40' : 'border-white/10'} space-y-2.5">
                            <div class="flex flex-wrap items-center justify-between gap-2">
                                <div class="flex items-center gap-2">
                                    <span class="px-2.5 py-0.5 rounded-lg bg-sky-500/20 border border-sky-500/40 text-sky-300 text-xs font-black">${TFL.escapeHtml(srv.instanceLabel)}</span>
                                    <code class="px-2 py-0.5 rounded bg-slate-900 text-emerald-300 font-mono text-xs font-bold">${TFL.escapeHtml(srv.connectAddress)}</code>
                                    <span class="text-[10px] text-zinc-500">Server #${srv.id} • PID ${srv.pid || '-'}</span>
                                </div>
                                <span class="px-2.5 py-0.5 rounded-lg ${isFull ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'} text-[10px] font-black">
                                    👥 ${pCount} / ${mPlayers} jogadores ${isFull ? '(LOTADA)' : '(ABERTA)'}
                                </span>
                            </div>

                            <div class="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                                <div class="h-full ${isFull ? 'bg-amber-500' : 'bg-gradient-to-r from-emerald-500 to-sky-400'} rounded-full" style="width: ${Math.max(4, occPct)}%"></div>
                            </div>

                            <div class="flex flex-wrap items-center justify-between gap-2 text-[10px] text-zinc-400">
                                <div class="truncate">
                                    Cena: <strong class="text-zinc-200">${TFL.escapeHtml(srv.scene || 'house')}</strong> • Porta Int.: <strong class="text-zinc-200">${srv.port}</strong> • URI: <code class="text-sky-300">${TFL.escapeHtml(srv.tflUri)}</code>
                                </div>
                                <div class="flex items-center gap-1.5">
                                    <button type="button"
                                            class="btn-copy-room-address px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-sky-600 text-zinc-300 hover:text-white font-bold transition"
                                            data-address="${TFL.escapeHtml(srv.connectAddress)}"
                                            data-uri="${TFL.escapeHtml(srv.tflUri)}">
                                        📋 Copiar
                                    </button>
                                    <button type="button"
                                            class="btn-share-room-to-chat px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-300 hover:text-white font-black transition"
                                            data-room-id="${roomId}"
                                            data-server-id="${srv.id}">
                                        📢 Enviar no Chat
                                    </button>
                                    <button type="button"
                                            class="btn-chat-join-room-instance px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase transition"
                                            data-room-id="${roomId}"
                                            data-server-id="${srv.id}"
                                            data-room-name="${TFL.escapeHtml(roomName || 'Sala #' + roomId)}">
                                        🚀 Entrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                });

                $('#modalRoomInstancesListContainer').html(html);
            });
        };

        $(document).on('click', '.btn-open-room-instances-modal', function () {
            const roomId = Number($(this).data('room-id') || $(this).data('id'));
            const roomName = $(this).data('room-name') || $(this).data('name') || `Sala #${roomId}`;
            TFL.openRoomServerInstancesModal(roomId, roomName);
        });

        $(document).on('click', '.btn-close-room-instances-modal', function () {
            $('#modalRoomServerInstances').addClass('hidden');
        });

        $(document).on('click', '#btnShareFromInstancesModal', function () {
            const roomId = Number($('#modalInstancesRoomId').val());
            $('#modalRoomServerInstances').addClass('hidden');
            TFL.openShareRoomInChatModal(roomId, null);
        });

        $(document).on('click', '#btnSpawnNewRoomReplica', function () {
            const roomId = Number($('#modalInstancesRoomId').val());
            const roomName = $('#modalInstancesRoomName').val();
            if (!roomId) return;

            const $btn = $(this);
            $btn.prop('disabled', true).addClass('opacity-60');
            $.post(`/profile/room/${roomId}/replicate`, { roomId, forceNewReplica: true }, function (res) {
                $btn.prop('disabled', false).removeClass('opacity-60');
                if (res && res.success) {
                    const inst = res.instance || {};
                    TFL.toast.success(
                        `Nova sala replicada na tabela servers: ${inst.instanceLabel || 'Nova Instância'} (${inst.connectAddress || ''})!`,
                        '🖧 Réplica Criada'
                    );
                    TFL.openRoomServerInstancesModal(roomId, roomName);
                    if (typeof TFL.refreshPartial === 'function') {
                        TFL.refreshPartial('view-salas');
                    }
                } else {
                    TFL.toast.error(res?.error || 'Erro ao criar réplica da sala.');
                }
            }).fail(function (xhr) {
                $btn.prop('disabled', false).removeClass('opacity-60');
                TFL.toast.error(xhr.responseJSON?.error || 'Falha ao replicar sala.');
            });
        });

        $(document).on('click', '#btnSimulateFullAndReplicate', function () {
            const roomId = Number($('#modalInstancesRoomId').val());
            const roomName = $('#modalInstancesRoomName').val();
            if (!roomId) return;

            const $btn = $(this);
            $btn.prop('disabled', true).addClass('opacity-60');
            $.post(`/profile/room/${roomId}/replicate`, { roomId, fillCurrentToTest: true, forceNewReplica: false, joinPlayer: true }, function (res) {
                $btn.prop('disabled', false).removeClass('opacity-60');
                if (res && res.success) {
                    const inst = res.instance || {};
                    TFL.toast.info(
                        `A instância anterior atingiu a lotação máxima! O servidor abriu automaticamente a ${inst.instanceLabel} (${inst.connectAddress})!`,
                        '⚡ Auto-Replicação de Sala Lotada'
                    );
                    TFL.openRoomServerInstancesModal(roomId, roomName);
                    if (typeof TFL.refreshPartial === 'function') {
                        TFL.refreshPartial('view-salas');
                    }
                } else {
                    TFL.toast.error(res?.error || 'Erro ao simular lotação.');
                }
            }).fail(function (xhr) {
                $btn.prop('disabled', false).removeClass('opacity-60');
                TFL.toast.error(xhr.responseJSON?.error || 'Falha ao simular auto-replicação.');
            });
        });

        // Copiar endereço IP:Porta / tfl://join
        $(document).on('click', '.btn-copy-room-address', function () {
            const addr = $(this).data('address') || '';
            const uri = $(this).data('uri') || '';
            const textToCopy = uri ? `${addr} (${uri})` : addr;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(textToCopy).then(function () {
                    TFL.toast.success(`Endereço copiado: ${textToCopy}`, '📋 Endereço da Sala');
                });
            } else {
                TFL.toast.info(`Endereço: ${textToCopy}`, '📋 Endereço da Sala');
            }
        });

        // Entrar na Sala / Instância diretamente pelo Card do Chat ou Modal de Instâncias
        $(document).on('click', '.btn-chat-join-room-instance', function () {
            const $btn = $(this);
            const roomId = Number($btn.data('room-id'));
            const serverId = Number($btn.data('server-id') || 0) || null;
            const roomName = $btn.data('room-name') || `Sala #${roomId}`;
            if (!roomId) return;

            $btn.prop('disabled', true).addClass('opacity-60');
            $.post(`/profile/room/${roomId}/enter`, {
                roomId,
                serverId,
                avatarId: TFL.getActiveAvatarId()
            }, function (res) {
                $btn.prop('disabled', false).removeClass('opacity-60');
                if (res && res.success) {
                    const srv = res.serverInstance || {};
                    if (res.replicatedNewInstance) {
                        TFL.toast.info(
                            `A instância convidada estava cheia! O servidor criou automaticamente a ${srv.instanceLabel} (${srv.connectAddress}) para você!`,
                            '⚡ Nova Sala Replicada Automaticamente'
                        );
                    } else {
                        TFL.toast.success(
                            res.message || `Conectado a ${roomName} em ${srv.instanceLabel || 'Instância #1'} (${srv.connectAddress || ''})!`,
                            '🚀 Conectado ao Servidor da Sala'
                        );
                    }

                    // Atualiza os cards de convite dessa sala visíveis no chat com a nova lotação/instância
                    if (srv && srv.id) {
                        const $card = $btn.closest('.room-invite-chat-card');
                        if ($card.length) {
                            const pCount = Number(srv.playersCount || 0);
                            const mPlayers = Math.max(1, Number(srv.maxPlayers || 30));
                            const occPct = Math.min(100, Math.round((pCount / mPlayers) * 100));
                            $card.find('.lbl-invite-instance-badge').text(srv.instanceLabel || 'Instância #1');
                            $card.find('.lbl-invite-connect-addr').text(srv.connectAddress || '');
                            $card.find('.lbl-invite-tfl-uri').text(srv.tflUri || '');
                            $card.find('.lbl-invite-occupancy').text(`${pCount} / ${mPlayers} jogadores`);
                            $card.find('.bar-invite-occupancy').css('width', `${Math.max(5, occPct)}%`);
                            if (res.instancesCount) {
                                $card.find('.lbl-invite-replicas-count').text(`${res.instancesCount} inst.`);
                            }
                        }
                    }

                    if ($('#modalRoomServerInstances').is(':visible')) {
                        TFL.openRoomServerInstancesModal(roomId, roomName);
                    }
                    if (typeof TFL.refreshPartial === 'function') {
                        TFL.refreshPartial('view-salas');
                        TFL.refreshPartial('view-market');
                    }
                } else {
                    TFL.toast.error(res?.error || 'Não foi possível entrar na sala.');
                }
            }).fail(function (xhr) {
                $btn.prop('disabled', false).removeClass('opacity-60');
                TFL.toast.error(xhr.responseJSON?.error || 'Erro ao conectar à instância da sala.');
            });
        });

        // Inicializa Salas de Chat e WebSocket
        TFL.loadChatRooms();
        TFL.connectChatWebSocket();
    });

})(window, jQuery);
