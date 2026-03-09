export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Museum Calendar Widget API",
    description:
      "REST API для управления праздниками и тарифами виджета-календаря музея «Эпохи». " +
      "Публичный эндпоинт `/api/config` используется виджетом. " +
      "Административные эндпоинты `/api/admin/*` требуют JWT-токен (HS256) в заголовке `Authorization: Bearer <token>`. " +
      "Токен выдаётся сервисом генерации билетов. Проверяются claims: `iss`, `aud`, `exp`. " +
      "Rate limit: 30 запросов/минуту на IP.",
    version: "3.0.0",
    contact: { name: "Museum Admin" },
  },
  servers: [
    { url: "/", description: "Current server" },
  ],
  components: {
    securitySchemes: {
      BearerJWT: {
        type: "http" as const,
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "JWT-токен (HS256), подписанный общим секретом с сервисом генерации билетов. " +
          "Обязательные claims: iss (issuer), aud (audience), exp (expiration). " +
          "Передаётся в заголовке: Authorization: Bearer <token>",
      },
    },
    schemas: {
      Holiday: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          date: { type: "string", format: "date", example: "2026-01-01" },
          label: { type: "string", nullable: true, example: "Новый год" },
          created_at: { type: "string", format: "date-time" },
        },
      },
      HolidayCreate: {
        type: "object",
        required: ["date"],
        properties: {
          date: { type: "string", format: "date", example: "2026-05-09", description: "Формат YYYY-MM-DD" },
          label: { type: "string", nullable: true, example: "День Победы" },
        },
      },
      HolidayUpdate: {
        type: "object",
        properties: {
          date: { type: "string", format: "date", example: "2026-05-09" },
          label: { type: "string", nullable: true, example: "День Победы" },
        },
      },
      Tariff: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          slug: { type: "string", example: "weekday-full" },
          day_type: { type: "string", enum: ["weekday", "weekend"] },
          name: { type: "string", example: "Полный билет" },
          description: { type: "string", example: "Основная экспозиция + Временная выставка" },
          price: { type: "integer", example: 400 },
          purchasable: { type: "boolean", example: true },
          tilda_product_id: { type: "string", nullable: true, example: "123456789" },
          info_text: { type: "string", nullable: true },
          info_categories: {
            type: "array",
            nullable: true,
            items: { type: "string" },
            example: ["Дети от 4 до 6 лет и пенсионеры", "Инвалиды I и II групп"],
          },
          sort_order: { type: "integer", example: 1 },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      TariffCreate: {
        type: "object",
        required: ["slug", "day_type", "name"],
        properties: {
          slug: { type: "string", example: "weekday-full" },
          day_type: { type: "string", enum: ["weekday", "weekend"] },
          name: { type: "string", example: "Полный билет" },
          description: { type: "string", example: "Основная экспозиция + Временная выставка" },
          price: { type: "integer", example: 400 },
          purchasable: { type: "boolean", default: true },
          tilda_product_id: { type: "string", nullable: true },
          info_text: { type: "string", nullable: true },
          info_categories: { type: "array", nullable: true, items: { type: "string" } },
          sort_order: { type: "integer", default: 0 },
        },
      },
      TariffUpdate: {
        type: "object",
        properties: {
          slug: { type: "string" },
          day_type: { type: "string", enum: ["weekday", "weekend"] },
          name: { type: "string" },
          description: { type: "string" },
          price: { type: "integer" },
          purchasable: { type: "boolean" },
          tilda_product_id: { type: "string", nullable: true },
          info_text: { type: "string", nullable: true },
          info_categories: { type: "array", nullable: true, items: { type: "string" } },
          sort_order: { type: "integer" },
        },
      },
      WidgetConfig: {
        type: "object",
        properties: {
          holidays: {
            type: "array",
            items: { type: "string", format: "date" },
            example: ["2026-01-01", "2026-01-02", "2026-05-09"],
          },
          weekday_tariffs: {
            type: "array",
            items: { $ref: "#/components/schemas/WidgetTariff" },
          },
          weekend_tariffs: {
            type: "array",
            items: { $ref: "#/components/schemas/WidgetTariff" },
          },
          weekend_notices: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                icon: { type: "string" },
                text: { type: "string" },
              },
            },
          },
          currency: { type: "string", example: "₽" },
        },
      },
      WidgetTariff: {
        type: "object",
        properties: {
          id: { type: "string", description: "slug тарифа" },
          name: { type: "string" },
          description: { type: "string" },
          price: { type: "integer" },
          purchasable: { type: "boolean" },
          tilda_product_id: { type: "string" },
          info_text: { type: "string" },
          info_categories: { type: "array", items: { type: "string" } },
        },
      },
      Error: {
        type: "object",
        properties: {
          error: { type: "string", example: "Internal server error" },
        },
      },
    },
  },
  paths: {
    "/api/config": {
      get: {
        tags: ["Widget"],
        summary: "Конфигурация виджета",
        description:
          "Публичный эндпоинт. Возвращает праздники (текущий год+), тарифы для будних и выходных дней в формате, который ожидает виджет-календарь.",
        responses: {
          "200": {
            description: "Конфигурация виджета",
            content: { "application/json": { schema: { $ref: "#/components/schemas/WidgetConfig" } } },
          },
          "500": {
            description: "Ошибка сервера",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
    "/api/admin/holidays": {
      get: {
        tags: ["Holidays"],
        summary: "Список праздников",
        description: "Возвращает все праздники. Можно фильтровать по году.",
        security: [{ BearerJWT: [] }],
        parameters: [
          {
            name: "year",
            in: "query",
            required: false,
            schema: { type: "integer", example: 2026 },
            description: "Фильтр по году (YYYY)",
          },
        ],
        responses: {
          "200": {
            description: "Список праздников",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Holiday" } },
              },
            },
          },
          "401": { description: "Отсутствует или невалидный токен" },
          "403": { description: "Токен не прошёл валидацию (подпись, iss, aud)" },
          "500": {
            description: "Ошибка сервера",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
      post: {
        tags: ["Holidays"],
        summary: "Добавить праздник",
        security: [{ BearerJWT: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/HolidayCreate" } } },
        },
        responses: {
          "201": {
            description: "Праздник создан",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Holiday" } } },
          },
          "400": { description: "Невалидный формат даты" },
          "401": { description: "Отсутствует или невалидный токен" },
          "403": { description: "Токен не прошёл валидацию" },
          "409": { description: "Праздник на эту дату уже существует" },
          "500": {
            description: "Ошибка сервера",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
    "/api/admin/holidays/{id}": {
      patch: {
        tags: ["Holidays"],
        summary: "Изменить праздник",
        security: [{ BearerJWT: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/HolidayUpdate" } } },
        },
        responses: {
          "200": {
            description: "Праздник обновлён",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Holiday" } } },
          },
          "400": { description: "Невалидный формат даты" },
          "401": { description: "Отсутствует или невалидный токен" },
          "403": { description: "Токен не прошёл валидацию" },
          "404": { description: "Праздник не найден" },
          "500": {
            description: "Ошибка сервера",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
      delete: {
        tags: ["Holidays"],
        summary: "Удалить праздник",
        security: [{ BearerJWT: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "204": { description: "Праздник удалён" },
          "401": { description: "Отсутствует или невалидный токен" },
          "403": { description: "Токен не прошёл валидацию" },
          "500": {
            description: "Ошибка сервера",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
    "/api/admin/tariffs": {
      get: {
        tags: ["Tariffs"],
        summary: "Список тарифов",
        description: "Возвращает все тарифы. Можно фильтровать по типу дня.",
        security: [{ BearerJWT: [] }],
        parameters: [
          {
            name: "day_type",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["weekday", "weekend"] },
            description: "Фильтр: weekday или weekend",
          },
        ],
        responses: {
          "200": {
            description: "Список тарифов",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Tariff" } },
              },
            },
          },
          "401": { description: "Отсутствует или невалидный токен" },
          "403": { description: "Токен не прошёл валидацию" },
          "500": {
            description: "Ошибка сервера",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
      post: {
        tags: ["Tariffs"],
        summary: "Добавить тариф",
        security: [{ BearerJWT: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/TariffCreate" } } },
        },
        responses: {
          "201": {
            description: "Тариф создан",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Tariff" } } },
          },
          "400": { description: "Отсутствуют обязательные поля (slug, day_type, name)" },
          "401": { description: "Отсутствует или невалидный токен" },
          "403": { description: "Токен не прошёл валидацию" },
          "409": { description: "Тариф с таким slug уже существует" },
          "500": {
            description: "Ошибка сервера",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
    "/api/admin/tariffs/{id}": {
      patch: {
        tags: ["Tariffs"],
        summary: "Изменить тариф",
        security: [{ BearerJWT: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/TariffUpdate" } } },
        },
        responses: {
          "200": {
            description: "Тариф обновлён",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Tariff" } } },
          },
          "400": { description: "Невалидное значение day_type" },
          "401": { description: "Отсутствует или невалидный токен" },
          "403": { description: "Токен не прошёл валидацию" },
          "404": { description: "Тариф не найден" },
          "500": {
            description: "Ошибка сервера",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
      delete: {
        tags: ["Tariffs"],
        summary: "Удалить тариф",
        security: [{ BearerJWT: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "204": { description: "Тариф удалён" },
          "401": { description: "Отсутствует или невалидный токен" },
          "403": { description: "Токен не прошёл валидацию" },
          "500": {
            description: "Ошибка сервера",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
  },
  tags: [
    { name: "Widget", description: "Публичные эндпоинты для виджета-календаря" },
    { name: "Holidays", description: "Управление праздниками (требуется JWT)" },
    { name: "Tariffs", description: "Управление тарифами (требуется JWT)" },
  ],
};
