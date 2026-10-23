<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

add_action( 'admin_menu', 'odyssee_cv_add_admin_menu' );
function odyssee_cv_add_admin_menu() {
    add_menu_page(
        'Sobre Mim',                          
        'Sobre Mim',                          
        'manage_options',                     
        'odyssee-cv-manager',                 
        'odyssee_cv_admin_page',              
        'dashicons-id-alt',                   
        25                                    
    );
}

add_action( 'admin_enqueue_scripts', 'odyssee_cv_enqueue_admin_assets' );
function odyssee_cv_enqueue_admin_assets( $hook_suffix ) {
    if ( 'toplevel_page_odyssee-cv-manager' !== $hook_suffix ) {
        return;
    }

    wp_enqueue_style( 
        'odyssee-cv-admin', 
        get_template_directory_uri() . '/inc/cv-admin.css',
        array(),
        '1.0.0'
    );

    wp_enqueue_script(
        'odyssee-cv-admin',
        get_template_directory_uri() . '/inc/cv-admin.js',
        array( 'jquery', 'jquery-ui-sortable' ),
        '1.0.0',
        true
    );

    wp_enqueue_media();

    wp_localize_script( 'odyssee-cv-admin', 'odysseeCVAdmin', array(
        'nonce' => wp_create_nonce( 'odyssee_cv_nonce' ),
        'ajaxurl' => admin_url( 'admin-ajax.php' ),
    ) );
}

