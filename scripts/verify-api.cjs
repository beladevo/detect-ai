const fs = require('node:fs');
const path = require('node:path');

const API_BASE = 'http://localhost:3000';

const samples = [
    { label: 'ai', filePath: path.resolve('test-assets/ai-sample.png') },
    { label: 'real', filePath: path.resolve('test-assets/real-sample.jpg') },
];

async function verify() {
    for (const sample of samples) {
        console.log(`Testing ${sample.label} sample: ${sample.filePath}`);
        const buffer = fs.readFileSync(sample.filePath);
        const formData = new FormData();
        formData.append('file', new Blob([buffer]), path.basename(sample.filePath));

        try {
            const response = await fetch(`${API_BASE}/api/detect`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                console.error(`Error: ${response.status} ${await response.text()}`);
                continue;
            }

            const data = await response.json();
            console.log(`Result: ${JSON.stringify(data, null, 2)}`);

            const isAI = data.score >= 50;
            const expectedAI = sample.label === 'ai';
            if (isAI === expectedAI) {
                console.log('✅ Correct detection');
            } else {
                console.log('❌ Incorrect detection');
            }
        } catch (err) {
            console.error(`Failed to test ${sample.label}: ${err.message}`);
        }
    }
}

verify();
