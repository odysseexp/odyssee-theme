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
        'presetName' => 'OdysseeXP',
        'uiStyle'    => 'odysseexp',
        'iconPack'   => 'default',
        'blankMode'  => false,
        'elements'   => array(),
        'blocks'     => array(),
        'domMoves'   => array(),
        'clones'     => array(),
        'globalVars' => array(
            'all'   => array(),
            'dark'  => array(),
            'light' => array(),
        ),
        'customCss'  => '',
        'customJs'   => '',
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
    return isset( $_GET['odyssee_vb_preview'] ) && $_GET['odyssee_vb_preview'] === '1' && current_user_can( 'manage_options' );
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
        '⚡ Odyssee Studio (Elementor)',
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
            'title' => 'Abrir o Editor Visual estilo Elementor do Tema Odyssee',
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
                '<div style="color:#f8fafc;font-weight:700;font-size:13px;margin-bottom:6px;">⚡ Odyssee Visual Studio (Estilo Elementor)</div>' +
                '<p style="color:#cbd5e1;font-size:11.5px;margin:0 0 10px 0;line-height:1.45;">Altere o Design System da página (Frutiger Aero, GTK4, Breeze, MacTahoe, Material 3 Expressive), programe CSS na lata, arraste elementos e exporte predefinições.</p>' +
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
        '26.10.5'
    );

    wp_enqueue_script(
        'odyssee-vb-admin',
        get_template_directory_uri() . '/inc/visual-builder-admin.js',
        array( 'jquery' ),
        '26.10.5',
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
        '26.10.5'
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

    wp_enqueue_script(
        'odyssee-vb-frontend',
        get_template_directory_uri() . '/assets/js/visual-builder-frontend.js',
        array( 'vanilla-tilt' ),
        '26.10.5',
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
        'presetName' => $preset_name,
        'uiStyle'    => $ui_style,
        'iconPack'   => $icon_pack,
        'blankMode'  => ! empty( $decoded['blankMode'] ),
        'elements'   => isset( $decoded['elements'] ) && is_array( $decoded['elements'] ) ? $decoded['elements'] : array(),
        'blocks'     => isset( $decoded['blocks'] ) && is_array( $decoded['blocks'] ) ? $decoded['blocks'] : array(),
        'domMoves'   => isset( $decoded['domMoves'] ) && is_array( $decoded['domMoves'] ) ? $decoded['domMoves'] : array(),
        'clones'     => isset( $decoded['clones'] ) && is_array( $decoded['clones'] ) ? $decoded['clones'] : array(),
        'globalVars' => isset( $decoded['globalVars'] ) && is_array( $decoded['globalVars'] ) ? $decoded['globalVars'] : array( 'all' => array(), 'dark' => array(), 'light' => array() ),
        'customCss'  => isset( $decoded['customCss'] ) ? wp_strip_all_tags( (string) $decoded['customCss'] ) : '',
        'customJs'   => isset( $decoded['customJs'] ) ? (string) $decoded['customJs'] : '',
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

    // 4. Write physical files to theme directory so changes reflect directly in the theme codebase (for Git / Gemini / export)
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
        . " * Este arquivo é sincronizado automaticamente ao salvar no Odyssee Studio e pode ser editado diretamente ou com o Gemini.\n"
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
    <div class="ovb-studio-app">
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
                    <button type="button" class="ovb-icon-btn ovb-device-btn active" data-device="desktop">
                        <i class="fas fa-desktop"></i>
                    </button>
                    <button type="button" class="ovb-icon-btn ovb-device-btn" data-device="tablet">
                        <i class="fas fa-tablet-alt"></i>
                    </button>
                    <button type="button" class="ovb-icon-btn ovb-device-btn" data-device="mobile">
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

                <button type="button" id="ovb-toggle-interactive" class="ovb-icon-btn" style="border:1px solid rgba(255,255,255,0.1);" title="Alternar entre Modo Seleção/Arrastar e Navegação Livre">
                    <i class="fas fa-mouse-pointer"></i> Navegar
                </button>

                <button type="button" id="ovb-toggle-code-drawer" class="ovb-icon-btn" style="border:1px solid #a855f7;color:#e9d5ff;background:rgba(168,85,247,0.16);font-weight:700;" title="Programar por Código — Editar CSS/HTML na lata e Exportar para o Gemini">
                    <i class="fas fa-terminal"></i> Código na Lata (CSS)
                </button>
            </div>

            <div class="ovb-topbar-right">
                <div class="ovb-btn-group">
                    <button type="button" id="ovb-btn-undo" class="ovb-icon-btn" title="Desfazer (Ctrl+Z)" disabled>
                        <i class="fas fa-undo"></i>
                    </button>
                    <button type="button" id="ovb-btn-redo" class="ovb-icon-btn" title="Refazer (Ctrl+Y)" disabled>
                        <i class="fas fa-redo"></i>
                    </button>
                </div>

                <button type="button" id="ovb-btn-save" class="ovb-save-btn">
                    <i class="fas fa-check-circle"></i> Salvar (<span id="ovb-active-preset-badge">OdysseeXP</span>)
                </button>
            </div>
        </header>

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
                        <button type="button" id="ovb-btn-select-parent" class="ovb-mini-btn" title="Selecionar Elemento Pai (Subir nível)">
                            ⬆ Pai
                        </button>
                        <button type="button" id="ovb-btn-reset-element" class="ovb-mini-btn" title="Resetar este elemento ao padrão original">
                            ↺ Reset
                        </button>
                    </div>
                </div>

                <!-- Context Bar: State/Device Bucket + Theme Scope -->
                <div class="ovb-context-bar">
                    <div style="display:flex;align-items:center;gap:5px;flex:1;">
                        <label for="ovb-state-bucket">Estado:</label>
                        <select id="ovb-state-bucket" class="ovb-select" style="padding:3px 6px !important;font-size:11px !important;">
                            <option value="desktop">🖥️ Normal (Padrão)</option>
                            <option value="hover">👆 Hover (Ao passar mouse)</option>
                            <option value="tablet">📱 Tablet (&le;1024px)</option>
                            <option value="mobile">📲 Mobile (&le;768px)</option>
                            <option value="dark">🌙 Somente Tema Escuro</option>
                            <option value="light">☀️ Somente Tema Claro</option>
                        </select>
                    </div>
                    <div style="display:flex;align-items:center;gap:5px;">
                        <label for="ovb-theme-scope" title="Em qual tema esta regra inteira se aplica">Tema:</label>
                        <select id="ovb-theme-scope" class="ovb-select" style="padding:3px 6px !important;font-size:11px !important;width:92px;">
                            <option value="all">Ambos</option>
                            <option value="dark">Só Escuro</option>
                            <option value="light">Só Claro</option>
                        </select>
                    </div>
                </div>

                <!-- 4 Main Elementor-Like Tabs -->
                <div class="ovb-tabs">
                    <button type="button" class="ovb-tab-btn" data-tab="tab-content">
                        <i class="fas fa-sliders-h"></i>
                        <span>Propriedades</span>
                    </button>
                    <button type="button" class="ovb-tab-btn active" data-tab="tab-style">
                        <i class="fas fa-arrows-alt"></i>
                        <span>Mover & Estilo</span>
                    </button>
                    <button type="button" class="ovb-tab-btn" data-tab="tab-effects">
                        <i class="fas fa-wand-magic-sparkles"></i>
                        <span>Efeitos & Glow</span>
                    </button>
                    <button type="button" class="ovb-tab-btn" data-tab="tab-layers">
                        <i class="fas fa-layer-group"></i>
                        <span>Elementos Base</span>
                    </button>
                </div>

                <!-- TAB PANELS -->
                <div class="ovb-panels">

                    <!-- ==========================================
                         TAB 1: PROPRIEDADES NATIVAS, CONTEÚDO & INSERIR BLOCOS
                         ========================================== -->
                    <div class="ovb-tab-panel" id="tab-content">
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-pen"></i> Textos, Imagens & Links do Elemento</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div class="ovb-field">
                                    <label class="ovb-label">Seletor CSS do Elemento</label>
                                    <div class="ovb-field-row">
                                        <input type="text" id="ovb-custom-selector-input" class="ovb-input" placeholder="Ex: .hero-slogan">
                                        <button type="button" id="ovb-btn-apply-selector" class="ovb-mini-btn">Selecionar</button>
                                    </div>
                                </div>

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

                                <!-- Shown only when a custom inserted block is selected -->
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

                        <!-- ALL HTML / SVG ATTRIBUTES INSPECTOR -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-tags"></i> Todos os Atributos HTML / SVG</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <p style="font-size:11px;color:#94a3b8;margin:0 0 6px 0;">Edite qualquer atributo nativo do elemento (ex: <code>data-tilt-max</code>, <code>viewBox</code>, <code>fill</code>, <code>class</code>):</p>
                                <div id="ovb-attrs-list"></div>
                                <div class="ovb-field-row" style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.07);">
                                    <input type="text" id="ovb-new-attr-name" class="ovb-input" placeholder="Atributo (ex: title)" style="width:42%;">
                                    <input type="text" id="ovb-new-attr-val" class="ovb-input" placeholder="Valor" style="flex:1;">
                                    <button type="button" id="ovb-btn-add-attr" class="ovb-mini-btn">＋</button>
                                </div>
                            </div>
                        </div>

                        <!-- ADD NEW WIDGETS / BLOCKS -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-cubes"></i> Inserir Novo Elemento / Widget</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div class="ovb-field">
                                    <label class="ovb-label">Posição em relação ao elemento selecionado:</label>
                                    <select id="ovb-insert-position" class="ovb-select">
                                        <option value="after">Abaixo do elemento selecionado (After)</option>
                                        <option value="before">Acima do elemento selecionado (Before)</option>
                                        <option value="append">Dentro — no final (Append)</option>
                                        <option value="prepend">Dentro — no início (Prepend)</option>
                                    </select>
                                </div>

                                <div class="ovb-widget-grid">
                                    <div class="ovb-widget-card" data-widget="heading">
                                        <i class="fas fa-heading"></i>
                                        <span>Título / Heading</span>
                                    </div>
                                    <div class="ovb-widget-card" data-widget="text">
                                        <i class="fas fa-align-left"></i>
                                        <span>Bloco de Texto</span>
                                    </div>
                                    <div class="ovb-widget-card" data-widget="button">
                                        <i class="fas fa-hand-pointer"></i>
                                        <span>Botão Criativo</span>
                                    </div>
                                    <div class="ovb-widget-card" data-widget="image">
                                        <i class="fas fa-image"></i>
                                        <span>Imagem / Arte</span>
                                    </div>
                                    <div class="ovb-widget-card" data-widget="card">
                                        <i class="fas fa-id-card"></i>
                                        <span>Card Glassmorphism</span>
                                    </div>
                                    <div class="ovb-widget-card" data-widget="shape-square">
                                        <i class="fas fa-vector-square"></i>
                                        <span>Quadrado Adaptativo</span>
                                    </div>
                                    <div class="ovb-widget-card" data-widget="shape-circle">
                                        <i class="fas fa-circle"></i>
                                        <span>Círculo Adaptativo</span>
                                    </div>
                                    <div class="ovb-widget-card" data-widget="shape-bar">
                                        <i class="fas fa-grip-lines"></i>
                                        <span>Barra / Painel</span>
                                    </div>
                                    <div class="ovb-widget-card" data-widget="shape-squircle">
                                        <i class="fas fa-shapes"></i>
                                        <span>Squircle / Orgânico</span>
                                    </div>
                                    <div class="ovb-widget-card" data-widget="glow-orb">
                                        <i class="fas fa-sun"></i>
                                        <span>Luz / Orbe de Glow</span>
                                    </div>
                                    <div class="ovb-widget-card" data-widget="divider">
                                        <i class="fas fa-minus"></i>
                                        <span>Divisor Neon</span>
                                    </div>
                                    <div class="ovb-widget-card" data-widget="html">
                                        <i class="fas fa-code"></i>
                                        <span>HTML / SVG Livre</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ==========================================
                         TAB 2: MOVER, LAYOUT, DESIGN SYSTEM DA PÁGINA & ESTILO COMPLETO
                         ========================================== -->
                    <div class="ovb-tab-panel active" id="tab-style">

                        <!-- 0. ESTILO GLOBAL DA PÁGINA (UI DESIGN SYSTEM) & PACOTE DE ÍCONES -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-swatchbook"></i> Estilo da Página (Design System UI & Ícones)</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <p style="font-size:11px;color:#cbd5e1;margin:0;line-height:1.4;">
                                    Transforma automaticamente <strong>botões, barras, cabeçalho, quadrados, círculos, cards, ícones e o scroll da página</strong>:
                                </p>

                                <div class="ovb-uistyle-grid">
                                    <div class="ovb-uistyle-card active" data-uistyle="odysseexp">
                                        <div class="ovb-uistyle-card-title">
                                            <span>⚡ OdysseeXP</span>
                                            <span style="font-size:9.5px;color:#c084fc;">Padrão</span>
                                        </div>
                                        <div class="ovb-uistyle-card-desc">Glassmorphism escuro, aura roxa/crimson e cantos suaves.</div>
                                        <div class="ovb-uistyle-swatch" style="background:linear-gradient(90deg,#8b5cf6,#ec4899);"></div>
                                    </div>

                                    <div class="ovb-uistyle-card" data-uistyle="frutiger-aero">
                                        <div class="ovb-uistyle-card-title">
                                            <span>🫧 Frutiger Aero</span>
                                        </div>
                                        <div class="ovb-uistyle-card-desc">Vidro glossy aqua, reflexo especular 3D, ciano/esmeralda e scroll glossy.</div>
                                        <div class="ovb-uistyle-swatch" style="background:linear-gradient(90deg,#00d4ff,#10b981);"></div>
                                    </div>

                                    <div class="ovb-uistyle-card" data-uistyle="gtk4">
                                        <div class="ovb-uistyle-card-title">
                                            <span>🐧 GTK4</span>
                                        </div>
                                        <div class="ovb-uistyle-card-desc">GNOME Libadwaita flat, headerbar limpa, anel de foco e scroll fino.</div>
                                        <div class="ovb-uistyle-swatch" style="background:linear-gradient(90deg,#3584e4,#62a0ea);"></div>
                                    </div>

                                    <div class="ovb-uistyle-card" data-uistyle="breeze">
                                        <div class="ovb-uistyle-card-title">
                                            <span>❄️ KDE Breeze</span>
                                        </div>
                                        <div class="ovb-uistyle-card-desc">Cantos precisos 5px, contorno highlight #3daee9 1px e scroll Plasma.</div>
                                        <div class="ovb-uistyle-swatch" style="background:linear-gradient(90deg,#3daee9,#1d99f3);"></div>
                                    </div>

                                    <div class="ovb-uistyle-card" data-uistyle="mactahoe">
                                        <div class="ovb-uistyle-card-title">
                                            <span>🍎 MacTahoe</span>
                                        </div>
                                        <div class="ovb-uistyle-card-desc">macOS Tahoe Liquid Glass, barra dock flutuante, blur profundo e refração.</div>
                                        <div class="ovb-uistyle-swatch" style="background:linear-gradient(90deg,#38bdf8,#a855f7);"></div>
                                    </div>

                                    <div class="ovb-uistyle-card" data-uistyle="material">
                                        <div class="ovb-uistyle-card-title">
                                            <span>📐 Material</span>
                                        </div>
                                        <div class="ovb-uistyle-card-desc">Material Design clássico, sombras Z-depth em camadas e superfície tátil.</div>
                                        <div class="ovb-uistyle-swatch" style="background:linear-gradient(90deg,#6200ee,#03dac6);"></div>
                                    </div>

                                    <div class="ovb-uistyle-card" data-uistyle="material-3-expressive" style="grid-column: span 2;">
                                        <div class="ovb-uistyle-card-title">
                                            <span>🌸 Material 3 Expressive (Material You)</span>
                                            <span style="font-size:9.5px;color:#f472b6;">Morphing</span>
                                        </div>
                                        <div class="ovb-uistyle-card-desc">Formas super-arredondadas (32px/pílula) que mudam de raio no hover com física elástica e containers tonais.</div>
                                        <div class="ovb-uistyle-swatch" style="background:linear-gradient(90deg,#d0bcff,#f472b6,#38bdf8);"></div>
                                    </div>
                                </div>

                                <div class="ovb-field" style="margin-top:6px;">
                                    <label class="ovb-label">✨ Pacote de Ícones do Tema (Icon Pack):</label>
                                    <select id="ovb-iconpack-select" class="ovb-select">
                                        <option value="default">Padrão do Tema (Automático conforme o Estilo UI)</option>
                                        <option value="glossy-3d">🫧 Aero 3D Glossy (Reflexo vítreo + sombra profunda)</option>
                                        <option value="symbolic-thin">🐧 Symbolic Thin (Traço fino monocromático GTK4 / Breeze)</option>
                                        <option value="neon-glow">⚡ Cyber Neon Glow (Brilho neon intenso nos ícones)</option>
                                        <option value="tonal-pill">🌸 Tonal Squircle Badge (Pastilha arredondada M3 / Tahoe)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- 1. MOVER ELEMENTO, ESCALA & ORDEM NA PÁGINA -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-arrows-alt"></i> Mover, Posição Livre (X/Y) & Ordem</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <p style="font-size:11px;color:#a78bfa;margin:0;line-height:1.4;">
                                    💡 <strong>Dica:</strong> Você pode clicar e <strong>arrastar qualquer elemento diretamente com o mouse no preview</strong> ao lado, ou ajustar milimetricamente abaixo:
                                </p>

                                <div class="ovb-field">
                                    <label class="ovb-label">Posição Horizontal Livre — Eixo X (px)</label>
                                    <div class="ovb-slider-wrap">
                                        <input type="range" class="ovb-range" data-ovb-range-for="translateX" data-unit="px" min="-800" max="800" step="1" data-default="0">
                                        <input type="text" class="ovb-num-input" data-ovb-prop="translateX" placeholder="0px">
                                    </div>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">Posição Vertical Livre — Eixo Y (px)</label>
                                    <div class="ovb-slider-wrap">
                                        <input type="range" class="ovb-range" data-ovb-range-for="translateY" data-unit="px" min="-800" max="800" step="1" data-default="0">
                                        <input type="text" class="ovb-num-input" data-ovb-prop="translateY" placeholder="0px">
                                    </div>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">Escala / Tamanho Proporcional (Scale)</label>
                                    <div class="ovb-slider-wrap">
                                        <input type="range" class="ovb-range" data-ovb-range-for="scale" min="0.1" max="3" step="0.02" data-default="1">
                                        <input type="number" step="0.02" class="ovb-num-input" data-ovb-prop="scale" placeholder="1">
                                    </div>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">Rotação / Giro (°)</label>
                                    <div class="ovb-slider-wrap">
                                        <input type="range" class="ovb-range" data-ovb-range-for="rotate" data-unit="deg" min="-180" max="180" step="1" data-default="0">
                                        <input type="text" class="ovb-num-input" data-ovb-prop="rotate" placeholder="0deg">
                                    </div>
                                </div>

                                <div class="ovb-field-row" style="gap:6px;margin-top:4px;">
                                    <button type="button" id="ovb-btn-dom-up" class="ovb-mini-btn" style="flex:1;" title="Mover este elemento para cima na ordem do HTML">
                                        ▲ Subir Ordem
                                    </button>
                                    <button type="button" id="ovb-btn-dom-down" class="ovb-mini-btn" style="flex:1;" title="Mover este elemento para baixo na ordem do HTML">
                                        ▼ Descer Ordem
                                    </button>
                                    <button type="button" id="ovb-btn-center-xy" class="ovb-mini-btn" style="flex:1;" title="Zerar deslocamento X e Y">
                                        🎯 Zerar X/Y
                                    </button>
                                </div>

                                <div class="ovb-field-row" style="gap:6px;margin-top:4px;">
                                    <button type="button" id="ovb-btn-duplicate-el" class="ovb-action-btn" style="flex:1;">
                                        <i class="fas fa-copy"></i> Duplicar Elemento
                                    </button>
                                    <label class="ovb-mini-btn" style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;padding:6px 10px;">
                                        <input type="checkbox" data-ovb-prop="hidden">
                                        <span>👁️ Ocultar</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <!-- 2. TIPOGRAFIA & VETOR SVG -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-font"></i> Tipografia, Cores & Vetor SVG</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div class="ovb-field">
                                    <label class="ovb-label">Cor Principal / Texto (color / currentColor)</label>
                                    <div class="ovb-color-wrap">
                                        <input type="color" class="ovb-color-picker" data-ovb-prop="color" value="#f8fafc">
                                        <input type="text" class="ovb-input" data-ovb-prop="color" placeholder="Ex: #ffffff ou var(--color-title)">
                                    </div>
                                </div>

                                <div class="ovb-field-row">
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Preenchimento SVG (fill)</label>
                                        <div class="ovb-color-wrap">
                                            <input type="color" class="ovb-color-picker" data-ovb-prop="fill" value="#8b5cf6">
                                            <input type="text" class="ovb-input" data-ovb-prop="fill" placeholder="currentColor">
                                        </div>
                                    </div>
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Traçado SVG (stroke)</label>
                                        <div class="ovb-color-wrap">
                                            <input type="color" class="ovb-color-picker" data-ovb-prop="stroke" value="#d946ef">
                                            <input type="text" class="ovb-input" data-ovb-prop="stroke" placeholder="none">
                                        </div>
                                    </div>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">
                                        <span>Texto em Gradiente</span>
                                        <input type="checkbox" data-ovb-prop="textGradientEnabled">
                                    </label>
                                    <div class="ovb-field-row">
                                        <input type="color" class="ovb-color-picker" data-ovb-prop="textGradientColor1" value="#a855f7" title="Cor Inicial">
                                        <input type="color" class="ovb-color-picker" data-ovb-prop="textGradientColor2" value="#ec4899" title="Cor Final">
                                        <input type="number" class="ovb-num-input" data-ovb-prop="textGradientAngle" placeholder="135°" title="Ângulo (graus)">
                                    </div>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">Família da Fonte</label>
                                    <select class="ovb-select" data-ovb-prop="fontFamily">
                                        <option value="">Padrão do Tema</option>
                                        <option value="'Ubuntu', sans-serif">Ubuntu (Nativa Odyssee)</option>
                                        <option value="system-ui, -apple-system, sans-serif">System UI Sans</option>
                                        <option value="Georgia, serif">Georgia Serif</option>
                                        <option value="'Courier New', monospace">Monospace</option>
                                    </select>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">Tamanho da Fonte</label>
                                    <div class="ovb-slider-wrap">
                                        <input type="range" class="ovb-range" data-ovb-range-for="fontSize" data-unit="px" min="10" max="120" step="1" data-default="16">
                                        <input type="text" class="ovb-num-input" data-ovb-prop="fontSize" placeholder="px/rem">
                                    </div>
                                </div>

                                <div class="ovb-field-row">
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Peso (Weight)</label>
                                        <select class="ovb-select" data-ovb-prop="fontWeight">
                                            <option value="">Padrão</option>
                                            <option value="300">300 (Light)</option>
                                            <option value="400">400 (Normal)</option>
                                            <option value="500">500 (Medium)</option>
                                            <option value="600">600 (Semi-Bold)</option>
                                            <option value="700">700 (Bold)</option>
                                            <option value="800">800 (Extra-Bold)</option>
                                            <option value="900">900 (Black)</option>
                                        </select>
                                    </div>
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Alinhamento</label>
                                        <select class="ovb-select" data-ovb-prop="textAlign">
                                            <option value="">Padrão</option>
                                            <option value="left">Esquerda</option>
                                            <option value="center">Centro</option>
                                            <option value="right">Direita</option>
                                            <option value="justify">Justificado</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="ovb-field-row">
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Altura de Linha</label>
                                        <input type="text" class="ovb-input" data-ovb-prop="lineHeight" placeholder="Ex: 1.4">
                                    </div>
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Espaçamento Letras</label>
                                        <input type="text" class="ovb-input" data-ovb-prop="letterSpacing" placeholder="Ex: 2px">
                                    </div>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">Transformação</label>
                                    <select class="ovb-select" data-ovb-prop="textTransform">
                                        <option value="">Padrão</option>
                                        <option value="uppercase">MAIÚSCULAS (Uppercase)</option>
                                        <option value="lowercase">minúsculas (Lowercase)</option>
                                        <option value="capitalize">Capitalizado</option>
                                        <option value="none">Nenhuma</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- 3. LAYOUT, FLEXBOX, DIMENSÕES & ESPAÇAMENTO -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-expand-arrows-alt"></i> Dimensões, Flexbox & Espaçamento</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div class="ovb-field-row">
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Largura (Width)</label>
                                        <input type="text" class="ovb-input" data-ovb-prop="width" placeholder="auto / px / %">
                                    </div>
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Altura (Height)</label>
                                        <input type="text" class="ovb-input" data-ovb-prop="height" placeholder="auto / px">
                                    </div>
                                </div>

                                <div class="ovb-field-row">
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Largura Máx.</label>
                                        <input type="text" class="ovb-input" data-ovb-prop="maxWidth" placeholder="none / px">
                                    </div>
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Altura Mín.</label>
                                        <input type="text" class="ovb-input" data-ovb-prop="minHeight" placeholder="0px">
                                    </div>
                                </div>

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
                                            <option value="row-reverse">Linha Inversa</option>
                                            <option value="column-reverse">Coluna Inversa</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="ovb-field-row">
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Justify Content</label>
                                        <select class="ovb-select" data-ovb-prop="justifyContent">
                                            <option value="">Padrão</option>
                                            <option value="flex-start">Início (Start)</option>
                                            <option value="center">Centro</option>
                                            <option value="flex-end">Fim (End)</option>
                                            <option value="space-between">Space Between</option>
                                            <option value="space-around">Space Around</option>
                                        </select>
                                    </div>
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Align Items</label>
                                        <select class="ovb-select" data-ovb-prop="alignItems">
                                            <option value="">Padrão</option>
                                            <option value="stretch">Stretch</option>
                                            <option value="flex-start">Início (Start)</option>
                                            <option value="center">Centro</option>
                                            <option value="flex-end">Fim (End)</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="ovb-field-row">
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Gap (Espaço entre itens)</label>
                                        <input type="text" class="ovb-input" data-ovb-prop="gap" placeholder="Ex: 16px">
                                    </div>
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Z-Index (Camada)</label>
                                        <input type="number" class="ovb-input" data-ovb-prop="zIndex" placeholder="Auto">
                                    </div>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">Margem Externa (Margin)</label>
                                    <div class="ovb-box-grid">
                                        <div class="ovb-box-cell">
                                            <input type="text" data-ovb-prop="marginTop" placeholder="-">
                                            <span>Topo</span>
                                        </div>
                                        <div class="ovb-box-cell">
                                            <input type="text" data-ovb-prop="marginRight" placeholder="-">
                                            <span>Dir</span>
                                        </div>
                                        <div class="ovb-box-cell">
                                            <input type="text" data-ovb-prop="marginBottom" placeholder="-">
                                            <span>Baixo</span>
                                        </div>
                                        <div class="ovb-box-cell">
                                            <input type="text" data-ovb-prop="marginLeft" placeholder="-">
                                            <span>Esq</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">Preenchimento Interno (Padding)</label>
                                    <div class="ovb-box-grid">
                                        <div class="ovb-box-cell">
                                            <input type="text" data-ovb-prop="paddingTop" placeholder="-">
                                            <span>Topo</span>
                                        </div>
                                        <div class="ovb-box-cell">
                                            <input type="text" data-ovb-prop="paddingRight" placeholder="-">
                                            <span>Dir</span>
                                        </div>
                                        <div class="ovb-box-cell">
                                            <input type="text" data-ovb-prop="paddingBottom" placeholder="-">
                                            <span>Baixo</span>
                                        </div>
                                        <div class="ovb-box-cell">
                                            <input type="text" data-ovb-prop="paddingLeft" placeholder="-">
                                            <span>Esq</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 4. FUNDO, GLASSMORPHISM & BORDAS -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-fill-drip"></i> Fundo, Glassmorphism & Bordas</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div class="ovb-field">
                                    <label class="ovb-label">Cor de Fundo</label>
                                    <div class="ovb-color-wrap">
                                        <input type="color" class="ovb-color-picker" data-ovb-prop="backgroundColor" value="#131926">
                                        <input type="text" class="ovb-input" data-ovb-prop="backgroundColor" placeholder="Ex: rgba(19,25,38,0.75)">
                                    </div>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">
                                        <span>Fundo em Gradiente</span>
                                        <input type="checkbox" data-ovb-prop="bgGradientEnabled">
                                    </label>
                                    <div class="ovb-field-row">
                                        <input type="color" class="ovb-color-picker" data-ovb-prop="bgGradientColor1" value="#8b5cf6">
                                        <input type="color" class="ovb-color-picker" data-ovb-prop="bgGradientColor2" value="#ec4899">
                                        <select class="ovb-select" data-ovb-prop="bgGradientType" style="width:85px;">
                                            <option value="linear">Linear</option>
                                            <option value="radial">Radial</option>
                                        </select>
                                        <input type="number" class="ovb-num-input" data-ovb-prop="bgGradientAngle" placeholder="135°">
                                    </div>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">Imagem de Fundo</label>
                                    <div class="ovb-field-row">
                                        <input type="text" id="ovb-bg-image-input" class="ovb-input" data-ovb-prop="bgImage" placeholder="URL da imagem">
                                        <button type="button" class="ovb-mini-btn ovb-media-btn" data-target="#ovb-bg-image-input">Mídia</button>
                                    </div>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">Backdrop Blur (Glassmorphism)</label>
                                    <div class="ovb-slider-wrap">
                                        <input type="range" class="ovb-range" data-ovb-range-for="backdropBlur" min="0" max="40" step="1" data-default="0">
                                        <input type="number" class="ovb-num-input" data-ovb-prop="backdropBlur" placeholder="0px">
                                    </div>
                                </div>

                                <div class="ovb-field-row">
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Estilo da Borda</label>
                                        <select class="ovb-select" data-ovb-prop="borderStyle">
                                            <option value="">Padrão</option>
                                            <option value="none">Sem Borda</option>
                                            <option value="solid">Sólida</option>
                                            <option value="dashed">Tracejada</option>
                                            <option value="dotted">Pontilhada</option>
                                            <option value="double">Dupla</option>
                                        </select>
                                    </div>
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Espessura</label>
                                        <input type="text" class="ovb-input" data-ovb-prop="borderWidth" placeholder="Ex: 1px">
                                    </div>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">Cor da Borda</label>
                                    <div class="ovb-color-wrap">
                                        <input type="color" class="ovb-color-picker" data-ovb-prop="borderColor" value="#8b5cf6">
                                        <input type="text" class="ovb-input" data-ovb-prop="borderColor" placeholder="rgba(139,92,246,0.5)">
                                    </div>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">Arredondamento (Border Radius)</label>
                                    <div class="ovb-slider-wrap">
                                        <input type="range" class="ovb-range" data-ovb-range-for="borderRadius" data-unit="px" min="0" max="100" step="1" data-default="0">
                                        <input type="text" class="ovb-num-input" data-ovb-prop="borderRadius" placeholder="0px">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 5. INSPETOR COMPLETO DE PROPRIEDADES CSS COMPUTADAS -->
                        <div class="ovb-section collapsed">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-microscope"></i> Inspetor de Todas as Propriedades CSS</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <p style="font-size:11px;color:#94a3b8;margin:0 0 6px 0;">Veja os estilos computados atuais do elemento ou adicione qualquer propriedade CSS diretamente:</p>
                                <div id="ovb-computed-inspector-list"></div>
                                <div class="ovb-field-row" style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.07);">
                                    <input type="text" id="ovb-new-css-prop" class="ovb-input" placeholder="Propriedade (ex: aspect-ratio)" style="width:48%;">
                                    <input type="text" id="ovb-new-css-val" class="ovb-input" placeholder="Valor (ex: 16/9)" style="flex:1;">
                                    <button type="button" id="ovb-btn-add-raw-css" class="ovb-mini-btn">＋</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ==========================================
                         TAB 3: EFEITOS, GLOW, BLEND MODES & ANIMAÇÕES
                         ========================================== -->
                    <div class="ovb-tab-panel" id="tab-effects">

                        <!-- 1. EFEITO DE GLOW / NEON -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-bolt"></i> Efeito de Glow / Neon</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div class="ovb-field-row">
                                    <label class="ovb-label" style="font-weight:700;color:#f8fafc;">Ativar Efeito de Glow</label>
                                    <input type="checkbox" data-ovb-prop="glowEnabled" style="transform:scale(1.2);accent-color:#a855f7;">
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">Presets Rápidos de Glow:</label>
                                    <div class="ovb-preset-pills">
                                        <button type="button" class="ovb-pill ovb-glow-preset" data-c1="#8b5cf6" data-c2="#d946ef" data-mode="box" data-blur="26">🟣 Roxo Odyssee</button>
                                        <button type="button" class="ovb-pill ovb-glow-preset" data-c1="#ef4444" data-c2="#f43f5e" data-mode="box" data-blur="26">🔴 Vermelho Crimson</button>
                                        <button type="button" class="ovb-pill ovb-glow-preset" data-c1="#a855f7" data-c2="#38bdf8" data-mode="drop-shadow" data-blur="22">✨ Contorno PNG/SVG</button>
                                        <button type="button" class="ovb-pill ovb-glow-preset" data-c1="#c084fc" data-c2="#f472b6" data-mode="text" data-blur="18">🔤 Texto Neon</button>
                                        <button type="button" class="ovb-pill ovb-glow-preset" data-c1="#38bdf8" data-c2="#818cf8" data-mode="box" data-blur="32">🔵 Cyber Blue</button>
                                    </div>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">Modo do Glow</label>
                                    <select class="ovb-select" data-ovb-prop="glowMode">
                                        <option value="box">Box Glow (Ao redor de caixas, cards e botões)</option>
                                        <option value="drop-shadow">Drop-Shadow Glow (Contorno exato de PNG/SVG transparente e Logos)</option>
                                        <option value="text">Text Neon Glow (Brilho direto nas letras/títulos)</option>
                                        <option value="inset">Inner Glow (Brilho interno dentro da borda)</option>
                                    </select>
                                </div>

                                <div class="ovb-field-row">
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Cor Principal</label>
                                        <div class="ovb-color-wrap">
                                            <input type="color" class="ovb-color-picker" data-ovb-prop="glowColor" value="#8b5cf6">
                                            <input type="text" class="ovb-input" data-ovb-prop="glowColor" placeholder="#8b5cf6">
                                        </div>
                                    </div>
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Cor Secundária (Aura)</label>
                                        <div class="ovb-color-wrap">
                                            <input type="color" class="ovb-color-picker" data-ovb-prop="glowColor2" value="#d946ef">
                                            <input type="text" class="ovb-input" data-ovb-prop="glowColor2" placeholder="#d946ef">
                                        </div>
                                    </div>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">Intensidade do Brilho (%)</label>
                                    <div class="ovb-slider-wrap">
                                        <input type="range" class="ovb-range" data-ovb-range-for="glowIntensity" min="5" max="100" step="1" data-default="75">
                                        <input type="number" class="ovb-num-input" data-ovb-prop="glowIntensity" placeholder="75">
                                    </div>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">Raio de Difusão / Blur (px)</label>
                                    <div class="ovb-slider-wrap">
                                        <input type="range" class="ovb-range" data-ovb-range-for="glowBlur" min="2" max="140" step="1" data-default="24">
                                        <input type="number" class="ovb-num-input" data-ovb-prop="glowBlur" placeholder="24">
                                    </div>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">Expansão / Spread (px)</label>
                                    <div class="ovb-slider-wrap">
                                        <input type="range" class="ovb-range" data-ovb-range-for="glowSpread" min="-20" max="60" step="1" data-default="0">
                                        <input type="number" class="ovb-num-input" data-ovb-prop="glowSpread" placeholder="0">
                                    </div>
                                </div>

                                <div class="ovb-field-row">
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Camadas de Neon</label>
                                        <select class="ovb-select" data-ovb-prop="glowLayers">
                                            <option value="1">1x (Suave)</option>
                                            <option value="2">2x (Duplo Neon)</option>
                                            <option value="3">3x (Ultra Intenso)</option>
                                        </select>
                                    </div>
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Animação do Glow</label>
                                        <select class="ovb-select" data-ovb-prop="glowAnim">
                                            <option value="none">Estático</option>
                                            <option value="pulse">Pulsante (Respiração)</option>
                                            <option value="flicker">Cintilante (Neon Flicker)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 2. EFEITOS DE CAMADA / BLEND MODES -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-clone"></i> Efeitos de Camada (Blend Modes)</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div class="ovb-field">
                                    <label class="ovb-label">Atalhos de Mesclagem:</label>
                                    <div class="ovb-preset-pills">
                                        <button type="button" class="ovb-pill ovb-blend-pill active" data-blend="normal">Normal</button>
                                        <button type="button" class="ovb-pill ovb-blend-pill" data-blend="plus-lighter">Add (Adição)</button>
                                        <button type="button" class="ovb-pill ovb-blend-pill" data-blend="svg-subtract">Subtract (Subtração)</button>
                                        <button type="button" class="ovb-pill ovb-blend-pill" data-blend="lighten">Lighten</button>
                                        <button type="button" class="ovb-pill ovb-blend-pill" data-blend="screen">Screen</button>
                                        <button type="button" class="ovb-pill ovb-blend-pill" data-blend="multiply">Multiply</button>
                                        <button type="button" class="ovb-pill ovb-blend-pill" data-blend="overlay">Overlay</button>
                                        <button type="button" class="ovb-pill ovb-blend-pill" data-blend="saturation">Saturation</button>
                                        <button type="button" class="ovb-pill ovb-blend-pill" data-blend="color">Color</button>
                                        <button type="button" class="ovb-pill ovb-blend-pill" data-blend="difference">Difference</button>
                                    </div>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">Modo de Mesclagem do Elemento (Mix Blend Mode)</label>
                                    <select class="ovb-select" data-ovb-prop="blendMode">
                                        <option value="normal">Normal (Padrão)</option>
                                        <optgroup label="Adição e Clareamento (Luz)">
                                            <option value="plus-lighter">Add / Linear Dodge (plus-lighter)</option>
                                            <option value="lighten">Lighten (Clarear)</option>
                                            <option value="screen">Screen (Tela / Divisão Suave)</option>
                                            <option value="color-dodge">Color Dodge (Subexposição de Cor)</option>
                                        </optgroup>
                                        <optgroup label="Subtração, Inversão e Escurecimento">
                                            <option value="svg-subtract">Subtract (Subtração de Canais)</option>
                                            <option value="difference">Difference (Diferença / Subtração Absoluta)</option>
                                            <option value="exclusion">Exclusion (Exclusão Suave)</option>
                                            <option value="darken">Darken (Escurecer)</option>
                                            <option value="multiply">Multiply (Multiplicação)</option>
                                            <option value="color-burn">Color Burn (Superexposição de Cor)</option>
                                        </optgroup>
                                        <optgroup label="Contraste e Textura">
                                            <option value="overlay">Overlay (Sobreposição)</option>
                                            <option value="soft-light">Soft Light (Luz Suave)</option>
                                            <option value="hard-light">Hard Light (Luz Direta)</option>
                                        </optgroup>
                                        <optgroup label="Componentes de Cor (HSL)">
                                            <option value="hue">Hue (Matiz)</option>
                                            <option value="saturation">Saturation (Saturação)</option>
                                            <option value="color">Color (Cor — Matiz + Saturação)</option>
                                            <option value="luminosity">Luminosity (Luminosidade)</option>
                                        </optgroup>
                                    </select>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">Mesclagem do Fundo Interno (Background Blend Mode)</label>
                                    <select class="ovb-select" data-ovb-prop="bgBlendMode">
                                        <option value="">Normal</option>
                                        <option value="multiply">Multiply</option>
                                        <option value="screen">Screen</option>
                                        <option value="overlay">Overlay</option>
                                        <option value="darken">Darken</option>
                                        <option value="lighten">Lighten</option>
                                        <option value="color-dodge">Color Dodge</option>
                                        <option value="color-burn">Color Burn</option>
                                        <option value="hard-light">Hard Light</option>
                                        <option value="soft-light">Soft Light</option>
                                        <option value="difference">Difference</option>
                                        <option value="exclusion">Exclusion</option>
                                        <option value="hue">Hue</option>
                                        <option value="saturation">Saturation</option>
                                        <option value="color">Color</option>
                                        <option value="luminosity">Luminosity</option>
                                    </select>
                                </div>

                                <!-- EXTRA LAYER OVERLAY -->
                                <div style="padding-top:8px;border-top:1px solid rgba(255,255,255,0.08);">
                                    <div class="ovb-field-row" style="margin-bottom:8px;">
                                        <label class="ovb-label" style="color:#c084fc;font-weight:700;">Camada Extra de Sobreposição (Overlay)</label>
                                        <input type="checkbox" data-ovb-prop="overlayEnabled">
                                    </div>
                                    <div class="ovb-field-row">
                                        <input type="color" class="ovb-color-picker" data-ovb-prop="overlayColor" value="#8b5cf6" title="Cor 1 da Camada">
                                        <input type="color" class="ovb-color-picker" data-ovb-prop="overlayColor2" value="#ec4899" title="Cor 2 da Camada">
                                        <select class="ovb-select" data-ovb-prop="overlayBlendMode" style="flex:1;">
                                            <option value="overlay">Overlay</option>
                                            <option value="plus-lighter">Add (Adição)</option>
                                            <option value="difference">Subtract / Difference</option>
                                            <option value="lighten">Lighten</option>
                                            <option value="screen">Screen</option>
                                            <option value="multiply">Multiply</option>
                                            <option value="color">Color</option>
                                            <option value="saturation">Saturation</option>
                                            <option value="soft-light">Soft Light</option>
                                        </select>
                                    </div>
                                    <div class="ovb-field" style="margin-top:6px;">
                                        <label class="ovb-label">Opacidade da Camada Extra (%)</label>
                                        <div class="ovb-slider-wrap">
                                            <input type="range" class="ovb-range" data-ovb-range-for="overlayOpacity" min="0" max="100" step="1" data-default="50">
                                            <input type="number" class="ovb-num-input" data-ovb-prop="overlayOpacity" placeholder="50">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 3. ANIMAÇÕES (ENTRADA, LOOP CONTÍNUO, HOVER & 3D TILT) -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-film"></i> Animações & Interatividade 3D</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div class="ovb-field">
                                    <label class="ovb-label">Animação de Entrada (No Scroll)</label>
                                    <select class="ovb-select" data-ovb-prop="entranceAnim">
                                        <option value="none">Nenhuma</option>
                                        <option value="ovbFadeIn">Fade In (Suave)</option>
                                        <option value="ovbFadeInUp">Fade In Up (Subindo)</option>
                                        <option value="ovbFadeInDown">Fade In Down (Descendo)</option>
                                        <option value="ovbFadeInLeft">Fade In Left (Vindo da Esquerda)</option>
                                        <option value="ovbFadeInRight">Fade In Right (Vindo da Direita)</option>
                                        <option value="ovbZoomIn">Zoom In (Escala Crescente)</option>
                                        <option value="ovbZoomOut">Zoom Out (Escala Decrescente)</option>
                                        <option value="ovbBlurIn">Blur In (Foco Cinematográfico)</option>
                                        <option value="ovbBounceIn">Bounce In (Salto Elástico)</option>
                                        <option value="ovbElasticPop">Elastic Pop (Pop Dinâmico)</option>
                                        <option value="ovbFlipX">Flip 3D Horizontal (RotateX)</option>
                                        <option value="ovbFlipY">Flip 3D Vertical (RotateY)</option>
                                        <option value="ovbSlideUpReveal">Slide Up Reveal (Inclinação)</option>
                                        <option value="ovbGlitchIn">Cyber Glitch Entrance</option>
                                    </select>
                                </div>

                                <div class="ovb-field-row">
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Duração</label>
                                        <input type="text" class="ovb-input" data-ovb-prop="entranceDuration" placeholder="0.75s">
                                    </div>
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Atraso (Delay)</label>
                                        <input type="text" class="ovb-input" data-ovb-prop="entranceDelay" placeholder="0s">
                                    </div>
                                </div>

                                <div class="ovb-field-row">
                                    <label class="ovb-label">Repetir toda vez que rolar a página</label>
                                    <input type="checkbox" data-ovb-prop="entranceRepeat">
                                </div>

                                <button type="button" id="ovb-btn-test-anim" class="ovb-action-btn">
                                    <i class="fas fa-play"></i> Testar Animação de Entrada Agora
                                </button>

                                <hr style="border:0;height:1px;background:rgba(255,255,255,0.08);margin:6px 0;">

                                <div class="ovb-field">
                                    <label class="ovb-label">Animação Contínua (Loop Infinito)</label>
                                    <select class="ovb-select" data-ovb-prop="loopAnim">
                                        <option value="none">Nenhuma</option>
                                        <option value="ovbLoopFloat">Flutuar Suavemente (Floating)</option>
                                        <option value="ovbLoopLevitate">Levitar com Rotação (3D Levitate)</option>
                                        <option value="ovbLoopPulse">Pulsar (Heartbeat Scale)</option>
                                        <option value="ovbLoopBreathe">Respiração Luminosa (Breathe)</option>
                                        <option value="ovbLoopSwing">Pêndulo / Balanço (Swing)</option>
                                        <option value="ovbLoopSpin">Rotação 360° Contínua (Spin)</option>
                                        <option value="ovbLoopJitter">Vibração Energética (Jitter)</option>
                                    </select>
                                </div>

                                <div class="ovb-field-row">
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Velocidade do Ciclo</label>
                                        <input type="text" class="ovb-input" data-ovb-prop="loopDuration" placeholder="3.2s">
                                    </div>
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Amplitude</label>
                                        <input type="text" class="ovb-input" data-ovb-prop="loopIntensity" placeholder="12px">
                                    </div>
                                </div>

                                <hr style="border:0;height:1px;background:rgba(255,255,255,0.08);margin:6px 0;">

                                <div class="ovb-field">
                                    <label class="ovb-label">Efeito Rápido de Hover (Ao passar o mouse)</label>
                                    <select class="ovb-select" data-ovb-prop="hoverPreset">
                                        <option value="none">Nenhum</option>
                                        <option value="ovb-hover-lift">Levantar (Lift Up)</option>
                                        <option value="ovb-hover-grow">Crescer (Scale Grow)</option>
                                        <option value="ovb-hover-shrink">Encolher (Scale Shrink)</option>
                                        <option value="ovb-hover-tilt">Inclinar (Rotate Tilt)</option>
                                        <option value="ovb-hover-glow-boost">Intensificar Brilho (Glow Boost)</option>
                                    </select>
                                </div>

                                <div class="ovb-field-row" style="margin-top:4px;">
                                    <label class="ovb-label" style="color:#38bdf8;font-weight:700;">Ativar 3D Tilt Interativo (Mouse Parallax)</label>
                                    <input type="checkbox" data-ovb-prop="tiltEnabled">
                                </div>
                                <div class="ovb-field-row">
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Ângulo Máx (°)</label>
                                        <input type="number" class="ovb-input" data-ovb-prop="tiltMax" placeholder="15">
                                    </div>
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Reflexo (Glare)</label>
                                        <input type="checkbox" data-ovb-prop="tiltGlare">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 4. FILTROS CSS -->
                        <div class="ovb-section collapsed">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-adjust"></i> Filtros de Cor, Opacidade & 3D</span>
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
                                    <label class="ovb-label">Desfoque / Blur (px)</label>
                                    <div class="ovb-slider-wrap">
                                        <input type="range" class="ovb-range" data-ovb-range-for="filterBlur" min="0" max="30" step="0.5" data-default="0">
                                        <input type="number" class="ovb-num-input" data-ovb-prop="filterBlur" placeholder="0">
                                    </div>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">Brilho / Brightness (%)</label>
                                    <div class="ovb-slider-wrap">
                                        <input type="range" class="ovb-range" data-ovb-range-for="filterBrightness" min="0" max="250" step="1" data-default="100">
                                        <input type="number" class="ovb-num-input" data-ovb-prop="filterBrightness" placeholder="100">
                                    </div>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">Contraste (%)</label>
                                    <div class="ovb-slider-wrap">
                                        <input type="range" class="ovb-range" data-ovb-range-for="filterContrast" min="0" max="250" step="1" data-default="100">
                                        <input type="number" class="ovb-num-input" data-ovb-prop="filterContrast" placeholder="100">
                                    </div>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">Saturação (%)</label>
                                    <div class="ovb-slider-wrap">
                                        <input type="range" class="ovb-range" data-ovb-range-for="filterSaturate" min="0" max="300" step="1" data-default="100">
                                        <input type="number" class="ovb-num-input" data-ovb-prop="filterSaturate" placeholder="100">
                                    </div>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">Rotação de Matiz / Hue-Rotate (°)</label>
                                    <div class="ovb-slider-wrap">
                                        <input type="range" class="ovb-range" data-ovb-range-for="filterHue" min="-180" max="180" step="1" data-default="0">
                                        <input type="number" class="ovb-num-input" data-ovb-prop="filterHue" placeholder="0">
                                    </div>
                                </div>

                                <div class="ovb-field-row">
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Rotação 3D X (°)</label>
                                        <input type="number" class="ovb-input" data-ovb-prop="rotateX" placeholder="0">
                                    </div>
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Rotação 3D Y (°)</label>
                                        <input type="number" class="ovb-input" data-ovb-prop="rotateY" placeholder="0">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 5. CSS PERSONALIZADO DO ELEMENTO -->
                        <div class="ovb-section collapsed">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-code"></i> CSS Personalizado do Elemento</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div class="ovb-field">
                                    <label class="ovb-label">Use <code>selector</code> para se referir ao elemento atual:</label>
                                    <textarea id="ovb-element-custom-css" class="ovb-textarea" rows="4" style="font-family:monospace;font-size:11px;" placeholder="selector {&#10;  /* Seu código CSS aqui */&#10;}"></textarea>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ==========================================
                         TAB 4: TODOS OS ELEMENTOS BASE DO SITE, CORES GLOBAIS & BACKUP
                         ========================================== -->
                    <div class="ovb-tab-panel" id="tab-layers">
                        <!-- FULL BASE ELEMENTS TREE -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-sitemap"></i> Todos os Elementos Base da Página</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <input type="text" id="ovb-tree-search" class="ovb-input" placeholder="🔍 Filtrar elemento (ex: logo, banner, svg, g1, slogan)..." style="margin-bottom:8px;">
                                <div id="ovb-navigator-tree" class="ovb-tree-list"></div>
                            </div>
                        </div>

                        <!-- MODIFIED ELEMENTS -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-magic"></i> Elementos Modificados Ativos</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div id="ovb-modified-list" class="ovb-tree-list"></div>
                            </div>
                        </div>

                        <!-- GLOBAL THEME COLORS & NEBULAS -->
                        <div class="ovb-section collapsed">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-palette"></i> Cores Globais & Nebulosas do Tema</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div class="ovb-field-row">
                                    <label class="ovb-label">Cor de Destaque (--color-accent)</label>
                                    <input type="color" class="ovb-color-picker" data-ovb-gscope="all" data-ovb-gvar="--color-accent" value="#8b5cf6">
                                </div>
                                <div class="ovb-field-row">
                                    <label class="ovb-label">Fundo Tema Escuro (--bg-page)</label>
                                    <input type="color" class="ovb-color-picker" data-ovb-gscope="dark" data-ovb-gvar="--bg-page" value="#0b0f17">
                                </div>
                                <div class="ovb-field-row">
                                    <label class="ovb-label">Card Tema Escuro (--bg-card)</label>
                                    <input type="color" class="ovb-color-picker" data-ovb-gscope="dark" data-ovb-gvar="--bg-card" value="#131926">
                                </div>
                                <div class="ovb-field-row">
                                    <label class="ovb-label">Fundo Tema Claro (--bg-page)</label>
                                    <input type="color" class="ovb-color-picker" data-ovb-gscope="light" data-ovb-gvar="--bg-page" value="#f8fafc">
                                </div>
                                <div class="ovb-field-row">
                                    <label class="ovb-label">Nebulosa 1 (--nebula-1)</label>
                                    <input type="color" class="ovb-color-picker" data-ovb-gscope="all" data-ovb-gvar="--nebula-1" value="#9333ea">
                                </div>
                                <div class="ovb-field-row">
                                    <label class="ovb-label">Nebulosa 2 (--nebula-2)</label>
                                    <input type="color" class="ovb-color-picker" data-ovb-gscope="all" data-ovb-gvar="--nebula-2" value="#c026d3">
                                </div>
                                <div class="ovb-field-row">
                                    <label class="ovb-label">Nebulosa 3 (--nebula-3)</label>
                                    <input type="color" class="ovb-color-picker" data-ovb-gscope="all" data-ovb-gvar="--nebula-3" value="#7c3aed">
                                </div>
                                <button type="button" id="ovb-btn-reset-gvars" class="ovb-mini-btn" style="width:100%;margin-top:4px;">
                                    Restaurar Cores Globais Padrão
                                </button>
                            </div>
                        </div>

                        <!-- PREDEFINIÇÕES DE TEMA (PRESETS: OdysseeXP / Tema em Branco / Exportar para Gemini) -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-bookmark"></i> Predefinições de Tema (OdysseeXP & Exportação)</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <p style="font-size:11px;color:#cbd5e1;margin:0;line-height:1.4;">
                                    Sua predefinição principal está salva como <strong>OdysseeXP</strong>. Tudo o que você faz aqui reflete diretamente nos arquivos do tema (<code>presets/odysseexp.json</code> e <code>assets/css/theme-preset-active.css</code>) para editar no Gemini ou exportar para novos sites.
                                </p>

                                <div class="ovb-field">
                                    <label class="ovb-label">Carregar Predefinição Salva:</label>
                                    <div class="ovb-field-row">
                                        <select id="ovb-preset-selector" class="ovb-select" style="flex:1;">
                                            <option value="OdysseeXP">⚡ OdysseeXP (Tema Principal)</option>
                                            <option value="Tema em Branco">📄 Tema em Branco (Criar Site do Zero)</option>
                                        </select>
                                        <button type="button" id="ovb-btn-load-preset" class="ovb-mini-btn">Carregar</button>
                                    </div>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">Nome da Predefinição Atual (para Salvar):</label>
                                    <div class="ovb-field-row">
                                        <input type="text" id="ovb-preset-name-input" class="ovb-input" value="OdysseeXP" placeholder="Ex: OdysseeXP">
                                    </div>
                                </div>

                                <div class="ovb-field-row">
                                    <label class="ovb-label">Modo "Tema em Branco" (Ocultar seções base do site)</label>
                                    <input type="checkbox" id="ovb-blank-mode-toggle">
                                </div>

                                <button type="button" id="ovb-btn-open-code-export" class="ovb-action-btn" style="margin-top:4px;background:linear-gradient(135deg,rgba(139,92,246,0.3),rgba(236,72,153,0.25));">
                                    <i class="fas fa-terminal"></i> Abrir Editor de Código na Lata / Exportar p/ Gemini
                                </button>

                                <div class="ovb-field-row" style="margin-top:6px;">
                                    <button type="button" id="ovb-btn-export" class="ovb-action-btn" style="flex:1;">
                                        <i class="fas fa-download"></i> Baixar Preset (.JSON)
                                    </button>
                                    <button type="button" id="ovb-btn-export-css" class="ovb-action-btn" style="flex:1;">
                                        <i class="fas fa-file-code"></i> Baixar CSS (.CSS)
                                    </button>
                                </div>

                                <div class="ovb-field-row" style="margin-top:4px;">
                                    <button type="button" id="ovb-btn-import-trigger" class="ovb-action-btn" style="flex:1;">
                                        <i class="fas fa-upload"></i> Importar Predefinição (.JSON)
                                    </button>
                                    <input type="file" id="ovb-import-file" accept=".json" style="display:none;">
                                </div>

                                <button type="button" id="ovb-btn-reset-all" class="ovb-action-btn ovb-danger-btn" style="margin-top:6px;">
                                    <i class="fas fa-trash-restore"></i> Limpar Customizações Visuais
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </aside>

            <!-- RIGHT LIVE PREVIEW CANVAS + BOTTOM LIVE CODE IDE DRAWER -->
            <main class="ovb-canvas-area">
                <div id="ovb-iframe-container" class="ovb-iframe-container device-desktop">
                    <iframe id="ovb-preview-iframe" src="<?php echo esc_url( $iframe_src ); ?>" title="Odyssee Visual Preview"></iframe>
                </div>

                <!-- LIVE CODE EDITOR IDE ("PROGRAMAR POR CÓDIGO / EDITAR CSS NA LATA!") -->
                <div id="ovb-code-drawer" class="ovb-code-drawer">
                    <div class="ovb-code-header">
                        <div class="ovb-code-tabs">
                            <button type="button" class="ovb-code-tab active" data-codetab="pane-global-css">
                                <i class="fas fa-bolt"></i> CSS Global na Lata (Ao Vivo)
                            </button>
                            <button type="button" class="ovb-code-tab" data-codetab="pane-el-css">
                                <i class="fas fa-crosshairs"></i> CSS do Elemento Selecionado
                            </button>
                            <button type="button" class="ovb-code-tab" data-codetab="pane-el-html">
                                <i class="fas fa-code"></i> HTML / SVG do Elemento na Lata
                            </button>
                            <button type="button" class="ovb-code-tab" data-codetab="pane-gemini-export">
                                <i class="fas fa-robot"></i> Código Compilado do Tema (Para Editar no Gemini)
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
                        <!-- PANE 1: GLOBAL CSS NA LATA -->
                        <div class="ovb-code-pane active" id="pane-global-css">
                            <div class="ovb-code-statusbar">
                                <span>💡 Digite qualquer regra CSS abaixo e veja o resultado em tempo real na página (sem precisar recarregar!):</span>
                                <span style="color:#c084fc;font-family:monospace;">Salvo em: assets/css/theme-preset-active.css</span>
                            </div>
                            <textarea id="ovb-global-custom-css" class="ovb-code-editor-textarea" spellcheck="false" placeholder="/* Digite seu CSS na lata aqui! Tudo reflete ao vivo na página.&#10;Exemplo:&#10;.hero-slogan {&#10;  text-shadow: 0 0 25px #a855f7;&#10;}&#10;*/"></textarea>
                        </div>

                        <!-- PANE 2: ELEMENT CSS NA LATA -->
                        <div class="ovb-code-pane" id="pane-el-css">
                            <div class="ovb-code-statusbar">
                                <span>🎯 Editando CSS exclusivo do elemento: <strong id="ovb-code-el-label" style="color:#38bdf8;font-family:monospace;">(Selecione um elemento)</strong> — Use a palavra <code>selector</code>:</span>
                                <button type="button" id="ovb-btn-insert-selector-tpl" class="ovb-mini-btn">＋ Inserir bloco selector { }</button>
                            </div>
                            <textarea id="ovb-code-el-css-editor" class="ovb-code-editor-textarea" spellcheck="false" placeholder="selector {&#10;  /* Estilos aplicados diretamente neste elemento */&#10;  border: 2px solid #a855f7;&#10;}&#10;&#10;selector:hover {&#10;  transform: scale(1.05);&#10;}"></textarea>
                        </div>

                        <!-- PANE 3: ELEMENT HTML / SVG NA LATA -->
                        <div class="ovb-code-pane" id="pane-el-html">
                            <div class="ovb-code-statusbar">
                                <span>🧩 Editando o código HTML / SVG interno (<code>innerHTML</code>) do elemento selecionado ao vivo:</span>
                                <button type="button" id="ovb-btn-restore-el-html" class="ovb-mini-btn">↺ Restaurar HTML Original</button>
                            </div>
                            <textarea id="ovb-code-el-html-editor" class="ovb-code-editor-textarea" spellcheck="false" placeholder="Selecione qualquer elemento da página para editar seu HTML ou SVG diretamente no código..."></textarea>
                        </div>

                        <!-- PANE 4: FULL COMPILED CODE & PRESET EXPORT FOR GEMINI -->
                        <div class="ovb-code-pane" id="pane-gemini-export">
                            <div class="ovb-code-statusbar">
                                <span>🤖 Este código reúne todo o CSS compilado + Predefinição JSON do tema (também salvo automaticamente em <code>presets/odysseexp.json</code> e <code>assets/css/theme-preset-active.css</code>):</span>
                                <div style="display:flex;gap:6px;">
                                    <button type="button" id="ovb-btn-copy-compiled-css" class="ovb-mini-btn">📋 Copiar CSS Compilado</button>
                                    <button type="button" id="ovb-btn-copy-preset-json" class="ovb-mini-btn">📋 Copiar Preset JSON (p/ Gemini)</button>
                                </div>
                            </div>
                            <textarea id="ovb-code-compiled-readonly" class="ovb-code-editor-textarea" readonly spellcheck="false"></textarea>
                        </div>
                    </div>
                </div>
            </main>
        </div>

        <div id="ovb-toast">Salvo com sucesso!</div>
    </div>
    <?php
}
