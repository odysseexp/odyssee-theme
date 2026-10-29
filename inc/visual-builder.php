<?php
/**
 * Odyssee Visual Studio — Elementor-Style Non-Destructive Theme Customizer
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'ODYSSEE_VB_OPTION_KEY', 'odyssee_visual_builder_data' );
define( 'ODYSSEE_VB_REVISIONS_KEY', 'odyssee_visual_builder_revisions' );

/**
 * Retrieves saved Visual Builder data with safe defaults
 */
function odyssee_vb_get_data() {
    $data = get_option( ODYSSEE_VB_OPTION_KEY, array() );
    if ( ! is_array( $data ) ) {
        $data = array();
    }
    return wp_parse_args( $data, array(
        'elements'   => array(),
        'blocks'     => array(),
        'globalVars' => array(
            'all'   => array(),
            'dark'  => array(),
            'light' => array(),
        ),
        'customCss'  => '',
    ) );
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
                '<p style="color:#cbd5e1;font-size:11.5px;margin:0 0 10px 0;line-height:1.45;">Edite elementos ao vivo, adicione animações, efeitos de Glow Neon e Blend Modes (Add, Subtract, Lighten, Saturation, Color) sem quebrar o tema.</p>' +
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
        '26.10.3'
    );

    wp_enqueue_script(
        'odyssee-vb-admin',
        get_template_directory_uri() . '/inc/visual-builder-admin.js',
        array( 'jquery' ),
        '26.10.3',
        true
    );

    wp_localize_script( 'odyssee-vb-admin', 'odysseeVBAdmin', array(
        'ajaxurl'     => admin_url( 'admin-ajax.php' ),
        'nonce'       => wp_create_nonce( 'odyssee_vb_nonce' ),
        'homeUrl'     => home_url( '/' ),
        'initialData' => odyssee_vb_get_data(),
    ) );
}

/**
 * Enqueues Frontend Assets & Passes Saved Customization Data
 */
