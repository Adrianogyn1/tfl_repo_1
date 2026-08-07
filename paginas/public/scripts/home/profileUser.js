// /static/scripts/home/profileUser.js

$(document).ready(function() {
    
    // Armazena o estado de curtida da mensagem no modal
   $('#btnCreatePost').click(async function() {
    
    console.log('Clicou no botão de criar post');   
      const formData = new FormData();
      
        const file = $('#postFileInput')[0].files[0];
          formData.append('file', file);
        const token = $('#globalToken').val();
        const title= $('#postTitle').val();
        const text= $('#postText').val();
        formData.append('title', title);
        formData.append('text', text);

        const headers = {}; // Removemos o Content-Type manual daqui

        if (token) {
            headers['token'] = token;
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            // Ajustado para a rota correta que você registrou no backend
            const res = await fetch('/api/gallery/upload', {
                method: 'POST',
                headers: headers,
                body: formData // O navegador define o Content-Type correto sozinho aqui
            });

            if (res.ok) {
                const data = await res.json();
                console.log(data);
                const btnLoadFeed = $('#btnRefreshFeed');
                btnLoadFeed.click();
                $('#postFileInput').val('');
                $('#postTitle').val('');
                $('#postText').val('');
                $('#fileCountBadge').text('');
                

            } else {
                console.error('Erro ao atualizar foto de perfil:', res.statusText);
            }
        } catch (error) {
            console.error('Erro ao atualizar foto de perfil:', error);
        }
    });

    // --- Atualização de Foto de Perfil ---
    // --- Atualização de Foto de Perfil ---
    $('#btn-updade-photo').click(function() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';

    fileInput.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        
        const token = $('#globalToken').val();
        const headers = {}; // Removemos o Content-Type manual daqui

        if (token) {
            headers['token'] = token;
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            // Ajustado para a rota correta que você registrou no backend
            const res = await fetch('/api/profile/upload', {
                method: 'POST',
                headers: headers,
                body: formData // O navegador define o Content-Type correto sozinho aqui
            });

            if (res.ok) {
                const data = await res.json();
                // Verifica a estrutura e atualiza a imagem na tela
                if (data && data.data && data.data.url) {
                    $('#profileAvatar img').attr('src', data.data.url);
                }
                console.log(data);
            } else {
                console.error('Erro ao atualizar foto de perfil:', res.statusText);
            }
        } catch (error) {
            console.error('Erro ao atualizar foto de perfil:', error);
        }
    };

    fileInput.click();
});
});