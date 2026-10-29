<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

require_once get_template_directory() . '/inc/cv-admin.php';
require_once get_template_directory() . '/inc/faq-admin.php';
require_once get_template_directory() . '/inc/visual-builder.php';

function odyssee_generate_csp_nonce() {
    if ( ! defined( 'ODYSSEE_CSP_NONCE' ) ) {
        define( 'ODYSSEE_CSP_NONCE', base64_encode( random_bytes( 16 ) ) );
    }
    return ODYSSEE_CSP_NONCE;
}

function odyssee_security_headers() {
    
    if ( is_admin() ) {
        return;
    }

    $nonce = odyssee_generate_csp_nonce();

    $is_localhost = isset($_SERVER['HTTP_HOST']) && (strpos($_SERVER['HTTP_HOST'], 'localhost') !== false || strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false);
    $local_connect = $is_localhost ? " http://localhost:8881" : "";

    $csp_policy = "default-src 'self'; script-src 'self' 'nonce-{$nonce}' https://www.googletagmanager.com https://www.instagram.com https://*.instagram.com https://platform.instagram.com https://*.cdninstagram.com https://connect.facebook.net https://www.youtube.com https://s.ytimg.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://www.instagram.com https://*.cdninstagram.com; img-src 'self' data: https:; font-src 'self' data: https://cdnjs.cloudflare.com; connect-src 'self'{$local_connect} https://www.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://www.instagram.com https://*.instagram.com https://graph.instagram.com https://*.cdninstagram.com https://www.youtube.com https://*.youtube.com; frame-src 'self' https://www.instagram.com https://*.instagram.com https://www.facebook.com https://*.facebook.com https://www.youtube.com https://*.youtube.com https://www.youtube-nocookie.com https://*.youtube-nocookie.com https://player.vimeo.com https://*.vimeo.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self';";
    
    if ( ! $is_localhost ) {
        $csp_policy .= " upgrade-insecure-requests;";
    }

    header( "Content-Security-Policy: " . $csp_policy );

    if ( ! $is_localhost ) {
        header( 'Strict-Transport-Security: max-age=63072000; includeSubDomains; preload' );
    }

    header( 'Cross-Origin-Opener-Policy: same-origin-allow-popups' );

    header( "Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=(), browsing-topics=(), attribution-reporting=()" );
}

