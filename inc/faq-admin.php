<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

add_action( 'admin_menu', 'odyssee_faq_add_admin_menu' );
function odyssee_faq_add_admin_menu() {
    add_menu_page(
        'Gerenciar FAQ',
        'Gerenciar FAQ',
        'manage_options',
        'odyssee-faq-manager',
        'odyssee_faq_admin_page',
        'dashicons-editor-help',
        26
    );
}

add_action( 'admin_enqueue_scripts', 'odyssee_faq_enqueue_admin_assets' );
function odyssee_faq_enqueue_admin_assets( $hook_suffix ) {
    if ( 'toplevel_page_odyssee-faq-manager' !== $hook_suffix ) {
        return;
    }

    wp_enqueue_style(
        'odyssee-faq-admin',
        get_template_directory_uri() . '/inc/faq-admin.css',
        array(),
        '1.0.0'
    );

    wp_enqueue_script(
        'odyssee-faq-admin',
        get_template_directory_uri() . '/inc/faq-admin.js',
        array( 'jquery', 'jquery-ui-sortable' ),
        '1.0.0',
        true
    );
}

function odyssee_faq_get_data() {
    $data = get_option( 'odyssee_faq_data', array() );

    if ( ! empty( $data ) && is_array( $data ) ) {
        return $data;
    }

    $default_data = array(
        'hero_title_pt'    => 'FAQ – Perguntas Frequentes',
        'hero_title_en'    => 'FAQ – Frequently Asked Questions',
        'hero_subtitle_pt' => 'Tire suas dúvidas sobre serviços, prazos e processos',
        'hero_subtitle_en' => 'Get answers about services, deadlines and processes',
        'categorias'       => array(
            array(
                'nome_pt'       => 'Serviços Gerais',
                'nome_en'       => 'General Services',
                'subcategorias' => array(
                    array(
                        'nome_pt'   => 'Prazos e Entregas',
                        'nome_en'   => 'Deadlines & Deliveries',
                        'perguntas' => array(
                            array(
                                'pergunta_pt' => 'Quais são os prazos para entrega?',
                                'pergunta_en' => 'What are the delivery deadlines?',
                                'resposta_pt' => "Os prazos variam conforme o serviço, mas em geral: vídeos curtos até 2 dias úteis, vídeos longos até 5 dias úteis, porém pode variar em até 3 dias a mais caso seja necessário muito VFX no vídeo.\n\nDesign gráfico depende da complexidade, mas costumo entregar bem rápido. Como posts, carroséis e stories, entrego no mesmo dia de 5 posts ou stories e 2 carrosséis (isso na hipótese de uma arte complexa com estudo de design estratégico applied).\n\nEm Ilustrações digitais o prazo é determinado pelo traço e complexidade da arte, como por exemplo. Artes de esboço entrego no mesmo dia, já artes completas de perfil ou corpo inteiro em até 5 dias. Artes com background 7 dias. Porém o tempo pode variar muito dependendo do nosso contato, pois a ilustração é o auge da exclusividade de algo único e fora de padrões de IA. Então a cada passo significativo que dou na arte, eu encaminho o andamento para você através do nosso canal de contato. Assim já podemos fazer alterações no andamento da arte para que ela siga exatamente como sua imaginação a queira.\n\nPara motion e impressos segue da mesma forma como das ilustrações digitais, com um diferencial que em motion pode levar até um mês. Tudo isso é descrito em contrato também.",
                                'resposta_en' => "Deadlines vary depending on the service, but in general: short videos up to 2 business days, long videos up to 5 business days, but may vary up to 3 more days if a lot of VFX is needed in the video.\n\nGraphic design depends on complexity, but I usually deliver very fast. For posts, carousels and stories, I deliver on the same day 5 posts or stories and 2 carousels (assuming complex art with applied strategic design study).\n\nIn digital illustrations, the deadline is determined by the stroke and complexity of the art. For example, sketch art I deliver on the same day, while complete profile or full body art in up to 5 days. Art with background takes 7 days. However, the time can vary greatly depending on our contact, as illustration is the peak of exclusivity for something unique and outside AI standards. So at each significant step I take in the art, I forward the progress to you through our contact channel. This way we can already make changes during the art progress so it follows exactly as your imagination wants it.\n\nFor motion and print, it follows the same way as digital illustrations, with a difference that motion can take up to a month. All of this is also described in the contract.",
                                'links'       => array()
                            ),
                            array(
                                'pergunta_pt' => 'Quais formas de pagamento você aceita?',
                                'pergunta_en' => 'What payment methods do you accept?',
                                'resposta_pt' => "PIX ou Mercado Pago. A chave PIX é meu número celular que você entra em contato comigo, conta do mercado pago que consta com meu nome de RG. O Mercado Pago eu encaminho o link do produto comprado.",
                                'resposta_en' => "PIX or Mercado Pago. The PIX key is my cell phone number that you contact me with, Mercado Pago account that appears with my ID name. For Mercado Pago I forward the link of the purchased product.",
                                'links'       => array()
                            )
                        )
                    ),
                    array(
                        'nome_pt'   => 'Contratos e Documentos',
                        'nome_en'   => 'Contracts & Documents',
                        'perguntas' => array(
                            array(
                                'pergunta_pt' => 'Como funcionam os contratos dos serviços?',
                                'pergunta_en' => 'How do service contracts work?',
                                'resposta_pt' => "Todos os produtos incluem um contrato prévio para garantir a ambos, contratante e contratado, a terem seus direitos respeitados legalmente.\n\nAbaixo você pode acessar o modelo prévio de contrato para cada tipo de produto. (Lembrando que é apenas uma base dos contratos, eles podem ter cláusulas diferentes dependendo da forma como acordarmos em conversa privada)",
                                'resposta_en' => "All products include a prior contract to guarantee that both the contractor and the hired have their rights legally respected.\n\nBelow you can access the prior contract template for each type of product. (Remember that it is just a basis for contracts, they may have different clauses depending on how we agree in private conversation)",
                                'links'       => array(
                                    array( 'label_pt' => 'Design Gráfico', 'label_en' => 'Graphic Design', 'url' => 'https://drive.google.com/drive/folders/1gYbWEsO8EpCoE5DtYuHSith5zon9oQFb?usp=sharing' ),
                                    array( 'label_pt' => 'Edição de Vídeo', 'label_en' => 'Video Editing', 'url' => 'https://drive.google.com/drive/folders/1THNqbjQnkSfTDrKMw3GYvq6f4-JQS40m?usp=sharing' ),
                                    array( 'label_pt' => 'Motion Design', 'label_en' => 'Motion Design', 'url' => 'https://drive.google.com/drive/folders/1wjSVfwb5RIWyS1AePXqVrah5An1n-XLD?usp=sharing' ),
                                    array( 'label_pt' => 'Ilustração Digital', 'label_en' => 'Digital Illustration', 'url' => 'https://drive.google.com/drive/folders/1whPefWpeVXPnRS8I-6Cm27t9x7dobF0B?usp=sharing' ),
                                    array( 'label_pt' => 'Recorrente Mensal', 'label_en' => 'Monthly Recurring', 'url' => 'https://drive.google.com/drive/folders/1MOxTizJ9oV-kkuop7b0inF0PLxmR6lAK?usp=sharing' )
                                )
                            ),
                            array(
                                'pergunta_pt' => 'Você possui algum certificado profissional?',
                                'pergunta_en' => 'Do you have any professional certificates?',
                                'resposta_pt' => "Sim, possuo formação acadêmica e um currículo profissional nos parâmetros.\n\nAbaixo você pode acessar tanto meu certificado acadêmico, como meu currículo profissional.",
                                'resposta_en' => "Yes, I have academic training and a professional resume within standards.\n\nBelow you can access both my academic certificate and my professional resume.",
                                'links'       => array(
                                    array( 'label_pt' => 'Certificado Acadêmico', 'label_en' => 'Academic Certificate', 'url' => 'https://cse.webapp.abaris.com.br/diploma/417.417.67f671e5144a' ),
                                    array( 'label_pt' => 'Currículo Profissional', 'label_en' => 'Professional Resume', 'url' => 'https://drive.google.com/file/d/1vWRiyfAw84O_IzBJEljPaMi4pWoz6sAY/view?usp=sharing' )
                                )
                            ),
                            array(
                                'pergunta_pt' => 'Por que você não emite Nota Fiscal?',
                                'pergunta_en' => "Why don't you issue Tax Invoice?",
                                'resposta_pt' => "Infelizmente, não emito nota fiscal avulsa, pois \"o serviço me fora negado pela prefeitura de onde resido\". Como mostrado no print abaixo, o atendimento deles é precário e não há sequer explicação clara sobre o motivo da negativa.\n\nOutro ponto que espero que você compreenda ao contratar meus serviços: estou oferecendo um trabalho profissional, de alta qualidade, por um valor extremamente acessível. A emissão de nota fiscal, neste momento, representaria uma perda significativa de receita, já que:\n\n\"O valor de imposto da nota fiscal avulsa é 11% de INSS (Instituto Nacional do Seguro Social), além do IRRF, Imposto de Renda Retido na Fonte, que depende do tipo de serviço, variando de 1% a 1,5%.\"\n\n\"Imposto sobre Serviço de Qualquer Natureza (ISS): Cada município regula a tarifa do ISS, ficando entre 2% e 5% sobre a nota fiscal de serviços eletrônica. É aplicado para empresas e profissionais autônomos.\"\n\nSe eu conseguisse emitir a nota fiscal através do MEI, eu teria que aumentar o valor para cobrir o roubo que o Estado tem sobre minha força de trabalho. Mas para fins de regulamentação, eu pretendo sim no futuro, quando estiver numa condição de vida melhor, poder abrir meu MEI e emitir a nota fiscal por cada serviço vendido.",
                                'resposta_en' => "Unfortunately, I do not issue individual tax invoices, because \"the service was denied by the city hall where I live\". As shown in the screenshot below, their service is precarious and there is not even a clear explanation of the reason for the denial.\n\nAnother point I hope you understand when hiring my services: I am offering professional, high-quality work at an extremely affordable price. Issuing tax invoices, at this time, would represent a significant loss of revenue, since:\n\n\"The tax amount for individual invoices is 11% for INSS (National Social Security Institute), plus IRRF, Withholding Income Tax, which depends on the type of service, ranging from 1% to 1.5%.\"\n\n\"Tax on Services of Any Nature (ISS): Each municipality regulates the ISS rate, ranging between 2% and 5% on the electronic service invoice. It applies to companies and self-employed professionals.\"\n\nIf I could issue tax invoices through MEI, I would have to increase the price to cover the theft that the State has over my workforce. But for regulatory purposes, I do intend in the future, when I am in a better living condition, to be able to open my MEI and issue tax invoices for each service sold.",
                                'links'       => array()
                            )
                        )
                    )
                )
            )
        )
    );

    update_option( 'odyssee_faq_data', $default_data );
    return $default_data;
}

