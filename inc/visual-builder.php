<?php
/**
 * Odyssee Visual Studio — Elementor-Style Full Engine & Non-Destructive Theme Customizer
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'ODYSSEE_VB_OPTION_KEY', 'odyssee_visual_builder_data' );
define( 'ODYSSEE_VB_PRESETS_KEY', 'odyssee_visual_builder_presets' );
define( 'ODYSSEE_VB_REVISIONS_KEY', 'odyssee_visual_builder_revisions' );

/**
 * Retrieves saved Visual Builder data with safe defaults.
 * Falls back to presets/odysseexp.json inside the theme folder if the database option is empty,
 * making the theme 100% portable when exported or moved to another site.
 */
function odyssee_vb_get_data() {
    $data = get_option( ODYSSEE_VB_OPTION_KEY, array() );
    if ( empty( $data ) || ! is_array( $data ) ) {
        $preset_file = get_template_directory() . '/presets/odysseexp.json';
        if ( file_exists( $preset_file ) ) {
            $json_raw = file_get_contents( $preset_file );
            $decoded  = json_decode( $json_raw, true );
            if ( is_array( $decoded ) ) {
                $data = $decoded;
            }
        }
    }
    if ( ! is_array( $data ) ) {
        $data = array();
    }
    return wp_parse_args( $data, array(
        'presetName'              => 'OdysseeXP',
        'uiStyle'                 => 'odysseexp',
        'iconPack'                => 'default',
        'blankMode'               => false,
        'elements'                => array(),
        'blocks'                  => array(),
        'domMoves'                => array(),
        'clones'                  => array(),
        'layerGroups'             => array(),
        'globalVars'              => array(
            'all'   => array(),
            'dark'  => array(),
            'light' => array(),
        ),
        'customCss'               => '',
        'customJs'                => '',
        'elementPresets'          => array(),
        'groupPresets'            => array(),
        'componentPresets'        => array(),
        'pagePresets'             => array(),
        'sitePresets'             => array(),
        'colorPalettes'           => array(),
        'activeGlobalPalette'     => '',
        'pagePalettes'            => array(),
        'allowVisitorColorSwitch' => true,
        'shortcuts'               => array(),
        'uiStyleColors'           => array(),
    ) );
}

/**
 * Retrieves all saved named Theme Presets (always includes 'OdysseeXP' and 'Tema em Branco')
 */
function odyssee_vb_get_presets_list() {
    $saved = get_option( ODYSSEE_VB_PRESETS_KEY, array() );
    if ( ! is_array( $saved ) ) {
        $saved = array();
    }

    // Load any .json preset files from the theme's /presets/ directory
    $presets_dir = get_template_directory() . '/presets';
    if ( is_dir( $presets_dir ) ) {
        $files = glob( $presets_dir . '/*.json' );
        if ( is_array( $files ) ) {
            foreach ( $files as $file ) {
                $content = json_decode( file_get_contents( $file ), true );
                if ( is_array( $content ) ) {
                    $name = ! empty( $content['presetName'] ) ? $content['presetName'] : basename( $file, '.json' );
                    if ( ! isset( $saved[ $name ] ) ) {
                        $saved[ $name ] = $content;
                    }
                }
            }
        }
    }

    // Ensure OdysseeXP default preset is always present
    if ( ! isset( $saved['OdysseeXP'] ) ) {
        $saved['OdysseeXP'] = odyssee_vb_get_data();
        $saved['OdysseeXP']['presetName'] = 'OdysseeXP';
        $saved['OdysseeXP']['blankMode']  = false;
    }

    // Ensure "Tema em Branco" preset is always available for starting new sites from scratch
    if ( ! isset( $saved['Tema em Branco'] ) ) {
        $saved['Tema em Branco'] = array(
            'presetName' => 'Tema em Branco',
            'uiStyle'    => 'odysseexp',
            'iconPack'   => 'default',
            'blankMode'  => true,
            'elements'   => array(),
            'blocks'     => array(),
            'domMoves'   => array(),
            'clones'     => array(),
            'globalVars' => array( 'all' => array(), 'dark' => array(), 'light' => array() ),
            'customCss'  => '',
            'customJs'   => '',
        );
    }

    return $saved;
}

/**
 * Checks whether the current request is inside the Visual Studio preview iframe
 */
function odyssee_vb_is_preview() {
    return isset( $_GET['odyssee_vb_preview'] ) && $_GET['odyssee_vb_preview'] === '1';
}

/**
 * Registers Admin Menus:
 * 1) Top-level "Odyssee Studio" menu
 * 2) Submenu under "Aparência -> Odyssee Studio (Visual)"
 */
add_action( 'admin_menu', 'odyssee_vb_register_menus' );
function odyssee_vb_register_menus() {
    add_menu_page(
        'Odyssee Studio — Personalização Visual',
        'Odyssee Studio',
        'manage_options',
        'odyssee-visual-builder',
        'odyssee_vb_render_admin_page',
        'dashicons-layout',
        24
    );

    add_theme_page(
        'Odyssee Studio — Personalização Visual',
        '⚡ Odyssee Studio',
        'manage_options',
        'odyssee-visual-builder',
        'odyssee_vb_render_admin_page'
    );
}

/**
 * Adds a quick launch button to the WordPress Admin Bar on the frontend and backend
 */
add_action( 'admin_bar_menu', 'odyssee_vb_admin_bar_button', 99 );
function odyssee_vb_admin_bar_button( $wp_admin_bar ) {
    if ( ! current_user_can( 'manage_options' ) || odyssee_vb_is_preview() ) {
        return;
    }

    $target_url = is_admin() ? home_url( '/' ) : home_url( add_query_arg( null, null ) );
    $studio_url = add_query_arg(
        array(
            'page'        => 'odyssee-visual-builder',
            'preview_url' => rawurlencode( $target_url ),
        ),
        admin_url( 'admin.php' )
    );

    $wp_admin_bar->add_node( array(
        'id'    => 'odyssee-visual-studio',
        'title' => '⚡ Editar com Odyssee Studio',
        'href'  => esc_url( $studio_url ),
        'meta'  => array(
            'title' => 'Abrir o Editor Visual do Tema Odyssee',
        ),
    ) );
}

/**
 * Adds a launch banner inside WordPress's native Appearance -> Customize (customize.php)
 */
add_action( 'customize_controls_print_footer_scripts', 'odyssee_vb_customizer_launch_banner' );
function odyssee_vb_customizer_launch_banner() {
    if ( ! current_user_can( 'manage_options' ) ) {
        return;
    }
    $studio_url = admin_url( 'admin.php?page=odyssee-visual-builder' );
    ?>
    <script>
    jQuery(document).ready(function($) {
        var banner = $(
            '<li style="padding:14px;background:linear-gradient(135deg,#131926,#1e1b4b);border-bottom:2px solid #8b5cf6;list-style:none;">' +
                '<div style="color:#f8fafc;font-weight:700;font-size:13px;margin-bottom:6px;">⚡ Odyssee Visual Studio</div>' +
                '<p style="color:#cbd5e1;font-size:11.5px;margin:0 0 10px 0;line-height:1.45;">Altere o estilo visual da página ou de cada item (Frutiger Aero, GTK4, Breeze, MacTahoe, Material 3 Expressive), gerencie Camadas e Paletas de Cor.</p>' +
                '<a href="<?php echo esc_url( $studio_url ); ?>" class="button button-primary" style="width:100%;text-align:center;background:linear-gradient(135deg,#8b5cf6,#d946ef);border:none;font-weight:700;height:34px;line-height:34px;">Abrir Odyssee Studio Visual &rarr;</a>' +
            '</li>'
        );
        $('#customize-theme-controls').prepend(banner);
    });
    </script>
    <?php
}

/**
 * Enqueues Admin Assets for the Visual Studio Page
 */
add_action( 'admin_enqueue_scripts', 'odyssee_vb_enqueue_admin_assets' );
function odyssee_vb_enqueue_admin_assets( $hook ) {
    if ( 'toplevel_page_odyssee-visual-builder' !== $hook && 'appearance_page_odyssee-visual-builder' !== $hook ) {
        return;
    }

    wp_enqueue_media();

    wp_enqueue_style(
        'fontawesome-admin-vb',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
        array(),
        '6.4.0'
    );

    wp_enqueue_style(
        'odyssee-vb-admin',
        get_template_directory_uri() . '/inc/visual-builder-admin.css',
        array(),
        odyssee_vb_asset_ver( 'inc/visual-builder-admin.css' )
    );

    wp_enqueue_script(
        'odyssee-vb-presets',
        get_template_directory_uri() . '/assets/js/visual-builder-presets.js',
        array(),
        odyssee_vb_asset_ver( 'assets/js/visual-builder-presets.js' ),
        true
    );

    wp_enqueue_script(
        'odyssee-vb-style-colors',
        get_template_directory_uri() . '/assets/js/visual-builder-style-colors.js',
        array(),
        odyssee_vb_asset_ver( 'assets/js/visual-builder-style-colors.js' ),
        true
    );

    wp_enqueue_script(
        'odyssee-vb-colorpicker',
        get_template_directory_uri() . '/inc/visual-builder-colorpicker.js',
        array( 'jquery' ),
        odyssee_vb_asset_ver( 'inc/visual-builder-colorpicker.js' ),
        true
    );

    wp_enqueue_script(
        'odyssee-vb-admin',
        get_template_directory_uri() . '/inc/visual-builder-admin.js',
        array( 'jquery', 'odyssee-vb-presets', 'odyssee-vb-style-colors', 'odyssee-vb-colorpicker' ),
        odyssee_vb_asset_ver( 'inc/visual-builder-admin.js' ),
        true
    );

    wp_localize_script( 'odyssee-vb-admin', 'odysseeVBAdmin', array(
        'ajaxurl'     => admin_url( 'admin-ajax.php' ),
        'nonce'       => wp_create_nonce( 'odyssee_vb_nonce' ),
        'homeUrl'     => home_url( '/' ),
        'initialData' => odyssee_vb_get_data(),
        'presets'     => odyssee_vb_get_presets_list(),
    ) );
}


/**
 * Versão de asset baseada na data de modificação (evita cache antigo no navegador)
 */
function odyssee_vb_asset_ver( $relative_path ) {
    $full = get_template_directory() . '/' . ltrim( $relative_path, '/' );
    return file_exists( $full ) ? (string) filemtime( $full ) : '26.10.15';
}

/**
 * Enqueues Frontend Assets & Passes Saved Customization Data + Active Theme Preset CSS
 */
add_action( 'wp_enqueue_scripts', 'odyssee_vb_enqueue_frontend_assets', 30 );
function odyssee_vb_enqueue_frontend_assets() {
    $is_preview = odyssee_vb_is_preview();
    $data       = odyssee_vb_get_data();

    if ( $is_preview ) {
        show_admin_bar( false );
    }

    wp_enqueue_style(
        'odyssee-vb-frontend',
        get_template_directory_uri() . '/assets/css/visual-builder-frontend.css',
        array( 'odyssee-style' ),
        odyssee_vb_asset_ver( 'assets/css/visual-builder-frontend.css' )
    );

    // Enqueue the physical compiled CSS file generated by the Visual Studio (so theme changes live in the codebase)
    $compiled_css_path = get_template_directory() . '/assets/css/theme-preset-active.css';
    if ( file_exists( $compiled_css_path ) && ! $is_preview ) {
        wp_enqueue_style(
            'odyssee-vb-preset-active',
            get_template_directory_uri() . '/assets/css/theme-preset-active.css',
            array( 'odyssee-vb-frontend' ),
            filemtime( $compiled_css_path )
        );
    }

    if ( ! wp_script_is( 'odyssee-orbit-hero', 'enqueued' ) ) {
        wp_enqueue_script(
            'odyssee-orbit-hero',
            get_template_directory_uri() . '/assets/js/orbit-hero.js',
            array(),
            odyssee_vb_asset_ver( 'assets/js/orbit-hero.js' ),
            true
        );
    }

    wp_enqueue_script(
        'odyssee-vb-presets',
        get_template_directory_uri() . '/assets/js/visual-builder-presets.js',
        array(),
        odyssee_vb_asset_ver( 'assets/js/visual-builder-presets.js' ),
        true
    );

    wp_enqueue_script(
        'odyssee-vb-style-colors',
        get_template_directory_uri() . '/assets/js/visual-builder-style-colors.js',
        array(),
        odyssee_vb_asset_ver( 'assets/js/visual-builder-style-colors.js' ),
        true
    );

    wp_enqueue_script(
        'odyssee-vb-frontend',
        get_template_directory_uri() . '/assets/js/visual-builder-frontend.js',
        array( 'vanilla-tilt', 'odyssee-vb-presets', 'odyssee-vb-style-colors' ),
        odyssee_vb_asset_ver( 'assets/js/visual-builder-frontend.js' ),
        true
    );

    wp_localize_script( 'odyssee-vb-frontend', 'odysseeVBConfig', array(
        'isPreview' => $is_preview,
        'data'      => $data,
    ) );
}

/**
 * Outputs SVG Filter Definitions in Footer for Real Additive & Subtractive Blend Channels
 */
add_action( 'wp_footer', 'odyssee_vb_print_svg_filters', 5 );
function odyssee_vb_print_svg_filters() {
    ?>
    <svg id="odyssee-vb-svg-filters" style="position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;" aria-hidden="true">
        <defs>
            <filter id="odyssee-svg-subtract" color-interpolation-filters="sRGB">
                <feComponentTransfer>
                    <feFuncR type="table" tableValues="1 0.15 0" />
                    <feFuncG type="table" tableValues="1 0.15 0" />
                    <feFuncB type="table" tableValues="1 0.25 0" />
                </feComponentTransfer>
            </filter>
            <filter id="odyssee-svg-add" color-interpolation-filters="sRGB">
                <feComponentTransfer>
                    <feFuncR type="linear" slope="1.35" intercept="0.06" />
                    <feFuncG type="linear" slope="1.35" intercept="0.06" />
                    <feFuncB type="linear" slope="1.35" intercept="0.06" />
                </feComponentTransfer>
            </filter>
        </defs>
    </svg>
    <?php
}

/**
 * AJAX Handler: Save Visual Studio Customizations, Named Presets & Physical Theme Files
 */
add_action( 'wp_ajax_odyssee_vb_save', 'odyssee_vb_ajax_save' );
function odyssee_vb_ajax_save() {
    check_ajax_referer( 'odyssee_vb_nonce', 'nonce' );

    if ( ! current_user_can( 'manage_options' ) ) {
        wp_send_json_error( 'Sem permissão para salvar.' );
    }

    $raw_json     = isset( $_POST['data'] ) ? wp_unslash( $_POST['data'] ) : '';
    $compiled_css = isset( $_POST['compiledCss'] ) ? wp_unslash( $_POST['compiledCss'] ) : '';
    $decoded      = json_decode( $raw_json, true );

    if ( ! is_array( $decoded ) ) {
        wp_send_json_error( 'Formato de dados inválido.' );
    }

    $preset_name = isset( $decoded['presetName'] ) && trim( (string) $decoded['presetName'] ) !== ''
        ? sanitize_text_field( $decoded['presetName'] )
        : 'OdysseeXP';

    $allowed_styles = array( 'odysseexp', 'frutiger-aero', 'gtk4', 'breeze', 'mactahoe', 'material', 'material-3-expressive' );
    $ui_style = isset( $decoded['uiStyle'] ) && in_array( $decoded['uiStyle'], $allowed_styles, true )
        ? $decoded['uiStyle']
        : 'odysseexp';

    $allowed_icons = array( 'default', 'glossy-3d', 'symbolic-thin', 'neon-glow', 'tonal-pill' );
    $icon_pack = isset( $decoded['iconPack'] ) && in_array( $decoded['iconPack'], $allowed_icons, true )
        ? $decoded['iconPack']
        : 'default';

    $clean = array(
        'presetName'              => $preset_name,
        'uiStyle'                 => $ui_style,
        'iconPack'                => $icon_pack,
        'blankMode'               => ! empty( $decoded['blankMode'] ),
        'elements'                => isset( $decoded['elements'] ) && is_array( $decoded['elements'] ) ? $decoded['elements'] : array(),
        'blocks'                  => isset( $decoded['blocks'] ) && is_array( $decoded['blocks'] ) ? $decoded['blocks'] : array(),
        'domMoves'                => isset( $decoded['domMoves'] ) && is_array( $decoded['domMoves'] ) ? $decoded['domMoves'] : array(),
        'clones'                  => isset( $decoded['clones'] ) && is_array( $decoded['clones'] ) ? $decoded['clones'] : array(),
        'layerGroups'             => isset( $decoded['layerGroups'] ) && is_array( $decoded['layerGroups'] ) ? $decoded['layerGroups'] : array(),
        'globalVars'              => isset( $decoded['globalVars'] ) && is_array( $decoded['globalVars'] ) ? $decoded['globalVars'] : array( 'all' => array(), 'dark' => array(), 'light' => array() ),
        'customCss'               => isset( $decoded['customCss'] ) ? wp_strip_all_tags( (string) $decoded['customCss'] ) : '',
        'customJs'                => isset( $decoded['customJs'] ) ? (string) $decoded['customJs'] : '',
        'elementPresets'          => isset( $decoded['elementPresets'] ) && is_array( $decoded['elementPresets'] ) ? $decoded['elementPresets'] : array(),
        'groupPresets'            => isset( $decoded['groupPresets'] ) && is_array( $decoded['groupPresets'] ) ? $decoded['groupPresets'] : array(),
        'componentPresets'        => isset( $decoded['componentPresets'] ) && is_array( $decoded['componentPresets'] ) ? $decoded['componentPresets'] : array(),
        'pagePresets'             => isset( $decoded['pagePresets'] ) && is_array( $decoded['pagePresets'] ) ? $decoded['pagePresets'] : array(),
        'sitePresets'             => isset( $decoded['sitePresets'] ) && is_array( $decoded['sitePresets'] ) ? $decoded['sitePresets'] : array(),
        'colorPalettes'           => isset( $decoded['colorPalettes'] ) && is_array( $decoded['colorPalettes'] ) ? $decoded['colorPalettes'] : array(),
        'activeGlobalPalette'     => isset( $decoded['activeGlobalPalette'] ) ? sanitize_text_field( (string) $decoded['activeGlobalPalette'] ) : '',
        'pagePalettes'            => isset( $decoded['pagePalettes'] ) && is_array( $decoded['pagePalettes'] ) ? $decoded['pagePalettes'] : array(),
        'allowVisitorColorSwitch' => isset( $decoded['allowVisitorColorSwitch'] ) ? (bool) $decoded['allowVisitorColorSwitch'] : true,
        'shortcuts'               => isset( $decoded['shortcuts'] ) && is_array( $decoded['shortcuts'] ) ? $decoded['shortcuts'] : array(),
        'uiStyleColors'           => isset( $decoded['uiStyleColors'] ) && is_array( $decoded['uiStyleColors'] ) ? $decoded['uiStyleColors'] : array(),
    );

    // 1. Save revision backup (up to 10 revisions)
    $revisions = get_option( ODYSSEE_VB_REVISIONS_KEY, array() );
    if ( ! is_array( $revisions ) ) {
        $revisions = array();
    }
    array_unshift( $revisions, array(
        'timestamp' => current_time( 'mysql' ),
        'data'      => $clean,
    ) );
    $revisions = array_slice( $revisions, 0, 10 );
    update_option( ODYSSEE_VB_REVISIONS_KEY, $revisions, false );

    // 2. Save active data in DB
    update_option( ODYSSEE_VB_OPTION_KEY, $clean );

    // 3. Save in Named Presets collection
    $presets = odyssee_vb_get_presets_list();
    $presets[ $preset_name ] = $clean;
    update_option( ODYSSEE_VB_PRESETS_KEY, $presets, false );

    // 4. Write physical files to theme directory so changes reflect directly in the theme codebase
    $theme_dir   = get_template_directory();
    $presets_dir = $theme_dir . '/presets';
    if ( ! is_dir( $presets_dir ) ) {
        wp_mkdir_p( $presets_dir );
    }

    $slug = sanitize_file_name( strtolower( str_replace( ' ', '-', $preset_name ) ) );
    if ( empty( $slug ) ) {
        $slug = 'odysseexp';
    }
    $json_pretty = wp_json_encode( $clean, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );
    @file_put_contents( $presets_dir . '/' . $slug . '.json', $json_pretty );
    if ( strtolower( $preset_name ) === 'odysseexp' ) {
        @file_put_contents( $presets_dir . '/odysseexp.json', $json_pretty );
    }

    $css_header = "/**\n"
        . " * Odyssee Theme — Predefinição Ativa Compilada pelo Odyssee Visual Studio\n"
        . " * Predefinição (Preset): {$preset_name}\n"
        . " * Design System (Estilo UI): {$ui_style}\n"
        . " * Pacote de Ícones: {$icon_pack}\n"
        . " * Este arquivo é sincronizado automaticamente ao salvar no Odyssee Studio e pode ser editado diretamente em qualquer editor de código.\n"
        . " */\n\n";
    @file_put_contents( $theme_dir . '/assets/css/theme-preset-active.css', $css_header . $compiled_css );

    wp_send_json_success( array(
        'message'    => "Salvo na predefinição '{$preset_name}' e sincronizado no tema!",
        'presetName' => $preset_name,
        'presets'    => $presets,
        'time'       => current_time( 'H:i:s' ),
    ) );
}

