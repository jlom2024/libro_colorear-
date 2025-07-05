<?php
// gemini-proxy.php

// 1. Especificar que la respuesta será en formato JSON
header('Content-Type: application/json');

// 2. Obtener la API Key de una variable de entorno del servidor.
// ¡Mucho más seguro que tenerla en el código!
$apiKey = getenv('GEMINI_API_KEY');

if (!$apiKey) {
    // Si la API Key no está configurada en el servidor, devolvemos un error.
    http_response_code(500);
    echo json_encode(['error' => 'La clave de API no está configurada en el servidor.']);
    exit;
}

// 3. Obtener el cuerpo de la petición (el prompt) que envía el frontend.
$requestBody = file_get_contents('php://input');
if (!$requestBody) {
    http_response_code(400);
    echo json_encode(['error' => 'No se recibió ningún cuerpo en la petición.']);
    exit;
}

    // 4. Obtener el modelo de la cabecera X-Gemini-Model
$model = $_SERVER['HTTP_X_GEMINI_MODEL'] ?? 'gemini-1.5-flash'; // Valor por defecto si no se envía la cabecera

// Construir la URL de la API de Gemini.
$geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=" . $apiKey;

// 5. Usar cURL para reenviar la petición a la API de Gemini.
$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, $geminiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $requestBody);
curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));

// 6. Ejecutar la petición y obtener la respuesta y el código de estado.
$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    // Si hay un error de cURL, lo notificamos.
    http_response_code(500);
    echo json_encode(['error' => 'Error al contactar la API de Gemini: ' . curl_error($ch)]);
} else {
    // 7. Devolver la misma respuesta y código de estado que nos dio Gemini.
    http_response_code($httpcode);
    echo $response;
}

curl_close($ch);
?>