function odyssee_faq_save_data() {
    if ( ! isset( $_POST['odyssee_faq_nonce'] ) || ! wp_verify_nonce( $_POST['odyssee_faq_nonce'], 'odyssee_faq_save' ) ) {
        return;
    }

    if ( ! current_user_can( 'manage_options' ) ) {
        return;
    }

    $raw_categorias = isset( $_POST['categorias'] ) && is_array( $_POST['categorias'] ) ? $_POST['categorias'] : array();
    $clean_categorias = array();

    foreach ( $raw_categorias as $c ) {
        $clean_cat = array(
            'nome_pt'       => sanitize_text_field( $c['nome_pt'] ?? '' ),
            'nome_en'       => sanitize_text_field( $c['nome_en'] ?? '' ),
            'subcategorias' => array()
        );

        $raw_subs = isset( $c['subcategorias'] ) && is_array( $c['subcategorias'] ) ? $c['subcategorias'] : array();
        foreach ( $raw_subs as $s ) {
            $clean_sub = array(
                'nome_pt'   => sanitize_text_field( $s['nome_pt'] ?? '' ),
                'nome_en'   => sanitize_text_field( $s['nome_en'] ?? '' ),
                'perguntas' => array()
            );

            $raw_qs = isset( $s['perguntas'] ) && is_array( $s['perguntas'] ) ? $s['perguntas'] : array();
            foreach ( $raw_qs as $q ) {
                $clean_q = array(
                    'pergunta_pt' => sanitize_text_field( $q['pergunta_pt'] ?? '' ),
                    'pergunta_en' => sanitize_text_field( $q['pergunta_en'] ?? '' ),
                    'resposta_pt' => sanitize_textarea_field( $q['resposta_pt'] ?? '' ),
                    'resposta_en' => sanitize_textarea_field( $q['resposta_en'] ?? '' ),
                    'links'       => array()
                );

                $raw_links = isset( $q['links'] ) && is_array( $q['links'] ) ? $q['links'] : array();
                foreach ( $raw_links as $l ) {
                    if ( ! empty( $l['url'] ) || ! empty( $l['label_pt'] ) ) {
                        $clean_q['links'][] = array(
                            'label_pt' => sanitize_text_field( $l['label_pt'] ?? '' ),
                            'label_en' => sanitize_text_field( $l['label_en'] ?? '' ),
                            'url'      => esc_url_raw( $l['url'] ?? '' )
                        );
                    }
                }

                $clean_sub['perguntas'][] = $clean_q;
            }

            $clean_cat['subcategorias'][] = $clean_sub;
        }

        $clean_categorias[] = $clean_cat;
    }

    $faq_data = array(
        'hero_title_pt'    => sanitize_text_field( $_POST['hero_title_pt'] ?? '' ),
        'hero_title_en'    => sanitize_text_field( $_POST['hero_title_en'] ?? '' ),
        'hero_subtitle_pt' => sanitize_text_field( $_POST['hero_subtitle_pt'] ?? '' ),
        'hero_subtitle_en' => sanitize_text_field( $_POST['hero_subtitle_en'] ?? '' ),
        'categorias'       => $clean_categorias
    );

    update_option( 'odyssee_faq_data', $faq_data );

    add_settings_error( 'odyssee_faq_messages', 'odyssee_faq_message', 'Configurações de FAQ salvas com sucesso!', 'updated' );
}