/**
 * Renders the Full-Screen Elementor-Like Visual Studio Page
 */
function odyssee_vb_render_admin_page() {
    if ( ! current_user_can( 'manage_options' ) ) {
        wp_die( 'Acesso negado.' );
    }

    $initial_preview = isset( $_GET['preview_url'] ) ? esc_url_raw( wp_unslash( $_GET['preview_url'] ) ) : home_url( '/' );
    if ( empty( $initial_preview ) || strpos( $initial_preview, home_url() ) !== 0 ) {
        $initial_preview = home_url( '/' );
    }
    $sep = ( strpos( $initial_preview, '?' ) === false ) ? '?' : '&';
    $iframe_src = $initial_preview . $sep . 'odyssee_vb_preview=1';

    $pages_list = array(
        home_url( '/' )            => '🏠 Página Inicial (Home)',
        home_url( '/servicos/' )   => '💼 Página de Serviços e Preços',
        home_url( '/sobre-mim/' )  => '👤 Página Sobre Mim (Currículo)',
        home_url( '/faq/' )        => '❓ Página de FAQ',
        home_url( '/posts/' )      => '🖼️ Todos os Posts / Portfólio',
    );
    ?>
        <div class="ovb-studio-app" id="ovb-studio-app" data-editing-theme="dark">
        <!-- TOP TOOLBAR -->
        <header class="ovb-topbar">
            <div class="ovb-topbar-left">
                <a href="<?php echo esc_url( admin_url() ); ?>" class="ovb-back-btn" title="Voltar ao Painel do WordPress">
                    <i class="fas fa-arrow-left"></i> WP Admin
                </a>
                <div class="ovb-brand">
                    <span class="ovb-brand-badge">STUDIO</span>
                    <span>Odyssee</span>
                </div>
                <select id="ovb-page-switcher" class="ovb-select-page" title="Alternar página em edição">
                    <?php foreach ( $pages_list as $p_url => $p_label ) : ?>
                        <option value="<?php echo esc_url( $p_url ); ?>" <?php selected( untrailingslashit( $initial_preview ), untrailingslashit( $p_url ) ); ?>>
                            <?php echo esc_html( $p_label ); ?>
                        </option>
                    <?php endforeach; ?>
                </select>

                <!-- Quick UI Design System Switcher in Topbar -->
                <select id="ovb-topbar-uistyle" class="ovb-select-page" title="Estilo Global da Página (Design System UI)">
                    <option value="odysseexp">🎨 UI: Padrão OdysseeXP</option>
                    <option value="frutiger-aero">🫧 UI: Frutiger Aero</option>
                    <option value="gtk4">🐧 UI: GTK4 (Libadwaita)</option>
                    <option value="breeze">❄️ UI: KDE Breeze</option>
                    <option value="mactahoe">🍎 UI: MacTahoe (Liquid Glass)</option>
                    <option value="material">📐 UI: Material Design</option>
                    <option value="material-3-expressive">🌸 UI: Material 3 Expressive</option>
                </select>
            </div>

            <div class="ovb-topbar-center">
                <!-- Device Switcher -->
                <div class="ovb-btn-group" title="Visualização Responsiva">
                    <button type="button" class="ovb-icon-btn ovb-device-btn active" data-device="desktop" title="Desktop (&ge;1025px)">
                        <i class="fas fa-desktop"></i>
                    </button>
                    <button type="button" class="ovb-icon-btn ovb-device-btn" data-device="tablet" title="Tablet (769–1024px)">
                        <i class="fas fa-tablet-alt"></i>
                    </button>
                    <button type="button" class="ovb-icon-btn ovb-device-btn" data-device="mobile" title="Mobile (&le;768px)">
                        <i class="fas fa-mobile-alt"></i>
                    </button>
                </div>

                <!-- Live Theme & Color Preview Switcher -->
                <div class="ovb-btn-group" title="Alternar Tema Escuro / Claro no Preview">
                    <button type="button" class="ovb-icon-btn ovb-preview-theme-btn active" data-theme="dark">
                        <i class="fas fa-moon"></i> Escuro
                    </button>
                    <button type="button" class="ovb-icon-btn ovb-preview-theme-btn" data-theme="light">
                        <i class="fas fa-sun"></i> Claro
                    </button>
                </div>

                <div class="ovb-btn-group" title="Alternar Cor de Destaque no Preview">
                    <button type="button" class="ovb-icon-btn ovb-preview-color-btn active" data-color="purple">
                        <span style="width:9px;height:9px;border-radius:50%;background:#8b5cf6;display:inline-block;"></span> Roxo
                    </button>
                    <button type="button" class="ovb-icon-btn ovb-preview-color-btn" data-color="red">
                        <span style="width:9px;height:9px;border-radius:50%;background:#ef4444;display:inline-block;"></span> Vermelho
                    </button>
                </div>

                <button type="button" id="ovb-toggle-onboarding" class="ovb-icon-btn" style="border:1px solid rgba(255,255,255,0.1);" title="Mostrar/Editar Tela de Onboarding">
                    <i class="fas fa-door-open"></i> Onboarding
                </button>

                <button type="button" id="ovb-toggle-grid" class="ovb-icon-btn" style="border:1px solid rgba(255,255,255,0.1);" title="Ativar/Desativar Grade de Alinhamento">
                    <i class="fas fa-border-all"></i> Grade
                </button>

                <button type="button" id="ovb-toggle-interactive" class="ovb-icon-btn" style="border:1px solid rgba(255,255,255,0.1);" title="Alternar entre Modo Seleção/Arrastar e Navegação Livre">
                    <i class="fas fa-mouse-pointer"></i> Navegar
                </button>

                <button type="button" id="ovb-toggle-code-drawer" class="ovb-icon-btn" style="border:1px solid #a855f7;color:#e9d5ff;background:rgba(168,85,247,0.16);font-weight:700;" title="Editor de Código CSS, HTML e SVG">
                    <i class="fas fa-code"></i> Código CSS
                </button>
            </div>

            <div class="ovb-topbar-right">
                <div class="ovb-btn-group">
                    <button type="button" id="ovb-btn-undo" class="ovb-icon-btn" title="Desfazer (Ctrl+Z)" disabled>
                        <i class="fas fa-undo"></i>
                    </button>
                    <button type="button" id="ovb-btn-redo" class="ovb-icon-btn" title="Refazer (Ctrl+Shift+Z / Ctrl+Y)" disabled>
                        <i class="fas fa-redo"></i>
                    </button>
                </div>

                <button type="button" id="ovb-btn-save" class="ovb-save-btn">
                    <i class="fas fa-check-circle"></i> Salvar (<span id="ovb-active-preset-badge">OdysseeXP</span>)
                </button>
            </div>
        </header>

        <!-- BARRA SUPERIOR DE CONTROLE E OPERAÇÃO (VALORES NUMÉRICOS, ATALHOS & POSICIONAMENTO) -->
        <div class="ovb-top-control-bar">
            <!-- Left Tool Shortcuts -->
            <div class="ovb-topbar-tools">
                <button type="button" class="ovb-cbar-btn active" data-ai-cmd="tool-select" title="Seleção / Mover (V)"><i class="fas fa-mouse-pointer"></i></button>
                <button type="button" class="ovb-cbar-btn" data-ai-cmd="tool-direct-select" title="Seleção Direta / Subir Nível Pai (A)"><i class="fas fa-location-arrow"></i></button>
                <button type="button" class="ovb-cbar-btn" data-ai-cmd="tool-text" title="Texto / Título (T)"><i class="fas fa-font"></i></button>
                <button type="button" class="ovb-cbar-btn" data-ai-cmd="tool-rect" title="Retângulo / Quadrado (M)"><i class="fas fa-vector-square"></i></button>
                <button type="button" class="ovb-cbar-btn" data-ai-cmd="tool-ellipse" title="Círculo / Elipse (L)"><i class="fas fa-circle"></i></button>
                <button type="button" class="ovb-cbar-btn" data-ai-cmd="tool-rounded" title="Barra / Painel (U)"><i class="fas fa-shapes"></i></button>
                <button type="button" class="ovb-cbar-btn" data-ai-cmd="tool-gradient" title="Degradê (G)"><i class="fas fa-fill-drip"></i></button>
                <button type="button" class="ovb-cbar-btn" data-ai-cmd="eyedropper-copy" title="Copiar Estilo (I)"><i class="fas fa-eye-dropper"></i></button>
                <button type="button" class="ovb-cbar-btn" data-ai-cmd="eyedropper-paste" title="Colar Estilo (Shift+I)"><i class="fas fa-paint-roller"></i></button>
            </div>

            <div class="ovb-cbar-divider"></div>

            <!-- Z-Order / Depth Buttons -->
            <div class="ovb-topbar-zorder">
                <button type="button" class="ovb-cbar-btn" id="ovb-cbar-z-top" title="Camada para o Topo (Shift+Ctrl+Home)"><i class="fas fa-angle-double-up"></i></button>
                <button type="button" class="ovb-cbar-btn" id="ovb-cbar-z-up" title="Subir Camada ( ] )"><i class="fas fa-chevron-up"></i></button>
                <button type="button" class="ovb-cbar-btn" id="ovb-cbar-z-down" title="Descer Camada ( [ )"><i class="fas fa-chevron-down"></i></button>
                <button type="button" class="ovb-cbar-btn" id="ovb-cbar-z-bottom" title="Camada para o Fundo (Shift+Ctrl+End)"><i class="fas fa-angle-double-down"></i></button>
            </div>

            <div class="ovb-cbar-divider"></div>

            <!-- Flip & Rotate Buttons -->
            <div class="ovb-topbar-transforms">
                <button type="button" class="ovb-cbar-btn" id="ovb-cbar-rot-m90" title="Girar -90°"><i class="fas fa-undo-alt"></i></button>
                <button type="button" class="ovb-cbar-btn" id="ovb-cbar-rot-p90" title="Girar +90°"><i class="fas fa-redo-alt"></i></button>
                <button type="button" class="ovb-cbar-btn" id="ovb-cbar-flip-h" title="Espelhar Horizontal (Flip H)"><i class="fas fa-arrows-alt-h"></i></button>
                <button type="button" class="ovb-cbar-btn" id="ovb-cbar-flip-v" title="Espelhar Vertical (Flip V)"><i class="fas fa-arrows-alt-v"></i></button>
            </div>

            <div class="ovb-cbar-divider"></div>

            <!-- Numeric Inputs: X, Y, W, Lock, H, Unit -->
            <div class="ovb-cbar-numeric-group">
                <div class="ovb-cbar-field">
                    <span class="ovb-cbar-label">X:</span>
                    <input type="text" id="ovb-cbar-val-x" class="ovb-cbar-input" placeholder="0" data-ovb-sync-prop="translateX">
                </div>
                <div class="ovb-cbar-field">
                    <span class="ovb-cbar-label">Y:</span>
                    <input type="text" id="ovb-cbar-val-y" class="ovb-cbar-input" placeholder="0" data-ovb-sync-prop="translateY">
                </div>
                <div class="ovb-cbar-field">
                    <span class="ovb-cbar-label">W:</span>
                    <input type="text" id="ovb-cbar-val-w" class="ovb-cbar-input" placeholder="auto" data-ovb-sync-prop="width">
                </div>
                <button type="button" id="ovb-cbar-aspect-lock" class="ovb-cbar-lock-btn" title="Trava de Proporção (Mantém aspecto W x H)">
                    <i class="fas fa-lock"></i>
                </button>
                <div class="ovb-cbar-field">
                    <span class="ovb-cbar-label">H:</span>
                    <input type="text" id="ovb-cbar-val-h" class="ovb-cbar-input" placeholder="auto" data-ovb-sync-prop="height">
                </div>
                <span class="ovb-cbar-unit">px</span>
            </div>

            <!-- Quick Action Badges -->
            <div class="ovb-cbar-right">
                <button type="button" id="ovb-btn-open-color-manager" class="ovb-cbar-pill-btn ovb-open-color-manager" title="Gerenciador de Cores — roda de cores para qualquer coisa (Alt+C)">
                    🎨 Cores
                </button>
                <button type="button" id="ovb-btn-quick-hero-slogan" class="ovb-cbar-pill-btn" title="Selecionar imediatamente o Título do Site abaixo da Logo (.hero-slogan)">
                    🔤 Título Abaixo da Logo
                </button>
                <button type="button" id="ovb-btn-quick-immune" class="ovb-cbar-pill-btn" title="Marcar elemento selecionado como Tema Não Aplicável (Imune a temas globais)">
                    🛡️ Tema Não Aplicável (Imune)
                </button>
            </div>
        </div>

        <!-- MAIN WORKSPACE -->
        <div class="ovb-workspace">
            <!-- LEFT SIDEBAR -->
            <aside class="ovb-sidebar">
                <!-- Selected Element Banner -->
                <div class="ovb-selected-banner">
                    <div class="ovb-selected-info">
                        <span class="ovb-selected-label" id="ovb-sel-label">Nenhum elemento selecionado</span>
                        <span class="ovb-selected-selector" id="ovb-sel-selector">Clique e arraste qualquer item do site ao lado →</span>
                    </div>
                    <div class="ovb-selected-actions">
                        <button type="button" id="ovb-btn-select-parent" class="ovb-mini-btn" title="Selecionar Elemento Pai (Subir nível — Atalho A)">
                            ⬆ Pai
                        </button>
                        <button type="button" id="ovb-btn-reset-element" class="ovb-mini-btn" title="Resetar este elemento ao padrão original">
                            ↺ Reset
                        </button>
                    </div>
                </div>

                <!-- Context Bar: Strictly Isolated Device Bucket + Theme Scope -->
                <div class="ovb-context-bar">
                    <div style="display:flex;align-items:center;gap:5px;flex:1;">
                        <label for="ovb-state-bucket" title="Alterações feitas em Desktop, Tablet ou Mobile ficam 100% isoladas para aquele dispositivo!">Modo:</label>
                        <select id="ovb-state-bucket" class="ovb-select" style="padding:3px 6px !important;font-size:11px !important;">
                            <option value="desktop">🖥️ Só Desktop (&ge;1025px)</option>
                            <option value="tablet">📱 Só Tablet (769–1024px)</option>
                            <option value="mobile">📲 Só Mobile (&le;768px)</option>
                            <option value="global">🌐 Todos Dispositivos (Global)</option>
                            <option value="hover">👆 Hover (Ao passar mouse)</option>
                            <option value="dark">🌙 Somente Tema Escuro</option>
                            <option value="light">☀️ Somente Tema Claro</option>
                        </select>
                    </div>
                    <div style="display:flex;align-items:center;gap:5px;">
                        <label for="ovb-theme-scope" title="Em qual tema esta regra inteira se aplica">Tema:</label>
                        <select id="ovb-theme-scope" class="ovb-select" style="padding:3px 6px !important;font-size:11px !important;width:85px;">
                            <option value="all">Ambos</option>
                            <option value="dark">Só Escuro</option>
                            <option value="light">Só Claro</option>
                        </select>
                    </div>
                </div>

                <!-- 9 STRUCTURED TABS NAVIGATION -->
                <div class="ovb-tabs ovb-nine-tabs">
                    <button type="button" class="ovb-tab-btn active" data-tab="tab-properties" title="Propriedades">
                        <i class="fas fa-info-circle"></i>
                        <span>Propriedades</span>
                    </button>
                    <button type="button" class="ovb-tab-btn" data-tab="tab-operation" title="Operação">
                        <i class="fas fa-arrows-alt"></i>
                        <span>Operação</span>
                    </button>
                    <button type="button" class="ovb-tab-btn" data-tab="tab-edit" title="Editar">
                        <i class="fas fa-edit"></i>
                        <span>Editar</span>
                    </button>
                    <button type="button" class="ovb-tab-btn" data-tab="tab-layers" title="Camadas">
                        <i class="fas fa-layer-group"></i>
                        <span>Camadas</span>
                    </button>
                    <button type="button" class="ovb-tab-btn" data-tab="tab-style-effects" title="Estilo & Efeitos">
                        <i class="fas fa-palette"></i>
                        <span>Estilo & Efeitos</span>
                    </button>
                    <button type="button" class="ovb-tab-btn" data-tab="tab-text" title="Texto">
                        <i class="fas fa-font"></i>
                        <span>Texto</span>
                    </button>
                    <button type="button" class="ovb-tab-btn" data-tab="tab-behavior" title="Comportamento">
                        <i class="fas fa-mouse-pointer"></i>
                        <span>Comportamento</span>
                    </button>
                    <button type="button" class="ovb-tab-btn" data-tab="tab-presets" title="Presets">
                        <i class="fas fa-cubes"></i>
                        <span>Presets</span>
                    </button>
                    <button type="button" class="ovb-tab-btn" data-tab="tab-export" title="Exportar">
                        <i class="fas fa-file-export"></i>
                        <span>Exportar</span>
                    </button>
                    <button type="button" class="ovb-tab-btn" data-tab="tab-preferences" title="Preferências">
                        <i class="fas fa-sliders-h"></i>
                        <span>Preferências</span>
                    </button>
                </div>

                <!-- TAB PANELS -->
                <div class="ovb-panels">

                    <!-- ==========================================
                         TAB 1: PROPRIEDADES
                         (Informações do elemento e no final opção de CSS)
                         ========================================== -->
                    <div class="ovb-tab-panel active" id="tab-properties">
                        <!-- Informações Gerais do Elemento -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-info-circle"></i> Informações do Elemento</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div class="ovb-info-card">
                                    <div class="ovb-info-row">
                                        <span class="ovb-info-k">Tag:</span>
                                        <span class="ovb-info-v" id="ovb-info-tag">nenhuma</span>
                                    </div>
                                    <div class="ovb-info-row">
                                        <span class="ovb-info-k">ID:</span>
                                        <span class="ovb-info-v" id="ovb-info-id">-</span>
                                    </div>
                                    <div class="ovb-info-row">
                                        <span class="ovb-info-k">Classes:</span>
                                        <span class="ovb-info-v" id="ovb-info-classes">-</span>
                                    </div>
                                    <div class="ovb-info-row">
                                        <span class="ovb-info-k">Tipo Detectado:</span>
                                        <span class="ovb-info-v" id="ovb-info-detected-type">Nenhum</span>
                                    </div>
                                    <div class="ovb-info-row">
                                        <span class="ovb-info-k">Dimensões Reais:</span>
                                        <span class="ovb-info-v" id="ovb-info-rect">0 &times; 0 px</span>
                                    </div>
                                    <div class="ovb-info-row">
                                        <span class="ovb-info-k">Posição Canvas (X, Y):</span>
                                        <span class="ovb-info-v" id="ovb-info-pos">0, 0</span>
                                    </div>
                                </div>

                                <div class="ovb-field" style="margin-top:8px;">
                                    <label class="ovb-label">Seletor CSS do Elemento</label>
                                    <div class="ovb-field-row">
                                        <input type="text" id="ovb-custom-selector-input" class="ovb-input" placeholder="Ex: .hero-slogan">
                                        <button type="button" id="ovb-btn-apply-selector" class="ovb-mini-btn">Selecionar</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Textos, Imagens & Links -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-pen"></i> Textos, Imagens & Links</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div class="ovb-field">
                                    <label class="ovb-label">🇧🇷 Texto (Português)</label>
                                    <textarea id="ovb-content-text" class="ovb-textarea" rows="2" placeholder="Texto do elemento em Português"></textarea>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">🇺🇸 Texto Traduzido (Inglês — opcional)</label>
                                    <textarea id="ovb-content-text-en" class="ovb-textarea" rows="2" placeholder="Texto em Inglês quando o visitante mudar idioma"></textarea>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">🖼️ URL da Imagem Padrão (se for &lt;img&gt;)</label>
                                    <div class="ovb-field-row">
                                        <input type="text" id="ovb-content-src" class="ovb-input" placeholder="/wp-content/uploads/...">
                                        <button type="button" class="ovb-mini-btn ovb-media-btn" data-target="#ovb-content-src">Mídia</button>
                                    </div>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">🌙 Imagem específica no Tema Escuro (opcional)</label>
                                    <div class="ovb-field-row">
                                        <input type="text" id="ovb-content-src-dark" class="ovb-input" placeholder="/wp-content/uploads/...">
                                        <button type="button" class="ovb-mini-btn ovb-media-btn" data-target="#ovb-content-src-dark">Mídia</button>
                                    </div>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">☀️ Imagem específica no Tema Claro (opcional)</label>
                                    <div class="ovb-field-row">
                                        <input type="text" id="ovb-content-src-light" class="ovb-input" placeholder="/wp-content/uploads/...">
                                        <button type="button" class="ovb-mini-btn ovb-media-btn" data-target="#ovb-content-src-light">Mídia</button>
                                    </div>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">🔗 Link de Destino (se for &lt;a&gt;)</label>
                                    <input type="text" id="ovb-content-href" class="ovb-input" placeholder="https://...">
                                </div>

                                <div id="ovb-custom-block-editor" style="display:none;padding-top:8px;border-top:1px solid rgba(255,255,255,0.1);">
                                    <div class="ovb-field">
                                        <label class="ovb-label" style="color:#10b981;">Conteúdo / HTML do Bloco Inserido</label>
                                        <textarea id="ovb-block-edit-html" class="ovb-textarea" rows="4"></textarea>
                                    </div>
                                    <button type="button" id="ovb-btn-delete-block" class="ovb-action-btn ovb-danger-btn" style="margin-top:8px;">
                                        <i class="fas fa-trash"></i> Excluir Este Bloco Inserido
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Todos os Atributos HTML / SVG -->
                        <div class="ovb-section collapsed">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-tags"></i> Atributos Nativos HTML / SVG</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div id="ovb-attrs-list"></div>
                                <div class="ovb-field-row" style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.07);">
                                    <input type="text" id="ovb-new-attr-name" class="ovb-input" placeholder="Atributo (ex: viewBox)" style="width:42%;">
                                    <input type="text" id="ovb-new-attr-val" class="ovb-input" placeholder="Valor" style="flex:1;">
                                    <button type="button" id="ovb-btn-add-attr" class="ovb-mini-btn">＋</button>
                                </div>
                            </div>
                        </div>

                        <!-- Configurações Especiais (#5 Carrossel, #6 Floating Cards, #8 Degradê) -->
                        <div class="ovb-section collapsed" id="ovb-special-engine-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-atom"></i> Configurar Carrossel (#5), Cards 3D (#6) &amp; Degradê (#8)</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;">
                                    <button type="button" class="ovb-mini-btn" id="ovb-btn-quick-select-orbit">🪐 Selecionar Orbit Hero</button>
                                    <button type="button" class="ovb-mini-btn" id="ovb-btn-quick-select-carousel">🎠 Selecionar Carrossel</button>
                                </div>

                                <!-- CARROSSEL DE CARDS (#5) -->
                                <div style="padding:8px;background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.3);border-radius:8px;margin-bottom:10px;">
                                    <div style="font-size:11.5px;font-weight:700;color:#38bdf8;margin-bottom:6px;">🎠 5. Carrossel de Cards</div>
                                    <div class="ovb-field">
                                        <label class="ovb-label">Sentido do Movimento</label>
                                        <select class="ovb-select" data-ovb-sconfig="direction">
                                            <option value="clockwise">↻ Sentido Horário (Padrão Atual)</option>
                                            <option value="counterclockwise">↺ Sentido Anti-Horário</option>
                                        </select>
                                    </div>
                                    <div class="ovb-field">
                                        <label class="ovb-label">Modo de Ciclo</label>
                                        <select class="ovb-select" data-ovb-sconfig="mode">
                                            <option value="infinite">∞ Infinito Contínuo (Padrão Atual)</option>
                                            <option value="finite">⇥ Finito (Vai até o final e para)</option>
                                            <option value="pingpong">⇄ Ping-Pong (Vai até o final e volta)</option>
                                        </select>
                                    </div>
                                    <div class="ovb-field-row">
                                        <div class="ovb-field" style="flex:1;">
                                            <label class="ovb-label">Qtd. Cards no Ciclo</label>
                                            <input type="number" class="ovb-input" data-ovb-sconfig="cardsCount" min="1" max="30" placeholder="8">
                                        </div>
                                        <div class="ovb-field" style="flex:1;">
                                            <label class="ovb-label">Cards por Vez (0=Auto)</label>
                                            <input type="number" class="ovb-input" data-ovb-sconfig="visibleCards" min="0" max="8" step="1" placeholder="0">
                                        </div>
                                    </div>
                                    <div class="ovb-field-row">
                                        <div class="ovb-field" style="flex:1;">
                                            <label class="ovb-label">Velocidade</label>
                                            <input type="number" class="ovb-input" data-ovb-sconfig="speed" min="0" max="5" step="0.05" placeholder="0.2">
                                        </div>
                                        <div class="ovb-field" style="flex:1;">
                                            <label class="ovb-label">Categoria</label>
                                            <input type="text" class="ovb-input" data-ovb-sconfig="category" placeholder="Ex: Ilustração">
                                        </div>
                                    </div>
                                </div>

                                <!-- CARDS FLUTUANTES INTERATIVOS 3D (#6) -->
                                <div style="padding:8px;background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.35);border-radius:8px;margin-bottom:10px;">
                                    <div style="font-size:11.5px;font-weight:700;color:#e9d5ff;margin-bottom:6px;">🪐 6. Cards Flutuantes Interativos 3D</div>
                                    <div class="ovb-field-row">
                                        <div class="ovb-field" style="flex:1;">
                                            <label class="ovb-label">Quantos Cards</label>
                                            <input type="number" class="ovb-input" data-ovb-sconfig="totalCards" min="4" max="120" step="1" placeholder="44">
                                        </div>
                                        <div class="ovb-field" style="flex:1;">
                                            <label class="ovb-label">Densidade</label>
                                            <input type="number" class="ovb-input" data-ovb-sconfig="density" min="0.2" max="3" step="0.1" placeholder="1.0">
                                        </div>
                                    </div>
                                    <div class="ovb-field-row">
                                        <div class="ovb-field" style="flex:1;">
                                            <label class="ovb-label">Velocidade</label>
                                            <input type="number" class="ovb-input" data-ovb-sconfig="speedMult" min="0" max="5" step="0.1" placeholder="1.0">
                                        </div>
                                        <div class="ovb-field" style="flex:1;">
                                            <label class="ovb-label">Suavidade</label>
                                            <input type="number" class="ovb-input" data-ovb-sconfig="smoothness" min="0.01" max="0.4" step="0.01" placeholder="0.08">
                                        </div>
                                    </div>
                                    <div class="ovb-field-row">
                                        <div class="ovb-field" style="flex:1;">
                                            <label class="ovb-label">Sentido Anel 1</label>
                                            <select class="ovb-select" data-ovb-sconfig="ring1Dir">
                                                <option value="1">↻ Horário (+1)</option>
                                                <option value="-1">↺ Anti-Horário (-1)</option>
                                            </select>
                                        </div>
                                        <div class="ovb-field" style="flex:1;">
                                            <label class="ovb-label">Sentido Anel 2</label>
                                            <select class="ovb-select" data-ovb-sconfig="ring2Dir">
                                                <option value="-1">↺ Anti-Horário (-1)</option>
                                                <option value="1">↻ Horário (+1)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="ovb-field-row">
                                        <div class="ovb-field" style="flex:1;">
                                            <label class="ovb-label">Sentido Anel 3</label>
                                            <select class="ovb-select" data-ovb-sconfig="ring3Dir">
                                                <option value="1">↻ Horário (+1)</option>
                                                <option value="-1">↺ Anti-Horário (-1)</option>
                                            </select>
                                        </div>
                                        <div class="ovb-field" style="flex:1;">
                                            <label class="ovb-label">Sentido Anel 4</label>
                                            <select class="ovb-select" data-ovb-sconfig="ring4Dir">
                                                <option value="-1">↺ Anti-Horário (-1)</option>
                                                <option value="1">↻ Horário (+1)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="ovb-field-row">
                                        <div class="ovb-field" style="flex:1;">
                                            <label class="ovb-label">Efeito Mouse / Warp</label>
                                            <input type="number" class="ovb-input" data-ovb-sconfig="hoverWarp" min="0" max="3" step="0.1" placeholder="1.0">
                                        </div>
                                        <div class="ovb-field" style="flex:1;">
                                            <label class="ovb-label">Atração Mouse</label>
                                            <input type="number" class="ovb-input" data-ovb-sconfig="hoverTug" min="0" max="80" step="1" placeholder="25">
                                        </div>
                                    </div>
                                    <div class="ovb-field-row">
                                        <div class="ovb-field" style="flex:1;">
                                            <label class="ovb-label">Aberr. Cromática</label>
                                            <input type="number" class="ovb-input" data-ovb-sconfig="chromaticAberration" min="0" max="4" step="0.1" placeholder="1.0">
                                        </div>
                                        <div class="ovb-field" style="flex:1;">
                                            <label class="ovb-label">Bloom / Glow (px)</label>
                                            <input type="number" class="ovb-input" data-ovb-sconfig="bloom" min="0" max="40" step="1" placeholder="0">
                                        </div>
                                    </div>
                                </div>

                                <!-- DEGRADÊ QUEBRA DE CORTES SECOS (#8) -->
                                <div style="padding:8px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.3);border-radius:8px;">
                                    <div style="font-size:11.5px;font-weight:700;color:#34d399;margin-bottom:6px;">🌈 8. Degradê Quebra de Cortes Secos</div>
                                    <div class="ovb-field-row">
                                        <div class="ovb-field" style="flex:1;">
                                            <label class="ovb-label">Altura (px)</label>
                                            <input type="number" class="ovb-input" data-ovb-sconfig="heightPx" min="20" max="600" placeholder="180">
                                        </div>
                                        <div class="ovb-field" style="flex:1;">
                                            <label class="ovb-label">Direção</label>
                                            <select class="ovb-select" data-ovb-sconfig="gradientDirection">
                                                <option value="to bottom">↓ Para Baixo</option>
                                                <option value="to top">↑ Para Cima</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- CÓDIGO CSS DO ELEMENTO (NO FINAL DE TODAS AS PROPRIEDADES) -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-code"></i> Código CSS do Elemento</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <p style="font-size:11px;color:#cbd5e1;margin:0 0 6px 0;">
                                    Edite diretamente o código CSS exclusivo deste elemento (use <code>selector</code>):
                                </p>
                                <textarea id="ovb-element-custom-css" class="ovb-textarea" rows="4" style="font-family:monospace;font-size:11px;" placeholder="selector {&#10;  /* Seu código CSS aqui */&#10;}"></textarea>
                                <button type="button" id="ovb-btn-open-code-from-prop" class="ovb-action-btn" style="width:100%;margin-top:6px;background:rgba(168,85,247,0.2);border-color:#a855f7;color:#e9d5ff;">
                                    <i class="fas fa-terminal"></i> Abrir no Editor de Código Completo (&lt;/&gt;)
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- ==========================================
                         TAB 2: OPERAÇÃO
                         (Mover, rotacionar, redimensionar, sliders, textos, alinhar, pai vs global)
                         ========================================== -->
                    <div class="ovb-tab-panel" id="tab-operation">
                        <!-- ALINHAR & AJUSTAR -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-align-center"></i> Alinhar &amp; Ajustar</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <!-- Flag de Escopo do Ajuste -->
                                <div class="ovb-field" style="padding:8px;background:rgba(15,23,42,0.85);border:1px solid rgba(56,189,248,0.4);border-radius:8px;margin-bottom:8px;">
                                    <label class="ovb-label" style="color:#bae6fd;font-weight:700;">🎯 Escopo do Ajuste de Alinhamento:</label>
                                    <div style="display:flex;gap:6px;margin-top:4px;">
                                        <button type="button" class="ovb-mini-btn ovb-align-scope-btn active" data-align-scope="parent" style="flex:1;padding:5px 6px;font-weight:700;">
                                            📦 Apenas Dentro da Camada Pai
                                        </button>
                                        <button type="button" class="ovb-mini-btn ovb-align-scope-btn" data-align-scope="global" style="flex:1;padding:5px 6px;">
                                            🌐 No Global (Página)
                                        </button>
                                    </div>
                                </div>

                                <div class="ovb-align-grid">
                                    <button type="button" class="ovb-align-btn" data-align="top" title="Ajustar ao Topo">⊤ Topo</button>
                                    <button type="button" class="ovb-align-btn" data-align="center-v" title="Ajustar ao Meio Vertical">┼ Meio V</button>
                                    <button type="button" class="ovb-align-btn" data-align="bottom" title="Ajustar Abaixo">⊥ Abaixo</button>
                                    <button type="button" class="ovb-align-btn" data-align="left" title="Ajustar à Esquerda">⫷ Esquerda</button>
                                    <button type="button" class="ovb-align-btn" data-align="center-h" title="Ajustar ao Meio Horizontal">⫿ Meio H</button>
                                    <button type="button" class="ovb-align-btn" data-align="right" title="Ajustar à Direita">⫸ Direita</button>
                                </div>
                            </div>
                        </div>

                        <!-- REDIMENSIONAR & TAMANHO (SLIDERS + INPUTS NUMÉRICOS) -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-expand"></i> Redimensionar &amp; Escala</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div class="ovb-field-row" style="gap:6px;margin-bottom:8px;">
                                    <button type="button" id="ovb-btn-aspect-lock" class="ovb-lock-btn" style="flex:1;justify-content:center;" title="Trava de Proporção ao alterar tamanho">
                                        <i class="fas fa-lock"></i> <span>Proporção Travada</span>
                                    </button>
                                    <button type="button" id="ovb-btn-unstretch" class="ovb-mini-btn" style="flex:1;background:rgba(244,114,182,0.18);border-color:#f472b6;color:#fbcfe8;font-weight:700;" title="Desfazer esticamento acidental 1:1">
                                        ✨ 1:1 Desfazer Esticamento
                                    </button>
                                </div>

                                <!-- Slider e Texto: Escala Uniforme -->
                                <div class="ovb-field">
                                    <label class="ovb-label">
                                        <span>🔍 Escala Uniforme (Scale)</span>
                                        <button type="button" id="ovb-btn-reset-scale" class="ovb-mini-btn" style="padding:1px 6px;font-size:10px;">1x</button>
                                    </label>
                                    <div class="ovb-slider-wrap">
                                        <input type="range" class="ovb-range" data-ovb-range-for="scale" min="0.1" max="4" step="0.02" data-default="1">
                                        <input type="number" step="0.02" class="ovb-num-input" data-ovb-prop="scale" placeholder="1">
                                    </div>
                                </div>

                                <!-- Slider e Texto: Largura (W) -->
                                <div class="ovb-field">
                                    <label class="ovb-label">
                                        <span>↔️ Largura (W — px ou %)</span>
                                        <button type="button" class="ovb-mini-btn ovb-btn-auto-dim" data-dim="width" style="padding:1px 6px;font-size:10px;">Auto</button>
                                    </label>
                                    <div class="ovb-slider-wrap">
                                        <input type="range" id="ovb-slider-width" class="ovb-range" data-ovb-range-for="width" data-unit="px" min="10" max="1400" step="1" data-default="200">
                                        <input type="text" class="ovb-num-input" data-ovb-prop="width" placeholder="auto">
                                    </div>
                                </div>

                                <!-- Slider e Texto: Altura (H) -->
                                <div class="ovb-field">
                                    <label class="ovb-label">
                                        <span>↕️ Altura (H — px ou %)</span>
                                        <button type="button" class="ovb-mini-btn ovb-btn-auto-dim" data-dim="height" style="padding:1px 6px;font-size:10px;">Auto</button>
                                    </label>
                                    <div class="ovb-slider-wrap">
                                        <input type="range" id="ovb-slider-height" class="ovb-range" data-ovb-range-for="height" data-unit="px" min="10" max="1000" step="1" data-default="100">
                                        <input type="text" class="ovb-num-input" data-ovb-prop="height" placeholder="auto">
                                    </div>
                                </div>

                                <!-- Esticar Horiz. (ScaleX) e Vert. (ScaleY) -->
                                <div class="ovb-field-row" style="gap:8px;">
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Esticar Horiz. (Scale X)</label>
                                        <div class="ovb-slider-wrap">
                                            <input type="range" class="ovb-range" data-ovb-range-for="scaleX" min="0.1" max="3" step="0.02" data-default="1">
                                            <input type="number" step="0.02" class="ovb-num-input" data-ovb-prop="scaleX" placeholder="1" style="width:52px !important;">
                                        </div>
                                    </div>
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Esticar Vert. (Scale Y)</label>
                                        <div class="ovb-slider-wrap">
                                            <input type="range" class="ovb-range" data-ovb-range-for="scaleY" min="0.1" max="3" step="0.02" data-default="1">
                                            <input type="number" step="0.02" class="ovb-num-input" data-ovb-prop="scaleY" placeholder="1" style="width:52px !important;">
                                        </div>
                                    </div>
                                </div>

                                <!-- Proporção Fixa & Object Fit -->
                                <div class="ovb-field-row" style="gap:8px;">
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Proporção Fixa (Ratio)</label>
                                        <select class="ovb-select" data-ovb-prop="aspectRatio">
                                            <option value="">Livre / Original</option>
                                            <option value="1 / 1">1:1 (Quadrado)</option>
                                            <option value="16 / 9">16:9 (Widescreen)</option>
                                            <option value="4 / 3">4:3 (Clássico)</option>
                                            <option value="3 / 2">3:2 (Fotografia)</option>
                                            <option value="9 / 16">9:16 (Stories/Reels)</option>
                                        </select>
                                    </div>
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Encaixe de Imagem</label>
                                        <select class="ovb-select" data-ovb-prop="objectFit">
                                            <option value="">Padrão</option>
                                            <option value="contain">Contain (Inteiro)</option>
                                            <option value="cover">Cover (Preencher)</option>
                                            <option value="scale-down">Scale-Down</option>
                                            <option value="fill">Fill (Esticar)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- MOVER, POSIÇÃO LIVRE & ROTAÇÃO -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-arrows-alt"></i> Mover &amp; Rotacionar</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div class="ovb-field">
                                    <label class="ovb-label">Posição Horizontal — Eixo X (px)</label>
                                    <div class="ovb-slider-wrap">
                                        <input type="range" class="ovb-range" data-ovb-range-for="translateX" data-unit="px" min="-800" max="800" step="1" data-default="0">
                                        <input type="text" class="ovb-num-input" data-ovb-prop="translateX" placeholder="0px">
                                    </div>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">Posição Vertical — Eixo Y (px)</label>
                                    <div class="ovb-slider-wrap">
                                        <input type="range" class="ovb-range" data-ovb-range-for="translateY" data-unit="px" min="-800" max="800" step="1" data-default="0">
                                        <input type="text" class="ovb-num-input" data-ovb-prop="translateY" placeholder="0px">
                                    </div>
                                </div>

                                <!-- Rotação, Ponto de Âncora e Flip -->
                                <div class="ovb-field">
                                    <label class="ovb-label">Rotação (°), Espelhamento &amp; Ponto de Âncora</label>
                                    <div style="display:flex;align-items:center;gap:10px;">
                                        <div class="ovb-origin-grid" title="Ponto de Âncora da Transformação (Transform Origin)">
                                            <button type="button" class="ovb-origin-dot" data-origin="top left">↖</button>
                                            <button type="button" class="ovb-origin-dot" data-origin="top center">↑</button>
                                            <button type="button" class="ovb-origin-dot" data-origin="top right">↗</button>
                                            <button type="button" class="ovb-origin-dot" data-origin="center left">←</button>
                                            <button type="button" class="ovb-origin-dot active" data-origin="center center">•</button>
                                            <button type="button" class="ovb-origin-dot" data-origin="center right">→</button>
                                            <button type="button" class="ovb-origin-dot" data-origin="bottom left">↙</button>
                                            <button type="button" class="ovb-origin-dot" data-origin="bottom center">↓</button>
                                            <button type="button" class="ovb-origin-dot" data-origin="bottom right">↘</button>
                                        </div>

                                        <div style="flex:1;display:flex;flex-direction:column;gap:6px;">
                                            <div class="ovb-slider-wrap">
                                                <input type="range" class="ovb-range" data-ovb-range-for="rotate" data-unit="deg" min="-180" max="180" step="1" data-default="0">
                                                <input type="text" class="ovb-num-input" data-ovb-prop="rotate" placeholder="0deg">
                                            </div>
                                            <div class="ovb-field-row" style="gap:4px;">
                                                <button type="button" id="ovb-btn-flip-x" class="ovb-mini-btn" style="flex:1;" title="Espelhar Horizontal (Flip H)">⇄ Flip H</button>
                                                <button type="button" id="ovb-btn-flip-y" class="ovb-mini-btn" style="flex:1;" title="Espelhar Vertical (Flip V)">⇅ Flip V</button>
                                                <button type="button" id="ovb-btn-rot-m90" class="ovb-mini-btn" title="Girar -90°">⟲ -90°</button>
                                                <button type="button" id="ovb-btn-rot-p90" class="ovb-mini-btn" title="Girar +90°">⟳ +90°</button>
                                                <button type="button" id="ovb-btn-rot-0" class="ovb-mini-btn" title="Zerar Rotação">0°</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- LAYOUT, FLEXBOX, MARGENS & ESPAÇAMENTO -->
                        <div class="ovb-section collapsed">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-th-large"></i> Layout, Flexbox &amp; Espaçamento</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div class="ovb-field-row">
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Display</label>
                                        <select class="ovb-select" data-ovb-prop="display">
                                            <option value="">Padrão</option>
                                            <option value="block">Block</option>
                                            <option value="flex">Flex</option>
                                            <option value="inline-flex">Inline-Flex</option>
                                            <option value="grid">Grid</option>
                                            <option value="inline-block">Inline-Block</option>
                                            <option value="none">None (Oculto)</option>
                                        </select>
                                    </div>
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Direção Flex</label>
                                        <select class="ovb-select" data-ovb-prop="flexDirection">
                                            <option value="">Padrão</option>
                                            <option value="row">Linha (Row)</option>
                                            <option value="column">Coluna (Column)</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="ovb-field-row">
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Justify Content</label>
                                        <select class="ovb-select" data-ovb-prop="justifyContent">
                                            <option value="">Padrão</option>
                                            <option value="flex-start">Início</option>
                                            <option value="center">Centro</option>
                                            <option value="flex-end">Fim</option>
                                            <option value="space-between">Space Between</option>
                                        </select>
                                    </div>
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Align Items</label>
                                        <select class="ovb-select" data-ovb-prop="alignItems">
                                            <option value="">Padrão</option>
                                            <option value="stretch">Stretch</option>
                                            <option value="center">Centro</option>
                                            <option value="flex-start">Início</option>
                                            <option value="flex-end">Fim</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="ovb-field-row">
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Gap (Espaço entre itens)</label>
                                        <input type="text" class="ovb-input" data-ovb-prop="gap" placeholder="16px">
                                    </div>
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Z-Index (Camada)</label>
                                        <input type="number" class="ovb-input" data-ovb-prop="zIndex" placeholder="Auto">
                                    </div>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">Margem Externa (Margin)</label>
                                    <div class="ovb-box-grid">
                                        <div class="ovb-box-cell"><input type="text" data-ovb-prop="marginTop" placeholder="-"><span>Topo</span></div>
                                        <div class="ovb-box-cell"><input type="text" data-ovb-prop="marginRight" placeholder="-"><span>Dir</span></div>
                                        <div class="ovb-box-cell"><input type="text" data-ovb-prop="marginBottom" placeholder="-"><span>Baixo</span></div>
                                        <div class="ovb-box-cell"><input type="text" data-ovb-prop="marginLeft" placeholder="-"><span>Esq</span></div>
                                    </div>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">Preenchimento Interno (Padding)</label>
                                    <div class="ovb-box-grid">
                                        <div class="ovb-box-cell"><input type="text" data-ovb-prop="paddingTop" placeholder="-"><span>Topo</span></div>
                                        <div class="ovb-box-cell"><input type="text" data-ovb-prop="paddingRight" placeholder="-"><span>Dir</span></div>
                                        <div class="ovb-box-cell"><input type="text" data-ovb-prop="paddingBottom" placeholder="-"><span>Baixo</span></div>
                                        <div class="ovb-box-cell"><input type="text" data-ovb-prop="paddingLeft" placeholder="-"><span>Esq</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ==========================================
                         TAB 3: EDITAR
                         (Desfazer, refazer, localizar, duplicar, copiar, colar, colar no local, desselecionar, apagar + Inserir Formas)
                         ========================================== -->
                    <div class="ovb-tab-panel" id="tab-edit">
                        <!-- Menu de Ações de Edição com Atalhos -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-edit"></i> Ações de Edição</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div class="ovb-edit-menu-list">
                                    <button type="button" class="ovb-edit-menu-item" id="ovb-edit-undo">
                                        <span><i class="fas fa-undo"></i> Desfazer</span>
                                        <kbd>Ctrl+Z</kbd>
                                    </button>
                                    <button type="button" class="ovb-edit-menu-item" id="ovb-edit-redo">
                                        <span><i class="fas fa-redo"></i> Refazer</span>
                                        <kbd>Ctrl+Shift+Z</kbd>
                                    </button>
                                    <div class="ovb-menu-divider"></div>
                                    <button type="button" class="ovb-edit-menu-item" id="ovb-edit-find">
                                        <span><i class="fas fa-search"></i> Localizar / Buscar Elemento</span>
                                        <kbd>Ctrl+F</kbd>
                                    </button>
                                    <div class="ovb-menu-divider"></div>
                                    <button type="button" class="ovb-edit-menu-item" id="ovb-edit-cut">
                                        <span><i class="fas fa-cut"></i> Recortar</span>
                                        <kbd>Ctrl+X</kbd>
                                    </button>
                                    <button type="button" class="ovb-edit-menu-item" id="ovb-edit-copy">
                                        <span><i class="fas fa-copy"></i> Copiar</span>
                                        <kbd>Ctrl+C</kbd>
                                    </button>
                                    <button type="button" class="ovb-edit-menu-item" id="ovb-edit-paste">
                                        <span><i class="fas fa-paste"></i> Colar</span>
                                        <kbd>Ctrl+V</kbd>
                                    </button>
                                    <button type="button" class="ovb-edit-menu-item" id="ovb-edit-paste-in-place">
                                        <span><i class="fas fa-map-pin"></i> Colar no Local</span>
                                        <kbd>Ctrl+Alt+V</kbd>
                                    </button>
                                    <button type="button" class="ovb-edit-menu-item" id="ovb-edit-copy-style">
                                        <span><i class="fas fa-eye-dropper"></i> Copiar Estilo</span>
                                        <kbd>I</kbd>
                                    </button>
                                    <button type="button" class="ovb-edit-menu-item" id="ovb-edit-paste-style">
                                        <span><i class="fas fa-paint-roller"></i> Colar Estilo</span>
                                        <kbd>Shift+I</kbd>
                                    </button>
                                    <div class="ovb-menu-divider"></div>
                                    <button type="button" class="ovb-edit-menu-item" id="ovb-edit-duplicate">
                                        <span><i class="fas fa-clone"></i> Duplicar</span>
                                        <kbd>Ctrl+D</kbd>
                                    </button>
                                    <button type="button" class="ovb-edit-menu-item" id="ovb-edit-deselect">
                                        <span><i class="fas fa-times"></i> Desselecionar</span>
                                        <kbd>Escape</kbd>
                                    </button>
                                    <button type="button" class="ovb-edit-menu-item ovb-item-danger" id="ovb-edit-delete">
                                        <span><i class="fas fa-trash-alt"></i> Apagar / Ocultar</span>
                                        <kbd>Delete</kbd>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Inserir Formas & Novos Elementos -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-plus-circle"></i> Inserir Formas &amp; Novos Elementos</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div class="ovb-field-row" style="gap:8px;">
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Posição de Inserção:</label>
                                        <select id="ovb-insert-position" class="ovb-select">
                                            <option value="after">Abaixo do selecionado (After)</option>
                                            <option value="before">Acima do selecionado (Before)</option>
                                            <option value="append">Dentro — no final (Append)</option>
                                            <option value="prepend">Dentro — no início (Prepend)</option>
                                        </select>
                                    </div>
                                    <div class="ovb-field" style="width:125px;">
                                        <label class="ovb-label">Cor Inicial da Forma:</label>
                                        <div class="ovb-color-wrap">
                                            <input type="color" id="ovb-shape-init-color" class="ovb-color-picker" value="#8b5cf6" title="Cor inicial da nova forma">
                                            <input type="color" id="ovb-shape-init-color2" class="ovb-color-picker" value="#ec4899" title="Segunda cor do degradê inicial">
                                        </div>
                                    </div>
                                </div>

                                <div class="ovb-widget-grid">
                                    <div class="ovb-widget-card" data-widget="shape-square" title="Atalho: M"><i class="fas fa-vector-square" style="color:#a855f7;"></i><span>Quadrado (M)</span></div>
                                    <div class="ovb-widget-card" data-widget="shape-circle" title="Atalho: L"><i class="fas fa-circle" style="color:#ec4899;"></i><span>Círculo (L)</span></div>
                                    <div class="ovb-widget-card" data-widget="shape-bar" title="Atalho: U"><i class="fas fa-grip-lines" style="color:#38bdf8;"></i><span>Barra / Painel (U)</span></div>
                                    <div class="ovb-widget-card" data-widget="shape-squircle"><i class="fas fa-shapes" style="color:#10b981;"></i><span>Squircle / Pílula</span></div>
                                    <div class="ovb-widget-card" data-widget="heading" title="Atalho: T"><i class="fas fa-heading"></i><span>Título (T)</span></div>
                                    <div class="ovb-widget-card" data-widget="text"><i class="fas fa-align-left"></i><span>Bloco de Texto</span></div>
                                    <div class="ovb-widget-card" data-widget="button"><i class="fas fa-hand-pointer"></i><span>Botão Criativo</span></div>
                                    <div class="ovb-widget-card" data-widget="image"><i class="fas fa-image"></i><span>Imagem / Arte</span></div>
                                    <div class="ovb-widget-card" data-widget="card"><i class="fas fa-id-card"></i><span>Card Glassmorphism</span></div>
                                    <div class="ovb-widget-card" data-widget="glow-orb"><i class="fas fa-sun"></i><span>Luz / Orbe Glow</span></div>
                                    <div class="ovb-widget-card" data-widget="divider"><i class="fas fa-minus"></i><span>Divisor Neon</span></div>
                                    <div class="ovb-widget-card" data-widget="html"><i class="fas fa-code"></i><span>HTML / SVG Livre</span></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ==========================================
                         TAB 4: CAMADAS
                         (Camadas, agrupadas, desagrupadas, criar máscara, clipping mask)
                         ========================================== -->
                    <div class="ovb-tab-panel" id="tab-layers">
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-layer-group"></i> Gerenciador de Camadas</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div class="ovb-field-row" style="gap:6px;margin-bottom:6px;">
                                    <button type="button" class="ovb-mini-btn ovb-layer-view-btn active" data-layer-view="sections" style="flex:1;font-weight:700;">
                                        🗂️ Por Seção / Grupo
                                    </button>
                                    <button type="button" class="ovb-mini-btn ovb-layer-view-btn" data-layer-view="zstack" style="flex:1;">
                                        📚 Pilha Z-Index
                                    </button>
                                </div>

                                <div class="ovb-field-row" style="gap:4px;margin-bottom:6px;">
                                    <input type="text" id="ovb-tree-search" class="ovb-input" placeholder="🔍 Filtrar camadas..." style="flex:1;">
                                    <button type="button" id="ovb-btn-refresh-layers" class="ovb-mini-btn" title="Atualizar">↻</button>
                                </div>

                                <!-- Barra de Operações de Camadas: Agrupar, Desagrupar, Máscaras -->
                                <div style="display:flex;flex-wrap:wrap;gap:4px;padding:6px;background:rgba(15,23,42,0.85);border:1px solid rgba(168,85,247,0.3);border-radius:7px;margin-bottom:6px;">
                                    <button type="button" id="ovb-btn-group-layers" class="ovb-mini-btn" style="flex:1;font-weight:700;background:rgba(168,85,247,0.2);border-color:#a855f7;color:#e9d5ff;">
                                        📦 Agrupar
                                    </button>
                                    <button type="button" id="ovb-btn-ungroup-layers" class="ovb-mini-btn" style="flex:1;">
                                        📤 Desagrupar
                                    </button>
                                    <button type="button" id="ovb-layer-act-vis" class="ovb-mini-btn" title="Mostrar/Ocultar">👁️</button>
                                    <button type="button" id="ovb-layer-act-lock" class="ovb-mini-btn" title="Trancar/Destrancar">🔒</button>
                                    <button type="button" id="ovb-layer-act-up" class="ovb-mini-btn" title="Subir Z-Index">⬆ ]</button>
                                    <button type="button" id="ovb-layer-act-down" class="ovb-mini-btn" title="Descer Z-Index">⬇ [</button>
                                </div>

                                <div id="ovb-navigator-tree" class="ovb-tree-list ovb-ps-layers-panel"></div>
                            </div>
                        </div>

                        <!-- MÁSCARA & CLIPPING MASK -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-mask"></i> Máscaras &amp; Clipping Mask</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <!-- Clipping Mask (clip-path) -->
                                <div style="padding:8px;background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.3);border-radius:8px;margin-bottom:8px;">
                                    <div style="font-size:11px;font-weight:700;color:#38bdf8;margin-bottom:4px;">
                                        ✂️ Clipping Mask (Recorte de Vetor)
                                    </div>
                                    <div class="ovb-field">
                                        <label class="ovb-label">Forma do Recorte (clip-path)</label>
                                        <select class="ovb-select" data-ovb-prop="clipPath">
                                            <option value="">Nenhum (Sem recorte)</option>
                                            <option value="circle(50% at 50% 50%)">⚪ Círculo Perfeito (Circle)</option>
                                            <option value="ellipse(50% 40% at 50% 50%)">⬭ Elipse</option>
                                            <option value="polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)">◆ Losango / Diamante</option>
                                            <option value="polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)">⬡ Hexágono</option>
                                            <option value="polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)">★ Estrela 5 Pontas</option>
                                            <option value="inset(5% 5% 5% 5% round 24px)">🔲 Retângulo Arredondado (Inset Squircle)</option>
                                            <option value="parent">📦 Prender dentro do Container Pai (overflow: hidden)</option>
                                        </select>
                                    </div>
                                    <div class="ovb-field" style="margin-top:4px;">
                                        <label class="ovb-label">clip-path Customizado (CSS)</label>
                                        <input type="text" class="ovb-input" data-ovb-prop="clipPathCustom" placeholder="path('M 0 0 L 100 0 ...') ou polygon(...)">
                                    </div>
                                </div>

                                <!-- Layer Mask (mask-image) -->
                                <div style="padding:8px;background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.35);border-radius:8px;">
                                    <div style="font-size:11px;font-weight:700;color:#e9d5ff;margin-bottom:4px;">
                                        🎭 Máscara de Camada (Fade Alfa / Degradê)
                                    </div>
                                    <div class="ovb-field">
                                        <label class="ovb-label">Tipo de Máscara (mask-image)</label>
                                        <select class="ovb-select" data-ovb-prop="maskImage">
                                            <option value="">Nenhuma</option>
                                            <option value="linear-gradient(to bottom, black 60%, transparent 100%)">↓ Fade Suave para Baixo</option>
                                            <option value="linear-gradient(to top, black 60%, transparent 100%)">↑ Fade Suave para Cima</option>
                                            <option value="linear-gradient(to right, black 60%, transparent 100%)">→ Fade Suave para Direita</option>
                                            <option value="radial-gradient(circle, black 50%, transparent 100%)">⭕ Vinheta Radial (Bordas Esmaecidas)</option>
                                        </select>
                                    </div>
                                    <div class="ovb-field" style="margin-top:4px;">
                                        <label class="ovb-label">Máscara por Arquivo PNG/SVG (URL)</label>
                                        <div class="ovb-field-row">
                                            <input type="text" id="ovb-mask-custom-url" class="ovb-input" data-ovb-prop="maskImageUrl" placeholder="URL da máscara">
                                            <button type="button" class="ovb-mini-btn ovb-media-btn" data-target="#ovb-mask-custom-url">Mídia</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ==========================================
                         TAB 5: ESTILO & EFEITOS
                         (Cores base, efeitos, opacidade, filtros, sombra externa, interna, glow, bevel, extrude, 3D, hover & clique)
                         ========================================== -->
                    <div class="ovb-tab-panel" id="tab-style-effects">
                        <!-- Design System UI do Tema -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-swatchbook"></i> Estilo UI da Interface</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div class="ovb-field" style="padding:8px;background:rgba(15,23,42,0.85);border:1px solid rgba(168,85,247,0.45);border-radius:8px;margin-bottom:6px;">
                                    <label class="ovb-label" style="color:#f8fafc;font-weight:700;">Ao clicar em um Estilo UI abaixo, aplicar em:</label>
                                    <div class="ovb-uistyle-mode-switch" style="display:flex;gap:6px;">
                                        <button type="button" class="ovb-mini-btn ovb-uistyle-target-btn active" data-target-mode="element" style="flex:1;padding:5px 6px;font-weight:700;">
                                            🎯 Só no Item Selecionado
                                        </button>
                                        <button type="button" class="ovb-mini-btn ovb-uistyle-target-btn" data-target-mode="global" style="flex:1;padding:5px 6px;">
                                            🌐 No Site Todo (Global)
                                        </button>
                                    </div>
                                </div>

                                <div class="ovb-field" style="margin-bottom:6px;">
                                    <select id="ovb-el-uistyle-select" class="ovb-select">
                                        <option value="">Herdar Estilo da Página (Padrão)</option>
                                        <option value="none">🚫 Tema Não Aplicável (Imune / Original)</option>
                                        <option value="odysseexp">⚡ OdysseeXP</option>
                                        <option value="frutiger-aero">🫧 Frutiger Aero</option>
                                        <option value="gtk4">🐧 GTK4 Libadwaita</option>
                                        <option value="breeze">❄️ KDE Breeze</option>
                                        <option value="mactahoe">🍎 MacTahoe Liquid Glass</option>
                                        <option value="material">📐 Material Design</option>
                                        <option value="material-3-expressive">🌸 Material 3 Expressive</option>
                                    </select>
                                </div>

                                <div class="ovb-uistyle-grid">
                                    <div class="ovb-uistyle-card active" data-uistyle="odysseexp">
                                        <div class="ovb-uistyle-card-title"><span>⚡ OdysseeXP</span></div>
                                        <div class="ovb-uistyle-swatch" style="background:linear-gradient(90deg,#8b5cf6,#ec4899);"></div>
                                    </div>
                                    <div class="ovb-uistyle-card" data-uistyle="frutiger-aero">
                                        <div class="ovb-uistyle-card-title"><span>🫧 Frutiger Aero</span></div>
                                        <div class="ovb-uistyle-swatch" style="background:linear-gradient(90deg,#00d4ff,#10b981);"></div>
                                    </div>
                                    <div class="ovb-uistyle-card" data-uistyle="gtk4">
                                        <div class="ovb-uistyle-card-title"><span>🐧 GTK4</span></div>
                                        <div class="ovb-uistyle-swatch" style="background:linear-gradient(90deg,#3584e4,#62a0ea);"></div>
                                    </div>
                                    <div class="ovb-uistyle-card" data-uistyle="breeze">
                                        <div class="ovb-uistyle-card-title"><span>❄️ Breeze</span></div>
                                        <div class="ovb-uistyle-swatch" style="background:linear-gradient(90deg,#3daee9,#1d99f3);"></div>
                                    </div>
                                    <div class="ovb-uistyle-card" data-uistyle="mactahoe">
                                        <div class="ovb-uistyle-card-title"><span>🍎 MacTahoe</span></div>
                                        <div class="ovb-uistyle-swatch" style="background:linear-gradient(90deg,#38bdf8,#a855f7);"></div>
                                    </div>
                                    <div class="ovb-uistyle-card" data-uistyle="material">
                                        <div class="ovb-uistyle-card-title"><span>📐 Material</span></div>
                                        <div class="ovb-uistyle-swatch" style="background:linear-gradient(90deg,#6200ee,#03dac6);"></div>
                                    </div>
                                    <div class="ovb-uistyle-card" data-uistyle="material-3-expressive" style="grid-column: span 2;">
                                        <div class="ovb-uistyle-card-title"><span>🌸 Material 3 Expressive</span></div>
                                        <div class="ovb-uistyle-swatch" style="background:linear-gradient(90deg,#d0bcff,#f472b6,#38bdf8);"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- ========================================================
                             CORES DO ELEMENTO (DETECÇÃO INTELIGENTE, DEGRADÊ & TEMA)
                             ======================================================== -->
                        <div class="ovb-section" id="ovb-sec-element-colors">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-palette"></i> Cores do Elemento</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <!-- Aviso inteligente para imagens raster (PNG/JPEG) -->
                                <div id="ovb-raster-color-lock-notice" style="display:none;padding:8px 10px;background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.4);border-radius:7px;margin-bottom:8px;">
                                    <span style="font-size:11px;color:#fca5a5;font-weight:700;">
                                        🔒 Inserção de cor bloqueada: elemento de imagem (JPEG/PNG).
                                    </span>
                                    <p style="font-size:10px;color:#cbd5e1;margin:3px 0 0 0;">
                                        Imagens raster têm pixels fixos. Para alterar cores, selecione um elemento SVG, texto ou CSS.
                                    </p>
                                </div>

                                <div id="ovb-color-controls-wrap">
                                    <!-- Barra de Aplicação por Tema: Sol (☀️) e Lua (🌙) -->
                                    <div class="ovb-elc-theme-bar">
                                        <div class="ovb-elc-theme-header">
                                            <span class="ovb-elc-label">Aplicar Cor no Tema:</span>
                                            <button type="button" id="ovb-elc-reset-default" class="ovb-elc-reset-btn" title="Reseta as cores deste elemento de volta para o padrão original do tema/estilo ativo">
                                                <i class="fas fa-undo-alt"></i> Resetar pro Default
                                            </button>
                                        </div>
                                        <div class="ovb-elc-theme-pills">
                                            <button type="button" class="ovb-elc-theme-pill active" data-theme-scope="all" title="Aplica em ambos os temas (Global)">
                                                <span>☀️🌙</span> Ambos
                                            </button>
                                            <button type="button" class="ovb-elc-theme-pill" data-theme-scope="light" title="Aplica somente quando o site estiver no Tema Claro">
                                                <span>☀️</span> Claro
                                            </button>
                                            <button type="button" class="ovb-elc-theme-pill" data-theme-scope="dark" title="Aplica somente quando o site estiver no Tema Escuro">
                                                <span>🌙</span> Escuro
                                            </button>
                                        </div>
                                    </div>

                                    <!-- Fundo / Preenchimento do Elemento -->
                                    <div class="ovb-elc-card">
                                        <div class="ovb-elc-card-header">
                                            <span class="ovb-elc-card-title"><i class="fas fa-fill"></i> Fundo / Preenchimento</span>
                                            <div class="ovb-elc-type-pills">
                                                <button type="button" class="ovb-elc-type-pill active" data-bg-mode="solid">Sólido</button>
                                                <button type="button" class="ovb-elc-type-pill" data-bg-mode="gradient">Degradê</button>
                                                <button type="button" class="ovb-elc-type-pill" data-bg-mode="none">Nenhum</button>
                                            </div>
                                        </div>

                                        <!-- Modo Sólido -->
                                        <div id="ovb-elc-bg-solid-box" class="ovb-elc-box">
                                            <div class="ovb-color-wrap">
                                                <input type="color" class="ovb-color-picker" data-ovb-prop="backgroundColor" value="#131926">
                                                <input type="text" class="ovb-input" data-ovb-prop="backgroundColor" placeholder="padrão do tema">
                                            </div>
                                        </div>

                                        <!-- Modo Degradê -->
                                        <div id="ovb-elc-bg-gradient-box" class="ovb-elc-box" style="display:none;">
                                            <input type="checkbox" data-ovb-prop="bgGradientEnabled" id="ovb-bg-grad-enabled" style="display:none;">
                                            <!-- Preview Visual da Barra de Degradê -->
                                            <div id="ovb-elc-gradient-preview" class="ovb-elc-grad-bar" title="Pré-visualização do degradê"></div>

                                            <div class="ovb-field-row" style="margin-top:8px;gap:6px;">
                                                <div class="ovb-field" style="flex:1;">
                                                    <span style="font-size:10px;color:#cbd5e1;">Cor Inicial:</span>
                                                    <div class="ovb-color-wrap">
                                                        <input type="color" class="ovb-color-picker" data-ovb-prop="bgGradientColor1" value="#8b5cf6">
                                                        <input type="text" class="ovb-input" data-ovb-prop="bgGradientColor1" placeholder="#8b5cf6">
                                                    </div>
                                                </div>
                                                <div class="ovb-field" style="flex:1;">
                                                    <span style="font-size:10px;color:#cbd5e1;">Cor Final:</span>
                                                    <div class="ovb-color-wrap">
                                                        <input type="color" class="ovb-color-picker" data-ovb-prop="bgGradientColor2" value="#ec4899">
                                                        <input type="text" class="ovb-input" data-ovb-prop="bgGradientColor2" placeholder="#ec4899">
                                                    </div>
                                                </div>
                                            </div>

                                            <div class="ovb-field-row" style="margin-top:4px;gap:6px;">
                                                <div class="ovb-field" style="flex:1;">
                                                    <span style="font-size:10px;color:#cbd5e1;">Tipo de Degradê:</span>
                                                    <select class="ovb-select" data-ovb-prop="bgGradientType">
                                                        <option value="linear">Linear</option>
                                                        <option value="radial">Radial</option>
                                                    </select>
                                                </div>
                                                <div class="ovb-field" style="width:90px;">
                                                    <span style="font-size:10px;color:#cbd5e1;">Ângulo:</span>
                                                    <input type="number" class="ovb-num-input" data-ovb-prop="bgGradientAngle" placeholder="135" min="0" max="360">
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Modo Nenhum / Transparente -->
                                        <div id="ovb-elc-bg-none-box" class="ovb-elc-box" style="display:none;">
                                            <p style="font-size:11px;color:#94a3b8;margin:2px 0 0 0;font-style:italic;">
                                                Fundo transparente (nenhuma cor definida neste elemento).
                                            </p>
                                        </div>
                                    </div>

                                    <!-- Cor do Texto / Conteúdo -->
                                    <div class="ovb-elc-card" id="ovb-elc-text-card">
                                        <div class="ovb-elc-card-header">
                                            <span class="ovb-elc-card-title"><i class="fas fa-font"></i> Cor do Texto</span>
                                        </div>
                                        <div class="ovb-color-wrap">
                                            <input type="color" class="ovb-color-picker" data-ovb-prop="color" value="#f8fafc">
                                            <input type="text" class="ovb-input" data-ovb-prop="color" placeholder="padrão do tema">
                                        </div>
                                    </div>

                                    <!-- Preenchimento e Traçado SVG (visível apenas para elementos SVG) -->
                                    <div class="ovb-elc-card" id="ovb-elc-svg-card" style="display:none;">
                                        <div class="ovb-elc-card-header">
                                            <span class="ovb-elc-card-title"><i class="fas fa-bezier-curve"></i> Cores do Vetor SVG</span>
                                        </div>
                                        <div class="ovb-field-row" style="gap:6px;">
                                            <div class="ovb-field" style="flex:1;">
                                                <span style="font-size:10px;color:#cbd5e1;">Preenchimento (fill):</span>
                                                <div class="ovb-color-wrap">
                                                    <input type="color" class="ovb-color-picker" data-ovb-prop="fill" value="#8b5cf6">
                                                    <input type="text" class="ovb-input" data-ovb-prop="fill" placeholder="currentColor">
                                                </div>
                                            </div>
                                            <div class="ovb-field" style="flex:1;">
                                                <span style="font-size:10px;color:#cbd5e1;">Traçado (stroke):</span>
                                                <div class="ovb-color-wrap">
                                                    <input type="color" class="ovb-color-picker" data-ovb-prop="stroke" value="#d946ef">
                                                    <input type="text" class="ovb-input" data-ovb-prop="stroke" placeholder="none">
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Contorno / Borda -->
                                    <div class="ovb-elc-card">
                                        <div class="ovb-elc-card-header">
                                            <span class="ovb-elc-card-title"><i class="fas fa-border-style"></i> Contorno / Borda</span>
                                        </div>
                                        <div id="ovb-elc-border-box">
                                            <div class="ovb-field-row" style="gap:6px;">
                                                <div class="ovb-field" style="flex:1;">
                                                    <span style="font-size:10px;color:#cbd5e1;">Cor do Contorno:</span>
                                                    <div class="ovb-color-wrap">
                                                        <input type="color" class="ovb-color-picker" data-ovb-prop="borderColor" value="#8b5cf6">
                                                        <input type="text" class="ovb-input" data-ovb-prop="borderColor" placeholder="padrão">
                                                    </div>
                                                </div>
                                                <div class="ovb-field" style="width:75px;">
                                                    <span style="font-size:10px;color:#cbd5e1;">Espessura:</span>
                                                    <input type="text" class="ovb-input" data-ovb-prop="borderWidth" placeholder="1px">
                                                </div>
                                                <div class="ovb-field" style="width:85px;">
                                                    <span style="font-size:10px;color:#cbd5e1;">Estilo:</span>
                                                    <select class="ovb-select" data-ovb-prop="borderStyle">
                                                        <option value="">Padrão</option>
                                                        <option value="solid">Sólida</option>
                                                        <option value="dashed">Tracejada</option>
                                                        <option value="dotted">Pontilhada</option>
                                                        <option value="none">Nenhuma</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="ovb-field" style="margin-top:6px;">
                                                <label class="ovb-label">Arredondamento dos Cantos</label>
                                                <div class="ovb-slider-wrap">
                                                    <input type="range" class="ovb-range" data-ovb-range-for="borderRadius" data-unit="px" min="0" max="100" step="1" data-default="0">
                                                    <input type="text" class="ovb-num-input" data-ovb-prop="borderRadius" placeholder="0px">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- SOMBRAS (EXTERNA, INTERNA), GLOW, BEVEL & EXTRUDE 3D -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-cube"></i> Sombras, Glow, Bevel &amp; Extrude 3D</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <!-- Sombra Externa (Drop Shadow) -->
                                <div class="ovb-field">
                                    <label class="ovb-label" style="font-weight:700;color:#e9d5ff;">
                                        <span>Sombra Externa (Drop Shadow)</span>
                                        <input type="checkbox" data-ovb-prop="dropShadowEnabled">
                                    </label>
                                    <div class="ovb-field-row">
                                        <input type="color" class="ovb-color-picker" data-ovb-prop="dropShadowColor" value="#000000" title="Cor da Sombra">
                                        <input type="number" class="ovb-num-input" data-ovb-prop="dropShadowBlur" placeholder="Blur (px)" title="Blur">
                                        <input type="number" class="ovb-num-input" data-ovb-prop="dropShadowSpread" placeholder="Spread" title="Spread">
                                        <input type="number" class="ovb-num-input" data-ovb-prop="dropShadowX" placeholder="X" title="X">
                                        <input type="number" class="ovb-num-input" data-ovb-prop="dropShadowY" placeholder="Y" title="Y">
                                    </div>
                                </div>

                                <!-- Sombra Interna (Inner Shadow) -->
                                <div class="ovb-field">
                                    <label class="ovb-label" style="font-weight:700;color:#c084fc;">
                                        <span>Sombra Interna (Inner Shadow / Inset)</span>
                                        <input type="checkbox" data-ovb-prop="innerShadowEnabled">
                                    </label>
                                    <div class="ovb-field-row">
                                        <input type="color" class="ovb-color-picker" data-ovb-prop="innerShadowColor" value="#000000" title="Cor da Sombra Interna">
                                        <input type="number" class="ovb-num-input" data-ovb-prop="innerShadowBlur" placeholder="Blur (px)">
                                        <input type="number" class="ovb-num-input" data-ovb-prop="innerShadowSpread" placeholder="Spread">
                                        <input type="number" class="ovb-num-input" data-ovb-prop="innerShadowX" placeholder="X">
                                        <input type="number" class="ovb-num-input" data-ovb-prop="innerShadowY" placeholder="Y">
                                    </div>
                                </div>

                                <!-- Glow / Neon -->
                                <div class="ovb-field">
                                    <label class="ovb-label" style="font-weight:700;color:#38bdf8;">
                                        <span>Glow / Neon</span>
                                        <input type="checkbox" data-ovb-prop="glowEnabled">
                                    </label>
                                    <div class="ovb-preset-pills" style="margin-bottom:6px;">
                                        <button type="button" class="ovb-pill ovb-glow-preset" data-c1="#8b5cf6" data-c2="#d946ef" data-mode="box" data-blur="26">🟣 Roxo</button>
                                        <button type="button" class="ovb-pill ovb-glow-preset" data-c1="#ef4444" data-c2="#f43f5e" data-mode="box" data-blur="26">🔴 Vermelho</button>
                                        <button type="button" class="ovb-pill ovb-glow-preset" data-c1="#38bdf8" data-c2="#818cf8" data-mode="box" data-blur="26">🔵 Cyber Blue</button>
                                    </div>
                                    <div class="ovb-field-row">
                                        <input type="color" class="ovb-color-picker" data-ovb-prop="glowColor" value="#8b5cf6">
                                        <select class="ovb-select" data-ovb-prop="glowMode" style="flex:1;">
                                            <option value="box">Box Glow</option>
                                            <option value="drop-shadow">Contorno PNG/SVG</option>
                                            <option value="text">Texto Neon</option>
                                        </select>
                                        <input type="number" class="ovb-num-input" data-ovb-prop="glowBlur" placeholder="Blur (px)" style="width:60px !important;">
                                    </div>
                                </div>

                                <!-- Bevel (Chanfro / Relevo) -->
                                <div class="ovb-field">
                                    <label class="ovb-label" style="font-weight:700;color:#fbcfe8;">
                                        <span>Bevel (Chanfro / Relevo com Luz &amp; Sombra)</span>
                                        <input type="checkbox" data-ovb-prop="bevelEnabled">
                                    </label>
                                    <div class="ovb-field-row">
                                        <div class="ovb-field" style="flex:1;">
                                            <span style="font-size:10px;color:#cbd5e1;">Luz Superior:</span>
                                            <input type="color" class="ovb-color-picker" data-ovb-prop="bevelHighlight" value="#ffffff" style="width:100% !important;">
                                        </div>
                                        <div class="ovb-field" style="flex:1;">
                                            <span style="font-size:10px;color:#cbd5e1;">Sombra Inferior:</span>
                                            <input type="color" class="ovb-color-picker" data-ovb-prop="bevelShadow" value="#000000" style="width:100% !important;">
                                        </div>
                                        <div class="ovb-field" style="width:75px;">
                                            <span style="font-size:10px;color:#cbd5e1;">Tamanho (px):</span>
                                            <input type="number" class="ovb-num-input" data-ovb-prop="bevelSize" placeholder="3" min="1" max="25">
                                        </div>
                                    </div>
                                </div>

                                <!-- Extrude 3D (Profundidade Sólida) -->
                                <div class="ovb-field">
                                    <label class="ovb-label" style="font-weight:700;color:#fde047;">
                                        <span>Extrude 3D (Profundidade Sólida)</span>
                                        <input type="checkbox" data-ovb-prop="extrudeEnabled">
                                    </label>
                                    <div class="ovb-field-row">
                                        <div class="ovb-field" style="flex:1;">
                                            <span style="font-size:10px;color:#cbd5e1;">Cor da Extrusão:</span>
                                            <input type="color" class="ovb-color-picker" data-ovb-prop="extrudeColor" value="#5b21b6" style="width:100% !important;">
                                        </div>
                                        <div class="ovb-field" style="flex:1;">
                                            <span style="font-size:10px;color:#cbd5e1;">Profundidade (px):</span>
                                            <input type="number" class="ovb-num-input" data-ovb-prop="extrudeDepth" placeholder="8" min="1" max="30">
                                        </div>
                                        <div class="ovb-field" style="flex:1;">
                                            <span style="font-size:10px;color:#cbd5e1;">Direção:</span>
                                            <select class="ovb-select" data-ovb-prop="extrudeAngle">
                                                <option value="bottom-right">↘ Baixo-Dir</option>
                                                <option value="bottom-left">↙ Baixo-Esq</option>
                                                <option value="bottom">↓ Baixo</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <!-- Rotação 3D & Perspectiva -->
                                <div class="ovb-field-row" style="gap:6px;margin-top:4px;">
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Rot. 3D X (°)</label>
                                        <input type="number" class="ovb-input" data-ovb-prop="rotateX" placeholder="0">
                                    </div>
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Rot. 3D Y (°)</label>
                                        <input type="number" class="ovb-input" data-ovb-prop="rotateY" placeholder="0">
                                    </div>
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Perspectiva (px)</label>
                                        <input type="number" class="ovb-input" data-ovb-prop="perspective" placeholder="800">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- OPACIDADE, BLEND MODES & FILTROS ÓPTICOS -->
                        <div class="ovb-section collapsed">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-adjust"></i> Opacidade, Blend Modes &amp; Filtros</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div class="ovb-field">
                                    <label class="ovb-label">Opacidade (%)</label>
                                    <div class="ovb-slider-wrap">
                                        <input type="range" class="ovb-range" data-ovb-range-for="opacity" min="0" max="100" step="1" data-default="100">
                                        <input type="number" class="ovb-num-input" data-ovb-prop="opacity" placeholder="100">
                                    </div>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">Modo de Mesclagem (Mix Blend Mode)</label>
                                    <select class="ovb-select" data-ovb-prop="blendMode">
                                        <option value="normal">Normal</option>
                                        <option value="plus-lighter">Add (Adição Linear)</option>
                                        <option value="svg-subtract">Subtract (Subtração)</option>
                                        <option value="lighten">Lighten</option>
                                        <option value="screen">Screen</option>
                                        <option value="multiply">Multiply</option>
                                        <option value="overlay">Overlay</option>
                                        <option value="saturation">Saturation</option>
                                        <option value="color">Color</option>
                                        <option value="difference">Difference</option>
                                    </select>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">Desfoque / Blur (px)</label>
                                    <div class="ovb-slider-wrap">
                                        <input type="range" class="ovb-range" data-ovb-range-for="filterBlur" min="0" max="30" step="0.5" data-default="0">
                                        <input type="number" class="ovb-num-input" data-ovb-prop="filterBlur" placeholder="0">
                                    </div>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">Backdrop Filter (Glass Blur px)</label>
                                    <div class="ovb-slider-wrap">
                                        <input type="range" class="ovb-range" data-ovb-range-for="backdropBlur" min="0" max="40" step="1" data-default="0">
                                        <input type="number" class="ovb-num-input" data-ovb-prop="backdropBlur" placeholder="0px">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- ANIMAÇÕES DE ENTRADA, HOVER & CLIQUE -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-magic"></i> Animações: Entrada, Hover &amp; Clique</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div class="ovb-field">
                                    <label class="ovb-label">Animação de Entrada (Scroll)</label>
                                    <select class="ovb-select" data-ovb-prop="entranceAnim">
                                        <option value="none">Nenhuma</option>
                                        <option value="ovbFadeIn">Fade In</option>
                                        <option value="ovbFadeInUp">Fade In Up</option>
                                        <option value="ovbZoomIn">Zoom In</option>
                                        <option value="ovbBounceIn">Bounce In</option>
                                        <option value="ovbElasticPop">Elastic Pop</option>
                                    </select>
                                </div>

                                <!-- Animação por Aproximação (Hover) — Controlada pela flag da aba Comportamento -->
                                <div class="ovb-field" id="ovb-hover-anim-effect-box" style="padding:8px;background:rgba(15,23,42,0.85);border:1px solid rgba(244,114,182,0.3);border-radius:8px;margin-bottom:8px;">
                                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
                                        <label class="ovb-label" style="color:#f472b6;font-weight:700;margin:0;">
                                            🧲 Animação por Aproximação (Hover)
                                        </label>
                                        <span id="ovb-hover-lock-badge" style="font-size:10px;padding:2px 6px;border-radius:4px;background:rgba(239,68,68,0.2);color:#fca5a5;">
                                            🔒 Bloqueado no Comportamento
                                        </span>
                                    </div>
                                    <select class="ovb-select" data-ovb-prop="hoverAnimPreset" id="ovb-hover-anim-preset-select" disabled>
                                        <option value="none">Sem animação de aproximação</option>
                                        <option value="scale-up">🔍 Aumentar um pouco (Scale Up)</option>
                                        <option value="scale-down">🤏 Diminuir um pouco (Scale Down)</option>
                                        <option value="evade-mouse">🧲 Evitar / Fugir do Mouse (Igual cards da Home)</option>
                                        <option value="jelly">🍮 Efeito Geleia (Jelly Elastic)</option>
                                        <option value="soft-hop">🦘 Pulinho Suave (Soft Hop)</option>
                                        <option value="spin">↻ Girar (Spin)</option>
                                        <option value="slide-side">⇄ Ir para o Lado</option>
                                        <option value="slide-up">↑ Ir para Cima</option>
                                        <option value="slide-corner">↗ Ir para a Quina / Diagonal</option>
                                    </select>
                                </div>

                                <!-- Animação de Clique ou Toque — Controlada pela flag da aba Comportamento -->
                                <div class="ovb-field" id="ovb-click-anim-effect-box" style="padding:8px;background:rgba(15,23,42,0.85);border:1px solid rgba(56,189,248,0.3);border-radius:8px;">
                                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
                                        <label class="ovb-label" style="color:#38bdf8;font-weight:700;margin:0;">
                                            👆 Animação de Clique ou Toque
                                        </label>
                                        <span id="ovb-click-lock-badge" style="font-size:10px;padding:2px 6px;border-radius:4px;background:rgba(239,68,68,0.2);color:#fca5a5;">
                                            🔒 Bloqueado no Comportamento
                                        </span>
                                    </div>
                                    <select class="ovb-select" data-ovb-prop="clickAnimPreset" id="ovb-click-anim-preset-select" disabled>
                                        <option value="none">Sem animação de clique</option>
                                        <option value="scale-up">🔍 Aumentar um pouco (Scale Up)</option>
                                        <option value="scale-down">🤏 Diminuir um pouco (Scale Down)</option>
                                        <option value="jelly">🍮 Efeito Geleia (Jelly Elastic)</option>
                                        <option value="soft-hop">🦘 Pulinho Suave (Soft Hop)</option>
                                        <option value="spin">↻ Girar (Spin)</option>
                                        <option value="slide-side">⇄ Ir para o Lado</option>
                                        <option value="slide-up">↑ Ir para Cima</option>
                                        <option value="slide-corner">↗ Ir para a Quina / Diagonal</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- RECOLOR GLOBAL DOS ESTILOS UI (COLAPSADO POR PADRÃO PARA NÃO POLUIR) -->
                        <div class="ovb-section collapsed" id="ovb-sec-style-recolor">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-sliders-h"></i> Personalizar Cores Globais do Estilo UI (Avançado)</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body" style="display:none;">
                                <p style="font-size:10.5px;color:#94a3b8;margin:0 0 6px 0;line-height:1.4;">
                                    Troque as cores de um estilo sem perder o visual dele: o brilho, o vidro, as sombras e os contornos do estilo são preservados — só a matiz muda.
                                </p>
                                <div class="ovb-field">
                                    <label class="ovb-label">Estilo a recolorir</label>
                                    <select id="ovb-uisc-style" class="ovb-select">
                                        <option value="odysseexp">⚡ OdysseeXP</option>
                                        <option value="frutiger-aero">🫧 Frutiger Aero</option>
                                        <option value="gtk4">🐧 GTK4 Libadwaita</option>
                                        <option value="breeze">❄️ KDE Breeze</option>
                                        <option value="mactahoe">🍎 MacTahoe Liquid Glass</option>
                                        <option value="material">📐 Material Design</option>
                                        <option value="material-3-expressive">🌸 Material 3 Expressive</option>
                                    </select>
                                </div>
                                <div class="ovb-field">
                                    <label class="ovb-label">Cor de Destaque do Estilo</label>
                                    <div class="ovb-color-wrap">
                                        <input type="color" class="ovb-uisc-color" data-uisc="accent" value="#8b5cf6">
                                        <input type="text" class="ovb-input ovb-uisc-text" data-uisc="accent" placeholder="padrão do estilo">
                                    </div>
                                </div>
                                <div class="ovb-field-row">
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Fundo — Escuro</label>
                                        <div class="ovb-color-wrap">
                                            <input type="color" class="ovb-uisc-color" data-uisc="dark.page" value="#1e1e1e">
                                            <input type="text" class="ovb-input ovb-uisc-text" data-uisc="dark.page" placeholder="padrão">
                                        </div>
                                    </div>
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Cartões — Escuro</label>
                                        <div class="ovb-color-wrap">
                                            <input type="color" class="ovb-uisc-color" data-uisc="dark.surface" value="#303030">
                                            <input type="text" class="ovb-input ovb-uisc-text" data-uisc="dark.surface" placeholder="padrão">
                                        </div>
                                    </div>
                                </div>
                                <div class="ovb-field-row">
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Fundo — Claro</label>
                                        <div class="ovb-color-wrap">
                                            <input type="color" class="ovb-uisc-color" data-uisc="light.page" value="#fafafa">
                                            <input type="text" class="ovb-input ovb-uisc-text" data-uisc="light.page" placeholder="padrão">
                                        </div>
                                    </div>
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Cartões — Claro</label>
                                        <div class="ovb-color-wrap">
                                            <input type="color" class="ovb-uisc-color" data-uisc="light.surface" value="#ffffff">
                                            <input type="text" class="ovb-input ovb-uisc-text" data-uisc="light.surface" placeholder="padrão">
                                        </div>
                                    </div>
                                </div>
                                <div class="ovb-field-row" style="gap:6px;">
                                    <button type="button" id="ovb-uisc-reset" class="ovb-mini-btn" style="flex:1;">↺ Restaurar cores originais</button>
                                    <button type="button" class="ovb-mini-btn ovb-open-color-manager" style="flex:1;">🎨 Gerenciador (roda)</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ==========================================
                         ABA: TEXTO
                         (Edição de texto, fonte, tamanho, peso, alinhamento, cor, espaçamentos)
                         ========================================== -->
                    <div class="ovb-tab-panel" id="tab-text">
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-i-cursor"></i> Conteúdo do Texto</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div class="ovb-field">
                                    <label class="ovb-label">Texto (Português)</label>
                                    <textarea id="ovb-text-quick-pt" class="ovb-textarea" rows="3" placeholder="Selecione um elemento de texto e edite aqui..."></textarea>
                                </div>
                                <div class="ovb-field">
                                    <label class="ovb-label">Texto (English)</label>
                                    <textarea id="ovb-text-quick-en" class="ovb-textarea" rows="2" placeholder="Tradução opcional..."></textarea>
                                </div>
                            </div>
                        </div>

                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-font"></i> Fonte &amp; Tamanho</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div class="ovb-field">
                                    <label class="ovb-label">Fonte (Família)</label>
                                    <select class="ovb-select" id="ovb-text-font-select">
                                        <option value="">Herdar do tema</option>
                                        <option value="var(--font-ubuntu), sans-serif">Padrão do tema (Ubuntu)</option>
                                        <option value="'Inter', sans-serif">Inter</option>
                                        <option value="'Roboto', sans-serif">Roboto</option>
                                        <option value="'Poppins', sans-serif">Poppins</option>
                                        <option value="'Montserrat', sans-serif">Montserrat</option>
                                        <option value="'Open Sans', sans-serif">Open Sans</option>
                                        <option value="'Lato', sans-serif">Lato</option>
                                        <option value="'Nunito', sans-serif">Nunito</option>
                                        <option value="'Raleway', sans-serif">Raleway</option>
                                        <option value="'DM Sans', sans-serif">DM Sans</option>
                                        <option value="'Rubik', sans-serif">Rubik</option>
                                        <option value="'Space Grotesk', sans-serif">Space Grotesk</option>
                                        <option value="'Oswald', sans-serif">Oswald</option>
                                        <option value="'Bebas Neue', sans-serif">Bebas Neue</option>
                                        <option value="'Playfair Display', serif">Playfair Display</option>
                                        <option value="'Merriweather', serif">Merriweather</option>
                                        <option value="'Lora', serif">Lora</option>
                                        <option value="'Pacifico', cursive">Pacifico</option>
                                        <option value="'Caveat', cursive">Caveat</option>
                                        <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                                        <option value="'Fira Code', monospace">Fira Code</option>
                                        <option value="Arial, Helvetica, sans-serif">Arial</option>
                                        <option value="Georgia, serif">Georgia</option>
                                        <option value="'Courier New', monospace">Courier New</option>
                                    </select>
                                    <input type="text" id="ovb-text-font-custom" class="ovb-input" style="margin-top:4px;" placeholder="Ou digite: 'Minha Fonte', sans-serif">
                                    <p style="font-size:10px;color:#94a3b8;margin:3px 0 0 0;">Fontes do Google Fonts são carregadas automaticamente no site quando usadas.</p>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label"><span>Tamanho da Fonte</span></label>
                                    <div class="ovb-slider-wrap">
                                        <input type="range" class="ovb-range" data-ovb-range-for="fontSize" data-unit="px" min="8" max="160" step="1" data-default="16">
                                        <input type="text" class="ovb-num-input" data-ovb-prop="fontSize" placeholder="16px">
                                    </div>
                                </div>

                                <div class="ovb-field-row">
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Peso</label>
                                        <select class="ovb-select" data-ovb-prop="fontWeight">
                                            <option value="">Padrão</option>
                                            <option value="100">100 — Fina</option>
                                            <option value="300">300 — Leve</option>
                                            <option value="400">400 — Normal</option>
                                            <option value="500">500 — Média</option>
                                            <option value="600">600 — Semi-negrito</option>
                                            <option value="700">700 — Negrito</option>
                                            <option value="800">800 — Extra-negrito</option>
                                            <option value="900">900 — Black</option>
                                        </select>
                                    </div>
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Capitalização</label>
                                        <select class="ovb-select" data-ovb-prop="textTransform">
                                            <option value="">Padrão</option>
                                            <option value="none">Normal</option>
                                            <option value="uppercase">MAIÚSCULAS</option>
                                            <option value="lowercase">minúsculas</option>
                                            <option value="capitalize">Capitalizar Palavras</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">Estilo</label>
                                    <div class="ovb-text-toggle-row">
                                        <button type="button" class="ovb-text-toggle" data-text-toggle="bold" title="Negrito"><b>B</b></button>
                                        <button type="button" class="ovb-text-toggle" data-text-toggle="italic" title="Itálico"><i>I</i></button>
                                        <button type="button" class="ovb-text-toggle" data-text-toggle="underline" title="Sublinhado"><u>U</u></button>
                                        <button type="button" class="ovb-text-toggle" data-text-toggle="line-through" title="Tachado"><s>S</s></button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-align-left"></i> Alinhamento &amp; Espaçamento</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div class="ovb-field">
                                    <label class="ovb-label">Alinhamento do Texto</label>
                                    <div class="ovb-text-toggle-row">
                                        <button type="button" class="ovb-text-align" data-text-align="left" title="Esquerda"><i class="fas fa-align-left"></i></button>
                                        <button type="button" class="ovb-text-align" data-text-align="center" title="Centro"><i class="fas fa-align-center"></i></button>
                                        <button type="button" class="ovb-text-align" data-text-align="right" title="Direita"><i class="fas fa-align-right"></i></button>
                                        <button type="button" class="ovb-text-align" data-text-align="justify" title="Justificado"><i class="fas fa-align-justify"></i></button>
                                    </div>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">Altura da Linha</label>
                                    <div class="ovb-slider-wrap">
                                        <input type="range" class="ovb-range" data-ovb-range-for="lineHeight" min="0.8" max="3" step="0.05" data-default="1.5">
                                        <input type="text" class="ovb-num-input" data-ovb-prop="lineHeight" placeholder="1.5">
                                    </div>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">Espaço entre Letras</label>
                                    <div class="ovb-slider-wrap">
                                        <input type="range" class="ovb-range" data-ovb-range-for="letterSpacing" data-unit="px" min="-5" max="30" step="0.5" data-default="0">
                                        <input type="text" class="ovb-num-input" data-ovb-prop="letterSpacing" placeholder="0px">
                                    </div>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">Espaço entre Palavras</label>
                                    <div class="ovb-slider-wrap">
                                        <input type="range" class="ovb-range" data-ovb-range-for="wordSpacing" data-unit="px" min="-10" max="60" step="1" data-default="0">
                                        <input type="text" class="ovb-num-input" data-ovb-prop="wordSpacing" placeholder="0px">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-palette"></i> Cor &amp; Sombra do Texto</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div class="ovb-field">
                                    <label class="ovb-label">Cor do Texto</label>
                                    <div class="ovb-color-wrap">
                                        <input type="color" class="ovb-color-picker" data-ovb-prop="color" value="#f8fafc">
                                        <input type="text" class="ovb-input" data-ovb-prop="color" placeholder="#f8fafc">
                                    </div>
                                </div>
                                <div class="ovb-field">
                                    <label class="ovb-label">Sombra do Texto (text-shadow)</label>
                                    <input type="text" class="ovb-input" data-ovb-prop="textShadow" placeholder="0 2px 6px rgba(0,0,0,0.5)">
                                </div>
                                <button type="button" class="ovb-action-btn ovb-open-color-manager" style="width:100%;margin-top:4px;">
                                    <i class="fas fa-palette"></i> Abrir Gerenciador de Cores (roda)
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- ==========================================
                         TAB 6: COMPORTAMENTO
                         (É SVG ou CSS?, Função de botão, link, lightbox, página, vincular animações a outro elemento, ativar hover/click)
                         ========================================== -->
                    <div class="ovb-tab-panel" id="tab-behavior">
                        <!-- DETECÇÃO SVG/CSS vs RASTER -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-microchip"></i> Formato &amp; Editabilidade</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div style="padding:8px;background:rgba(15,23,42,0.85);border:1px solid rgba(168,85,247,0.3);border-radius:8px;">
                                    <div class="ovb-field-row" style="margin-bottom:6px;">
                                        <span style="font-size:11px;color:#cbd5e1;font-weight:700;">Elemento Atual:</span>
                                        <span id="ovb-behavior-type-tag" style="font-size:11px;color:#a855f7;font-weight:700;">CSS / HTML</span>
                                    </div>
                                    <label class="ovb-label" style="cursor:pointer;display:flex;align-items:center;gap:6px;">
                                        <input type="checkbox" id="ovb-allow-color-edit" checked style="accent-color:#10b981;">
                                        <span>Permitir edição de cores na aba de Estilos</span>
                                    </label>
                                    <p style="font-size:10px;color:#94a3b8;margin:4px 0 0 20px;">
                                        Elementos JPEG e PNG são desmarcados automaticamente para bloquear campos de cor e evitar confusão.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- FUNÇÃO / PAPEL PRINCIPAL DO ELEMENTO -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-hand-pointer"></i> Papel / Função Principal</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div class="ovb-field">
                                    <label class="ovb-label" style="font-weight:700;color:#e9d5ff;">O que este elemento faz quando o usuário interage:</label>
                                    <select class="ovb-select" data-ovb-prop="elementRole" id="ovb-element-role-select">
                                        <option value="none">🚫 Sem Interação (Apenas visual / decorativo)</option>
                                        <option value="button">🔘 Função de Botão (Ação de clique)</option>
                                        <option value="link">🔗 Função de Hyperlink (Abrir URL)</option>
                                        <option value="page">📄 Direciona para outra página do site</option>
                                        <option value="lightbox-image">🖼️ Abre uma Imagem em Tela Cheia (Lightbox)</option>
                                        <option value="lightbox-gallery">🖼️ Abre uma Galeria de Imagens (Lightbox)</option>
                                    </select>
                                </div>

                                <!-- Box: Link / URL -->
                                <div id="ovb-role-link-box" style="display:none;padding:8px;background:rgba(15,23,42,0.7);border:1px solid rgba(56,189,248,0.3);border-radius:6px;margin-top:6px;">
                                    <div class="ovb-field">
                                        <label class="ovb-label">URL de Destino</label>
                                        <input type="text" class="ovb-input" data-ovb-prop="roleUrl" placeholder="https://...">
                                    </div>
                                    <label class="ovb-label" style="margin-top:4px;cursor:pointer;">
                                        <input type="checkbox" data-ovb-prop="roleNewTab">
                                        <span>Abrir link em nova aba (_blank)</span>
                                    </label>
                                </div>

                                <!-- Box: Direcionar para página do site -->
                                <div id="ovb-role-page-box" style="display:none;padding:8px;background:rgba(15,23,42,0.7);border:1px solid rgba(168,85,247,0.3);border-radius:6px;margin-top:6px;">
                                    <div class="ovb-field">
                                        <label class="ovb-label">Página do Site:</label>
                                        <select class="ovb-select" data-ovb-prop="roleSitePage">
                                            <option value="/">🏠 Home (Página Inicial)</option>
                                            <option value="/servicos/">💼 Serviços e Preços</option>
                                            <option value="/sobre-mim/">👤 Sobre Mim</option>
                                            <option value="/faq/">❓ FAQ</option>
                                            <option value="/posts/">🖼️ Todos os Posts</option>
                                        </select>
                                    </div>
                                </div>

                                <!-- Box: Lightbox Imagem / Galeria -->
                                <div id="ovb-role-lightbox-box" style="display:none;padding:8px;background:rgba(15,23,42,0.7);border:1px solid rgba(16,185,129,0.3);border-radius:6px;margin-top:6px;">
                                    <div class="ovb-field">
                                        <label class="ovb-label">URLs das Imagens da Galeria (uma por linha):</label>
                                        <textarea class="ovb-textarea" data-ovb-prop="lightboxImages" rows="3" placeholder="/wp-content/uploads/foto1.jpg&#10;/wp-content/uploads/foto2.jpg"></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- ATIVAÇÃO DE ANIMAÇÕES DE HOVER E CLIQUE -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-film"></i> Ativar Animações de Interação</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div style="padding:8px;background:rgba(244,114,182,0.08);border:1px solid rgba(244,114,182,0.3);border-radius:8px;margin-bottom:8px;">
                                    <label class="ovb-label" style="color:#fbcfe8;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;">
                                        <input type="checkbox" data-ovb-prop="enableHoverAnim" id="ovb-chk-enable-hover" style="accent-color:#ec4899;transform:scale(1.2);">
                                        <span>🧲 Hover de aproximar o mouse e ter animação</span>
                                    </label>
                                    <p style="font-size:10px;color:#cbd5e1;margin:4px 0 0 20px;">
                                        Ao marcar, habilita a seleção de animações por aproximação (evitar mouse, geleia, pulinho, etc.) na aba <strong>Estilo &amp; Efeitos</strong>.
                                    </p>
                                </div>

                                <div style="padding:8px;background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.3);border-radius:8px;">
                                    <label class="ovb-label" style="color:#bae6fd;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;">
                                        <input type="checkbox" data-ovb-prop="enableClickAnim" id="ovb-chk-enable-click" style="accent-color:#38bdf8;transform:scale(1.2);">
                                        <span>👆 Animações de clique ou toque</span>
                                    </label>
                                    <p style="font-size:10px;color:#cbd5e1;margin:4px 0 0 20px;">
                                        Ao marcar, habilita a seleção de animação de clique na aba <strong>Estilo &amp; Efeitos</strong>.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- INTERAÇÃO VINCULADA A OUTRO ELEMENTO (TRIGGER CROSS-ELEMENT) -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-link"></i> Interação Vinculada a Outro Elemento</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <p style="font-size:11px;color:#cbd5e1;margin:0 0 8px 0;line-height:1.4;">
                                    Interagir com este elemento pode abrir/revelar ou disparar animações em <strong>outro elemento</strong> do site:
                                </p>

                                <!-- Trigger por Clique / Toque -->
                                <div style="padding:8px;background:rgba(15,23,42,0.85);border:1px solid rgba(168,85,247,0.3);border-radius:8px;margin-bottom:8px;">
                                    <div style="font-size:11px;font-weight:700;color:#c084fc;margin-bottom:4px;">
                                        👆 Ao clicar ou tocar neste elemento:
                                    </div>
                                    <div class="ovb-field">
                                        <label class="ovb-label">Ação no Elemento Vinculado:</label>
                                        <select class="ovb-select" data-ovb-prop="clickTargetAction">
                                            <option value="">Nenhuma ação vinculada</option>
                                            <option value="toggle-show">Alternar Mostrar / Ocultar</option>
                                            <option value="show">Mostrar / Revelar</option>
                                            <option value="hide">Ocultar</option>
                                            <option value="trigger-anim">Disparar Animação (Exige animações ativas no alvo)</option>
                                        </select>
                                    </div>
                                    <div class="ovb-field" style="margin-top:4px;">
                                        <label class="ovb-label">Seletor CSS do Elemento Alvo Vinculado:</label>
                                        <div class="ovb-field-row">
                                            <input type="text" class="ovb-input" data-ovb-prop="clickTargetSelector" placeholder="Ex: #meu-menu ou .banner-alvo">
                                            <button type="button" class="ovb-mini-btn ovb-btn-pick-target" data-target-prop="clickTargetSelector" title="Selecionar elemento clicando nele">🎯 Escolher</button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Trigger por Passar o Mouse (Hover) -->
                                <div style="padding:8px;background:rgba(15,23,42,0.85);border:1px solid rgba(56,189,248,0.3);border-radius:8px;">
                                    <div style="font-size:11px;font-weight:700;color:#38bdf8;margin-bottom:4px;">
                                        🧲 Ao passar o mouse neste elemento:
                                    </div>
                                    <div class="ovb-field">
                                        <label class="ovb-label">Ação no Elemento Vinculado:</label>
                                        <select class="ovb-select" data-ovb-prop="hoverTargetAction">
                                            <option value="">Nenhuma ação vinculada</option>
                                            <option value="show-while-hover">Mostrar enquanto o mouse estiver em cima</option>
                                            <option value="toggle-show">Alternar Mostrar / Ocultar</option>
                                            <option value="trigger-anim">Disparar Animação (Exige animações ativas no alvo)</option>
                                        </select>
                                    </div>
                                    <div class="ovb-field" style="margin-top:4px;">
                                        <label class="ovb-label">Seletor CSS do Elemento Alvo Vinculado:</label>
                                        <div class="ovb-field-row">
                                            <input type="text" class="ovb-input" data-ovb-prop="hoverTargetSelector" placeholder="Ex: #info-card">
                                            <button type="button" class="ovb-mini-btn ovb-btn-pick-target" data-target-prop="hoverTargetSelector" title="Selecionar elemento clicando nele">🎯 Escolher</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ==========================================
                         TAB 7: PRESETS
                         (Presets dedicados no topo: Elementos, Grupos, Páginas e Site Todo + 21 Presets Pré-Prontos)
                         ========================================== -->
                    <div class="ovb-tab-panel" id="tab-presets">
                        <!-- 1. PRESETS DE ELEMENTOS INDIVIDUAIS -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-cube"></i> Presets de Elementos Individuais</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <p style="font-size:11px;color:#cbd5e1;margin:0 0 6px 0;">Salve o estilo e propriedades do elemento selecionado:</p>
                                <div class="ovb-field-row">
                                    <input type="text" id="ovb-preset-single-el-name" class="ovb-input" placeholder="Nome do Preset (ex: Meu Botão Neon)">
                                    <button type="button" id="ovb-btn-save-single-el-preset" class="ovb-mini-btn">💾 Salvar</button>
                                </div>
                                <div id="ovb-list-single-el-presets" class="ovb-tree-list" style="margin-top:6px;"></div>
                            </div>
                        </div>

                        <!-- 2. PRESETS DE GRUPOS DE ELEMENTOS -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-object-group"></i> Presets de Grupos de Elementos</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <p style="font-size:11px;color:#cbd5e1;margin:0 0 6px 0;">Salve um conjunto de elementos agrupados:</p>
                                <div class="ovb-field-row">
                                    <input type="text" id="ovb-preset-group-name" class="ovb-input" placeholder="Nome do Grupo (ex: Card + Botão)">
                                    <button type="button" id="ovb-btn-save-group-preset" class="ovb-mini-btn">💾 Salvar</button>
                                </div>
                                <div id="ovb-list-group-presets" class="ovb-tree-list" style="margin-top:6px;"></div>
                            </div>
                        </div>

                        <!-- 3. PRESETS DE PÁGINAS -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-file-alt"></i> Presets de Páginas</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <p style="font-size:11px;color:#cbd5e1;margin:0 0 6px 0;">Salve ou aplique a configuração completa de uma página:</p>
                                <div class="ovb-field-row">
                                    <input type="text" id="ovb-page-preset-name" class="ovb-input" placeholder="Nome da Página (ex: Minha Home v2)">
                                    <button type="button" id="ovb-btn-save-page-preset" class="ovb-mini-btn">💾 Salvar</button>
                                </div>
                                <div class="ovb-field-row" style="margin-top:6px;">
                                    <select id="ovb-page-preset-selector" class="ovb-select" style="flex:1;">
                                        <option value="">-- Carregar Preset de Página --</option>
                                    </select>
                                    <button type="button" id="ovb-btn-load-page-preset" class="ovb-mini-btn">Aplicar</button>
                                </div>
                            </div>
                        </div>

                        <!-- 4. PRESETS DO SITE COMPLETO -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-globe"></i> Presets do Site Completo</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div class="ovb-field">
                                    <label class="ovb-label">Carregar Predefinição do Site:</label>
                                    <div class="ovb-field-row">
                                        <select id="ovb-preset-selector" class="ovb-select" style="flex:1;">
                                            <option value="OdysseeXP">⚡ OdysseeXP (Tema Principal)</option>
                                            <option value="Tema em Branco">📄 Tema em Branco (Criar do Zero)</option>
                                        </select>
                                        <button type="button" id="ovb-btn-load-preset" class="ovb-mini-btn">Carregar</button>
                                    </div>
                                </div>
                                <div class="ovb-field">
                                    <label class="ovb-label">Salvar como Nova Predefinição do Site:</label>
                                    <div class="ovb-field-row">
                                        <input type="text" id="ovb-preset-name-input" class="ovb-input" value="OdysseeXP">
                                        <button type="button" id="ovb-btn-save-site-preset" class="ovb-mini-btn">💾 Salvar</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- AS 21 PRESETS PRÉ-PRONTAS DO SITE -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-puzzle-piece"></i> 13 Presets Modulares (1 a 12 + Pop-up 22)</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div id="ovb-presets-small-grid" class="ovb-presets-catalog-list"></div>
                            </div>
                        </div>

                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-window-restore"></i> 9 Presets Robustos — Telas (13 a 21)</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div id="ovb-presets-robust-grid" class="ovb-presets-catalog-list"></div>
                            </div>
                        </div>
                    </div>

                    <!-- ==========================================
                         TAB 8: EXPORTAR
                         (Exportar elemento, grupo, página, tema, preset; opções Figma, Lunacy, .zip CSS, tokens com ícones adaptativos)
                         ========================================== -->
                    <div class="ovb-tab-panel" id="tab-export">
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-file-export"></i> Central de Exportação</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <!-- Passo 1: O que exportar -->
                                <div class="ovb-field" style="margin-bottom:8px;">
                                    <label class="ovb-label" style="font-weight:700;color:#e9d5ff;">1. Escolha o que deseja exportar:</label>
                                    <select id="ovb-export-what-selector" class="ovb-select">
                                        <option value="element">🎯 Exportar Elemento Selecionado</option>
                                        <option value="group">📦 Exportar Grupo de Elementos</option>
                                        <option value="page">📄 Exportar Página Inteira Atual</option>
                                        <option value="theme">🌐 Exportar Tema Completo</option>
                                        <option value="preset">⭐ Exportar Algum Preset</option>
                                    </select>
                                </div>

                                <!-- Seletor de preset (se escolheu exportar preset) -->
                                <div id="ovb-export-preset-picker-wrap" style="display:none;margin-bottom:8px;padding:8px;background:rgba(15,23,42,0.85);border:1px solid rgba(168,85,247,0.3);border-radius:7px;">
                                    <label class="ovb-label" style="color:#c084fc;">Escolha o Preset para Exportar:</label>
                                    <select id="ovb-export-preset-picker" class="ovb-select">
                                        <option value="OdysseeXP">OdysseeXP (Tema Padrão)</option>
                                    </select>
                                </div>

                                <!-- Passo 2: Formatos de Exportação com Ícones Adaptativos Preto/Branco -->
                                <div class="ovb-field">
                                    <label class="ovb-label" style="font-weight:700;color:#bae6fd;">2. Escolha o Formato de Exportação:</label>
                                    
                                    <div class="ovb-export-buttons-stack">
                                        <!-- Exportar para o Figma -->
                                        <button type="button" id="ovb-btn-export-figma" class="ovb-export-format-btn" title="Exportar para Figma (.SVG vetorial em camadas)">
                                            <span class="ovb-export-btn-icon">
                                                <!-- Figma SVG Monocromático Adaptativo -->
                                                <svg class="ovb-export-svg-icon" viewBox="0 0 38 57" width="20" height="30" fill="currentColor">
                                                    <path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z"/>
                                                    <path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z"/>
                                                    <path d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z"/>
                                                    <path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z"/>
                                                    <path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z"/>
                                                </svg>
                                            </span>
                                            <div class="ovb-export-btn-text">
                                                <strong>Exportar para o Figma</strong>
                                                <span>Artboard vetorial em camadas (.SVG)</span>
                                            </div>
                                        </button>

                                        <!-- Exportar para o Lunacy -->
                                        <button type="button" id="ovb-btn-export-lunacy" class="ovb-export-format-btn" title="Exportar para Lunacy (.SVG nativo)">
                                            <span class="ovb-export-btn-icon">
                                                <!-- Lunacy SVG Monocromático Adaptativo (Lua crescente Lunacy) -->
                                                <svg class="ovb-export-svg-icon" viewBox="0 0 32 32" width="22" height="22" fill="currentColor">
                                                    <path d="M28.4 20.3c-0.6 0.2-1.3 0.3-2 0.3-5.5 0-10-4.5-10-10 0-3.3 1.6-6.2 4.1-8-0.9-0.2-1.8-0.3-2.7-0.3-7.2 0-13 5.8-13 13s5.8 13 13 13c5.3 0 9.8-3.1 11.8-7.7-0.4-0.1-0.8-0.2-1.2-0.3z"/>
                                                </svg>
                                            </span>
                                            <div class="ovb-export-btn-text">
                                                <strong>Exportar para o Lunacy</strong>
                                                <span>Compatível com Lunacy / Sketch (.SVG)</span>
                                            </div>
                                        </button>

                                        <!-- Exportar para .zip do CSS -->
                                        <button type="button" id="ovb-btn-export-zip-css" class="ovb-export-format-btn" title="Exportar arquivo .zip contendo todo o CSS compilado e JSON do tema">
                                            <span class="ovb-export-btn-icon">
                                                <!-- Terminal >_ SVG Monocromático Adaptativo -->
                                                <svg class="ovb-export-svg-icon" viewBox="0 0 32 32" width="22" height="22" fill="currentColor">
                                                    <path d="M4 6c-1.1 0-2 0.9-2 2v16c0 1.1 0.9 2 2 2h24c1.1 0 2-0.9 2-2V8c0-1.1-0.9-2-2-2H4zm0 2h24v16H4V8zm4 3l5 5-5 5-1.4-1.4L10.2 16l-3.6-3.6L8 11zm7 9h8v2h-8v-2z"/>
                                                </svg>
                                            </span>
                                            <div class="ovb-export-btn-text">
                                                <strong>Exportar para .zip do CSS</strong>
                                                <span>Arquivo .zip com CSS completo e tokens</span>
                                            </div>
                                        </button>

                                        <!-- Exportar Design Tokens -->
                                        <button type="button" id="ovb-btn-export-tokens" class="ovb-export-format-btn" title="Exportar Design Tokens W3C (.tokens.json)">
                                            <span class="ovb-export-btn-icon">
                                                <!-- Token Diamond SVG Monocromático Adaptativo -->
                                                <svg class="ovb-export-svg-icon" viewBox="0 0 32 32" width="22" height="22" fill="currentColor">
                                                    <path d="M16 2L4 12l12 18 12-18L16 2zm0 3.5L24.8 12H7.2L16 5.5zM6.5 14h6.1l3.4 12.3L6.5 14zm8.5 12.6L12 14h8l-3 12.6zm4.4-.3L22.8 14h2.7l-6.1 12.3z"/>
                                                </svg>
                                            </span>
                                            <div class="ovb-export-btn-text">
                                                <strong>Exportar Design Tokens</strong>
                                                <span>Tokens W3C (.tokens.json)</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ==========================================
                         TAB 9: PREFERÊNCIAS
                         (Definir atalhos de teclado para operação, editar, formas, color pick, ajustar, etc.)
                         ========================================== -->
                    <div class="ovb-tab-panel" id="tab-preferences">
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-keyboard"></i> Atalhos de Teclado Personalizados</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <p style="font-size:11px;color:#cbd5e1;margin:0 0 8px 0;line-height:1.4;">
                                    Clique no campo de atalho para gravar sua tecla preferida:
                                </p>

                                <div class="ovb-shortcuts-editor-list" id="ovb-shortcuts-table">
                                    <div class="ovb-shortcut-row" data-action="tool-select">
                                        <span class="ovb-sc-name">Ferramenta Seleção / Mover</span>
                                        <button type="button" class="ovb-sc-btn" data-key="v">V</button>
                                    </div>
                                    <div class="ovb-shortcut-row" data-action="tool-direct-select">
                                        <span class="ovb-sc-name">Seleção Direta / Subir Nível Pai</span>
                                        <button type="button" class="ovb-sc-btn" data-key="a">A</button>
                                    </div>
                                    <div class="ovb-shortcut-row" data-action="tool-text">
                                        <span class="ovb-sc-name">Ferramenta Texto (T)</span>
                                        <button type="button" class="ovb-sc-btn" data-key="t">T</button>
                                    </div>
                                    <div class="ovb-shortcut-row" data-action="tool-rect">
                                        <span class="ovb-sc-name">Forma Quadrado / Retângulo</span>
                                        <button type="button" class="ovb-sc-btn" data-key="m">M</button>
                                    </div>
                                    <div class="ovb-shortcut-row" data-action="tool-ellipse">
                                        <span class="ovb-sc-name">Forma Círculo / Elipse</span>
                                        <button type="button" class="ovb-sc-btn" data-key="l">L</button>
                                    </div>
                                    <div class="ovb-shortcut-row" data-action="tool-rounded">
                                        <span class="ovb-sc-name">Forma Barra / Painel</span>
                                        <button type="button" class="ovb-sc-btn" data-key="u">U</button>
                                    </div>
                                    <div class="ovb-shortcut-row" data-action="tool-gradient">
                                        <span class="ovb-sc-name">Editar Degradê</span>
                                        <button type="button" class="ovb-sc-btn" data-key="g">G</button>
                                    </div>
                                    <div class="ovb-shortcut-row" data-action="eyedropper-copy">
                                        <span class="ovb-sc-name">Conta-Gotas / Copiar Estilo</span>
                                        <button type="button" class="ovb-sc-btn" data-key="i">I</button>
                                    </div>
                                    <div class="ovb-shortcut-row" data-action="eyedropper-paste">
                                        <span class="ovb-sc-name">Colar Estilo no Item</span>
                                        <button type="button" class="ovb-sc-btn" data-key="Shift+I">Shift+I</button>
                                    </div>
                                    <div class="ovb-shortcut-row" data-action="undo">
                                        <span class="ovb-sc-name">Desfazer (Undo)</span>
                                        <button type="button" class="ovb-sc-btn" data-key="Ctrl+Z">Ctrl+Z</button>
                                    </div>
                                    <div class="ovb-shortcut-row" data-action="redo">
                                        <span class="ovb-sc-name">Refazer (Redo)</span>
                                        <button type="button" class="ovb-sc-btn" data-key="Ctrl+Shift+Z">Ctrl+Shift+Z</button>
                                    </div>
                                    <div class="ovb-shortcut-row" data-action="duplicate">
                                        <span class="ovb-sc-name">Duplicar</span>
                                        <button type="button" class="ovb-sc-btn" data-key="Ctrl+D">Ctrl+D</button>
                                    </div>
                                    <div class="ovb-shortcut-row" data-action="find">
                                        <span class="ovb-sc-name">Localizar Elemento</span>
                                        <button type="button" class="ovb-sc-btn" data-key="Ctrl+F">Ctrl+F</button>
                                    </div>
                                    <div class="ovb-shortcut-row" data-action="delete">
                                        <span class="ovb-sc-name">Apagar / Ocultar</span>
                                        <button type="button" class="ovb-sc-btn" data-key="Delete">Delete</button>
                                    </div>
                                    <div class="ovb-shortcut-row" data-action="deselect">
                                        <span class="ovb-sc-name">Desselecionar</span>
                                        <button type="button" class="ovb-sc-btn" data-key="Escape">Escape</button>
                                    </div>
                                    <div class="ovb-shortcut-row" data-action="open-color-manager">
                                        <span class="ovb-sc-name">🎨 Gerenciador de Cores (Roda)</span>
                                        <button type="button" class="ovb-sc-btn" data-key="Alt+C">Alt+C</button>
                                    </div>
                                </div>

                                <button type="button" id="ovb-btn-reset-shortcuts" class="ovb-mini-btn" style="width:100%;margin-top:8px;">
                                    Restaurar Atalhos Padrão
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </aside>

            <!-- RIGHT LIVE PREVIEW CANVAS + BOTTOM LIVE CODE IDE DRAWER -->
            <main class="ovb-canvas-area">
                <!-- VERTICAL LEFT TOOL STRIP -->
                <div class="ovb-left-toolstrip" title="Barra Lateral de Ferramentas Rápidas">
                    <button type="button" class="ovb-toolstrip-btn active" data-ai-cmd="tool-select" title="Seleção / Mover (V)"><i class="fas fa-mouse-pointer"></i></button>
                    <button type="button" class="ovb-toolstrip-btn" data-ai-cmd="tool-direct-select" title="Seleção Direta (A)"><i class="fas fa-location-arrow"></i></button>
                    <div class="ovb-toolstrip-sep"></div>
                    <button type="button" class="ovb-toolstrip-btn" data-ai-cmd="tool-rect" title="Retângulo / Quadrado (M)"><i class="fas fa-vector-square"></i></button>
                    <button type="button" class="ovb-toolstrip-btn" data-ai-cmd="tool-ellipse" title="Círculo / Elipse (L)"><i class="fas fa-circle"></i></button>
                    <button type="button" class="ovb-toolstrip-btn" data-ai-cmd="tool-rounded" title="Barra / Squircle (U)"><i class="fas fa-shapes"></i></button>
                    <button type="button" class="ovb-toolstrip-btn" data-ai-cmd="tool-text" title="Texto / Título (T)"><i class="fas fa-font"></i></button>
                    <div class="ovb-toolstrip-sep"></div>
                    <button type="button" class="ovb-toolstrip-btn" data-ai-cmd="tool-gradient" title="Editar Degradê (G)"><i class="fas fa-fill-drip"></i></button>
                    <button type="button" class="ovb-toolstrip-btn" data-ai-cmd="eyedropper-copy" title="Copiar Estilo (I)"><i class="fas fa-eye-dropper"></i></button>
                    <button type="button" class="ovb-toolstrip-btn" data-ai-cmd="eyedropper-paste" title="Colar Estilo (Shift+I)"><i class="fas fa-paint-roller"></i></button>
                    <div class="ovb-toolstrip-sep"></div>
                    <button type="button" class="ovb-toolstrip-btn" id="ovb-toolstrip-guides" title="Alternar Grade / Guias"><i class="fas fa-ruler-combined"></i></button>
                    <button type="button" class="ovb-toolstrip-btn" id="ovb-toolstrip-inspect" title="Inspetor de Elemento"><i class="fas fa-search"></i></button>
                </div>

                <div id="ovb-iframe-container" class="ovb-iframe-container device-desktop">
                    <iframe id="ovb-preview-iframe" src="<?php echo esc_url( $iframe_src ); ?>" title="Odyssee Visual Preview"></iframe>
                </div>

                <!-- LIVE CODE EDITOR IDE (CSS, HTML & SVG) -->
                <div id="ovb-code-drawer" class="ovb-code-drawer">
                    <div class="ovb-code-header">
                        <div class="ovb-code-tabs">
                            <button type="button" class="ovb-code-tab active" data-codetab="pane-global-css">
                                <i class="fas fa-bolt"></i> Código CSS Global (Ao Vivo)
                            </button>
                            <button type="button" class="ovb-code-tab" data-codetab="pane-el-css">
                                <i class="fas fa-crosshairs"></i> Código CSS do Elemento Selecionado
                            </button>
                            <button type="button" class="ovb-code-tab" data-codetab="pane-el-html">
                                <i class="fas fa-code"></i> Código HTML / SVG do Elemento
                            </button>
                            <button type="button" class="ovb-code-tab" data-codetab="pane-compiled-export">
                                <i class="fas fa-laptop-code"></i> Código Compilado do Tema (CSS / JSON)
                            </button>
                        </div>
                        <div style="display:flex;align-items:center;gap:6px;">
                            <button type="button" id="ovb-code-maximize" class="ovb-mini-btn" title="Expandir / Restaurar Altura do Editor de Código">
                                ⤢ Expandir
                            </button>
                            <button type="button" id="ovb-code-close" class="ovb-mini-btn" title="Fechar Editor de Código">
                                ✕ Fechar
                            </button>
                        </div>
                    </div>

                    <div class="ovb-code-body">
                        <!-- PANE 1: GLOBAL CSS -->
                        <div class="ovb-code-pane active" id="pane-global-css">
                            <div class="ovb-code-statusbar">
                                <span>💡 Digite qualquer regra CSS abaixo e veja o resultado em tempo real na página (sem precisar recarregar):</span>
                                <span style="color:#c084fc;font-family:monospace;">Salvo em: assets/css/theme-preset-active.css</span>
                            </div>
                            <textarea id="ovb-global-custom-css" class="ovb-code-editor-textarea" spellcheck="false" placeholder="/* Digite seu código CSS global aqui! Tudo reflete ao vivo na página.&#10;Exemplo:&#10;.hero-slogan {&#10;  text-shadow: 0 0 25px #a855f7;&#10;}&#10;*/"></textarea>
                        </div>

                        <!-- PANE 2: ELEMENT CSS -->
                        <div class="ovb-code-pane" id="pane-el-css">
                            <div class="ovb-code-statusbar">
                                <span>🎯 Editando código CSS exclusivo do elemento: <strong id="ovb-code-el-label" style="color:#38bdf8;font-family:monospace;">(Selecione um elemento)</strong> — Use a palavra <code>selector</code>:</span>
                                <button type="button" id="ovb-btn-insert-selector-tpl" class="ovb-mini-btn">＋ Inserir bloco selector { }</button>
                            </div>
                            <textarea id="ovb-code-el-css-editor" class="ovb-code-editor-textarea" spellcheck="false" placeholder="selector {&#10;  /* Estilos aplicados diretamente neste elemento */&#10;  border: 2px solid #a855f7;&#10;}&#10;&#10;selector:hover {&#10;  transform: scale(1.05);&#10;}"></textarea>
                        </div>

                        <!-- PANE 3: ELEMENT HTML / SVG -->
                        <div class="ovb-code-pane" id="pane-el-html">
                            <div class="ovb-code-statusbar" style="flex-wrap:wrap;gap:6px;">
                                <span>🧩 Editando HTML / SVG de: <strong id="ovb-code-el-html-label" style="color:#38bdf8;font-family:monospace;">(Selecione um elemento ou insira um novo SVG)</strong></span>
                                <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;">
                                    <button type="button" id="ovb-btn-select-parent-svg" class="ovb-mini-btn" style="display:none;background:rgba(56,189,248,0.2);border-color:#38bdf8;color:#bae6fd;" title="Subir para a tag <svg> raiz deste vetor">⬆️ Selecionar &lt;svg&gt; Raiz</button>
                                    <button type="button" id="ovb-btn-upload-svg-file" class="ovb-mini-btn" style="background:rgba(168,85,247,0.22);border-color:#a855f7;color:#e9d5ff;" title="Carregar um arquivo .svg do computador">📂 Importar Arquivo .SVG</button>
                                    <input type="file" id="ovb-upload-svg-input" accept=".svg,image/svg+xml" style="display:none;">
                                    <button type="button" id="ovb-btn-insert-new-svg-block" class="ovb-mini-btn" style="background:rgba(16,185,129,0.2);border-color:#10b981;color:#a7f3d0;" title="Criar um novo elemento SVG/HTML arrastável na página com o código abaixo">➕ Inserir como Novo Bloco SVG</button>
                                    <button type="button" id="ovb-btn-apply-raw-html" class="ovb-mini-btn" style="background:rgba(59,130,246,0.25);border-color:#3b82f6;color:#bfdbfe;" title="Aplicar código HTML / SVG no elemento selecionado">✓ Aplicar no Elemento</button>
                                    <button type="button" id="ovb-btn-restore-el-html" class="ovb-mini-btn">↺ Restaurar Original</button>
                                </div>
                            </div>
                            <textarea id="ovb-code-el-html-editor" class="ovb-code-editor-textarea" spellcheck="false" placeholder="Cole aqui seu código <svg>...</svg> ou HTML para aplicar no elemento selecionado (funciona inclusive em tags <img>, <svg>, botões ou blocos), ou clique em '➕ Inserir como Novo Bloco SVG' para adicioná-lo na página..."></textarea>
                        </div>

                        <!-- PANE 4: FULL COMPILED CODE & PRESET EXPORT -->
                        <div class="ovb-code-pane" id="pane-compiled-export">
                            <div class="ovb-code-statusbar">
                                <span>💻 Este código reúne todo o CSS compilado + Predefinição JSON do tema (salvo automaticamente em <code>presets/odysseexp.json</code> e <code>assets/css/theme-preset-active.css</code>):</span>
                                <div style="display:flex;gap:6px;">
                                    <button type="button" id="ovb-btn-copy-compiled-css" class="ovb-mini-btn">📋 Copiar CSS Compilado</button>
                                    <button type="button" id="ovb-btn-copy-preset-json" class="ovb-mini-btn">📋 Copiar Preset JSON</button>
                                </div>
                            </div>
                            <textarea id="ovb-code-compiled-readonly" class="ovb-code-editor-textarea" readonly spellcheck="false"></textarea>
                        </div>
                    </div>
                </div>
            </main>
        </div>

        <!-- GERENCIADOR DE CORES (roda de cores para qualquer elemento, estilo ou variável do site) -->
        <div id="ovb-color-manager" class="ovb-cm-panel" style="display:none;">
            <div class="ovb-cm-head">
                <span><i class="fas fa-palette"></i> Gerenciador de Cores</span>
                <button type="button" class="ovb-cm-close" title="Fechar">&times;</button>
            </div>
            <div class="ovb-cm-body">
                <label class="ovb-label">Aplicar a cor em:</label>
                <select id="ovb-cm-target" class="ovb-select"></select>
                <div class="ovb-cm-current">
                    <span>Valor atual:</span> <code id="ovb-cm-current-val">—</code>
                    <button type="button" id="ovb-cm-clear" class="ovb-mini-btn" title="Remover a cor definida (volta ao padrão)">Limpar</button>
                </div>
                <div id="ovb-cm-picker-host"></div>
                <p id="ovb-cm-hint" class="ovb-cm-hint"></p>
            </div>
        </div>

        <div id="ovb-toast">Salvo com sucesso!</div>
    </div>
    <?php
}
