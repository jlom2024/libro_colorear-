""""""import fetch from 'node-fetch';

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
    let headers = { 'Content-Type': 'application/json' };

    // Todos los modelos usarán el endpoint de Generative Language API por ahora
    apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    if (model.startsWith('gemini-')) {
        // Para modelos de texto, el requestBody ya está en el formato correcto
        apiRequestBody = JSON.stringify(requestBody);
    } else if (model.startsWith('imagegeneration')) {
        // Para generación de imágenes, transformamos text_prompts a formato contents
        // y añadimos generationConfig para la salida de imagen
        apiRequestBody = JSON.stringify({
            contents: [{ parts: [{ text: requestBody.text_prompts[0].text }] }],
            generationConfig: {
                response_mime_type: "image/jpeg", // Solicitamos JPEG
                number_of_images: 1
            }
        });
    } else {
        return { statusCode: 400, body: JSON.stringify({ error: `Modelo desconocido: ${model}` }) };
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers, // Usamos los encabezados definidos arriba
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
            // La respuesta para imagegeneration@006 de Generative Language API
            // es similar a los modelos de texto, pero content.parts[0].text será la imagen base64
            finalResponse = {
                generated_images: [{
                    image: {
                        image_bytes: data.candidates[0].content.parts[0].text // Aquí está la imagen base64
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
"""
""
