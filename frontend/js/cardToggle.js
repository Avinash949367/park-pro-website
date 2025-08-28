

document.addEventListener('DOMContentLoaded', function() {
    const findSpotBtn = document.getElementById('findSpotBtn');
    const registerSpotBtn = document.getElementById('registerSpotBtn');
    const findSpotView = document.getElementById('findSpotView');
    const registerSpotView = document.getElementById('registerSpotView');
    const heroSection = document.getElementById('heroSection');
    
    findSpotBtn.addEventListener('click', function() {
        // Switch to Find Spot view
        findSpotBtn.classList.remove('text-gray-500');
        findSpotBtn.classList.add('text-blue-600');
        registerSpotBtn.classList.remove('text-blue-600');
        registerSpotBtn.classList.add('text-gray-500');
        
        findSpotView.classList.remove('hidden');
        registerSpotView.classList.add('hidden');

        // Change background image for Find Spot
        heroSection.style.backgroundImage = "url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?ixid=MnwxMjA3fDB8MHxzZWFyY2h8MXx8ZHJpdmluZ3xlbnwwfHwwfHw%3D&ixlib=rb-1.2.1&w=1000&q=80')";
    });
    
    registerSpotBtn.addEventListener('click', function() {
        // Switch to Register Spot view
        registerSpotBtn.classList.remove('text-gray-500');
        registerSpotBtn.classList.add('text-blue-600');
        findSpotBtn.classList.remove('text-blue-600');
        findSpotBtn.classList.add('text-gray-500');
        
        registerSpotView.classList.remove('hidden');
        findSpotView.classList.add('hidden');

        // Change background image for Register Spot
        heroSection.style.backgroundImage = "url('https://lirp.cdn-website.com/md/unsplash/dms3rep/multi/opt/photo-1506521781263-d8422e82f27a-1920w.jpg')";
    });
});
