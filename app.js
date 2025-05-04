// Add event listeners for floating container toggle tabs
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Setting up floating container toggles');
    
    const leftContainer = document.querySelector('.floating-buttons-container-left');
    const rightContainer = document.querySelector('.floating-buttons-container');
    
    console.log('Left container:', leftContainer);
    console.log('Right container:', rightContainer);
    
    if (!leftContainer || !rightContainer) {
        console.error('Could not find one or both floating containers!');
        return;
    }
    
    const leftToggleTab = leftContainer.querySelector('.floating-toggle-tab');
    const rightToggleTab = rightContainer.querySelector('.floating-toggle-tab');
    
    console.log('Left toggle tab:', leftToggleTab);
    console.log('Right toggle tab:', rightToggleTab);
    
    if (!leftToggleTab || !rightToggleTab) {
        console.error('Could not find one or both toggle tabs!');
        return;
    }

    // Initialize containers to be expanded
    leftContainer.classList.add('expanded');
    rightContainer.classList.add('expanded');
    
    // Initialize chevron icons to be rotated
    const leftChevron = leftToggleTab.querySelector('.chevron-icon');
    const rightChevron = rightToggleTab.querySelector('.chevron-icon');
    leftChevron.style.transform = 'rotate(180deg)';
    rightChevron.style.transform = 'rotate(180deg)';
    
    console.log('Initial state - containers expanded');

    // Toggle left container
    leftToggleTab.addEventListener('click', function(e) {
        console.log('Left toggle clicked');
        e.stopPropagation(); // Prevent document click from immediately closing
        leftContainer.classList.toggle('expanded');
        leftChevron.style.transform = leftContainer.classList.contains('expanded') ? 'rotate(180deg)' : '';
    });

    // Toggle right container
    rightToggleTab.addEventListener('click', function(e) {
        console.log('Right toggle clicked');
        e.stopPropagation(); // Prevent document click from immediately closing
        rightContainer.classList.toggle('expanded');
        rightChevron.style.transform = rightContainer.classList.contains('expanded') ? 'rotate(180deg)' : '';
    });
    
    // Hide containers when clicking elsewhere on the page
    document.addEventListener('click', function(event) {
        if (!leftContainer.contains(event.target) && !rightContainer.contains(event.target)) {
            console.log('Clicked outside containers - collapsing both');
            leftContainer.classList.remove('expanded');
            rightContainer.classList.remove('expanded');
            leftChevron.style.transform = '';
            rightChevron.style.transform = '';
        }
    });
}); 