<?php get_header(); ?>

<main class="main-content single-post-container">
    
    <?php
    if (have_posts()) {
        while (have_posts()) {
            the_post();
    ?>
            
            <article class="single-post-content">
                <div class="single-post-header">
                    <h1 class="single-post-title"><?php the_title(); ?></h1>
                    <div class="single-post-meta">
                        <span class="post-date"><?php echo get_the_date(); ?></span>
                        <span class="post-author"><?php echo get_the_author(); ?></span>
                    </div>
                </div>

                <?php
                if (has_post_thumbnail()) {
                    echo '<div class="single-post-featured-image">';
                    the_post_thumbnail('full');
                    echo '</div>';
                }
                ?>

                <div class="single-post-body">
                    <?php the_content(); ?>
                </div>

                <div class="single-post-footer">
                    <a href="<?php echo esc_url(home_url('/posts')); ?>" class="btn-back">&larr; Voltar aos Posts</a>
                </div>
            </article>
    <?php
        }
    }
    ?>
</main>

<?php get_footer(); ?>