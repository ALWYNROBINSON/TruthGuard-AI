import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
    const dummyFilePath = path.join(__dirname, 'dummy_test_image.jpg');
    fs.writeFileSync(dummyFilePath, 'dummy content');

    console.log('Test file created. Attempting to simulate API call...');

    // Since we don't have a real running server or user auth in this test script easily,
    // we will just test the Fast Check API directly to ensure the key works.
    try {
        const factCheckKey = process.env.FACT_CHECK_API_KEY;
        if (!factCheckKey) {
            console.error('FACT_CHECK_API_KEY not found in env');
            return;
        }
        const query = encodeURIComponent('Joe Biden speech');
        const fcUrl = `https://factchecktools.googleapis.com/v1alpha1/claims:search?query=${query}&key=${factCheckKey}`;

        const response = await fetch(fcUrl);
        const data = await response.json();

        console.log('Fact Check API Response:');
        console.log(JSON.stringify(data, null, 2));

    } catch (e) {
        console.error('Error:', e);
    } finally {
        fs.unlinkSync(dummyFilePath);
    }
}

// Need to load env
import 'dotenv/config';
runTest();
