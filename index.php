<?php

get_header();

global $wp_query;
$query_to_use = $wp_query;

$req_uri = isset( $_SERVER['REQUEST_URI'] ) ? parse_url( $_SERVER['REQUEST_URI'], PHP_URL_PATH ) : '';
$path = trim( $req_uri, '/' );
$is_posts_slug = ( get_query_var( 'odyssee_all_posts' ) == 1 )
               || ( $path === 'posts' || strpos( $path, 'posts/' ) === 0 )
               || ( $path === 'todos-os-posts' || strpos( $path, 'todos-os-posts/' ) === 0 );

// Fallback robusto: se a query principal vier vazia, como 404, ou for a rota /posts
if ( ! $query_to_use->have_posts() || is_404() || $is_posts_slug ) {
    $paged = 1;
    if ( preg_match( '#(?:posts|todos-os-posts)(?:/page/([0-9]+)|/([0-9]+))?/?$#', $path, $m ) && ! empty( $m[1] ) ) {
        $paged = max( 1, intval( $m[1] ) );
    } elseif ( get_query_var( 'paged' ) ) {
        $paged = max( 1, intval( get_query_var( 'paged' ) ) );
    } elseif ( get_query_var( 'page' ) ) {
        $paged = max( 1, intval( get_query_var( 'page' ) ) );
    }

    $custom_args = array(
        'post_type'      => 'post',
        'post_status'    => 'publish',
        'posts_per_page' => 12,
        'paged'          => $paged,
        'orderby'        => 'date',
        'order'          => 'DESC',
    );

    if ( is_category() ) {
        $cat_obj = get_queried_object();
        if ( ! empty( $cat_obj->term_id ) ) {
            $custom_args['cat'] = $cat_obj->term_id;
        }
    } elseif ( is_tag() ) {
        $tag_obj = get_queried_object();
        if ( ! empty( $tag_obj->term_id ) ) {
            $custom_args['tag_id'] = $tag_obj->term_id;
        }
    }

    $custom_query = new WP_Query( $custom_args );
    if ( $custom_query->have_posts() || ! $query_to_use->have_posts() ) {
        $query_to_use = $custom_query;
    }
}
?>

