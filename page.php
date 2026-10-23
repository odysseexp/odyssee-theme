<?php

get_header();
?>

<div class="container" style="padding-top: 3.5rem; padding-bottom: 5rem;">
    <?php while ( have_posts() ) : the_post(); ?>
        <header class="page-hero" style="border-bottom:none; padding: 2rem 0; text-align: left;">
            <h1 class="page-title"><?php the_title(); ?></h1>
        </header>

        <article class="content-wrapper">
            <div class="entry-content" style="color: var(--text-secondary); line-height: 1.8;">
                <?php the_content(); ?>
            </div>
        </article>
    <?php endwhile; ?>
</div>

<?php
get_footer();
