let containerItems = [];
let selectedModelName = null;
let activeItemIndex = null;
let capturedBlob = null;
const currentOrigin = window.location.origin;
const currentFullUrl = window.location.href;
const URL_SAVE_CONTAINER = `${currentOrigin}/game/shop/container`;

console.log("[SHOP] Script shop.js carregado com sucesso.");

$(document).ready(function () {
  console.log("[SHOP] DOM totalmente carregado via jQuery.");

  // 1. Abertura e Fechamento do Modal
  $("#btn-open-modal-create").on("click", function () {
    console.log("[SHOP] Botão '+ Novo Container' clicado.");
    resetContainerForm();
    $("#modal-container").removeClass("hidden").addClass("flex");
    renderModelGrid();
  });

  $("#btn-close-modal, #btn-cancel-modal").on("click", function () {
    console.log("[SHOP] Fechando modal.");
    $("#modal-container").addClass("hidden").removeClass("flex");
  });

  // 2. Filtros
  $("#model-search-input").on("input", renderModelGrid);
  $("#select-category").on("change", renderModelGrid);
  $("#select-gender").on("change", renderModelGrid);

  // 3. Alternar Fonte da Thumbnail
  $('input[name="thumb-source"]').on("change", function () {
    const source = $(this).val();
    console.log("[SHOP] Fonte da Thumbnail alterada para:", source);
    if (source === "upload") {
      $("#thumb-upload-container").removeClass("hidden");
      $("#thumb-print-container").addClass("hidden");
    } else {
      $("#thumb-upload-container").addClass("hidden");
      $("#thumb-print-container").removeClass("hidden");
    }
  });

  // 4. Captura de Canvas Babylon
  $("#btn-capture-canvas").on("click", captureBabylonCanvas);

  // 5. Seleção e Adição de Modelo
  $(document).on("click", ".model-card", function () {
    $(".model-card")
      .removeClass("border-blue-500 bg-blue-900/40")
      .addClass("border-gray-700");
    $(this)
      .removeClass("border-gray-700")
      .addClass("border-blue-500 bg-blue-900/40");

    selectedModelName = $(this).data("model");
    console.log("[SHOP] Modelo selecionado:", selectedModelName);
    $("#btn-add-model-to-list").prop("disabled", false);
  });
  $(document).on("dblclick", ".model-card", function (e) {
    $("#btn-add-model-to-list").click();
    console.log("[SHOP] Doubleclick no modelo selecionado:", selectedModelName);
  });

  // 1. Atualize a adição do modelo para usar o slot retornado de MODELS:
  $("#btn-add-model-to-list").on("click", function () {
    if (!selectedModelName) return;

    const modelData = getModelData(selectedModelName);
    // Pega o slot definido no objeto do modelo (ex: "30"), fallback para "255" se não existir
    const defaultSlot = modelData && modelData.slot ? modelData.slot : "255";

    const newItem = {
      model: selectedModelName,
      slot: defaultSlot,
      shader: "pbr",
      values: {},
      colors: {},
      ints: {},
      bools: {},
      strings: {},
      vectors: {},
      textures_paths: {},
      uploadFiles: {},
    };

    containerItems.push(newItem);
    activeItemIndex = containerItems.length - 1;
    console.log("[SHOP] Item adicionado à lista:", newItem);
    renderItemsList();
  });

  // -------------------------------------------------------------
  // EVENTOS DELEGAÇÃO DE EVENTOS GLOBAL (CORRIGIDO)
  // -------------------------------------------------------------

  // Captura nativa na fase de captura (passa por cima de stopPropagation e delegações quebradas)
  window.addEventListener(
    "change",
    function (e) {
      const input = e.target;

      // Verifica se o elemento que disparou é um input do tipo file
      if (input && input.type === "file") {
        const $input = $(input);
        const index = $input.data("index");
        const key = $input.data("key");
        const files = Array.from(input.files);

        console.log(
          `[FILE-DEBUG] Input alterado! Index: ${index}, Key: ${key}, Arquivos:`,
          files,
        );

        if (index === undefined || !containerItems[index]) {
          console.error(
            `[FILE-ERROR] Item no índice ${index} não existe na memória!`,
          );
          return;
        }

        if (files.length > 0) {
          if (!containerItems[index].uploadFiles)
            containerItems[index].uploadFiles = {};
          containerItems[index].uploadFiles[key] = files;

          const fileNames = files.map((f) => f.name).join(", ");
          containerItems[index].textures_paths[key] = fileNames;

          console.log(
            `[FILE-SUCCESS] Arquivos salvos na memória do item [${index}]:`,
            containerItems[index].uploadFiles,
          );

          const labelText =
            files.length === 1
              ? files[0].name
              : `${files.length} arquivos selecionados`;
          const $infoSpan = $input.closest("div").find(".file-info-text");

          $infoSpan
            .text(labelText)
            .removeClass("text-gray-400")
            .addClass("text-green-400 font-bold");
        }
      }
    },
    true,
  ); // 'true' força a execução na fase de captura

  // Clique na Sanfona (Abrir/Fechar)
  $(document).on(
    "click",
    "#container-items-list .accordion-header",
    function (e) {
      if ($(e.target).closest(".no-accordion").length) return;
      const index = $(this).data("index");
      console.log("[SHOP-EVENT] Clique na sanfona do item index:", index);
      toggleAccordion(index);
    },
  );

  // Adicionar Nova Propriedade Dinâmica
  $(document).on("click", "#container-items-list .btn-add-prop", function () {
    const index = $(this).data("index");
    const type = $(`#add-type-${index}`).val();
    const key = $(`#add-key-${index}`).val().trim();

    console.log(
      `[SHOP-PROP] Adicionando [${type}] chave [${key}] no item [${index}]`,
    );

    if (!key || !containerItems[index]) return;

    const defaults = {
      values: 0.0,
      colors: "#ffffff",
      ints: 0,
      bools: false,
      strings: "",
      vectors: "0,0,0",
      textures_paths: "",
    };
    containerItems[index][type][key] = defaults[type];

    renderItemsList();
  });

  // Atualizar Propriedades Simples (Shader / Slot)
  $(document).on(
    "change",
    "#container-items-list .input-item-prop",
    function () {
      const index = $(this).data("index");
      const prop = $(this).data("prop");
      const val = $(this).val();
      if (containerItems[index]) containerItems[index][prop] = val;
    },
  );

  // Atualizar Propriedades Aninhadas (Values, Colors, etc.)
  $(document).on(
    "change input",
    "#container-items-list .input-nested-prop",
    function () {
      const index = $(this).data("index");
      const dict = $(this).data("dict");
      const key = $(this).data("key");
      const inputType = $(this).attr("type");

      if (containerItems[index]?.[dict]) {
        let val = $(this).val();
        if (inputType === "checkbox") val = $(this).is(":checked");
        else if (dict === "values") val = parseFloat(val) || 0;
        else if (dict === "ints") val = parseInt(val) || 0;

        containerItems[index][dict][key] = val;
      }
    },
  );

  // Deletar Propriedade
  $(document).on("click", "#container-items-list .btn-del-prop", function () {
    const index = $(this).data("index");
    const dict = $(this).data("dict");
    const key = $(this).data("key");

    if (containerItems[index]?.[dict]) {
      delete containerItems[index][dict][key];
      if (dict === "textures_paths" && containerItems[index].uploadFiles) {
        delete containerItems[index].uploadFiles[key];
      }
      renderItemsList();
    }
  });

  // Remover Item da Lista
  $(document).on(
    "click",
    "#container-items-list .btn-remove-item",
    function () {
      const index = $(this).data("index");
      console.log("[SHOP-ITEM] Removendo item index:", index);
      containerItems.splice(index, 1);
      activeItemIndex = null;
      renderItemsList();
    },
  );

  // 6. Submissão do Formulário
  $("#form-container").on("submit", async function (e) {
    e.preventDefault();
    console.log("[SHOP-SUBMIT] Iniciando envio do formulário...");

    if (containerItems.length === 0) {
      Swal.fire(
        "Atenção",
        "Adicione pelo menos um item ao container.",
        "warning",
      );
      return;
    }

    let maxVariations = 1;
    containerItems.forEach((item) => {
      if (item.uploadFiles) {
        Object.keys(item.uploadFiles).forEach((key) => {
          const files = item.uploadFiles[key];
          if (Array.isArray(files) && files.length > maxVariations) {
            maxVariations = files.length;
          }
        });
      }
    });

    console.log("[SHOP-SUBMIT] Variações identificadas:", maxVariations);

    const baseTitle = $("#container-title").val();
    const price = parseFloat($("#container-price").val()) || 0;
    const description = $("#container-description").val();
    const thumbSource = $('input[name="thumb-source"]:checked').val();
    const thumbFile = $("#container-thumb")[0]?.files[0];

    for (let batchIndex = 0; batchIndex < maxVariations; batchIndex++) {
      const formData = new FormData();
      const clonedItems = JSON.parse(JSON.stringify(containerItems));
      const containerTitle =
        maxVariations > 1 ? `${baseTitle} #${batchIndex + 1}` : baseTitle;
      const gender = $("#select-gender").val();
      formData.append(
        "payload",
        JSON.stringify({
          title: containerTitle,
          price: price,
          description: description,
          items: clonedItems,
          gender: gender,
        }),
      );

      if (thumbSource === "upload" && thumbFile) {
        formData.append("mainImage", thumbFile);
      } else if (thumbSource === "canvas" && capturedBlob) {
        formData.append(
          "mainImage",
          capturedBlob,
          `canvas_${batchIndex + 1}.png`,
        );
      }

      containerItems.forEach((item, itemIdx) => {
        if (item.uploadFiles) {
          Object.keys(item.uploadFiles).forEach((key) => {
            const fileList = item.uploadFiles[key];
            if (Array.isArray(fileList) && fileList.length > 0) {
              const currentFile =
                fileList[batchIndex] || fileList[fileList.length - 1];
              if (currentFile) {
                formData.append(`texture_${itemIdx}_${key}`, currentFile);
                clonedItems[itemIdx].textures_paths[key] = currentFile.name;
              }
            }
          });
        }
      });

      console.log(`[SHOP-SUBMIT] Enviando lote #${batchIndex + 1}...`);

      try {
        const res = await fetch(URL_SAVE_CONTAINER, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        console.log(`[SHOP-SUBMIT] Resposta do lote #${batchIndex + 1}:`, data);
        if (!data.success) throw new Error(data.error || "Erro no envio");
      } catch (err) {
        console.error(`[SHOP-SUBMIT] Falha no lote #${batchIndex + 1}:`, err);
        Swal.fire(
          "Erro",
          `Erro no lote #${batchIndex + 1}: ${err.message}`,
          "error",
        );
        return;
      }
    }

    Swal.fire(
      "Sucesso!",
      `${maxVariations} container(s) gerado(s).`,
      "success",
    );
    $("#modal-container").addClass("hidden").removeClass("flex");
  });
});

// Funções de Suporte
function captureBabylonCanvas() {
  console.log("[SHOP] Capturando Canvas Babylon...");
  const canvas = document.querySelector("canvas");
  if (!canvas) return;
  canvas.toBlob((blob) => {
    if (!blob) return;
    capturedBlob = blob;
    console.log("[SHOP] Blob do Canvas gerado:", blob);
    $("#canvas-preview-img")
      .attr("src", URL.createObjectURL(blob))
      .removeClass("hidden");
    $("#canvas-preview-placeholder").addClass("hidden");
  }, "image/png");
}

function getModelData(name) {
  const list = (typeof MODELS !== "undefined" ? MODELS : window.MODELS) || [];
  return list.find((item) => item.name === name);
}

function renderModelGrid() {
  console.log("[SHOP] Renderizando grid de modelos...");
  const $grid = $("#models-cards-grid").empty();
  const search = ($("#model-search-input").val() || "").toLowerCase();
  const category = $("#select-category").val();
  const gender = $("#select-gender").val();
  const allModels =
    (typeof MODELS !== "undefined" ? MODELS : window.MODELS) || [];

  const filtered = allModels.filter((item) => {
    const matchesName = item.name.toLowerCase().includes(search);
    const matchesCat = !category || category === "all" || item.cat === category;
    const matchesGender = !gender || gender === "all" || item.gender === gender;
    return matchesName && matchesCat && matchesGender;
  });

  if (!filtered.length) {
    $grid.append(
      '<div class="col-span-full text-center text-xs text-gray-500 py-4">Nenhum modelo encontrado</div>',
    );
    return;
  }

  filtered.forEach((item) => {
    const isSelected = selectedModelName === item.name;
    $grid.append(`
            <div data-model="${item.name}" class="model-card border ${isSelected ? "border-blue-500 bg-blue-900/40" : "border-gray-700"} p-2 rounded cursor-pointer hover:border-blue-400 bg-[#2b2d31] flex flex-col items-center justify-center transition">
                <span class="text-[11px] font-semibold text-gray-200 truncate w-full text-center">${item.name}</span>
                <span class="text-[9px] text-gray-400 uppercase mt-0.5">${item.cat || "Geral"}</span>
            </div>
        `);
  });
}

function setChannelVal(selectEl) {
  const $select = $(selectEl);
  const idx = $select.data("index");
  const selectedText = $select.find("option:selected").text();

  // Atualiza o valor do campo de texto da chave
  $(`#add-key-${idx}`).val(selectedText.toLowerCase());
}

function renderItemsList() {
  console.log(
    "[SHOP] Renderizando lista de itens do container. Total de itens:",
    containerItems.length,
  );
  const $list = $("#container-items-list")
    .empty()
    .addClass("max-h-[380px] overflow-y-auto pr-1");
  $("#items-count").text(containerItems.length);

  containerItems.forEach((item, idx) => {
    const isOpen = activeItemIndex === idx;

    // Slot exibido apenas como texto estático
    const slotHtml = `<span class="px-2 py-0.5 text-xs bg-[#1e1f22] border border-gray-600 rounded text-gray-300">Slot: ${item.slot}</span>`;

    // Select do CHANNELS com w-full para se adequar ao grid
    const channels = CHANNELS || window.CHANNELS;
    let selectChannel = `<select id="select-channel-${idx}" data-index="${idx}" 
                                data-prop="channel" 
                                onChange="setChannelVal(this)"
                                class="input-item-prop w-full px-2 py-1 bg-[#1e1f22] border border-gray-600 rounded text-white text-xs">
                                <option value="">Selecione o canal...</option>`;

    const channelKeys = Array.isArray(channels)
      ? channels
      : Object.keys(channels || {});
    for (let i = 0; i < channelKeys.length; i++) {
      const key = Array.isArray(channels) ? channels[i] : channelKeys[i];
      const val = Array.isArray(channels) ? channels[i] : channels[key];
      selectChannel += `<option value="${val}">${key}</option>`;
    }
    selectChannel += `</select>`;

    const accordionHtml = `
            <div class="border border-gray-700 rounded overflow-hidden mb-2 bg-[#1e1f22]">
                <div class="accordion-header p-2.5 bg-[#2b2d31] flex items-center justify-between cursor-pointer select-none hover:bg-[#35373c] transition" data-index="${idx}">
                    <div class="flex items-center gap-2">
                        <span class="text-xs transform transition-transform ${isOpen ? "rotate-90" : ""}">▶</span>
                        <span class="text-xs font-bold text-blue-400">${item.model}</span>
                    </div>
                    <div class="no-accordion flex items-center gap-2">
                        ${slotHtml}
                        <button type="button" data-index="${idx}" class="btn-remove-item text-red-400 hover:text-red-300 text-xs px-2 py-1">Remover</button>
                    </div>
                </div>

                <div class="${isOpen ? "block" : "hidden"} p-3 border-t border-gray-700 bg-[#1e1f22] text-xs space-y-3">
                    <div>
                        <label class="block text-gray-400 mb-1">Shader:</label>
                        <input type="text" value="${item.shader || "pbr"}" data-index="${idx}" data-prop="shader" class="input-item-prop w-full px-2 py-1 bg-[#2b2d31] border border-gray-600 rounded text-white">
                    </div>

                    <div class="border border-gray-700 p-2 rounded bg-[#2b2d31] space-y-2">
                        <span class="block font-semibold text-gray-300 text-[11px]">Adicionar Propriedade (Dic)</span>
                        <div class="grid grid-cols-2 gap-2">
                            <select id="add-type-${idx}" class="w-full px-2 py-1 bg-[#1e1f22] border border-gray-600 rounded text-white text-xs">
                                <option value="values">Value (float)</option>
                                <option value="colors">Color</option>
                                <option value="ints">Int</option>
                                <option value="bools">Bool</option>
                                <option value="strings">String</option>
                                <option value="vectors">Vector</option>
                                <option value="textures_paths">Texture (Upload Mult.)</option>
                            </select>
                            
                            ${selectChannel}
                            
                            <input type="text" id="add-key-${idx}" placeholder="Key (ex: albedo)" class="w-full px-2 py-1 bg-[#1e1f22] border border-gray-600 rounded text-white text-xs">
                            
                            <button type="button" data-index="${idx}" class="btn-add-prop w-full py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-xs">+ Add</button>
                        </div>
                    </div>

                    <div class="space-y-2">${renderDynamicProperties(item, idx)}</div>
                </div>
            </div>
        `;
    $list.append(accordionHtml);
  });
}

function renderDynamicProperties(item, idx) {
  let html = "";
  const categories = [
    { dict: "values", label: "Values (Float)", type: "number" },
    { dict: "colors", label: "Colors", type: "color" },
    { dict: "ints", label: "Ints", type: "number_int" },
    { dict: "bools", label: "Bools", type: "checkbox" },
    { dict: "strings", label: "Strings", type: "text" },
    { dict: "vectors", label: "Vectors", type: "vector" },
    { dict: "textures_paths", label: "Textures", type: "file" },
  ];

  categories.forEach((cat) => {
    const targetObj = item[cat.dict];
    if (targetObj && Object.keys(targetObj).length > 0) {
      html += `<div class="border-t border-gray-700 pt-2 mt-2"><span class="block text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">${cat.label}</span>`;

      Object.keys(targetObj).forEach((key) => {
        const val = targetObj[key];
        html += `<div class="flex items-center gap-2 mb-1.5 bg-[#2b2d31] p-1.5 rounded"><span class="w-24 truncate text-gray-300 font-mono text-[11px]" title="${key}">${key}:</span>`;

        if (cat.type === "number") {
          html += `<input type="number" step="0.01" value="${val}" data-index="${idx}" data-dict="${cat.dict}" data-key="${key}" class="input-nested-prop flex-1 px-2 py-0.5 bg-[#1e1f22] border border-gray-600 rounded text-white">`;
        } else if (cat.type === "number_int") {
          html += `<input type="number" step="1" value="${val}" data-index="${idx}" data-dict="${cat.dict}" data-key="${key}" class="input-nested-prop flex-1 px-2 py-0.5 bg-[#1e1f22] border border-gray-600 rounded text-white">`;
        } else if (cat.type === "color") {
          html += `<input type="color" value="${val}" data-index="${idx}" data-dict="${cat.dict}" data-key="${key}" class="input-nested-prop flex-1 h-6 bg-[#1e1f22] border border-gray-600 rounded cursor-pointer p-0.5">`;
        } else if (cat.type === "checkbox") {
          html += `<input type="checkbox" ${val ? "checked" : ""} data-index="${idx}" data-dict="${cat.dict}" data-key="${key}" class="input-nested-prop rounded bg-[#1e1f22] border-gray-600">`;
        } else if (cat.type === "text") {
          html += `<input type="text" value="${val}" data-index="${idx}" data-dict="${cat.dict}" data-key="${key}" class="input-nested-prop flex-1 px-2 py-0.5 bg-[#1e1f22] border border-gray-600 rounded text-white">`;
        } else if (cat.type === "vector") {
          html += `<input type="text" placeholder="0,0,0" value="${val}" data-index="${idx}" data-dict="${cat.dict}" data-key="${key}" class="input-nested-prop flex-1 px-2 py-0.5 bg-[#1e1f22] border border-gray-600 rounded text-white">`;
        } else if (cat.type === "file") {
          const files = item.uploadFiles ? item.uploadFiles[key] : null;
          const count = files ? files.length : 0;
          const filenames = files
            ? Array.from(files)
                .map((f) => f.name)
                .join(", ")
            : "";

          const labelText =
            count === 0
              ? "Nenhum arquivo selecionado"
              : count === 1
                ? filenames
                : `${count} arquivos: ${filenames}`;
          const textColor =
            count > 0 ? "text-green-400 font-bold" : "text-gray-400";

          html += `
                        <div class="flex-1 flex items-center gap-2 overflow-hidden">
                            <input type="file" accept="image/*" multiple data-index="${idx}" data-key="${key}" class="file-texture-input text-[10px] text-gray-400 file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:bg-blue-600 file:text-white cursor-pointer w-full">
                            <span class="file-info-text text-[10px] ${textColor} truncate flex-1" title="${labelText}">${labelText}</span>
                        </div>
                    `;
        }

        html += `<button type="button" data-index="${idx}" data-dict="${cat.dict}" data-key="${key}" class="btn-del-prop text-red-400 hover:text-red-300 px-1 font-bold">×</button></div>`;
      });

      html += `</div>`;
    }
  });

  return (
    html ||
    '<span class="text-gray-500 text-[11px] italic">Nenhuma propriedade adicionada.</span>'
  );
}

function toggleAccordion(index) {
  activeItemIndex = activeItemIndex === index ? null : index;
  if (activeItemIndex !== null) {
    const item = containerItems[index];
    const modelData = getModelData(item.model);
    if (typeof loadBabylonModel === "function") {
      loadBabylonModel(modelData ? modelData.modelFile : item.model);
    }
  }
  renderItemsList();
}

function resetContainerForm() {
  console.log("[SHOP] Resetando formulário de container...");
  containerItems = [];
  selectedModelName = null;
  activeItemIndex = null;
  capturedBlob = null;
  $("#btn-add-model-to-list").prop("disabled", true);
  $("#form-container")[0].reset();
  $("#canvas-preview-img").addClass("hidden").attr("src", "");
  $("#canvas-preview-placeholder").removeClass("hidden");
  renderItemsList();
}
