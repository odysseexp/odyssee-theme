<?php get_header();

$orbit_query = new WP_Query( array(
    'post_type'      => 'post',
    'post_status'    => 'publish',
    'posts_per_page' => 24,
    'orderby'        => 'rand',
    'meta_query'     => array(
        array(
            'key'     => '_thumbnail_id',
            'compare' => 'EXISTS',
        ),
    ),
) );

$orbit_items = array();
if ( $orbit_query->have_posts() ) {
    $upload_dir = wp_upload_dir();
    $base_dir   = trailingslashit( $upload_dir['basedir'] );
    $base_url   = trailingslashit( $upload_dir['baseurl'] );

    while ( $orbit_query->have_posts() ) {
        $orbit_query->the_post();
        $thumb_id = get_post_thumbnail_id( get_the_ID() );
        if ( ! $thumb_id ) continue;

        $full_url = wp_get_attachment_url( $thumb_id );
        if ( ! $full_url ) continue;

        $chosen_thumb = $full_url;
        $med_url = wp_get_attachment_image_url( $thumb_id, 'medium' );
        if ( $med_url && strpos( $med_url, $base_url ) === 0 ) {
            $rel_path  = substr( $med_url, strlen( $base_url ) );
            $file_path = $base_dir . $rel_path;
            if ( file_exists( $file_path ) ) {
                $chosen_thumb = $med_url;
            }
        }

        $orbit_items[] = array(
            'id'    => get_the_ID(),
            'title' => get_the_title(),
            'thumb' => $chosen_thumb,
            'full'  => $full_url,
        );
    }
    wp_reset_postdata();
}
?>

<div class="immersive-wrapper">
    
    <div class="gradients-container">
        <div class="g1"></div><div class="g2"></div><div class="g3"></div><div class="g4"></div><div class="g5"></div>
    </div>
    <div class="gradient-fade-bottom"></div>

    <section id="home" class="hero-section">
        
        <div id="artcraft-orbit-container" class="artcraft-orbit-container"></div>
        <script id="odyssee-orbit-data" type="application/json">
            <?php echo json_encode( $orbit_items ); ?>
        </script>

        <div class="hero-content-centered">
            <img src="<?php echo esc_url( home_url( '/wp-content/uploads/2025/08/logo-colorful-reduced-scaled-e1756493913129.webp' ) ); ?>" class="hero-symbol" alt="Símbolo">
            <h1 class="hero-slogan" data-key="hero-slogan">Experiencie o Próximo Nível da Criatividade</h1>
            <a href="#recentes" class="scroll-indicator" aria-label="Rolar para os projetos"><i class="fas fa-chevron-down"></i></a>
        </div>
    </section>

        <section id="recentes" class="portfolio-section transparent-bg">
            <h2 class="section-title" data-key="recentes">Trabalhos Recentes</h2>
            <div class="carousel-wrapper" id="carousel-recentes"></div>
        </section>
    </div> 

        <section id="design-grafico" class="category-section">
            <h2 class="section-title" data-key="design-grafico">Design Gráfico</h2>

            <img src="" class="category-banner" id="banner-design-grafico" alt="Design Gráfico" data-category="design-grafico">
            
         <div class="portfolio-showcase">
             <div class="carousel-wrapper" id="carousel-design-grafico"></div>
         </div>

         <div class="category-buttons">
             <div class="category-image-placeholder" id="design-placeholder">
                 <i class="fas fa-palette"></i>
                 <span class="placeholder-text" data-key="ver-servicos">Ver Serviços e Preços</span>
             </div>
             <a href="/posts/?categoria=design-grafico" class="category-posts-link">
                 <i class="fas fa-th-large"></i>
                 <span>Ver todos os posts de Design Gráfico</span>
             </a>
         </div>
    </section>

    <section id="edicao-video" class="category-section">
        <h2 class="section-title" data-key="edicao-video">Edição de Vídeo</h2>

        <img src="" class="category-banner" id="banner-edicao-video" alt="Edição de Vídeo" data-category="edicao-video">
        
        <div class="portfolio-showcase">
             <div class="carousel-wrapper" id="carousel-edicao-video"></div>
        </div>

        <div class="category-buttons">
            <div class="category-image-placeholder" id="video-placeholder">
                <i class="fas fa-film"></i>
                <span class="placeholder-text" data-key="ver-servicos">Ver Serviços e Preços</span>
            </div>
            <a href="/posts/?categoria=edicao-de-video" class="category-posts-link">
                <i class="fas fa-th-large"></i>
                <span>Ver todos os posts de Edição de Vídeo</span>
            </a>
        </div>
    </section>

    <section id="motion" class="category-section">
        <h2 class="section-title" data-key="motion">Motion</h2>

        <img src="" class="category-banner" id="banner-motion" alt="Motion" data-category="motion">
        
        <div class="portfolio-showcase">
           <div class="carousel-wrapper" id="carousel-motion"></div>
        </div>

        <div class="category-buttons">
            <div class="category-image-placeholder" id="motion-placeholder">
                <i class="fas fa-play-circle"></i>
                <span class="placeholder-text" data-key="ver-servicos">Ver Serviços e Preços</span>
            </div>
            <a href="/posts/?categoria=motion" class="category-posts-link">
                <i class="fas fa-th-large"></i>
                <span>Ver todos os posts de Motion</span>
            </a>
        </div>
    </section>

    <section id="ilustracao" class="category-section">
        <h2 class="section-title" data-key="ilustracao">Ilustração Digital</h2>

        <img src="" class="category-banner" id="banner-ilustracao" alt="Ilustração Digital" data-category="ilustracao">
        
        <div class="portfolio-showcase">
           <div class="carousel-wrapper" id="carousel-ilustracao"></div>
        </div>

        <div class="category-buttons">
            <div class="category-image-placeholder" id="ilustracao-placeholder">
                <i class="fas fa-paint-brush"></i>
                <span class="placeholder-text" data-key="ver-servicos">Ver Serviços e Preços</span>
            </div>
            <a href="/posts/?categoria=ilustracao-digital" class="category-posts-link">
                <i class="fas fa-th-large"></i>
                <span>Ver todos os posts de Ilustração Digital</span>
            </a>
        </div>
    </section>

    <section id="impressos" class="category-section">
        <h2 class="section-title" data-key="impressos">Impressos</h2>

        <img src="" class="category-banner" id="banner-impressos" alt="Impressos" data-category="impressos">
        
        <div class="portfolio-showcase">
            <div class="carousel-wrapper" id="carousel-impressos"></div>
        </div>

        <div class="category-buttons">
            <a href="/posts/?categoria=impressos" class="category-posts-link">
                <i class="fas fa-th-large"></i>
                <span>Ver todos os posts de Impressos</span>
            </a>
        </div>
    </section>

    <section id="contato" class="footer-section">
        <h2 data-key="contato">Dúvidas?</h2>
        <button class="btn-primary" data-key="fale-whatsapp">Fale Comigo no WhatsApp</button>
    </section>

<?php get_footer(); ?>