<div class="container" style="padding-top: 3.5rem; padding-bottom: 5rem;">
    <header class="page-hero">
        <span class="section-badge">Portfólio & Artigos</span>
        <h1 class="page-title">
            <?php
            if ( is_category() ) {
                single_cat_title();
            } elseif ( is_tag() ) {
                single_tag_title();
            } else {
                echo 'Galeria de Projetos';
            }
            ?>
        </h1>
        <p class="page-lead">Explore nossa coleção de criações em design, edição de vídeo, motion e ilustração.</p>

        <nav class="gallery-category-filter">
            <a href="<?php echo esc_url( home_url( '/posts/' ) ); ?>" class="filter-pill <?php echo ( ! is_category() && ! is_tag() ) ? 'active' : ''; ?>">Todos</a>
            <a href="<?php echo esc_url( home_url( '/category/design-grafico/' ) ); ?>" class="filter-pill <?php echo ( is_category( 'design-grafico' ) ) ? 'active' : ''; ?>">Design Gráfico</a>
            <a href="<?php echo esc_url( home_url( '/category/edicao-de-video/' ) ); ?>" class="filter-pill <?php echo ( is_category( 'edicao-de-video' ) ) ? 'active' : ''; ?>">Edição de Vídeo</a>
            <a href="<?php echo esc_url( home_url( '/category/motion/' ) ); ?>" class="filter-pill <?php echo ( is_category( 'motion' ) ) ? 'active' : ''; ?>">Motion</a>
            <a href="<?php echo esc_url( home_url( '/category/ilustracao-digital/' ) ); ?>" class="filter-pill <?php echo ( is_category( 'ilustracao-digital' ) ) ? 'active' : ''; ?>">Ilustração Digital</a>
            <a href="<?php echo esc_url( home_url( '/category/impressos/' ) ); ?>" class="filter-pill <?php echo ( is_category( 'impressos' ) ) ? 'active' : ''; ?>">Impressos</a>
        </nav>
    </header>

    <div class="portfolio-grid">
        <?php if ( $query_to_use->have_posts() ) : ?>
            <?php while ( $query_to_use->have_posts() ) : $query_to_use->the_post(); ?>
                <?php
                $categories = get_the_category();
                $cat_name = ! empty( $categories ) ? esc_html( $categories[0]->name ) : 'Projeto';

                $thumb_url = '';
                if ( has_post_thumbnail() ) {
                    $thumb_url = get_the_post_thumbnail_url( get_the_ID(), 'medium_large' );
                }
                if ( ! $thumb_url ) {
                    $content = get_the_content();
                    if ( preg_match( '/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/', $content, $match ) ) {
                        $thumb_url = 'https://img.youtube.com/vi/' . $match[1] . '/maxresdefault.webp';
                    }
                }
                if ( $thumb_url && function_exists( 'odyssee_sanitize_media_url' ) ) {
                    $thumb_url = odyssee_sanitize_media_url( $thumb_url );
                }
                ?>
                <article class="portfolio-card">
                    <div class="card-thumb-wrapper">
                        <?php if ( ! empty( $thumb_url ) ) : ?>
                            <img src="<?php echo esc_url( $thumb_url ); ?>" alt="<?php the_title_attribute(); ?>" class="card-thumb-img" loading="lazy">
                        <?php else : ?>
                            <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:var(--bg-surface-elevated); color:var(--text-muted);">
                                <span><?php echo esc_html( $cat_name ); ?></span>
                            </div>
                        <?php endif; ?>
                        <span class="card-category-tag"><?php echo esc_html( $cat_name ); ?></span>
                    </div>

                    <div class="card-content">
                        <h3 class="card-title"><?php the_title(); ?></h3>
                        <p class="card-excerpt"><?php echo wp_trim_words( get_the_excerpt(), 14, '...' ); ?></p>
                        <div class="card-footer">
                            <a href="<?php the_permalink(); ?>" class="card-link">
                                Ver Projeto &rarr;
                            </a>
                        </div>
                    </div>
                </article>
            <?php endwhile; ?>
            <?php wp_reset_postdata(); ?>
        <?php else : ?>
            <p style="color:var(--text-muted); text-align:center; grid-column: 1 / -1; padding: 3rem 1rem;">Nenhum item encontrado.</p>
        <?php endif; ?>
    </div>

    <?php if ( $query_to_use->max_num_pages > 1 ) : ?>
        <nav class="portfolio-pagination" aria-label="Paginação de posts">
            <?php
            $current_page = max( 1, intval( get_query_var( 'paged' ) ?: ( get_query_var( 'page' ) ?: 1 ) ) );
            if ( preg_match( '#(?:posts|todos-os-posts)(?:/page/([0-9]+)|/([0-9]+))?/?$#', $path, $m ) && ! empty( $m[1] ) ) {
                $current_page = max( 1, intval( $m[1] ) );
            }

            $big = 999999999;
            $base_link = ( $is_posts_slug ) ? home_url( '/posts/%_%' ) : str_replace( $big, '%#%', esc_url( get_pagenum_link( $big ) ) );
            $format = ( $is_posts_slug ) ? 'page/%#%/' : '?paged=%#%';

            echo paginate_links( array(
                'base'      => $base_link,
                'format'    => $format,
                'current'   => $current_page,
                'total'     => $query_to_use->max_num_pages,
                'prev_text' => '&larr; Anterior',
                'next_text' => 'Próximo &rarr;',
                'type'      => 'plain',
            ) );
            ?>
        </nav>
    <?php endif; ?>
</div>

<?php
get_footer();
