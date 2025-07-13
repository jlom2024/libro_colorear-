
import { ColoringBook } from '../types';

// La URL de nuestra Netlify Function que actúa como proxy.
// La URL de nuestra Netlify Function que actúa como proxy.
const PROXY_URL = '/.netlify/functions/gemini';

/**
 * Llama a nuestro proxy PHP para comunicarse con la API de Gemini.
 * @param model El modelo a utilizar (e.g., 'gemini-pro:generateContent')
 * @param body El cuerpo de la petición para la API de Gemini.
 * @returns La respuesta de la API.
 */
async function callGeminiProxy(model: string, body: object): Promise<any> {
    const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Añadimos una cabecera para decirle al proxy qué modelo usar.
            'X-Gemini-Model': model 
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido del servidor.' }));
        console.error('Error del proxy:', response.status, errorData);
        throw new Error(errorData.error || `Error del servidor: ${response.status}`);
    }

    return response.json();
}


export async function generateStory(theme: string): Promise<ColoringBook> {
  const prompt = `
    Eres un autor creativo de libros de colorear para niños.
    Basado en el tema "${theme}", crea el manuscrito para un libro de colorear de 20 páginas.
    Tu respuesta DEBE SER un único objeto JSON válido, sin nada más. No lo envuelvas en markdown.
    El objeto JSON debe tener dos claves: "bookTitle" y "pages".
    - "bookTitle": Un título divertido, pegadizo y atractivo para el libro de colorear basado en el tema, en español.
    - "pages": Un array de exactamente 20 objetos de página.

    Para cada objeto de página en el array "pages", proporciona tres claves:
    1.  "pageTitle": Un título corto y simple para la página, en español.
    2.  "description": Una descripción de una o dos frases en español que narre lo que sucede en esa página. La historia debe progresar lógicamente de la página 1 a la 20.
    3.  "imagePrompt": Un prompt detallado EN INGLÉS para un generador de imágenes de IA. Este prompt debe describir una escena para una página de libro de colorear de arte lineal en blanco y negro. Es crucial que si hay personajes recurrentes, los describas de manera consistente en cada prompt para mantener su apariencia a lo largo del libro. El estilo debe ser simple, con contornos claros y limpios, adecuados para colorear.

    Ejemplo de un objeto de página:
    {
      "pageTitle": "El Gato Espacial Perdido",
      "description": "Leo, el gato espacial, mira a su alrededor en un extraño bosque de hongos brillantes. Se siente un poco perdido pero también muy curioso.",
      "imagePrompt": "A cute cartoon cat wearing a small space helmet with the visor up, looking around in a forest of giant, glowing mushrooms. The cat looks slightly worried but curious. Black and white line art, coloring book style, thick clean lines, no shading, white background."
    }

    Genera el JSON completo para el tema: "${theme}".
  `;

  try {
    const requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            response_mime_type: "application/json",
            temperature: 0.8,
        }
    };
    
    const response = await callGeminiProxy('gemini-1.5-flash', requestBody);
    
    // La respuesta del proxy ya debería ser el JSON parseado.
    const coloringBook = JSON.parse(response.candidates[0].content.parts[0].text) as ColoringBook;

    if (!coloringBook.bookTitle || !Array.isArray(coloringBook.pages) || coloringBook.pages.length === 0) {
      throw new Error("Invalid JSON structure received from API.");
    }
    
    return coloringBook;

  } catch (error)
  {
    console.error("Error generando la historia:", error);
    throw new Error("No se pudo generar la historia. Puede que la IA esté ocupada, por favor inténtalo de nuevo.");
  }
}

export async function generateImage(prompt: string): Promise<string> {
    console.log(`Skipping image generation for prompt: "${prompt}". Returning placeholder.`);
    // Devuelve una imagen SVG de marcador de posición (un cuadrado gris) codificada en base64.
    // Esto evita la llamada a la API que falla y permite que la app funcione.
    const placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjY2NjY2NjIiAvPjwvc3ZnPg==';
    return Promise.resolve(placeholder);
}
