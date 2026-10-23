<?php
/**
 * Template Name: FAQ
 * Página FAQ - Perguntas Frequentes
 * Renderizada dinamicamente a partir dos dados do Painel Admin (odyssee_faq_data)
 */

get_header();

$faq_data = function_exists( 'odyssee_faq_get_data' ) ? odyssee_faq_get_data() : array();

$hero_title_pt    = ! empty( $faq_data['hero_title_pt'] ) ? $faq_data['hero_title_pt'] : 'FAQ – Perguntas Frequentes';
$hero_title_en    = ! empty( $faq_data['hero_title_en'] ) ? $faq_data['hero_title_en'] : 'FAQ – Frequently Asked Questions';
$hero_subtitle_pt = ! empty( $faq_data['hero_subtitle_pt'] ) ? $faq_data['hero_subtitle_pt'] : 'Tire suas dúvidas sobre serviços, prazos e processos';
$hero_subtitle_en = ! empty( $faq_data['hero_subtitle_en'] ) ? $faq_data['hero_subtitle_en'] : 'Get answers about services, deadlines and processes';

$categorias = ! empty( $faq_data['categorias'] ) && is_array( $faq_data['categorias'] ) ? $faq_data['categorias'] : array();
?>

<main class="faq-page">
    
    <section class="faq-hero">
        <div class="container">
            <h1 class="faq-main-title" data-pt="<?php echo esc_attr( $hero_title_pt ); ?>" data-en="<?php echo esc_attr( $hero_title_en ); ?>">
                <?php echo esc_html( $hero_title_pt ); ?>
            </h1>
            <p class="faq-subtitle" data-pt="<?php echo esc_attr( $hero_subtitle_pt ); ?>" data-en="<?php echo esc_attr( $hero_subtitle_en ); ?>">
                <?php echo esc_html( $hero_subtitle_pt ); ?>
            </p>
        </div>
    </section>

    <section class="faq-content">
        <div class="container">
            <div class="faq-categories-wrapper">
                <?php if ( empty( $categorias ) ) : ?>
                    <p style="text-align: center; color: var(--color-text-muted);">Nenhuma pergunta frequente cadastrada no momento.</p>
                <?php else : ?>
                    <?php foreach ( $categorias as $cat ) : ?>
                        <div class="faq-category-block">
                            <?php if ( ! empty( $cat['nome_pt'] ) || ! empty( $cat['nome_en'] ) ) : ?>
                                <h2 class="faq-category-title" data-pt="<?php echo esc_attr( $cat['nome_pt'] ?? '' ); ?>" data-en="<?php echo esc_attr( $cat['nome_en'] ?? '' ); ?>">
                                    <?php echo esc_html( $cat['nome_pt'] ?? '' ); ?>
                                </h2>
                            <?php endif; ?>

                            <?php 
                            $subcategorias = ! empty( $cat['subcategorias'] ) && is_array( $cat['subcategorias'] ) ? $cat['subcategorias'] : array();
                            foreach ( $subcategorias as $sub ) :
                            ?>
                                <div class="faq-subcategory-block">
                                    <?php if ( ! empty( $sub['nome_pt'] ) || ! empty( $sub['nome_en'] ) ) : ?>
                                        <h3 class="faq-subcategory-title" data-pt="<?php echo esc_attr( $sub['nome_pt'] ?? '' ); ?>" data-en="<?php echo esc_attr( $sub['nome_en'] ?? '' ); ?>">
                                            <?php echo esc_html( $sub['nome_pt'] ?? '' ); ?>
                                        </h3>
                                    <?php endif; ?>

                                    <div class="faq-list">
                                        <?php 
                                        $perguntas = ! empty( $sub['perguntas'] ) && is_array( $sub['perguntas'] ) ? $sub['perguntas'] : array();
                                        foreach ( $perguntas as $q ) :
                                            $pergunta_pt = $q['pergunta_pt'] ?? '';
                                            $pergunta_en = $q['pergunta_en'] ?? '';
                                            $resposta_pt = $q['resposta_pt'] ?? '';
                                            $resposta_en = $q['resposta_en'] ?? '';
                                            $links       = ! empty( $q['links'] ) && is_array( $q['links'] ) ? $q['links'] : array();
                                        ?>
                                            <div class="faq-item">
                                                <button class="faq-question" type="button">
                                                    <span class="faq-question-text" data-pt="<?php echo esc_attr( $pergunta_pt ); ?>" data-en="<?php echo esc_attr( $pergunta_en ); ?>">
                                                        <?php echo esc_html( $pergunta_pt ); ?>
                                                    </span>
                                                    <svg class="faq-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                        <path d="M19 9l-7 7-7-7"></path>
                                                    </svg>
                                                </button>
                                                <div class="faq-answer">
                                                    <div class="faq-answer-content" data-pt-text="<?php echo esc_attr( $resposta_pt ); ?>" data-en-text="<?php echo esc_attr( $resposta_en ); ?>">
                                                        <?php 
                                                        $paragrafos = array_filter( explode( "\n", $resposta_pt ), 'trim' );
                                                        foreach ( $paragrafos as $p ) :
                                                        ?>
                                                            <p><?php echo wp_kses_post( trim( $p ) ); ?></p>
                                                        <?php endforeach; ?>

                                                        <?php if ( ! empty( $links ) ) : ?>
                                                            <div class="faq-links">
                                                                <?php foreach ( $links as $link ) : ?>
                                                                    <a href="<?php echo esc_url( $link['url'] ?? '#' ); ?>" target="_blank" class="faq-link" rel="noopener noreferrer">
                                                                        <span data-pt="<?php echo esc_attr( $link['label_pt'] ?? '' ); ?>" data-en="<?php echo esc_attr( $link['label_en'] ?? '' ); ?>">
                                                                            <?php echo esc_html( $link['label_pt'] ?? '' ); ?>
                                                                        </span>
                                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                                            <path d="M9 5l7 7-7 7"></path>
                                                                        </svg>
                                                                    </a>
                                                                <?php endforeach; ?>
                                                            </div>
                                                        <?php endif; ?>
                                                    </div>
                                                </div>
                                            </div>
                                        <?php endforeach; ?>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </div>
    </section>
