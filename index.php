<?php

get_header();
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
    </header>

    <div class="portfolio-grid">
        <?php if ( have_posts() ) : ?>
            <?php while ( have_posts() ) : the_post(); ?>
                <?php
                $categories = get_the_category();
                $cat_name = ! empty( $categories ) ? esc_html( $categories[0]->name ) : 'Projeto';
                ?>
                <article class="portfolio-card">
                    <div class="card-thumb-wrapper">
                        <?php if ( has_post_thumbnail() ) : ?>
                            <img src="<?php the_post_thumbnail_url( 'medium_large' ); ?>" alt="<?php the_title_attribute(); ?>" class="card-thumb-img" loading="lazy">
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
        <?php else : ?>
            <p style="color:var(--text-muted); text-align:center; grid-column: 1 / -1;">Nenhum item encontrado.</p>
        <?php endif; ?>
    </div>
</div>

<?php
get_footer();