function odyssee_cv_admin_page() {
    if ( ! current_user_can( 'manage_options' ) ) {
        wp_die( 'Acesso negado' );
    }

    if ( isset( $_POST['odyssee_cv_nonce'] ) && wp_verify_nonce( $_POST['odyssee_cv_nonce'], 'odyssee_cv_nonce' ) ) {
        odyssee_cv_save_data();
        ?>
        <div class="notice notice-success is-dismissible">
            <p><?php echo esc_html__( 'Dados salvos com sucesso!', 'odyssee' ); ?></p>
        </div>
        <?php
    }

    $cv_data = odyssee_cv_get_data();

    if ( empty( get_option('cv_data_synced_v3') ) ) {
        $t_url = get_template_directory_uri() . '/assets/images/logos/';
        
        $cv_data['descricao']['pt_br']['expectativa'] = "Atualmente, estou em busca de estabilidade financeira em uma empresa que valorize minhas habilidades e me ofereça a oportunidade de desenvolver novas competências ou aprimorar as já adquiridas. Com 24 anos, meu objetivo é alcançar a independência, conquistar minha própria moradia e assumir as responsabilidades inerentes à vida adulta.\n\nProcuro um emprego que não apenas proporcione uma remuneração adequada, mas que também ofereça oportunidades de crescimento e reconhecimento. Desejo que meu trabalho seja valorizado; meu intuito é tornar-me uma referência em excelência, criatividade e carisma.\n\nNão estou interessado em cargos que exijam liderança ativa ou que me responsabilizem por outros colaboradores. Minha preferência é por atuar em equipe ou de maneira independente, onde possa desempenhar minhas funções com eficácia.";
        $cv_data['descricao']['en_us']['expectativa'] = "Currently, I am looking for financial stability in a company that values my skills and offers me the opportunity to develop new competencies or improve those already acquired. At 24, my goal is to achieve independence, acquire my own home, and assume the responsibilities inherent to adult life.\n\nI am looking for a job that not only provides adequate remuneration but also offers opportunities for growth and recognition. I want my work to be valued; my intention is to become a reference in excellence, creativity, and charisma.\n\nI am not interested in positions that require active leadership or make me responsible for other employees. My preference is to work in a team or independently, where I can perform my duties effectively.";
        $cv_data['descricao']['pt_br']['citacao'] = "Intelligence is the ability to avoid doing work, yet getting the work done.";
        $cv_data['descricao']['en_us']['citacao'] = "Intelligence is the ability to avoid doing work, yet getting the work done.";
        $cv_data['descricao']['pt_br']['citacao_autor'] = "Linus Torvalds";
        $cv_data['descricao']['en_us']['citacao_autor'] = "Linus Torvalds";

        $cv_data['experiencias'] = array(
            array(
                'titulo' => 'Designer Gráfico, Editor de Vídeo e Ilustrador Digital | Autônomo',
                'empresa' => 'Odyssee Experience',
                'periodo' => '2016 - Atual',
                'descricao_pt' => "Desenvolvimento e criação de banners para o blog.\nRedator de matérias e revisor das demais matérias publicadas.\nAuxiliar no desenvolvimento da UX/UI do blog.\nAuxiliar na criação e desenvolvimento da identidade visual do site.",
                'descricao_en' => "Development and creation of banners for the blog.\nWriter and reviewer of articles published on the blog.\nAssist in the UX/UI development of the blog.\nAssist in the creation and development of the site's visual identity."
            ),
            array(
                'titulo' => 'Designer Gráfico e Redator | Freelance',
                'empresa' => 'Mobile Minecraft (O site foi encerrado em 2018)',
                'periodo' => '2016 - 2018',
                'descricao_pt' => "Desenvolvimento e criação de banners para o blog.\nRedator de matérias e revisor das demais matérias publicadas.\nAuxiliar no desenvolvimento da UX/UI do blog.\nAuxiliar na criação e desenvolvimento da identidade visual do site.",
                'descricao_en' => "Development and creation of banners for the blog.\nWriter and reviewer of articles published on the blog.\nAssist in the UX/UI development of the blog.\nAssist in the creation and development of the site's visual identity."
            ),
            array(
                'titulo' => 'Recepcionista | CLT',
                'empresa' => 'Grupo Fleury',
                'periodo' => '2020 - 2022',
                'descricao_pt' => "Atendimento e abertura de ficha de exames médicos.\nAgendamento de procedimentos médicos laboratoriais.\nTratativa comercial com convênios credenciados em planilhas.\nTreinador de novos trabalhadores para a recepção e abertura de ficha.\nArmazenador de arquivos da unidade de atendimento.\nGestão backoffice e resolução de problemas financeiros em planilhas.",
                'descricao_en' => "Customer service and opening of medical exam records.\nScheduling of laboratory medical procedures.\nCommercial negotiations with accredited health plans in spreadsheets.\nTrainer of new workers for reception and record opening.\nStorage of service unit files.\nBackoffice management and resolution of financial problems in spreadsheets."
            ),
            array(
                'titulo' => 'Designer Gráfico | Estágio',
                'empresa' => 'ANYMOUS (atualmente falida, seguindo apenas com a submarca BioSec Pet.)',
                'periodo' => '2023 - 2023',
                'descricao_pt' => "Criação e elaboração de posts e carrosséis para Instagram.\nCriação e elaboração de reels para Instagram.\nRedator e tratamento de fotos de produtos para marketplace.\nUX/UI do site. Gestão de ícones, símbolos e acessibilidade da página.",
                'descricao_en' => "Creation and development of posts and carousels for Instagram.\nCreation and development of reels for Instagram.\nWriter and product photo editor for marketplace.\nWebsite UX/UI. Management of icons, symbols and page accessibility."
            ),
            array(
                'titulo' => 'Supervisor de fábrica de corte de letras-caixa | Informal',
                'empresa' => 'Div Term Tecnomoldura',
                'periodo' => '2023 - 2023',
                'descricao_pt' => "Gerar arquivos escalonados e compatíveis para recorte em máquina laser, fio quente e MDF.\nElaborar aproveitamento de material em software para recorte em máquinas.\nOperação de corte laser e de corte a fio quente.\nElaborar tipografias e adapta-las para corte em máquinas de acordo com suas limitações.\nSupervisionar operadores de máquinas para garantir qualidade do recorte e evitar gastos excessivos com matéria-prima.",
                'descricao_en' => "Generate scaled and compatible files for laser cutting, hot-wire cutting and MDF.\nDevelop material optimization in software for machine cutting.\nLaser cutting and hot wire cutting operation.\nDevelop typography and adapt it for cutting in machinery according to its limitations.\nSupervise machine operators to ensure cutting quality and avoid excessive raw material expenses."
            ),
            array(
                'titulo' => 'Especialista em atendimento | CLT',
                'empresa' => 'Atento',
                'periodo' => '2024 - 2024',
                'descricao_pt' => "Atendimento voz receptivo para clientes do plano do grupo de faculdades Cogna (grupo de faculdades da Anhanguera)\nAtendimento receptivo via WhatsApp e e-mail, 5 telas.\nSanar dúvidas relativas a faturas, grades de aula, site, campus, contrato e regularizações de débitos.",
                'descricao_en' => "Inbound voice service for customers of the Cogna college group plan (Anhanguera college group)\nInbound service via WhatsApp and e-mail, 5 screens.\nResolve doubts regarding invoices, class schedules, website, campus, contract and debt regularizations."
            ),
            array(
                'titulo' => 'Designer Gráfico Pleno | Temporário',
                'empresa' => 'First Publicidade',
                'periodo' => '2024 - 2024',
                'descricao_pt' => "Criação e elaboração de posts e carrosséis para Instagram de diversas identidades visuais.\nCriação de posts para as campanhas políticas de candidatos vereadores e prefeitos do estado de São Paulo.\nBranding de posts trends e interativos para redes sociais.\nMaterial offline para campanhas políticas (banners, flyers, adesivos, etc.).",
                'descricao_en' => "Creation and development of posts and carousels for Instagram with various visual identities.\nCreation of posts for political campaigns of city council and mayor candidates in São Paulo state.\nBranding of trendy and interactive posts for social media.\nOffline material for political campaigns (banners, flyers, stickers, etc.)."
            ),
            array(
                'titulo' => 'Especialista em atendimento | CLT',
                'empresa' => 'NeoBPO (atualmente NeoHype)',
                'periodo' => '2025 - 2025',
                'descricao_pt' => "Atendimento receptivo para clientes do plano de saúde Amil.\nAgendamento de exames médicos e consultas.\nSanar dúvidas relativas a unidades, agendas, procedimentos médicos.",
                'descricao_en' => "Inbound customer service for Amil health plan clients.\nScheduling of medical exams and appointments.\nResolve doubts regarding units, schedules, medical procedures."
            ),
            array(
                'titulo' => 'Designer Gráfico Jr. | PJ',
                'empresa' => 'Percons - Pernamcubo Conservadora',
                'periodo' => '2025 - 2026',
                'descricao_pt' => "Criação de artes para posts em redes sociais.\nRedigir documentos internos com a identidade visual da empresa.\nCriar e fechar arquivos para impressos (material offiline).\nElaborar e criar identidades visuais e logos para marcas.\nDesign de apresentações empresariais.",
                'descricao_en' => "Creating artwork for social media posts.\nWrite internal documents with the company's visual identity.\nCreate and prepare print-ready files (offline material).\nDesign and create visual identities and logos for brands.\nCorporate presentation design."
            ),
            array(
                'titulo' => 'Designer Gráfico Pleno | Voluntário',
                'empresa' => 'Black&CO',
                'periodo' => '2026 - Atual',
                'descricao_pt' => "Elaboração de copy-writhing da arte.\nElaboração de tema.\nCriação de artes para carrosséis no Instagram.",
                'descricao_en' => "Copywriting for artwork.\nTheme development.\nCreation of artwork for Instagram carousels."
            )
        );
        
        $cv_data['cursos'] = array(
            array(
                'nome' => 'Curso de informática e inglês',
                'instituicao' => 'Curso - Caution Pontocom',
                'data_final' => '2015 - 2017',
                'descricao_pt' => "194h/aula",
                'descricao_en' => "194h/class"
            ),
            array(
                'nome' => 'CST em Design Gráfico',
                'instituicao' => 'Faculdade - UNICID',
                'data_final' => '2022 - 2024',
                'descricao_pt' => "4 semestres",
                'descricao_en' => "4 semesters"
            )
        );
        
        $cv_data['habilidades'] = array(
            'criativos' => array(
                array('nome' => 'Photoshop', 'nivel' => 'avançado', 'icon_url' => $t_url . 'adobe_photoshop_cc_icon.svg'),
                array('nome' => 'Illustrator', 'nivel' => 'avançado', 'icon_url' => $t_url . 'adobe_illustrator_cc_icon.svg'),
                array('nome' => 'InDesign', 'nivel' => 'intermediário', 'icon_url' => $t_url . 'adobe_indesign_cc_2026_icon.svg'),
                array('nome' => 'Lightroom', 'nivel' => 'intermediário', 'icon_url' => $t_url . 'adobe_photoshop_lightroom_cc_logo.svg'),
                array('nome' => 'Premiere', 'nivel' => 'avançado', 'icon_url' => $t_url . 'adobe_premiere_pro_cc_2026_icon.svg'),
                array('nome' => 'After Effects', 'nivel' => 'intermediário', 'icon_url' => $t_url . 'adobe_after_effects_cc_2026_icon.svg'),
                array('nome' => 'Blender', 'nivel' => 'iniciante', 'icon_url' => $t_url . 'blender_logo.svg'),
                array('nome' => 'Affinity', 'nivel' => 'avançado', 'icon_url' => $t_url . 'affinity_(app)_logo.svg'),
                array('nome' => 'GIMP', 'nivel' => 'avançado', 'icon_url' => $t_url . 'gimp.svg'),
                array('nome' => 'DaVinci Resolve', 'nivel' => 'intermediário', 'icon_url' => $t_url . 'davinci_resolve.png'),
                array('nome' => 'Inkscape', 'nivel' => 'avançado', 'icon_url' => $t_url . 'inkscape.svg'),
                array('nome' => 'Krita', 'nivel' => 'intermediário', 'icon_url' => $t_url . 'krita.svg'),
                array('nome' => 'Clip Studio Paint', 'nivel' => 'intermediário', 'icon_url' => $t_url . 'csp.png'),
                array('nome' => 'Darktable', 'nivel' => 'iniciante', 'icon_url' => $t_url . 'darktable.svg'),
                array('nome' => 'CapCut', 'nivel' => 'intermediário', 'icon_url' => $t_url . 'capcut.svg'),
                array('nome' => 'Photopea', 'nivel' => 'avançado', 'icon_url' => $t_url . 'photopea.svg'),
                array('nome' => 'Clipchamp', 'nivel' => 'intermediário', 'icon_url' => $t_url . 'clipchamp.svg'),
            ),
            'office' => array(
                array('nome' => 'Word', 'nivel' => 'avançado', 'icon_url' => $t_url . 'microsoft_office_word_(2025–present).svg'),
                array('nome' => 'Excel', 'nivel' => 'iniciante', 'icon_url' => $t_url . 'microsoft_office_excel_(2025–present).svg'),
                array('nome' => 'PowerPoint', 'nivel' => 'avançado', 'icon_url' => $t_url . 'microsoft_office_powerpoint_(2025–present).svg'),
                array('nome' => 'LibreOffice Writer', 'nivel' => 'iniciante', 'icon_url' => $t_url . 'libreoffice_7.5_writer_icon.svg'),
                array('nome' => 'LibreOffice Impress', 'nivel' => 'avançado', 'icon_url' => $t_url . 'libreoffice_7.5_impress_icon.svg'),
                array('nome' => 'LibreOffice Calc', 'nivel' => 'iniciante', 'icon_url' => $t_url . 'libreoffice_7.5_calc_icon.svg'),
                array('nome' => 'LibreOffice Draw', 'nivel' => 'intermediário', 'icon_url' => $t_url . 'libreoffice_7.5_draw_icon.svg'),
            ),
            'programacao' => array(
                array('nome' => 'HTML5', 'nivel' => 'iniciante', 'icon_url' => $t_url . 'html5_logo_and_wordmark.svg'),
                array('nome' => 'CSS3', 'nivel' => 'iniciante', 'icon_url' => $t_url . 'css3_logo_and_wordmark.svg'),
                array('nome' => 'JavaScript', 'nivel' => 'iniciante', 'icon_url' => $t_url . 'javascript-shield.svg'),
            ),
            'os' => array(
                array('nome' => 'Windows', 'nivel' => '', 'icon_url' => $t_url . 'windows_11.svg'),
                array('nome' => 'Fedora', 'nivel' => '', 'icon_url' => $t_url . 'fedora-logo.svg'),
                array('nome' => 'Arch', 'nivel' => '', 'icon_url' => $t_url . 'arch_linux-logo.svg'),
                array('nome' => 'Linux Mint', 'nivel' => '', 'icon_url' => $t_url . 'linux_mint.svg'),
                array('nome' => 'Steam OS', 'nivel' => '', 'icon_url' => $t_url . 'steam_os.svg'),
                array('nome' => 'Bazzite', 'nivel' => '', 'icon_url' => $t_url . 'bazzite.svg'),
                array('nome' => 'Zorin', 'nivel' => '', 'icon_url' => $t_url . 'zorin_os.svg'),
                array('nome' => 'Pop! OS', 'nivel' => '', 'icon_url' => $t_url . 'pop_os.svg'),
            )
        );
        
        update_option('odyssee_cv_data', $cv_data);
        update_option('cv_data_synced_v3', true);
    }
    ?>

    <div class="wrap odyssee-cv-admin-wrap">
        <h1><?php echo esc_html( get_admin_page_title() ); ?></h1>

        <form method="post" class="odyssee-cv-form">
            <?php wp_nonce_field( 'odyssee_cv_nonce', 'odyssee_cv_nonce' ); ?>

            <nav class="cv-admin-tabs">
                <button type="button" class="tab-button active" data-tab="descricao">
                    Descrição
                </button>
                <button type="button" class="tab-button" data-tab="experiencias">
                    Experiências
                </button>
                <button type="button" class="tab-button" data-tab="cursos">
                    Cursos
                </button>
                <button type="button" class="tab-button" data-tab="habilidades">
                    Habilidades
                </button>
            </nav>

            <div id="tab-descricao" class="tab-content active">
                <h2>Descrição Bilíngue</h2>
                
                <div class="cv-admin-section">
                    <h3>Português (PT-BR)</h3>
                    
                    <div class="form-group">
                        <label for="desc_pt_1">Descrição 1 (PT-BR)</label>
                        <textarea 
                            id="desc_pt_1" 
                            name="descricao[pt_br][intro_1]" 
                            class="large-text" 
                            rows="4"
                        ><?php echo esc_textarea( $cv_data['descricao']['pt_br']['intro_1'] ?? '' ); ?></textarea>
                        <p class="description">Primeira parte da introdução em português.</p>
                    </div>

                    <div class="form-group">
                        <label for="desc_pt_2">Descrição 2 (PT-BR)</label>
                        <textarea 
                            id="desc_pt_2" 
                            name="descricao[pt_br][intro_2]" 
                            class="large-text" 
                            rows="4"
                        ><?php echo esc_textarea( $cv_data['descricao']['pt_br']['intro_2'] ?? '' ); ?></textarea>
                        <p class="description">Segunda parte da introdução em português.</p>
                    </div>
                    <div class="form-group">
                        <label for="desc_pt_expectativa">O Que Almejo (Expectativa - PT-BR)</label>
                        <textarea 
                            id="desc_pt_expectativa" 
                            name="descricao[pt_br][expectativa]" 
                            class="large-text" 
                            rows="5"
                        ><?php echo esc_textarea( $cv_data['descricao']['pt_br']['expectativa'] ?? '' ); ?></textarea>
                        <p class="description">Texto para a seção "O que almejo". Quebras de linha (Enter) criarão novos parágrafos.</p>
                    </div>

                    <div class="form-group">
                        <label for="desc_pt_citacao">Citação Final (PT-BR)</label>
                        <textarea 
                            id="desc_pt_citacao" 
                            name="descricao[pt_br][citacao]" 
                            class="large-text" 
                            rows="2"
                        ><?php echo esc_textarea( $cv_data['descricao']['pt_br']['citacao'] ?? '' ); ?></textarea>
                    </div>

                    <div class="form-group">
                        <label for="desc_pt_citacao_autor">Autor da Citação (PT-BR)</label>
                        <input 
                            type="text"
                            id="desc_pt_citacao_autor" 
                            name="descricao[pt_br][citacao_autor]" 
                            class="regular-text" 
                            value="<?php echo esc_attr( $cv_data['descricao']['pt_br']['citacao_autor'] ?? '' ); ?>"
                        />
                    </div>
                </div>

                <div class="cv-admin-section">
                    <h3>English (EN-US)</h3>
                    
                    <div class="form-group">
                        <label for="desc_en_1">Descrição 1 (EN-US)</label>
                        <textarea 
                            id="desc_en_1" 
                            name="descricao[en_us][intro_1]" 
                            class="large-text" 
                            rows="4"
                        ><?php echo esc_textarea( $cv_data['descricao']['en_us']['intro_1'] ?? '' ); ?></textarea>
                        <p class="description">First part of introduction in English.</p>
                    </div>

                    <div class="form-group">
                        <label for="desc_en_2">Descrição 2 (EN-US)</label>
                        <textarea 
                            id="desc_en_2" 
                            name="descricao[en_us][intro_2]" 
                            class="large-text" 
                            rows="4"
                        ><?php echo esc_textarea( $cv_data['descricao']['en_us']['intro_2'] ?? '' ); ?></textarea>
                        <p class="description">Second part of introduction in English.</p>
                    </div>
                    <div class="form-group">
                        <label for="desc_en_expectativa">O Que Almejo (Expectation - EN-US)</label>
                        <textarea 
                            id="desc_en_expectativa" 
                            name="descricao[en_us][expectativa]" 
                            class="large-text" 
                            rows="5"
                        ><?php echo esc_textarea( $cv_data['descricao']['en_us']['expectativa'] ?? '' ); ?></textarea>
                        <p class="description">Text for the "What I aim for" section. Line breaks (Enter) will create new paragraphs.</p>
                    </div>

                    <div class="form-group">
                        <label for="desc_en_citacao">Final Quote (EN-US)</label>
                        <textarea 
                            id="desc_en_citacao" 
                            name="descricao[en_us][citacao]" 
                            class="large-text" 
                            rows="2"
                        ><?php echo esc_textarea( $cv_data['descricao']['en_us']['citacao'] ?? '' ); ?></textarea>
                    </div>

                    <div class="form-group">
                        <label for="desc_en_citacao_autor">Quote Author (EN-US)</label>
                        <input 
                            type="text"
                            id="desc_en_citacao_autor" 
                            name="descricao[en_us][citacao_autor]" 
                            class="regular-text" 
                            value="<?php echo esc_attr( $cv_data['descricao']['en_us']['citacao_autor'] ?? '' ); ?>"
                        />
                    </div>
                </div>
            </div>

            <div id="tab-experiencias" class="tab-content">
                <h2>Experiências Profissionais</h2>
                
                <div class="cv-admin-section">
                    <p class="description">Adicione, edite ou remova suas experiências profissionais.</p>
                    
                    <div id="experiencias-repeater" class="repeater-container">
                        <?php 
                        $experiencias = $cv_data['experiencias'] ?? array();
                        if ( empty( $experiencias ) ) {
                            $experiencias = array( array() );
                        }

                        foreach ( $experiencias as $index => $exp ) : 
                        ?>
                            <div class="repeater-item">
                                <div class="repeater-header">
                                    <span class="repeater-title">Experiência <?php echo esc_html( $index + 1 ); ?></span>
                                    <button type="button" class="button button-small remove-repeater">
                                        <?php esc_html_e( 'Remover', 'odyssee' ); ?>
                                    </button>
                                </div>

                                <div class="repeater-fields">
                                    <div class="field-group field-3col">
                                        <div>
                                            <label>Título/Cargo</label>
                                            <input 
                                                type="text" 
                                                name="experiencias[<?php echo esc_attr( $index ); ?>][titulo]" 
                                                value="<?php echo esc_attr( $exp['titulo'] ?? '' ); ?>"
                                                placeholder="ex: Designer Gráfico"
                                            />
                                        </div>

                                        <div>
                                            <label>Empresa</label>
                                            <input 
                                                type="text" 
                                                name="experiencias[<?php echo esc_attr( $index ); ?>][empresa]" 
                                                value="<?php echo esc_attr( $exp['empresa'] ?? '' ); ?>"
                                                placeholder="ex: First Publicidade"
                                            />
                                        </div>

                                        <div>
                                            <label>Período</label>
                                            <input 
                                                type="text" 
                                                name="experiencias[<?php echo esc_attr( $index ); ?>][periodo]" 
                                                value="<?php echo esc_attr( $exp['periodo'] ?? '' ); ?>"
                                                placeholder="ex: 2023 - 2024"
                                            />
                                        </div>
                                    </div>

                                    <div class="field-group">
                                        <label>Descrição (PT-BR)</label>
                                        <textarea 
                                            name="experiencias[<?php echo esc_attr( $index ); ?>][descricao_pt]" 
                                            rows="3"
                                            placeholder="Descreva as atividades em português"
                                        ><?php echo esc_textarea( $exp['descricao_pt'] ?? '' ); ?></textarea>
                                    </div>

                                    <div class="field-group">
                                        <label>Descrição (EN-US)</label>
                                        <textarea 
                                            name="experiencias[<?php echo esc_attr( $index ); ?>][descricao_en]" 
                                            rows="3"
                                            placeholder="Describe activities in English"
                                        ><?php echo esc_textarea( $exp['descricao_en'] ?? '' ); ?></textarea>
                                    </div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>

                    <button type="button" class="button button-primary add-repeater" data-repeater="experiencias-repeater" data-template="experiencia-template">
                        <?php esc_html_e( '+ Adicionar Experiência', 'odyssee' ); ?>
                    </button>
                </div>
            </div>

            <div id="tab-cursos" class="tab-content">
                <h2>Cursos e Formação</h2>
                
                <div class="cv-admin-section">
                    <p class="description">Adicione, edite ou remova seus cursos e formações.</p>
                    
                    <div id="cursos-repeater" class="repeater-container">
                        <?php 
                        $cursos = $cv_data['cursos'] ?? array();
                        if ( empty( $cursos ) ) {
                            $cursos = array( array() );
                        }

                        foreach ( $cursos as $index => $curso ) : 
                        ?>
                            <div class="repeater-item">
                                <div class="repeater-header">
                                    <span class="repeater-title">Curso <?php echo esc_html( $index + 1 ); ?></span>
                                    <button type="button" class="button button-small remove-repeater">
                                        <?php esc_html_e( 'Remover', 'odyssee' ); ?>
                                    </button>
                                </div>

                                <div class="repeater-fields">
                                    <div class="field-group field-3col">
                                        <div>
                                            <label>Nome do Curso</label>
                                            <input 
                                                type="text" 
                                                name="cursos[<?php echo esc_attr( $index ); ?>][nome]" 
                                                value="<?php echo esc_attr( $curso['nome'] ?? '' ); ?>"
                                                placeholder="ex: Designer Gráfico"
                                            />
                                        </div>

                                        <div>
                                            <label>Instituição</label>
                                            <input 
                                                type="text" 
                                                name="cursos[<?php echo esc_attr( $index ); ?>][instituicao]" 
                                                value="<?php echo esc_attr( $curso['instituicao'] ?? '' ); ?>"
                                                placeholder="ex: Universidade X"
                                            />
                                        </div>

                                        <div>
                                            <label>Data Final</label>
                                            <input 
                                                type="text" 
                                                name="cursos[<?php echo esc_attr( $index ); ?>][data_final]" 
                                                value="<?php echo esc_attr( $curso['data_final'] ?? '' ); ?>"
                                                placeholder="ex: 2024 ou presente"
                                            />
                                        </div>
                                    </div>

                                    <div class="field-group">
                                        <label>Descrição (PT-BR) <em>(opcional)</em></label>
                                        <textarea 
                                            name="cursos[<?php echo esc_attr( $index ); ?>][descricao_pt]" 
                                            rows="2"
                                            placeholder="Detalhes sobre o curso em português"
                                        ><?php echo esc_textarea( $curso['descricao_pt'] ?? '' ); ?></textarea>
                                    </div>

                                    <div class="field-group">
                                        <label>Descrição (EN-US) <em>(opcional)</em></label>
                                        <textarea 
                                            name="cursos[<?php echo esc_attr( $index ); ?>][descricao_en]" 
                                            rows="2"
                                            placeholder="Course details in English"
                                        ><?php echo esc_textarea( $curso['descricao_en'] ?? '' ); ?></textarea>
                                    </div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>

                    <button type="button" class="button button-primary add-repeater" data-repeater="cursos-repeater" data-template="curso-template">
                        <?php esc_html_e( '+ Adicionar Curso', 'odyssee' ); ?>
                    </button>
                </div>
            </div>

            <div id="tab-habilidades" class="tab-content">
                <h2>Habilidades</h2>
                
                <div class="cv-admin-section">
                    <p class="description">Gerenciar habilidades por categoria: Softwares, Criativos, Office, Programação e Sistemas Operacionais.</p>
                    
                    <?php
                    $categorias = array(
                        'criativos' => 'Softwares Criativos',
                        'office' => 'Office',
                        'programacao' => 'Programação e suas linguagens',
                        'os' => 'Sistemas Operacionais',
                    );

                    $habilidades = $cv_data['habilidades'] ?? array();

                    foreach ( $categorias as $categoria_key => $categoria_label ) : ?>
                        <div class="habilidades-categoria">
                            <h3><?php echo esc_html( $categoria_label ); ?></h3>
                            
                            <div id="habilidades-<?php echo esc_attr( $categoria_key ); ?>-repeater" class="repeater-container">
                                <?php
                                $items = $habilidades[ $categoria_key ] ?? array();
                                if ( empty( $items ) ) {
                                    $items = array( array() );
                                }

                                foreach ( $items as $index => $item ) : 
                                ?>
                                    <div class="repeater-item habilidade-item">
                                        <div class="repeater-header">
                                            <span class="repeater-title">
                                                <?php echo esc_html( $item['nome'] ?? "Habilidade " . ( $index + 1 ) ); ?>
                                            </span>
                                            <button type="button" class="button button-small remove-repeater">
                                                <?php esc_html_e( 'Remover', 'odyssee' ); ?>
                                            </button>
                                        </div>

                                        <div class="repeater-fields">
                                            <div class="field-group field-2col">
                                                <div>
                                                    <label>Nome <em>(opcional)</em></label>
                                                    <input 
                                                        type="text" 
                                                        name="habilidades[<?php echo esc_attr( $categoria_key ); ?>][<?php echo esc_attr( $index ); ?>][nome]" 
                                                        value="<?php echo esc_attr( $item['nome'] ?? '' ); ?>"
                                                        placeholder="ex: Adobe Photoshop"
                                                        class="habilidade-nome-input"
                                                    />
                                                </div>

                                                <div>
                                                    <label>Nível de Proficiência</label>
                                                    <select name="habilidades[<?php echo esc_attr( $categoria_key ); ?>][<?php echo esc_attr( $index ); ?>][nivel]">
                                                        <option value="">-- Selecione --</option>
                                                        <option value="iniciante" <?php selected( $item['nivel'] ?? '', 'iniciante' ); ?>>Iniciante</option>
                                                        <option value="intermediário" <?php selected( $item['nivel'] ?? '', 'intermediário' ); ?>>Intermediário</option>
                                                        <option value="avançado" <?php selected( $item['nivel'] ?? '', 'avançado' ); ?>>Avançado</option>
                                                        <option value="expert" <?php selected( $item['nivel'] ?? '', 'expert' ); ?>>Expert</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div class="field-group">
                                                <label>Ícone (SVG ou PNG)</label>
                                                <div class="media-upload-group">
                                                    <input 
                                                        type="hidden" 
                                                        name="habilidades[<?php echo esc_attr( $categoria_key ); ?>][<?php echo esc_attr( $index ); ?>][icon_url]" 
                                                        class="icon-url" 
                                                        value="<?php echo esc_attr( $item['icon_url'] ?? '' ); ?>"
                                                    />
                                                    <input 
                                                        type="hidden" 
                                                        name="habilidades[<?php echo esc_attr( $categoria_key ); ?>][<?php echo esc_attr( $index ); ?>][icon_id]" 
                                                        class="icon-id" 
                                                        value="<?php echo esc_attr( $item['icon_id'] ?? '' ); ?>"
                                                    />

                                                    <div class="icon-preview">
                                                        <?php 
                                                        if ( ! empty( $item['icon_url'] ) ) {
                                                            echo wp_kses_post( odyssee_cv_render_icon( $item['icon_url'], $item['nome'] ?? '' ) );
                                                        } else {
                                                            echo '<span class="placeholder">Nenhuma imagem</span>';
                                                        }
                                                        ?>
                                                    </div>

                                                    <button type="button" class="button upload-icon-button">
                                                        <?php esc_html_e( 'Escolher Arquivo', 'odyssee' ); ?>
                                                    </button>

                                                    <?php if ( ! empty( $item['icon_url'] ) ) : ?>
                                                        <button type="button" class="button remove-icon-button">
                                                            <?php esc_html_e( 'Remover Imagem', 'odyssee' ); ?>
                                                        </button>
                                                    <?php endif; ?>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            </div>

                            <button type="button" class="button button-primary add-repeater" data-repeater="habilidades-<?php echo esc_attr( $categoria_key ); ?>-repeater" data-template="habilidade-template">
                                <?php 
                                
                                echo sprintf( esc_html__( '+ Adicionar %s', 'odyssee' ), esc_html( $categoria_label ) );
                                ?>
                            </button>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>

            <div class="form-actions">
                <?php submit_button( 'Salvar Alterações', 'primary', 'odyssee_cv_submit', true ); ?>
            </div>
        </form>
    </div>

    <script type="text/html" id="experiencia-template">
        <div class="repeater-item">
            <div class="repeater-header">
                <span class="repeater-title">Nova Experiência</span>
                <button type="button" class="button button-small remove-repeater">
                    <?php esc_html_e( 'Remover', 'odyssee' ); ?>
                </button>
            </div>

            <div class="repeater-fields">
                <div class="field-group field-3col">
                    <div>
                        <label>Título/Cargo</label>
                        <input 
                            type="text" 
                            name="experiencias[{index}][titulo]" 
                            placeholder="ex: Designer Gráfico"
                        />
                    </div>

                    <div>
                        <label>Empresa</label>
                        <input 
                            type="text" 
                            name="experiencias[{index}][empresa]" 
                            placeholder="ex: First Publicidade"
                        />
                    </div>

                    <div>
                        <label>Período</label>
                        <input 
                            type="text" 
                            name="experiencias[{index}][periodo]" 
                            placeholder="ex: 2023 - 2024"
                        />
                    </div>
                </div>

                <div class="field-group">
                    <label>Descrição (PT-BR)</label>
                    <textarea 
                        name="experiencias[{index}][descricao_pt]" 
                        rows="3"
                        placeholder="Descreva as atividades em português"
                    ></textarea>
                </div>

                <div class="field-group">
                    <label>Descrição (EN-US)</label>
                    <textarea 
                        name="experiencias[{index}][descricao_en]" 
                        rows="3"
                        placeholder="Describe activities in English"
                    ></textarea>
                </div>
            </div>
        </div>
    </script>

    <script type="text/html" id="curso-template">
        <div class="repeater-item">
            <div class="repeater-header">
                <span class="repeater-title">Novo Curso</span>
                <button type="button" class="button button-small remove-repeater">
                    <?php esc_html_e( 'Remover', 'odyssee' ); ?>
                </button>
            </div>

            <div class="repeater-fields">
                <div class="field-group field-3col">
                    <div>
                        <label>Nome do Curso</label>
                        <input 
                            type="text" 
                            name="cursos[{index}][nome]" 
                            placeholder="ex: Designer Gráfico"
                        />
                    </div>

                    <div>
                        <label>Instituição</label>
                        <input 
                            type="text" 
                            name="cursos[{index}][instituicao]" 
                            placeholder="ex: Universidade X"
                        />
                    </div>

                    <div>
                        <label>Data Final</label>
                        <input 
                            type="text" 
                            name="cursos[{index}][data_final]" 
                            placeholder="ex: 2024 ou presente"
                        />
                    </div>
                </div>

                <div class="field-group">
                    <label>Descrição (PT-BR) <em>(opcional)</em></label>
                    <textarea 
                        name="cursos[{index}][descricao_pt]" 
                        rows="2"
                        placeholder="Detalhes sobre o curso em português"
                    ></textarea>
                </div>

                <div class="field-group">
                    <label>Descrição (EN-US) <em>(opcional)</em></label>
                    <textarea 
                        name="cursos[{index}][descricao_en]" 
                        rows="2"
                        placeholder="Course details in English"
                    ></textarea>
                </div>
            </div>
        </div>
    </script>

    <script type="text/html" id="habilidade-template">
        <div class="repeater-item habilidade-item">
            <div class="repeater-header">
                <span class="repeater-title">Nova Habilidade</span>
                <button type="button" class="button button-small remove-repeater">
                    <?php esc_html_e( 'Remover', 'odyssee' ); ?>
                </button>
            </div>

            <div class="repeater-fields">
                <div class="field-group field-2col">
                    <div>
                        <label>Nome <em>(opcional)</em></label>
                        <input 
                            type="text" 
                            name="habilidades[{categoria}][{index}][nome]" 
                            placeholder="ex: Adobe Photoshop"
                            class="habilidade-nome-input"
                        />
                    </div>

                    <div>
                        <label>Nível de Proficiência</label>
                        <select name="habilidades[{categoria}][{index}][nivel]">
                            <option value="">-- Selecione --</option>
                            <option value="iniciante">Iniciante</option>
                            <option value="intermediário">Intermediário</option>
                            <option value="avançado">Avançado</option>
                            <option value="expert">Expert</option>
                        </select>
                    </div>
                </div>

                <div class="field-group">
                    <label>Ícone (SVG ou PNG)</label>
                    <div class="media-upload-group">
                        <input 
                            type="hidden" 
                            name="habilidades[{categoria}][{index}][icon_url]" 
                            class="icon-url" 
                        />
                        <input 
                            type="hidden" 
                            name="habilidades[{categoria}][{index}][icon_id]" 
                            class="icon-id" 
                        />

                        <div class="icon-preview">
                            <span class="placeholder">Nenhuma imagem</span>
                        </div>

                        <button type="button" class="button upload-icon-button">
                            <?php esc_html_e( 'Escolher Arquivo', 'odyssee' ); ?>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </script>

    <?php
}

