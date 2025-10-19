<?php
header("Content-Type: application/json; charset=UTF-8");

$inicio = isset($_GET['inicio']) ? $_GET['inicio'] : '';
$fin = isset($_GET['fin']) ? $_GET['fin'] : '';

if (empty($inicio) || empty($fin)) {
    http_response_code(400);
    echo json_encode(["error" => "Faltan los parámetros de fecha 'inicio' y 'fin'."]);
    exit;
}

$apiUrl = "https://api.gasoges.es/v1/suministros/todos/" . urlencode($inicio) . "/" . urlencode($fin);

$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

$apiResponse = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

curl_close($ch);

http_response_code($httpcode);

echo $apiResponse;

?>

