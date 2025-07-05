// Pequeño cambio para forzar el redespliegue de Netlify
import fetch from 'node-fetch';

export async function handler(event) {
    console.log('Iniciando ejecución de la función gemini.');
    // Asegúrate de que solo se acepten peticiones POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Método no permitido. Solo POST.' }),
        };
    }

    // Obtener la API Key de las variables de entorno de Netlify
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'La clave de API de Gemini no está configurada en Netlify.' }),
        };
    }

    let requestBody;
    try {
        requestBody = JSON.parse(event.body);
    } catch (error) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Cuerpo de la petición JSON inválido.' }),
        };
    }

    // Obtener el modelo de la cabecera X-Gemini-Model
    const model = event.headers['x-gemini-model'] || 'gemini-1.5-flash';

    // Construir la URL de la API de Gemini
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    console.log('URL de Gemini:', geminiUrl);
    console.log('Cuerpo de la petición a Gemini:', JSON.stringify(requestBody));

    try {
        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        const data = await response.json();
        console.log('Respuesta de Gemini:', JSON.stringify(data));

        return {
            statusCode: response.status,
            body: JSON.stringify(data),
        };
    } catch (error) {
        console.error('Error al contactar la API de Gemini:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error al contactar la API de Gemini.', details: error.message }),
        };
    }
}