function odyssee_cv_render_icon( $icon_url, $alt_text = '' ) {
    if ( empty( $icon_url ) ) {
        return '';
    }

    $parsed_url = parse_url( $icon_url );
    $path = isset( $parsed_url['path'] ) ? $parsed_url['path'] : '';
    
    if ( stripos( $path, '.svg' ) !== false ) {
        return sprintf(
            '<svg class="habilidade-icon-preview" data-src="%s" alt="%s"></svg>',
            esc_url( $icon_url ),
            esc_attr( $alt_text )
        );
    } else {
        return sprintf(
            '<img class="habilidade-icon-preview" src="%s" alt="%s" />',
            esc_url( $icon_url ),
            esc_attr( $alt_text )
        );
    }
}

function odyssee_cv_get_data() {
    $data = get_option( 'odyssee_cv_data', array() );

    $defaults = array(
        'descricao' => array(
            'pt_br' => array(
                'intro_1' => '',
                'intro_2' => '',
                'expectativa' => '',
                'citacao' => '',
                'citacao_autor' => '',
            ),
            'en_us' => array(
                'intro_1' => '',
                'intro_2' => '',
                'expectativa' => '',
                'citacao' => '',
                'citacao_autor' => '',
            ),
        ),
        'experiencias' => array(),
        'cursos' => array(),
        'habilidades' => array(
            'criativos' => array(),
            'office' => array(),
            'programacao' => array(),
            'os' => array(),
        ),
    );

    return wp_parse_args( $data, $defaults );
}

