/**
 * ============================================================================
 * TFL ADS & INFLUENCER MODULE (NÍVEL DE USUÁRIO & NÓS COMPLETOS)
 * ============================================================================
 * Gerencia:
 * - Campanhas de Ads vinculadas à conta do Usuário (abrangendo todos os seus avatares e salas)
 * - Auto-complete dinâmico de nós (Salas 3D, Perfis de Avatares, Itens da Loja)
 * - Títulos livres com sugestões e Texto de Botão (Call to Action) adaptado ao tema
 * - Criação de Anúncios com Validação de PIN de Carteira (4 Dígitos)
 * - Visualizações Qualificadas e Revenue Share ético (50%)
 * - Gorjetas (Tips) para Criadores de Conteúdo e Guias da Comunidade
 */
(function (window, $) {
  "use strict";

  const state = {
    activeTab: "my_campaigns",
    myCampaigns: [],
    userNodes: {
      avatars: [],
      rooms: []
    }
  };

  const THEME_CTA_SUGGESTIONS = {
    room: [
      "Entrar na Sala",
      "Visitar Espaço 3D",
      "Explorar Ambiente",
      "Bater Papo na Sala",
      "Conhecer Agora"
    ],
    profile: [
      "Ver Perfil",
      "Conectar no TFL",
      "Fazer Amizade",
      "Seguir Criador",
      "Mandar Mensagem"
    ],
    shop: [
      "Ver na Loja",
      "Experimentar Roupa",
      "Conferir Look 3D",
      "Garantir Peça",
      "Acessar Catálogo"
    ],
    reel: [
      "Assistir Reel",
      "Ver Conteúdo",
      "Curtir Reel (24h)",
      "Conferir Vídeo"
    ],
    url: [
      "Acessar Link",
      "Conferir Agora",
      "Saiba Mais",
      "Abrir Página"
    ]
  };

  function toast(msg, type = "info") {
    if (window.TFL && typeof window.TFL.toast === "function") {
      window.TFL.toast(msg, type);
    } else if (typeof window.showToast === "function") {
      window.showToast(msg, type);
    }
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function switchTab(tab) {
    state.activeTab = tab === "influencers" ? "influencers" : "my_campaigns";
    const $my = $("#adsSubtabMyCampaigns");
    const $inf = $("#adsSubtabInfluencers");
    const $btnMy = $("#btnAdsTabMyCampaigns");
    const $btnInf = $("#btnAdsTabInfluencers");

    if (state.activeTab === "influencers") {
      $my.addClass("hidden");
      $inf.removeClass("hidden");
      $btnInf.attr(
        "class",
        "px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 bg-teal-600 text-white shadow-md shadow-teal-600/20"
      );
      $btnMy.attr(
        "class",
        "px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 bg-zinc-900/90 text-zinc-400 hover:text-white border border-white/5"
      );
    } else {
      $inf.addClass("hidden");
      $my.removeClass("hidden");
      $btnMy.attr(
        "class",
        "px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 bg-teal-600 text-white shadow-md shadow-teal-600/20"
      );
      $btnInf.attr(
        "class",
        "px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 bg-zinc-900/90 text-zinc-400 hover:text-white border border-white/5"
      );
      loadCampaigns();
    }
  }

  /**
   * Inicializa os nós pertencentes à conta do Usuário (todos os seus avatares e salas)
   */
  async function loadUserNodes() {
    if (window.TFL_CONFIG && window.TFL_CONFIG.userNodes) {
      state.userNodes = window.TFL_CONFIG.userNodes;
      return state.userNodes;
    }

    try {
      const res = await $.get("/profile/ads/user-nodes");
      if (res && res.success && res.nodes) {
        state.userNodes = res.nodes;
      }
    } catch (_) {
      state.userNodes = { avatars: [], rooms: [] };
    }
    return state.userNodes;
  }

  /**
   * Atualiza as opções dinâmicas de Auto-Complete conforme o tema escolhido
   */
  function updateThemeAutocomplete(theme) {
    const $ctaList = $("#adCtaSuggestions");
    const $ctaInput = $("#adInputCallToAction");
    const $targetList = $("#adTargetDestinationsList");
    const $pillsContainer = $("#adTargetQuickPills");
    const $targetInput = $("#adInputTargetId");
    const $resolvedBadge = $("#adTargetResolvedBadge");

    $resolvedBadge.addClass("hidden");

    // 1. Atualiza Datalist de CTAs (Sugestões sobre o tema)
    const ctas = THEME_CTA_SUGGESTIONS[theme] || THEME_CTA_SUGGESTIONS.room;
    let ctaHtml = "";
    ctas.forEach((text) => {
      ctaHtml += `<option value="${escapeHtml(text)}">`;
    });
    $ctaList.html(ctaHtml);

    // Se o CTA atual estiver vazio ou corresponder a outro tema, preenche com a sugestão principal
    if (!$ctaInput.val() || Object.values(THEME_CTA_SUGGESTIONS).flat().includes($ctaInput.val())) {
      $ctaInput.val(ctas[0]);
    }

    // 2. Atualiza Datalist e Pílulas Rápidas de Destino (Nós da Conta do Usuário)
    let destHtml = "";
    let pillsHtml = "";

    if (theme === "room") {
      const rooms = state.userNodes?.rooms || [];
      $targetInput.attr("placeholder", "Selecione uma Sala abaixo ou digite o ID/Nome...");
      if (rooms.length > 0) {
        rooms.forEach((r) => {
          destHtml += `<option value="${r.id}" label="🏠 ${escapeHtml(r.name)}"></option>`;
          pillsHtml += `
            <button type="button" class="btn-quick-target-node px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 text-[11px] font-bold transition flex items-center gap-1"
                    data-id="${r.id}" data-name="${escapeHtml(r.name)}" data-type="room">
              <span class="material-symbols-outlined text-[13px]">deployed_code</span>
              <span>${escapeHtml(r.name)}</span>
            </button>
          `;
        });
      } else {
        destHtml += `<option value="" label="Nenhuma sala criada ainda"></option>`;
      }
    } else if (theme === "profile") {
      const avatars = state.userNodes?.avatars || [];
      $targetInput.attr("placeholder", "Selecione um Avatar abaixo ou digite o ID/Nome...");
      if (avatars.length > 0) {
        avatars.forEach((a) => {
          destHtml += `<option value="${a.id}" label="👤 ${escapeHtml(a.name)}"></option>`;
          pillsHtml += `
            <button type="button" class="btn-quick-target-node px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-[11px] font-bold transition flex items-center gap-1"
                    data-id="${a.id}" data-name="${escapeHtml(a.name)}" data-type="profile">
              <span class="material-symbols-outlined text-[13px]">person</span>
              <span>${escapeHtml(a.name)}</span>
            </button>
          `;
        });
      }
    } else if (theme === "shop") {
      $targetInput.attr("placeholder", "ID ou nome da roupa/look na Loja 3D...");
      destHtml += `<option value="vitrine" label="Vitrine Principal da Loja"></option>`;
      pillsHtml += `
        <button type="button" class="btn-quick-target-node px-2.5 py-1 rounded-lg bg-pink-500/10 hover:bg-pink-500/25 border border-pink-500/30 text-pink-300 text-[11px] font-bold transition flex items-center gap-1"
                data-id="vitrine" data-name="Vitrine Geral da Loja" data-type="shop">
          <span class="material-symbols-outlined text-[13px]">storefront</span>
          <span>Vitrine da Loja</span>
        </button>
      `;
    } else if (theme === "reel") {
      $targetInput.attr("placeholder", "ID ou link do seu Reel publicado...");
      destHtml += `<option value="reels" label="Carrossel Principal de Reels"></option>`;
    } else {
      $targetInput.attr("placeholder", "https://seulink.com...");
    }

    $targetList.html(destHtml);
    $pillsContainer.html(pillsHtml);
  }

  async function loadCampaigns() {
    const $container = $("#adsCampaignsListContainer");
    if (!$container.length) return;

    try {
      const res = await $.ajax({
        url: "/profile/ads/my",
        type: "GET",
      });

      if (!res || !res.success) return;
      state.myCampaigns = Array.isArray(res.campaigns) ? res.campaigns : [];

      if (state.myCampaigns.length === 0) {
        $container.html(`
          <div class="col-span-full glass-card rounded-3xl p-10 text-center border border-white/10 bg-slate-900/60">
            <div class="w-14 h-14 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-2xl mx-auto mb-3 text-teal-300">
              <span class="material-symbols-outlined text-[28px]">campaign</span>
            </div>
            <h3 class="text-base font-bold text-white">Nenhum anúncio criado ainda</h3>
            <p class="text-xs text-zinc-400 max-w-md mx-auto mt-1 mb-4">
              Impulsione uma Sala 3D, seu perfil de avatar, uma roupa que você criou na Loja ou um Reel da sua conta.
            </p>
            <button type="button" onclick="window.TFLAds && window.TFLAds.openCreateCampaignModal()"
              class="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-lg shadow-teal-600/20">
              ✨ Criar Meu Primeiro Anúncio
            </button>
          </div>
        `);
        return;
      }

      let html = "";
      state.myCampaigns.forEach((ad) => {
        const delivered = Number(ad.impressionsDelivered || 0);
        const purchased = Math.max(1, Number(ad.impressionsPurchased || 100));
        const progressPct = Math.min(100, Math.round((delivered / purchased) * 100));
        const isCompleted = ad.status === "completed" || delivered >= purchased;

        const targetLabels = {
          room: "🏠 Sala 3D",
          profile: "👤 Perfil",
          shop: "👗 Loja 3D",
          reel: "🎥 Reel",
          url: "🌐 Link"
        };
        const targetLabel = targetLabels[ad.targetType] || ad.targetType.toUpperCase();

        html += `
          <div class="p-4 rounded-3xl bg-slate-900/80 border ${isCompleted ? "border-white/10" : "border-teal-500/40 shadow-lg shadow-teal-500/10"} flex flex-col justify-between gap-3 text-xs">
            <div>
              <div class="flex items-center justify-between gap-2 mb-2">
                <span class="px-2 py-0.5 rounded-full ${isCompleted ? "bg-zinc-800 text-zinc-400" : "bg-teal-500/20 text-teal-300 border border-teal-500/30"} text-[10px] font-black uppercase">
                  ${isCompleted ? "Concluído" : "Ativo no Ar ✨"}
                </span>
                <span class="text-[10px] text-zinc-400 font-bold">${targetLabel}</span>
              </div>
              <h4 class="text-sm font-bold text-white leading-snug">${escapeHtml(ad.title)}</h4>
              <div class="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-400">
                <span class="px-2 py-0.5 rounded-lg bg-black/40 border border-white/5 text-teal-300 font-bold">
                  CTA: ${escapeHtml(ad.callToAction || "Conferir")}
                </span>
                ${ad.targetId ? `<span class="truncate">Destino: ${escapeHtml(ad.targetId)}</span>` : ''}
              </div>
            </div>

            <div class="space-y-2 pt-2 border-t border-white/5">
              <div class="flex items-center justify-between text-[11px]">
                <span class="text-zinc-400">Entregas Reais:</span>
                <strong class="text-white">${delivered} / ${purchased}</strong>
              </div>
              <div class="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                <div class="h-full ${isCompleted ? "bg-zinc-600" : "bg-gradient-to-r from-teal-500 to-emerald-400"} rounded-full" style="width: ${progressPct}%"></div>
              </div>
              <div class="flex items-center justify-between text-[10px] text-zinc-500">
                <span>Views 10s+: <strong class="text-emerald-400">${ad.qualifiedViewsCount || 0}</strong></span>
                <span>Custo: <strong class="text-amber-300">${Number(ad.costCoins || 0).toFixed(2)} Coins</strong></span>
              </div>
            </div>
          </div>
        `;
      });
      $container.html(html);
    } catch (_) {}
  }

  async function openCreateCampaignModal() {
    await loadUserNodes();
    const currentTheme = $("#adInputTargetType").val() || "room";
    updateThemeAutocomplete(currentTheme);
    $("#modalCreateAdCampaign").removeClass("hidden").addClass("flex");
  }

  async function submitCreateCampaign(event) {
    if (event) event.preventDefault();
    const avId = window.TFL ? window.TFL.getActiveAvatarId() : 0;
    const title = $("#adInputTitle").val().trim();
    const targetType = $("#adInputTargetType").val();
    const callToAction = $("#adInputCallToAction").val().trim();
    const targetId = $("#adInputTargetId").val().trim();
    const packageKey = $('input[name="adPackageRadio"]:checked').val() || "100";
    const walletPin = $("#adInputWalletPin").val().trim();
    const $btn = $("#btnSubmitCreateAd");

    if (!title) return toast("Informe o título do anúncio.", "error");
    if (!walletPin || walletPin.length !== 4) return toast("Informe seu PIN de 4 dígitos da carteira.", "error");

    $btn.prop("disabled", true).addClass("opacity-60");
    try {
      const res = await $.ajax({
        url: "/profile/ads/create",
        type: "POST",
        headers: { "x-profile-id": avId },
        contentType: "application/json",
        data: JSON.stringify({
          title,
          targetType,
          callToAction,
          targetId,
          packageKey,
          walletPin,
        }),
      });

      if (!res || !res.success) {
        toast(res?.error || "Erro ao criar campanha.", "error");
        return;
      }

      toast(res.message || "Anúncio publicado com sucesso!", "success");
      $("#modalCreateAdCampaign").addClass("hidden").removeClass("flex");
      $("#adInputTitle").val("");
      $("#adInputTargetId").val("");
      $("#adInputWalletPin").val("");
      $("#adTargetResolvedBadge").addClass("hidden");
      loadCampaigns();

      if (window.TFL && typeof window.TFL.refreshPartial === "function") {
        window.TFL.refreshPartial(["view-market", "sidebar"]);
      }
    } catch (err) {
      toast(err.responseJSON?.error || "Falha ao criar anúncio.", "error");
    } finally {
      $btn.prop("disabled", false).removeClass("opacity-60");
    }
  }

  function openTipModal(targetAvatarId, targetName = "Criador") {
    $("#tipTargetAvatarId").val(targetAvatarId);
    $("#tipRecipientName").text(`Para: ${targetName}`);
    $("#modalTipCreator").removeClass("hidden").addClass("flex");
  }

  async function submitTip(event) {
    if (event) event.preventDefault();
    const avId = window.TFL ? window.TFL.getActiveAvatarId() : 0;
    const toAvatarId = Number($("#tipTargetAvatarId").val());
    const amountCoins = Number($("#tipAmountCoins").val());
    const message = $("#tipMessageText").val().trim();
    const walletPin = $("#tipWalletPin").val().trim();
    const $btn = $("#btnSubmitTip");

    if (!toAvatarId) return toast("Destinatário inválido.", "error");
    if (!amountCoins || amountCoins <= 0) return toast("Informe um valor válido em Coins.", "error");
    if (!walletPin || walletPin.length !== 4) return toast("Informe seu PIN de 4 dígitos.", "error");

    $btn.prop("disabled", true).addClass("opacity-60");
    try {
      const res = await $.ajax({
        url: "/profile/creator/tip",
        type: "POST",
        headers: { "x-profile-id": avId },
        contentType: "application/json",
        data: JSON.stringify({
          toAvatarId,
          amountCoins,
          message,
          walletPin,
        }),
      });

      if (!res || !res.success) {
        toast(res?.error || "Erro ao enviar gorjeta.", "error");
        return;
      }

      toast(res.message || "Gorjeta enviada com sucesso!", "success");
      $("#modalTipCreator").addClass("hidden").removeClass("flex");
      $("#tipAmountCoins").val("");
      $("#tipMessageText").val("");
      $("#tipWalletPin").val("");

      if (window.TFL && typeof window.TFL.refreshPartial === "function") {
        window.TFL.refreshPartial(["view-market", "sidebar"]);
      }
    } catch (err) {
      toast(err.responseJSON?.error || "Falha ao enviar gorjeta.", "error");
    } finally {
      $btn.prop("disabled", false).removeClass("opacity-60");
    }
  }

  // Interação qualificada com Ad em Reels/Feed
  async function triggerQualifiedView(campaignId, creatorAvatarId = null, placement = "reels") {
    const avId = window.TFL ? window.TFL.getActiveAvatarId() : 0;
    if (!avId || !campaignId) return;

    try {
      const res = await $.ajax({
        url: "/profile/ads/qualified-view",
        type: "POST",
        headers: { "x-profile-id": avId },
        contentType: "application/json",
        data: JSON.stringify({
          campaignId,
          creatorAvatarId,
          placement,
        }),
      });
      if (res && res.viewerRewarded) {
        toast(`✨ Você recebeu +${res.viewerRewardAmount} Coins por assistir o anúncio completo!`, "info");
      }
    } catch (_) {}
  }

  $(document).ready(function () {
    loadUserNodes();
    loadCampaigns();

    // Eventos do Formulário de Ads
    $(document).on("change", "#adInputTargetType", function () {
      updateThemeAutocomplete($(this).val());
    });

    $(document).on("input", "#adInputTitle", function () {
      const len = $(this).val().length;
      $("#adTitleLengthCounter").text(`${len}/140`);
    });

    // Clique nas Pílulas Rápidas de Seleção de Nós da Conta
    $(document).on("click", ".btn-quick-target-node", function () {
      const id = $(this).data("id");
      const name = $(this).data("name");
      const type = $(this).data("type");
      $("#adInputTargetId").val(id);

      const typeLabel = type === "room" ? "Sala 3D" : (type === "profile" ? "Perfil" : "Loja");
      $("#adTargetResolvedName").text(`${typeLabel} "${name}"`);
      $("#adTargetResolvedBadge").removeClass("hidden");
    });

    // Auto resolução ao digitar ou selecionar no datalist
    $(document).on("input change", "#adInputTargetId", function () {
      const val = $(this).val().trim();
      if (!val) {
        $("#adTargetResolvedBadge").addClass("hidden");
        return;
      }

      const theme = $("#adInputTargetType").val();
      if (theme === "room" && state.userNodes?.rooms) {
        const found = state.userNodes.rooms.find(r => String(r.id) === val || r.name.toLowerCase() === val.toLowerCase());
        if (found) {
          $("#adTargetResolvedName").text(`Sala 3D "${found.name}"`);
          $("#adTargetResolvedBadge").removeClass("hidden");
          return;
        }
      } else if (theme === "profile" && state.userNodes?.avatars) {
        const found = state.userNodes.avatars.find(a => String(a.id) === val || a.name.toLowerCase() === val.toLowerCase());
        if (found) {
          $("#adTargetResolvedName").text(`Perfil "${found.name}"`);
          $("#adTargetResolvedBadge").removeClass("hidden");
          return;
        }
      }
      $("#adTargetResolvedBadge").addClass("hidden");
    });
  });

  window.TFLAds = {
    switchTab,
    loadCampaigns,
    openCreateCampaignModal,
    submitCreateCampaign,
    openTipModal,
    submitTip,
    triggerQualifiedView,
    updateThemeAutocomplete,
  };
})(window, jQuery);
