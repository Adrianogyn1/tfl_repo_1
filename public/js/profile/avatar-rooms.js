/**
 * ============================================================================
 * TFL PROFILE — AVATARES & SALAS 3D MODULE
 * ============================================================================
 */
(function (window, $) {
    'use strict';

    const TFL = window.TFL = window.TFL || {};

    $(document).ready(function () {
        // 1. Troca de Identidade / Avatar Ativo
        $(document).on('change', '#selectActiveAvatar', function () {
            const avatarId = $(this).val();
            if (!avatarId) return;
            $.post('/profile/switch-avatar', { avatarId: avatarId }, function (res) {
                if (res.success) {
                    TFL.reloadWithToast('Avatar ativo alterado com sucesso!', 'success', 'Identidade Alterada');
                }
            });
        });

        $(document).on('click', '.btn-select-avatar', function () {
            const avatarId = $(this).data('id');
            if (!avatarId) return;
            $.post('/profile/switch-avatar', { avatarId: avatarId }, function (res) {
                if (res.success) {
                    TFL.reloadWithToast('Avatar ativo alterado com sucesso!', 'success', 'Identidade Alterada');
                }
            });
        });

        // 2. Botões de Dado (Gerar Nomes Aleatórios)
        $(document).on('click', '#btnRollAvatarName', function () {
            const gender = $('#newAvatarGender').val();
            $.get(`/profile/random/avatar-name?gender=${gender}`, function (res) {
                if (res.success && res.name) $('#newAvatarName').val(res.name);
            });
        });

        $(document).on('click', '#btnRollEditAvatarName', function () {
            const gender = $('#editAvatarGender').val();
            $.get(`/profile/random/avatar-name?gender=${gender}`, function (res) {
                if (res.success && res.name) $('#editAvatarName').val(res.name);
            });
        });

        $(document).on('click', '#btnRollRoomName', function () {
            $.get('/profile/random/room-name', function (res) {
                if (res.success && res.name) $('#newRoomName').val(res.name);
            });
        });

        $(document).on('click', '#btnRollInspectRoomName', function () {
            $.get('/profile/random/room-name', function (res) {
                if (res.success && res.name) $('#inspectRoomName').val(res.name);
            });
        });

        // 3. Upload de Fotos Seguro (Failover & Proxy) para Avatares e Capas
        $(document).on('click', '#btnUploadCreateAvatar', function () {
            $('#fileCreateAvatar').click();
        });

        $(document).on('change', '#fileCreateAvatar', function () {
            const file = this.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('photo', file);
            $('#labelCreateAvatarFile').text('Enviando...');

            $.ajax({
                url: '/profile/upload/avatar-image',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function (res) {
                    if (res.success) {
                        $('#newAvatarThumb').val(res.url);
                        $('#labelCreateAvatarFile').text('Foto Enviada ✔');
                        TFL.toast.success('Foto do avatar enviada com sucesso!');
                    } else {
                        TFL.toast.error('Erro ao enviar imagem.');
                        $('#labelCreateAvatarFile').text('Escolher Foto');
                    }
                },
                error: function () {
                    TFL.toast.error('Falha na comunicação ao enviar imagem.');
                    $('#labelCreateAvatarFile').text('Escolher Foto');
                }
            });
        });

        $(document).on('click', '#btnUploadEditAvatar', function () {
            $('#fileEditAvatar').click();
        });

        $(document).on('change', '#fileEditAvatar', function () {
            const file = this.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('photo', file);
            $('#labelEditAvatarFile').text('Enviando...');

            $.ajax({
                url: '/profile/upload/avatar-image',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function (res) {
                    if (res.success) {
                        $('#editAvatarThumb').val(res.url);
                        $('#labelEditAvatarFile').text('Foto Atualizada ✔');
                        TFL.toast.success('Foto carregada! Clique em Salvar Alterações para confirmar.');
                    } else {
                        TFL.toast.error('Erro ao enviar imagem.');
                        $('#labelEditAvatarFile').text('Nova Foto');
                    }
                },
                error: function () {
                    TFL.toast.error('Falha na comunicação ao enviar imagem.');
                    $('#labelEditAvatarFile').text('Nova Foto');
                }
            });
        });

        $(document).on('click', '#btnUploadEditAvatarCover', function () {
            $('#fileEditAvatarCover').click();
        });

        $(document).on('change', '#fileEditAvatarCover', function () {
            const file = this.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('photo', file);
            $('#labelEditAvatarCoverFile').text('Enviando...');

            $.ajax({
                url: '/profile/upload/avatar-image',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function (res) {
                    if (res.success && res.url) {
                        $('#editAvatarCover').val(res.url);
                        $('#labelEditAvatarCoverFile').text('Capa Pronta ✔');
                        TFL.toast.success('Imagem de capa pronta! Clique em Salvar Alterações.');
                    } else {
                        TFL.toast.error('Erro ao enviar imagem de capa.');
                        $('#labelEditAvatarCoverFile').text('Alterar Capa');
                    }
                },
                error: function () {
                    TFL.toast.error('Falha ao enviar imagem de capa.');
                    $('#labelEditAvatarCoverFile').text('Alterar Capa');
                }
            });
        });

        // 4. Toggle Privacidade Salas 3D
        $(document).on('change', '#toggleNewRoomPrivate', function () {
            if ($(this).is(':checked')) {
                $('#labelNewRoomPrivate').text('Privada 🔒');
            } else {
                $('#labelNewRoomPrivate').text('Pública 🌐');
            }
        });

        $(document).on('change', '#toggleInspectRoomPrivate', function () {
            if ($(this).is(':checked')) {
                $('#labelInspectRoomPrivate').text('Privada 🔒');
                $('#containerInspectRoomPassword').removeClass('hidden');
            } else {
                $('#labelInspectRoomPrivate').text('Pública 🌐');
                $('#containerInspectRoomPassword').addClass('hidden');
            }
        });

        // 5. Avatar: Criar e Editar
        $(document).on('click', '#btnOpenCreateAvatarModal', function () {
            $('#modalCreateAvatar').removeClass('hidden');
        });

        $(document).on('click', '#btnOpenEditAvatarModal, .btn-edit-avatar-item', function () {
            const btn = $(this);
            $('#editAvatarId').val(btn.data('id'));
            $('#editAvatarName').val(btn.data('name'));
            $('#editAvatarBio').val(btn.data('bio'));
            $('#editAvatarGender').val(btn.data('gender'));
            $('#editAvatarThumb').val(btn.data('thumbnail'));
            $('#editAvatarCover').val(btn.data('coverurl') || '');
            $('#labelEditAvatarFile').text('Nova Foto');
            $('#labelEditAvatarCoverFile').text('Alterar Capa');
            $('#modalEditAvatar').removeClass('hidden');
        });

        $(document).on('submit', '#formCreateAvatar', function (e) {
            e.preventDefault();
            const data = {
                name: $('#newAvatarName').val(),
                bio: $('#newAvatarBio').val(),
                gender: $('#newAvatarGender').val(),
                thumbnail: $('#newAvatarThumb').val()
            };
            $.post('/profile/avatar/create', data, function (res) {
                if (res.success) {
                    TFL.reloadWithToast('Novo avatar criado com sucesso!', 'success', 'Avatar Criado');
                } else {
                    TFL.toast.error('Erro ao criar avatar: ' + (res.error || ''));
                }
            });
        });

        $(document).on('submit', '#formEditAvatar', function (e) {
            e.preventDefault();
            const data = {
                avatarId: $('#editAvatarId').val(),
                name: $('#editAvatarName').val(),
                bio: $('#editAvatarBio').val(),
                gender: $('#editAvatarGender').val(),
                thumbnail: $('#editAvatarThumb').val(),
                coverUrl: $('#editAvatarCover').val()
            };
            $.post('/profile/avatar/update', data, function (res) {
                if (res.success) {
                    TFL.reloadWithToast('Dados do avatar atualizados com sucesso!', 'success', 'Avatar Atualizado');
                } else {
                    TFL.toast.error('Erro ao atualizar avatar: ' + (res.error || ''));
                }
            });
        });

        // 6. Salas 3D: Criar, Cobrar Entrada (Passe 24h), Visitar e Inspecionar / Editar
        function formatCoinsPtBr(value) {
            return Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        function updateRoomFeePreview(rawVal, grossSelector, feeSelector, netSelector) {
            const feePercent = parseFloat($('[data-room-fee-percent]').first().data('room-fee-percent') || 15);
            const gross = Math.max(0, parseFloat(rawVal || 0) || 0);
            const fee = Number(((gross * feePercent) / 100).toFixed(4));
            const net = Number(Math.max(0, gross - fee).toFixed(4));

            if (gross <= 0) {
                $(grossSelector).text('Grátis');
                $(feeSelector).text('0,00 Coins');
                $(netSelector).text('0,00 Coins');
            } else {
                $(grossSelector).text(formatCoinsPtBr(gross) + ' Coins');
                $(feeSelector).text('-' + formatCoinsPtBr(fee) + ' Coins');
                $(netSelector).text('+' + formatCoinsPtBr(net) + ' Coins');
            }
        }

        $(document).on('input change', '#newRoomEntryValue', function () {
            updateRoomFeePreview($(this).val(), '#newRoomGrossDisplay', '#newRoomFeeDisplay', '#newRoomNetDisplay');
        });

        $(document).on('input change', '#inspectRoomEntryValue', function () {
            updateRoomFeePreview($(this).val(), '#inspectRoomGrossDisplay', '#inspectRoomFeeDisplay', '#inspectRoomNetDisplay');
        });

        $(document).on('click', '#btnOpenCreateRoomModal', function () {
            $('#newRoomEntryValue').val('0');
            updateRoomFeePreview(0, '#newRoomGrossDisplay', '#newRoomFeeDisplay', '#newRoomNetDisplay');
            $('#modalCreateRoom').removeClass('hidden');
        });

        $(document).on('submit', '#formCreateRoom', function (e) {
            e.preventDefault();
            const isPrivate = $('#toggleNewRoomPrivate').is(':checked');
            const entryValue = Math.max(0, parseFloat($('#newRoomEntryValue').val() || 0) || 0);
            const data = {
                avatarId: TFL.getActiveAvatarId(),
                name: $('#newRoomName').val(),
                description: $('#newRoomDesc').val(),
                maxPlayers: $('#newRoomMax').val(),
                isPrivate: isPrivate,
                entryValue: entryValue
            };
            $.post('/profile/room/create', data, function (res) {
                if (res.success) {
                    $('#modalCreateRoom').addClass('hidden');
                    TFL.toast.success('Sala 3D criada com sucesso!', 'Nova Sala');
                    if (typeof TFL.refreshPartial === 'function') {
                        TFL.refreshPartial('view-salas');
                    } else {
                        TFL.reloadWithToast('Sala 3D criada com sucesso!', 'success');
                    }
                } else {
                    TFL.toast.error('Erro ao criar sala: ' + (res.error || ''));
                }
            });
        });

        $(document).on('click', '.btn-inspect-room', function () {
            const btn = $(this);
            const roomId = btn.data('id');
            const isPrivate = btn.data('isprivate') === true || btn.data('isprivate') === 'true';
            const entryVal = parseFloat(btn.data('entryvalue') || 0) || 0;
            const totalVisits = Number(btn.data('visits') || 0);
            const monthlyUnique = Number(btn.data('monthlyunique') || 0);

            $('#inspectRoomId').val(roomId);
            $('#inspectRoomName').val(btn.data('name'));
            $('#inspectRoomDesc').val(btn.data('description'));
            $('#inspectRoomMax').val(btn.data('maxplayers'));
            $('#inspectRoomPassword').val(btn.data('password'));
            $('#inspectRoomEntryValue').val(entryVal.toFixed(2));
            updateRoomFeePreview(entryVal, '#inspectRoomGrossDisplay', '#inspectRoomFeeDisplay', '#inspectRoomNetDisplay');

            $('#inspectRoomTotalVisits').text(totalVisits.toLocaleString('pt-BR'));
            $('#inspectRoomMonthlyUniqueVisits').text(`${monthlyUnique.toLocaleString('pt-BR')} / 1.000`);
            $('#inspectRoomActivePasses').text('0');
            $('#inspectRoomMilestonesPaid').text('0,00 Coins');

            $('#toggleInspectRoomPrivate').prop('checked', isPrivate);
            if (isPrivate) {
                $('#labelInspectRoomPrivate').text('Privada 🔒');
                $('#containerInspectRoomPassword').removeClass('hidden');
            } else {
                $('#labelInspectRoomPrivate').text('Pública 🌐');
                $('#containerInspectRoomPassword').addClass('hidden');
            }

            $('#roomObjectsContainer').html('<span>Carregando objetos da sala...</span>');
            $.get(`/profile/room/${roomId}/details`, function (res) {
                if (res.success && res.room) {
                    const vd = res.visitDetails || {};
                    const rInfo = vd.room || res.room || {};
                    const totV = Number(rInfo.visits ?? totalVisits);
                    const monU = Number(rInfo.monthlyUniqueVisits ?? monthlyUnique);
                    const activePassesList = Array.isArray(vd.activePasses) ? vd.activePasses : [];
                    const payoutsList = Array.isArray(vd.payouts) ? vd.payouts : [];
                    const totalBonusCoins = payoutsList.reduce((acc, p) => acc + (parseFloat(p.rewardCoins || 0) || 0), 0);

                    $('#inspectRoomTotalVisits').text(totV.toLocaleString('pt-BR'));
                    $('#inspectRoomMonthlyUniqueVisits').text(`${monU.toLocaleString('pt-BR')} / 1.000`);
                    $('#inspectRoomActivePasses').text(activePassesList.length.toLocaleString('pt-BR'));
                    $('#inspectRoomMilestonesPaid').text(formatCoinsPtBr(totalBonusCoins) + ' Coins');

                    const objects = res.room.objects || [];
                    if (objects.length === 0) {
                        $('#roomObjectsContainer').html(`
                            <div class="text-zinc-500 py-3">
                                <i class="fa-solid fa-box-open text-lg mb-1 block"></i>
                                Nenhum objeto mobiliado ou decorado nesta sala ainda.
                            </div>
                        `);
                    } else {
                        let html = '<div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-left">';
                        objects.forEach(obj => {
                            html += `
                                <div class="p-2.5 bg-slate-900 border border-white/5 rounded-xl text-zinc-300 text-xs">
                                    <div class="font-bold text-white truncate">${TFL.escapeHtml(obj.name || 'Objeto 3D')}</div>
                                    <div class="text-[10px] text-zinc-400">Item Decorativo</div>
                                </div>
                            `;
                        });
                        html += '</div>';
                        $('#roomObjectsContainer').html(html);
                    }
                }
            });

            $('#modalInspectRoom').removeClass('hidden');
        });

        $(document).on('submit', '#formEditRoom', function (e) {
            e.preventDefault();
            const isPrivate = $('#toggleInspectRoomPrivate').is(':checked');
            const entryValue = Math.max(0, parseFloat($('#inspectRoomEntryValue').val() || 0) || 0);
            const data = {
                roomId: $('#inspectRoomId').val(),
                name: $('#inspectRoomName').val(),
                description: $('#inspectRoomDesc').val(),
                maxPlayers: $('#inspectRoomMax').val(),
                isPrivate: isPrivate,
                password: isPrivate ? $('#inspectRoomPassword').val() : '',
                entryValue: entryValue
            };
            $.post('/profile/room/update', data, function (res) {
                if (res.success) {
                    $('#modalInspectRoom').addClass('hidden');
                    TFL.toast.success('Configurações da sala atualizadas!', 'Sala Atualizada');
                    if (typeof TFL.refreshPartial === 'function') {
                        TFL.refreshPartial('view-salas');
                    } else {
                        TFL.reloadWithToast('Configurações da sala atualizadas!', 'success');
                    }
                } else {
                    TFL.toast.error('Erro ao salvar alterações da sala: ' + (res.error || ''));
                }
            });
        });

        // Alternar Sub-Abas de Salas ("Minhas Salas" vs "Explorar Salas Públicas & Ranking do Mês")
        $(document).on('click', '.btn-rooms-subtab', function () {
            const subtab = $(this).data('subtab');
            $('.btn-rooms-subtab')
                .removeClass('bg-indigo-600 text-white shadow-lg shadow-indigo-600/20')
                .addClass('bg-slate-900 border border-white/10 text-zinc-300');
            $(this)
                .removeClass('bg-slate-900 border border-white/10 text-zinc-300')
                .addClass('bg-indigo-600 text-white shadow-lg shadow-indigo-600/20');

            if (subtab === 'explore-rooms') {
                $('#subtabRoomsMine').addClass('hidden');
                $('#subtabRoomsExplore').removeClass('hidden');
            } else {
                $('#subtabRoomsExplore').addClass('hidden');
                $('#subtabRoomsMine').removeClass('hidden');
            }
        });

        $(document).on('click', '#btnRefreshPublicRooms', function () {
            if (typeof TFL.refreshPartial === 'function') {
                TFL.refreshPartial('view-salas', function () {
                    $('.btn-rooms-subtab[data-subtab="explore-rooms"]').trigger('click');
                });
            }
        });

        // Impulsionar Sala 3D no Topo do Ranking por 24 Horas (Boost 24h)
        $(document).on('click', '.btn-boost-room', async function () {
            const $btn = $(this);
            const roomId = $btn.data('id') || $btn.data('room-id');
            const roomName = $btn.data('name') || 'Sala 3D';
            const boostFee = Number(window.TFL_CONFIG?.roomBoost24hFeeCoins ?? 20);
            if (!roomId) return;

            const confirmed = await TFL.confirm({
                title: `🚀 Impulsionar "${roomName}" por 24 Horas`,
                text: `Deseja destacar sua sala no topo do Explorador Público por 24 horas por ${boostFee.toFixed(2)} Coins?`,
                confirmText: `Impulsionar (${boostFee} Coins)`,
                danger: false
            });
            if (!confirmed) return;

            $btn.prop('disabled', true).addClass('opacity-60');
            $.post(`/profile/room/${roomId}/boost`, { roomId, avatarId: TFL.getActiveAvatarId() }, function (res) {
                $btn.prop('disabled', false).removeClass('opacity-60');
                if (res && res.success) {
                    TFL.toast.success(res.message || 'Sala impulsionada por 24h!', '🚀 Boost 24h Ativado');
                    if (typeof TFL.refreshPartial === 'function') {
                        TFL.refreshPartial('view-salas');
                        TFL.refreshPartial('view-market');
                        TFL.refreshPartial('sidebar');
                    }
                } else {
                    TFL.toast.error(res?.error || 'Não foi possível impulsionar a sala.');
                }
            }).fail(function (xhr) {
                $btn.prop('disabled', false).removeClass('opacity-60');
                TFL.toast.error(xhr.responseJSON?.error || 'Saldo insuficiente ou erro ao impulsionar sala.');
            });
        });

        // Entrar na Sala 3D (Compra ou valida Passe 24h + Contabiliza Visita Única do Mês com Anti-Farm)
        $(document).on('click', '.btn-enter-room-pass', function () {
            const $btn = $(this);
            const roomId = $btn.data('room-id') || $btn.data('id');
            if (!roomId) return;

            $btn.prop('disabled', true).addClass('opacity-60');
            $.post(`/profile/room/${roomId}/enter`, { roomId: roomId, avatarId: TFL.getActiveAvatarId() }, function (res) {
                $btn.prop('disabled', false).removeClass('opacity-60');
                if (res && res.success) {
                    TFL.toast.success(res.message || 'Entrada liberada na sala!', 'Sala 3D');
                    if (res.milestonePayoutTriggered) {
                        TFL.toast.info(
                            `Meta atingida (${res.milestonePayoutTriggered.milestoneVisits} visitas únicas/mês)! +${formatCoinsPtBr(res.milestonePayoutTriggered.rewardCoins)} Coins creditados ao dono da sala!`,
                            'Prêmio de 1.000 Visitas!'
                        );
                    }
                    if (typeof TFL.refreshPartial === 'function') {
                        TFL.refreshPartial('view-salas');
                        TFL.refreshPartial('view-market');
                    }
                } else {
                    TFL.toast.error(res?.error || 'Não foi possível entrar na sala.', 'Sala 3D');
                }
            }).fail(function (xhr) {
                $btn.prop('disabled', false).removeClass('opacity-60');
                TFL.toast.error(xhr.responseJSON?.error || 'Erro ao processar entrada na sala.', 'Sala 3D');
            });
        });

        // Curtir Sala 3D
        $(document).on('click', '.btn-like-room', function (e) {
            e.stopPropagation();
            const $btn = $(this);
            const roomId = $btn.data('room-id');
            if (!roomId) return;

            $.post('/profile/social/like/toggle', {
                targetType: 'room',
                targetId: roomId,
                avatarId: TFL.getActiveAvatarId()
            }, function (res) {
                if (res && res.success) {
                    $btn.find('.room-likes-count').text(res.likesCount || 0);
                    if (res.liked) {
                        $btn.addClass('text-rose-400 bg-rose-500/20').removeClass('text-zinc-400');
                    } else {
                        $btn.removeClass('text-rose-400 bg-rose-500/20');
                    }
                }
            });
        });

        // =========================================================================
        // 7. GUARDA-ROUPA 3D, SLOTS EQUIPADOS, CORES CUSTOMIZADAS & LOJA DE ROUPAS
        // =========================================================================
        let activeClosetTab = 'panel-wardrobe-3d';
        let activeSlotFilter = 'all';

        function applyClosetAndShopFilters() {
            const searchVal = String($('#inputShop3dSearch').val() || '').toLowerCase().trim();
            const currencyVal = $('#selectShop3dCurrency').val() || 'all';
            const genderVal = $('#selectShop3dGender').val() || 'all';

            // Filtra itens do Guarda-Roupa
            $('#panel-wardrobe-3d .closet-item-card').each(function () {
                const $card = $(this);
                const itemSlot = String($card.data('slot') || '');
                const matchSlot = activeSlotFilter === 'all' || itemSlot === activeSlotFilter;
                $card.toggleClass('hidden', !matchSlot);
            });

            // Filtra itens da Loja 3D
            $('#panel-shop-3d .shop-catalog-card').each(function () {
                const $card = $(this);
                const itemSlot = String($card.data('slot') || '');
                const itemCurrency = String($card.data('currency') || '');
                const itemGender = String($card.data('gender') || '');
                const itemSearch = String($card.data('search') || '');

                const matchSlot = activeSlotFilter === 'all' || itemSlot === activeSlotFilter;
                const matchCurrency = currencyVal === 'all' || itemCurrency === currencyVal;
                const matchGender = genderVal === 'all' || itemGender === genderVal;
                const matchSearch = !searchVal || itemSearch.includes(searchVal);

                $card.toggleClass('hidden', !(matchSlot && matchCurrency && matchGender && matchSearch));
            });
        }

        function refreshAvatarClosetView(keepTab) {
            const targetTab = keepTab || activeClosetTab;
            if (typeof TFL.refreshPartial === 'function') {
                TFL.refreshPartial('view-avatar', function () {
                    if (targetTab === 'panel-shop-3d') {
                        $('.btn-closet-tab[data-target="panel-shop-3d"]').trigger('click');
                    }
                    if (activeSlotFilter !== 'all') {
                        $(`.btn-slot-filter[data-slot="${activeSlotFilter}"]`).trigger('click');
                    }
                });
            } else {
                window.location.reload();
            }
        }

        // Alternar entre "Meu Guarda-Roupa 3D" e "Loja de Roupas 3D"
        $(document).on('click', '.btn-closet-tab', function () {
            const target = $(this).data('target');
            if (!target) return;
            activeClosetTab = target;

            $('.btn-closet-tab')
                .removeClass('bg-blue-600 text-white shadow-lg shadow-blue-600/25')
                .addClass('bg-slate-950 text-zinc-400 hover:text-white border border-white/10');
            $(this)
                .addClass('bg-blue-600 text-white shadow-lg shadow-blue-600/25')
                .removeClass('bg-slate-950 text-zinc-400 hover:text-white border border-white/10');

            $('.closet-subpanel').addClass('hidden');
            $('#' + target).removeClass('hidden');
            applyClosetAndShopFilters();
        });

        $(document).on('click', '.btn-open-shop-tab', function () {
            $('.btn-closet-tab[data-target="panel-shop-3d"]').trigger('click');
        });

        // Filtrar por Slot 3D
        $(document).on('click', '.btn-slot-filter', function () {
            const slot = $(this).data('slot') || 'all';
            activeSlotFilter = slot;

            $('.btn-slot-filter')
                .removeClass('bg-cyan-600 text-white')
                .addClass('bg-slate-950 text-zinc-400 border border-white/5');
            $(this)
                .addClass('bg-cyan-600 text-white')
                .removeClass('bg-slate-950 text-zinc-400 border border-white/5');

            applyClosetAndShopFilters();
        });

        // Atalho de Slot Vazio no Manequim -> Filtra o slot correspondente
        $(document).on('click', '.btn-filter-slot-shortcut', function () {
            const slot = $(this).data('slot');
            if (!slot) return;
            $(`.btn-slot-filter[data-slot="${slot}"]`).trigger('click');
            const hasOwnedInSlot = $(`#panel-wardrobe-3d .closet-item-card[data-slot="${slot}"]`).length > 0;
            if (!hasOwnedInSlot) {
                $('.btn-closet-tab[data-target="panel-shop-3d"]').trigger('click');
            }
        });

        $(document).on('input change', '#inputShop3dSearch, #selectShop3dCurrency, #selectShop3dGender', function () {
            applyClosetAndShopFilters();
        });

        // Comprar peça 3D na Loja
        $(document).on('click', '.btn-buy-shop-3d', function () {
            const $btn = $(this);
            const shopItemId = $btn.data('shop-item-id');
            if (!shopItemId) return;

            $btn.prop('disabled', true).addClass('opacity-60');
            $.post('/profile/shop/buy', { shopItemId: shopItemId }, function (res) {
                $btn.prop('disabled', false).removeClass('opacity-60');
                if (res && res.success) {
                    TFL.toast.success(res.message || 'Roupa 3D adquirida com sucesso!', 'Loja 3D');
                    refreshAvatarClosetView('panel-shop-3d');
                    if (typeof TFL.refreshPartial === 'function') {
                        TFL.refreshPartial('view-market');
                    }
                } else {
                    TFL.toast.error(res?.error || 'Não foi possível comprar esta peça.', 'Loja 3D');
                }
            }).fail(function (xhr) {
                $btn.prop('disabled', false).removeClass('opacity-60');
                TFL.toast.error(xhr.responseJSON?.error || 'Erro ao comprar peça 3D.', 'Loja 3D');
            });
        });

        // Equipar ou Despir peça 3D no Avatar
        $(document).on('click', '.btn-toggle-equip-3d', function () {
            const $btn = $(this);
            const inventoryId = $btn.data('inventory-id');
            const shopItemId = $btn.data('shop-item-id');
            const equip = String($btn.data('equip')) === 'true';

            const $card = $btn.closest('.closet-item-card');
            const primary = $card.find('.input-cloth-color-primary').val();
            const secondary = $card.find('.input-cloth-color-secondary').val();
            const payload = {
                inventoryId: inventoryId,
                shopItemId: shopItemId,
                equip: equip
            };
            if (primary || secondary) {
                payload.customColors = JSON.stringify({
                    primary: primary || '#3b82f6',
                    secondary: secondary || '#1e293b'
                });
            }

            $btn.prop('disabled', true).addClass('opacity-60');
            $.post('/profile/shop/equip', payload, function (res) {
                $btn.prop('disabled', false).removeClass('opacity-60');
                if (res && res.success) {
                    TFL.toast.success(res.message || 'Visual 3D atualizado!', 'Guarda-Roupa 3D');
                    refreshAvatarClosetView(activeClosetTab);
                } else {
                    TFL.toast.error(res?.error || 'Erro ao atualizar peça no avatar.', 'Guarda-Roupa 3D');
                }
            }).fail(function (xhr) {
                $btn.prop('disabled', false).removeClass('opacity-60');
                TFL.toast.error(xhr.responseJSON?.error || 'Falha ao equipar peça 3D.', 'Guarda-Roupa 3D');
            });
        });

        // Atualizar cor customizada da peça 3D
        $(document).on('change', '.input-cloth-color-primary, .input-cloth-color-secondary', function () {
            const $input = $(this);
            const inventoryId = $input.data('inventory-id');
            const $card = $input.closest('.closet-item-card');
            const primary = $card.find('.input-cloth-color-primary').val() || '#3b82f6';
            const secondary = $card.find('.input-cloth-color-secondary').val() || '#1e293b';

            $.post('/profile/shop/equip', {
                inventoryId: inventoryId,
                equip: true,
                customColors: JSON.stringify({ primary, secondary })
            }, function (res) {
                if (res && res.success) {
                    TFL.toast.info('Cor 3D aplicada e equipada no avatar!', 'Personalização 3D');
                    refreshAvatarClosetView('panel-wardrobe-3d');
                }
            });
        });

        // Salvar Look / Preset de Roupa 3D
        $(document).on('submit', '#formSaveOutfitStyle', function (e) {
            e.preventDefault();
            const name = String($('#inputOutfitStyleName').val() || '').trim();
            if (!name) return;

            $.post('/profile/shop/style/save', { name: name }, function (res) {
                if (res && res.success) {
                    $('#inputOutfitStyleName').val('');
                    TFL.toast.success(res.message || 'Look 3D salvo!', 'Meus Looks');
                    refreshAvatarClosetView(activeClosetTab);
                } else {
                    TFL.toast.error(res?.error || 'Não foi possível salvar o look.', 'Meus Looks');
                }
            }).fail(function (xhr) {
                TFL.toast.error(xhr.responseJSON?.error || 'Erro ao salvar look 3D.', 'Meus Looks');
            });
        });

        // Vestir Look salvo
        $(document).on('click', '.btn-apply-outfit-style', function () {
            const styleId = $(this).data('style-id');
            if (!styleId) return;
            $.post('/profile/shop/style/apply', { styleId: styleId }, function (res) {
                if (res && res.success) {
                    TFL.toast.success(res.message || 'Look aplicado ao avatar!', 'Meus Looks');
                    refreshAvatarClosetView(activeClosetTab);
                } else {
                    TFL.toast.error(res?.error || 'Erro ao vestir look.', 'Meus Looks');
                }
            }).fail(function (xhr) {
                TFL.toast.error(xhr.responseJSON?.error || 'Falha ao aplicar look.', 'Meus Looks');
            });
        });

        // Excluir Look salvo
        $(document).on('click', '.btn-delete-outfit-style', function () {
            const styleId = $(this).data('style-id');
            if (!styleId) return;
            $.post('/profile/shop/style/delete', { styleId: styleId }, function (res) {
                if (res && res.success) {
                    TFL.toast.info('Look removido.', 'Meus Looks');
                    refreshAvatarClosetView(activeClosetTab);
                } else {
                    TFL.toast.error(res?.error || 'Erro ao remover look.', 'Meus Looks');
                }
            });
        });
    });

})(window, jQuery);
