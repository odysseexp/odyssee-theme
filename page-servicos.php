<?php
/**
 * Template Name: Página de Serviços
 */
get_header(); ?>

<div class="services-page-wrapper">
    
    <section id="services-hero" class="services-hero-section">
        <div class="services-hero-content">
            <h1 class="services-hero-title" data-key="servicos-titulo">Serviços e Preços</h1>
            <p class="services-hero-subtitle" data-key="servicos-subtitulo">Confira todos os nossos serviços e pacotes promocionais</p>
        </div>
    </section>

    <?php echo odyssee_get_aviso_html( 'geral' ); ?>

    <section id="servicos-design-grafico" class="service-category-section">
        <div class="service-category-header">
            <h2 class="section-title" data-key="design-grafico">Design Gráfico</h2>
        </div>
        
        <?php echo odyssee_get_aviso_html( 'design' ); ?>

        <div class="services-showcase">
            <h3 style="text-align: center;" data-key="servicos-precos">Serviços e Preços</h3>
            <div class="services-grid" id="design-services-grid"></div>
            <h3 style="margin-top: 3rem; text-align: center;" data-key="pacotes-promocionais">Pacotes Promocionais</h3>
            <div class="services-grid" id="design-packages-grid"></div>
        </div>
    </section>

    <section id="servicos-edicao-video" class="service-category-section">
        <div class="service-category-header">
            <h2 class="section-title" data-key="edicao-video">Edição de Vídeo</h2>
        </div>
        
        <?php echo odyssee_get_aviso_html( 'video' ); ?>

        <div class="services-showcase">
            <h3 style="text-align: center;" data-key="servicos-precos">Serviços e Preços</h3>
            <div class="services-grid" id="video-services-grid"></div>
            <h3 style="margin-top: 3rem; text-align: center;" data-key="pacotes-promocionais">Pacotes Promocionais</h3>
            <div class="services-grid" id="video-packages-grid"></div>
        </div>
    </section>

    <section id="servicos-motion" class="service-category-section">
        <div class="service-category-header">
            <h2 class="section-title" data-key="motion">Motion</h2>
        </div>
        
        <?php echo odyssee_get_aviso_html( 'motion' ); ?>

        <div class="services-showcase">
            <h3 style="text-align: center;" data-key="servicos-precos">Serviços e Preços</h3>
            <div class="services-grid" id="motion-graphics-services-grid"></div>
        </div>
    </section>

    <section id="servicos-ilustracao" class="service-category-section">
        <div class="service-category-header">
            <h2 class="section-title" data-key="ilustracao">Ilustração Digital</h2>
        </div>
        
        <?php echo odyssee_get_aviso_html( 'ilustracao' ); ?>

        <div class="services-showcase">
            <h3 style="text-align: center;" data-key="servicos-precos">Serviços e Preços</h3>

            <div class="ilustracao-tutorial-box">
                <p data-key="ilustracao-tutorial">
                    Você primeiro escolhe o estilo da arte e depois escolhe qual será o tipo da arte e por último adicionais. Após selecionar as opções, basta interagir com o botão contratar que você será redirecionado para contato com o ilustrador.
                </p>
            </div>

            <div class="ilustracao-configurador">
                
                <div class="config-group">
                    <label data-key="ilustracao-estilo-label">Estilo da Arte:</label>
                    <div class="services-grid" id="ilustracao-estilos"></div>
                </div>

                <div class="config-group" id="ilustracao-tipos-group" style="display: none;">
                    <label data-key="ilustracao-tipo-label">Tipo da Arte:</label>
                    <div class="services-grid" id="ilustracao-tipos"></div>
                </div>

                <div class="config-group" id="ilustracao-adicionais-group" style="display: none;">
                    <label data-key="ilustracao-adicionais-label">Adicionais:</label>
                    <div class="services-grid" id="ilustracao-adicionais"></div>
                </div>
            </div>

            <div class="ilustracao-resumo" id="ilustracao-resumo" style="display: none;">
                <div class="resumo-content">
                    <h4 data-key="ilustracao-resumo-title">Seu Serviço</h4>
                    <p id="ilustracao-resumo-texto"></p>
                    <p class="resumo-preco" id="ilustracao-resumo-preco"></p>
                    <a href="#" id="ilustracao-btn-contratar" target="_blank" rel="noopener noreferrer">
                        <button data-key="btn-hire">Contratar</button>
                    </a>
                </div>
            </div>
        </div>
    </section>

    <section id="contato" class="footer-section">
        <h2 data-key="contato">Dúvidas?</h2>
        <p data-key="contato-sub">Entre em contato comigo.</p>
        <button class="btn-primary" data-key="fale-whatsapp">Fale Comigo no WhatsApp</button>
    </section>
</div>

<?php get_footer(); ?>
