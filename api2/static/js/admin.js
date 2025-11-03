// static/js/admin.js

console.log('Admin.js loaded');

/**
 * Handle toggle button groups for game type and timer selection
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing toggle buttons');
    
    // Find all toggle buttons
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    console.log('Found toggle buttons:', toggleButtons.length);
    
    toggleButtons.forEach(button => {
        console.log('Setting up button:', button.textContent, 'value:', button.dataset.value);
        
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Button clicked:', this.textContent, 'value:', this.dataset.value);
            
            // Find the parent button group
            const buttonGroup = this.closest('.button-group');
            if (!buttonGroup) {
                console.error('No button group found');
                return;
            }
            
            // Remove active from all buttons in this group
            const groupButtons = buttonGroup.querySelectorAll('.toggle-btn');
            groupButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active to clicked button
            this.classList.add('active');
            
            // Find and update the corresponding radio input
            const formGroup = buttonGroup.closest('.form-group');
            if (formGroup) {
                const radios = formGroup.querySelectorAll('input[type="radio"]');
                const value = this.dataset.value;
                
                radios.forEach(radio => {
                    if (radio.value === value) {
                        radio.checked = true;
                        console.log('Radio checked:', radio.id, 'value:', value);
                    }
                });
            }
        });
    });
    
    console.log('Toggle buttons initialized');
});