function odyssee_faq_admin_page() {
    if ( isset( $_POST['submit_faq_admin'] ) ) {
        odyssee_faq_save_data();
    }

    $faq_data = odyssee_faq_get_data();
    ?>
    <div class="wrap odyssee-faq-admin-wrap">
        <h1><span class="dashicons dashicons-editor-help"></span> Gerenciador de Perguntas Frequentes (FAQ)</h1>

        <?php settings_errors( 'odyssee_faq_messages' ); ?>

        <form method="post" class="odyssee-faq-form">
            <?php wp_nonce_field( 'odyssee_faq_save', 'odyssee_faq_nonce' ); ?>

            <div class="faq-admin-section">
                <h2>Cabeçalho Principal (Hero)</h2>
                <div class="form-row">
                    <div class="form-group">
                        <label>Título Principal (PT-BR)</label>
                        <input type="text" name="hero_title_pt" value="<?php echo esc_attr( $faq_data['hero_title_pt'] ?? '' ); ?>" class="regular-text">
                    </div>
                    <div class="form-group">
                        <label>Main Title (EN-US)</label>
                        <input type="text" name="hero_title_en" value="<?php echo esc_attr( $faq_data['hero_title_en'] ?? '' ); ?>" class="regular-text">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Subtítulo (PT-BR)</label>
                        <input type="text" name="hero_subtitle_pt" value="<?php echo esc_attr( $faq_data['hero_subtitle_pt'] ?? '' ); ?>" class="regular-text">
                    </div>
                    <div class="form-group">
                        <label>Subtitle (EN-US)</label>
                        <input type="text" name="hero_subtitle_en" value="<?php echo esc_attr( $faq_data['hero_subtitle_en'] ?? '' ); ?>" class="regular-text">
                    </div>
                </div>
            </div>

            <div class="faq-admin-section">
                <h2>Categorias, Subcategorias e Perguntas</h2>
                <p class="description">Arraste e solte pelo cabeçalho de qualquer item para alterar a ordem de exibição no site.</p>

                <div class="category-container">
                    <?php 
                    $categorias = $faq_data['categorias'] ?? array();
                    foreach ( $categorias as $cIdx => $cat ) :
                    ?>
                        <div class="category-item collapsible-item">
                            <div class="category-header collapsible-header">
                                <div class="category-title">
                                    <span class="dashicons dashicons-category"></span>
                                    <span><?php echo esc_html( ! empty( $cat['nome_pt'] ) ? $cat['nome_pt'] : 'Categoria ' . ($cIdx + 1) ); ?></span>
                                </div>
                                <button type="button" class="remove-button">Remover Categoria</button>
                            </div>
                            <div class="category-fields collapsible-body" style="display: none;">
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>Nome da Categoria (PT-BR)</label>
                                        <input type="text" data-name="categorias[{c}][nome_pt]" class="cat-name-pt regular-text" value="<?php echo esc_attr( $cat['nome_pt'] ?? '' ); ?>">
                                    </div>
                                    <div class="form-group">
                                        <label>Category Name (EN-US)</label>
                                        <input type="text" data-name="categorias[{c}][nome_en]" class="cat-name-en regular-text" value="<?php echo esc_attr( $cat['nome_en'] ?? '' ); ?>">
                                    </div>
                                </div>

                                <div class="subcategory-container">
                                    <?php 
                                    $subcategorias = $cat['subcategorias'] ?? array();
                                    foreach ( $subcategorias as $sIdx => $sub ) :
                                    ?>
                                        <div class="subcategory-item collapsible-item">
                                            <div class="subcategory-header collapsible-header">
                                                <div class="subcategory-title">
                                                    <span class="dashicons dashicons-list-view"></span>
                                                    <span><?php echo esc_html( ! empty( $sub['nome_pt'] ) ? $sub['nome_pt'] : 'Subcategoria ' . ($sIdx + 1) ); ?></span>
                                                </div>
                                                <button type="button" class="remove-button">Remover Subcategoria</button>
                                            </div>
                                            <div class="subcategory-fields collapsible-body" style="display: none;">
                                                <div class="form-row">
                                                    <div class="form-group">
                                                        <label>Nome da Subcategoria (PT-BR) <small>(Opcional)</small></label>
                                                        <input type="text" data-name="categorias[{c}][subcategorias][{s}][nome_pt]" class="subcat-name-pt regular-text" value="<?php echo esc_attr( $sub['nome_pt'] ?? '' ); ?>">
                                                    </div>
                                                    <div class="form-group">
                                                        <label>Subcategory Name (EN-US) <small>(Optional)</small></label>
                                                        <input type="text" data-name="categorias[{c}][subcategorias][{s}][nome_en]" class="subcat-name-en regular-text" value="<?php echo esc_attr( $sub['nome_en'] ?? '' ); ?>">
                                                    </div>
                                                </div>

                                                <div class="question-container">
                                                    <?php 
                                                    $perguntas = $sub['perguntas'] ?? array();
                                                    foreach ( $perguntas as $qIdx => $q ) :
                                                    ?>
                                                        <div class="question-item collapsible-item">
                                                            <div class="question-header collapsible-header">
                                                                <div class="question-title">
                                                                    <span class="dashicons dashicons-editor-help"></span>
                                                                    <span><?php echo esc_html( ! empty( $q['pergunta_pt'] ) ? $q['pergunta_pt'] : 'Pergunta ' . ($qIdx + 1) ); ?></span>
                                                                </div>
                                                                <button type="button" class="remove-button">Remover Pergunta</button>
                                                            </div>
                                                            <div class="question-fields collapsible-body" style="display: none;">
                                                                <div class="form-row">
                                                                    <div class="form-group">
                                                                        <label>Pergunta (PT-BR)</label>
                                                                        <input type="text" data-name="categorias[{c}][subcategorias][{s}][perguntas][{q}][pergunta_pt]" class="question-name-pt regular-text" value="<?php echo esc_attr( $q['pergunta_pt'] ?? '' ); ?>">
                                                                    </div>
                                                                    <div class="form-group">
                                                                        <label>Question (EN-US)</label>
                                                                        <input type="text" data-name="categorias[{c}][subcategorias][{s}][perguntas][{q}][pergunta_en]" class="question-name-en regular-text" value="<?php echo esc_attr( $q['pergunta_en'] ?? '' ); ?>">
                                                                    </div>
                                                                </div>
                                                                <div class="form-row">
                                                                    <div class="form-group">
                                                                        <label>Resposta (PT-BR)</label>
                                                                        <textarea data-name="categorias[{c}][subcategorias][{s}][perguntas][{q}][resposta_pt]" class="large-text" rows="5"><?php echo esc_textarea( $q['resposta_pt'] ?? '' ); ?></textarea>
                                                                    </div>
                                                                    <div class="form-group">
                                                                        <label>Answer (EN-US)</label>
                                                                        <textarea data-name="categorias[{c}][subcategorias][{s}][perguntas][{q}][resposta_en]" class="large-text" rows="5"><?php echo esc_textarea( $q['resposta_en'] ?? '' ); ?></textarea>
                                                                    </div>
                                                                </div>

                                                                <div class="links-container">
                                                                    <label><strong>Botões / Links de Anexo (ex: Drives de contrato, certificados)</strong></label>
                                                                    <div class="links-container-list">
                                                                        <?php 
                                                                        $links = $q['links'] ?? array();
                                                                        foreach ( $links as $lIdx => $l ) :
                                                                        ?>
                                                                            <div class="link-item">
                                                                                <span class="dashicons dashicons-move link-handle"></span>
                                                                                <input type="text" data-name="categorias[{c}][subcategorias][{s}][perguntas][{q}][links][{l}][label_pt]" placeholder="Texto do Botão (PT)" value="<?php echo esc_attr( $l['label_pt'] ?? '' ); ?>">
                                                                                <input type="text" data-name="categorias[{c}][subcategorias][{s}][perguntas][{q}][links][{l}][label_en]" placeholder="Button Label (EN)" value="<?php echo esc_attr( $l['label_en'] ?? '' ); ?>">
                                                                                <input type="text" data-name="categorias[{c}][subcategorias][{s}][perguntas][{q}][links][{l}][url]" placeholder="https://..." value="<?php echo esc_attr( $l['url'] ?? '' ); ?>">
                                                                                <button type="button" class="remove-button">✕</button>
                                                                            </div>
                                                                        <?php endforeach; ?>
                                                                    </div>
                                                                    <button type="button" class="button add-link-btn add-button">+ Adicionar Botão / Link</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    <?php endforeach; ?>
                                                </div>
                                                <button type="button" class="button add-question-btn add-button">+ Adicionar Pergunta</button>
                                            </div>
                                        </div>
                                    <?php endforeach; ?>
                                </div>
                                <button type="button" class="button add-subcategory-btn add-button">+ Adicionar Subcategoria</button>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>

                <button type="button" class="button button-primary add-category-btn">+ Adicionar Nova Categoria</button>
            </div>

            <div class="save-actions">
                <input type="submit" name="submit_faq_admin" class="button button-primary button-large" value="Salvar FAQ">
            </div>
        </form>
    </div>

    <script type="text/template" id="tpl-category">
        <div class="category-item collapsible-item">
            <div class="category-header collapsible-header">
                <div class="category-title">
                    <span class="dashicons dashicons-category"></span>
                    <span>Nova Categoria</span>
                </div>
                <button type="button" class="remove-button">Remover Categoria</button>
            </div>
            <div class="category-fields collapsible-body">
                <div class="form-row">
                    <div class="form-group">
                        <label>Nome da Categoria (PT-BR)</label>
                        <input type="text" data-name="categorias[{c}][nome_pt]" class="cat-name-pt regular-text" placeholder="Ex: Serviços de Vídeo">
                    </div>
                    <div class="form-group">
                        <label>Category Name (EN-US)</label>
                        <input type="text" data-name="categorias[{c}][nome_en]" class="cat-name-en regular-text" placeholder="Ex: Video Services">
                    </div>
                </div>

                <div class="subcategory-container"></div>
                <button type="button" class="button add-subcategory-btn add-button">+ Adicionar Subcategoria</button>
            </div>
        </div>
    </script>

    <script type="text/template" id="tpl-subcategory">
        <div class="subcategory-item collapsible-item">
            <div class="subcategory-header collapsible-header">
                <div class="subcategory-title">
                    <span class="dashicons dashicons-list-view"></span>
                    <span>Nova Subcategoria</span>
                </div>
                <button type="button" class="remove-button">Remover Subcategoria</button>
            </div>
            <div class="subcategory-fields collapsible-body">
                <div class="form-row">
                    <div class="form-group">
                        <label>Nome da Subcategoria (PT-BR) <small>(Opcional)</small></label>
                        <input type="text" data-name="categorias[{c}][subcategorias][{s}][nome_pt]" class="subcat-name-pt regular-text" placeholder="Ex: Prazos e Entregas">
                    </div>
                    <div class="form-group">
                        <label>Subcategory Name (EN-US) <small>(Optional)</small></label>
                        <input type="text" data-name="categorias[{c}][subcategorias][{s}][nome_en]" class="subcat-name-en regular-text" placeholder="Ex: Deadlines">
                    </div>
                </div>

                <div class="question-container"></div>
                <button type="button" class="button add-question-btn add-button">+ Adicionar Pergunta</button>
            </div>
        </div>
    </script>

    <script type="text/template" id="tpl-question">
        <div class="question-item collapsible-item">
            <div class="question-header collapsible-header">
                <div class="question-title">
                    <span class="dashicons dashicons-editor-help"></span>
                    <span>Nova Pergunta</span>
                </div>
                <button type="button" class="remove-button">Remover Pergunta</button>
            </div>
            <div class="question-fields collapsible-body">
                <div class="form-row">
                    <div class="form-group">
                        <label>Pergunta (PT-BR)</label>
                        <input type="text" data-name="categorias[{c}][subcategorias][{s}][perguntas][{q}][pergunta_pt]" class="question-name-pt regular-text">
                    </div>
                    <div class="form-group">
                        <label>Question (EN-US)</label>
                        <input type="text" data-name="categorias[{c}][subcategorias][{s}][perguntas][{q}][pergunta_en]" class="question-name-en regular-text">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Resposta (PT-BR)</label>
                        <textarea data-name="categorias[{c}][subcategorias][{s}][perguntas][{q}][resposta_pt]" class="large-text" rows="5"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Answer (EN-US)</label>
                        <textarea data-name="categorias[{c}][subcategorias][{s}][perguntas][{q}][resposta_en]" class="large-text" rows="5"></textarea>
                    </div>
                </div>

                <div class="links-container">
                    <label><strong>Botões / Links de Anexo</strong></label>
                    <div class="links-container-list"></div>
                    <button type="button" class="button add-link-btn add-button">+ Adicionar Botão / Link</button>
                </div>
            </div>
        </div>
    </script>

    <script type="text/template" id="tpl-link">
        <div class="link-item">
            <span class="dashicons dashicons-move link-handle"></span>
            <input type="text" data-name="categorias[{c}][subcategorias][{s}][perguntas][{q}][links][{l}][label_pt]" placeholder="Texto do Botão (PT)">
            <input type="text" data-name="categorias[{c}][subcategorias][{s}][perguntas][{q}][links][{l}][label_en]" placeholder="Button Label (EN)">
            <input type="text" data-name="categorias[{c}][subcategorias][{s}][perguntas][{q}][links][{l}][url]" placeholder="https://...">
            <button type="button" class="remove-button">✕</button>
        </div>
    </script>
    <?php
}
