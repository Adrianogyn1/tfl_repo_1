/**
 * ============================================================================
 * TFL PROFILE — THE FANTASY LIFE (REDE SOCIAL, PERFIL, MINI REELS, GALERIA & FEED)
 * ============================================================================
 */
(function (window, $) {
    'use strict';

    const TFL = window.TFL = window.TFL || {};

    let currentFeedFilter = 'all';
    let currentViewedProfileId = null;
    let activeMiniReelsList = [];
    let currentMiniReelIndex = 0;
    let currentGalleryFilter = 'all';

    // ================= 1. MINI PROFILE & PERFIL COMPLETO DO USUÁRIO =================
    TFL.openMiniProfile = function (targetAvatarId) {
        const targetId = Number(targetAvatarId);
        if (!targetId) return;
        const ACTIVE_AVATAR_ID = TFL.getActiveAvatarId();

        $('#miniProfileName').text('Carregando...');
        $('#miniProfileBio').text('Buscando informações do avatar...');
        $('#miniProfileActions').html('<div class="text-center py-2 text-xs text-zinc-500"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Carregando...</div>');
        $('#modalMiniProfile').removeClass('hidden');

        $.get(`/profile/social/avatar/${targetId}`, { viewerId: ACTIVE_AVATAR_ID }, function (res) {
            if (!res.success || !res.avatar) {
                $('#miniProfileBio').text('Avatar não encontrado.');
                return;
            }

            const av = res.avatar;
            const st = res.stats || {};
            const rel = res.relation || {};

            if (av.coverUrl) {
                $('#miniProfileCoverImg').attr('src', av.coverUrl).removeClass('hidden');
            } else {
                $('#miniProfileCoverImg').attr('src', '').addClass('hidden');
            }

            if (rel.matchStatus === 'matched') {
                $('#miniProfileMatchPill').removeClass('hidden');
            } else {
                $('#miniProfileMatchPill').addClass('hidden');
            }

            if (res.currentFeeling && (res.currentFeeling.feelingEmoji || res.currentFeeling.feelingLabel)) {
                const cf = res.currentFeeling;
                $('#miniProfileFeelingBadge')
                    .text(`${cf.feelingEmoji || ''} ${cf.feelingLabel || ''} (${cf.feelingRemainingHours || 1}h)`)
                    .removeClass('hidden');
            } else {
                $('#miniProfileFeelingBadge').addClass('hidden');
            }

            $('#miniProfileImg').attr('src', TFL.getAvatarThumb(av));
            $('#miniProfileBadgeId').text(`#${av.id}`);
            $('#miniProfileName').text(av.name || `Avatar #${av.id}`);
            $('#miniProfileGender').text(av.gender === 0 ? 'Feminino' : 'Masculino');
            $('#miniProfileBio').text(av.bio || 'Viajante explorando o universo The Fantasy Life.');

            $('#miniProfilePosts').text(st.postsCount || 0);
            $('#miniProfileFriends').text(st.friendsCount || 0);
            $('#miniProfileFollowers').text(st.followersCount || 0);
            $('#miniProfileRooms').text(st.roomsCount || 0);
            $('#miniProfileLikes').text(st.profileLikesCount || 0);

            let actionsHtml = `
                <button type="button" class="btn-navigate-user-profile w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                        data-avatarid="${av.id}">
                    <i class="fa-solid fa-id-card"></i>
                    <span>Navegar ao Perfil do Usuário</span>
                </button>
            `;

            if (!rel.isSelf) {
                let friendBtn = '';
                if (rel.friendStatus === 'friends') {
                    friendBtn = `
                        <span class="flex-1 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold text-center">
                            <i class="fa-solid fa-check mr-1"></i>Amigos
                        </span>
                    `;
                } else if (rel.friendStatus === 'pending_sent') {
                    friendBtn = `
                        <span class="flex-1 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold text-center">
                            <i class="fa-solid fa-clock mr-1"></i>Convite Enviado
                        </span>
                    `;
                } else if (rel.friendStatus === 'pending_received') {
                    friendBtn = `
                        <button type="button" class="btn-accept-friend flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                                data-id="${rel.friendshipId}">
                            <i class="fa-solid fa-check mr-1"></i>Aceitar Amizade
                        </button>
                    `;
                } else {
                    friendBtn = `
                        <button type="button" class="btn-send-friend-request flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                                data-targetid="${av.id}">
                            <i class="fa-solid fa-user-plus mr-1"></i>Adicionar
                        </button>
                    `;
                }

                const followBtn = `
                    <button type="button" class="btn-toggle-follow px-3.5 py-2 rounded-xl border text-xs font-bold transition ${rel.isFollowing ? 'bg-sky-500/20 border-sky-500/40 text-sky-300' : 'bg-slate-950 border-white/10 text-zinc-300 hover:text-white'}"
                            data-targetid="${av.id}">
                        <i class="fa-solid fa-star mr-1"></i>
                        <span>${rel.isFollowing ? 'Seguindo' : 'Seguir'}</span>
                    </button>
                `;

                const matchBtn = TFL.buildMatchButtonHtml(av.id, rel.matchStatus, 'flex-1');
                const profileLikeWidget = TFL.buildReactionBarHtml('profile', av.id, rel.profileLikedByMe, rel.myProfileReaction, st.profileLikesCount || 0, rel.profileReactionsSummary, true);

                actionsHtml += `
                    <div class="flex items-center gap-2">
                        <button type="button" class="btn-open-dm flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                                data-profileid="${av.id}" data-name="${TFL.escapeHtml(av.name)}">
                            <i class="fa-solid fa-comment-dots"></i> Conversar (DM)
                        </button>
                        ${followBtn}
                    </div>
                    <div class="flex items-center gap-2">
                        ${friendBtn}
                        ${matchBtn}
                    </div>
                    <div class="pt-1 flex items-center justify-between border-t border-white/5 text-xs">
                        <span class="text-[10px] text-zinc-500 uppercase font-bold">Curtir Perfil:</span>
                        ${profileLikeWidget}
                    </div>
                `;
            }

            $('#miniProfileActions').html(actionsHtml);
        });
    };

    TFL.openUserProfileView = function (targetAvatarId) {
        const targetId = Number(targetAvatarId);
        if (!targetId) return;
        const ACTIVE_AVATAR_ID = TFL.getActiveAvatarId();

        currentViewedProfileId = targetId;
        $('#modalMiniProfile, #modalGroupParticipants, #modalPhotoViewer, #modalMiniReelViewer').addClass('hidden');

        $('.view-panel').addClass('hidden');
        $('#view-user-profile').removeClass('hidden');

        $('#userProfileName').text('Carregando perfil...');
        $('#userProfileBio').text('');
        $('#tabUserProfilePosts').html('<div class="p-6 text-center text-xs text-zinc-500"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Carregando mural...</div>');

        $.get(`/profile/social/avatar/${targetId}`, { viewerId: ACTIVE_AVATAR_ID }, function (res) {
            if (!res.success || !res.avatar) return;

            const av = res.avatar;
            const st = res.stats || {};
            const rel = res.relation || {};
            const priv = res.privacy || {};

            if (av.coverUrl) {
                $('#userProfileCoverImg').attr('src', av.coverUrl).removeClass('hidden');
            } else {
                $('#userProfileCoverImg').attr('src', '').addClass('hidden');
            }

            if (rel.isSelf) {
                $('#userProfileEditCoverBox').removeClass('hidden');
            } else {
                $('#userProfileEditCoverBox').addClass('hidden');
            }

            if (rel.matchStatus === 'matched') {
                $('#userProfileMatchBadge').removeClass('hidden');
            } else {
                $('#userProfileMatchBadge').addClass('hidden');
            }

            if (res.currentFeeling && (res.currentFeeling.feelingEmoji || res.currentFeeling.feelingLabel)) {
                const cf = res.currentFeeling;
                $('#userProfileFeelingBadge')
                    .text(`${cf.feelingEmoji || ''} Sentindo-se ${cf.feelingLabel || ''} • ${cf.feelingRemainingHours || 1}h restantes`)
                    .removeClass('hidden');
            } else {
                $('#userProfileFeelingBadge').addClass('hidden');
            }

            $('#userProfileIdBadge').text(`Avatar #${av.id}`);
            $('#userProfileAvatarImg').attr('src', TFL.getAvatarThumb(av));
            $('#userProfileName').text(av.name || `Avatar #${av.id}`);
            $('#userProfileGenderBadge').text(av.gender === 0 ? 'Feminino' : 'Masculino');
            $('#userProfileBio').text(av.bio || 'Sem biografia informada.');

            $('#userProfileStatPosts').text(st.postsCount || 0);
            $('#userProfileStatPhotos').text(st.photosCount || 0);
            $('#userProfileStatFriends').text(st.friendsCount || 0);
            $('#userProfileStatFollowers').text(st.followersCount || 0);
            $('#userProfileStatRooms').text(st.roomsCount || 0);
            $('#userProfileStatLikes').text(st.profileLikesCount || 0);

            let headerBtns = '';
            if (rel.isSelf) {
                headerBtns = `
                    <button type="button" class="btn-open-upload-gallery-modal px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20">
                        <i class="fa-solid fa-camera"></i> + Foto na Galeria
                    </button>
                    <button type="button" id="btnTriggerEditFromPublicProfile" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-blue-600/20">
                        <i class="fa-solid fa-pen-to-square"></i> Editar Perfil & Capa
                    </button>
                `;
            } else {
                headerBtns += `
                    <div class="px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 flex items-center gap-1.5">
                        ${TFL.buildReactionBarHtml('profile', av.id, rel.profileLikedByMe, rel.myProfileReaction, st.profileLikesCount || 0, rel.profileReactionsSummary, true)}
                    </div>
                `;
                headerBtns += TFL.buildMatchButtonHtml(av.id, rel.matchStatus, '');
                headerBtns += `
                    <button type="button" class="btn-open-dm px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-sky-600/20"
                            data-profileid="${av.id}" data-name="${TFL.escapeHtml(av.name)}">
                        <i class="fa-solid fa-comment-dots"></i> Mensagem
                    </button>
                `;

                if (rel.friendStatus === 'friends') {
                    headerBtns += `
                        <span class="px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                            <i class="fa-solid fa-user-check mr-1"></i>Amigos
                        </span>
                    `;
                } else if (rel.friendStatus === 'pending_sent') {
                    headerBtns += `
                        <span class="px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold">
                            <i class="fa-solid fa-clock mr-1"></i>Convite Pendente
                        </span>
                    `;
                } else if (rel.friendStatus === 'pending_received') {
                    headerBtns += `
                        <button type="button" class="btn-accept-friend px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                                data-id="${rel.friendshipId}">
                            <i class="fa-solid fa-check mr-1"></i>Aceitar Convite
                        </button>
                    `;
                } else {
                    headerBtns += `
                        <button type="button" class="btn-send-friend-request px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                                data-targetid="${av.id}">
                            <i class="fa-solid fa-user-plus mr-1"></i>Adicionar Amigo
                        </button>
                    `;
                }

                headerBtns += `
                    <button type="button" class="btn-toggle-follow px-4 py-2 rounded-xl border text-xs font-bold transition ${rel.isFollowing ? 'bg-sky-500/20 border-sky-500/40 text-sky-300' : 'bg-slate-950 border-white/10 text-zinc-300 hover:text-white'}"
                            data-targetid="${av.id}">
                        <i class="fa-solid fa-star mr-1"></i>
                        <span>${rel.isFollowing ? 'Seguindo' : 'Seguir'}</span>
                    </button>
                `;
            }
            $('#userProfileActionsContainer').html(headerBtns);

            function buildSectionPrivacyBarHtml(field, currentVal, labelText, colorClass, fullSpan) {
                const val = currentVal || 'public';
                return `
                    <div class="${fullSpan ? 'col-span-full ' : ''}flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-900/90 border border-white/10">
                        <span class="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                            <i class="fa-solid fa-shield-halved ${colorClass}"></i>
                            ${labelText}
                        </span>
                        <div class="flex items-center gap-2 bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5">
                            <select class="select-section-privacy bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer" data-field="${field}">
                                <option value="public" class="bg-slate-900" ${val === 'public' ? 'selected' : ''}>🌐 Público (Todos)</option>
                                <option value="friends" class="bg-slate-900" ${val === 'friends' ? 'selected' : ''}>👥 Apenas Amigos</option>
                                <option value="private" class="bg-slate-900" ${val === 'private' ? 'selected' : ''}>🔒 Privado (Somente Eu)</option>
                            </select>
                            <span class="privacy-save-status text-[10px] text-emerald-400 font-bold hidden">Salvo ✔</span>
                        </div>
                    </div>
                `;
            }

            // Aba 1: Publicações
            const postsContainer = $('#tabUserProfilePosts');
            postsContainer.empty();
            if (rel.isSelf) {
                postsContainer.append(buildSectionPrivacyBarHtml('privacyPosts', priv.privacyPosts, 'Privacidade das suas Publicações:', 'text-blue-400', false));
            }
            if (!priv.canViewPosts) {
                const lockReason = priv.privacyPosts === 'friends'
                    ? '🔒 Este usuário configurou as publicações para serem visíveis apenas para amigos.'
                    : '🔒 Este usuário mantém as publicações privadas.';
                postsContainer.append(`<div class="p-8 rounded-2xl bg-slate-900/60 border border-white/10 text-center text-xs text-amber-400 font-bold">${lockReason}</div>`);
            } else {
                const posts = res.posts || [];
                if (posts.length === 0) {
                    postsContainer.append('<div class="p-8 rounded-2xl bg-slate-900/50 border border-dashed border-white/10 text-center text-xs text-zinc-500">Este avatar ainda não publicou nada no mural.</div>');
                } else {
                    posts.forEach(p => postsContainer.append(TFL.buildPostCardHtml(p)));
                }
            }

            // Aba 2: Galeria de Fotos
            const photosContainer = $('#tabUserProfilePhotos');
            photosContainer.empty();
            if (rel.isSelf) {
                const photoPrivVal = priv.privacyPhotos || 'public';
                photosContainer.append(`
                    <div class="col-span-full flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-amber-500/25">
                        <span class="text-xs font-bold text-zinc-300"><i class="fa-solid fa-images text-amber-400 mr-1.5"></i>Gerencie as fotos e privacidade da sua Galeria</span>
                        <div class="flex flex-wrap items-center gap-2">
                            <div class="flex items-center gap-1.5 bg-slate-950 border border-white/10 rounded-xl px-2.5 py-1.5">
                                <i class="fa-solid fa-shield-halved text-amber-400 text-[11px]"></i>
                                <span class="text-[10px] font-bold uppercase text-zinc-400">Visibilidade:</span>
                                <select class="select-section-privacy bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer" data-field="privacyPhotos">
                                    <option value="public" class="bg-slate-900" ${photoPrivVal === 'public' ? 'selected' : ''}>🌐 Público</option>
                                    <option value="friends" class="bg-slate-900" ${photoPrivVal === 'friends' ? 'selected' : ''}>👥 Amigos</option>
                                    <option value="private" class="bg-slate-900" ${photoPrivVal === 'private' ? 'selected' : ''}>🔒 Privado</option>
                                </select>
                                <span class="privacy-save-status text-[10px] text-emerald-400 font-bold hidden">Salvo ✔</span>
                            </div>
                            <button type="button" class="btn-open-upload-gallery-modal px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase transition">
                                + Adicionar Foto
                            </button>
                        </div>
                    </div>
                `);
            }
            if (!priv.canViewPhotos) {
                const lockReason = priv.privacyPhotos === 'friends'
                    ? '🔒 Este usuário configurou a galeria de fotos para ser visível apenas para amigos.'
                    : '🔒 Este usuário mantém a galeria de fotos privada.';
                photosContainer.append(`<div class="col-span-full p-8 rounded-2xl bg-slate-900/60 border border-white/10 text-center text-xs text-amber-400 font-bold">${lockReason}</div>`);
            } else {
                const photos = res.photos || [];
                if (photos.length === 0) {
                    photosContainer.append('<div class="col-span-full p-8 rounded-2xl bg-slate-900/50 border border-dashed border-white/10 text-center text-xs text-zinc-500">Nenhuma foto publicada por este avatar ainda.</div>');
                } else {
                    photos.forEach(ph => {
                        photosContainer.append(`
                            <div class="group relative rounded-2xl overflow-hidden border border-white/10 bg-slate-950 aspect-square cursor-pointer btn-open-photo-viewer"
                                 data-photoid="${ph.id}">
                                <img src="${ph.url}" alt="Foto" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                                ${rel.isSelf ? `
                                    <button type="button" class="btn-delete-gallery-photo absolute top-2 right-2 w-7 h-7 rounded-full bg-black/75 hover:bg-red-600 text-white text-xs flex items-center justify-center transition z-10"
                                            data-photoid="${ph.id}" title="Excluir foto da galeria">
                                        <i class="fa-solid fa-trash-can"></i>
                                    </button>
                                ` : ''}
                                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-3">
                                    <p class="text-[11px] text-white font-semibold truncate">${TFL.escapeHtml(ph.description || 'Ver foto e comentários')}</p>
                                    <div class="flex items-center gap-3 text-xs text-zinc-200 mt-1 font-bold">
                                        <span>❤️ ${ph.likesCount || 0}</span>
                                        <span>💬 ${ph.commentsCount || 0}</span>
                                    </div>
                                </div>
                            </div>
                        `);
                    });
                }
            }

            // Aba 3: Salas 3D
            const roomsContainer = $('#tabUserProfileRooms');
            roomsContainer.empty();
            if (rel.isSelf) {
                roomsContainer.append(buildSectionPrivacyBarHtml('privacyRooms', priv.privacyRooms, 'Privacidade da sua Lista de Salas:', 'text-purple-400', true));
            }
            if (!priv.canViewRooms) {
                const lockReason = priv.privacyRooms === 'friends'
                    ? '🔒 Este usuário configurou a lista de salas para ser visível apenas para amigos.'
                    : '🔒 Este usuário mantém a lista de salas privada.';
                roomsContainer.append(`<div class="col-span-full p-8 rounded-2xl bg-slate-900/60 border border-white/10 text-center text-xs text-amber-400 font-bold">${lockReason}</div>`);
            } else {
                const rooms = res.rooms || [];
                if (rooms.length === 0) {
                    roomsContainer.append('<div class="col-span-full p-8 rounded-2xl bg-slate-900/50 border border-dashed border-white/10 text-center text-xs text-zinc-500">Nenhuma sala criada por este avatar.</div>');
                } else {
                    rooms.forEach(r => {
                        const entryVal = parseFloat(r.entryValue || 0) || 0;
                        const totalVisits = Number(r.visits || 0);
                        const monthlyUnique = Number(r.monthlyUniqueVisits || 0);
                        const progressPct = Math.min(100, Math.round(((monthlyUnique % 1000) / 1000) * 100));
                        const rewardPer1k = Number(r.rewardPer1kCoins ?? 50);
                        const passHours = Number(r.passDurationHours ?? 24);
                        const hasPass = Boolean(r.hasActivePass);
                        const entryBadge = entryVal > 0
                            ? `<span class="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/15 text-amber-400 border border-amber-500/30"><i class="fa-solid fa-ticket mr-1"></i>Passe ${passHours}h: ${entryVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} Coins</span>`
                            : `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">Entrada Grátis</span>`;
                        const activePassBadge = hasPass
                            ? `<span class="px-2 py-0.5 rounded text-[10px] font-black bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"><i class="fa-solid fa-circle-check mr-1"></i>Passe Ativo</span>`
                            : '';

                        roomsContainer.append(`
                            <div class="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col justify-between gap-3">
                                <div class="space-y-2.5">
                                    <div class="flex items-center justify-between gap-2">
                                        <h5 class="text-xs font-black uppercase text-white truncate">${TFL.escapeHtml(r.name)}</h5>
                                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${r.isPrivate ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'}">${r.isPrivate ? 'Privada 🔒' : 'Pública 🌐'}</span>
                                    </div>
                                    <div class="flex flex-wrap items-center gap-1.5">
                                        ${entryBadge}
                                        ${activePassBadge}
                                    </div>
                                    <p class="text-[11px] text-zinc-400 line-clamp-2">${TFL.escapeHtml(r.description || 'Espaço 3D no metaverso')}</p>
                                    <div class="p-2.5 rounded-xl bg-slate-950/80 border border-white/5 space-y-1.5">
                                        <div class="flex items-center justify-between text-[10px]">
                                            <span class="text-zinc-400 font-bold"><i class="fa-solid fa-eye text-amber-400 mr-1"></i>Total: <strong class="text-white">${totalVisits.toLocaleString('pt-BR')}</strong></span>
                                            <span class="text-zinc-400 font-bold"><i class="fa-solid fa-calendar-check text-emerald-400 mr-1"></i>Únicas/Mês: <strong class="text-emerald-400">${monthlyUnique.toLocaleString('pt-BR')}</strong>/1.000</span>
                                        </div>
                                        <div class="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                                            <div class="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full" style="width: ${progressPct}%"></div>
                                        </div>
                                        <div class="flex items-center justify-between text-[9px] text-zinc-500">
                                            <span>Capacidade: ${r.maxPlayers || 30} jogadores</span>
                                            <span class="text-emerald-400 font-bold"><i class="fa-solid fa-trophy mr-0.5"></i>+${rewardPer1k.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} Coins / 1k</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="pt-2.5 border-t border-white/5 flex items-center justify-between gap-2">
                                    ${TFL.buildReactionBarHtml('room', r.id, r.likedByMe, r.myReaction, r.likesCount || 0, r.reactionsSummary, true)}
                                    <button type="button"
                                            class="btn-enter-room-pass px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                                            data-room-id="${r.id}">
                                        <i class="fa-solid fa-door-open"></i>
                                        ${entryVal > 0 && !hasPass && !rel.isSelf ? `Passe (${entryVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} C)` : 'Entrar'}
                                    </button>
                                </div>
                            </div>
                        `);
                    });
                }
            }

            // Aba 4: Amigos
            const friendsContainer = $('#tabUserProfileFriends');
            friendsContainer.empty();
            if (rel.isSelf) {
                friendsContainer.append(buildSectionPrivacyBarHtml('privacyFriends', priv.privacyFriends, 'Privacidade da sua Lista de Amigos:', 'text-emerald-400', true));
            }
            if (!priv.canViewFriends) {
                const lockReason = priv.privacyFriends === 'friends'
                    ? '🔒 Este usuário configurou a lista de amigos para ser visível apenas para amigos.'
                    : '🔒 Este usuário mantém a lista de amigos privada.';
                friendsContainer.append(`<div class="col-span-full p-8 rounded-2xl bg-slate-900/60 border border-white/10 text-center text-xs text-amber-400 font-bold">${lockReason}</div>`);
            } else {
                const friends = res.friends || [];
                if (friends.length === 0) {
                    friendsContainer.append('<div class="col-span-full p-8 rounded-2xl bg-slate-900/50 border border-dashed border-white/10 text-center text-xs text-zinc-500">Nenhum amigo listado ainda.</div>');
                } else {
                    friends.forEach(f => {
                        friendsContainer.append(TFL.buildUserMiniListItemHtml(f));
                    });
                }
            }

            // Aba 5: Seguidores
            const followersContainer = $('#tabUserProfileFollowers');
            followersContainer.empty();
            if (rel.isSelf) {
                followersContainer.append(buildSectionPrivacyBarHtml('privacyFollowers', priv.privacyFollowers, 'Privacidade da sua Lista de Seguidores:', 'text-sky-400', true));
            }
            if (!priv.canViewFollowers) {
                const lockReason = priv.privacyFollowers === 'friends'
                    ? '🔒 Este usuário configurou a lista de seguidores para ser visível apenas para amigos.'
                    : '🔒 Este usuário mantém a lista de seguidores privada.';
                followersContainer.append(`<div class="col-span-full p-8 rounded-2xl bg-slate-900/60 border border-white/10 text-center text-xs text-amber-400 font-bold">${lockReason}</div>`);
            } else {
                const followers = res.followers || [];
                if (followers.length === 0) {
                    followersContainer.append('<div class="col-span-full p-8 rounded-2xl bg-slate-900/50 border border-dashed border-white/10 text-center text-xs text-zinc-500">Nenhum seguidor ainda.</div>');
                } else {
                    followers.forEach(fl => {
                        followersContainer.append(TFL.buildUserMiniListItemHtml(fl));
                    });
                }
            }

            // Aba 6: Matches & Crushes
            const matchesContainer = $('#tabUserProfileMatches');
            matchesContainer.empty();
            const matches = res.matches || [];
            const crushesReceived = res.crushesReceived || [];

            let matchesHtml = `
                <div class="space-y-3">
                    <h4 class="text-xs font-black uppercase tracking-wider text-pink-400 flex items-center gap-2">
                        <i class="fa-solid fa-fire-flame-curved"></i>
                        Matches Mútuos (${matches.length})
                    </h4>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        ${matches.length > 0
                            ? matches.map(m => TFL.buildUserMiniListItemHtml(m, true)).join('')
                            : '<div class="col-span-full p-6 rounded-2xl bg-slate-900/40 border border-dashed border-white/10 text-center text-xs text-zinc-500">Nenhum Match mútuo ainda. Clique em "Dar Match 💘" nos perfis para combinar!</div>'}
                    </div>
                </div>
            `;

            if (rel.isSelf && crushesReceived.length > 0) {
                matchesHtml += `
                    <div class="space-y-3 pt-4 border-t border-white/10">
                        <h4 class="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                            <i class="fa-solid fa-heart-circle-bolt"></i>
                            Deram Crush em Você (${crushesReceived.length}) — Dê Match de volta!
                        </h4>
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                            ${crushesReceived.map(c => `
                                <div class="p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/30 flex items-center justify-between gap-2.5">
                                    <button type="button" class="btn-open-mini-profile flex items-center gap-2.5 overflow-hidden text-left group flex-1" data-avatarid="${c.id}">
                                        <img src="${TFL.getAvatarThumb(c)}" class="w-10 h-10 rounded-xl object-cover flex-shrink-0">
                                        <div class="overflow-hidden">
                                            <div class="text-xs font-bold text-white group-hover:text-pink-400 transition truncate">${TFL.escapeHtml(c.name)}</div>
                                            <div class="text-[10px] text-amber-400">💘 Te deu Crush!</div>
                                        </div>
                                    </button>
                                    <button type="button" class="btn-toggle-match px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-[11px] font-bold transition" data-targetid="${c.id}">
                                        Dar Match 💘
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            matchesContainer.html(matchesHtml);
        });
    };

    // ================= 2. LIGHTBOX DE FOTO =================
    TFL.openPhotoViewer = function (photoId) {
        const pId = Number(photoId);
        if (!pId) return;
        const ACTIVE_AVATAR_ID = TFL.getActiveAvatarId();

        $('#activePhotoViewerId').val(pId);
        $('#photoViewerImg').attr('src', '');
        $('#photoViewerCommentsList').html('<div class="text-center py-6 text-xs text-zinc-500"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Carregando foto e comentários...</div>');
        $('#modalPhotoViewer').removeClass('hidden');

        $.get(`/profile/social/photos/${pId}`, { viewerId: ACTIVE_AVATAR_ID }, function (res) {
            if (!res.success || !res.photo) return;
            const ph = res.photo;
            const author = ph.profile || { id: ph.profileId, name: 'Viajante' };

            $('#photoViewerImg').attr('src', ph.url);
            $('#photoViewerDescription').text(ph.description || 'Foto publicada na rede social');

            $('#photoViewerAuthorBox').html(`
                <button type="button" class="btn-open-mini-profile flex items-center gap-2.5 text-left" data-avatarid="${author.id}">
                    <img src="${TFL.getAvatarThumb(author)}" class="w-9 h-9 rounded-xl object-cover border border-white/10">
                    <div>
                        <div class="text-xs font-black text-white hover:text-sky-400 transition">${TFL.escapeHtml(author.name)}</div>
                        <div class="text-[10px] text-zinc-500">Foto #${ph.id}</div>
                    </div>
                </button>
            `);

            $('#photoViewerReactionBar').html(
                TFL.buildReactionBarHtml('photo', ph.id, ph.likedByMe, ph.myReaction, ph.likesCount || 0, ph.reactionsSummary, false)
            );

            const commentsList = $('#photoViewerCommentsList');
            commentsList.empty();
            const comments = Array.isArray(ph.comments) ? ph.comments : [];
            if (comments.length === 0) {
                commentsList.html('<p class="text-xs text-zinc-500 text-center py-6">Seja o primeiro a comentar nesta imagem!</p>');
            } else {
                comments.forEach(c => {
                    commentsList.append(TFL.buildRecursiveCommentHtml(c, 0));
                });
            }
        });
    };

    // ================= 3. MINI REELS (24H FOTO/TEXTO & 6H SENTIMENTO) =================
    TFL.carregarMiniReels = function () {
        const carousel = $('#miniReelsCarousel');
        if (!carousel.length) return;
        const ACTIVE_AVATAR_ID = TFL.getActiveAvatarId();

        $.get('/profile/social/reels', { avatarId: ACTIVE_AVATAR_ID }, function (res) {
            carousel.empty();
            activeMiniReelsList = res?.reels || [];

            if (res?.myActiveFeeling && (res.myActiveFeeling.feelingEmoji || res.myActiveFeeling.feelingLabel)) {
                const mf = res.myActiveFeeling;
                const labelStr = `${mf.feelingEmoji || ''} Sentindo-se ${mf.feelingLabel || ''}`;
                $('#myActiveFeelingHeaderBadge').text(`${labelStr} (${mf.feelingRemainingHours || 1}h)`).removeClass('hidden');
                $('#sidebarCardMyFeelingText').text(labelStr);
                $('#sidebarCardMyFeelingTimer').text(`⏳ ${mf.feelingRemainingHours || 1}h`);
                $('#sidebarCardMyFeelingBox').removeClass('hidden');
            } else {
                $('#myActiveFeelingHeaderBadge').addClass('hidden');
                $('#sidebarCardMyFeelingBox').addClass('hidden');
            }

            const myAvatarThumb = $('#sidebarAvatarImg').attr('src') || 'https://ui-avatars.com/api/?name=Eu&background=0284c7&color=fff';
            carousel.append(`
                <div class="w-32 sm:w-36 h-48 rounded-2xl bg-slate-950 border border-dashed border-pink-500/40 hover:border-pink-400 flex-shrink-0 flex flex-col justify-between p-3 relative overflow-hidden group cursor-pointer"
                     id="cardQuickCreateReel">
                    <div class="flex items-center justify-between">
                        <img src="${myAvatarThumb}" class="w-9 h-9 rounded-xl object-cover border-2 border-pink-500">
                        <span class="w-7 h-7 rounded-full bg-pink-600 text-white flex items-center justify-center text-xs shadow-lg group-hover:scale-110 transition">
                            <i class="fa-solid fa-plus"></i>
                        </span>
                    </div>
                    <div class="space-y-1 text-left">
                        <div class="text-xs font-black text-white leading-tight">Novo Momento</div>
                        <p class="text-[10px] text-zinc-400 leading-tight">📸 Foto/Texto 24h<br>😊 Sentimento 6h</p>
                    </div>
                </div>
            `);

            if (activeMiniReelsList.length === 0) {
                carousel.append(`
                    <div class="h-48 px-6 rounded-2xl bg-slate-950/50 border border-white/5 flex flex-col items-center justify-center text-center text-xs text-zinc-500">
                        <p class="font-bold text-zinc-400">Nenhum Mini Reel ou Sentimento ativo no momento.</p>
                        <p class="text-[11px] mt-0.5">Compartilhe uma foto/texto (24h) ou como está se sentindo agora (6h)!</p>
                    </div>
                `);
                return;
            }

            activeMiniReelsList.forEach((reel, idx) => {
                const author = reel.profile || { id: reel.profileId, name: 'Viajante' };
                const hasFeeling = !!(reel.feelingEmoji || reel.feelingLabel);
                const isPureFeeling = reel.type === 'feeling';
                const timeBadge = isPureFeeling
                    ? `⏳ ${reel.feelingRemainingHours || reel.remainingHours || 1}h (6h)`
                    : `⏳ ${reel.remainingHours || 1}h (24h)`;

                carousel.append(`
                    <div class="btn-open-mini-reel-viewer w-32 sm:w-36 h-48 rounded-2xl border border-white/15 hover:border-pink-400 flex-shrink-0 flex flex-col justify-between p-3 relative overflow-hidden cursor-pointer group bg-gradient-to-br ${TFL.escapeHtml(reel.bgStyle || 'from-blue-700 via-indigo-800 to-purple-900')} shadow-lg"
                         data-reelindex="${idx}">
                        ${reel.imageUrl ? `
                            <img src="${reel.imageUrl}" alt="Reel" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-300">
                        ` : ''}
                        <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/50"></div>

                        <div class="relative z-10 flex items-center justify-between gap-1">
                            <img src="${TFL.getAvatarThumb(author)}" class="w-8 h-8 rounded-xl object-cover border-2 ${isPureFeeling ? 'border-amber-400' : 'border-pink-500'} flex-shrink-0">
                            <span class="px-1.5 py-0.5 rounded-full bg-black/70 text-[9px] font-bold ${isPureFeeling ? 'text-amber-300' : 'text-sky-300'}">${timeBadge}</span>
                        </div>

                        <div class="relative z-10 my-auto text-center px-1">
                            ${hasFeeling ? `
                                <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/30 border border-amber-400/50 text-amber-200 text-[10px] font-black mb-1">
                                    <span>${TFL.escapeHtml(reel.feelingEmoji)}</span>
                                    <span class="truncate max-w-[75px]">${TFL.escapeHtml(reel.feelingLabel)}</span>
                                </div>
                            ` : ''}
                            ${reel.text ? `
                                <p class="text-[11px] font-bold text-white line-clamp-3 drop-shadow">${TFL.escapeHtml(reel.text)}</p>
                            ` : ''}
                        </div>

                        <div class="relative z-10 flex items-center justify-between text-[10px] text-zinc-200 font-bold">
                            <span class="truncate max-w-[75px]">${TFL.escapeHtml(author.name)}</span>
                            <span class="flex items-center gap-1 text-pink-300">❤️ ${reel.likesCount || 0}</span>
                        </div>
                    </div>
                `);
            });
        });
    };

    TFL.setCreateReelMode = function (mode) {
        $('#inputReelType').val(mode);
        $('.btn-reel-mode-tab').removeClass('bg-pink-600 text-white').addClass('text-zinc-400 hover:text-white');
        $(`.btn-reel-mode-tab[data-mode="${mode}"]`).removeClass('text-zinc-400 hover:text-white').addClass('bg-pink-600 text-white');

        if (mode === 'photo') {
            $('#reelPhotoInputSection').removeClass('hidden');
            $('#reelBgStyleSection').addClass('hidden');
            $('#labelReelTextInput').text('Legenda da Foto (Dura 24h • Sentimento opcional dura 6h)');
        } else if (mode === 'text') {
            $('#reelPhotoInputSection').addClass('hidden');
            $('#reelBgStyleSection').removeClass('hidden');
            $('#labelReelTextInput').text('Texto do Mini Reel (Dura 24h • Sentimento opcional dura 6h)');
        } else if (mode === 'feeling') {
            $('#reelPhotoInputSection').addClass('hidden');
            $('#reelBgStyleSection').removeClass('hidden');
            $('#labelReelTextInput').text('Nota curta sobre como você está se sentindo (Dura 6 horas)');
        }
    };

    TFL.renderActiveMiniReelInModal = function (index) {
        if (!activeMiniReelsList.length) return;
        if (index < 0) index = activeMiniReelsList.length - 1;
        if (index >= activeMiniReelsList.length) index = 0;
        currentMiniReelIndex = index;
        const ACTIVE_AVATAR_ID = TFL.getActiveAvatarId();

        const reel = activeMiniReelsList[currentMiniReelIndex];
        const author = reel.profile || { id: reel.profileId, name: 'Viajante' };
        const isMine = Number(reel.profileId) === ACTIVE_AVATAR_ID;

        $('#activeMiniReelViewerId').val(reel.id);
        $('#reelViewerIndexCounter').text(`${currentMiniReelIndex + 1} / ${activeMiniReelsList.length}`);

        const stage = $('#reelViewerStage');
        stage.attr('class', `md:col-span-7 relative min-h-[380px] sm:min-h-[520px] flex flex-col justify-between p-5 bg-gradient-to-br ${reel.bgStyle || 'from-blue-700 via-indigo-800 to-purple-900'} overflow-hidden`);

        if (reel.imageUrl) {
            $('#reelViewerBgImg').attr('src', reel.imageUrl).removeClass('hidden');
        } else {
            $('#reelViewerBgImg').attr('src', '').addClass('hidden');
        }

        $('#reelViewerAuthorBox').html(`
            <button type="button" class="btn-open-mini-profile flex items-center gap-2.5 text-left" data-avatarid="${author.id}">
                <img src="${TFL.getAvatarThumb(author)}" class="w-10 h-10 rounded-xl object-cover border-2 border-white/30">
                <div>
                    <div class="text-xs font-black text-white hover:text-sky-300 transition">${TFL.escapeHtml(author.name)}</div>
                    <div class="text-[10px] text-zinc-300">${reel.type === 'feeling' ? 'Sentimento (6h)' : 'Mini Reel (24h)'}</div>
                </div>
            </button>
        `);

        if (reel.type === 'feeling') {
            $('#reelViewerDurationBadge').text(`⏳ Sentimento expira em ${reel.feelingRemainingHours || reel.remainingHours || 1}h (Duração: 6h)`);
        } else {
            $('#reelViewerDurationBadge').text(`⏳ Expira em ${reel.remainingHours || 1}h (Duração: 24h)`);
        }

        if (isMine) {
            $('#btnDeleteActiveReel').removeClass('hidden').data('reelid', reel.id);
        } else {
            $('#btnDeleteActiveReel').addClass('hidden');
        }

        if (reel.feelingEmoji || reel.feelingLabel) {
            $('#reelViewerFeelingPill')
                .html(`<span>${TFL.escapeHtml(reel.feelingEmoji)}</span><span>Sentindo-se ${TFL.escapeHtml(reel.feelingLabel)}</span><span class="text-[10px] text-amber-300/80 ml-1">(${reel.feelingRemainingHours || 1}h)</span>`)
                .removeClass('hidden');
        } else {
            $('#reelViewerFeelingPill').addClass('hidden');
        }

        $('#reelViewerTextContent').text(reel.text || '');

        $('#reelViewerReactionBar').html(
            TFL.buildReactionBarHtml('reel', reel.id, reel.likedByMe, reel.myReaction, reel.likesCount || 0, reel.reactionsSummary, false)
        );

        const commentsList = $('#reelViewerCommentsList');
        commentsList.empty();
        const comments = Array.isArray(reel.comments) ? reel.comments : [];
        if (comments.length === 0) {
            commentsList.html('<p class="text-xs text-zinc-500 text-center py-6">Nenhum comentário neste Mini Reel ainda.</p>');
        } else {
            comments.forEach(c => {
                commentsList.append(TFL.buildRecursiveCommentHtml(c, 0));
            });
        }

        $('#modalMiniReelViewer').removeClass('hidden');
    };

    // ================= 4. GALERIA DE FOTOS =================
    TFL.carregarGaleriaFotos = function () {
        const grid = $('#socialPhotoGalleryGrid');
        if (!grid.length) return;
        const ACTIVE_AVATAR_ID = TFL.getActiveAvatarId();

        grid.html('<div class="col-span-full p-8 text-center text-xs text-zinc-500"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Carregando fotos da galeria...</div>');

        $.get('/profile/social/gallery', { avatarId: ACTIVE_AVATAR_ID, filter: currentGalleryFilter }, function (res) {
            grid.empty();
            const photos = res?.photos || [];
            if (photos.length === 0) {
                grid.html('<div class="col-span-full p-8 rounded-2xl bg-slate-950/60 border border-dashed border-white/10 text-center text-xs text-zinc-500">Nenhuma foto encontrada neste filtro da galeria. Clique em "+ Adicionar Foto na Galeria" para enviar!</div>');
                return;
            }

            photos.forEach(ph => {
                const author = ph.profile || { id: ph.profileId, name: 'Viajante' };
                const isMine = Number(ph.profileId) === ACTIVE_AVATAR_ID;
                grid.append(`
                    <div class="group relative rounded-2xl overflow-hidden border border-white/10 bg-slate-950 aspect-square cursor-pointer btn-open-photo-viewer shadow-lg"
                         data-photoid="${ph.id}">
                        <img src="${ph.url}" alt="Foto" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                        ${isMine ? `
                            <button type="button" class="btn-delete-gallery-photo absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/75 hover:bg-red-600 text-white text-xs flex items-center justify-center transition z-10"
                                    data-photoid="${ph.id}" title="Excluir foto">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        ` : ''}
                        <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-between p-3">
                            <div class="flex items-center gap-2">
                                <img src="${TFL.getAvatarThumb(author)}" class="w-6 h-6 rounded-lg object-cover border border-white/20">
                                <span class="text-[10px] font-bold text-white truncate drop-shadow">${TFL.escapeHtml(author.name)}</span>
                            </div>
                            <div>
                                ${ph.description ? `<p class="text-[11px] text-zinc-200 font-semibold truncate">${TFL.escapeHtml(ph.description)}</p>` : ''}
                                <div class="flex items-center justify-between text-xs text-white font-bold mt-1">
                                    <span>❤️ ${ph.likesCount || 0}</span>
                                    <span>💬 ${ph.commentsCount || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `);
            });
        });
    };

    // ================= 5. FEED DE PUBLICAÇÕES =================
    TFL.buildPostCardHtml = function (post) {
        const ACTIVE_AVATAR_ID = TFL.getActiveAvatarId();
        const author = post.profile || { id: post.profileId, name: 'Viajante' };
        const thumb = TFL.getAvatarThumb(author);
        const isMine = Number(post.profileId) === ACTIVE_AVATAR_ID;
        const dateStr = post.createdAt ? new Date(post.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '';

        let imageHtml = '';
        if (post.mainImage) {
            const ph = post.mainPhoto;
            if (ph && ph.id) {
                imageHtml = `
                    <div class="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-950 max-h-96 group">
                        <img src="${post.mainImage}" alt="Foto do Post" class="w-full max-h-96 object-cover cursor-pointer btn-open-photo-viewer" data-photoid="${ph.id}">
                        <div class="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-slate-950/90 border-t border-white/10 text-xs">
                            <div class="flex items-center gap-2">
                                <span class="text-[10px] font-bold uppercase text-zinc-400"><i class="fa-regular fa-image text-blue-400 mr-1"></i>Ações da Imagem:</span>
                                ${TFL.buildReactionBarHtml('photo', ph.id, ph.likedByMe, ph.myReaction, ph.likesCount || 0, ph.reactionsSummary, true)}
                            </div>
                            <button type="button" class="btn-open-photo-viewer px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-blue-600 text-zinc-300 hover:text-white text-[11px] font-bold transition flex items-center gap-1.5"
                                    data-photoid="${ph.id}">
                                <i class="fa-regular fa-comments"></i>
                                <span>Comentar Foto (${ph.commentsCount || 0})</span>
                            </button>
                        </div>
                    </div>
                `;
            } else {
                imageHtml = `
                    <div class="rounded-2xl overflow-hidden border border-white/10 bg-slate-950 max-h-96">
                        <img src="${post.mainImage}" alt="Foto do Post" class="w-full max-h-96 object-cover">
                    </div>
                `;
            }
        }

        let roomHtml = '';
        if (post.room && post.room.id) {
            const rm = post.room;
            const rmEntryVal = parseFloat(rm.entryValue || 0) || 0;
            const rmVisits = Number(rm.visits || 0);
            const rmEntryLabel = rmEntryVal > 0
                ? `<span class="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-black"><i class="fa-solid fa-ticket mr-1"></i>Passe 24h: ${rmEntryVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} Coins</span>`
                : `<span class="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">Entrada Grátis</span>`;
            roomHtml = `
                <div class="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex flex-wrap items-center justify-between gap-3">
                    <div class="flex items-center gap-3 overflow-hidden">
                        <div class="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 flex-shrink-0">
                            <i class="fa-solid fa-door-open"></i>
                        </div>
                        <div class="overflow-hidden space-y-0.5">
                            <div class="flex flex-wrap items-center gap-1.5">
                                <span class="text-xs font-black uppercase text-white truncate">🏠 Sala 3D: ${TFL.escapeHtml(rm.name)}</span>
                                ${rmEntryLabel}
                                <span class="text-[10px] text-zinc-400 font-bold"><i class="fa-solid fa-eye text-amber-400 mr-1"></i>${rmVisits.toLocaleString('pt-BR')} visitas</span>
                            </div>
                            <div class="text-[11px] text-zinc-400 truncate">${TFL.escapeHtml(rm.description || 'Espaço 3D no metaverso')}</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        ${TFL.buildReactionBarHtml('room', rm.id, rm.likedByMe, rm.myReaction, rm.likesCount || 0, rm.reactionsSummary, true)}
                        <button type="button"
                                class="btn-enter-room-pass px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1.5"
                                data-room-id="${rm.id}">
                            <i class="fa-solid fa-door-open"></i> Entrar
                        </button>
                    </div>
                </div>
            `;
        }

        let sharedHtml = '';
        if (post.sharedPost && post.sharedPost.id) {
            const sp = post.sharedPost;
            const spAuthor = sp.profile || { id: sp.profileId, name: 'Viajante' };
            const spImg = sp.imageUrl || (sp.photos && sp.photos[0] ? sp.photos[0].url : '');
            sharedHtml = `
                <div class="p-3.5 rounded-2xl bg-slate-950/90 border border-white/10 space-y-2">
                    <div class="flex items-center gap-2">
                        <button type="button" class="btn-open-mini-profile flex items-center gap-2" data-avatarid="${spAuthor.id}">
                            <img src="${TFL.getAvatarThumb(spAuthor)}" class="w-6 h-6 rounded-lg object-cover">
                            <span class="text-xs font-bold text-sky-400 hover:underline">${TFL.escapeHtml(spAuthor.name)}</span>
                        </button>
                        <span class="text-[10px] text-zinc-500">• Publicação compartilhada</span>
                    </div>
                    ${sp.title ? `<div class="text-xs font-bold text-white">${TFL.escapeHtml(sp.title)}</div>` : ''}
                    ${sp.text ? `<p class="text-xs text-zinc-400 whitespace-pre-line">${TFL.escapeHtml(sp.text)}</p>` : ''}
                    ${spImg ? `<img src="${spImg}" class="rounded-xl max-h-60 object-cover border border-white/5">` : ''}
                </div>
            `;
        }

        const comments = Array.isArray(post.comments) ? post.comments : [];
        let commentsListHtml = '';
        comments.forEach(c => {
            commentsListHtml += TFL.buildRecursiveCommentHtml(c, 0);
        });

        return `
            <article class="bg-slate-900/80 border border-white/10 rounded-3xl p-5 shadow-xl space-y-3.5" data-postid="${post.id}">
                <div class="flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3 overflow-hidden">
                        <button type="button" class="btn-open-mini-profile w-11 h-11 rounded-xl overflow-hidden bg-slate-950 border border-blue-500/30 flex-shrink-0 hover:scale-105 transition"
                                data-avatarid="${author.id}" title="Ver Mini Profile">
                            <img src="${thumb}" class="w-full h-full object-cover">
                        </button>
                        <div class="overflow-hidden">
                            <div class="flex items-center gap-2 flex-wrap">
                                <button type="button" class="btn-open-mini-profile text-xs font-black text-white hover:text-sky-400 transition truncate"
                                        data-avatarid="${author.id}">
                                    ${TFL.escapeHtml(author.name || 'Viajante')}
                                </button>
                                <button type="button" class="btn-navigate-user-profile text-[10px] text-blue-400 hover:underline font-semibold"
                                        data-avatarid="${author.id}">
                                    Ver Perfil
                                </button>
                            </div>
                            <span class="text-[10px] text-zinc-500 block">${dateStr}</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-1.5">
                        ${!isMine ? `
                            <button type="button" class="btn-toggle-match px-2.5 py-1.5 rounded-xl bg-pink-600/15 hover:bg-pink-600 text-pink-400 hover:text-white text-[10px] font-bold transition"
                                    data-targetid="${author.id}" title="Dar Match / Crush no autor">
                                <i class="fa-solid fa-fire-flame-curved"></i>
                            </button>
                        ` : ''}
                        ${isMine ? `
                            <button type="button" class="btn-delete-post p-2 rounded-xl bg-slate-950 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 text-xs transition"
                                    data-postid="${post.id}" title="Excluir publicação">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>

                ${post.title ? `<h4 class="text-sm font-black text-white">${TFL.escapeHtml(post.title)}</h4>` : ''}
                ${post.text ? `<p class="text-xs text-zinc-300 leading-relaxed whitespace-pre-line break-words">${TFL.escapeHtml(post.text)}</p>` : ''}
                ${imageHtml}
                ${roomHtml}
                ${sharedHtml}

                <div class="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-white/5 text-xs">
                    <div class="flex flex-wrap items-center gap-4">
                        ${TFL.buildReactionBarHtml('post', post.id, post.likedByMe, post.myReaction, post.likesCount || 0, post.reactionsSummary, false)}

                        <button type="button" class="btn-toggle-post-comments flex items-center gap-1.5 font-bold text-zinc-400 hover:text-sky-400 transition"
                                data-postid="${post.id}">
                            <i class="fa-regular fa-comment text-sm"></i>
                            <span id="commentCountLabel_${post.id}">${post.commentsCount || 0}</span>
                            <span>Comentários</span>
                        </button>
                    </div>

                    <div class="flex items-center gap-2">
                        <button type="button" class="btn-share-post px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-emerald-600/20 border border-white/10 text-zinc-300 hover:text-emerald-300 text-[11px] font-bold transition flex items-center gap-1.5"
                                data-postid="${post.id}" title="Compartilhar / Repostar no seu mural">
                            <i class="fa-solid fa-retweet"></i>
                            <span>Compartilhar</span>
                        </button>
                    </div>
                </div>

                <div id="postCommentsBox_${post.id}" class="pt-2 space-y-2.5 border-t border-white/5">
                    <div id="postCommentsList_${post.id}" class="space-y-2 max-h-80 overflow-y-auto pr-1">
                        ${commentsListHtml}
                    </div>
                    <form class="form-comment-post flex items-center gap-2" data-postid="${post.id}">
                        <input type="text" class="input-comment-text flex-1 bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
                               placeholder="Escreva um comentário nesta publicação...">
                        <button type="submit" class="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition">
                            Comentar
                        </button>
                    </form>
                </div>
            </article>
        `;
    };

    TFL.carregarFeed = function () {
        const container = $('#postsFeedContainer');
        if (!container.length) return;
        const ACTIVE_AVATAR_ID = TFL.getActiveAvatarId();

        $.get('/profile/social/feed', { avatarId: ACTIVE_AVATAR_ID, filter: currentFeedFilter }, function (res) {
            container.empty();
            const posts = res?.posts || [];
            if (posts.length === 0) {
                container.html(`
                    <div class="bg-slate-900/40 border border-dashed border-white/10 rounded-3xl p-8 text-center text-zinc-500 text-xs space-y-1.5">
                        <i class="fa-regular fa-newspaper text-2xl mb-1 text-zinc-600 block"></i>
                        <p class="font-bold text-zinc-400">Nenhuma publicação encontrada neste filtro.</p>
                        <p>Compartilhe uma atualização, foto ou Sala 3D acima para movimentar a rede social!</p>
                    </div>
                `);
                return;
            }
            posts.forEach(function (post) {
                container.append(TFL.buildPostCardHtml(post));
            });
        });
    };

    // ================= EVENT LISTENERS DELEGADOS =================
    $(document).ready(function () {
        $(document).on('click', '.btn-open-mini-profile', function (e) {
            e.stopPropagation();
            const avatarId = $(this).data('avatarid');
            if (avatarId) TFL.openMiniProfile(avatarId);
        });

        $(document).on('click', '.btn-navigate-user-profile', function (e) {
            e.stopPropagation();
            const avatarId = $(this).data('avatarid');
            if (avatarId) TFL.openUserProfileView(avatarId);
        });

        $(document).on('click', '#btnBackFromUserProfile', function () {
            $('.view-panel').addClass('hidden');
            $('#view-social').removeClass('hidden');
            TFL.carregarFeed();
            TFL.carregarMiniReels();
        });

        $(document).on('click', '#btnTriggerEditFromPublicProfile', function () {
            $('#btnOpenEditAvatarModal').trigger('click');
        });

        // Edição direta do Fundo / Capa acima da foto no Perfil Social
        $(document).on('click', '#btnTriggerDirectCoverUpload', function () {
            $('#fileProfileCoverDirect').click();
        });

        $(document).on('change', '#fileProfileCoverDirect', function () {
            const file = this.files[0];
            if (!file) return;
            const ACTIVE_AVATAR_ID = TFL.getActiveAvatarId();

            const formData = new FormData();
            formData.append('photo', file);
            $('#labelDirectCoverUpload').text('Enviando capa...');

            $.ajax({
                url: '/profile/upload/avatar-image',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function (res) {
                    if (res.success && res.url) {
                        $.post('/profile/avatar/customize', {
                            avatarId: ACTIVE_AVATAR_ID,
                            coverUrl: res.url
                        }, function (updateRes) {
                            $('#labelDirectCoverUpload').text('Capa Atualizada ✔');
                            if (updateRes.success) {
                                $('#userProfileCoverImg').attr('src', res.url).removeClass('hidden');
                                $('#btnOpenEditAvatarModal').data('coverurl', res.url);
                                TFL.toast.success('Imagem de fundo / capa atualizada com sucesso!', 'Capa do Perfil');
                            }
                        });
                    } else {
                        TFL.toast.error(res.error || 'Erro ao enviar imagem de capa.');
                        $('#labelDirectCoverUpload').text('Editar Fundo / Capa');
                    }
                },
                error: function () {
                    TFL.toast.error('Erro ao enviar imagem de capa.');
                    $('#labelDirectCoverUpload').text('Editar Fundo / Capa');
                }
            });
        });

        $(document).on('click', '.btn-user-profile-tab', function () {
            const tabId = $(this).data('tab');
            $('.btn-user-profile-tab').removeClass('bg-blue-600 text-white').addClass('bg-slate-900 text-zinc-400');
            $(this).removeClass('bg-slate-900 text-zinc-400').addClass('bg-blue-600 text-white');
            $('.user-profile-tab-panel').addClass('hidden');
            $(`#${tabId}`).removeClass('hidden');
        });

        // Seguir / Deixar de seguir Avatar
        $(document).on('click', '.btn-toggle-follow', function () {
            const btn = $(this);
            const targetId = Number(btn.data('targetid'));
            if (!targetId) return;

            $.post('/profile/social/follow', {
                avatarId: TFL.getActiveAvatarId(),
                targetProfileId: targetId
            }, function (res) {
                if (res.success) {
                    $('#miniProfileFollowers').text(res.followersCount);
                    $('#userProfileStatFollowers').text(res.followersCount);
                    if (res.following) {
                        btn.removeClass('bg-slate-950 border-white/10 text-zinc-300').addClass('bg-sky-500/20 border-sky-500/40 text-sky-300');
                        btn.find('span').text('Seguindo');
                        TFL.toast.info('Você começou a seguir este avatar!', 'Seguindo');
                    } else {
                        btn.removeClass('bg-sky-500/20 border-sky-500/40 text-sky-300').addClass('bg-slate-950 border-white/10 text-zinc-300');
                        btn.find('span').text('Seguir');
                        TFL.toast.info('Você deixou de seguir este avatar.');
                    }
                }
            });
        });

        // Dar Match / Crush em outro Avatar
        $(document).on('click', '.btn-toggle-match', function (e) {
            e.stopPropagation();
            const btn = $(this);
            const targetId = Number(btn.data('targetid'));
            if (!targetId) return;

            $.post('/profile/social/match', {
                avatarId: TFL.getActiveAvatarId(),
                targetProfileId: targetId
            }, function (res) {
                if (!res.success) {
                    return TFL.toast.error(res.error || 'Erro ao enviar Match.');
                }

                if (res.isMutual) {
                    TFL.toast.match('🔥💘 DEU MATCH! Vocês combinaram! Uma conversa privada (DM) foi liberada para vocês no Chat.');
                } else if (res.matchStatus === 'crush_sent') {
                    TFL.toast.info('💘 Crush enviado! Se a pessoa também der Match em você, vocês combinam!');
                }

                if (!$('#modalMiniProfile').hasClass('hidden')) {
                    TFL.openMiniProfile(targetId);
                }
                if (!$('#view-user-profile').hasClass('hidden') && currentViewedProfileId) {
                    TFL.openUserProfileView(currentViewedProfileId);
                } else {
                    const replacement = $(TFL.buildMatchButtonHtml(targetId, res.matchStatus, ''));
                    btn.replaceWith(replacement);
                }
            });
        });

        // Mostrar / ocultar input de resposta recursiva a um comentário
        $(document).on('click', '.btn-toggle-reply-box', function () {
            const commentId = $(this).data('commentid');
            const form = $(`#replyForm_${commentId}`);
            form.toggleClass('hidden');
            if (!form.hasClass('hidden')) {
                form.find('.input-reply-text').focus();
            }
        });

        // Enviar resposta a um comentário (recursivo)
        $(document).on('submit', '.form-reply-comment', function (e) {
            e.preventDefault();
            const form = $(this);
            const parentCommentId = Number(form.data('commentid'));
            const postId = form.data('postid') ? Number(form.data('postid')) : null;
            const photoId = form.data('photoid') ? Number(form.data('photoid')) : null;
            const reelId = form.data('reelid') ? Number(form.data('reelid')) : null;
            const input = form.find('.input-reply-text');
            const text = input.val().trim();
            if (!text || !parentCommentId) return;

            input.val('');
            form.addClass('hidden');

            $.post('/profile/social/comment', {
                avatarId: TFL.getActiveAvatarId(),
                commentId: parentCommentId,
                postId: postId,
                photoId: photoId,
                reelId: reelId,
                text: text
            }, function (res) {
                if (res.success && res.comment) {
                    const replyHtml = TFL.buildRecursiveCommentHtml(res.comment, 1);
                    $(`#commentRepliesContainer_${parentCommentId}`).append(replyHtml);
                    if (postId) {
                        const countEl = $(`#commentCountLabel_${postId}`);
                        countEl.text((parseInt(countEl.text(), 10) || 0) + 1);
                    }
                }
            });
        });

        // Excluir comentário próprio
        $(document).on('click', '.btn-delete-comment', async function () {
            const commentId = $(this).data('commentid');
            if (!commentId) return;

            const confirmed = await TFL.confirm({
                title: 'Excluir Comentário?',
                text: 'Deseja remover este comentário permanentemente?',
                confirmText: 'Excluir',
                danger: true
            });
            if (!confirmed) return;

            $.post(`/profile/social/comments/${commentId}/delete`, { avatarId: TFL.getActiveAvatarId() }, function (res) {
                if (res.success) {
                    $(`#commentNode_${commentId}`).fadeOut(150, function () { $(this).remove(); });
                    TFL.toast.success('Comentário excluído.');
                }
            });
        });

        // Curtir / Reagir Universal
        $(document).on('click', '.btn-universal-react', function (e) {
            e.stopPropagation();
            const btn = $(this);
            const targetType = btn.data('targettype');
            const targetId = Number(btn.data('targetid'));
            const reactionType = btn.data('reaction') || 'like';
            const forceReaction = btn.data('force') === true || btn.data('force') === 'true';

            if (!targetType || !targetId) return;

            $.post('/profile/social/react', {
                avatarId: TFL.getActiveAvatarId(),
                targetType: targetType,
                targetId: targetId,
                reactionType: reactionType,
                forceReaction: forceReaction
            }, function (res) {
                if (!res.success) return;

                const isCompact = targetType === 'comment' || targetType === 'room' || targetType === 'profile';
                const newWidgetHtml = TFL.buildReactionBarHtml(
                    targetType,
                    targetId,
                    res.liked,
                    res.myReaction,
                    res.likesCount,
                    res.reactionsSummary,
                    isCompact
                );

                $(`.reaction-widget[data-widget="${targetType}_${targetId}"]`).replaceWith(newWidgetHtml);

                if (targetType === 'profile') {
                    $('#miniProfileLikes').text(res.likesCount);
                    $('#userProfileStatLikes').text(res.likesCount);
                }
            });
        });

        // Lightbox de foto
        $(document).on('click', '.btn-open-photo-viewer', function (e) {
            e.stopPropagation();
            const photoId = $(this).data('photoid');
            if (photoId) TFL.openPhotoViewer(photoId);
        });

        $(document).on('submit', '#formCommentPhoto', function (e) {
            e.preventDefault();
            const photoId = Number($('#activePhotoViewerId').val());
            const text = $('#inputCommentPhotoText').val().trim();
            if (!photoId || !text) return;

            $('#inputCommentPhotoText').val('');
            $.post('/profile/social/comment', {
                avatarId: TFL.getActiveAvatarId(),
                photoId: photoId,
                text: text
            }, function (res) {
                if (res.success && res.comment) {
                    const list = $('#photoViewerCommentsList');
                    if (list.find('.comment-tree-node').length === 0) list.empty();
                    list.append(TFL.buildRecursiveCommentHtml(res.comment, 0));
                }
            });
        });

        // Mini Reels & Sentimento
        $(document).on('click', '#btnOpenCreatePhotoTextReel, #cardQuickCreateReel', function () {
            TFL.setCreateReelMode('photo');
            $('#modalCreateMiniReel').removeClass('hidden');
        });

        $(document).on('click', '#btnOpenCreateFeelingReel', function () {
            TFL.setCreateReelMode('feeling');
            $('#modalCreateMiniReel').removeClass('hidden');
        });

        $(document).on('click', '.btn-reel-mode-tab', function () {
            TFL.setCreateReelMode($(this).data('mode'));
        });

        $(document).on('click', '.btn-pick-reel-bg', function () {
            const bg = $(this).data('bg');
            $('#inputReelBgStyle').val(bg);
            $('.btn-pick-reel-bg').removeClass('ring-2 ring-white');
            $(this).addClass('ring-2 ring-white');
        });

        $(document).on('click', '.btn-pick-feeling', function () {
            const emoji = $(this).data('emoji');
            const label = $(this).data('label');
            $('#inputReelFeelingEmoji').val(emoji);
            $('#inputReelFeelingLabel').val(label);
            $('.btn-pick-feeling').removeClass('ring-2 ring-amber-400 bg-amber-500/25').addClass('bg-slate-900');
            $(this).removeClass('bg-slate-900').addClass('ring-2 ring-amber-400 bg-amber-500/25');
            $('#btnClearReelFeeling').removeClass('hidden');
        });

        $(document).on('click', '#btnClearReelFeeling', function () {
            $('#inputReelFeelingEmoji').val('');
            $('#inputReelFeelingLabel').val('');
            $('.btn-pick-feeling').removeClass('ring-2 ring-amber-400 bg-amber-500/25').addClass('bg-slate-900');
            $(this).addClass('hidden');
        });

        $(document).on('click', '#btnTriggerReelImageUpload', function () {
            $('#fileMiniReelImage').click();
        });

        $(document).on('change', '#fileMiniReelImage', function () {
            const file = this.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) {
                TFL.toast.warning('Mini Reels aceita apenas fotos (vídeos não são permitidos).');
                this.value = '';
                return;
            }

            const formData = new FormData();
            formData.append('photo', file);
            $('#labelReelUploadPhoto').text('Enviando foto...');

            $.ajax({
                url: '/profile/upload/avatar-image',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function (res) {
                    if (res.success && res.url) {
                        $('#inputReelImageUrl').val(res.url);
                        $('#reelPreviewImage').attr('src', res.url).removeClass('hidden');
                        $('#labelReelUploadPhoto').text('Foto pronta para o Mini Reel (24h) ✔');
                        TFL.toast.success('Foto carregada para o Mini Reel!');
                    } else {
                        TFL.toast.error(res.error || 'Erro ao enviar foto.');
                        $('#labelReelUploadPhoto').text('Escolher Foto para o Mini Reel (Dura 24 horas)');
                    }
                },
                error: function () {
                    TFL.toast.error('Erro ao enviar foto.');
                    $('#labelReelUploadPhoto').text('Escolher Foto para o Mini Reel (Dura 24 horas)');
                }
            });
        });

        $(document).on('submit', '#formCreateMiniReel', function (e) {
            e.preventDefault();
            const type = $('#inputReelType').val();
            const imageUrl = $('#inputReelImageUrl').val().trim();
            const text = $('#inputReelText').val().trim();
            const feelingEmoji = $('#inputReelFeelingEmoji').val().trim();
            const feelingLabel = $('#inputReelFeelingLabel').val().trim();
            const bgStyle = $('#inputReelBgStyle').val().trim();
            const saveToGallery = $('#chkSaveReelPhotoToGallery').is(':checked');

            if (type === 'photo' && !imageUrl) {
                return TFL.toast.warning('Selecione uma foto para publicar seu Mini Reel de 24h.');
            }
            if (type === 'text' && !text) {
                return TFL.toast.warning('Escreva um texto para o seu Mini Reel de 24h.');
            }
            if (type === 'feeling' && !feelingEmoji && !feelingLabel) {
                return TFL.toast.warning('Escolha um sentimento acima (duração de 6 horas).');
            }

            const btn = $('#btnSubmitMiniReel');
            btn.prop('disabled', true).text('Publicando...');

            $.post('/profile/social/reels', {
                avatarId: TFL.getActiveAvatarId(),
                type,
                imageUrl,
                text,
                feelingEmoji,
                feelingLabel,
                bgStyle,
                saveToGallery
            }, function (res) {
                btn.prop('disabled', false).text('Publicar Mini Reel');
                if (res.success) {
                    $('#modalCreateMiniReel').addClass('hidden');
                    $('#inputReelImageUrl').val('');
                    $('#reelPreviewImage').attr('src', '').addClass('hidden');
                    $('#inputReelText').val('');
                    $('#btnClearReelFeeling').trigger('click');
                    $('#labelReelUploadPhoto').text('Escolher Foto para o Mini Reel (Dura 24 horas)');
                    TFL.carregarMiniReels();
                    if (type === 'photo' && saveToGallery && !$('#socialPhotoGalleryPanel').hasClass('hidden')) {
                        TFL.carregarGaleriaFotos();
                    }
                    TFL.toast.success(
                        type === 'feeling'
                            ? 'Sentimento atualizado! Ele ficará ativo por 6 horas.'
                            : 'Mini Reel publicado! Ele ficará visível por 24 horas.',
                        'Mini Reels'
                    );
                } else {
                    TFL.toast.error(res.error || 'Erro ao publicar Mini Reel.');
                }
            }).fail(function (xhr) {
                btn.prop('disabled', false).text('Publicar Mini Reel');
                TFL.toast.error(xhr.responseJSON?.error || 'Erro ao publicar Mini Reel.');
            });
        });

        $(document).on('click', '.btn-open-mini-reel-viewer', function () {
            const idx = Number($(this).data('reelindex') || 0);
            TFL.renderActiveMiniReelInModal(idx);
        });

        $(document).on('click', '#btnPrevMiniReel', function () {
            TFL.renderActiveMiniReelInModal(currentMiniReelIndex - 1);
        });

        $(document).on('click', '#btnNextMiniReel', function () {
            TFL.renderActiveMiniReelInModal(currentMiniReelIndex + 1);
        });

        $(document).on('click', '#btnDeleteActiveReel', async function () {
            const reelId = $(this).data('reelid');
            if (!reelId) return;

            const confirmed = await TFL.confirm({
                title: 'Excluir Mini Reel / Sentimento?',
                text: 'Deseja remover este momento antes do tempo de expiração?',
                confirmText: 'Excluir',
                danger: true
            });
            if (!confirmed) return;

            $.post(`/profile/social/reels/${reelId}/delete`, { avatarId: TFL.getActiveAvatarId() }, function (res) {
                if (res.success) {
                    $('#modalMiniReelViewer').addClass('hidden');
                    TFL.carregarMiniReels();
                    TFL.toast.success('Mini Reel removido com sucesso.');
                }
            });
        });

        $(document).on('submit', '#formCommentMiniReel', function (e) {
            e.preventDefault();
            const reelId = Number($('#activeMiniReelViewerId').val());
            const text = $('#inputCommentMiniReelText').val().trim();
            if (!reelId || !text) return;

            $('#inputCommentMiniReelText').val('');
            $.post('/profile/social/comment', {
                avatarId: TFL.getActiveAvatarId(),
                reelId: reelId,
                text: text
            }, function (res) {
                if (res.success && res.comment) {
                    const list = $('#reelViewerCommentsList');
                    if (list.find('.comment-tree-node').length === 0) list.empty();
                    list.append(TFL.buildRecursiveCommentHtml(res.comment, 0));
                }
            });
        });

        // Galeria de Fotos
        $(document).on('click', '#btnSwitchToPhotoGallery', function () {
            $('.btn-feed-filter').removeClass('bg-blue-600 text-white').addClass('text-zinc-400 hover:text-white hover:bg-slate-800');
            $(this).removeClass('text-amber-300 bg-amber-500/10').addClass('bg-amber-500 text-slate-950');
            $('#postsFeedContainer').addClass('hidden');
            $('#socialPhotoGalleryPanel').removeClass('hidden');
            TFL.carregarGaleriaFotos();
        });

        $(document).on('click', '.btn-gallery-filter', function () {
            currentGalleryFilter = $(this).data('filter') || 'all';
            $('.btn-gallery-filter').removeClass('bg-amber-500 text-slate-950').addClass('bg-slate-950 text-zinc-400 hover:text-white');
            $(this).removeClass('bg-slate-950 text-zinc-400 hover:text-white').addClass('bg-amber-500 text-slate-950');
            TFL.carregarGaleriaFotos();
        });

        $(document).on('click', '#btnOpenUploadGalleryModal, .btn-open-upload-gallery-modal', function () {
            $('#inputGalleryPhotoUrl').val('');
            $('#inputGalleryPhotoDesc').val('');
            $('#galleryUploadPreviewImg').attr('src', '').addClass('hidden');
            $('#galleryUploadIcon').removeClass('hidden');
            $('#labelGalleryUploadStatus').text('Clique para selecionar uma foto (Sem vídeos)');
            $('#modalUploadGalleryPhoto').removeClass('hidden');
        });

        $(document).on('click', '#galleryUploadDropArea', function () {
            $('#fileGalleryPhotoUpload').click();
        });

        $(document).on('change', '#fileGalleryPhotoUpload', function () {
            const file = this.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) {
                TFL.toast.warning('Apenas fotos são permitidas na galeria (vídeos não são suportados).');
                this.value = '';
                return;
            }

            const formData = new FormData();
            formData.append('photo', file);
            $('#labelGalleryUploadStatus').text('Enviando foto...');

            $.ajax({
                url: '/profile/upload/avatar-image',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function (res) {
                    if (res.success && res.url) {
                        $('#inputGalleryPhotoUrl').val(res.url);
                        $('#galleryUploadPreviewImg').attr('src', res.url).removeClass('hidden');
                        $('#galleryUploadIcon').addClass('hidden');
                        $('#labelGalleryUploadStatus').text('Foto carregada e pronta ✔');
                        TFL.toast.success('Foto carregada! Clique em Salvar Foto na Galeria.');
                    } else {
                        TFL.toast.error(res.error || 'Erro ao enviar foto.');
                        $('#labelGalleryUploadStatus').text('Clique para selecionar uma foto');
                    }
                },
                error: function () {
                    TFL.toast.error('Erro ao enviar foto.');
                    $('#labelGalleryUploadStatus').text('Clique para selecionar uma foto');
                }
            });
        });

        $(document).on('submit', '#formUploadGalleryPhoto', function (e) {
            e.preventDefault();
            const imageUrl = $('#inputGalleryPhotoUrl').val().trim();
            const description = $('#inputGalleryPhotoDesc').val().trim();
            const shareOnFeed = $('#chkShareGalleryOnFeed').is(':checked');

            if (!imageUrl) {
                return TFL.toast.warning('Selecione uma foto antes de salvar na galeria.');
            }

            const btn = $('#btnSubmitGalleryPhoto');
            btn.prop('disabled', true).text('Salvando...');

            $.post('/profile/social/gallery', {
                avatarId: TFL.getActiveAvatarId(),
                imageUrl,
                description,
                shareOnFeed
            }, function (res) {
                btn.prop('disabled', false).text('Salvar Foto na Galeria');
                if (res.success) {
                    $('#modalUploadGalleryPhoto').addClass('hidden');
                    TFL.carregarGaleriaFotos();
                    if (shareOnFeed) TFL.carregarFeed();
                    if (!$('#view-user-profile').hasClass('hidden') && currentViewedProfileId) {
                        TFL.openUserProfileView(currentViewedProfileId);
                    }
                    TFL.toast.success('Foto adicionada à sua Galeria!', 'Galeria de Fotos');
                } else {
                    TFL.toast.error(res.error || 'Erro ao salvar foto na galeria.');
                }
            }).fail(function (xhr) {
                btn.prop('disabled', false).text('Salvar Foto na Galeria');
                TFL.toast.error(xhr.responseJSON?.error || 'Erro ao salvar foto na galeria.');
            });
        });

        $(document).on('click', '.btn-delete-gallery-photo', async function (e) {
            e.stopPropagation();
            const photoId = $(this).data('photoid');
            if (!photoId) return;

            const confirmed = await TFL.confirm({
                title: 'Excluir Foto da Galeria?',
                text: 'Esta foto será removida permanentemente da sua galeria.',
                confirmText: 'Excluir Foto',
                danger: true
            });
            if (!confirmed) return;

            $.post(`/profile/social/photos/${photoId}/delete`, { avatarId: TFL.getActiveAvatarId() }, function (res) {
                if (res.success) {
                    TFL.carregarGaleriaFotos();
                    if (!$('#view-user-profile').hasClass('hidden') && currentViewedProfileId) {
                        TFL.openUserProfileView(currentViewedProfileId);
                    }
                    TFL.toast.success('Foto removida da galeria.');
                }
            });
        });

        // Feed de Publicações
        $(document).on('click', '.btn-feed-filter', function () {
            currentFeedFilter = $(this).data('filter') || 'all';
            $('#btnSwitchToPhotoGallery').removeClass('bg-amber-500 text-slate-950').addClass('text-amber-300 bg-amber-500/10');
            $('#socialPhotoGalleryPanel').addClass('hidden');
            $('#postsFeedContainer').removeClass('hidden');
            $('.btn-feed-filter').removeClass('bg-blue-600 text-white').addClass('text-zinc-400 hover:text-white hover:bg-slate-800');
            $(this).removeClass('text-zinc-400 hover:text-white hover:bg-slate-800').addClass('bg-blue-600 text-white');
            TFL.carregarFeed();
        });

        $(document).on('click', '#btnReloadFeed', function () {
            TFL.carregarMiniReels();
            if (!$('#socialPhotoGalleryPanel').hasClass('hidden')) {
                TFL.carregarGaleriaFotos();
            } else {
                TFL.carregarFeed();
            }
            TFL.toast.info('Mural atualizado!', 'The Fantasy Life');
        });

        $(document).on('click', '#btnUploadPostPhoto', function () {
            $('#filePostPhoto').click();
        });

        $(document).on('change', '#filePostPhoto', function () {
            const file = this.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('photo', file);
            $('#labelUploadPostPhoto').text('Enviando foto...');

            $.ajax({
                url: '/profile/upload/avatar-image',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function (res) {
                    if (res.success && res.url) {
                        $('#inputPostImageUrl').val(res.url);
                        $('#postImagePreviewImg').attr('src', res.url);
                        $('#postImagePreviewBox').removeClass('hidden');
                        $('#labelUploadPostPhoto').text('Foto Anexada ✔');
                        TFL.toast.success('Foto anexada à publicação!');
                    } else {
                        TFL.toast.error(res.error || 'Erro ao anexar foto.');
                        $('#labelUploadPostPhoto').text('Anexar Foto');
                    }
                },
                error: function () {
                    TFL.toast.error('Erro ao enviar imagem para a publicação.');
                    $('#labelUploadPostPhoto').text('Anexar Foto');
                }
            });
        });

        $(document).on('click', '#btnClearPostImage', function () {
            $('#inputPostImageUrl').val('');
            $('#filePostPhoto').val('');
            $('#postImagePreviewBox').addClass('hidden');
            $('#labelUploadPostPhoto').text('Anexar Foto');
        });

        $(document).on('click', '#btnPublishPost', function () {
            const title = $('#postTitle').val().trim();
            const text = $('#postText').val().trim();
            const imageUrl = $('#inputPostImageUrl').val().trim();
            const roomId = $('#selectPostRoom').val();

            if (!text && !imageUrl && !roomId) {
                return TFL.toast.warning('Escreva uma mensagem, anexe uma foto ou vincule uma Sala 3D para publicar!');
            }

            const btn = $(this);
            btn.prop('disabled', true);

            $.post('/profile/social/posts', {
                avatarId: TFL.getActiveAvatarId(),
                title: title,
                text: text,
                imageUrl: imageUrl,
                roomId: roomId
            }, function (res) {
                btn.prop('disabled', false);
                if (res.success) {
                    $('#postTitle').val('');
                    $('#postText').val('');
                    $('#selectPostRoom').val('');
                    $('#btnClearPostImage').trigger('click');
                    TFL.carregarFeed();
                    TFL.toast.success('Publicação enviada para o mural!', 'Publicado');
                } else {
                    TFL.toast.error(res.error || 'Erro ao publicar.');
                }
            }).fail(function (xhr) {
                btn.prop('disabled', false);
                TFL.toast.error(xhr.responseJSON?.error || 'Erro ao publicar no mural.');
            });
        });

        $(document).on('click', '.btn-share-post', async function () {
            const postId = $(this).data('postid');
            const comment = await TFL.prompt({
                title: 'Compartilhar Publicação',
                placeholder: 'Adicione um comentário opcional ao compartilhar...',
                confirmText: 'Compartilhar no Mural'
            });
            if (comment === null) return;

            $.post(`/profile/social/posts/${postId}/share`, {
                avatarId: TFL.getActiveAvatarId(),
                text: comment
            }, function (res) {
                if (res.success) {
                    TFL.carregarFeed();
                    TFL.toast.success('Publicação compartilhada no seu mural!', 'Compartilhado');
                } else {
                    TFL.toast.error(res.error || 'Erro ao compartilhar publicação.');
                }
            });
        });

        $(document).on('submit', '.form-comment-post', function (e) {
            e.preventDefault();
            const form = $(this);
            const postId = form.data('postid');
            const input = form.find('.input-comment-text');
            const text = input.val().trim();
            if (!text) return;

            input.val('');
            $.post('/profile/social/comment', {
                avatarId: TFL.getActiveAvatarId(),
                postId: postId,
                text: text
            }, function (res) {
                if (res.success && res.comment) {
                    const html = TFL.buildRecursiveCommentHtml(res.comment, 0);
                    $(`#postCommentsList_${postId}`).append(html);
                    const countEl = $(`#commentCountLabel_${postId}`);
                    countEl.text((parseInt(countEl.text(), 10) || 0) + 1);
                }
            });
        });

        $(document).on('click', '.btn-delete-post', async function () {
            const postId = $(this).data('postid');
            if (!postId) return;

            const confirmed = await TFL.confirm({
                title: 'Excluir Publicação?',
                text: 'Deseja remover esta publicação do seu mural?',
                confirmText: 'Excluir Publicação',
                danger: true
            });
            if (!confirmed) return;

            $.post(`/profile/social/posts/${postId}/delete`, { avatarId: TFL.getActiveAvatarId() }, function (res) {
                if (res.success) {
                    $(`article[data-postid="${postId}"]`).fadeOut(200, function () { $(this).remove(); });
                    TFL.toast.success('Publicação excluída.');
                }
            });
        });

        // Carregamento inicial da Rede Social
        TFL.carregarFeed();
        TFL.carregarMiniReels();
    });

})(window, jQuery);
