const fs = require('fs');
const assert = require('chai').assert;

// Utility to create a testing environment for the HTML script
function createEnvironment(htmlFilePath) {
    const htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');

    // Instead of relying on `<script>`, let's find the section with PFP generator logic which contains `clampOffsets`
    // We can just find the script tag that actually contains 'function clampOffsets'
    const scriptBlocks = htmlContent.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi);
    if (!scriptBlocks) throw new Error("Could not find any script blocks");

    let scriptCode = '';
    for (const block of scriptBlocks) {
        if (block.includes('function clampOffsets')) {
            const innerMatch = block.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/i);
            if (innerMatch) {
                scriptCode = innerMatch[1];
                break;
            }
        }
    }

    if (!scriptCode) throw new Error("Could not find clampOffsets script block");

    scriptCode = `
        const document = {
            addEventListener: () => {},
            getElementById: (id) => {
                if (id === 'pfpCanvas') return { getContext: () => ({ clearRect: () => {}, drawImage: () => {}, fillRect: () => {}, save: () => {}, beginPath: () => {}, arc: () => {}, closePath: () => {}, clip: () => {}, restore: () => {} }), addEventListener: () => {}, style: {} };
                if (id === 'flagSelect') return { insertBefore: () => {}, lastElementChild: {}, value: 'custom', addEventListener: () => {} };
                return { addEventListener: () => {}, classList: { add: () => {}, remove: () => {} }, style: {} };
            },
            createElement: () => ({ selected: false }),
            documentElement: { style: { setProperty: () => {} } }
        };
        const window = { dataLayer: [], location: { href: '' } };
        const localStorage = { getItem: () => null, setItem: () => {} };
        const Image = class { constructor() { this.width = 100; this.height = 100; setTimeout(() => this.onload && this.onload(), 0); } };

        ${scriptCode}

        module.exports = {
            getOffsets: () => ({ imgOffsetX, imgOffsetY }),
            setOffsets: (x, y) => { imgOffsetX = x; imgOffsetY = y; },
            clampOffsets
        };
    `;

    const tempFileName = `__temp_test_module_${Math.random().toString(36).substring(7)}.js`;
    fs.writeFileSync(tempFileName, scriptCode);

    let mod;
    try {
        mod = require('../' + tempFileName);
    } finally {
        fs.unlinkSync(tempFileName);
    }

    return mod;
}

['projects/pride/beta.html', 'projects/pride/index.html'].forEach(htmlFile => {
    describe(`clampOffsets in ${htmlFile}`, function() {
        let env;

        before(function() {
            env = createEnvironment(htmlFile);
        });

        it('should keep offsets unchanged if they are within boundaries', function() {
            env.setOffsets(20, 20);
            env.clampOffsets(200, 200, 50);
            // maxX = (200 - 100) / 2 = 50
            // maxY = (200 - 100) / 2 = 50
            const offsets = env.getOffsets();
            assert.equal(offsets.imgOffsetX, 20);
            assert.equal(offsets.imgOffsetY, 20);
        });

        it('should clamp offsets to maximum positive boundaries', function() {
            env.setOffsets(100, 100);
            env.clampOffsets(200, 200, 50);
            const offsets = env.getOffsets();
            assert.equal(offsets.imgOffsetX, 50);
            assert.equal(offsets.imgOffsetY, 50);
        });

        it('should clamp offsets to maximum negative boundaries', function() {
            env.setOffsets(-100, -100);
            env.clampOffsets(200, 200, 50);
            const offsets = env.getOffsets();
            assert.equal(offsets.imgOffsetX, -50);
            assert.equal(offsets.imgOffsetY, -50);
        });

        it('should clamp offsets correctly when drawW and drawH are different', function() {
            env.setOffsets(100, 100);
            env.clampOffsets(300, 400, 50);
            // maxX = (300 - 100) / 2 = 100
            // maxY = (400 - 100) / 2 = 150
            let offsets = env.getOffsets();
            assert.equal(offsets.imgOffsetX, 100); // 100 <= 100
            assert.equal(offsets.imgOffsetY, 100); // 100 <= 150

            env.setOffsets(200, 200);
            env.clampOffsets(300, 400, 50);
            offsets = env.getOffsets();
            assert.equal(offsets.imgOffsetX, 100);
            assert.equal(offsets.imgOffsetY, 150);
        });

        it('should force offsets to 0 if mask is larger than or equal to draw dimensions', function() {
            env.setOffsets(50, 50);
            env.clampOffsets(100, 100, 50);
            // maxX = (100 - 100) / 2 = 0
            const offsets = env.getOffsets();
            assert.equal(offsets.imgOffsetX, 0);
            assert.equal(offsets.imgOffsetY, 0);
        });
    });
});
