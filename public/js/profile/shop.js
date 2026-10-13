/**
 * ============================================================================
 * TFL PROFILE — SHOP MODULE (Módulo Independente da Loja 3D)
 * Réplica fiel da arquitetura e fluxo de shop_app.tscn:
 * - ShopPage (Vitrine paginada 4x2 com busca, filtro de gênero/slot e Ver item)
 * - PreviewPage (Remover slot Torso/Leg/Shoes, Preview 3D, Adicionar ao carrinho, Estatísticas)
 * - CartPage (Lista do carrinho, Resumo e Finalizar compra)
 * - CreateItemPage (Male HM / Female HF, Prefabs 3D, ParamSchema: PBR, Hair, SkinHead, SkinBody)
 * - MyTexturesPage + UploadForm (Listagem de texturas, Seletor para Shaders e Upload com taxa 1,00)
 * - InventoryPage (Abas Comprados [Equipar] e Criados por mim [Vendas + Editar])
 * - ReviewsPage (Estatísticas de Curtidas, Favoritos, Vendas e Compartilhamentos)
 * ============================================================================
 */
(function (window, $) {
    'use strict';

    const TFL = window.TFL = window.TFL || {};

    // ==================== PARAM SCHEMA (Idêntico ao ParamSchema.cs) ====================
    const ParamSchema = {
        SkinHeadSchema: function () {
            const schema = [
                { group: 'UV', key: 'flip_horizontal', label: 'Espelhar H', type: 'bool', defaultVal: false },
                { group: 'UV', key: 'flip_vertical', label: 'Espelhar V', type: 'bool', defaultVal: false },
                { group: 'UV', key: 'uv_rotation_degrees', label: 'Rotação UV', type: 'range', min: 0, max: 360, step: 90, defaultVal: 0 }
            ];
            const layers = [
                [1, 'Skin'],
                [2, 'Tattoo'],
                [3, 'Make: Blush'],
                [4, 'Make: Lips'],
                [5, 'Make: Eyes'],
                [6, 'Eyebrows']
            ];
            layers.forEach(([idx, name]) => {
                schema.push({ group: name, key: `color_layer_${idx}`, label: 'Cor', type: 'color', defaultVal: '#ffffff' });
                schema.push({ group: name, key: `texture_layer_${idx}`, label: 'Textura', type: 'texture', defaultVal: '' });
            });
            return schema;
        },

        SkinBodySchema: function () {
            const schema = [
                { group: 'UV', key: 'flip_horizontal', label: 'Espelhar H', type: 'bool', defaultVal: false },
                { group: 'UV', key: 'flip_vertical', label: 'Espelhar V', type: 'bool', defaultVal: false },
                { group: 'UV', key: 'uv_rotation_degrees', label: 'Rotação UV', type: 'range', min: 0, max: 360, step: 90, defaultVal: 0 }
            ];
            const layers = [
                [1, 'Skin'],
                [2, 'Tattoo'],
                [3, 'Make'],
                [4, 'Nude'],
                [5, 'Cloth']
            ];
            layers.forEach(([idx, name]) => {
                schema.push({ group: name, key: `color_layer_${idx}`, label: 'Cor', type: 'color', defaultVal: '#ffffff' });
                schema.push({ group: name, key: `texture_layer_${idx}`, label: 'Textura', type: 'texture', defaultVal: '' });
            });
            return schema;
        },

        HairSchema: function () {
            return [
                { group: 'Cabelo', key: 'hair_color', label: 'Cor', type: 'color', defaultVal: '#ffffff' },
                { group: 'Cabelo', key: 'hair_texture', label: 'Textura', type: 'texture', defaultVal: '' },
                { group: 'Cabelo', key: 'roughness', label: 'Aspereza', type: 'range', min: 0, max: 1, step: 0.01, defaultVal: 0.75 },
                { group: 'Cabelo', key: 'specular', label: 'Brilho', type: 'range', min: 0, max: 1, step: 0.01, defaultVal: 0.25 },
                { group: 'Cabelo', key: 'alpha_boost', label: 'Densidade do fio', type: 'range', min: 0.5, max: 3, step: 0.05, defaultVal: 1.2 },
                { group: 'Rim Light', key: 'rim_color', label: 'Cor do reflexo', type: 'color', defaultVal: '#ffffff' },
                { group: 'Rim Light', key: 'rim_power', label: 'Foco do reflexo', type: 'range', min: 0.5, max: 8, step: 0.1, defaultVal: 3.0 },
                { group: 'Rim Light', key: 'rim_intensity', label: 'Intensidade', type: 'range', min: 0, max: 1, step: 0.01, defaultVal: 0.2 }
            ];
        },

        PbrSchema: function () {
            return [
                { group: 'Albedo', key: 'albedo_color', label: 'Cor', type: 'color', defaultVal: '#ffffff' },
                { group: 'Albedo', key: 'albedo_texture', label: 'Textura', type: 'texture', defaultVal: '' },
                { group: 'Metallic', key: 'metallic', label: 'Valor', type: 'range', min: 0, max: 1, step: 0.01, defaultVal: 0.0 },
                { group: 'Metallic', key: 'metallic_texture', label: 'Textura', type: 'texture', defaultVal: '' },
                { group: 'Roughness', key: 'roughness', label: 'Valor', type: 'range', min: 0, max: 1, step: 0.01, defaultVal: 1.0 },
                { group: 'Roughness', key: 'roughness_texture', label: 'Textura', type: 'texture', defaultVal: '' },
                { group: 'Normal', key: 'normal_texture', label: 'Textura', type: 'texture', defaultVal: '' },
                { group: 'Ambient Occlusion', key: 'ao_light_affect', label: 'Intensidade', type: 'range', min: 0, max: 1, step: 0.01, defaultVal: 0.0 },
                { group: 'Ambient Occlusion', key: 'ao_texture', label: 'Textura', type: 'texture', defaultVal: '' },
                { group: 'Emission', key: 'emission', label: 'Cor', type: 'color', defaultVal: '#000000' },
                { group: 'Emission', key: 'emission_energy', label: 'Intensidade', type: 'range', min: 0, max: 16, step: 0.1, defaultVal: 1.0 },
                { group: 'Emission', key: 'emission_texture', label: 'Textura', type: 'texture', defaultVal: '' }
            ];
        },

        forSlotAndModel: function (slotStr, modelName) {
            const s = String(slotStr || '').toLowerCase();
            const m = String(modelName || '').toLowerCase();
            if (s === 'skin' && m.includes('head')) return this.SkinHeadSchema();
            if (s === 'skin') return this.SkinBodySchema();
            if (s === 'hair') return this.HairSchema();
            return this.PbrSchema();
        }
    };

    // ==================== ESTADO DO MÓDULO SHOP APP ====================
    const state = {
        currentPageName: 'ShopPage',
        previousPageName: 'ShopPage',
        allItems: [],
        filteredItems: [],
        purchasedItems: [],
        createdItems: [],
        wardrobe: { inventory: [], equippedBySlot: {} },
        prefabs: [],
        textures: [],
        cart: [],
        pageIndex: 0,
        pageSize: 8, // 4x2 igual ao PageSize = 8 do AvatarShop.cs
        previewItem: null,
        hiddenPreviewSlots: new Set(),
        // Estado da CreateItemPage
        createGender: 'HM', // 'HM' (Male) ou 'HF' (Female)
        createPreviewMode: 'Thumbnail',
        createAddedResources: [],
        createThumbUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=80',
        createEditId: 0,
        // Callback quando MyTexturesPage é aberta como seletor de textura de um parâmetro de shader
        texturePickerCallback: null
    };

    const SLOT_LABELS = {
        top: 'UpperBody (Torso)',
        upperbody: 'UpperBody (Torso)',
        bottom: 'LowerBody (Legs)',
        lowerbody: 'LowerBody (Legs)',
        fullbody: 'FullBody (Traje)',
        hair: 'Hair (Cabelo)',
        shoes: 'Shoes (Calçados)',
        eyes: 'Eyes (Olhos)',
        skin: 'Skin (Pele/Make)',
        head: 'Head (Chapéu)',
        accessory: 'Accessory (Acessório)'
    };

    function showToast(msg, type, title) {
        if (TFL.toast && typeof TFL.toast[type || 'info'] === 'function') {
            TFL.toast[type || 'info'](msg, title || 'Loja 3D');
        } else if (typeof window.showToast === 'function') {
            window.showToast(msg, type || 'info');
        }
    }

    // ==================== NAVEGAÇÃO INTERNA DE SUB-PÁGINAS ====================
    function showSubPage(pageName) {
        if (state.currentPageName !== pageName) {
            state.previousPageName = state.currentPageName;
        }
        state.currentPageName = pageName;
        $('.shop-app-subpage').addClass('hidden');
        $(`#shopAppPage_${pageName}`).removeClass('hidden');
    }

    function updateCartButtonCount() {
        $('#shopCartBtnLabel').text(`🛍️ Carrinho (${state.cart.length})`);
    }

    function updateWalletHeader(wallet) {
        if (!wallet) return;
        if (wallet.coins !== undefined) {
            $('#shopHeaderCoins').text(Number(wallet.coins || 0).toLocaleString('pt-BR'));
        }
        if (wallet.cash !== undefined) {
            $('#shopHeaderCash').text(Number(wallet.cash || 0).toFixed(2));
        }
    }

    // ==================== CARREGAMENTO DE DADOS DO SHOP APP ====================
    TFL.loadShopAppData = function (callback) {
        const avatarId = TFL.getActiveAvatarId();
        $.get('/profile/shop/app-data', { avatarId }, function (res) {
            if (!res || !res.success) {
                showToast((res && res.error) || 'Não foi possível carregar a loja.', 'error');
                return;
            }
            state.allItems = Array.isArray(res.items) ? res.items : [];
            state.purchasedItems = Array.isArray(res.purchasedItems) ? res.purchasedItems : [];
            state.createdItems = Array.isArray(res.createdItems) ? res.createdItems : [];
            state.wardrobe = res.wardrobe || { inventory: [], equippedBySlot: {} };
            state.prefabs = Array.isArray(res.prefabs) ? res.prefabs : [];
            state.textures = Array.isArray(res.textures) ? res.textures : [];

            updateWalletHeader(res.wallet);
            applyFiltersAndRenderShopPage();
            populateCreateModelSelect();

            if (typeof callback === 'function') callback(res);
        }).fail(function () {
            showToast('Erro de comunicação ao carregar dados da loja.', 'error');
        });
    };

    // ==================== 1. SHOP PAGE (VITRINE PRINCIPAL) ====================
    function applyFiltersAndRenderShopPage() {
        const q = String($('#shopSearchInput').val() || '').trim().toLowerCase();
        const gender = String($('#shopGenderFilter').val() || 'all');
        const slot = String($('#shopSlotFilter').val() || 'all');

        state.filteredItems = state.allItems.filter(item => {
            if (gender !== 'all' && String(item.gender) !== gender) return false;
            if (slot !== 'all' && String(item.slot) !== slot) return false;
            if (q) {
                const hay = `${item.title || ''} ${item.description || ''} ${item.model || ''}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });

        const totalPages = Math.max(1, Math.ceil(state.filteredItems.length / state.pageSize));
        if (state.pageIndex >= totalPages) state.pageIndex = totalPages - 1;
        if (state.pageIndex < 0) state.pageIndex = 0;

        renderShopGrid();
    }

    function renderShopGrid() {
        const $grid = $('#shopItemsGrid');
        $grid.empty();

        const total = state.filteredItems.length;
        const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
        const start = state.pageIndex * state.pageSize;
        const pageItems = state.filteredItems.slice(start, start + state.pageSize);

        $('#shopStatusLabel').text(total === 0 ? 'Nenhum item encontrado.' : `${total} item(ns) encontrado(s).`);
        $('#shopPageIndicator').text(`Página ${state.pageIndex + 1}/${totalPages}`);
        $('#btnShopPrevPage').prop('disabled', state.pageIndex <= 0);
        $('#btnShopNextPage').prop('disabled', state.pageIndex >= totalPages - 1);

        if (pageItems.length === 0) {
            $grid.html(`
                <div class="col-span-full py-16 text-center text-[#808cb3] space-y-2">
                    <i class="fa-solid fa-bag-shopping text-3xl text-[#3d528c]"></i>
                    <p class="text-sm font-bold">Nenhum item encontrado com os filtros atuais.</p>
                </div>
            `);
            return;
        }

        pageItems.forEach(item => {
            const thumb = item.thumb || item.thumbnail || 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=80';
            const genderLabel = item.gender === 'Female' ? 'FEMININO' : (item.gender === 'Male' ? 'MASCULINO' : 'UNIVERSAL');
            const slotLabel = SLOT_LABELS[item.slot] || item.slot || 'UpperBody';
            const priceText = `${Number(item.price || 0).toLocaleString('pt-BR')} ◈`;
            const inCart = state.cart.some(c => Number(c.id) === Number(item.id));

            const cardHtml = `
                <div class="rounded-xl bg-[#131829] border ${item.owned ? 'border-emerald-500/50' : 'border-[#2e3d70] hover:border-[#6685eb]'} p-3.5 flex flex-col justify-between gap-3 transition shadow-lg">
                    <div>
                        <div class="relative w-full h-40 rounded-lg overflow-hidden bg-[#090c17] mb-3 border border-[#242e4d]">
                            <img src="${TFL.escapeHtml(thumb)}" alt="${TFL.escapeHtml(item.title)}" class="w-full h-full object-cover">
                            <span class="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#090c17]/90 border border-[#2e3d70] text-[10px] font-bold text-[#6699ff]">
                                ${TFL.escapeHtml(genderLabel)}
                            </span>
                            ${item.owned ? `
                                <span class="absolute top-2 right-2 px-2 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-black uppercase">
                                    Comprado
                                </span>
                            ` : ''}
                        </div>
                        <div class="text-[10px] font-semibold text-[#8794b8] uppercase truncate">${TFL.escapeHtml(slotLabel)}</div>
                        <h4 class="text-sm font-black text-white truncate mt-0.5" title="${TFL.escapeHtml(item.title)}">${TFL.escapeHtml(item.title)}</h4>
                        <p class="text-xs text-[#8f99b8] line-clamp-2 mt-1 min-h-[32px]">${TFL.escapeHtml(item.description || 'Sem descrição.')}</p>
                    </div>

                    <div class="pt-2.5 border-t border-[#242e4d] space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="text-sm font-black text-[#ffd76a]">${priceText}</span>
                            ${inCart ? `<span class="text-[10px] font-bold text-sky-400">No carrinho</span>` : ''}
                        </div>
                        <button type="button" class="btn-shop-view-item w-full py-2 rounded-lg bg-[#427aff] hover:bg-[#5c8fff] text-xs font-bold text-white transition"
                                data-id="${item.id}">
                            Ver item
                        </button>
                    </div>
                </div>
            `;
            $grid.append(cardHtml);
        });
    }

    // ==================== 2. PREVIEW PAGE (ShopPreviewPage.cs) ====================
    function openPreviewPage(itemId) {
        const item = state.allItems.find(i => Number(i.id) === Number(itemId))
                  || state.purchasedItems.find(i => Number(i.id) === Number(itemId))
                  || state.createdItems.find(i => Number(i.id) === Number(itemId));
        if (!item) return;

        state.previewItem = item;
        state.hiddenPreviewSlots.clear();
        updatePreviewHiddenSlotsUi();

        const genderMap = { Female: 'FEMININO', Male: 'MASCULINO', Universal: 'UNIVERSAL' };
        const genderLabel = genderMap[item.gender] || 'UNIVERSAL';
        const slotLabel = SLOT_LABELS[item.slot] || item.slot || 'UpperBody';
        const thumb = item.thumb || item.thumbnail || 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=80';

        $('#previewCategoryLabel').text(`${genderLabel} • ${slotLabel}`);
        $('#previewTitleLabel').text(item.title || 'Item 3D');
        $('#previewPriceLabel').text(`${Number(item.price || 0).toLocaleString('pt-BR')} ◈ (${item.currencyType || 'Coins'})`);
        $('#previewDescLabel').text(item.description || 'Sem descrição.');
        $('#previewItemImage').attr('src', thumb);
        $('#previewMeshBadge').text(item.model || item.prefabPath || `slot:${item.slot}`);

        // Pílulas de recursos 3D / Shaders
        const $pills = $('#previewResourcesPills').empty();
        const resList = Array.isArray(item.items) ? item.items : [];
        if (resList.length > 0) {
            resList.forEach(r => {
                $pills.append(`
                    <span class="px-2.5 py-1 rounded-lg bg-[#131829] border border-[#2e3d70] text-[11px] text-[#9ea8c7]">
                        Mesh: <strong class="text-white">${TFL.escapeHtml(r.model || item.model || '3D')}</strong>
                    </span>
                `);
            });
        }

        if (item.owned) {
            $('#btnPreviewAddToCart').text('Já está no seu Inventário').prop('disabled', true).addClass('opacity-50');
            $('#btnPreviewBuyNow').text('Já Comprado ✔').prop('disabled', true).addClass('opacity-50');
        } else {
            $('#btnPreviewAddToCart').text('Adicionar ao carrinho').prop('disabled', false).removeClass('opacity-50');
            $('#btnPreviewBuyNow').text('Comprar agora').prop('disabled', false).removeClass('opacity-50');
        }

        showSubPage('PreviewPage');
    }

    function updatePreviewHiddenSlotsUi() {
        $('.btn-preview-hide-slot').each(function () {
            const slot = $(this).data('slot');
            const isHidden = state.hiddenPreviewSlots.has(slot);
            const $ind = $(this).find('.slot-eye-indicator');
            if (isHidden) {
                $(this).addClass('border-amber-400 bg-amber-500/20');
                $ind.text('Oculto').removeClass('text-emerald-400').addClass('text-amber-300');
            } else {
                $(this).removeClass('border-amber-400 bg-amber-500/20');
                $ind.text('Visível').removeClass('text-amber-300').addClass('text-emerald-400');
            }
        });

        if (state.hiddenPreviewSlots.size > 0) {
            $('#previewHiddenSlotsBanner').removeClass('hidden');
            $('#previewHiddenSlotsList').text(Array.from(state.hiddenPreviewSlots).join(', '));
        } else {
            $('#previewHiddenSlotsBanner').addClass('hidden');
        }
    }

    // ==================== 3. CART PAGE (ShopCardPage.cs) ====================
    function addToCart(item) {
        if (!item) return;
        if (item.owned) {
            showToast('Você já possui este item no seu inventário!', 'info');
            return;
        }
        if (state.cart.some(c => Number(c.id) === Number(item.id))) {
            showToast(`"${item.title}" já está no seu carrinho.`, 'info');
            return;
        }
        state.cart.push(item);
        updateCartButtonCount();
        renderShopGrid();
        showToast(`"${item.title}" adicionado ao carrinho!`, 'success');
    }

    function removeFromCart(itemId) {
        state.cart = state.cart.filter(c => Number(c.id) !== Number(itemId));
        updateCartButtonCount();
        renderCartPage();
        renderShopGrid();
    }

    function renderCartPage() {
        const $list = $('#shopCartItemsList').empty();
        let total = 0;

        if (state.cart.length === 0) {
            $list.html(`
                <div class="py-12 text-center text-[#7885a8]">
                    Seu carrinho está vazio.
                </div>
            `);
        } else {
            state.cart.forEach(item => {
                const price = Number(item.price || 0);
                total += price;
                const thumb = item.thumb || item.thumbnail || 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=80';
                $list.append(`
                    <div class="p-3 rounded-xl bg-[#1a223b] border border-[#2e3d70] flex items-center justify-between gap-3">
                        <div class="flex items-center gap-3 overflow-hidden">
                            <img src="${TFL.escapeHtml(thumb)}" class="w-12 h-12 rounded-lg object-cover border border-[#384d85] flex-shrink-0">
                            <div class="overflow-hidden">
                                <h5 class="text-sm font-bold text-white truncate">${TFL.escapeHtml(item.title)}</h5>
                                <span class="text-[11px] text-[#8794b8] uppercase">${TFL.escapeHtml(SLOT_LABELS[item.slot] || item.slot)}</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-4">
                            <span class="text-sm font-black text-[#ffd76a]">${price.toLocaleString('pt-BR')} ◈</span>
                            <button type="button" class="btn-cart-remove w-8 h-8 rounded-lg bg-[#e02424]/20 hover:bg-[#e02424] text-red-300 hover:text-white font-black transition"
                                    data-id="${item.id}" title="Remover">
                                ×
                            </button>
                        </div>
                    </div>
                `);
            });
        }

        $('#cartItemCountLabel').text(`Itens: ${state.cart.length}`);
        $('#cartTotalPriceLabel').text(`Total: ${total.toLocaleString('pt-BR')} ◈`);
        $('#btnCartCheckout').prop('disabled', state.cart.length === 0);
    }

    function checkoutCart(customItemIds) {
        const avatarId = TFL.getActiveAvatarId();
        const ids = Array.isArray(customItemIds) ? customItemIds : state.cart.map(i => i.id);
        if (ids.length === 0) return;

        const autoEquip = $('#chkCartAutoEquip').is(':checked');
        const $btn = $('#btnCartCheckout');
        $btn.prop('disabled', true).text('Processando...');

        $.ajax({
            url: '/profile/shop/checkout',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ avatarId, itemIds: ids, autoEquip }),
            success: function (res) {
                $btn.prop('disabled', false).text('Finalizar compra');
                if (res && res.success) {
                    showToast(`Compra concluída! ${res.purchasedCount} item(ns) adicionado(s) ao seu Inventário.`, 'success');
                    if (!customItemIds) {
                        state.cart = [];
                        updateCartButtonCount();
                    } else {
                        state.cart = state.cart.filter(c => !ids.includes(c.id));
                        updateCartButtonCount();
                    }
                    TFL.loadShopAppData(function () {
                        openInventoryPage('purchased');
                    });
                    if (typeof TFL.refreshPartial === 'function') {
                        TFL.refreshPartial('sidebar');
                        TFL.refreshPartial('view-avatar');
                    }
                } else {
                    showToast((res && res.error) || 'Não foi possível finalizar a compra.', 'error');
                }
            },
            error: function (xhr) {
                $btn.prop('disabled', false).text('Finalizar compra');
                const msg = (xhr.responseJSON && xhr.responseJSON.error) || 'Falha ao processar compra.';
                showToast(msg, 'error');
            }
        });
    }

    // ==================== 4. CREATE ITEM PAGE (CreateItemPage.cs + ParamSchema.cs) ====================
    function openCreateItemPage(editItem) {
        if (editItem) {
            state.createEditId = Number(editItem.id);
            $('#createItemHeaderTitle').text(`Editar item #${editItem.id}`);
            $('#btnCreateSubmitItem').text('Salvar Alterações');
            $('#inputCreateTitle').val(editItem.title || '');
            $('#inputCreateDesc').val(editItem.description || '');
            $('#inputCreatePrice').val(Number(editItem.price || 0));
            state.createThumbUrl = editItem.thumb || editItem.thumbnail || state.createThumbUrl;
            $('#createThumbPreviewImg').attr('src', state.createThumbUrl);
            state.createGender = editItem.gender === 'Female' ? 'HF' : 'HM';
            state.createAddedResources = Array.isArray(editItem.items) && editItem.items.length > 0
                ? JSON.parse(JSON.stringify(editItem.items))
                : [{
                    model: editItem.model || editItem.prefabPath || 'HM_Jacket_Cyber',
                    slot: editItem.slot || 'UpperBody',
                    shader: 'standard_pbr_3d',
                    values: {},
                    colors: { albedo_color: '#ffffff' },
                    bools: {},
                    textures_paths: {}
                }];
        } else {
            state.createEditId = 0;
            $('#createItemHeaderTitle').text('Criar novo item');
            $('#btnCreateSubmitItem').text('Create');
            $('#inputCreateTitle').val('');
            $('#inputCreateDesc').val('');
            $('#inputCreatePrice').val('50');
            state.createAddedResources = [];
        }

        updateCreateGenderButtons();
        populateCreateModelSelect();
        renderCreateAddedResources();
        showSubPage('CreateItemPage');
    }

    function updateCreateGenderButtons() {
        if (state.createGender === 'HM') {
            $('#btnCreateGenderMale').addClass('ring-2 ring-white').removeClass('opacity-60');
            $('#btnCreateGenderFemale').removeClass('ring-2 ring-white').addClass('opacity-60');
        } else {
            $('#btnCreateGenderFemale').addClass('ring-2 ring-white').removeClass('opacity-60');
            $('#btnCreateGenderMale').removeClass('ring-2 ring-white').addClass('opacity-60');
        }
    }

    function populateCreateModelSelect() {
        const $sel = $('#selectCreateModel').empty();
        const tag = state.createGender; // 'HM' ou 'HF'
        const matching = state.prefabs.filter(p => {
            const pathStr = String(p.path || p.addressable || p.name || '');
            return pathStr.includes(tag);
        });

        const list = matching.length > 0 ? matching : state.prefabs;
        if (list.length === 0) {
            $sel.append(`<option value="HM_Jacket_Cyber" data-slot="UpperBody">HM Jacket Cyber (UpperBody)</option>`);
            return;
        }

        list.forEach((p, idx) => {
            const cleanName = String(p.name || p.addressable || `Model #${idx + 1}`).replace(/^H[MF][\s_]*/i, '');
            const slotName = p.slot || 'UpperBody';
            $sel.append(`<option value="${TFL.escapeHtml(p.addressable || p.name)}" data-slot="${TFL.escapeHtml(slotName)}" data-name="${TFL.escapeHtml(p.name)}">${TFL.escapeHtml(cleanName)} (${TFL.escapeHtml(slotName)})</option>`);
        });
    }

    function addSelectedModelToCreateList() {
        const $opt = $('#selectCreateModel option:selected');
        const modelAddress = $opt.val();
        if (!modelAddress) return;

        const slotStr = $opt.data('slot') || 'UpperBody';
        const rawName = $opt.data('name') || modelAddress;

        if (state.createAddedResources.some(r => String(r.slot).toLowerCase() === String(slotStr).toLowerCase())) {
            showToast(`O slot "${slotStr}" já foi adicionado a este item.`, 'warning');
            return;
        }

        const schema = ParamSchema.forSlotAndModel(slotStr, rawName);
        const resItem = {
            model: modelAddress,
            slot: slotStr,
            shader: slotStr.toLowerCase() === 'hair' ? 'hair_shader' : (slotStr.toLowerCase() === 'skin' ? 'skin_shader' : 'standard_pbr_3d'),
            values: {},
            colors: {},
            bools: {},
            ints: {},
            strings: {},
            vectors: {},
            textures_paths: {}
        };

        // Preenche defaults do ParamSchema igual ao InitDefaults de CreateItemPage.cs
        schema.forEach(p => {
            if (p.type === 'range') resItem.values[p.key] = p.defaultVal;
            else if (p.type === 'color') resItem.colors[p.key] = p.defaultVal;
            else if (p.type === 'bool') resItem.bools[p.key] = p.defaultVal;
            else if (p.type === 'texture') resItem.textures_paths[p.key] = p.defaultVal;
        });

        state.createAddedResources.push(resItem);
        renderCreateAddedResources();
    }

    function renderCreateAddedResources() {
        const $container = $('#createAddedItemsList').empty();
        $('#createAddedItemsCount').text(`${state.createAddedResources.length} modelo(s)`);

        if (state.createAddedResources.length === 0) {
            $container.html(`
                <div class="p-4 rounded-xl bg-[#090c17]/70 border border-[#242e4d] text-center text-xs text-[#7885a8]">
                    Selecione um Modelo (mesh) acima e clique em <strong>+ Adicionar item</strong> para configurar cores, texturas e shaders.
                </div>
            `);
            return;
        }

        state.createAddedResources.forEach((resItem, idx) => {
            const schema = ParamSchema.forSlotAndModel(resItem.slot, resItem.model);
            const groups = {};
            schema.forEach(p => {
                const g = p.group || 'Geral';
                if (!groups[g]) groups[g] = [];
                groups[g].push(p);
            });

            let groupsHtml = '';
            Object.keys(groups).forEach(gName => {
                let rowsHtml = '';
                groups[gName].forEach(p => {
                    if (p.type === 'color') {
                        const val = (resItem.colors && resItem.colors[p.key]) || p.defaultVal || '#ffffff';
                        rowsHtml += `
                            <div class="flex items-center justify-between gap-2 py-1">
                                <span class="text-[11px] text-[#c7d0eb]">${TFL.escapeHtml(p.label)}</span>
                                <input type="color" class="input-schema-color w-8 h-6 rounded cursor-pointer bg-transparent border border-[#384d85]"
                                       data-res-idx="${idx}" data-key="${p.key}" value="${val}">
                            </div>
                        `;
                    } else if (p.type === 'range') {
                        const val = (resItem.values && resItem.values[p.key] !== undefined) ? resItem.values[p.key] : p.defaultVal;
                        rowsHtml += `
                            <div class="flex items-center justify-between gap-3 py-1">
                                <span class="text-[11px] text-[#c7d0eb] w-28 truncate">${TFL.escapeHtml(p.label)}</span>
                                <input type="range" class="input-schema-range flex-1 accent-[#427aff]"
                                       min="${p.min}" max="${p.max}" step="${p.step}"
                                       data-res-idx="${idx}" data-key="${p.key}" value="${val}">
                                <span class="schema-range-val text-[11px] font-mono text-[#8794b8] w-10 text-right">${Number(val).toFixed(2)}</span>
                            </div>
                        `;
                    } else if (p.type === 'bool') {
                        const val = Boolean(resItem.bools && resItem.bools[p.key]);
                        rowsHtml += `
                            <div class="flex items-center justify-between gap-2 py-1">
                                <span class="text-[11px] text-[#c7d0eb]">${TFL.escapeHtml(p.label)}</span>
                                <input type="checkbox" class="input-schema-bool rounded bg-[#1a223b] border-[#384d85] text-[#427aff]"
                                       data-res-idx="${idx}" data-key="${p.key}" ${val ? 'checked' : ''}>
                            </div>
                        `;
                    } else if (p.type === 'texture') {
                        const texUrl = (resItem.textures_paths && resItem.textures_paths[p.key]) || '';
                        const shortName = texUrl ? texUrl.split('/').pop().slice(0, 18) : 'Selecionar...';
                        rowsHtml += `
                            <div class="flex items-center justify-between gap-2 py-1">
                                <span class="text-[11px] text-[#c7d0eb]">${TFL.escapeHtml(p.label)}</span>
                                <div class="flex items-center gap-1.5">
                                    <button type="button" class="btn-schema-pick-texture px-2.5 py-1 rounded bg-[#1f2947] hover:bg-[#427aff] border border-[#3d528c] text-[11px] font-bold text-white transition"
                                            data-res-idx="${idx}" data-key="${p.key}">
                                        ${TFL.escapeHtml(shortName)}
                                    </button>
                                    ${texUrl ? `
                                        <button type="button" class="btn-schema-clear-texture px-1.5 py-1 rounded bg-red-500/20 hover:bg-red-600 text-[10px] text-red-300 hover:text-white font-bold"
                                                data-res-idx="${idx}" data-key="${p.key}" title="Limpar textura">✕</button>
                                    ` : ''}
                                </div>
                            </div>
                        `;
                    }
                });

                groupsHtml += `
                    <div class="p-2.5 rounded-lg bg-[#090c17]/70 border border-[#242e4d] space-y-1">
                        <div class="text-[10px] font-black uppercase tracking-wider text-[#6699ff] mb-1">${TFL.escapeHtml(gName)}</div>
                        ${rowsHtml}
                    </div>
                `;
            });

            $container.append(`
                <div class="rounded-xl bg-[#1a223b] border border-[#384d85] overflow-hidden">
                    <div class="p-3 bg-[#1f2947] flex items-center justify-between gap-2">
                        <button type="button" class="btn-toggle-accordion flex-1 text-left text-xs font-black text-white flex items-center gap-2" data-idx="${idx}">
                            <span class="accordion-arrow">▼</span>
                            <span>${TFL.escapeHtml(resItem.model)}</span>
                            <span class="px-2 py-0.5 rounded bg-[#090c17] text-[10px] text-[#6699ff]">${TFL.escapeHtml(String(resItem.slot))}</span>
                        </button>
                        <button type="button" class="btn-remove-added-res w-7 h-7 rounded bg-red-500/20 hover:bg-red-600 text-red-300 hover:text-white text-xs font-black transition"
                                data-idx="${idx}" title="Remover modelo">
                            ✕
                        </button>
                    </div>
                    <div id="createResAccordionBody_${idx}" class="p-3 space-y-2.5">
                        ${groupsHtml}
                    </div>
                </div>
            `);
        });
    }

    function submitCreateItem() {
        const title = String($('#inputCreateTitle').val() || '').trim();
        const description = String($('#inputCreateDesc').val() || '').trim();
        const price = Number($('#inputCreatePrice').val() || 0);

        if (!title) {
            showToast('Informe um título para o item.', 'warning');
            return;
        }
        if (state.createAddedResources.length === 0) {
            showToast('Adicione pelo menos 1 modelo (mesh) antes de criar o item.', 'warning');
            return;
        }

        const payload = {
            id: state.createEditId || undefined,
            avatarId: TFL.getActiveAvatarId(),
            title,
            description,
            price,
            gender: state.createGender === 'HF' ? 'Female' : 'Male',
            thumb: state.createThumbUrl,
            items: state.createAddedResources
        };

        const $btn = $('#btnCreateSubmitItem');
        $btn.prop('disabled', true).text('Salvando...');

        $.ajax({
            url: '/profile/shop/create-item',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function (res) {
                $btn.prop('disabled', false).text(state.createEditId ? 'Salvar Alterações' : 'Create');
                if (res && res.success) {
                    showToast(state.createEditId ? 'Item atualizado com sucesso!' : 'Novo item 3D publicado na Loja!', 'success');
                    TFL.loadShopAppData(function () {
                        showSubPage('ShopPage');
                    });
                } else {
                    showToast((res && res.error) || 'Erro ao salvar item.', 'error');
                }
            },
            error: function (xhr) {
                $btn.prop('disabled', false).text(state.createEditId ? 'Salvar Alterações' : 'Create');
                showToast((xhr.responseJSON && xhr.responseJSON.error) || 'Falha ao salvar item.', 'error');
            }
        });
    }

    // ==================== 5. MY TEXTURES PAGE + UPLOAD FORM ====================
    function openMyTexturesPage(pickerCallback) {
        state.texturePickerCallback = typeof pickerCallback === 'function' ? pickerCallback : null;
        if (state.texturePickerCallback) {
            $('#texturePickerModeBanner').removeClass('hidden');
        } else {
            $('#texturePickerModeBanner').addClass('hidden');
        }
        renderTexturesGrid();
        showSubPage('MyTexturesPage');
    }

    function renderTexturesGrid() {
        const $grid = $('#shopTexturesGrid').empty();
        const q = String($('#inputTextureSearch').val() || '').trim().toLowerCase();

        const list = state.textures.filter(t => {
            if (!q) return true;
            return String(t.name || '').toLowerCase().includes(q);
        });

        if (list.length === 0) {
            $grid.html(`
                <div class="col-span-full py-12 text-center text-xs text-[#7885a8]">
                    Nenhuma textura encontrada. Clique em <strong>Upload</strong> para enviar uma nova textura PNG.
                </div>
            `);
            return;
        }

        list.forEach(tex => {
            const imgUrl = tex.url || tex.path || '';
            $grid.append(`
                <div class="rounded-xl bg-[#131829] border border-[#2e3d70] p-3 flex flex-col justify-between gap-2">
                    <div class="w-full aspect-square rounded-lg bg-[#090c17] border border-[#242e4d] overflow-hidden flex items-center justify-center">
                        <img src="${TFL.escapeHtml(imgUrl)}" alt="${TFL.escapeHtml(tex.name)}" class="w-full h-full object-cover">
                    </div>
                    <div>
                        <div class="text-xs font-bold text-white truncate" title="${TFL.escapeHtml(tex.name)}">${TFL.escapeHtml(tex.name || 'Textura')}</div>
                        <div class="text-[10px] text-emerald-400 uppercase font-semibold">${TFL.escapeHtml(tex.status || 'done')}</div>
                    </div>
                    <button type="button" class="btn-select-texture-card w-full py-1.5 rounded-lg bg-[#427aff] hover:bg-[#5c8fff] text-[11px] font-bold text-white transition"
                            data-url="${TFL.escapeHtml(imgUrl)}" data-name="${TFL.escapeHtml(tex.name || 'Textura')}">
                        ${state.texturePickerCallback ? 'Selecionar' : 'Usar em novo item'}
                    </button>
                </div>
            `);
        });
    }

    // ==================== 6. INVENTORY PAGE (InventoryPage.cs) ====================
    function openInventoryPage(tab) {
        renderInventoryGrids();
        switchInventoryTab(tab || 'purchased');
        showSubPage('InventoryPage');
    }

    function switchInventoryTab(tab) {
        if (tab === 'created') {
            $('#btnInvTabCreated').addClass('bg-[#427aff] font-black').removeClass('bg-[#1f2947]');
            $('#btnInvTabPurchased').removeClass('bg-[#427aff] font-black').addClass('bg-[#1f2947]');
            $('#shopInvPurchasedWrap').addClass('hidden');
            $('#shopInvCreatedWrap').removeClass('hidden');
        } else {
            $('#btnInvTabPurchased').addClass('bg-[#427aff] font-black').removeClass('bg-[#1f2947]');
            $('#btnInvTabCreated').removeClass('bg-[#427aff] font-black').addClass('bg-[#1f2947]');
            $('#shopInvCreatedWrap').addClass('hidden');
            $('#shopInvPurchasedWrap').removeClass('hidden');
        }
    }

    function renderInventoryGrids() {
        const $pGrid = $('#shopInvPurchasedGrid').empty();
        const $cGrid = $('#shopInvCreatedGrid').empty();

        const invList = (state.wardrobe && Array.isArray(state.wardrobe.inventory)) ? state.wardrobe.inventory : [];

        if (invList.length === 0) {
            $pGrid.html(`
                <div class="col-span-full py-12 text-center text-xs text-[#7885a8]">
                    Você ainda não comprou nenhum item na loja.
                </div>
            `);
        } else {
            invList.forEach(inv => {
                const thumb = inv.thumbnail || inv.thumb || 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=80';
                $pGrid.append(`
                    <div class="rounded-xl bg-[#131829] border ${inv.isEquipped ? 'border-cyan-400' : 'border-[#2e3d70]'} p-3.5 flex flex-col justify-between gap-3">
                        <div>
                            <div class="relative w-full h-36 rounded-lg overflow-hidden bg-[#090c17] mb-2.5">
                                <img src="${TFL.escapeHtml(thumb)}" class="w-full h-full object-cover">
                                ${inv.isEquipped ? `<span class="absolute top-2 right-2 px-2 py-0.5 rounded bg-cyan-400 text-slate-950 text-[10px] font-black uppercase">Equipado</span>` : ''}
                            </div>
                            <div class="text-[10px] font-bold text-[#6699ff] uppercase">${TFL.escapeHtml(SLOT_LABELS[inv.slot] || inv.slot)}</div>
                            <h4 class="text-sm font-black text-white truncate">${TFL.escapeHtml(inv.itemName || inv.name)}</h4>
                        </div>
                        <button type="button" class="btn-shop-inv-equip w-full py-2 rounded-lg ${inv.isEquipped ? 'bg-slate-800 hover:bg-red-600 text-zinc-200' : 'bg-[#427aff] hover:bg-[#5c8fff] text-white'} text-xs font-bold transition"
                                data-inv-id="${inv.inventoryId || inv.id}">
                            ${inv.isEquipped ? 'Despir' : 'Equipar'}
                        </button>
                    </div>
                `);
            });
        }

        if (state.createdItems.length === 0) {
            $cGrid.html(`
                <div class="col-span-full py-12 text-center text-xs text-[#7885a8]">
                    Você ainda não criou nenhum item. Clique em <strong>+ Criar item</strong> na loja!
                </div>
            `);
        } else {
            state.createdItems.forEach(item => {
                const thumb = item.thumb || item.thumbnail || 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=80';
                $cGrid.append(`
                    <div class="rounded-xl bg-[#131829] border border-[#2e3d70] p-3.5 flex flex-col justify-between gap-3">
                        <div>
                            <div class="w-full h-36 rounded-lg overflow-hidden bg-[#090c17] mb-2.5">
                                <img src="${TFL.escapeHtml(thumb)}" class="w-full h-full object-cover">
                            </div>
                            <h4 class="text-sm font-black text-white truncate">${TFL.escapeHtml(item.title)}</h4>
                            <div class="flex items-center justify-between mt-1 text-xs">
                                <span class="font-bold text-[#ffd76a]">${Number(item.price || 0).toLocaleString('pt-BR')} ◈</span>
                                <span class="font-bold text-emerald-400">Vendas: ${Number(item.sales || 0)}</span>
                            </div>
                        </div>
                        <button type="button" class="btn-shop-inv-edit w-full py-2 rounded-lg bg-[#1f2947] hover:bg-[#427aff] border border-[#3d528c] text-xs font-bold text-white transition"
                                data-id="${item.id}">
                            Editar
                        </button>
                    </div>
                `);
            });
        }
    }

    // ==================== 7. REVIEWS PAGE (ReviewsPage.cs) ====================
    function openReviewsPage(item) {
        if (!item) return;
        $('#reviewsItemTitle').text(item.title || 'Estatísticas do Item');
        $.get(`/profile/shop/item/${item.id}/stats`, function (res) {
            const st = (res && res.stats) || { likes: 0, favorites: 0, sales: item.sales || 0, shares: 0 };
            $('#reviewsLikesLabel').text(st.likes);
            $('#reviewsFavoritesLabel').text(st.favorites);
            $('#reviewsSalesLabel').text(st.sales);
            $('#reviewsSharesLabel').text(st.shares);
            showSubPage('ReviewsPage');
        });
    }

    // ==================== EVENT LISTENERS ====================
    $(document).ready(function () {
        // Carrega os dados quando o usuário abre a view-shop na sidebar ou por atalho
        $(document).on('click', '.nav-item[data-view="view-shop"], .btn-open-shop-module', function () {
            $('.nav-item').removeClass('bg-blue-600 text-white shadow-lg shadow-blue-600/30')
                          .addClass('text-zinc-400 hover:text-white hover:bg-slate-800/60');
            $('.nav-item[data-view="view-shop"]')
                .addClass('bg-blue-600 text-white shadow-lg shadow-blue-600/30')
                .removeClass('text-zinc-400 hover:text-white hover:bg-slate-800/60');

            $('.view-panel').addClass('hidden');
            $('#view-shop').removeClass('hidden');
            showSubPage('ShopPage');
            TFL.loadShopAppData();
        });

        // Atalho para abrir Manequim & Guarda-Roupa em view-avatar
        $(document).on('click', '.btn-go-avatar-wardrobe', function () {
            $('.nav-item[data-view="view-avatar"]').trigger('click');
        });

        // Header buttons da ShopPage
        $(document).on('click', '#btnShopOpenCreate', function () {
            openCreateItemPage(null);
        });
        $(document).on('click', '#btnShopOpenTextures', function () {
            openMyTexturesPage(null);
        });
        $(document).on('click', '#btnShopOpenInventory', function () {
            openInventoryPage('purchased');
        });
        $(document).on('click', '#btnShopOpenCart, #btnPreviewOpenCart', function () {
            renderCartPage();
            showSubPage('CartPage');
        });

        // Filtros e paginação da ShopPage
        $(document).on('click', '#btnShopSearch', function () {
            state.pageIndex = 0;
            applyFiltersAndRenderShopPage();
        });
        $(document).on('keyup', '#shopSearchInput', function (e) {
            if (e.key === 'Enter') {
                state.pageIndex = 0;
                applyFiltersAndRenderShopPage();
            }
        });
        $(document).on('change', '#shopGenderFilter, #shopSlotFilter', function () {
            state.pageIndex = 0;
            applyFiltersAndRenderShopPage();
        });
        $(document).on('click', '#btnShopPrevPage', function () {
            if (state.pageIndex > 0) {
                state.pageIndex--;
                renderShopGrid();
            }
        });
        $(document).on('click', '#btnShopNextPage', function () {
            const totalPages = Math.max(1, Math.ceil(state.filteredItems.length / state.pageSize));
            if (state.pageIndex < totalPages - 1) {
                state.pageIndex++;
                renderShopGrid();
            }
        });

        // Abrir PreviewPage ao clicar em "Ver item"
        $(document).on('click', '.btn-shop-view-item', function () {
            openPreviewPage($(this).data('id'));
        });
        $(document).on('click', '#btnPreviewBackToShop, #btnCartBackToShop, #btnInventoryBackToShop', function () {
            showSubPage('ShopPage');
        });

        // Remover/ocultar slot no PreviewPage (Torso / Leg / Shoes)
        $(document).on('click', '.btn-preview-hide-slot', function () {
            const slot = $(this).data('slot');
            if (state.hiddenPreviewSlots.has(slot)) state.hiddenPreviewSlots.delete(slot);
            else state.hiddenPreviewSlots.add(slot);
            updatePreviewHiddenSlotsUi();
        });

        // Ações do PreviewPage
        $(document).on('click', '#btnPreviewAddToCart', function () {
            addToCart(state.previewItem);
        });
        $(document).on('click', '#btnPreviewBuyNow', function () {
            if (!state.previewItem) return;
            checkoutCart([state.previewItem.id]);
        });
        $(document).on('click', '#btnPreviewGiftItem', function () {
            if (!state.previewItem) return;
            $('#giftModalItemTitle').text(`${state.previewItem.title} (${Number(state.previewItem.price || 0).toLocaleString('pt-BR')} Coins)`);
            $('#inputGiftTargetAvatar').val('');
            $('#inputGiftMessage').val('');
            $('#modalShopGiftItem').removeClass('hidden');
        });
        $(document).on('click', '#btnCloseShopGiftModal, #btnCancelShopGiftModal', function () {
            $('#modalShopGiftItem').addClass('hidden');
        });
        $(document).on('click', '#btnConfirmShopGift', function () {
            if (!state.previewItem) return;
            const target = String($('#inputGiftTargetAvatar').val() || '').trim();
            const message = String($('#inputGiftMessage').val() || '').trim();
            if (!target) {
                showToast('Informe o ID ou Nickname do Avatar destinatário.', 'warning');
                return;
            }
            const $btn = $(this);
            $btn.prop('disabled', true).text('Enviando...');
            $.ajax({
                url: '/profile/shop/gift',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    avatarId: TFL.getActiveAvatarId(),
                    itemId: state.previewItem.id,
                    targetAvatarIdOrName: target,
                    message
                }),
                success: function (res) {
                    $btn.prop('disabled', false).text('🎁 Enviar Presente');
                    if (res && res.success) {
                        $('#modalShopGiftItem').addClass('hidden');
                        showToast(`Presente "${res.itemName}" enviado para ${res.recipientName} (#${res.recipientAvatarId})!`, 'success');
                        if (res.senderWallet) updateWalletHeader(res.senderWallet);
                    } else {
                        showToast((res && res.error) || 'Não foi possível enviar o presente.', 'error');
                    }
                },
                error: function (xhr) {
                    $btn.prop('disabled', false).text('🎁 Enviar Presente');
                    showToast((xhr.responseJSON && xhr.responseJSON.error) || 'Falha ao enviar presente.', 'error');
                }
            });
        });
        $(document).on('click', '#btnPreviewOpenStats', function () {
            openReviewsPage(state.previewItem);
        });
        $(document).on('click', '#btnReviewsBack', function () {
            showSubPage('PreviewPage');
        });

        // Ações da CartPage
        $(document).on('click', '.btn-cart-remove', function () {
            removeFromCart($(this).data('id'));
        });
        $(document).on('click', '#btnCartCheckout', function () {
            checkoutCart();
        });

        // Ações da CreateItemPage
        $(document).on('click', '#btnCreateClose', function () {
            showSubPage('ShopPage');
        });
        $(document).on('click', '#btnCreateGenderMale', function () {
            state.createGender = 'HM';
            state.createAddedResources = [];
            updateCreateGenderButtons();
            populateCreateModelSelect();
            renderCreateAddedResources();
        });
        $(document).on('click', '#btnCreateGenderFemale', function () {
            state.createGender = 'HF';
            state.createAddedResources = [];
            updateCreateGenderButtons();
            populateCreateModelSelect();
            renderCreateAddedResources();
        });
        $(document).on('click', '#btnCreateAddMeshItem', function () {
            addSelectedModelToCreateList();
        });
        $(document).on('click', '.btn-remove-added-res', function () {
            const idx = Number($(this).data('idx'));
            state.createAddedResources.splice(idx, 1);
            renderCreateAddedResources();
        });
        $(document).on('click', '.btn-toggle-accordion', function () {
            const idx = $(this).data('idx');
            const $body = $(`#createResAccordionBody_${idx}`);
            $body.toggleClass('hidden');
        });

        // Alteração de parâmetros do ParamSchema em tempo real
        $(document).on('input change', '.input-schema-color', function () {
            const idx = Number($(this).data('res-idx'));
            const key = $(this).data('key');
            if (state.createAddedResources[idx]) {
                state.createAddedResources[idx].colors[key] = $(this).val();
            }
        });
        $(document).on('input change', '.input-schema-range', function () {
            const idx = Number($(this).data('res-idx'));
            const key = $(this).data('key');
            const val = parseFloat($(this).val());
            $(this).siblings('.schema-range-val').text(val.toFixed(2));
            if (state.createAddedResources[idx]) {
                state.createAddedResources[idx].values[key] = val;
            }
        });
        $(document).on('change', '.input-schema-bool', function () {
            const idx = Number($(this).data('res-idx'));
            const key = $(this).data('key');
            if (state.createAddedResources[idx]) {
                state.createAddedResources[idx].bools[key] = $(this).is(':checked');
            }
        });
        $(document).on('click', '.btn-schema-pick-texture', function () {
            const idx = Number($(this).data('res-idx'));
            const key = $(this).data('key');
            openMyTexturesPage(function (selectedUrl) {
                if (state.createAddedResources[idx]) {
                    state.createAddedResources[idx].textures_paths[key] = selectedUrl;
                }
                renderCreateAddedResources();
                showSubPage('CreateItemPage');
            });
        });
        $(document).on('click', '.btn-schema-clear-texture', function () {
            const idx = Number($(this).data('res-idx'));
            const key = $(this).data('key');
            if (state.createAddedResources[idx]) {
                delete state.createAddedResources[idx].textures_paths[key];
                renderCreateAddedResources();
            }
        });

        // Capturar / Enviar Thumbnail na CreateItemPage
        $(document).on('click', '#btnCreateCaptureThumb', function () {
            $('#inputCreateThumbFile').trigger('click');
        });
        $(document).on('change', '#inputCreateThumbFile', function () {
            const file = this.files && this.files[0];
            if (!file) return;
            const fd = new FormData();
            fd.append('photo', file);
            $.ajax({
                url: '/profile/upload/avatar-image',
                method: 'POST',
                data: fd,
                processData: false,
                contentType: false,
                success: function (res) {
                    if (res && res.success && res.url) {
                        state.createThumbUrl = res.url;
                        $('#createThumbPreviewImg').attr('src', res.url);
                        showToast('Thumbnail atualizada!', 'success');
                    }
                }
            });
        });
        $(document).on('click', '#btnCreateTogglePreviewMode', function () {
            state.createPreviewMode = state.createPreviewMode === 'Thumbnail' ? 'Item' : 'Thumbnail';
            $('#createPreviewModeBadge').text(`Modo: ${state.createPreviewMode}`);
            $(this).text(`🔄 Alternar preview (Modo: ${state.createPreviewMode})`);
        });
        $(document).on('click', '#btnCreateSubmitItem', function () {
            submitCreateItem();
        });

        // Ações da MyTexturesPage + UploadForm
        $(document).on('click', '#btnTexturesBack, #btnCancelTexturePicker', function () {
            if (state.texturePickerCallback) {
                state.texturePickerCallback = null;
                showSubPage('CreateItemPage');
            } else {
                showSubPage('ShopPage');
            }
        });
        $(document).on('input', '#inputTextureSearch', function () {
            renderTexturesGrid();
        });
        $(document).on('click', '.btn-select-texture-card', function () {
            const url = $(this).data('url');
            if (state.texturePickerCallback) {
                const cb = state.texturePickerCallback;
                state.texturePickerCallback = null;
                cb(url);
            } else {
                openCreateItemPage(null);
            }
        });
        $(document).on('click', '#btnOpenTextureUploadModal', function () {
            $('#modalShopTextureUpload').removeClass('hidden');
        });
        $(document).on('click', '#btnCloseTextureUploadModal', function () {
            $('#modalShopTextureUpload').addClass('hidden');
        });
        $(document).on('click', '#btnTriggerTextureFileSelect', function () {
            $('#inputUploadTextureFile').trigger('click');
        });
        $(document).on('change', '#inputUploadTextureFile', function () {
            const file = this.files && this.files[0];
            if (!file) return;
            if (!$('#inputUploadTextureName').val()) {
                $('#inputUploadTextureName').val(file.name.replace(/\.[^.]+$/, ''));
            }
            const reader = new FileReader();
            reader.onload = function (ev) {
                $('#imgUploadTexturePreview').attr('src', ev.target.result).removeClass('hidden');
                $('#lblUploadTexturePlaceholder').addClass('hidden');
            };
            reader.readAsDataURL(file);
        });
        $(document).on('click', '#btnSubmitTextureUpload', function () {
            const fileInput = document.getElementById('inputUploadTextureFile');
            const file = fileInput && fileInput.files && fileInput.files[0];
            const name = String($('#inputUploadTextureName').val() || '').trim();
            if (!file) {
                showToast('Selecione uma imagem PNG/JPG primeiro.', 'warning');
                return;
            }
            const fd = new FormData();
            fd.append('texture', file);
            fd.append('name', name || file.name);
            fd.append('avatarId', TFL.getActiveAvatarId());

            const $btn = $(this);
            $btn.prop('disabled', true).text('Enviando...');
            $.ajax({
                url: '/profile/shop/texture/upload',
                method: 'POST',
                data: fd,
                processData: false,
                contentType: false,
                success: function (res) {
                    $btn.prop('disabled', false).text('Enviar Textura');
                    if (res && res.success && res.texture) {
                        state.textures.unshift(res.texture);
                        $('#modalShopTextureUpload').addClass('hidden');
                        renderTexturesGrid();
                        showToast('Textura enviada com sucesso!', 'success');
                    } else {
                        showToast((res && res.error) || 'Erro ao enviar textura.', 'error');
                    }
                },
                error: function () {
                    $btn.prop('disabled', false).text('Enviar Textura');
                    showToast('Erro na requisição de upload de textura.', 'error');
                }
            });
        });

        // Ações da InventoryPage
        $(document).on('click', '#btnInvTabPurchased', function () {
            switchInventoryTab('purchased');
        });
        $(document).on('click', '#btnInvTabCreated', function () {
            switchInventoryTab('created');
        });
        $(document).on('click', '.btn-shop-inv-equip', function () {
            const inventoryId = $(this).data('inv-id');
            const avatarId = TFL.getActiveAvatarId();
            $.post('/profile/shop/equip', { avatarId, inventoryId }, function (res) {
                if (res && res.success) {
                    showToast(res.isEquipped ? 'Item equipado no seu Avatar!' : 'Item removido do Avatar.', 'success');
                    TFL.loadShopAppData(function () {
                        renderInventoryGrids();
                    });
                    if (typeof TFL.refreshPartial === 'function') {
                        TFL.refreshPartial('view-avatar');
                    }
                } else {
                    showToast((res && res.error) || 'Erro ao equipar item.', 'error');
                }
            });
        });
        $(document).on('click', '.btn-shop-inv-edit', function () {
            const id = Number($(this).data('id'));
            const item = state.createdItems.find(c => Number(c.id) === id);
            if (item) {
                openCreateItemPage(item);
            }
        });
    });

})(window, jQuery);
