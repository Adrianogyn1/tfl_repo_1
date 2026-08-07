$(document).ready(function() {

    let cachedPosts = [];
    let activeProfileId = null;
    let activeProfileName = "";

    // --- Configurações de API ---
    function loadSettings() {
        const saved = localStorage.getItem('api_endpoints');
        if (saved) {
            try {
                const eps = JSON.parse(saved);
                for (const id in eps) {
                    $(`#${id}`).val(eps[id]);
                }
            } catch (e) {
                console.error("Erro ao carregar endpoints do localStorage", e);
            }
        }
    }

    function saveSettings() {
        const eps = {};
        $('#settingsModal input[type="text"]').each(function() {
            const id = $(this).attr('id');
            eps[id] = $(this).val();
        });
        localStorage.setItem('api_endpoints', JSON.stringify(eps));
    }

    loadSettings();

    // --- Utilitários e Chamadas API ---
    function log(text) {
        $('#output').text(text);
    }

    async function apiCall(endpoint, method, body = null) {
        log("Enviando requisição...");
        const token = $('#globalToken').val();
        const headers = { 'Content-Type': 'application/json' };

        if (token) {
            headers['token'] = token;
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await $.ajax({
                url: endpoint,
                type: method,
                headers: headers,
                data: body && method !== 'GET' ? JSON.stringify(body) : null,
                dataType: 'json'
            });
            log(`[Sucesso] \n` + JSON.stringify(response, null, 2));
            return response;
        } catch (err) {
            log(`[Erro ${err.status}]: ` + (err.responseJSON ? JSON.stringify(err.responseJSON) : err.statusText));
            return null;
        }
    }
    window.apiCall = apiCall;

    // --- Eventos do Modal de Configurações ---
    $('#btnOpenSettings').click(function() {
        $('#settingsModal').removeClass('hidden');
    });

    $('#btnCloseSettings, #settingsModal').click(function(e) {
        if (e.target === this) $('#settingsModal').addClass('hidden');
    });

    $('#btnSaveSettings').click(function() {
        saveSettings();
        $('#settingsModal').addClass('hidden');
    });

    // --- Autenticação ---
    $('#btnSignIn').click(async function() {
        const res = await apiCall($('#epSignIn').val(), 'POST', {
            login: $('#authLogin').val(),
            password: $('#authPass').val()
        });
        if (res && res.token) {
            $('#globalToken').val(res.token);
            const profile = res.profile || res.data;
            if (profile) {
                $('#myUserAvatar').text(String(profile.userName || profile.username || 'U').substring(0, 1).toUpperCase());
            }
            loadFeed();
        }
    });

    $('#btnSignUp').click(function() {
        apiCall($('#epSignUp').val(), 'POST', {
            username: $('#authLogin').val(),
            login: $('#authLogin').val(),
            password: $('#authPass').val()
        });
    });

    // --- Gerenciamento de Perfis e Modais ---
    async function openProfilePopup(userId, userName) {
        activeProfileId = userId;
        activeProfileName = userName;
        
        // Exibe dados iniciais recebidos do clique
        $('#modalProfileName').text(userName);
        $('#modalProfileId').text(`ID do Usuário: ${userId}`);
        $('#modalAvatar').text(String(userName).substring(0, 1).toUpperCase());
        $('#btnModalLikeProfile').removeClass('bg-pink-800').addClass('bg-pink-600').data('liked', 'false').find('span').text('Curtir Perfil');
        
        $('#profileModal').removeClass('hidden');
        renderModalFeed();

        // CHAMADA DA API: Busca os dados atualizados do perfil do usuário na rota configurada
        const epProfile = $('#epProfile').val() || '/api/profile'; 
        const profileData = await apiCall(`${epProfile}?id=${userId}`, 'GET');
        
        if (profileData && profileData.data) {
            const user = profileData.data;
            const updatedName = user.userName || user.username || userName;
            
            // Atualiza os elementos do modal com os dados reais vindos da API
            $('#modalProfileName').text(updatedName);
            $('#modalAvatar').text(String(updatedName).substring(0, 1).toUpperCase());
            
            // Caso a API já traga se o perfil atual está curtido
            if (user.likedProfile || user.liked === true) {
                $('#btnModalLikeProfile').removeClass('bg-pink-600').addClass('bg-pink-800').data('liked', 'true').find('span').text('Remover Curtida');
            }
        }
    }

    function renderModalFeed() {
        const userPosts = cachedPosts.filter(p => p.userid == activeProfileId || p.userId == activeProfileId);
        const $modalTarget = $('#modalFeedTarget');
        $modalTarget.empty();

        if (userPosts.length === 0) {
            $modalTarget.html('<p class="text-gray-500 text-center py-8 text-sm">Este usuário não possui publicações.</p>');
        } else {
            userPosts.forEach(post => {
                $modalTarget.append(renderPostCard(post));
            });
        }
    }

    $('#btnCloseModal, #profileModal').click(function(e) {
        if (e.target === this) $('#profileModal').addClass('hidden');
    });

    // --- Rotas do Perfil ---
    $('#btnModalFollow').click(function() { if (activeProfileId) apiCall($('#epFollow').val(), 'POST', { targetId: activeProfileId }); });
    $('#btnModalUnfollow').click(function() { if (activeProfileId) apiCall($('#epUnfollow').val(), 'POST', { targetId: activeProfileId }); });

    $('#btnModalLikeProfile').click(async function() {
        if (!activeProfileId) return;
        const isLiked = $(this).data('liked') === 'true';
        const method = isLiked ? 'DELETE' : 'POST';
        const res = await apiCall($('#epLikeProfile').val(), method, { targetId: activeProfileId });

        if (res) {
            if (isLiked) {
                $(this).removeClass('bg-pink-800').addClass('bg-pink-600').data('liked', 'false').find('span').text('Curtir Perfil');
            } else {
                $(this).removeClass('bg-pink-600').addClass('bg-pink-800').data('liked', 'true').find('span').text('Remover Curtida');
            }
        }
    });

    $('#btnModalAddFriend').click(function() { if (activeProfileId) apiCall($('#epAddFriend').val(), 'POST', { targetId: activeProfileId }); });
    $('#btnModalRemoveFriend').click(function() { if (activeProfileId) apiCall($('#epRemoveFriend').val(), 'POST', { targetId: activeProfileId }); });
    $('#btnModalMatchIn').click(function() { if (activeProfileId) apiCall($('#epMatchIn').val(), 'POST', { targetId: activeProfileId }); });
    $('#btnModalMatchOut').click(function() { if (activeProfileId) apiCall($('#epMatchOut').val(), 'POST', { targetId: activeProfileId }); });

    $('#btnModalSendMsg').click(function() {
        const msgText = $('#modalMsgText').val();
        if (activeProfileId && msgText) {
            apiCall($('#epSendMsg').val(), 'POST', { targetId: activeProfileId, text: msgText }).then(res => {
                if (res) $('#modalMsgText').val('');
            });
        }
    });

    // --- Interações com Posts e Comentários ---
    $(document).on('click', '.btn-like-post', async function() {
        const postId = $(this).data('id');
        const isLiked = $(this).attr('data-liked') === 'true';
        const method = isLiked ? 'DELETE' : 'POST';
        const res = await apiCall($('#epLikePost').val(), method, { postId });
        if (res) {
            if (isLiked) {
                $(this).attr('data-liked', 'false').removeClass('text-pink-500').addClass('text-gray-400').html('<i class="fa-solid fa-heart"></i> Curtir Post');
            } else {
                $(this).attr('data-liked', 'true').removeClass('text-gray-400').addClass('text-pink-500').html('<i class="fa-solid fa-heart"></i> Remover Curtida');
            }
        }
    });

    $(document).on('click', '.btn-like-comment', async function() {
        const commentId = $(this).data('id');
        const isLiked = $(this).attr('data-liked') === 'true';
        const method = isLiked ? 'DELETE' : 'POST';
        const res = await apiCall($('#epLikeComment').val(), method, { commentId });
        if (res) {
            if (isLiked) {
                $(this).attr('data-liked', 'false').removeClass('text-pink-500').addClass('text-gray-500');
            } else {
                $(this).attr('data-liked', 'true').removeClass('text-gray-500').addClass('text-pink-500');
            }
        }
    });

    $(document).on('click', '.btn-delete-post', async function(e) {
        e.stopPropagation();
        if (!confirm("Tem certeza que deseja remover esta publicação?")) return;
        const postId = $(this).data('id');
        const data = await apiCall($('#epFeed').val(), 'DELETE', { postId });
        if (data) {
            await loadFeed();
            if (!$('#profileModal').hasClass('hidden')) renderModalFeed();
        }
    });

    $(document).on('click', '.btn-delete-comment', async function(e) {
        e.stopPropagation();
        if (!confirm("Tem certeza que deseja remover este comentário?")) return;
        const commentId = $(this).data('id');
        const data = await apiCall($('#epComment').val(), 'DELETE', { commentId });
        if (data) {
            await loadFeed();
            if (!$('#profileModal').hasClass('hidden')) renderModalFeed();
        }
    });

    // --- Renderização de Cards ---
    // --- Renderização de Cards ---
    function renderPostCard(post) {
        const postId = post.id;
        const authorName = post.authorName || post.userName || 'Anonymous';
        const pUserId = post.userId || post.userid;

        let commentsHtml = '<p class="text-gray-500 text-[11px] italic pl-1">Sem comentários.</p>';
        if (Array.isArray(post.comments) && post.comments.length > 0) {
            commentsHtml = post.comments.map(c => `
                <div class="text-xs bg-[#242526] p-2 rounded-xl border border-[#3a3b3c]/40 flex justify-between items-center">
                    <div class="flex items-center gap-2">
                        ${(c.photo || c.thumbnail) ? `
                            <img src="${c.photo || c.thumbnail}" class="w-6 h-6 rounded-full object-cover border border-[#3a3b3c]" alt="${c.userName}">
                        ` : `
                            <div class="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-[10px]">
                                ${String(c.userName || 'U').substring(0, 1).toUpperCase()}
                            </div>
                        `}
                        <div>
                            <span class="text-[#2d88ff] font-bold mr-1 cursor-pointer open-profile-btn" data-userid="${c.userId || c.userid}" data-username="${c.userName}">${c.userName}:</span> 
                            <span class="text-gray-200">${c.text || ''}</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-[9px] text-gray-400">${c.likesCount || 0}</span>
                        <button data-id="${c.id}" data-liked="${c.liked ? 'true' : 'false'}" class="btn-like-comment ${c.liked ? 'text-pink-500' : 'text-gray-500'} hover:text-pink-500 transition-colors">
                            <i class="fa-solid fa-heart"></i>
                        </button>
                        ${c.isMine ? `<button data-id="${c.id}" class="btn-delete-comment text-[10px] text-gray-500 hover:text-rose-500 transition-colors"><i class="fa-solid fa-trash"></i></button>` : ''}
                    </div>
                </div>
            `).join('');
        }

        let photosHtml = '';
        if (Array.isArray(post.photos) && post.photos.length > 0) {
            photosHtml = `
                <div class="px-4 pb-3 flex gap-2 overflow-x-auto snap-x scrollbar-hide">
                    ${post.photos.map(p => `<img src="${p.url}" class="rounded-lg min-w-[200px] h-40 object-cover border border-[#3a3b3c] snap-start" alt="Foto">`).join('')}
                </div>
            `;
        }

        // Renderiza o cabeçalho do post verificando se o autor possui foto de perfil salva
        const authorAvatarHtml =(post.photo||post.thumbnail) ? `
            <img src="${post.photo || post.thumbnail}" class="w-8 h-8 rounded-full object-cover border border-[#3a3b3c]" alt="${authorName}">
        ` : `
            <div class="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-xs">
                ${String(authorName).substring(0, 1).toUpperCase()}                            
            </div>
        `;

        return `
            <div class="bg-[#242526] rounded-xl shadow-md border border-[#3a3b3c] flex flex-col overflow-hidden text-left w-full shrink-0">
                <div class="p-3 flex items-center justify-between border-b border-[#3a3b3c]/50">
                    <div class="flex items-center gap-2.5 cursor-pointer open-profile-btn" data-userid="${pUserId}" data-username="${authorName}">
                        ${authorAvatarHtml}
                        <div class="flex flex-col"><span class="text-sm font-semibold text-white hover:underline">${authorName}</span></div>
                    </div>
                    ${post.isMine ? `<button data-id="${postId}" class="btn-delete-post text-gray-500 hover:text-rose-500 p-1.5 rounded-lg transition-colors"><i class="fa-solid fa-trash text-xs"></i></button>` : ''}
                </div>
                
                <div class="px-4 pt-3 pb-2">
                    ${post.title ? `<div class="text-md font-bold text-white mb-1">${post.title}</div>` : ''}
                    <div class="text-sm text-gray-200 leading-relaxed">${post.text || ''}</div>
                </div>
                ${photosHtml}
                
                <div class="px-4 pb-2 flex justify-between border-b border-[#3a3b3c]/30">
                    <button data-id="${postId}" data-liked="${post.liked ? 'true' : 'false'}" class="btn-like-post text-xs font-bold transition-colors py-1 flex items-center gap-1 ${post.liked ? 'text-pink-500' : 'text-gray-400'} hover:text-pink-500">
                        <i class="fa-solid fa-heart"></i> ${post.liked ? 'Remover' : 'Curtir'}
                    </button>
                    <span class="text-xs text-gray-400 py-1">${post.likesCount || 0} curtidas</span>
                </div>

                <div class="bg-[#1c1d1e] p-3 flex flex-col gap-2">
                    <div class="space-y-2 max-h-36 overflow-y-auto pr-1">${commentsHtml}</div>
                    <div class="flex gap-2 mt-1">
                        <input type="text" placeholder="Comentar..." class="comment-input-field flex-1 px-3 py-1.5 text-xs rounded-full bg-[#3a3b3c] text-white focus:outline-none">
                        <button data-id="${postId}" class="btn-submit-comment px-4 py-1.5 text-xs rounded-full bg-[#2d88ff] text-white font-bold transition-colors">Enviar</button>
                    </div>
                </div>
            </div>
        `;
    }

    // --- Carregamento e Ações do Feed ---
    async function loadFeed() {
        const qtd = $('#feedQtd').val() || 10;
        const $feedTarget = $('#feedTarget');
        const response = await apiCall(`${$('#epFeed').val()}?qtd=${qtd}&page=1`, 'GET');
        cachedPosts = response && response.data ? response.data : [];

        if (cachedPosts.length === 0) {
            $feedTarget.html('<p class="text-gray-500 text-center py-8 text-sm">Nenhuma publicação por aqui.</p>');
            return;
        }

        $feedTarget.empty();
        cachedPosts.forEach(post => { $feedTarget.append(renderPostCard(post)); });
    }

   

    $(document).on('click', '.btn-submit-comment', async function() {
        const postId = $(this).data('id');
        const $input = $(this).siblings('.comment-input-field');
        const commentText = $input.val();
        if (!commentText) return;

        const data = await apiCall($('#epComment').val(), 'POST', { postId, text: commentText });
        if (data) {
            $input.val('');
            await loadFeed();
            if (!$('#profileModal').hasClass('hidden')) renderModalFeed();
        }
    });

    $(document).on('click', '.open-profile-btn', function(e) {
        e.stopPropagation();
        const targetId = $(this).data('userid');
        const targetName = $(this).data('username');
        if (targetId && targetId !== 'Sistema') openProfilePopup(targetId, targetName);
    });

    $('#btnRefreshFeed').click(loadFeed);

    // --- Modal de Usuários (Quick Login) ---
    const modal = document.getElementById('modal');
    const userList = document.getElementById('userList');

    async function openModal() {
        modal.classList.remove('hidden');
        userList.innerHTML = '<p class="text-gray-500 text-center py-4">Carregando...</p>';

        try {
            const res = await fetch('/api/users');
            const users = await res.json();
            userList.innerHTML = users.data.map(user => `
                <div class="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200">
                <div class="flex items-center gap-2.5">
                    <img class="w-8 h-8 rounded-full" src="${user.photo || user.avatar}" alt="${user.userName}">
                </div>    
                <div class="truncate mr-2">
                        <p class="font-medium text-sm text-gray-900 truncate">${user.userName}</p>
                        <p class="text-xs text-gray-500 truncate">${user.login}</p>
                    </div>
                    <button onclick="quickLogin('${user.login}', '${user.password}')" class="quickLogin bg-green-600 text-white text-xs px-3 py-1.5 rounded hover:bg-green-700 shrink-0">
                        Entrar
                    </button>
                </div>
            `).join('');
        } catch (err) {
            userList.innerHTML = '<p class="text-red-500 text-center py-4">Erro ao carregar.</p>';
        }
    }

    window.quickLogin = (login, pass) => {
        $('#authLogin').val(login);
        $('#authPass').val(pass);
        $('#btnSignIn').click();
        window.closeModal();
    };

    window.openModal = openModal;
    window.closeModal = () => modal.classList.add('hidden');

    $(document).on('click', '.btn-submit-comment', function() {
        const login = $(this).data('login');
        const pass = $(this).data('pass');
        if (login && pass) window.quickLogin(login, pass);
    });

});