<?php

declare(strict_types=1);

if (!function_exists("clamp")) {
    function clamp(mixed $value, mixed $min, mixed $max): mixed
    {
        return match (true) {
            $value >= $min && $value <= $max => $value,
            $value > $max => $max,
            default => $min,
        };
    }
}

return new class
{
    private const string SPECIAL_CHARS = "~`!@#\$%^&*()+={}[]|\\:\";'<>,.?/";
    private array $refs = [
        "@default" => "welcome",
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

        return $this->resolveVM($request->ref ?? "@default" ,$request);
    }

    private function resolveVM(string $ref, object|null $request = null): array
    {
        $vm = [match (true) {
            isset($this->refs[$ref]) => $this->loadVM($this->refs[$ref], $request),
            default => $this->loadVM($ref, $request),
        }];

        if (isset($vm[0]->head->joins)) {
            foreach ($vm[0]->head->joins as $join) {
                $vm = [...$vm, ...$this->resolveVM($join)];
            }
        }

        return $vm;
    }

    private function loadVM(string $ref, object|null $request = null): object
    {
        $ref = strtr($ref, self::SPECIAL_CHARS, str_repeat("-", strlen(self::SPECIAL_CHARS)));
        $file = __DIR__ . "/vm/$ref.json";
        if (!file_exists($file)) {
            $file = __DIR__ . "/vm/{$this->refs['@not-found']}.json";
        }

        $cvm = json_decode(file_get_contents($file), flags: JSON_THROW_ON_ERROR);

        if (is_object($request) && isset($request->parameters) && is_object($request->parameters)) {
            foreach ($request->parameters as $name => $value) {
                if (isset($cvm->parameters->$name)) {
                    $cvm->parameters->$name = $value;
                }
            }
        }

        return $this->loadModel($cvm);
    }

    private function loadModel(object $cvm): object
    {
        // Normally this would be a query builder to fetch data.

        if (!isset($cvm->data) || !is_string($cvm->data) || !str_starts_with($cvm->data, "@")) {
            return $cvm;
        }
        $ref = substr($cvm->data, 1);

        $filterOnId = false;
        if (str_ends_with($ref, "/:id")) {
            $ref = substr($ref, 0, -4);
            $filterOnId = true;
        }

        $ref = strtr($ref, self::SPECIAL_CHARS, str_repeat("-", strlen(self::SPECIAL_CHARS)));
        $file = __DIR__ . "/model/$ref.json";
        if (!file_exists($file)) {
            return $cvm;
        }

        $cvm->data = json_decode(file_get_contents($file), flags: JSON_THROW_ON_ERROR);

        if ($filterOnId === true) {
            $cvm->data = array_find($cvm->data, fn ($v) => $v->id === $cvm->parameters->id);
            return $cvm;
        }

        if (isset($cvm->parameters->sortBy) && isset($cvm->parameters->sortDirection)) {
            $sortBy = $cvm->parameters->sortBy;
            $sortDirection = strtoupper($cvm->parameters->sortDirection) === "DESC" ? -1 : 1;
            usort(
                array: $cvm->data,
                callback: fn(object $one, object $two) => strcmp($one->$sortBy, $two->$sortBy) * $sortDirection,
            );
        }

        if (isset($cvm->parameters->page) && isset($cvm->parameters->pageSize)) {
            $cvm->parameters->pageSize = clamp((int)$cvm->parameters->pageSize, min: 1, max: 100);
            $cvm->parameters->page = clamp((int)$cvm->parameters->page, min: 1, max: (int)ceil(count($cvm->data)/$cvm->parameters->pageSize));
            $cvm->data = array_slice(
                array: $cvm->data,
                offset: ($cvm->parameters->page - 1) * $cvm->parameters->pageSize,
                length: $cvm->parameters->pageSize
            );
        }

        return $cvm;
    }
};
