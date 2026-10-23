
document.addEventListener('DOMContentLoaded', function() {
    const placeholders = document.querySelectorAll('.category-image-placeholder');
    
    placeholders.forEach(placeholder => {
        placeholder.style.cursor = 'pointer';
        
        placeholder.addEventListener('click', function() {
            
            const baseUrl = window.location.origin;
            window.location.href = baseUrl + '/servicos';
        });

        placeholder.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.02)';
            this.style.transition = 'transform 0.3s ease';
        });
        
        placeholder.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
});