function odyssee_cv_save_data() {
    if ( ! current_user_can( 'manage_options' ) ) {
        return;
    }

    $data = array(
        'descricao' => array(
            'pt_br' => array(
                'intro_1' => isset( $_POST['descricao']['pt_br']['intro_1'] ) ? sanitize_textarea_field( $_POST['descricao']['pt_br']['intro_1'] ) : '',
                'intro_2' => isset( $_POST['descricao']['pt_br']['intro_2'] ) ? sanitize_textarea_field( $_POST['descricao']['pt_br']['intro_2'] ) : '',
                'expectativa' => isset( $_POST['descricao']['pt_br']['expectativa'] ) ? sanitize_textarea_field( $_POST['descricao']['pt_br']['expectativa'] ) : '',
                'citacao' => isset( $_POST['descricao']['pt_br']['citacao'] ) ? sanitize_textarea_field( $_POST['descricao']['pt_br']['citacao'] ) : '',
                'citacao_autor' => isset( $_POST['descricao']['pt_br']['citacao_autor'] ) ? sanitize_text_field( $_POST['descricao']['pt_br']['citacao_autor'] ) : '',
            ),
            'en_us' => array(
                'intro_1' => isset( $_POST['descricao']['en_us']['intro_1'] ) ? sanitize_textarea_field( $_POST['descricao']['en_us']['intro_1'] ) : '',
                'intro_2' => isset( $_POST['descricao']['en_us']['intro_2'] ) ? sanitize_textarea_field( $_POST['descricao']['en_us']['intro_2'] ) : '',
                'expectativa' => isset( $_POST['descricao']['en_us']['expectativa'] ) ? sanitize_textarea_field( $_POST['descricao']['en_us']['expectativa'] ) : '',
                'citacao' => isset( $_POST['descricao']['en_us']['citacao'] ) ? sanitize_textarea_field( $_POST['descricao']['en_us']['citacao'] ) : '',
                'citacao_autor' => isset( $_POST['descricao']['en_us']['citacao_autor'] ) ? sanitize_text_field( $_POST['descricao']['en_us']['citacao_autor'] ) : '',
            ),
        ),
        'experiencias' => odyssee_cv_sanitize_repeater( $_POST['experiencias'] ?? array() ),
        'cursos' => odyssee_cv_sanitize_repeater( $_POST['cursos'] ?? array() ),
        'habilidades' => odyssee_cv_sanitize_habilidades( $_POST['habilidades'] ?? array() ),
    );

    update_option( 'odyssee_cv_data', $data );
}

