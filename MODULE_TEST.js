// OMNI-OPS MODULE TEST SCRIPT
// Place this in the console to identify which module is failing

console.log('%c=== MODULE TEST SCRIPT ===', 'color: #0f6; font-weight: bold');

const testModule = (moduleFile) => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = moduleFile;
        script.type = 'text/javascript';
        
        const timeout = setTimeout(() => {
            console.warn(`⏱ Timeout: ${moduleFile}`);
            resolve({ file: moduleFile, status: 'TIMEOUT', error: 'Script load timed out' });
        }, 3000);
        
        script.onload = () => {
            clearTimeout(timeout);
            console.log(`✓ Loaded: ${moduleFile}`);
            resolve({ file: moduleFile, status: 'OK' });
        };
        
        script.onerror = (e) => {
            clearTimeout(timeout);
            console.error(`✗ Failed: ${moduleFile}`, e);
            resolve({ file: moduleFile, status: 'ERROR', error: e });
        };
        
        document.body.appendChild(script);
    });
};

const modules = [
    'js/omni-core-game.js',
    'js/omni-multiplayer-sync.js',
    'js/omni-story.js',
    'js/omni-living-world.js',
    'js/omni-story-integration.js',
    'js/omni-ue5-editor.js',
    'js/omni-pipboy-system.js',
    'js/omni-npc-living-city.js',
    'js/omni-integration.js'
];

(async () => {
    console.log('Testing modules sequentially...\n');
    const results = [];
    
    for (const module of modules) {
        console.log(`Testing: ${module}`);
        const result = await testModule(module);
        results.push(result);
        console.log(`Result: ${result.status}\n`);
    }
    
    console.log('%c=== TEST RESULTS ===', 'color: #0f6; font-weight: bold');
    results.forEach(r => {
        const icon = r.status === 'OK' ? '✓' : (r.status === 'TIMEOUT' ? '⏱' : '✗');
        console.log(`${icon} ${r.file}: ${r.status}`);
        if (r.error) console.log(`   Error: ${r.error}`);
    });
    
    const failed = results.filter(r => r.status !== 'OK');
    if (failed.length > 0) {
        console.log(`\n%c${failed.length} modules have issues`, 'color: #f44; font-weight: bold');
        console.log('Failed modules:', failed.map(f => f.file).join(', '));
    }
})();