function odyssee_scripts() {
    
    $theme_version = '26.10.10';

    wp_enqueue_style( 'odyssee-style', get_template_directory_uri() . '/style.css', array(), $theme_version );

    wp_enqueue_style( 'odyssee-fonts', get_template_directory_uri() . '/assets/css/fonts.css', array(), $theme_version );

    wp_enqueue_style( 'fontawesome', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css', array(), '6.4.0' );

    wp_enqueue_script( 'vanilla-tilt', get_template_directory_uri() . '/assets/vendor/vanilla-tilt/vanilla-tilt.min.js', array(), $theme_version, true );

    wp_enqueue_script( 'odyssee-app', get_template_directory_uri() . '/assets/js/app.js', array( 'vanilla-tilt' ), $theme_version, true );

    wp_localize_script( 'odyssee-app', 'odysseeSecure', array(
        'nonce' => wp_create_nonce( 'odyssee_nonce' ),
        'ajaxurl' => admin_url( 'admin-ajax.php' ),
        'restUrl' => rest_url(),
    ) );

    $precos_salvos = get_option( 'odyssee_precos', array() );
    $unitarios_salvos = get_option( 'odyssee_precos_unitarios', array() );
    if ( ! empty( $precos_salvos ) || ! empty( $unitarios_salvos ) ) {
        wp_localize_script( 'odyssee-app', 'odysseePrecos', array(
            'prices'     => $precos_salvos,
            'unitPrices' => $unitarios_salvos,
        ) );
    }

    $produtos_custom = get_option( 'odyssee_produtos_custom', array() );
    if ( ! empty( $produtos_custom ) && is_array( $produtos_custom ) ) {
        wp_localize_script( 'odyssee-app', 'odysseeProdutos', $produtos_custom );
    }

    $overrides = get_option( 'odyssee_servicos_overrides', array() );
    if ( ! empty( $overrides ) && is_array( $overrides ) ) {
        wp_localize_script( 'odyssee-app', 'odysseeOverrides', $overrides );
    }

    wp_localize_script( 'odyssee-app', 'odysseeInitialPosts', odyssee_get_initial_posts() );

    wp_enqueue_script( 'odyssee-placeholders', get_template_directory_uri() . '/assets/js/placeholders.js', array(), $theme_version, true );

    wp_enqueue_script( 'odyssee-category-banners', get_template_directory_uri() . '/assets/js/category-banners.js', array(), $theme_version, true );

    wp_enqueue_style( 'odyssee-cookie-banner', get_template_directory_uri() . '/assets/css/cookie-banner.css', array(), $theme_version );
    wp_enqueue_script( 'odyssee-cookie-banner', get_template_directory_uri() . '/assets/js/cookie-banner.js', array(), $theme_version, true );

    if ( is_front_page() || is_home() ) {
        wp_enqueue_script( 'odyssee-orbit-hero', get_template_directory_uri() . '/assets/js/orbit-hero.js', array(), $theme_version, true );
    }
}

function odyssee_clear_orbit_transients() {
    delete_transient( 'odyssee_orbit_pool' );
    delete_transient( 'odyssee_orbit_items' );
}
add_action( 'save_post', 'odyssee_clear_orbit_transients' );
add_action( 'deleted_post', 'odyssee_clear_orbit_transients' );

add_action( 'wp_footer', function() {
    
    if ( ! is_singular() ) return;

    global $post;
    if ( empty( $post->post_content ) ) return;

    $content = $post->post_content;

    $has_instagram = ( stripos( $content, 'instagram.com' ) !== false )
                  || ( stripos( $content, 'instagr.am' ) !== false )
                  || ( stripos( $content, 'instagram-media' ) !== false )
                  || ( stripos( $content, 'wp-block-embed-instagram' ) !== false )
                  || ( stripos( $content, 'embed' ) !== false );

    if ( ! $has_instagram ) return;

    $nonce = odyssee_generate_csp_nonce();

    ?>
    <script async nonce="<?php echo esc_attr( $nonce ); ?>" src="//www.instagram.com/embed.js" onload="if(window.instgrm&&window.instgrm.Embeds){window.instgrm.Embeds.process();}"></script>
    <script nonce="<?php echo esc_attr( $nonce ); ?>">
    (function() {
        function processInstagramEmbeds() {
            if (window.instgrm && window.instgrm.Embeds && typeof window.instgrm.Embeds.process === 'function') {
                window.instgrm.Embeds.process();
            }
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', processInstagramEmbeds);
        } else {
            processInstagramEmbeds();
        }
        window.addEventListener('load', processInstagramEmbeds);
        setTimeout(processInstagramEmbeds, 1000);
        setTimeout(processInstagramEmbeds, 3000);
    })();
    </script>
    <?php
}, 20 );

add_action( 'wp_enqueue_scripts', 'odyssee_scripts' );
add_action( 'send_headers', 'odyssee_security_headers' );
add_theme_support( 'title-tag' );
add_theme_support( 'post-thumbnails' );

function odyssee_seo_meta_tags() {
    $site_name   = 'Odyssee — Creative Experience';
    $default_img = home_url( '/wp-content/uploads/2025/08/logo-colorful-reduced-scaled-e1756493913129.webp' );
    $site_url    = home_url();
    $locale      = 'pt_BR';

    $req_uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '';

    if ( is_front_page() ) {
        $title = 'Odyssee — Creative Experience | Design, Vídeo, Motion & Ilustração';
        $desc  = 'Portfólio e serviços de Design Gráfico, Edição de Vídeo, Motion Graphics e Ilustração Digital. Experiência criativa de alto nível por Renato Harley Paiva.';
        $url   = $site_url;
        $image = $default_img;
        $type  = 'website';
    } elseif ( is_home() || is_archive() || is_page( 'posts' ) || is_page( 'todos-os-posts' ) || ( strpos( $req_uri, '/posts' ) !== false && ! is_singular( 'post' ) ) ) {
        $title = 'Todos os Posts — Odyssee Experience';
        $desc  = 'Explore todos os projetos, artes, edições de vídeo, ilustrações digitais e artigos criativos da Odyssee por Renato Harley Paiva.';
        $url   = home_url( '/posts/' );
        $image = $default_img;
        $type  = 'website';
    } elseif ( is_singular( 'post' ) ) {
        $title = get_the_title() . ' — Odyssee';
        $desc  = has_excerpt() ? wp_strip_all_tags( get_the_excerpt() ) : wp_trim_words( wp_strip_all_tags( get_the_content() ), 30, '…' );
        $url   = get_permalink();
        $image = has_post_thumbnail() ? get_the_post_thumbnail_url( null, 'large' ) : $default_img;
        $type  = 'article';
    } elseif ( is_page( 'faq' ) || is_page_template( 'faq.php' ) ) {
        $title = 'FAQ — Perguntas Frequentes | Odyssee';
        $desc  = 'Tire suas dúvidas sobre prazos, pagamentos, contratos e processos dos serviços de design, vídeo, motion e ilustração.';
        $url   = get_permalink();
        $image = $default_img;
        $type  = 'website';
    } elseif ( is_page( 'sobre-mim' ) || is_page_template( 'page-sobre-mim.php' ) ) {
        $title = 'Sobre Mim — Renato Harley Paiva | Odyssee';
        $desc  = 'Conheça o designer gráfico, ilustrador digital e editor de vídeo por trás da Odyssee. Formação acadêmica, experiência e habilidades.';
        $url   = get_permalink();
        $image = $default_img;
        $type  = 'profile';
    } elseif ( is_page( 'servicos' ) || is_page_template( 'page-servicos.php' ) ) {
        $title = 'Serviços e Preços | Odyssee';
        $desc  = 'Confira os serviços e pacotes de Design Gráfico, Edição de Vídeo, Motion Graphics e Ilustração Digital com preços transparentes.';
        $url   = get_permalink();
        $image = $default_img;
        $type  = 'website';
    } else {
        $title = wp_get_document_title();
        $desc  = 'Portfólio e serviços criativos de design, vídeo, motion e ilustração por Renato Harley Paiva.';
        $url   = get_permalink() ?: $site_url;
        $image = $default_img;
        $type  = 'website';
    }

    $desc = mb_substr( $desc, 0, 160 );

    echo '<meta name="description" content="' . esc_attr( $desc ) . '">' . "\n";

    echo '<meta property="og:type" content="' . esc_attr( $type ) . '">' . "\n";
    echo '<meta property="og:title" content="' . esc_attr( $title ) . '">' . "\n";
    echo '<meta property="og:description" content="' . esc_attr( $desc ) . '">' . "\n";
    echo '<meta property="og:url" content="' . esc_url( $url ) . '">' . "\n";
    echo '<meta property="og:image" content="' . esc_url( $image ) . '">' . "\n";
    echo '<meta property="og:site_name" content="' . esc_attr( $site_name ) . '">' . "\n";
    echo '<meta property="og:locale" content="' . esc_attr( $locale ) . '">' . "\n";

    echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
    echo '<meta name="twitter:title" content="' . esc_attr( $title ) . '">' . "\n";
    echo '<meta name="twitter:description" content="' . esc_attr( $desc ) . '">' . "\n";
    echo '<meta name="twitter:image" content="' . esc_url( $image ) . '">' . "\n";

    echo '<link rel="canonical" href="' . esc_url( $url ) . '">' . "\n";
}
add_action( 'wp_head', 'odyssee_seo_meta_tags', 1 );

function odyssee_custom_document_title( $title ) {
    $req_uri = isset( $_SERVER['REQUEST_URI'] ) ? $_SERVER['REQUEST_URI'] : '';

    if ( is_home() || is_archive() || is_page( 'posts' ) || is_page( 'todos-os-posts' ) || ( strpos( $req_uri, '/posts' ) !== false && ! is_singular( 'post' ) ) ) {
        return 'Todos os Posts — Odyssee Experience';
    }

    if ( is_front_page() ) {
        return 'Odyssee — Creative Experience | Design, Vídeo, Motion & Ilustração';
    }

    if ( is_singular( 'post' ) ) {
        return get_the_title() . ' — Odyssee Experience';
    }

    if ( is_page( 'faq' ) || is_page_template( 'faq.php' ) ) {
        return 'FAQ — Perguntas Frequentes | Odyssee Experience';
    }

    if ( is_page( 'sobre-mim' ) || is_page_template( 'page-sobre-mim.php' ) ) {
        return 'Sobre Mim — Renato Harley Paiva | Odyssee Experience';
    }

    if ( is_page( 'servicos' ) || is_page_template( 'page-servicos.php' ) ) {
        return 'Serviços e Preços | Odyssee Experience';
    }

    return $title;
}
add_filter( 'pre_get_document_title', 'odyssee_custom_document_title', 999 );

add_filter( 'document_title_parts', function( $title_parts ) {
    $req_uri = isset( $_SERVER['REQUEST_URI'] ) ? $_SERVER['REQUEST_URI'] : '';
    if ( is_home() || is_archive() || is_page( 'posts' ) || is_page( 'todos-os-posts' ) || ( strpos( $req_uri, '/posts' ) !== false && ! is_singular( 'post' ) ) ) {
        $title_parts['title'] = 'Todos os Posts';
        $title_parts['site']  = 'Odyssee Experience';
    }
    return $title_parts;
}, 999 );

function odyssee_jsonld_schema() {
    $site_url = home_url();

    $organization = array(
        '@context' => 'https://schema.org',
        '@type'    => 'ProfessionalService',
        'name'     => 'Odyssee — Creative Experience',
        'url'      => $site_url,
        'logo'     => home_url( '/wp-content/uploads/2025/08/logo-colorful-reduced-scaled-e1756493913129.webp' ),
        'description' => 'Serviços profissionais de Design Gráfico, Edição de Vídeo, Motion Graphics e Ilustração Digital.',
        'founder'  => array(
            '@type' => 'Person',
            'name'  => 'Renato Harley Paiva',
        ),
        'contactPoint' => array(
            '@type'            => 'ContactPoint',
            'telephone'        => '+55-11-96320-8691',
            'contactType'      => 'customer service',
            'availableLanguage' => array( 'Portuguese', 'English' ),
        ),
        'sameAs' => array(
            'https://www.instagram.com/harley_l.m/',
        ),
    );

    $nonce = odyssee_generate_csp_nonce();
    echo '<script type="application/ld+json" nonce="' . esc_attr( $nonce ) . '">' . wp_json_encode( $organization, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . '</script>' . "\n";

    if ( is_singular( 'post' ) ) {
        $article = array(
            '@context'      => 'https://schema.org',
            '@type'         => 'Article',
            'headline'      => get_the_title(),
            'datePublished' => get_the_date( 'c' ),
            'dateModified'  => get_the_modified_date( 'c' ),
            'author'        => array(
                '@type' => 'Person',
                'name'  => get_the_author(),
            ),
            'publisher'     => array(
                '@type' => 'Organization',
                'name'  => 'Odyssee — Creative Experience',
                'logo'  => array(
                    '@type' => 'ImageObject',
                    'url'   => home_url( '/wp-content/uploads/2025/08/logo-colorful-reduced-scaled-e1756493913129.webp' ),
                ),
            ),
            'mainEntityOfPage' => get_permalink(),
        );
        if ( has_post_thumbnail() ) {
            $article['image'] = get_the_post_thumbnail_url( null, 'large' );
        }
        echo '<script type="application/ld+json" nonce="' . esc_attr( $nonce ) . '">' . wp_json_encode( $article, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . '</script>' . "\n";
    }

    if ( is_page( 'faq' ) || is_page_template( 'faq.php' ) ) {
        $faq_items = array(
            array( 'q' => 'Quais são os prazos para entrega?', 'a' => 'Vídeos curtos até 2 dias úteis, vídeos longos até 5 dias úteis. Design gráfico no mesmo dia para até 5 posts. Ilustrações de 1 a 7 dias conforme complexidade. Motion pode levar até um mês.' ),
            array( 'q' => 'Quais formas de pagamento você aceita?', 'a' => 'PIX ou Mercado Pago.' ),
            array( 'q' => 'Como funcionam os contratos dos serviços?', 'a' => 'Todos os produtos incluem um contrato prévio para garantir os direitos de ambas partes legalmente.' ),
            array( 'q' => 'Você possui algum certificado profissional?', 'a' => 'Sim, possuo formação acadêmica e currículo profissional nos parâmetros.' ),
        );
        $faq_entities = array();
        foreach ( $faq_items as $item ) {
            $faq_entities[] = array(
                '@type'          => 'Question',
                'name'           => $item['q'],
                'acceptedAnswer' => array(
                    '@type' => 'Answer',
                    'text'  => $item['a'],
                ),
            );
        }
        $faq_schema = array(
            '@context'   => 'https://schema.org',
            '@type'      => 'FAQPage',
            'mainEntity' => $faq_entities,
        );
        echo '<script type="application/ld+json" nonce="' . esc_attr( $nonce ) . '">' . wp_json_encode( $faq_schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . '</script>' . "\n";
    }
}
add_action( 'wp_head', 'odyssee_jsonld_schema', 2 );

function odyssee_waf_headers() {
    if ( is_admin() ) {
        return;
    }

    header( 'X-Content-Type-Options: nosniff' );

    header( 'X-Frame-Options: SAMEORIGIN' );

    header( 'Referrer-Policy: strict-origin-when-cross-origin' );

    header( 'X-XSS-Protection: 1; mode=block' );

    header( 'Cross-Origin-Resource-Policy: same-site' );
}
add_action( 'send_headers', 'odyssee_waf_headers' );

function odyssee_performance_tweaks() {
    
    remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
    remove_action( 'wp_print_styles', 'print_emoji_styles' );
    remove_action( 'admin_print_scripts', 'print_emoji_detection_script' );
    remove_action( 'admin_print_styles', 'print_emoji_styles' );
    remove_filter( 'the_content_feed', 'wp_staticize_emoji' );
    remove_filter( 'comment_text_rss', 'wp_staticize_emoji' );
    remove_filter( 'wp_mail', 'wp_staticize_emoji_for_email' );

    remove_action( 'wp_head', 'rsd_link' );
    remove_action( 'wp_head', 'wlwmanifest_link' );
    remove_action( 'wp_head', 'wp_shortlink_wp_head' );
    remove_action( 'wp_head', 'rest_output_link_wp_head' );
    remove_action( 'wp_head', 'wp_oembed_add_discovery_links' );
    remove_action( 'wp_head', 'feed_links', 2 );
    remove_action( 'wp_head', 'feed_links_extra', 3 );
}
add_action( 'init', 'odyssee_performance_tweaks' );

function odyssee_resource_hints( $urls, $relation_type ) {
    if ( 'preconnect' === $relation_type ) {
        $urls[] = array( 'href' => 'https://cdnjs.cloudflare.com', 'crossorigin' => true );
    }
    return $urls;
}
add_filter( 'wp_resource_hints', 'odyssee_resource_hints', 10, 2 );

add_filter( 'wp_script_attributes', function( $attributes ) {
    $attributes['nonce'] = odyssee_generate_csp_nonce();
    return $attributes;
} );

add_filter( 'wp_inline_script_attributes', function( $attributes ) {
    $attributes['nonce'] = odyssee_generate_csp_nonce();
    return $attributes;
} );

add_filter( 'xmlrpc_enabled', '__return_false' );
remove_action( 'wp_head', 'wp_generator' );

if ( ! defined( 'DISALLOW_FILE_EDIT' ) ) {
    define( 'DISALLOW_FILE_EDIT', true );
}

add_action( 'wp_headers', function( $headers ) {
    unset( $headers['X-Pingback'] );
    return $headers;
} );
add_filter( 'pings_open', '__return_false', 10, 2 );

function odyssee_remove_wp_version_strings( $src ) {
    global $wp_version;
    parse_str( (string) parse_url( $src, PHP_URL_QUERY ), $query );
    if ( ! empty( $query['ver'] ) && $query['ver'] === $wp_version ) {
        $src = remove_query_arg( 'ver', $src );
    }
    return $src;
}
add_filter( 'style_loader_src', 'odyssee_remove_wp_version_strings' );
add_filter( 'script_loader_src', 'odyssee_remove_wp_version_strings' );

add_filter( 'rest_endpoints', function( $endpoints ) {
    if ( ! is_user_logged_in() ) {
        unset( $endpoints['/wp/v2/users'] );
        unset( $endpoints['/wp/v2/users/(?P<id>[\\d]+)'] );
    }
    return $endpoints;
} );

add_action( 'rest_api_init', function() {
    register_rest_field( 'post', 'post_title_en', array(
        'get_callback' => function( $post ) {
            
            return sanitize_text_field( get_post_meta( $post['id'], 'post_title_en', true ) );
        },
        'update_callback' => function( $value, $post ) {
            
            if ( ! current_user_can( 'edit_post', $post->ID ) ) {
                return new WP_Error( 'odyssee_forbidden', 'Você não tem permissão para editar este post.', array( 'status' => 403 ) );
            }

            $sanitized_value = sanitize_text_field( $value );

            return update_post_meta( $post->ID, 'post_title_en', $sanitized_value );
        },
        'schema' => array(
            'description' => 'Post title in English',
            'type' => 'string',
            'context' => array( 'view', 'edit' ),
        ),
    ) );
} );

function odyssee_avisos_admin_menu() {
    add_menu_page(
        'Avisos de Serviços',          
        'Avisos de Serviços',          
        'manage_options',              
        'odyssee-avisos-servicos',     
        'odyssee_avisos_admin_page',    
        'dashicons-megaphone',         
        27                             
    );
}
add_action( 'admin_menu', 'odyssee_avisos_admin_menu' );

function odyssee_avisos_settings_init() {
    
    register_setting( 'odyssee_avisos_group', 'odyssee_aviso_geral', array(
        'type'              => 'string',
        'sanitize_callback' => 'sanitize_textarea_field',
        'default'           => '',
    ) );
    register_setting( 'odyssee_avisos_group', 'odyssee_aviso_geral_ativo', array(
        'type'              => 'integer',
        'sanitize_callback' => 'absint',
        'default'           => 0,
    ) );
    register_setting( 'odyssee_avisos_group', 'odyssee_aviso_design', array(
        'type'              => 'string',
        'sanitize_callback' => 'sanitize_textarea_field',
        'default'           => '',
    ) );
    register_setting( 'odyssee_avisos_group', 'odyssee_aviso_design_ativo', array(
        'type'              => 'integer',
        'sanitize_callback' => 'absint',
        'default'           => 0,
    ) );
    register_setting( 'odyssee_avisos_group', 'odyssee_aviso_video', array(
        'type'              => 'string',
        'sanitize_callback' => 'sanitize_textarea_field',
        'default'           => '',
    ) );
    register_setting( 'odyssee_avisos_group', 'odyssee_aviso_video_ativo', array(
        'type'              => 'integer',
        'sanitize_callback' => 'absint',
        'default'           => 0,
    ) );
    register_setting( 'odyssee_avisos_group', 'odyssee_aviso_motion', array(
        'type'              => 'string',
        'sanitize_callback' => 'sanitize_textarea_field',
        'default'           => '',
    ) );
    register_setting( 'odyssee_avisos_group', 'odyssee_aviso_motion_ativo', array(
        'type'              => 'integer',
        'sanitize_callback' => 'absint',
        'default'           => 0,
    ) );
    register_setting( 'odyssee_avisos_group', 'odyssee_aviso_ilustracao', array(
        'type'              => 'string',
        'sanitize_callback' => 'sanitize_textarea_field',
        'default'           => '',
    ) );
    register_setting( 'odyssee_avisos_group', 'odyssee_aviso_ilustracao_ativo', array(
        'type'              => 'integer',
        'sanitize_callback' => 'absint',
        'default'           => 0,
    ) );
}
add_action( 'admin_init', 'odyssee_avisos_settings_init' );

function odyssee_avisos_admin_page() {
    if ( ! current_user_can( 'manage_options' ) ) {
        return;
    }

    if ( isset( $_GET['settings-updated'] ) ) {
        add_settings_error( 'odyssee_avisos_messages', 'odyssee_avisos_updated', 'Avisos atualizados com sucesso!', 'updated' );
    }
    settings_errors( 'odyssee_avisos_messages' );

    $categorias = array(
        array( 'key' => 'geral',       'label' => 'Aviso Geral (aparece no topo da página de serviços)' ),
        array( 'key' => 'design',      'label' => 'Design Gráfico' ),
        array( 'key' => 'video',       'label' => 'Edição de Vídeo' ),
        array( 'key' => 'motion',      'label' => 'Motion' ),
        array( 'key' => 'ilustracao',  'label' => 'Ilustração Digital' ),
    );

    ?>
    <div class="wrap">
        <h1><span class="dashicons dashicons-warning" style="font-size: 1.3em; margin-right: 8px;"></span>Avisos de Serviços — Odyssee</h1>
        <p>Configure avisos de indisponibilidade ou manutenção para cada categoria de serviço. Quando ativo, o aviso aparecerá na página de serviços.</p>

        <form method="post" action="options.php">
            <?php settings_fields( 'odyssee_avisos_group' ); ?>

            <table class="form-table" role="presentation">
                <?php foreach ( $categorias as $cat ) :
                    $aviso  = get_option( 'odyssee_aviso_' . $cat['key'], '' );
                    $ativo  = get_option( 'odyssee_aviso_' . $cat['key'] . '_ativo', 0 );
                ?>
                <tr>
                    <th scope="row" style="vertical-align: top;">
                        <label for="odyssee_aviso_<?php echo esc_attr( $cat['key'] ); ?>">
                            <?php echo esc_html( $cat['label'] ); ?>
                        </label>
                    </th>
                    <td>
                        <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px; font-weight: 600;">
                            <input type="checkbox"
                                   name="odyssee_aviso_<?php echo esc_attr( $cat['key'] ); ?>_ativo"
                                   value="1"
                                   <?php checked( $ativo, 1 ); ?>>
                            Ativar aviso
                        </label>
                        <textarea
                            name="odyssee_aviso_<?php echo esc_attr( $cat['key'] ); ?>"
                            id="odyssee_aviso_<?php echo esc_attr( $cat['key'] ); ?>"
                            rows="3"
                            cols="60"
                            class="large-text"
                            placeholder="Ex: INDISPONÍVEL NO MOMENTO — Motivo: equipamento em manutenção"
                        ><?php echo esc_textarea( $aviso ); ?></textarea>
                    </td>
                </tr>
                <?php endforeach; ?>
            </table>

            <?php submit_button( 'Salvar Avisos' ); ?>
        </form>
    </div>
    <?php
}

function odyssee_get_aviso_html( $key ) {
    $ativo = get_option( 'odyssee_aviso_' . $key . '_ativo', 0 );
    if ( ! $ativo ) {
        return '';
    }

    $aviso = get_option( 'odyssee_aviso_' . $key, '' );
    $aviso = trim( $aviso );
    if ( empty( $aviso ) ) {
        return '';
    }

    return '<div class="service-notice">
        <div class="service-notice-icon"><i class="fas fa-exclamation-triangle"></i></div>
        <div class="service-notice-text">' . esc_html( $aviso ) . '</div>
    </div>';
}

function odyssee_get_price_definitions() {

    return array(
        
        'design_servicos' => array(
            'label' => 'Design Gráfico — Serviços',
            'items' => array(
                'design_post'    => array( 'label' => 'Post',                          'default' => 20.00 ),
                'design_storie'  => array( 'label' => 'Storie',                        'default' => 25.00 ),
                'design_carrossel' => array( 'label' => 'Carrossel',                   'default' => 100.00 ),
                'logotipologo'   => array( 'label' => 'Logotipo e Logo',               'default' => 49.00 ),
                'bannersocial'   => array( 'label' => 'Banner para redes sociais',      'default' => 79.00 ),
                'visualid'       => array( 'label' => 'Cartão de Visitas',              'default' => 599.00 ),
                'cartao_visitas' => array( 'label' => 'Cartão de Visitas (antigo)',      'default' => 24.00 ),
                'flyer'          => array( 'label' => 'Flyer',                           'default' => 29.00 ),
                'convites'       => array( 'label' => 'Convites',                        'default' => 23.00 ),
                'banner'         => array( 'label' => 'Banner (impresso)',               'default' => 100.00 ),
                'botton'         => array( 'label' => 'Arte para Botton',                'default' => 19.00 ),
                'adesivos'       => array( 'label' => 'Arte para Adesivos',              'default' => 19.00 ),
            ),
        ),
        
        'design_pacotes' => array(
            'label' => 'Design Gráfico — Pacotes',
            'items' => array(
                'designmegapackage'    => array( 'label' => 'Mega Pacote',        'default' => 1250.00 ),
                'designpremiumpackage' => array( 'label' => 'Pacote Premium',     'default' => 679.00 ),
                'postpackage'          => array( 'label' => 'Pacote Posts',       'default' => 89.00 ),
                'storiepackage'        => array( 'label' => 'Pacote Stories',     'default' => 105.00 ),
                'carrosselpackage'     => array( 'label' => 'Pacote Carrosséis',  'default' => 449.00 ),
            ),
        ),
        
        'video_servicos' => array(
            'label' => 'Edição de Vídeo — Serviços',
            'items' => array(
                'video_longo' => array( 'label' => 'Vídeo Longo',  'default' => 350.00 ),
                'video_curto' => array( 'label' => 'Vídeo Curto',  'default' => 100.00 ),
                'thumbnail'   => array( 'label' => 'Thumbnail',    'default' => 20.00 ),
            ),
        ),
        
        'video_pacotes' => array(
            'label' => 'Edição de Vídeo — Pacotes',
            'items' => array(
                'mega_pacote'         => array( 'label' => 'Mega Pacote',             'default' => 2650.00 ),
                'pacote_premium_a'    => array( 'label' => 'Pacote Premium A',        'default' => 1650.00 ),
                'pacote_premium_b'    => array( 'label' => 'Pacote Premium B',        'default' => 475.00 ),
                'cinco_videos_longos' => array( 'label' => 'Cinco Vídeos Longos',     'default' => 1599.00 ),
                'cinco_videos_curtos' => array( 'label' => 'Cinco Vídeos Curtos',     'default' => 399.00 ),
                'cinco_thumbnails'    => array( 'label' => 'Cinco Thumbnails',        'default' => 89.00 ),
                'dez_thumbnails'      => array( 'label' => 'Dez Thumbnails',          'default' => 169.00 ),
            ),
        ),
        
        'motion_servicos' => array(
            'label' => 'Motion Graphics',
            'items' => array(
                'intro_animada'  => array( 'label' => 'Intro Animada',      'default' => 200.00 ),
                'artmotion'      => array( 'label' => 'Arte Animada',       'default' => 250.00 ),
                'logomotion'     => array( 'label' => 'Logo Animado',       'default' => 100.00 ),
                'motionmoldura'  => array( 'label' => 'Moldura Animada',    'default' => 140.00 ),
                'waitscreen'     => array( 'label' => 'Tela de Espera',     'default' => 175.00 ),
                'motionbanner'   => array( 'label' => 'Banner Animado',     'default' => 300.00 ),
            ),
        ),
        
        'ilustracao_servicos' => array(
            'label' => 'Ilustração Digital',
            'items' => array(
                'fanart_anime'              => array( 'label' => 'Arte Estilo Anime',         'default' => 120.00 ),
                'fanart_cartoon'            => array( 'label' => 'Arte Estilo Cartoon',       'default' => 180.00 ),
                'fanart_chibi'              => array( 'label' => 'Arte Estilo Chibi',         'default' => 50.00 ),
                'fanart_pixelart'           => array( 'label' => 'Arte Estilo Pixel Art',     'default' => 80.00 ),
                'fanart_vetorial'           => array( 'label' => 'Arte Estilo Vetorial',      'default' => 100.00 ),
                'personagem_rpg'            => array( 'label' => 'Personagem Token RPG',      'default' => 250.00 ),
                'ilustracao_perfil'         => array( 'label' => 'Ilustração Perfil/Busto',   'default' => 150.00 ),
                'ilustracao_corpo_inteiro'  => array( 'label' => 'Ilustração Corpo Inteiro',  'default' => 250.00 ),
                'storyboard'               => array( 'label' => 'Storyboard',                'default' => 300.00 ),
                'cenario_digital'           => array( 'label' => 'Cenário Digital',           'default' => 375.00 ),
                'esboco_rapido'             => array( 'label' => 'Esboço Rápido',             'default' => 25.00 ),
            ),
        ),
    );
}

function odyssee_get_unit_price_definitions() {
    return array(
        'design_post'      => array( 'label' => 'Post (unitário)',        'default' => 20.00 ),
        'design_storie'    => array( 'label' => 'Storie (unitário)',      'default' => 22.00 ),
        'design_carrossel' => array( 'label' => 'Carrossel (unitário)',   'default' => 60.00 ),
        'video_longo'      => array( 'label' => 'Vídeo Longo (unitário)', 'default' => 380.00 ),
        'video_curto'      => array( 'label' => 'Vídeo Curto (unitário)', 'default' => 120.00 ),
        'thumbnail'        => array( 'label' => 'Thumbnail (unitário)',   'default' => 30.00 ),
    );
}

function odyssee_precos_admin_menu() {
    add_menu_page(
        'Preços e Descontos',
        'Preços e Descontos',
        'manage_options',
        'odyssee-precos',
        'odyssee_precos_admin_page',
        'dashicons-tag',
        28
    );
}
add_action( 'admin_menu', 'odyssee_precos_admin_menu' );

function odyssee_precos_settings_init() {
    
    register_setting( 'odyssee_precos_group', 'odyssee_precos', array(
        'type'              => 'array',
        'sanitize_callback' => 'odyssee_sanitize_precos',
        'default'           => array(),
    ) );

    register_setting( 'odyssee_precos_group', 'odyssee_precos_unitarios', array(
        'type'              => 'array',
        'sanitize_callback' => 'odyssee_sanitize_precos',
        'default'           => array(),
    ) );

    register_setting( 'odyssee_precos_group', 'odyssee_servicos_overrides', array(
        'type'              => 'array',
        'sanitize_callback' => 'odyssee_sanitize_overrides',
        'default'           => array(),
    ) );
}
add_action( 'admin_init', 'odyssee_precos_settings_init' );

function odyssee_sanitize_overrides( $input ) {
    if ( ! is_array( $input ) ) {
        return array();
    }
    $clean = array();
    foreach ( $input as $id => $fields ) {
        $id = sanitize_key( $id );
        if ( ! is_array( $fields ) ) {
            continue;
        }
        $sanitized = array();
        if ( isset( $fields['nome'] ) && trim( $fields['nome'] ) !== '' ) {
            $sanitized['nome'] = sanitize_text_field( $fields['nome'] );
        }
        if ( isset( $fields['descricao'] ) && trim( $fields['descricao'] ) !== '' ) {
            $sanitized['descricao'] = sanitize_textarea_field( $fields['descricao'] );
        }
        if ( isset( $fields['thumbnail'] ) && trim( $fields['thumbnail'] ) !== '' ) {
            $sanitized['thumbnail'] = esc_url_raw( $fields['thumbnail'] );
        }
        if ( isset( $fields['informativo'] ) && trim( $fields['informativo'] ) !== '' ) {
            $sanitized['informativo'] = sanitize_textarea_field( $fields['informativo'] );
        }
        if ( isset( $fields['ordem'] ) && trim( $fields['ordem'] ) !== '' ) {
            $sanitized['ordem'] = intval( $fields['ordem'] );
        }
        if ( isset( $fields['oculto'] ) ) {
            $sanitized['oculto'] = ( $fields['oculto'] == '1' || $fields['oculto'] === 1 ) ? 1 : 0;
        }
        if ( ! empty( $sanitized ) ) {
            $clean[ $id ] = $sanitized;
        }
    }
    return $clean;
}

function odyssee_sanitize_precos( $input ) {
    if ( ! is_array( $input ) ) {
        return array();
    }
    $clean = array();
    foreach ( $input as $key => $val ) {
        $key = sanitize_key( $key );
        
        if ( $val === '' || $val === null ) {
            continue;
        }
        $val = floatval( $val );
        if ( $val > 0 ) {
            $clean[ $key ] = $val;
        }
    }
    return $clean;
}

function odyssee_precos_admin_page() {
    if ( ! current_user_can( 'manage_options' ) ) {
        return;
    }

    if ( isset( $_GET['settings-updated'] ) ) {
        add_settings_error( 'odyssee_precos_messages', 'odyssee_precos_updated', 'Preços atualizados com sucesso!', 'updated' );
    }
    settings_errors( 'odyssee_precos_messages' );

    $definitions  = odyssee_get_price_definitions();
    $unit_defs    = odyssee_get_unit_price_definitions();
    $saved_prices = get_option( 'odyssee_precos', array() );
    $saved_units  = get_option( 'odyssee_precos_unitarios', array() );

    ?>
    <div class="wrap">
        <h1><span class="dashicons dashicons-money-alt" style="font-size: 1.3em; margin-right: 8px;"></span>Preços e Descontos — Odyssee</h1>
        <p>Edite os preços dos serviços e pacotes. Os valores são enviados automaticamente para o site. Deixe vazio para usar o preço padrão.</p>

        <form method="post" action="options.php">
            <?php settings_fields( 'odyssee_precos_group' ); ?>

            <?php foreach ( $definitions as $section_key => $section ) : ?>
                <h2 style="margin-top: 2rem; padding-bottom: 8px; border-bottom: 2px solid #2271b1;">
                    <?php echo esc_html( $section['label'] ); ?>
                </h2>
                <table class="form-table" role="presentation">
                    <?php foreach ( $section['items'] as $item_key => $item ) :
                        $current = isset( $saved_prices[ $item_key ] ) ? $saved_prices[ $item_key ] : '';
                    ?>
                    <tr>
                        <th scope="row">
                            <label for="odyssee_preco_<?php echo esc_attr( $item_key ); ?>">
                                <?php echo esc_html( $item['label'] ); ?>
                            </label>
                        </th>
                        <td>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-weight: 600;">R$</span>
                                <input type="number"
                                       name="odyssee_precos[<?php echo esc_attr( $item_key ); ?>]"
                                       id="odyssee_preco_<?php echo esc_attr( $item_key ); ?>"
                                       value="<?php echo esc_attr( $current ); ?>"
                                       step="0.01"
                                       min="0"
                                       style="width: 140px;"
                                       placeholder="<?php echo esc_attr( number_format( $item['default'], 2, ',', '' ) ); ?>">
                                <span class="description">Padrão: R$ <?php echo esc_html( number_format( $item['default'], 2, ',', '.' ) ); ?></span>
                            </div>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </table>
            <?php endforeach; ?>

            <h2 style="margin-top: 2rem; padding-bottom: 8px; border-bottom: 2px solid #d63638;">
                Preços Unitários (Cálculo de Desconto)
            </h2>
            <p class="description">Esses valores são usados para calcular a economia exibida nos pacotes (ex: "Você economiza R$ X").</p>
            <table class="form-table" role="presentation">
                <?php foreach ( $unit_defs as $unit_key => $unit ) :
                    $current_unit = isset( $saved_units[ $unit_key ] ) ? $saved_units[ $unit_key ] : '';
                ?>
                <tr>
                    <th scope="row">
                        <label for="odyssee_unit_<?php echo esc_attr( $unit_key ); ?>">
                            <?php echo esc_html( $unit['label'] ); ?>
                        </label>
                    </th>
                    <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-weight: 600;">R$</span>
                            <input type="number"
                                   name="odyssee_precos_unitarios[<?php echo esc_attr( $unit_key ); ?>]"
                                   id="odyssee_unit_<?php echo esc_attr( $unit_key ); ?>"
                                   value="<?php echo esc_attr( $current_unit ); ?>"
                                   step="0.01"
                                   min="0"
                                   style="width: 140px;"
                                   placeholder="<?php echo esc_attr( number_format( $unit['default'], 2, ',', '' ) ); ?>">
                            <span class="description">Padrão: R$ <?php echo esc_html( number_format( $unit['default'], 2, ',', '.' ) ); ?></span>
                        </div>
                    </td>
                </tr>
                <?php endforeach; ?>
            </table>

            <?php submit_button( 'Salvar Preços' ); ?>
        </form>
    </div>

    <style>
    .odyssee-calculator-box {
        margin-top: 8px;
        padding: 10px 14px;
        background: #f0f6fc;
        border: 1px solid #c8d8e7;
        border-left: 4px solid #2271b1;
        border-radius: 6px;
        font-size: 13px;
        max-width: 600px;
    }
    .odyssee-calc-row {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 6px;
    }
    .odyssee-calc-brute {
        font-weight: 600;
        color: #1d2327;
    }
    .odyssee-calc-discount {
        font-weight: 600;
        padding: 3px 10px;
        border-radius: 12px;
        font-size: 12px;
        display: inline-block;
    }
    .odyssee-calc-discount.has-discount {
        background: #d1e7dd;
        color: #0f5132;
        border: 1px solid #badbcc;
    }
    .odyssee-calc-discount.no-discount {
        background: #fff3cd;
        color: #664d03;
        border: 1px solid #ffecb5;
    }
    .odyssee-calc-actions {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px;
    }
    .odyssee-calc-actions .btn-suggest {
        padding: 2px 8px !important;
        font-size: 11px !important;
        height: auto !important;
        min-height: 24px !important;
        line-height: 20px !important;
    }
    </style>

    <script>
    (function() {
        const packageCompositions = {
            'designmegapackage': { post: 10, storie: 10, carrossel: 10 },
            'designpremiumpackage': { post: 5, storie: 5, carrossel: 5 },
            'postpackage': { post: 5 },
            'storiepackage': { storie: 5 },
            'carrosselpackage': { carrossel: 5 },
            'mega_pacote': { longo: 5, curto: 10, thumbnail: 15 },
            'pacote_premium_a': { longo: 5, thumbnail: 5 },
            'pacote_premium_b': { curto: 5, thumbnail: 5 },
            'cinco_videos_longos': { longo: 5 },
            'cinco_videos_curtos': { curto: 5 },
            'cinco_thumbnails': { thumbnail: 5 },
            'dez_thumbnails': { thumbnail: 10 }
        };

        const defaultUnitPrices = {
            post: 20.00,
            storie: 22.00,
            carrossel: 100.00,
            longo: 380.00,
            curto: 120.00,
            thumbnail: 30.00
        };

        const unitFieldIds = {
            post: ['odyssee_preco_design_post', 'odyssee_unit_design_post'],
            storie: ['odyssee_preco_design_storie', 'odyssee_unit_design_storie'],
            carrossel: ['odyssee_preco_design_carrossel', 'odyssee_unit_design_carrossel'],
            longo: ['odyssee_preco_video_longo', 'odyssee_unit_video_longo'],
            curto: ['odyssee_preco_video_curto', 'odyssee_unit_video_curto'],
            thumbnail: ['odyssee_preco_thumbnail', 'odyssee_unit_thumbnail']
        };

        function getUnitPriceValue(key) {
            const ids = unitFieldIds[key] || [];

            for (let i = 0; i < ids.length; i++) {
                const field = document.getElementById(ids[i]);
                if (field && field.value !== '' && field.value !== null) {
                    const val = parseFloat(field.value);
                    if (!isNaN(val) && val > 0) return val;
                }
            }

            for (let i = 0; i < ids.length; i++) {
                const field = document.getElementById(ids[i]);
                if (field && field.placeholder !== '' && field.placeholder !== null) {
                    const raw = field.placeholder.replace(/\./g, '').replace(',', '.');
                    const val = parseFloat(raw);
                    if (!isNaN(val) && val > 0) return val;
                }
            }

            return defaultUnitPrices[key] || 0;
        }

        function calculatePackageBrute(pkgId) {
            const comp = packageCompositions[pkgId];
            if (!comp) return 0;
            let total = 0;
            for (const item in comp) {
                total += comp[item] * getUnitPriceValue(item);
            }
            return total;
        }

        function updateCalculations() {
            for (const pkgId in packageCompositions) {
                const input = document.getElementById('odyssee_preco_' + pkgId);
                if (!input) continue;

                let box = input.closest('td').querySelector('.odyssee-calculator-box');
                if (!box) {
                    box = document.createElement('div');
                    box.className = 'odyssee-calculator-box';
                    input.closest('td').appendChild(box);
                }

                const brute = calculatePackageBrute(pkgId);
                const currentPrice = parseFloat(input.value) || 0;
                const discount = brute - currentPrice;
                const discountPercent = brute > 0 && currentPrice > 0 ? ((discount / brute) * 100).toFixed(1) : 0;

                let discountBadgeHTML = '';
                if (currentPrice > 0 && discount > 0) {
                    discountBadgeHTML = `<span class="odyssee-calc-discount has-discount">🔥 Economia no site: R$ ${discount.toFixed(2).replace('.', ',')} (${discountPercent}% OFF)</span>`;
                } else if (currentPrice > 0) {
                    discountBadgeHTML = `<span class="odyssee-calc-discount no-discount">Sem desconto (Preço igual ou maior que o bruto)</span>`;
                } else {
                    discountBadgeHTML = `<span class="odyssee-calc-discount no-discount">Insira um preço para ver o desconto</span>`;
                }

                box.innerHTML = `
                    <div class="odyssee-calc-row">
                        <span class="odyssee-calc-brute">Soma Bruta dos Itens: R$ ${brute.toFixed(2).replace('.', ',')}</span>
                        ${discountBadgeHTML}
                    </div>
                    <div class="odyssee-calc-actions">
                        <span style="font-weight: 500;">Sugerir Preço com Desconto:</span>
                        <button type="button" class="button button-small btn-suggest" data-pkg="${pkgId}" data-pct="0.10">-10% (R$ ${(brute * 0.90).toFixed(2).replace('.', ',')})</button>
                        <button type="button" class="button button-small btn-suggest" data-pkg="${pkgId}" data-pct="0.15">-15% (R$ ${(brute * 0.85).toFixed(2).replace('.', ',')})</button>
                        <button type="button" class="button button-small btn-suggest" data-pkg="${pkgId}" data-pct="0.20">-20% (R$ ${(brute * 0.80).toFixed(2).replace('.', ',')})</button>
                        <button type="button" class="button button-small btn-suggest" data-pkg="${pkgId}" data-pct="0.00">Bruto (0%)</button>
                    </div>
                `;
            }
        }

        document.addEventListener('DOMContentLoaded', function() {
            updateCalculations();

            document.querySelectorAll('input[id^="odyssee_unit_"], input[id^="odyssee_preco_"]').forEach(input => {
                input.addEventListener('input', updateCalculations);
                input.addEventListener('change', updateCalculations);
            });

            document.addEventListener('click', function(e) {
                const btn = e.target.closest('.btn-suggest');
                if (!btn) return;
                e.preventDefault();
                const pkgId = btn.getAttribute('data-pkg');
                const pct = parseFloat(btn.getAttribute('data-pct'));
                const brute = calculatePackageBrute(pkgId);
                const sug = brute * (1 - pct);
                const input = document.getElementById('odyssee_preco_' + pkgId);
                if (input) {
                    input.value = sug.toFixed(2);
                    updateCalculations();
                }
            });
        });
    })();
    </script>
    <?php
}

function odyssee_get_categorias_produto() {
    return array(
        'design-grafico'   => 'Design Gráfico',
        'edicao-de-video'  => 'Edição de Vídeo',
        'motion'           => 'Motion Graphics',
        'ilustracao'       => 'Ilustração Digital',
    );
}

function odyssee_produtos_admin_menu() {
    add_menu_page(
        'Gerenciar Produtos',
        'Gerenciar Produtos',
        'manage_options',
        'odyssee-produtos',
        'odyssee_produtos_admin_page',
        'dashicons-cart',
        29
    );
}
add_action( 'admin_menu', 'odyssee_produtos_admin_menu' );

function odyssee_produtos_settings_init() {
    register_setting( 'odyssee_produtos_group', 'odyssee_produtos_custom', array(
        'type'              => 'array',
        'sanitize_callback' => 'odyssee_sanitize_produtos',
        'default'           => array(),
    ) );
}
add_action( 'admin_init', 'odyssee_produtos_settings_init' );

function odyssee_sanitize_produtos( $input ) {
    if ( ! is_array( $input ) ) {
        return array();
    }
    $clean = array();
    foreach ( $input as $produto ) {
        if ( ! is_array( $produto ) ) {
            continue;
        }
        $nome = isset( $produto['nome'] ) ? sanitize_text_field( $produto['nome'] ) : '';
        if ( empty( $nome ) ) {
            continue; 
        }
        $tipo_val = isset( $produto['tipo'] ) ? sanitize_key( $produto['tipo'] ) : 'servico';
        if ( ! in_array( $tipo_val, array( 'servico', 'pacote' ), true ) ) {
            $tipo_val = 'servico';
        }
        $clean[] = array(
            'id'          => isset( $produto['id'] ) ? sanitize_key( $produto['id'] ) : sanitize_key( 'custom_' . wp_generate_password( 8, false ) ),
            'nome'        => $nome,
            'categoria'   => isset( $produto['categoria'] ) ? sanitize_key( $produto['categoria'] ) : 'design-grafico',
            'tipo'        => $tipo_val,
            'descricao'   => isset( $produto['descricao'] ) ? sanitize_textarea_field( $produto['descricao'] ) : '',
            'informativo' => isset( $produto['informativo'] ) ? sanitize_textarea_field( $produto['informativo'] ) : '',
            'itens'       => isset( $produto['itens'] ) ? sanitize_textarea_field( $produto['itens'] ) : '',
            'thumbnail'   => isset( $produto['thumbnail'] ) ? esc_url_raw( $produto['thumbnail'] ) : '',
            'preco'       => isset( $produto['preco'] ) ? floatval( $produto['preco'] ) : 0,
        );
    }
    return $clean;
}

function odyssee_produtos_handle_actions() {
    if ( ! current_user_can( 'manage_options' ) ) {
        return;
    }

    if ( isset( $_POST['odyssee_add_produto'] ) && check_admin_referer( 'odyssee_produto_action', 'odyssee_produto_nonce' ) ) {
        $produtos = get_option( 'odyssee_produtos_custom', array() );
        if ( ! is_array( $produtos ) ) {
            $produtos = array();
        }

        $nome = isset( $_POST['novo_nome'] ) ? sanitize_text_field( $_POST['novo_nome'] ) : '';
        if ( ! empty( $nome ) ) {
            $novo_id = 'custom_' . sanitize_key( str_replace( ' ', '_', strtolower( $nome ) ) ) . '_' . substr( md5( time() ), 0, 4 );
            $novo_tipo = isset( $_POST['novo_tipo'] ) ? sanitize_key( $_POST['novo_tipo'] ) : 'servico';
            if ( ! in_array( $novo_tipo, array( 'servico', 'pacote' ), true ) ) {
                $novo_tipo = 'servico';
            }
            $produtos[] = array(
                'id'          => $novo_id,
                'nome'        => $nome,
                'categoria'   => isset( $_POST['novo_categoria'] ) ? sanitize_key( $_POST['novo_categoria'] ) : 'design-grafico',
                'tipo'        => $novo_tipo,
                'descricao'   => isset( $_POST['novo_descricao'] ) ? sanitize_textarea_field( $_POST['novo_descricao'] ) : '',
                'informativo' => isset( $_POST['novo_informativo'] ) ? sanitize_textarea_field( $_POST['novo_informativo'] ) : '',
                'itens'       => isset( $_POST['novo_itens'] ) ? sanitize_textarea_field( $_POST['novo_itens'] ) : '',
                'thumbnail'   => isset( $_POST['novo_thumbnail'] ) ? esc_url_raw( $_POST['novo_thumbnail'] ) : '',
                'preco'       => isset( $_POST['novo_preco'] ) ? floatval( $_POST['novo_preco'] ) : 0,
            );
            update_option( 'odyssee_produtos_custom', $produtos );
            add_settings_error( 'odyssee_produtos_messages', 'added', 'Produto adicionado com sucesso!', 'updated' );
        }
    }

    if ( isset( $_POST['odyssee_remove_produto'] ) && check_admin_referer( 'odyssee_produto_action', 'odyssee_produto_nonce' ) ) {
        $remove_id = isset( $_POST['remove_id'] ) ? sanitize_key( $_POST['remove_id'] ) : '';
        if ( ! empty( $remove_id ) ) {
            $produtos = get_option( 'odyssee_produtos_custom', array() );
            if ( ! is_array( $produtos ) ) {
                $produtos = array();
            }
            $produtos = array_filter( $produtos, function( $p ) use ( $remove_id ) {
                return isset( $p['id'] ) && $p['id'] !== $remove_id;
            } );
            $produtos = array_values( $produtos ); 
            update_option( 'odyssee_produtos_custom', $produtos );
            add_settings_error( 'odyssee_produtos_messages', 'removed', 'Produto removido com sucesso!', 'updated' );
        }
    }

    if ( isset( $_POST['odyssee_save_produtos'] ) && check_admin_referer( 'odyssee_produto_action', 'odyssee_produto_nonce' ) ) {
        $dados = isset( $_POST['produtos'] ) ? $_POST['produtos'] : array();
        if ( is_array( $dados ) ) {
            $produtos = array();
            foreach ( $dados as $p ) {
                if ( ! is_array( $p ) ) continue;
                $nome = isset( $p['nome'] ) ? sanitize_text_field( $p['nome'] ) : '';
                if ( empty( $nome ) ) continue;
                $edit_tipo = isset( $p['tipo'] ) ? sanitize_key( $p['tipo'] ) : 'servico';
                if ( ! in_array( $edit_tipo, array( 'servico', 'pacote' ), true ) ) {
                    $edit_tipo = 'servico';
                }
                $produtos[] = array(
                    'id'          => isset( $p['id'] ) ? sanitize_key( $p['id'] ) : '',
                    'nome'        => $nome,
                    'categoria'   => isset( $p['categoria'] ) ? sanitize_key( $p['categoria'] ) : 'design-grafico',
                    'tipo'        => $edit_tipo,
                    'descricao'   => isset( $p['descricao'] ) ? sanitize_textarea_field( $p['descricao'] ) : '',
                    'informativo' => isset( $p['informativo'] ) ? sanitize_textarea_field( $p['informativo'] ) : '',
                    'itens'       => isset( $p['itens'] ) ? sanitize_textarea_field( $p['itens'] ) : '',
                    'thumbnail'   => isset( $p['thumbnail'] ) ? esc_url_raw( $p['thumbnail'] ) : '',
                    'preco'       => isset( $p['preco'] ) ? floatval( $p['preco'] ) : 0,
                );
            }
            update_option( 'odyssee_produtos_custom', $produtos );
            add_settings_error( 'odyssee_produtos_messages', 'saved', 'Produtos atualizados com sucesso!', 'updated' );
        }
    }
}
add_action( 'admin_init', 'odyssee_produtos_handle_actions' );

function odyssee_produtos_admin_page() {
    if ( ! current_user_can( 'manage_options' ) ) {
        return;
    }

    settings_errors( 'odyssee_produtos_messages' );

    $produtos   = get_option( 'odyssee_produtos_custom', array() );
    if ( ! is_array( $produtos ) ) {
        $produtos = array();
    }
    $categorias = odyssee_get_categorias_produto();

    $servicos_existentes = array(
        'design-grafico' => array(
            array( 'id' => 'design_post',          'nome' => 'Post',                           'descricao' => 'Arte individual para post em redes sociais (Instagram, Facebook, LinkedIn).', 'thumbnail' => '/wp-content/uploads/2026/01/art-card-services.webp', 'tipo' => 'servico' ),
            array( 'id' => 'design_storie',        'nome' => 'Storie',                         'descricao' => 'Arte individual para stories em redes sociais (Instagram, WhatsApp).', 'thumbnail' => '/wp-content/uploads/2026/01/art-card-services-1.webp', 'tipo' => 'servico' ),
            array( 'id' => 'design_carrossel',     'nome' => 'Carrossel',                      'descricao' => 'Arte para carrossel contínuo ou informativo para redes sociais.', 'thumbnail' => '/wp-content/uploads/2026/01/art-card-services-2.webp', 'tipo' => 'servico' ),
            array( 'id' => 'logotipologo',         'nome' => 'Logotipo e Logo',               'descricao' => 'Uma logo única, criativa e estrategicamente feita para captar seu público alvo.', 'thumbnail' => '/wp-content/uploads/2025/09/Artboard-3-1-e1757565255458.webp', 'tipo' => 'servico' ),
            array( 'id' => 'bannersocial',         'nome' => 'Banner para redes sociais',      'descricao' => 'Banner para YouTube, Facebook, site, etc.', 'thumbnail' => '/wp-content/uploads/2025/07/Screenshot-2025-06-30-184152.webp', 'tipo' => 'servico' ),
            array( 'id' => 'cartao_visitas',       'nome' => 'Cartão de Visitas',              'descricao' => 'Design profissional para seu cartão de visitas.', 'thumbnail' => '/wp-content/uploads/2025/12/art-card-services.webp', 'tipo' => 'servico' ),
            array( 'id' => 'flyer',                'nome' => 'Flyer',                           'descricao' => 'Arte criativa para seu flyer promocional.', 'thumbnail' => '/wp-content/uploads/2025/12/art-card-services-2.webp', 'tipo' => 'servico' ),
            array( 'id' => 'convites',             'nome' => 'Convites',                        'descricao' => 'Design elegante para seus convites.', 'thumbnail' => '/wp-content/uploads/2025/12/art-card-services-5.webp', 'tipo' => 'servico' ),
            array( 'id' => 'banner',               'nome' => 'Banner (impresso)',               'descricao' => 'Arte para banners de qualquer tamanho.', 'thumbnail' => '/wp-content/uploads/2025/12/art-card-services-4.webp', 'tipo' => 'servico' ),
            array( 'id' => 'botton',               'nome' => 'Arte para Botton',                'descricao' => 'Arte simples para botton personalizado.', 'thumbnail' => '/wp-content/uploads/2025/12/art-card-services-1.webp', 'tipo' => 'servico' ),
            array( 'id' => 'adesivos',             'nome' => 'Arte para Adesivos',              'descricao' => 'Design para adesivos personalizados.', 'thumbnail' => '/wp-content/uploads/2025/12/art-card-services-3.webp', 'tipo' => 'servico' ),
            array( 'id' => 'visualid',             'nome' => 'Identidade Visual',               'descricao' => 'Manual de identidade completa, mockups, brindes e mais!', 'thumbnail' => '/wp-content/uploads/2025/05/Untitled-1-11.webp', 'tipo' => 'servico' ),
            array( 'id' => 'designmegapackage',    'nome' => 'Mega Pacote Design',        'descricao' => '10 posts + 10 stories + 10 carrosséis', 'thumbnail' => '', 'tipo' => 'pacote' ),
            array( 'id' => 'designpremiumpackage', 'nome' => 'Pacote Premium Design',     'descricao' => '5 posts + 5 stories + 5 carrosséis', 'thumbnail' => '', 'tipo' => 'pacote' ),
            array( 'id' => 'postpackage',          'nome' => 'Pacote Posts',               'descricao' => '5 posts', 'thumbnail' => '', 'tipo' => 'pacote' ),
            array( 'id' => 'storiepackage',        'nome' => 'Pacote Stories',             'descricao' => '5 stories', 'thumbnail' => '', 'tipo' => 'pacote' ),
            array( 'id' => 'carrosselpackage',     'nome' => 'Pacote Carrosséis',          'descricao' => '5 carrosséis', 'thumbnail' => '', 'tipo' => 'pacote' ),
        ),
        'edicao-de-video' => array(
            array( 'id' => 'video_longo',          'nome' => 'Vídeo Longo',               'descricao' => 'Um vídeo longo, perfeito para YouTube.', 'thumbnail' => '/wp-content/uploads/2026/01/art-card-services.webp', 'tipo' => 'servico' ),
            array( 'id' => 'video_curto',          'nome' => 'Vídeo Curto',               'descricao' => 'Um vídeo curto, ideal para redes sociais.', 'thumbnail' => '/wp-content/uploads/2026/01/art-card-services-1.webp', 'tipo' => 'servico' ),
            array( 'id' => 'thumbnail',            'nome' => 'Thumbnail',                  'descricao' => 'Thumbnail personalizada para seu vídeo.', 'thumbnail' => '/wp-content/uploads/2026/01/art-card-services-2.webp', 'tipo' => 'servico' ),
            array( 'id' => 'mega_pacote',          'nome' => 'Mega Pacote Vídeo',          'descricao' => '5 longos + 10 curtos + 15 thumbnails', 'thumbnail' => '', 'tipo' => 'pacote' ),
            array( 'id' => 'pacote_premium_a',     'nome' => 'Pacote Premium A',           'descricao' => '5 vídeos longos + 5 thumbnails', 'thumbnail' => '', 'tipo' => 'pacote' ),
            array( 'id' => 'pacote_premium_b',     'nome' => 'Pacote Premium B',           'descricao' => '5 vídeos curtos + 5 thumbnails', 'thumbnail' => '', 'tipo' => 'pacote' ),
            array( 'id' => 'cinco_videos_longos',  'nome' => 'Cinco Vídeos Longos',        'descricao' => '5 vídeos longos', 'thumbnail' => '', 'tipo' => 'pacote' ),
            array( 'id' => 'cinco_videos_curtos',  'nome' => 'Cinco Vídeos Curtos',        'descricao' => '5 vídeos curtos', 'thumbnail' => '', 'tipo' => 'pacote' ),
            array( 'id' => 'cinco_thumbnails',     'nome' => 'Cinco Thumbnails',            'descricao' => '5 thumbnails', 'thumbnail' => '', 'tipo' => 'pacote' ),
            array( 'id' => 'dez_thumbnails',       'nome' => 'Dez Thumbnails',              'descricao' => '10 thumbnails', 'thumbnail' => '', 'tipo' => 'pacote' ),
        ),
        'motion' => array(
            array( 'id' => 'intro_animada',  'nome' => 'Intro Animada',      'descricao' => 'Uma intro simples e criativa com elementos 2D', 'thumbnail' => '/wp-content/uploads/2026/01/FalaAiWillcomsom-ezgif.com-optimize.gif', 'tipo' => 'servico' ),
            array( 'id' => 'artmotion',      'nome' => 'Arte Animada',       'descricao' => 'Sua arte animada com elementos 2D', 'thumbnail' => '/wp-content/uploads/2025/06/harley-animated-.gif', 'tipo' => 'servico' ),
            array( 'id' => 'logomotion',     'nome' => 'Logo Animado',       'descricao' => 'Logo animado para vídeos e apresentações', 'thumbnail' => '/wp-content/uploads/2025/12/art-card-services-motion.webp', 'tipo' => 'servico' ),
            array( 'id' => 'motionmoldura',  'nome' => 'Moldura Animada',    'descricao' => 'Moldura animada para transmissões ao vivo', 'thumbnail' => '/wp-content/uploads/2025/12/art-card-services-motion.webp', 'tipo' => 'servico' ),
            array( 'id' => 'waitscreen',     'nome' => 'Tela de Espera',     'descricao' => 'Animação em looping para telas de espera', 'thumbnail' => '/wp-content/uploads/2025/12/art-card-services-motion.webp', 'tipo' => 'servico' ),
            array( 'id' => 'motionbanner',   'nome' => 'Banner Animado',     'descricao' => 'O banner da sua marca animado', 'thumbnail' => '/wp-content/uploads/2025/12/art-card-services-motion.webp', 'tipo' => 'servico' ),
        ),
        'ilustracao' => array(
            array( 'id' => 'fanart_anime',             'nome' => 'Arte Estilo Anime',         'descricao' => 'Arte digital no estilo anime', 'thumbnail' => '/wp-content/uploads/2026/01/art-card-services_14.webp', 'tipo' => 'servico' ),
            array( 'id' => 'fanart_cartoon',           'nome' => 'Arte Estilo Cartoon',       'descricao' => 'Arte digital no estilo cartoon', 'thumbnail' => '/wp-content/uploads/2026/01/art-card-services_13.webp', 'tipo' => 'servico' ),
            array( 'id' => 'fanart_chibi',             'nome' => 'Arte Estilo Chibi',         'descricao' => 'Arte digital no estilo chibi', 'thumbnail' => '/wp-content/uploads/2026/01/art-card-services_15.webp', 'tipo' => 'servico' ),
            array( 'id' => 'fanart_pixelart',          'nome' => 'Arte Estilo Pixel Art',     'descricao' => 'Arte digital no estilo pixel art', 'thumbnail' => '/wp-content/uploads/2026/01/art-card-services_12.webp', 'tipo' => 'servico' ),
            array( 'id' => 'fanart_vetorial',          'nome' => 'Arte Estilo Vetorial',      'descricao' => 'Arte digital no estilo vetorial', 'thumbnail' => '/wp-content/uploads/2025/05/Jinx-Powder-Vector-lightroom-scaled-e1747298364610.webp', 'tipo' => 'servico' ),
            array( 'id' => 'personagem_rpg',           'nome' => 'Personagem Token RPG',      'descricao' => 'Arte para RPG no estilo token', 'thumbnail' => '/wp-content/uploads/2025/12/art-card-services-motion.webp', 'tipo' => 'servico' ),
            array( 'id' => 'ilustracao_perfil',        'nome' => 'Ilustração Perfil/Busto',   'descricao' => 'Arte de perfil nos diversos estilos', 'thumbnail' => '/wp-content/uploads/2026/01/art-card-services_11.webp', 'tipo' => 'servico' ),
            array( 'id' => 'ilustracao_corpo_inteiro', 'nome' => 'Ilustração Corpo Inteiro',  'descricao' => 'Arte de corpo inteiro nos diversos estilos', 'thumbnail' => '/wp-content/uploads/2026/01/art-card-services_8.webp', 'tipo' => 'servico' ),
            array( 'id' => 'esboco_rapido',            'nome' => 'Esboço Rápido',             'descricao' => 'Um esboço rápido e simples', 'thumbnail' => '/wp-content/uploads/2026/01/art-card-services_10.webp', 'tipo' => 'servico' ),
            array( 'id' => 'storyboard',               'nome' => 'Storyboard',                'descricao' => 'Storyboard cena a cena', 'thumbnail' => '/wp-content/uploads/2026/01/art-card-services_9.webp', 'tipo' => 'servico' ),
            array( 'id' => 'cenario_digital',          'nome' => 'Cenário Digital',           'descricao' => 'Cenário digital completo', 'thumbnail' => '', 'tipo' => 'servico' ),
        ),
    );

    $precos_salvos = get_option( 'odyssee_precos', array() );
    if ( ! is_array( $precos_salvos ) ) {
        $precos_salvos = array();
    }
    
    $overrides_salvos = get_option( 'odyssee_servicos_overrides', array() );
    if ( ! is_array( $overrides_salvos ) ) {
        $overrides_salvos = array();
    }
    $definitions = odyssee_get_price_definitions();
    
    $precos_default = array();
    foreach ( $definitions as $section ) {
        foreach ( $section['items'] as $key => $item ) {
            $precos_default[ $key ] = $item['default'];
        }
    }

    ?>
    <div class="wrap">
        <h1><span class="dashicons dashicons-store" style="font-size: 1.3em; margin-right: 8px;"></span>Gerenciar Produtos — Odyssee</h1>
        <p>Veja todos os serviços do site, edite nome, descrição, capa, ordem de exibição e alterne visibilidade (ocultar/excluir). Deixe um campo vazio para usar o valor padrão.</p>

        <div style="background: #fff; border: 1px solid #c3c4c7; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <h2 style="margin-top: 0;"><span class="dashicons dashicons-admin-links" style="color: #2271b1;"></span> Serviços Existentes no Site</h2>
            <p class="description">Edite qualquer campo dos serviços existentes, reordene clicando nos botões ▲ / ▼ e alterne a visibilidade para ocultar/excluir qualquer serviço da página do site.</p>

            <form method="post" action="options.php">
                <?php settings_fields( 'odyssee_precos_group' ); ?>

                <?php foreach ( $servicos_existentes as $cat_slug => $servicos ) :
                    $cat_label = isset( $categorias[ $cat_slug ] ) ? $categorias[ $cat_slug ] : $cat_slug;

                    usort( $servicos, function( $a, $b ) use ( $overrides_salvos ) {
                        $id_a = $a['id'];
                        $id_b = $b['id'];
                        $ord_a = isset( $overrides_salvos[ $id_a ]['ordem'] ) && $overrides_salvos[ $id_a ]['ordem'] !== '' ? intval( $overrides_salvos[ $id_a ]['ordem'] ) : 999;
                        $ord_b = isset( $overrides_salvos[ $id_b ]['ordem'] ) && $overrides_salvos[ $id_b ]['ordem'] !== '' ? intval( $overrides_salvos[ $id_b ]['ordem'] ) : 999;
                        return $ord_a - $ord_b;
                    });
                ?>
                <h3 style="margin-top: 24px; padding-bottom: 6px; border-bottom: 1px solid #ddd; color: #2271b1;">
                    <?php echo esc_html( $cat_label ); ?>
                </h3>
                <table class="widefat striped service-reorder-table" style="margin-bottom: 12px;">
                    <thead>
                        <tr>
                            <th style="width: 75px; text-align: center;">Ordem</th>
                            <th style="width: 55px; text-align: center;">Capa</th>
                            <th style="width: 140px;">Nome</th>
                            <th>Descrição</th>
                            <th>Informativo <span class="dashicons dashicons-info" title="Texto do tooltip ao clicar no ícone (i). Ex: Prazo, revisões, formato de entrega." style="font-size: 14px; color: #999;"></span></th>
                            <th style="width: 170px;">URL da Capa</th>
                            <th style="width: 95px;">Preço (R$)</th>
                            <th style="width: 75px;">Padrão</th>
                            <th style="width: 140px; text-align: center;">Ação / Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ( $servicos as $idx => $svc ) :
                            $svc_id       = $svc['id'];
                            $preco_atual  = isset( $precos_salvos[ $svc_id ] ) ? $precos_salvos[ $svc_id ] : '';
                            $preco_padrao = isset( $precos_default[ $svc_id ] ) ? $precos_default[ $svc_id ] : 0;
                            $override     = isset( $overrides_salvos[ $svc_id ] ) ? $overrides_salvos[ $svc_id ] : array();
                            $nome_over    = isset( $override['nome'] ) ? $override['nome'] : '';
                            $desc_over    = isset( $override['descricao'] ) ? $override['descricao'] : '';
                            $thumb_over   = isset( $override['thumbnail'] ) ? $override['thumbnail'] : '';
                            $info_over    = isset( $override['informativo'] ) ? $override['informativo'] : '';
                            $ordem_salva  = isset( $override['ordem'] ) && $override['ordem'] !== '' ? intval( $override['ordem'] ) : ($idx + 1);
                            $is_oculto    = ! empty( $override['oculto'] );
                            $thumb_show   = ! empty( $thumb_over ) ? $thumb_over : $svc['thumbnail'];
                        ?>
                        <tr class="service-row <?php echo $is_oculto ? 'row-oculto' : ''; ?>" style="<?php echo $is_oculto ? 'opacity: 0.45; background: #fff5f5;' : ''; ?>">
                            <td style="vertical-align: middle; text-align: center;">
                                <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                                    <button type="button" class="button button-small btn-move-up" title="Mover para cima" style="padding: 0 4px; line-height: 1.4; font-size: 10px;">▲</button>
                                    <input type="number"
                                           name="odyssee_servicos_overrides[<?php echo esc_attr( $svc_id ); ?>][ordem]"
                                           value="<?php echo esc_attr( $ordem_salva ); ?>"
                                           class="service-order-input"
                                           style="width: 40px; text-align: center; font-size: 11px; padding: 2px;">
                                    <button type="button" class="button button-small btn-move-down" title="Mover para baixo" style="padding: 0 4px; line-height: 1.4; font-size: 10px;">▼</button>
                                </div>
                            </td>
                            <td style="vertical-align: middle; text-align: center;">
                                <?php if ( ! empty( $thumb_show ) ) : ?>
                                    <img src="<?php echo esc_url( $thumb_show ); ?>" style="width: 45px; height: 32px; object-fit: cover; border-radius: 3px; border: 1px solid #ddd;" alt="">
                                <?php else : ?>
                                    <span class="dashicons dashicons-format-image" style="font-size: 26px; color: #ccc;"></span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <input type="text"
                                       name="odyssee_servicos_overrides[<?php echo esc_attr( $svc_id ); ?>][nome]"
                                       value="<?php echo esc_attr( $nome_over ); ?>"
                                       placeholder="<?php echo esc_attr( $svc['nome'] ); ?>"
                                       style="width: 100%; font-size: 12px;">
                            </td>
                            <td>
                                <textarea name="odyssee_servicos_overrides[<?php echo esc_attr( $svc_id ); ?>][descricao]"
                                          rows="2"
                                          placeholder="<?php echo esc_attr( $svc['descricao'] ); ?>"
                                          style="width: 100%; font-size: 12px;"><?php echo esc_textarea( $desc_over ); ?></textarea>
                            </td>
                            <td>
                                <textarea name="odyssee_servicos_overrides[<?php echo esc_attr( $svc_id ); ?>][informativo]"
                                          rows="2"
                                          placeholder="Ex: Prazo: 3-5 dias. 2 revisões inclusas."
                                          style="width: 100%; font-size: 11px;"><?php echo esc_textarea( $info_over ); ?></textarea>
                            </td>
                            <td>
                                <input type="url"
                                       name="odyssee_servicos_overrides[<?php echo esc_attr( $svc_id ); ?>][thumbnail]"
                                       value="<?php echo esc_attr( $thumb_over ); ?>"
                                       placeholder="<?php echo esc_attr( $svc['thumbnail'] ); ?>"
                                       style="width: 100%; font-size: 11px;">
                            </td>
                            <td>
                                <input type="number"
                                       name="odyssee_precos[<?php echo esc_attr( $svc_id ); ?>]"
                                       value="<?php echo esc_attr( $preco_atual ); ?>"
                                       step="0.01" min="0"
                                       style="width: 90px;"
                                       placeholder="<?php echo esc_attr( number_format( $preco_padrao, 2, '.', '' ) ); ?>">
                            </td>
                            <td style="color: #888; font-size: 11px; vertical-align: middle;">
                                R$ <?php echo esc_html( number_format( $preco_padrao, 2, ',', '.' ) ); ?>
                            </td>
                            <td style="vertical-align: middle; text-align: center;">
                                <input type="hidden"
                                       name="odyssee_servicos_overrides[<?php echo esc_attr( $svc_id ); ?>][oculto]"
                                       value="<?php echo $is_oculto ? '1' : '0'; ?>"
                                       class="oculto-hidden-input">
                                <button type="button"
                                        class="button button-small btn-toggle-oculto"
                                        style="<?php echo $is_oculto ? 'background: #dc3232; color: #fff; border-color: #b32d2d;' : 'background: #f6f7f7; color: #50575e;'; ?>">
                                    <?php echo $is_oculto ? '🔴 Ocultado (Restaurar)' : '🗑️ Ocultar / Excluir'; ?>
                                </button>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
                <?php endforeach; ?>

                <?php submit_button( 'Salvar Alterações dos Serviços' ); ?>
            </form>
        </div>

        <script>
        jQuery(document).ready(function($) {
            $(document).on('click', '.btn-move-up', function(e) {
                e.preventDefault();
                var row = $(this).closest('tr');
                var prevRow = row.prev('tr');
                if (prevRow.length) {
                    row.insertBefore(prevRow);
                    reindexOrderInputs(row.closest('tbody'));
                }
            });

            $(document).on('click', '.btn-move-down', function(e) {
                e.preventDefault();
                var row = $(this).closest('tr');
                var nextRow = row.next('tr');
                if (nextRow.length) {
                    row.insertAfter(nextRow);
                    reindexOrderInputs(row.closest('tbody'));
                }
            });

            $(document).on('click', '.btn-toggle-oculto', function(e) {
                e.preventDefault();
                var btn = $(this);
                var input = btn.siblings('.oculto-hidden-input');
                var row = btn.closest('tr');
                if (input.val() === '1') {
                    input.val('0');
                    btn.css({'background': '#f6f7f7', 'color': '#50575e', 'border-color': ''}).text('🗑️ Ocultar / Excluir');
                    row.css({'opacity': '1', 'background': ''});
                } else {
                    input.val('1');
                    btn.css({'background': '#dc3232', 'color': '#fff', 'border-color': '#b32d2d'}).text('🔴 Ocultado (Restaurar)');
                    row.css({'opacity': '0.45', 'background': '#fff5f5'});
                }
            });

            function reindexOrderInputs(tbody) {
                tbody.find('tr').each(function(idx) {
                    $(this).find('.service-order-input').val(idx + 1);
                });
            }
        });
        </script>
        </div>

        <hr style="margin: 30px 0;">

        <div style="background: #fff; border: 1px solid #c3c4c7; border-left: 4px solid #2271b1; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <h2 style="margin-top: 0;"><span class="dashicons dashicons-plus" style="color: #2271b1;"></span> Adicionar Novo Produto Personalizado</h2>
            <p class="description">Produtos adicionados aqui aparecem automaticamente na página de serviços, na categoria escolhida, com o botão de contratar pelo WhatsApp.</p>
            <form method="post">
                <?php wp_nonce_field( 'odyssee_produto_action', 'odyssee_produto_nonce' ); ?>
                <table class="form-table" role="presentation">
                    <tr>
                        <th><label for="novo_nome">Nome do Produto *</label></th>
                        <td><input type="text" name="novo_nome" id="novo_nome" class="regular-text" required placeholder="Ex: Logo Animada Premium"></td>
                    </tr>
                    <tr>
                        <th><label for="novo_categoria">Categoria</label></th>
                        <td>
                            <select name="novo_categoria" id="novo_categoria">
                                <?php foreach ( $categorias as $slug => $label ) : ?>
                                    <option value="<?php echo esc_attr( $slug ); ?>"><?php echo esc_html( $label ); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="novo_tipo">Tipo</label></th>
                        <td>
                            <select name="novo_tipo" id="novo_tipo" onchange="document.getElementById('novo_itens_row').style.display = this.value === 'pacote' ? '' : 'none';">
                                <option value="servico">Serviço Individual</option>
                                <option value="pacote">Pacote</option>
                            </select>
                            <p class="description">Serviço Individual aparece na seção "Serviços e Preços". Pacote aparece na seção "Pacotes Promocionais".</p>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="novo_descricao">Descrição</label></th>
                        <td><textarea name="novo_descricao" id="novo_descricao" rows="3" cols="60" class="large-text" placeholder="Breve descrição do serviço/produto"></textarea></td>
                    </tr>
                    <tr>
                        <th><label for="novo_informativo">Informativo</label></th>
                        <td>
                            <textarea name="novo_informativo" id="novo_informativo" rows="2" cols="60" class="large-text" placeholder="Ex: Tempo de entrega: 3-5 dias úteis. Inclui 2 revisões."></textarea>
                            <p class="description">Texto do tooltip ao clicar no ícone (i) do card. Prazo, revisões, formato de entrega, etc.</p>
                        </td>
                    </tr>
                    <tr id="novo_itens_row" style="display: none;">
                        <th><label for="novo_itens">Itens do Pacote</label></th>
                        <td>
                            <textarea name="novo_itens" id="novo_itens" rows="3" cols="60" class="large-text" placeholder="5 vídeos longos&#10;10 thumbnails&#10;3 revisões"></textarea>
                            <p class="description">Um item por linha. Cada linha aparece como item na lista do pacote.</p>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="novo_thumbnail">URL da Thumbnail</label></th>
                        <td>
                            <input type="url" name="novo_thumbnail" id="novo_thumbnail" class="large-text" placeholder="/wp-content/uploads/...">
                            <p class="description">Cole a URL da imagem. Use a Biblioteca de Mídia do WP para fazer upload e copiar a URL.</p>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="novo_preco">Preço (R$)</label></th>
                        <td><input type="number" name="novo_preco" id="novo_preco" step="0.01" min="0" style="width: 140px;" placeholder="0,00"></td>
                    </tr>
                </table>
                <?php submit_button( 'Adicionar Produto', 'primary', 'odyssee_add_produto' ); ?>
            </form>
        </div>

        <?php if ( ! empty( $produtos ) ) : ?>
        
        <div style="background: #fff; border: 1px solid #c3c4c7; border-left: 4px solid #00a32a; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <h2 style="margin-top: 0;"><span class="dashicons dashicons-list-view" style="color: #00a32a;"></span> Produtos Personalizados (<?php echo count( $produtos ); ?>)</h2>
            <form method="post">
                <?php wp_nonce_field( 'odyssee_produto_action', 'odyssee_produto_nonce' ); ?>
                <table class="widefat striped" style="margin-top: 12px;">
                    <thead>
                        <tr>
                            <th style="width: 50px;">Thumb</th>
                            <th>Nome</th>
                            <th>Categoria</th>
                            <th style="width: 130px;">Tipo</th>
                            <th>Descrição / Itens</th>
                            <th style="width: 100px;">Preço</th>
                            <th style="width: 80px;">Remover</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ( $produtos as $i => $prod ) :
                            $prod_tipo  = isset( $prod['tipo'] ) ? $prod['tipo'] : 'servico';
                            $prod_itens = isset( $prod['itens'] ) ? $prod['itens'] : '';
                        ?>
                        <tr>
                            <td>
                                <?php if ( ! empty( $prod['thumbnail'] ) ) : ?>
                                    <img src="<?php echo esc_url( $prod['thumbnail'] ); ?>" style="width: 48px; height: 48px; object-fit: cover; border-radius: 4px;">
                                <?php else : ?>
                                    <span class="dashicons dashicons-format-image" style="font-size: 32px; color: #ccc;"></span>
                                <?php endif; ?>
                                <input type="hidden" name="produtos[<?php echo $i; ?>][id]" value="<?php echo esc_attr( $prod['id'] ); ?>">
                                <input type="hidden" name="produtos[<?php echo $i; ?>][thumbnail]" value="<?php echo esc_attr( $prod['thumbnail'] ); ?>">
                            </td>
                            <td>
                                <input type="text" name="produtos[<?php echo $i; ?>][nome]" value="<?php echo esc_attr( $prod['nome'] ); ?>" class="regular-text" style="width: 100%;">
                            </td>
                            <td>
                                <select name="produtos[<?php echo $i; ?>][categoria]" style="width: 100%;">
                                    <?php foreach ( $categorias as $slug => $label ) : ?>
                                        <option value="<?php echo esc_attr( $slug ); ?>" <?php selected( $prod['categoria'], $slug ); ?>><?php echo esc_html( $label ); ?></option>
                                    <?php endforeach; ?>
                                </select>
                            </td>
                            <td>
                                <select name="produtos[<?php echo $i; ?>][tipo]" style="width: 100%;" onchange="document.getElementById('itens_row_<?php echo $i; ?>').style.display = this.value === 'pacote' ? '' : 'none';">
                                    <option value="servico" <?php selected( $prod_tipo, 'servico' ); ?>>Serviço</option>
                                    <option value="pacote" <?php selected( $prod_tipo, 'pacote' ); ?>>Pacote</option>
                                </select>
                            </td>
                            <td>
                                <textarea name="produtos[<?php echo $i; ?>][descricao]" rows="2" style="width: 100%;" placeholder="Descrição do serviço"><?php echo esc_textarea( $prod['descricao'] ); ?></textarea>
                                <div style="margin-top: 6px;">
                                    <label style="font-size: 11px; color: #666;">Informativo (tooltip do ícone <em>i</em>):</label>
                                    <textarea name="produtos[<?php echo $i; ?>][informativo]" rows="2" style="width: 100%; font-size: 11px;" placeholder="Ex: Prazo: 3-5 dias. 2 revisões."><?php echo esc_textarea( isset( $prod['informativo'] ) ? $prod['informativo'] : '' ); ?></textarea>
                                </div>
                                <div id="itens_row_<?php echo $i; ?>" style="<?php echo $prod_tipo === 'pacote' ? '' : 'display: none;'; ?> margin-top: 6px;">
                                    <label style="font-size: 11px; color: #666;">Itens do pacote (um por linha):</label>
                                    <textarea name="produtos[<?php echo $i; ?>][itens]" rows="2" style="width: 100%; font-size: 11px;" placeholder="5 vídeos longos&#10;10 thumbnails"><?php echo esc_textarea( $prod_itens ); ?></textarea>
                                </div>
                            </td>
                            <td>
                                <input type="number" name="produtos[<?php echo $i; ?>][preco]" value="<?php echo esc_attr( $prod['preco'] ); ?>" step="0.01" min="0" style="width: 90px;">
                            </td>
                            <td></td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
                <div style="margin-top: 16px; display: flex; gap: 12px; align-items: center;">
                    <?php submit_button( 'Salvar Alterações', 'primary', 'odyssee_save_produtos', false ); ?>
                </div>
            </form>

            <h3 style="margin-top: 24px;">Remover Produtos Personalizados</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                <?php foreach ( $produtos as $prod ) : ?>
                <form method="post" style="display: inline;" onsubmit="return confirm('Tem certeza que deseja remover &quot;<?php echo esc_js( $prod['nome'] ); ?>&quot;?');">
                    <?php wp_nonce_field( 'odyssee_produto_action', 'odyssee_produto_nonce' ); ?>
                    <input type="hidden" name="remove_id" value="<?php echo esc_attr( $prod['id'] ); ?>">
                    <button type="submit" name="odyssee_remove_produto" class="button button-link-delete" style="color: #b32d2e;">
                        <span class="dashicons dashicons-trash" style="font-size: 14px; vertical-align: text-bottom;"></span>
                        <?php echo esc_html( $prod['nome'] ); ?>
                    </button>
                </form>
                <?php endforeach; ?>
            </div>
        </div>
        <?php endif; ?>
    </div>
    <?php
}

function odyssee_get_initial_posts() {
    $cached = get_transient( 'odyssee_initial_posts' );
    if ( false !== $cached && is_array( $cached ) ) {
        return $cached;
    }

    $args = array(
        'post_type'              => 'post',
        'post_status'            => 'publish',
        'posts_per_page'         => 40,
        'orderby'                => 'date',
        'order'                  => 'DESC',
        'no_found_rows'          => true,
        'update_post_term_cache' => true,
        'update_post_meta_cache' => true,
    );
    $query = new WP_Query( $args );
    $posts = array();

    if ( $query->have_posts() ) {
        while ( $query->have_posts() ) {
            $query->the_post();
            $post_id = get_the_ID();

            $img_url = get_the_post_thumbnail_url( $post_id, 'large' );
            if ( ! $img_url ) {
                $content = get_the_content();
                if ( preg_match( '/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/', $content, $match ) ) {
                    $img_url = 'https://img.youtube.com/vi/' . $match[1] . '/maxresdefault.webp';
                }
            }
            if ( ! $img_url ) {
                $img_url = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect width="300" height="200" fill="%23ccc"/%3E%3Ctext x="50%25" y="50%25" font-size="16" fill="%23999" text-anchor="middle" dy=".3em"%3ESem Imagem%3C/text%3E%3C/svg%3E';
            }

            $terms = get_the_terms( $post_id, 'category' );
            $category_list = array('geral');
            $sub_category_list = array();

            if ( ! empty( $terms ) && ! is_wp_error( $terms ) ) {
                $parents = array();
                $children = array();
                foreach ( $terms as $term ) {
                    if ( $term->parent == 0 ) {
                        $parents[] = $term->slug;
                    } else {
                        $children[] = $term->slug;
                    }
                }
                if ( ! empty( $parents ) ) $category_list = $parents;
                if ( ! empty( $children ) ) $sub_category_list = $children;
            }

            $posts[] = array(
                'title'         => html_entity_decode( get_the_title(), ENT_QUOTES, 'UTF-8' ),
                'titleEN'       => html_entity_decode( (string) get_post_meta( $post_id, 'post_title_en', true ), ENT_QUOTES, 'UTF-8' ),
                'categories'    => $category_list,
                'category'      => $category_list[0],
                'subCategories' => $sub_category_list,
                'subCategory'   => isset($sub_category_list[0]) ? $sub_category_list[0] : '',
                'image'         => $img_url,
                'date'          => get_the_date( 'c' ),
                'link'          => get_permalink(),
                'content'       => html_entity_decode( get_the_content(), ENT_QUOTES, 'UTF-8' ),
            );
        }
        wp_reset_postdata();
    }

    set_transient( 'odyssee_initial_posts', $posts, 6 * HOUR_IN_SECONDS );
    return $posts;
}

add_action( 'save_post', function() {
    delete_transient( 'odyssee_initial_posts' );
    delete_transient( 'odyssee_orbit_items' );
} );
add_action( 'deleted_post', function() {
    delete_transient( 'odyssee_initial_posts' );
    delete_transient( 'odyssee_orbit_items' );
} );