function odyssee_cv_sanitize_repeater( $items ) {
    if ( ! is_array( $items ) ) {
        return array();
    }

    $sanitized = array();
    foreach ( $items as $item ) {
        if ( ! is_array( $item ) ) {
            continue;
        }

        $has_content = ! empty( $item['titulo'] ) || ! empty( $item['nome'] ) || 
                      ! empty( $item['empresa'] ) || ! empty( $item['instituicao'] );
        
        if ( $has_content ) {
            $sanitized[] = array(
                'titulo' => isset( $item['titulo'] ) ? sanitize_text_field( $item['titulo'] ) : '',
                'empresa' => isset( $item['empresa'] ) ? sanitize_text_field( $item['empresa'] ) : '',
                'instituicao' => isset( $item['instituicao'] ) ? sanitize_text_field( $item['instituicao'] ) : '',
                'periodo' => isset( $item['periodo'] ) ? sanitize_text_field( $item['periodo'] ) : '',
                'data_final' => isset( $item['data_final'] ) ? sanitize_text_field( $item['data_final'] ) : '',
                'nome' => isset( $item['nome'] ) ? sanitize_text_field( $item['nome'] ) : '',
                'descricao_pt' => isset( $item['descricao_pt'] ) ? sanitize_textarea_field( $item['descricao_pt'] ) : '',
                'descricao_en' => isset( $item['descricao_en'] ) ? sanitize_textarea_field( $item['descricao_en'] ) : '',
            );
        }
    }

    return $sanitized;
}

