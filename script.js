const WATCH_URL = "https://www.youtube.com/watch?v={video_id}";
const CAPTIONS_JSON_REGEX = /"captions":\{"playerCaptionsTracklistRenderer":\{"captionTracks":(\[.*?\])/;

class YouTubeTranscriptError extends Error {
    constructor(message) {
        super(message);
        this.name = "YouTubeTranscriptError";
    }
}

async function fetchVideoHtml(videoId) {
    const url = WATCH_URL.replace("{video_id}", videoId);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.text();
    } catch (e) {
        throw new YouTubeTranscriptError(`Failed to fetch video HTML: ${e.message}`);
    }
}

function extractCaptionsUrl(htmlContent, languageCode) {
    const match = CAPTIONS_JSON_REGEX.exec(htmlContent);
    if (!match) {
        throw new YouTubeTranscriptError("Captions not found in video HTML.");
    }
    
    const captionsJson = JSON.parse(match[1]);
    for (const caption of captionsJson) {
        if (caption.languageCode === languageCode) {
            return caption.baseUrl;
        }
    }
    
    throw new YouTubeTranscriptError(`Captions not found for language code: ${languageCode}`);
}

async function parseTranscriptXml(xmlContent) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
    const textElements = xmlDoc.getElementsByTagName('text');
    const transcript = [];

    for (let i = 0; i < textElements.length; i++) {
        if (textElements[i].textContent) {
            transcript.push(textElements[i].textContent);
        }
    }

    return transcript.join("\n");
}

async function getVideoTranscript(videoId, languageCode = 'en') {
    try {
        const htmlContent = await fetchVideoHtml(videoId);
        const captionsUrl = extractCaptionsUrl(htmlContent, languageCode);
        
        const response = await fetch(captionsUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const transcriptXml = await response.text();
        
        const formattedTranscript = await parseTranscriptXml(transcriptXml);
        return formattedTranscript;
    } catch (e) {
        if (e instanceof YouTubeTranscriptError) {
            console.error(`Error processing transcript: ${e.message}`);
        } else if (e instanceof Error) {
            console.error(`Network error: ${e.message}`);
        } else {
            console.error(`Unexpected error: ${e}`);
        }
        throw e;
    }
}

// Function to be called when the button is clicked
async function fetchTranscription() {
    const videoUrlInput = document.getElementById('videoUrl');
    const resultDiv = document.getElementById('result');
    const videoId = extractVideoId(videoUrlInput.value);

    if (!videoId) {
        resultDiv.textContent = "Invalid YouTube URL. Please enter a valid URL.";
        return;
    }

    resultDiv.textContent = "Fetching transcription...";

    try {
        const transcript = await getVideoTranscript(videoId);
        resultDiv.textContent = transcript;
    } catch (error) {
        resultDiv.textContent = `Error: ${error.message}`;
    }
}

// Helper function to extract video ID from URL
function extractVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}