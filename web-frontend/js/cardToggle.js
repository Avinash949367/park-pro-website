document.addEventListener('DOMContentLoaded', function() {
    const findSpotBtn = document.getElementById('findSpotBtn');
    const registerSpotBtn = document.getElementById('registerSpotBtn');
    const findSpotView = document.getElementById('findSpotView');
    const registerSpotView = document.getElementById('registerSpotView');
    
    findSpotBtn.addEventListener('click', function() {
        // Switch to Find Spot view
        findSpotBtn.classList.remove('text-gray-500');
        findSpotBtn.classList.add('text-blue-600');
        registerSpotBtn.classList.remove('text-blue-600');
        registerSpotBtn.classList.add('text-gray-500');
        
        findSpotView.classList.remove('hidden');
        registerSpotView.classList.add('hidden');
    });
    
    registerSpotBtn.addEventListener('click', function() {
        // Switch to Register Spot view
        registerSpotBtn.classList.remove('text-gray-500');
        registerSpotBtn.classList.add('text-blue-600');
        findSpotBtn.classList.remove('text-blue-600');
        findSpotBtn.classList.add('text-gray-500');
        
        registerSpotView.classList.remove('hidden');
        findSpotView.classList.add('hidden');
    });
});
