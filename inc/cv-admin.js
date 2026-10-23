

(function() {
    'use strict';

    console.log('[CV-ADMIN] Inicializando painel admin...');

    function initTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        console.log('[CV-ADMIN] Encontradas', tabButtons.length, 'abas');

        tabButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                
                const tabName = this.getAttribute('data-tab');
                console.log('[CV-ADMIN] Clicou em tab:', tabName);

                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                this.classList.add('active');
                const tabContent = document.getElementById('tab-' + tabName);
                if (tabContent) {
                    tabContent.classList.add('active');
                }
            });
        });
    }

    function initRepeaterHeaders() {
        const headers = document.querySelectorAll('.repeater-header');

        headers.forEach(header => {
            header.addEventListener('click', function() {
                const item = this.closest('.repeater-item');
                if (item) {
                    item.classList.toggle('active');
                    const fields = item.querySelector('.repeater-fields');
                    if (fields) {
                        fields.style.display = item.classList.contains('active') ? 'block' : 'none';
                    }
                }
            });
        });
    }

    function initRemoveButtons() {
        const removeButtons = document.querySelectorAll('.remove-repeater');

        removeButtons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                if (confirm('Tem certeza que deseja remover este item?')) {
                    const item = this.closest('.repeater-item');
                    if (item) {
                        item.style.opacity = '0';
                        setTimeout(() => {
                            item.remove();
                            updateRepeaterIndices();
                        }, 200);
                    }
                }
            });
        });
    }

    function initAddButtons() {
        const addButtons = document.querySelectorAll('.add-repeater');

        addButtons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();

                const repeaterClass = this.getAttribute('data-repeater');
                const templateId = this.getAttribute('data-template');
                const container = document.getElementById(repeaterClass);
                const template = document.getElementById(templateId);

                if (!template || !container) {
                    console.error('[CV-ADMIN] Template ou container não encontrado:', templateId);
                    return;
                }

                const currentIndex = container.querySelectorAll('.repeater-item').length;
                let html = template.innerHTML;

                html = html.replace(/{index}/g, currentIndex);
                html = html.replace(/{categoria}/g, repeaterClass.replace('habilidades-', '').replace('-repeater', ''));

                const newItem = document.createElement('div');
                newItem.innerHTML = html;
                const newItemDiv = newItem.firstElementChild;

                container.appendChild(newItemDiv);

                const header = newItemDiv.querySelector('.repeater-header');
                if (header) {
                    header.click();
                }

                initRemoveButtons();
                initRepeaterHeaders();
                initHabilidadeNomeInput();
                updateRepeaterIndices();
            });
        });
    }

    function updateRepeaterIndices() {
        const containers = document.querySelectorAll('.repeater-container');

        containers.forEach(container => {
            const repeaterClass = container.getAttribute('id');
            const items = container.querySelectorAll('.repeater-item');

            items.forEach((item, index) => {
                const title = item.querySelector('.repeater-title');
                const itemType = repeaterClass.replace('-repeater', '');

                if (title) {
                    if (itemType === 'experiencias' || itemType === 'experiencias-repeater') {
                        title.textContent = 'Experiência ' + (index + 1);
                    } else if (itemType === 'cursos' || itemType === 'cursos-repeater') {
                        title.textContent = 'Curso ' + (index + 1);
                    } else if (itemType.startsWith('habilidades')) {
                        const nomeInput = item.querySelector('.habilidade-nome-input');
                        const nome = nomeInput ? nomeInput.value : '';
                        title.textContent = nome || ('Habilidade ' + (index + 1));
                    }
                }

                const inputs = item.querySelectorAll('input, textarea, select');
                inputs.forEach(input => {
                    let name = input.getAttribute('name');
                    if (name) {
                        if (itemType === 'experiencias' || itemType === 'cursos') {
                            name = name.replace(/\[\d+\]/, '[' + index + ']');
                        } else if (itemType.startsWith('habilidades')) {
                            name = name.replace(/\[\d+\](\[)/, '[' + index + ']$1');
                        }
                        input.setAttribute('name', name);
                    }
                });
            });
        });
    }

    function initHabilidadeNomeInput() {
        const inputs = document.querySelectorAll('.habilidade-nome-input');

        inputs.forEach(input => {
            input.addEventListener('keyup', function() {
                const item = this.closest('.repeater-item');
                const title = item ? item.querySelector('.repeater-title') : null;
                if (title) {
                    title.textContent = this.value || 'Habilidade';
                }
            });
        });
    }

    function initSortable() {
        if (typeof jQuery !== 'undefined' && jQuery.fn.sortable) {
            jQuery('.repeater-container').sortable({
                handle: '.repeater-header',
                items: '> .repeater-item',
                update: function() {
                    updateRepeaterIndices();
                }
            });
            
            jQuery('.repeater-header').css('cursor', 'move');
        }
    }

    function init() {
        console.log('[CV-ADMIN] Iniciando componentes...');

        initTabs();
        initRepeaterHeaders();
        initRemoveButtons();
        initAddButtons();
        updateRepeaterIndices();
        initHabilidadeNomeInput();
        initSortable();

        const firstItem = document.querySelector('.repeater-item');
        if (firstItem) {
            firstItem.classList.add('active');
            const fields = firstItem.querySelector('.repeater-fields');
            if (fields) {
                fields.style.display = 'block';
            }
        }

        console.log('[CV-ADMIN] Painel inicializado com sucesso!');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

if (typeof jQuery !== 'undefined') {
    jQuery(function($) {
        'use strict';

        var mediaFrame;

        $(document).on('click', '.upload-icon-button', function(e) {
            e.preventDefault();

            var $button = $(this);
            var $group = $button.closest('.media-upload-group');
            var $iconUrlField = $group.find('.icon-url');
            var $iconIdField = $group.find('.icon-id');
            var $preview = $group.find('.icon-preview');

            if (!mediaFrame) {
                mediaFrame = wp.media({
                    title: 'Selecionar Ícone',
                    button: {
                        text: 'Usar esta imagem',
                    },
                    library: {
                        type: ['image/svg+xml', 'image/png', 'image/jpeg'],
                    },
                    multiple: false,
                });

                mediaFrame.on('select', function() {
                    var attachment = mediaFrame.state().get('selection').first().toJSON();

                    $iconUrlField.val(attachment.url);
                    $iconIdField.val(attachment.id);

                    var markup = attachment.url.toLowerCase().endsWith('.svg') ?
                        '<svg class="habilidade-icon-preview" data-src="' + attachment.url + '" alt="' + attachment.alt + '"></svg>' :
                        '<img class="habilidade-icon-preview" src="' + attachment.url + '" alt="' + attachment.alt + '" />';

                    $preview.html(markup);

                    if (!$group.find('.remove-icon-button').length) {
                        $button.after('<button type="button" class="button remove-icon-button">Remover Imagem</button>');
                    }
                });
            }

            mediaFrame.open();
        });

        $(document).on('click', '.remove-icon-button', function(e) {
            e.preventDefault();

            var $button = $(this);
            var $group = $button.closest('.media-upload-group');
            var $iconUrlField = $group.find('.icon-url');
            var $iconIdField = $group.find('.icon-id');
            var $preview = $group.find('.icon-preview');

            $iconUrlField.val('');
            $iconIdField.val('');
            $preview.html('<span class="placeholder">Nenhuma imagem</span>');
            $button.remove();
        });
    });
}