</main>

<script nonce="<?php echo esc_attr( odyssee_generate_csp_nonce() ); ?>">
document.addEventListener('DOMContentLoaded', function() {
    // Accordion Toggle
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const isOpen = item.classList.contains('active');
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            item.classList.toggle('active');
        });
    });

    // Função de tradução dinâmica da FAQ
    function translateDynamicFAQ() {
        const currentLang = (window.safeStorage && window.safeStorage.getItem('userLang')) || (typeof localStorage !== 'undefined' ? localStorage.getItem('userLang') : null) || 'pt';
        const langProp = currentLang === 'en' ? 'en' : 'pt';

        // 1. Traduzir elementos com data-pt e data-en simples
        document.querySelectorAll('[data-pt][data-en]').forEach(el => {
            const text = el.getAttribute('data-' + langProp);
            if (text !== null && text !== '') {
                el.textContent = text;
            }
        });

        // 2. Traduzir parágrafos de resposta
        document.querySelectorAll('.faq-answer-content').forEach(container => {
            const rawText = container.getAttribute('data-' + langProp + '-text');
            if (!rawText) return;

            const linksDiv = container.querySelector('.faq-links');
            
            // Reconstruir os parágrafos
            const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            let paragraphsHTML = lines.map(line => `<p>${escapeHtml(line)}</p>`).join('');

            // Se existirem links, manter o container de links
            if (linksDiv) {
                // Atualizar labels dos links internos
                linksDiv.querySelectorAll('[data-pt][data-en]').forEach(linkLabel => {
                    const lText = linkLabel.getAttribute('data-' + langProp);
                    if (lText) linkLabel.textContent = lText;
                });
                paragraphsHTML += linksDiv.outerHTML;
            }

            container.innerHTML = paragraphsHTML;
        });
    }

    function escapeHtml(str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    // Traduzir no carregamento inicial
    translateDynamicFAQ();

    // Ouvir eventos de troca de idioma
    window.addEventListener('storage', (e) => {
        if (e.key === 'userLang') translateDynamicFAQ();
    });
    window.addEventListener('odyssee-storage', (e) => {
        if (e.detail && e.detail.key === 'userLang') translateDynamicFAQ();
    });
});
</script>

<?php get_footer(); ?>
