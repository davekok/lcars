<?php

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        header("Content-Type: text/html; charset=UTF-8");
        readfile(__DIR__ . '/assets/index.html');
        exit();

    case 'POST':
        try {
            $request = json_decode(file_get_contents('php://input'), flags: JSON_THROW_ON_ERROR);
            $vm = include(__DIR__ . "/vm.php");
            $response = $vm->render($request);
        } catch (Throwable $e) {
            $response = [
                "error" => $e->getMessage(),
                "code" => $e->getCode(),
                "file" => $e->getFile(),
                "line" => $e->getLine(),
                "trace" => $e->getTrace(),
            ];
        } finally {
            header("Content-Type: application/json");
            exit(json_encode($response, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        }
}
