async function fetchTranscription() {
    const videoUrl = document.getElementById('videoUrl').value;
    const resultDiv = document.getElementById('result');
    
    resultDiv.textContent = 'Fetching transcription...';
    
    try {
        const response = await fetch('https://your-backend-url.com/fetch-transcription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ videoUrl }),
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch transcription');
        }
        
        const data = await response.json();
        resultDiv.textContent = data.transcription;
    } catch (error) {
        resultDiv.textContent = `Error: ${error.message}`;
    }
}