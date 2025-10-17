<?php

declare(strict_types=1);

return new class
{
    private const string DEFAULT_REF = "welcome";
    private const string SPECIAL_CHARS = "~`!@#\$%^&*()+={}[]|\\:\";'<>,.?/";
    private array $refs = [
        "@default" => self::DEFAULT_REF,
        "@current" => null,
        "@menu" => "menu",
        "@header" => "header",
        "@not-found" => "not-found",
    ];

    public function render(object $request): array
    {
        if (isset($request->current)) {
            $this->refs["@current"] = $request->current;
        }
        return $this->resolveVM($request->ref ?? "@default");
    }

    private function resolveVM(string|null $ref): array
    {
        $vm = match (true) {
            isset($this->refs[$ref]) => $this->loadVM($this->refs[$ref]),
            default => $this->loadVM($ref),
        };

        if (isset($vm[0]->head->joins)) {
            foreach ($vm[0]->head->joins as $join) {
                $vm = [...$vm, ...$this->resolveVM($join)];
            }
        }

        return $vm;
    }

    private function loadVM(string|null $ref): array {
        if ($ref === null) {
            return [];
        }
        $ref = strtr($ref, self::SPECIAL_CHARS, str_repeat("-", strlen(self::SPECIAL_CHARS)));
        $file = __DIR__ . "/vm/$ref.json";
        if (!file_exists($file)) {
            $file = __DIR__ . "/vm/not-found.json";
        }

        return json_decode(file_get_contents($file), flags: JSON_THROW_ON_ERROR);
    }
};
