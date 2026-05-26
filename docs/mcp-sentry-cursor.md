# Sentry MCP en Cursor

La URL **`https://mcp.sentry.dev/mcp`** es el endpoint del **Model Context Protocol** de Sentry para que el IDE (por ejemplo Cursor) pueda consultar issues, proyectos, etc. mediante un servidor MCP.

## Qué necesitas (en Sentry)

1. Cuenta en [sentry.io](https://sentry.io) y al menos un **proyecto** creado.
2. Un **User Auth Token** (o el flujo OAuth que indique la documentación actual de Sentry MCP) con permisos de lectura acordes a lo que quieras exponer al asistente.

Los valores exactos del token **no** deben commitearse: se configuran en Cursor como secretos del MCP.

## Configuración en Cursor

Los pasos exactos cambian según la versión del producto; en general:

1. Abre **Settings** → **MCP** (o **Features → MCP**).
2. Añade un servidor nuevo con URL `https://mcp.sentry.dev/mcp`.
3. Completa la autenticación que te pida el flujo (OAuth o token según Sentry).

Documentación oficial del proveedor: revisa la ayuda en [sentry.io](https://sentry.io) / docs de _Sentry MCP_ para tokens y alcances recomendados.

## Relación con `NEXT_PUBLIC_SENTRY_DSN`

- El **MCP** sirve para que el asistente en el editor hable con la API de Sentry.
- El **DSN** en el proyecto Next.js sirve para **enviar errores** desde la app en runtime.

Son dos integraciones distintas; puedes usar solo una, las dos, o ninguna.
