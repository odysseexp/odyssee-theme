

(function($) {
    'use strict';

    console.log('[FAQ-ADMIN] Inicializando script do painel FAQ...');

    function initCollapsibles() {
        $(document).off('click', '.collapsible-header').on('click', '.collapsible-header', function(e) {
            
            if ($(e.target).closest('.remove-button').length) {
                return;
            }
            
            var $item = $(this).closest('.collapsible-item');
            var $body = $item.find('> .collapsible-body');
            
            $item.toggleClass('active');
            $body.slideToggle(200);
        });
    }

    function initSortable() {
        if (!$.fn.sortable) return;

        $('.category-container').sortable({
            handle: '.category-header',
            items: '> .category-item',
            placeholder: 'ui-state-highlight',
            update: function() {
                updateAllIndices();
            }
        });

        $('.subcategory-container').sortable({
            handle: '.subcategory-header',
            items: '> .subcategory-item',
            placeholder: 'ui-state-highlight',
            update: function() {
                updateAllIndices();
            }
        });

        $('.question-container').sortable({
            handle: '.question-header',
            items: '> .question-item',
            placeholder: 'ui-state-highlight',
            update: function() {
                updateAllIndices();
            }
        });

        $('.links-container-list').sortable({
            handle: '.link-handle',
            items: '> .link-item',
            update: function() {
                updateAllIndices();
            }
        });

        $('.category-header, .subcategory-header, .question-header, .link-handle').css('cursor', 'move');
    }

    function initRemoveButtons() {
        $(document).off('click', '.remove-button').on('click', '.remove-button', function(e) {
            e.preventDefault();
            e.stopPropagation();

            if (confirm('Tem certeza que deseja remover este item?')) {
                var $item = $(this).closest('.collapsible-item, .link-item');
                $item.fadeOut(200, function() {
                    $item.remove();
                    updateAllIndices();
                });
            }
        });
    }

    function initAddButtons() {
        
        $(document).off('click', '.add-category-btn').on('click', '.add-category-btn', function(e) {
            e.preventDefault();
            var template = $('#tpl-category').html();
            var $newCat = $(template);
            $('.category-container').append($newCat);
            updateAllIndices();
            initSortable();
            $newCat.find('.category-header').trigger('click');
        });

        $(document).off('click', '.add-subcategory-btn').on('click', '.add-subcategory-btn', function(e) {
            e.preventDefault();
            var template = $('#tpl-subcategory').html();
            var $newSub = $(template);
            $(this).siblings('.subcategory-container').append($newSub);
            updateAllIndices();
            initSortable();
            $newSub.find('.subcategory-header').trigger('click');
        });

        $(document).off('click', '.add-question-btn').on('click', '.add-question-btn', function(e) {
            e.preventDefault();
            var template = $('#tpl-question').html();
            var $newQ = $(template);
            $(this).siblings('.question-container').append($newQ);
            updateAllIndices();
            initSortable();
            $newQ.find('.question-header').trigger('click');
        });

        $(document).off('click', '.add-link-btn').on('click', '.add-link-btn', function(e) {
            e.preventDefault();
            var template = $('#tpl-link').html();
            var $newLink = $(template);
            $(this).siblings('.links-container-list').append($newLink);
            updateAllIndices();
            initSortable();
        });
    }

    function updateAllIndices() {
        $('.category-container > .category-item').each(function(cIdx) {
            var $cat = $(this);

            var catNamePt = $cat.find('.cat-name-pt').val() || '';
            $cat.find('> .category-header .category-title span').text(catNamePt ? catNamePt : 'Categoria ' + (cIdx + 1));

            $cat.find('input, textarea, select').each(function() {
                var name = $(this).attr('data-name');
                if (!name) return;

                var $sub = $(this).closest('.subcategory-item');
                var $q = $(this).closest('.question-item');
                var $l = $(this).closest('.link-item');

                var subIdx = $sub.length ? $sub.index() : 0;
                var qIdx = $q.length ? $q.index() : 0;
                var lIdx = $l.length ? $l.index() : 0;

                var finalName = name.replace('{c}', cIdx).replace('{s}', subIdx).replace('{q}', qIdx).replace('{l}', lIdx);
                $(this).attr('name', finalName);
            });

            $cat.find('.subcategory-container > .subcategory-item').each(function(sIdx) {
                var $sub = $(this);
                var subNamePt = $sub.find('.subcat-name-pt').val() || '';
                $sub.find('> .subcategory-header .subcategory-title span').text(subNamePt ? subNamePt : 'Subcategoria ' + (sIdx + 1));

                $sub.find('.question-container > .question-item').each(function(qIdx) {
                    var $q = $(this);
                    var qNamePt = $q.find('.question-name-pt').val() || '';
                    $q.find('> .question-header .question-title span').text(qNamePt ? qNamePt : 'Pergunta ' + (qIdx + 1));

                    $q.find('input, textarea, select').each(function() {
                        var name = $(this).attr('data-name');
                        if (!name) return;

                        var $l = $(this).closest('.link-item');
                        var lIdx = $l.length ? $l.index() : 0;

                        var finalName = name.replace('{c}', cIdx).replace('{s}', sIdx).replace('{q}', qIdx).replace('{l}', lIdx);
                        $(this).attr('name', finalName);
                    });
                });
            });
        });
    }

    $(document).on('keyup change', '.cat-name-pt, .subcat-name-pt, .question-name-pt', function() {
        updateAllIndices();
    });

    $(function() {
        initCollapsibles();
        initSortable();
        initRemoveButtons();
        initAddButtons();
        updateAllIndices();
    });

})(jQuery);