function odyssee_cv_sanitize_habilidades( $habilidades_raw ) {
    if ( ! is_array( $habilidades_raw ) ) {
        return array();
    }

    $sanitized = array();
    $categorias = array( 'criativos', 'office', 'programacao', 'os' );

    foreach ( $categorias as $categoria ) {
        $sanitized[ $categoria ] = array();

        if ( isset( $habilidades_raw[ $categoria ] ) && is_array( $habilidades_raw[ $categoria ] ) ) {
            foreach ( $habilidades_raw[ $categoria ] as $item ) {
                if ( is_array( $item ) && ! empty( $item['nome'] ?? $item['icon_url'] ?? '' ) ) {
                    $sanitized[ $categoria ][] = array(
                        'nome' => isset( $item['nome'] ) ? sanitize_text_field( $item['nome'] ) : '',
                        'nivel' => isset( $item['nivel'] ) ? sanitize_text_field( $item['nivel'] ) : '',
                        'icon_url' => isset( $item['icon_url'] ) ? esc_url_raw( $item['icon_url'] ) : '',
                        'icon_id' => isset( $item['icon_id'] ) ? intval( $item['icon_id'] ) : 0,
                    );
                }
            }
        }
    }

    return $sanitized;
}

add_action( 'wp_ajax_odyssee_upload_icon', 'odyssee_cv_ajax_upload_icon' );
function odyssee_cv_ajax_upload_icon() {
    check_ajax_referer( 'odyssee_cv_nonce', 'nonce' );

    if ( ! current_user_can( 'upload_files' ) ) {
        wp_send_json_error( 'Sem permissão para fazer upload' );
    }

    if ( empty( $_FILES['file'] ) ) {
        wp_send_json_error( 'Nenhum arquivo enviado' );
    }

    $file = $_FILES['file'];
    $allowed_types = array( 'image/svg+xml', 'image/png', 'image/jpeg' );

    if ( ! in_array( $file['type'], $allowed_types, true ) ) {
        wp_send_json_error( 'Tipo de arquivo não permitido. Use SVG, PNG ou JPEG.' );
    }

    $upload = wp_handle_upload( $file, array( 'test_form' => false ) );

    if ( isset( $upload['error'] ) ) {
        wp_send_json_error( $upload['error'] );
    }

    wp_send_json_success( array(
        'url' => $upload['url'],
        'id' => attachment_url_to_postid( $upload['url'] ),
    ) );
}

