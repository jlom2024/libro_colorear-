<?php
// Habilitar CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, X-Gemini-Model");
header("Access-Control-Allow-Methods: POST, OPTIONS");
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { exit(0); }

try {
    // 1. LEE LA API KEY DE FORMA SEGURA DESDE LA VARIABLE DE ENTORNO
    $apiKey = getenv('GEMINI_API_KEY');

    // Verificación de seguridad: si la clave no está configurada, el script falla.
    if ($apiKey === false || $apiKey === '') {
        throw new Exception("La clave de API no está configurada en el servidor.");
    }

    // 2. Leer la petición
    $requestBody = file_get_contents('php://input');
    $decodedPayload = json_decode($requestBody, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("El cuerpo de la petición no es un JSON válido.");
    }

    // 3. Diferenciar petición por su estructura
    if (isset($decodedPayload['text_prompts'])) {
        // --- LÓGICA PARA IMAGEN ---
        $modelToUse = 'imagen-3.0-generate-002';
        $apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/{$modelToUse}:predict";
        $promptText = $decodedPayload['text_prompts'][0]['text'];
        $payloadForGoogle = json_encode(['instances' => [['prompt' => $promptText]],'parameters' => ['sampleCount' => 1]]);
        $isImageRequest = true;

    } else {
        // --- LÓGICA PARA TEXTO ---
        $modelToUse = 'gemini-1.5-flash-latest';
        $apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/{$modelToUse}:generateContent";
        $payloadForGoogle = $requestBody;
        $isImageRequest = false;
    }

    // 4. Enviar a Google
    $ch = curl_init($apiUrl . '?key=' . $apiKey);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payloadForGoogle);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    $response = curl_exec($ch);
    $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($response === false) { throw new Exception("Error de cURL: " . $curlError); }
    
    // 5. Procesar la respuesta
    if ($isImageRequest) {
        if ($httpcode == 200) {
            $googleResponse = json_decode($response, true);
            if (!empty($googleResponse['predictions']) && isset($googleResponse['predictions'][0]['bytesBase64Encoded'])) {
                $imageData = $googleResponse['predictions'][0]['bytesBase64Encoded'];
                $finalResponse = json_encode(["generated_images" => [["image" => ["image_bytes" => $imageData]]]]);
            } else { throw new Exception("Respuesta de Google OK pero con formato inesperado. Respuesta: " . $response); }
        } else { throw new Exception("La API de Google devolvió un error para la imagen. Código: $httpcode. Cuerpo: " . $response); }
    } else {
        $finalResponse = $response;
    }
    
    // 6. Enviar al navegador
    http_response_code($httpcode);
    header('Content-Type: application/json');
    echo $finalResponse;

} catch (Exception $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(["error" => "Error de Seguridad o Configuración en el Servidor.", "message" => $e->getMessage()]);
}
?>