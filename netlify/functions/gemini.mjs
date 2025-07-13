"""import fetch from 'node-fetch';

// Constantes para la configuración de la API
const GOOGLE_CLOUD_PROJECT_ID = 'colorea-con-ivanna';
const GOOGLE_CLOUD_LOCATION = 'us-central1'; // O la región que uses

export async function handler(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Método no permitido.' }) };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return { statusCode: 500, body: JSON.stringify({ error: 'La clave de API de Gemini no está configurada.' }) };
    }

    let requestBody;
    try {
        requestBody = JSON.parse(event.body);
    } catch (error) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Cuerpo de la petición JSON inválido.' }) };
    }

    const model = event.headers['x-gemini-model'] || 'gemini-1.5-flash';
    
    let apiUrl;
    let apiRequestBody;

    // Decidimos qué API usar basándonos en el nombre del modelo
    if (model.startsWith('gemini-')) {
        // --- Lógica para la API de Lenguaje (Generar Historia) ---
        apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        apiRequestBody = JSON.stringify(requestBody);

    } else if (model.startsWith('imagegeneration')) {
        // --- Lógica para la API de Vertex AI (Generar Imagen) ---
        apiUrl = `https://us-central1-aiplatform.googleapis.com/v1/projects/${GOOGLE_CLOUD_PROJECT_ID}/locations/${GOOGLE_CLOUD_LOCATION}/publishers/google/models/${model}:predict`;
        
        // El cuerpo de la petición para Vertex AI es diferente
        apiRequestBody = JSON.stringify({
            instances: [
                { prompt: requestBody.text_prompts[0].text }
            ],
            parameters: {
                mimeType: "image/png", // Solicitamos PNG para mejor calidad
                sampleCount: 1
            }
        });

    } else {
        return { statusCode: 400, body: JSON.stringify({ error: `Modelo desconocido: ${model}` }) };
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // La autenticación para Vertex AI es diferente, usamos el API Key en la cabecera
                'Authorization': `Bearer ${apiKey}` 
            },
            body: apiRequestBody,
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Error de la API de Google:', data);
            return { statusCode: response.status, body: JSON.stringify(data) };
        }

        // Transformamos la respuesta para que el frontend la entienda
        let finalResponse;
        if (model.startsWith('imagegeneration')) {
            // La respuesta de Vertex AI tiene un formato diferente
            finalResponse = {
                generated_images: [{
                    image: {
                        // La imagen viene en base64 en el campo 'bytesBase64Encoded'
                        image_bytes: data.predictions[0].bytesBase64Encoded
                    }
                }]
            };
        } else {
            finalResponse = data;
        }

        return {
            statusCode: 200,
            body: JSON.stringify(finalResponse),
        };

    } catch (error) {
        console.error('Error al contactar la API de Google:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Error interno del servidor.', details: error.message }) };
    }
}
""