add_action( 'admin_init', 'odyssee_cv_migrate_legacy_data' );
function odyssee_cv_migrate_legacy_data() {
    
    if ( get_option( 'odyssee_cv_data' ) ) {
        return; 
    }

    $default_data = array(
        'descricao' => array(
            'pt_br' => array(
                'intro_1' => 'Tenho 24 anos, sou designer gráfico graduado. Atuo principalmente nas áreas de design gráfico, edição de vídeo, ilustração digital e motion design.',
                'intro_2' => 'Trabalho bem em equipe, presencialmente ou remotamente. Consigo atender bem a propostas de briefing, lido bem com diferentes tipos de identidade visual e segmentos.',
            ),
            'en_us' => array(
                'intro_1' => "I'm 24 years old, a graduate graphic designer. I work mainly in the areas of graphic design, video editing, digital illustration and motion design.",
                'intro_2' => 'I work well in teams, on-site or remotely. I can handle briefing proposals well, and deal with different types of visual identity and segments.',
            ),
        ),
        'experiencias' => array(
            array(
                'titulo' => 'Mobile Minecraft',
                'empresa' => 'Mobile Minecraft',
                'periodo' => '2016 - 2018',
                'descricao_pt' => "Desenvolvimento e criação de banners para o Blog.\nRedator de matérias e revisor das demais matérias publicadas.\nAuxiliar no desenvolvimento da UX/UI do blog.\nAuxiliar na criação e desenvolvimento da identidade visual do site.",
                'descricao_en' => "Development and creation of banners for the Blog.\nWriter of articles and reviewer of other published articles.\nAssist in the development of the blog UX/UI.\nAssist in the creation and development of the site visual identity.",
            ),
            array(
                'titulo' => 'Recepcionista',
                'empresa' => 'Fleury S.A',
                'periodo' => '2020 - 2022',
                'descricao_pt' => "Atendimento e abertura de ficha de exames médicos.\nAtendimento à empresas e convênios credenciados.\nTreinador de novos trabalhadores para a recepção e abertura de ficha.\nArmazenador de arquivos da unidade de atendimento.",
                'descricao_en' => "Customer service and opening of medical exam records.\nService to accredited companies and health plans.\nTrainer of new workers for reception and record opening.\nStorage of service unit files.",
            ),
            array(
                'titulo' => 'Estagiário em Design Gráfico',
                'empresa' => 'ANYMOUS',
                'periodo' => '2023 - 2023',
                'descricao_pt' => "Criação e elaboração de posts e carroséis para instagram.\nCriação e elaboração de reels para instagram.\nRedator e tratar fotos de produtos para marketplace.\nUX/UI do site. Gestão de ícones, símbolos e acessibilidade da página.",
                'descricao_en' => "Creation and development of posts and carousels for Instagram.\nCreation and development of reels for Instagram.\nWriter and product photo editor for marketplace.\nWebsite UX/UI. Management of icons, symbols and page accessibility.",
            ),
            array(
                'titulo' => 'Corte de letras-caixa',
                'empresa' => 'Div Term Tecnomoldura',
                'periodo' => '2023 - 2023',
                'descricao_pt' => "Gerar arquivos escalonados e compatíveis para recorte em máquina laser, fio quente e MDF.\nElaborar aproveitamento de material em software para recorte em máquinas.\nOperação de corte laser e de corte a fio quente.\nElaborar tipografias e adapta-las para corte em máquinas de acordo com suas limitações.",
                'descricao_en' => "Generate scaled and compatible files for laser cutting, hot-wire cutting and MDF.\nDevelop material optimization in software for machine cutting.\nLaser cutting and hot wire cutting operation.\nDevelop typography and adapt it for cutting in machinery according to its limitations.",
            ),
            array(
                'titulo' => 'Designer Gráfico',
                'empresa' => 'First Publicidade',
                'periodo' => '2024 - 2024',
                'descricao_pt' => "Criação e elaboração de posts e carroséis para instagram de diversas identidades visuais.\nCriação de posts para as campanhas políticas de candidatos vereadores e prefeitos do estado de São Paulo.\nBranding de posts trens e interativos para redes sociais.",
                'descricao_en' => "Creation and development of posts and carousels for Instagram with various visual identities.\nCreation of posts for political campaigns of city council and mayor candidates in São Paulo state.\nBranding of trendy and interactive posts for social media.",
            ),
            array(
                'titulo' => 'Designer Gráfico Jr.',
                'empresa' => 'Percons',
                'periodo' => '2025 - 2026',
                'descricao_pt' => "Criação de artes para posts em redes sociais.\nEdição de vídeos curtos e reels animados\nCriar e fechar arquivos para impressões\nElaborar e criar identidades visuais e logos para marcas",
                'descricao_en' => "Creating artwork for social media posts.\nEditing short videos and animated reels\nPreparing print-ready files\nDesigning visual identities and logos for brands",
            ),
        ),
        'cursos' => array(
            array(
                'nome' => 'Curso - Caution Pontocom',
                'instituicao' => 'Caution Pontocom',
                'data_final' => '',
                'descricao_pt' => 'Curso de informática e inglês - 194h/aula',
                'descricao_en' => 'Computer science and English course - 194 hours',
            ),
            array(
                'nome' => 'CST em Design Gráfico',
                'instituicao' => 'UNICID',
                'data_final' => '2023',
                'descricao_pt' => 'Faculdade - 4 semestres',
                'descricao_en' => 'College - 4 semesters',
            ),
        ),
        'habilidades' => array(
            'softwares' => array(),
            'criativos' => array(),
            'office' => array(),
            'os' => array(),
        ),
    );

    update_option( 'odyssee_cv_data', $default_data );

    error_log( '[ODYSSEE CV] Dados legados migrados com sucesso para odyssee_cv_data' );
}

add_action( 'wp_head', 'odyssee_cv_localize_frontend_data', 5 );
function odyssee_cv_localize_frontend_data() {
    if ( is_page_template( 'page-sobre-mim.php' ) ) {
        $cv_data = odyssee_cv_get_data();

        $has_skills = ! empty( $cv_data['habilidades'] );
        $skills_count = 0;
        if ( is_array( $cv_data['habilidades'] ) ) {
            foreach ( $cv_data['habilidades'] as $cat => $items ) {
                $skills_count += count( $items );
            }
        }
        
        error_log( '[odyssee-cv] odyssee_cv_localize_frontend_data executada: ' . ( $has_skills ? 'com ' . $skills_count . ' habilidades' : 'sem habilidades' ) );

        echo '<script>';
        echo 'window.odysseeCVData = ' . wp_json_encode( $cv_data ) . ';';
        echo 'console.log("[odyssee-cv] Dados injetados no window:", window.odysseyCVData);';
        echo '</script>';
    }
}