add_action( 'wp_enqueue_scripts', 'odyssee_vb_enqueue_frontend_assets', 30 );
function odyssee_vb_enqueue_frontend_assets() {
    $is_preview = odyssee_vb_is_preview();
    $data       = odyssee_vb_get_data();

    $has_data = ! empty( $data['elements'] )
             || ! empty( $data['blocks'] )
             || ! empty( $data['customCss'] )
             || ! empty( $data['globalVars']['all'] )
             || ! empty( $data['globalVars']['dark'] )
             || ! empty( $data['globalVars']['light'] );

    if ( ! $is_preview && ! $has_data ) {
        return;
    }

    if ( $is_preview ) {
        show_admin_bar( false );
    }

    wp_enqueue_style(
        'odyssee-vb-frontend',
        get_template_directory_uri() . '/assets/css/visual-builder-frontend.css',
        array( 'odyssee-style' ),
        '26.10.3'
    );

    wp_enqueue_script(
        'odyssee-vb-frontend',
        get_template_directory_uri() . '/assets/js/visual-builder-frontend.js',
        array( 'vanilla-tilt' ),
        '26.10.3',
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
    $is_preview = odyssee_vb_is_preview();
    $data       = odyssee_vb_get_data();
    if ( ! $is_preview && empty( $data['elements'] ) ) {
        return;
    }
    ?>
    <svg id="odyssee-vb-svg-filters" style="position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;" aria-hidden="true">
        <defs>
            <!-- Filtro para Efeito de Subtração / Inversão de Canal -->
            <filter id="odyssee-svg-subtract" color-interpolation-filters="sRGB">
                <feComponentTransfer>
                    <feFuncR type="table" tableValues="1 0.15 0" />
                    <feFuncG type="table" tableValues="1 0.15 0" />
                    <feFuncB type="table" tableValues="1 0.25 0" />
                </feComponentTransfer>
            </filter>
            <!-- Filtro para Efeito de Adição Luminosa (Add / Linear Dodge Boost) -->
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
 * AJAX Handler: Save Visual Studio Customizations
 */
add_action( 'wp_ajax_odyssee_vb_save', 'odyssee_vb_ajax_save' );
function odyssee_vb_ajax_save() {
    check_ajax_referer( 'odyssee_vb_nonce', 'nonce' );

    if ( ! current_user_can( 'manage_options' ) ) {
        wp_send_json_error( 'Sem permissão para salvar.' );
    }

    $raw_json = isset( $_POST['data'] ) ? wp_unslash( $_POST['data'] ) : '';
    $decoded  = json_decode( $raw_json, true );

    if ( ! is_array( $decoded ) ) {
        wp_send_json_error( 'Formato de dados inválido.' );
    }

    $clean = array(
        'elements'   => isset( $decoded['elements'] ) && is_array( $decoded['elements'] ) ? $decoded['elements'] : array(),
        'blocks'     => isset( $decoded['blocks'] ) && is_array( $decoded['blocks'] ) ? $decoded['blocks'] : array(),
        'globalVars' => isset( $decoded['globalVars'] ) && is_array( $decoded['globalVars'] ) ? $decoded['globalVars'] : array( 'all' => array(), 'dark' => array(), 'light' => array() ),
        'customCss'  => isset( $decoded['customCss'] ) ? wp_strip_all_tags( (string) $decoded['customCss'] ) : '',
    );

    // Save revision backup (up to 10 revisions)
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

    update_option( ODYSSEE_VB_OPTION_KEY, $clean );

    wp_send_json_success( array(
        'message' => 'Salvo com sucesso!',
        'time'    => current_time( 'H:i:s' ),
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
                    <span>Odyssee Visual Builder</span>
                </div>
                <select id="ovb-page-switcher" class="ovb-select-page" title="Alternar página em edição">
                    <?php foreach ( $pages_list as $p_url => $p_label ) : ?>
                        <option value="<?php echo esc_url( $p_url ); ?>" <?php selected( untrailingslashit( $initial_preview ), untrailingslashit( $p_url ) ); ?>>
                            <?php echo esc_html( $p_label ); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div class="ovb-topbar-center">
                <!-- Device Switcher -->
                <div class="ovb-btn-group" title="Visualização Responsiva">
                    <button type="button" class="ovb-icon-btn ovb-device-btn active" data-device="desktop">
                        <i class="fas fa-desktop"></i> Desktop
                    </button>
                    <button type="button" class="ovb-icon-btn ovb-device-btn" data-device="tablet">
                        <i class="fas fa-tablet-alt"></i> Tablet
                    </button>
                    <button type="button" class="ovb-icon-btn ovb-device-btn" data-device="mobile">
                        <i class="fas fa-mobile-alt"></i> Mobile
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

                <button type="button" id="ovb-toggle-interactive" class="ovb-icon-btn" style="border:1px solid rgba(255,255,255,0.1);" title="Alternar entre Modo Seleção e Navegação Livre">
                    <i class="fas fa-mouse-pointer"></i> Navegar Livre
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
                    <i class="fas fa-check-circle"></i> Salvar & Publicar
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
                        <span class="ovb-selected-selector" id="ovb-sel-selector">Clique em qualquer item do site ao lado →</span>
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
                        <i class="fas fa-plus-square"></i>
                        <span>Conteúdo</span>
                    </button>
                    <button type="button" class="ovb-tab-btn active" data-tab="tab-style">
                        <i class="fas fa-paint-brush"></i>
                        <span>Estilo</span>
                    </button>
                    <button type="button" class="ovb-tab-btn" data-tab="tab-effects">
                        <i class="fas fa-wand-magic-sparkles"></i>
                        <span>Efeitos & Glow</span>
                    </button>
                    <button type="button" class="ovb-tab-btn" data-tab="tab-layers">
                        <i class="fas fa-layer-group"></i>
                        <span>Camadas</span>
                    </button>
                </div>

                <!-- TAB PANELS -->
                <div class="ovb-panels">

                    <!-- ==========================================
                         TAB 1: CONTEÚDO & INSERIR BLOCOS
                         ========================================== -->
                    <div class="ovb-tab-panel" id="tab-content">
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-pen"></i> Editar Conteúdo do Elemento</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div class="ovb-field">
                                    <label class="ovb-label">Seletor CSS Alvo</label>
                                    <div class="ovb-field-row">
                                        <input type="text" id="ovb-custom-selector-input" class="ovb-input" placeholder="Ex: .hero-slogan">
                                        <button type="button" id="ovb-btn-apply-selector" class="ovb-mini-btn">Ir</button>
                                    </div>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">Texto do Elemento (se for texto simples)</label>
                                    <textarea id="ovb-content-text" class="ovb-textarea" rows="2" placeholder="Deixe vazio para manter o original"></textarea>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">URL da Imagem (se for &lt;img&gt;)</label>
                                    <div class="ovb-field-row">
                                        <input type="text" id="ovb-content-src" class="ovb-input" placeholder="/wp-content/uploads/...">
                                        <button type="button" class="ovb-mini-btn ovb-media-btn" data-target="#ovb-content-src">Mídia</button>
                                    </div>
                                </div>

                                <div class="ovb-field">
                                    <label class="ovb-label">Link de Destino (se for &lt;a&gt;)</label>
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
                         TAB 2: ESTILO (ELEMENTOR CLASSIC CONTROLS)
                         ========================================== -->
                    <div class="ovb-tab-panel active" id="tab-style">
                        <!-- TIPOGRAFIA -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-font"></i> Tipografia & Texto</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div class="ovb-field">
                                    <label class="ovb-label">Cor do Texto</label>
                                    <div class="ovb-color-wrap">
                                        <input type="color" class="ovb-color-picker" data-ovb-prop="color" value="#f8fafc">
                                        <input type="text" class="ovb-input" data-ovb-prop="color" placeholder="Ex: #ffffff ou var(--color-title)">
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
                                        <input type="range" class="ovb-range" data-ovb-range-for="fontSize" data-unit="px" min="10" max="110" step="1" data-default="16">
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

                        <!-- FUNDO & GLASSMORPHISM -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-fill-drip"></i> Fundo & Glassmorphism</span>
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
                                    <label class="ovb-label">Backdrop Blur (Efeito Vidro / Glassmorphism)</label>
                                    <div class="ovb-slider-wrap">
                                        <input type="range" class="ovb-range" data-ovb-range-for="backdropBlur" min="0" max="40" step="1" data-default="0">
                                        <input type="number" class="ovb-num-input" data-ovb-prop="backdropBlur" placeholder="0px">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- ESPAÇAMENTO & DIMENSÕES -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-expand-arrows-alt"></i> Espaçamento & Dimensões</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
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

                                <div class="ovb-field-row">
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Largura (Width)</label>
                                        <input type="text" class="ovb-input" data-ovb-prop="width" placeholder="Ex: 100%, 400px">
                                    </div>
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Largura Máx.</label>
                                        <input type="text" class="ovb-input" data-ovb-prop="maxWidth" placeholder="Ex: 1200px">
                                    </div>
                                </div>

                                <div class="ovb-field-row">
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Altura Mín.</label>
                                        <input type="text" class="ovb-input" data-ovb-prop="minHeight" placeholder="Ex: 300px">
                                    </div>
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Z-Index (Camada)</label>
                                        <input type="number" class="ovb-input" data-ovb-prop="zIndex" placeholder="Auto">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- BORDAS -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-vector-square"></i> Bordas & Arredondamento</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
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
                                        <input type="text" class="ovb-input" data-ovb-prop="borderWidth" placeholder="Ex: 1px, 2px">
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

                        <!-- 4. FILTROS CSS & TRANSFORMAÇÕES -->
                        <div class="ovb-section collapsed">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-sliders-h"></i> Filtros de Cor & Transformação 2D/3D</span>
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
                                        <label class="ovb-label">Escala (Scale)</label>
                                        <input type="number" step="0.05" class="ovb-input" data-ovb-prop="scale" placeholder="1">
                                    </div>
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Rotação Z (°)</label>
                                        <input type="number" class="ovb-input" data-ovb-prop="rotate" placeholder="0">
                                    </div>
                                </div>

                                <div class="ovb-field-row">
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Deslocar X</label>
                                        <input type="text" class="ovb-input" data-ovb-prop="translateX" placeholder="0px">
                                    </div>
                                    <div class="ovb-field" style="flex:1;">
                                        <label class="ovb-label">Deslocar Y</label>
                                        <input type="text" class="ovb-input" data-ovb-prop="translateY" placeholder="0px">
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
                         TAB 4: CAMADAS, CORES GLOBAIS & BACKUP
                         ========================================== -->
                    <div class="ovb-tab-panel" id="tab-layers">
                        <!-- MODIFIED ELEMENTS -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-magic"></i> Elementos Personalizados Ativos</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div id="ovb-modified-list" class="ovb-tree-list"></div>
                            </div>
                        </div>

                        <!-- PAGE STRUCTURE TREE -->
                        <div class="ovb-section">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-sitemap"></i> Navegador de Estrutura da Página</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div id="ovb-navigator-tree" class="ovb-tree-list"></div>
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

                        <!-- GLOBAL CUSTOM CSS & BACKUP -->
                        <div class="ovb-section collapsed">
                            <div class="ovb-section-header">
                                <span class="ovb-sec-title"><i class="fas fa-shield-alt"></i> CSS Global & Backup Seguro</span>
                                <i class="fas fa-chevron-down ovb-chevron"></i>
                            </div>
                            <div class="ovb-section-body">
                                <div class="ovb-field">
                                    <label class="ovb-label">CSS Global do Site</label>
                                    <textarea id="ovb-global-custom-css" class="ovb-textarea" rows="4" style="font-family:monospace;font-size:11px;" placeholder="/* CSS global aplicado em todo o site */"></textarea>
                                </div>

                                <div class="ovb-field-row" style="margin-top:6px;">
                                    <button type="button" id="ovb-btn-export" class="ovb-action-btn" style="flex:1;">
                                        <i class="fas fa-download"></i> Exportar JSON
                                    </button>
                                    <button type="button" id="ovb-btn-import-trigger" class="ovb-action-btn" style="flex:1;">
                                        <i class="fas fa-upload"></i> Importar JSON
                                    </button>
                                    <input type="file" id="ovb-import-file" accept=".json" style="display:none;">
                                </div>

                                <button type="button" id="ovb-btn-reset-all" class="ovb-action-btn ovb-danger-btn" style="margin-top:8px;">
                                    <i class="fas fa-trash-restore"></i> Limpar Todas as Personalizações
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </aside>

            <!-- RIGHT LIVE PREVIEW CANVAS -->
            <main class="ovb-canvas-area">
                <div id="ovb-iframe-container" class="ovb-iframe-container device-desktop">
                    <iframe id="ovb-preview-iframe" src="<?php echo esc_url( $iframe_src ); ?>" title="Odyssee Visual Preview"></iframe>
                </div>
            </main>
        </div>

        <div id="ovb-toast">Salvo com sucesso!</div>
    </div>
    <?php
}
