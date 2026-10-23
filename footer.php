</main>
</div> 

<div id="settings-backdrop"></div>

<aside id="settings-sidebar">
    <div class="sidebar-header">
        <h3 data-key="configuracoes" style="display:flex; align-items:center; gap:0.5rem;">
            <svg class="icon-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true" style="width:20px; height:20px; fill:var(--color-accent);"><path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 00.11-.65l-1.92-3.32a.5.5 0 00-.6-.22l-2.39.96a7.066 7.066 0 00-1.62-.94l-.36-2.54A.5.5 0 0013.4 2h-2.8a.5.5 0 00-.5.42l-.36 2.54c-.57.21-1.11.5-1.62.94L5.6 5.96a.5.5 0 00-.6.22L3.08 9.5a.5.5 0 00.11.65l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L3.19 15.2a.5.5 0 00-.11.65l1.92 3.32c.14.24.44.34.68.22l2.39-.96c.5.44 1.05.8 1.62.94l.36 2.54c.05.28.28.48.5.48h2.8c.28 0 .46-.2.5-.48l.36-2.54c.57-.21 1.11-.5 1.62-.94l2.39.96c.24.12.54.02.68-.22l1.92-3.32a.5.5 0 00-.11-.65l-2.03-1.58zM12 15.5A3.5 3.5 0 1112 8.5a3.5 3.5 0 010 7z"/></svg>
            Configurações
        </h3>
        <button id="close-settings-btn" aria-label="Fechar configurações">&times;</button>
    </div>

    <div class="sidebar-content">
        
        <div class="setting-group">
            <h4 data-key="idioma">Idioma</h4>
            <div class="button-group lang-button-group">
                <button id="set-lang-pt" class="lang-btn">
                    <img src="<?php echo esc_url( get_template_directory_uri() . '/assets/images/flags/br.svg' ); ?>" alt="Brasil" class="flag-icon" width="22" height="15"> <span>Português</span>
                </button>
                <button id="set-lang-en" class="lang-btn">
                    <img src="<?php echo esc_url( get_template_directory_uri() . '/assets/images/flags/gb.svg' ); ?>" alt="English" class="flag-icon" width="22" height="15"> <span>English</span>
                </button>
            </div>
        </div>

        <hr class="divider" style="margin: 1.5rem 0; border: 0; height: 1px; background-color: var(--border-subtle, rgba(255,255,255,0.1));">

        <div class="setting-group">
            <h4 data-key="tema">Aparência</h4>
            <p style="font-size:0.8rem; color:var(--color-subtitle); opacity:0.8; margin-bottom:0.75rem;">Fundo claro limpo ou fundo escuro profundo.</p>
            <div class="theme-picker" style="display:flex; justify-content:center; align-items:center; gap:1.5rem;">
                <button id="set-theme-light" class="theme-select-btn" aria-label="Tema claro" title="Tema Claro">
                    <svg class="icon-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
                        <path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79zM4 10.5H1v3h3zm9-9.95h-3v3.95h3zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79zM20 10.5v3h3v-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h3v-3.95h-3zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41z" />
                    </svg>
                </button>
                <button id="set-theme-dark" class="theme-select-btn" aria-label="Tema escuro" title="Tema Escuro">
                    <svg class="icon-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
                        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                    </svg>
                </button>
            </div>
        </div>

        <hr class="divider" style="margin: 1.5rem 0; border: 0; height: 1px; background-color: var(--border-subtle, rgba(255,255,255,0.1));">

        <div class="setting-group">
            <h4 data-key="cor-destaque">Cor em Destaque</h4>
            <p style="font-size:0.8rem; color:var(--color-subtitle); opacity:0.8; margin-bottom:0.75rem;">Aplicada a botões ativos, bordas e detalhes.</p>
            <div class="color-picker-grid" style="grid-template-columns: 1fr 1fr; gap:0.75rem;">
                <button class="color-option-btn" id="set-color-purple" data-color="purple">
                    <span class="color-dot purple" style="background:#8b5cf6;"></span>
                    <span class="color-name" data-key="cor-roxo">Roxo</span>
                </button>
                <button class="color-option-btn" id="set-color-red" data-color="red">
                    <span class="color-dot red" style="background:#ef4444;"></span>
                    <span class="color-name" data-key="cor-vermelho">Vermelho</span>
                </button>
            </div>
        </div>
    </div>
</aside>

<footer class="site-footer">
    <div class="footer-copyright">
        <p>&copy; <?php echo date('Y'); ?> Odyssee — Creative Experience. Todos os direitos reservados.</p>
        <p class="footer-author">Desenvolvido por <strong>Renato Harley Paiva</strong></p>
        <p class="footer-policy" style="margin-top: 10px; font-size: 0.85em;">
            <a href="<?php echo esc_url(home_url('/politica-de-privacidade/')); ?>" style="color: var(--color-accent); text-decoration: none; font-weight: 500;">Política de Privacidade</a>
        </p>
    </div>
</footer>

<div id="lgpd-cookie-banner" class="cookie-banner-overlay">
    <div class="cookie-banner-header">
        <svg class="icon-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 16h-2v-2h2v2zm0-4h-2V7h2v7z" />
        </svg>
        <h3>Sua Privacidade</h3>
    </div>
    <div class="cookie-banner-content">
        <p>
            Utilizamos cookies apenas para métricas de acesso (Google Site Kit) e para lembrar suas preferências de tema e idioma. Não armazenamos informações pessoais e não possuímos sistema de login. Saiba mais na nossa <a href="<?php echo esc_url(home_url('/politica-de-privacidade/')); ?>">Política de Privacidade</a>.
        </p>
    </div>
    <div class="cookie-banner-actions">
        <button id="cookie-btn-reject" class="cookie-btn-reject">Rejeitar</button>
        <button id="cookie-btn-accept" class="cookie-btn-accept">Aceitar</button>
    </div>
</div>

<?php wp_footer(); ?>
</body>
</html>
