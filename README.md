# 🤖 Discord Bot Base - EstrellaStudios

Un bot de Discord modular y completo construido con **Discord.js v14** y **MongoDB**. Incluye sistemas de economía, niveles, moderación, sorteos y muchas funcionalidades más.

---

## 📋 Tabla de Contenidos

- [Características Principales](#-características-principales)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Scripts Disponibles](#-scripts-disponibles)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Módulos y Sistemas](#-módulos-y-sistemas)
- [Estructura de un Comando](#-estructura-de-un-comando)
- [Estructura de un Componente](#-estructura-de-un-componente)
- [Modelos de Base de Datos](#-modelos-de-base-de-datos)
- [Variables de Entorno](#-variables-de-entorno)
- [Manejo de Errores](#-manejo-de-errores)
- [Contribuciones](#-contribuciones)
- [Apóyanos](#-apóyanos)
- [Licencia](#-licencia)
- [Soporte y Contacto](#-soporte-y-contacto)

---

## ✨ Características Principales

- **💰 Sistema de Economía**: Monedas, banco con capacidad por nivel, tienda personalizable, trabajos, robos y juegos (blackjack, slots, coinflip).
- **⭐ Sistema de Niveles**: XP por mensajes, roles por nivel, tablas de clasificación globales y por servidor.
- **🛡️ Moderación Avanzada**: Warns con acciones automáticas configurables, timeouts, bans, kicks y registro completo de acciones.
- **🎁 Sorteos (Giveaways)**: Creación, finalización y reroll de sorteos con requisitos de roles.
- **🎖️ Sistema de Insignias**: Logros desbloqueables por acciones específicas como rachas diarias, crímenes exitosos o alcanzar ciertos niveles.
- **🔄 Menús Contextuales**: Comandos de contexto para usuario y mensaje.
- **🛡️ Anticrash**: Sistema robusto de manejo de errores con reporte automático a canal de soporte.
- **⚙️ Multi-Servidor**: Configuración independiente por servidor para todos los módulos.
- **👑 Comandos de Owner**: Gestión de servidores y ajustes globales.

---

## 🛠️ Tecnologías Utilizadas

- **[Node.js](https://nodejs.org/)** (v20+)
- **[Discord.js](https://discord.js.org/)** (v14)
- **[MongoDB](https://www.mongodb.com/)** + **[Mongoose](https://mongoosejs.com/)**
- **[pnpm](https://pnpm.io/)** (Gestor de paquetes)

---

## 📦 Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/BlommamPro/discord-bot-base.git
cd discord-bot-base
```

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y renómbralo:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales:

```env
# ===== BOT =====
BOT_TOKEN=TU_TOKEN_AQUI
CLIENT_ID=ID_DE_TU_BOT

# ===== BASE DE DATOS =====
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/bot

# ===== CONFIGURACIÓN =====
LANGUAGE=es
COLOR=#FF8C00
ERROR_COLOR=#ED4245
COOLDOWN_COLOR=#FEE75C
OWNER_IDS=TU_ID_AQUI
SUPPORT_CHANNEL_ID=ID_CANAL_SOPORTE

# ===== ESTADO =====
STATUS=online
ACTIVITY_TYPE=Playing
ACTIVITY_NAME="Discord.js v14"
```

**Nota:** Para desarrollo, usa el archivo `.env.dev` (tienes un ejemplo en `.env.dev.example`). Los scripts de `package.json` ya están preparados para esta separación.

### 4. Desplegar comandos

Para desplegar los comandos en tu servidor de prueba (si configuraste `GUILD_ID` en tu archivo `.env`):

```bash
pnpm run cmd:deploy
```

Para desarrollo:

```bash
pnpm run cmd:deploy:dev
```

> **Nota sobre `GUILD_ID`:** Esta variable es **opcional**. Si la configuras, los comandos se desplegarán de forma instantánea solo en ese servidor (ideal para pruebas). Si no la configuras, los comandos se desplegarán de forma global y pueden tardar hasta 1 hora en aparecer en todos los servidores.

---

## 🚀 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm start` | Inicia el bot en producción |
| `pnpm dev` | Inicia el bot en modo desarrollo (con `--watch`) |
| `pnpm cmd:deploy` | Despliega comandos para el servidor de producción |
| `pnpm cmd:deploy:dev` | Despliega comandos para el servidor de desarrollo |
| `pnpm cmd:delete` | Elimina todos los comandos en producción |
| `pnpm cmd:delete:dev` | Elimina todos los comandos en desarrollo |
| `pnpm cmd:list` | Lista todos los comandos registrados |
| `pnpm cmd:reset` | Elimina y vuelve a desplegar comandos |

---

## 📁 Estructura del Proyecto

```
└── 📁discord-bot-base
    └── 📁config
        ├── config.js
    └── 📁src
        └── 📁commands
            └── 📁administration
                ├── economyconfig.js
                ├── levelconfig.js
                ├── reset_economy.js
                ├── warnconfig.js
            └── 📁economy
                ├── achievements.js
                ├── bank.js
                ├── blackjack.js
                ├── coinflip.js
                ├── crime.js
                ├── daily.js
                ├── deposit.js
                ├── pay.js
                ├── ranking.js
                ├── rob.js
                ├── slots.js
                ├── top.js
                ├── upgrades.js
                ├── withdraw.js
                ├── work.js
            └── 📁general
                ├── avatar.js
                ├── banner.js
                ├── botinfo.js
                ├── channelinfo.js
                ├── emoji.js
                ├── help.js
                ├── ping.js
                ├── roleinfo.js
                ├── servericon.js
                ├── serverinfo.js
                ├── userinfo.js
            └── 📁giveaways
                ├── create.js
                ├── end.js
                ├── reroll.js
            └── 📁leveling
                ├── leaderboard.js
                ├── profile.js
                ├── rank.js
            └── 📁moderation
                ├── ban.js
                ├── clear.js
                ├── kick.js
                ├── lock.js
                ├── modlog.js
                ├── slowmode.js
                ├── timeout.js
                ├── unban.js
                ├── unlock.js
                ├── untimeout.js
                ├── warn.js
                ├── warns.js
            └── 📁owner
                ├── guilds.js
                ├── settings.js
        └── 📁components
            └── 📁buttons
                └── 📁example
                    ├── confirm.js
            └── 📁contextMenus
                └── 📁message
                    ├── info.js
                └── 📁user
                    ├── avatar.js
            └── 📁modals
                └── 📁example
                    ├── report.js
            └── 📁selectMenus
                └── 📁example
                    ├── roles.js
                └── 📁help
                    ├── category.js
        └── 📁events
            └── 📁client
                ├── error.js
                ├── messageReactionAdd.js
                ├── ready.js
                ├── warn.js
            └── 📁guild
                ├── guildCreate.js
                ├── guildMemberAdd.js
                ├── messageCreate.js
            └── 📁interaction
                ├── interactionCreate.js
        └── 📁handlers
            ├── commandHandler.js
            ├── componentHandler.js
            ├── eventHandler.js
        └── 📁models
            ├── Achievement.js
            ├── EconomyConfig.js
            ├── Giveaway.js
            ├── Guild.js
            ├── GuildEconomy.js
            ├── GuildLevel.js
            ├── LevelConfig.js
            ├── ModLog.js
            ├── User.js
            ├── Warn.js
            ├── WarnConfig.js
            ├── WeeklyRanking.js
        └── 📁structures
        └── 📁utils
            ├── achievements.js
            ├── anticrash.js
            ├── applyUpgrades.js
            ├── badges.js
            ├── cooldowns.js
            ├── database.js
            ├── deleteCommands.js
            ├── deployCommands.js
            ├── economyConfig.js
            ├── economyConfigGuild.js
            ├── economyCooldowns.js
            ├── economyGuard.js
            ├── embedColors.js
            ├── embedDecorations.js
            ├── embeds.js
            ├── emojis.js
            ├── giveawayHandler.js
            ├── guildData.js
            ├── levelSystem.js
            ├── listCommands.js
            ├── logger.js
            ├── modlog.js
            ├── parseCustomId.js
            ├── parseTime.js
            ├── permissions.js
            ├── warns.js
            ├── weeklyRanking.js
        ├── index.js
    ├── .env
    ├── .env.dev
    ├── .env.dev.example
    ├── .env.example
    ├── .gitignore
    ├── LICENSE
    ├── package.json
    ├── pnpm-lock.yaml
    ├── README.md
    └── test-token.js
```

---

## 🧩 Módulos y Sistemas

### 💰 Economía

- **Banco**: Depósitos y retiros con capacidad limitada por nivel global.
- **Tienda**: Items personalizables con roles incluidos y stock limitado.
- **Juegos**: Blackjack, Slots, Coinflip con apuestas.
- **Trabajos**: Generación de ingresos pasivos con variedad de oficios.
- **Robos**: Sistema de riesgo/recompensa con cooldowns.
- **Inventario**: Gestión de items comprados por usuario.

### ⭐ Niveles

- **Niveles Globales**: XP acumulada en todos los servidores.
- **Niveles por Servidor**: XP específica, configurable por servidor.
- **Roles por Nivel**: Asignación automática de roles al alcanzar ciertos niveles.
- **Anuncios**: Canal dedicado para notificaciones de subidas de nivel.

### 🛡️ Moderación

- **Warns**: Sistema de advertencias con acciones automáticas configurables (kick, ban, timeout).
- **Timeout**: Silenciamiento temporal con duración personalizada.
- **Lock/Unlock**: Bloqueo y desbloqueo de canales.
- **Clear**: Borrado masivo de mensajes con filtro por usuario.
- **ModLog**: Registro completo de todas las acciones de moderación.

### 🎁 Sorteos

- Creación con duración personalizada.
- Requisitos de rol para participar.
- Finalización automática y manual.
- Reroll de ganadores.
- Participación mediante reacción.

---

## 📝 Estructura de un Comando

Cada comando debe exportar un objeto con la siguiente estructura:

```javascript
import { SlashCommandBuilder } from 'discord.js';

export default {
  CMD: new SlashCommandBuilder()
    .setName('nombre')
    .setDescription('Descripción del comando'),
  
  PERMISSIONS: ['ManageMessages'], // Permisos necesarios para el usuario
  BOT_PERMISSIONS: ['SendMessages'], // Permisos necesarios para el bot
  OWNER: false, // Solo para owners (sobreescribe PERMISSIONS)
  GUILD_ONLY: false, // Solo en servidores
  NSFW: false, // Solo en canales NSFW
  COOLDOWN: 3, // Tiempo de cooldown en segundos
  
  async execute(client, interaction, guildData, userData) {
    await interaction.reply('¡Hola mundo!');
  }
};
```

---

## 📝 Estructura de un Componente

Los componentes incluyen botones, menús de selección, modales y menús contextuales:

```javascript
export default {
  customId: 'mi-componente', // Puedes usar patrones como 'mi-componente-{id}'
  
  PERMISSIONS: [],
  BOT_PERMISSIONS: [],
  OWNER: false,
  COOLDOWN: 3,
  
  async execute(client, interaction, args, guildData, userData) {
    // args contiene los valores extraídos del customId
    await interaction.reply('¡Componente ejecutado!');
  }
};
```

---

## 🗄️ Modelos de Base de Datos

| Modelo | Descripción |
|--------|-------------|
| `User` | Datos de usuario (balance, bank, xp, level, inventario, insignias, cooldowns) |
| `Guild` | Configuración general del servidor (prefijo, idioma, canales) |
| `GuildLevel` | Niveles por servidor de cada usuario |
| `LevelConfig` | Configuración del sistema de niveles por servidor |
| `ModLog` | Registro de acciones de moderación |
| `Warn` | Advertencias de usuarios |
| `WarnConfig` | Configuración del sistema de warns por servidor |
| `ShopItem` | Items de la tienda por servidor |
| `Giveaway` | Sorteos activos y finalizados |

---

## 🔧 Variables de Entorno

| Variable | Descripción | Obligatorio |
|----------|-------------|-------------|
| `BOT_TOKEN` | Token de tu bot de Discord | ✅ Sí |
| `CLIENT_ID` | ID de tu bot de Discord | ✅ Sí |
| `MONGO_URL` | URL de conexión a MongoDB | ✅ Sí |
| `LANGUAGE` | Idioma del bot (es/en) | ❌ No (por defecto: es) |
| `COLOR` | Color principal de los embeds | ❌ No (por defecto: #fcc706) |
| `ERROR_COLOR` | Color para errores | ❌ No (por defecto: #ED4245) |
| `COOLDOWN_COLOR` | Color para cooldowns | ❌ No (por defecto: #f3a0fc) |
| `OWNER_IDS` | IDs de los owners (separados por espacio) | ❌ No |
| `GUILD_ID` | ID del servidor para despliegue rápido (opcional) | ❌ No |
| `SUPPORT_CHANNEL_ID` | ID del canal para reportes de errores | ❌ No |
| `STATUS` | Estado del bot (online/idle/dnd/invisible) | ❌ No (por defecto: online) |
| `ACTIVITY_TYPE` | Tipo de actividad (Playing/Listening/Watching) | ❌ No (por defecto: Playing) |
| `ACTIVITY_NAME` | Nombre de la actividad | ❌ No (por defecto: EstrellaStudios ⭐) |

---

## 🛡️ Manejo de Errores

El bot incluye un sistema robusto de manejo de errores:

- **Anticrash**: Captura errores no manejados y eventos de advertencia.
- **Reporte a Soporte**: Los errores críticos se envían automáticamente al canal configurado en `SUPPORT_CHANNEL_ID`.
- **Logs Detallados**: Todos los eventos se registran con colores para mejor legibilidad.
- **Recuperación**: El bot intenta recuperarse de errores sin caer.

---

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas y muy apreciadas! Si no estás familiarizado con el proceso de contribución en GitHub, sigue esta guía paso a paso:

### 🔧 Requisitos Previos

1. **Cuenta de GitHub**: Si no tienes, crea una en [github.com](https://github.com).
2. **Git instalado**: Descárgalo desde [git-scm.com](https://git-scm.com) si no lo tienes.
3. **Node.js y pnpm**: Asegúrate de tener instalados Node.js (v20+) y pnpm.

### 📝 Guía Paso a Paso

#### 1. Fork el repositorio

1. Ve al repositorio: [BlommamPro/discord-bot-base](https://github.com/BlommamPro/discord-bot-base)
2. Haz clic en el botón **Fork** (arriba a la derecha)
3. Esto creará una copia del repositorio en tu cuenta de GitHub

#### 2. Clona tu fork

```bash
git clone https://github.com/TU_USUARIO/discord-bot-base.git
cd discord-bot-base
```

#### 3. Crea una rama para tu feature

```bash
git checkout -b feature/nueva-funcionalidad
```

#### 4. Realiza tus cambios

- Añade nuevas funcionalidades.
- Corrige bugs.
- Mejora la documentación.
- Asegúrate de que el código siga el estilo existente.

#### 5. Prueba tus cambios

```bash
pnpm install
pnpm dev
```

Verifica que todo funcione correctamente y que no introduzcas errores.

#### 6. Commit tus cambios

```bash
git add .
git commit -m "Añadir nueva funcionalidad: descripción breve"
```

#### 7. Push a tu fork

```bash
git push origin feature/nueva-funcionalidad
```

#### 8. Abre un Pull Request

1. Ve a tu fork en GitHub.
2. Haz clic en **Compare & pull request**.
3. Asegúrate de que la rama base sea `main` del repositorio original.
4. Escribe una descripción clara de los cambios realizados.
5. Haz clic en **Create pull request**.

### 📋 Guías de Estilo

- **Código**: Sigue el estilo de código existente (usamos ES Modules).
- **Documentación**: Añade comentarios y actualiza el README si es necesario.
- **Commits**: Usa mensajes claros y descriptivos en español o inglés.
- **Pruebas**: Asegúrate de que el bot funcione correctamente antes de enviar el PR.

### 🎯 Tipos de Contribuciones Aceptadas

- 🐛 **Reporte de bugs**: Abre un Issue describiendo el problema.
- 💡 **Nuevas funcionalidades**: Añade nuevas características útiles.
- 📝 **Mejoras de documentación**: Corrige errores o añade ejemplos.
- 🔧 **Optimizaciones**: Mejora el rendimiento o la legibilidad del código.
- 🌐 **Traducciones**: Añade soporte para nuevos idiomas.

### ❓ ¿Dudas?

Si tienes alguna pregunta sobre cómo contribuir, puedes:

- Unirte al [servidor de soporte en Discord](https://discord.gg/U9PARbw2xS).
- Abrir un Issue en GitHub con tu consulta.
- Contactar directamente al owner: [BlommamPro en Discord](https://discord.com/users/536717287567392768).

---

## ⭐ Apóyanos

Si este proyecto te ha sido útil, considera darle una estrella ⭐ en [GitHub](https://github.com/BlommamPro/discord-bot-base) y compartirlo con otros desarrolladores.

---

## 📄 Licencia

Este proyecto está bajo la licencia **MIT**. Si utilizas este bot, agradecería una mención o un enlace al repositorio original.

---

## 📞 Soporte y Contacto

- **Repositorio**: [GitHub - BlommamPro/discord-bot-base](https://github.com/BlommamPro/discord-bot-base)
- **Servidor de Soporte**: [Discord - U9PARbw2xS](https://discord.gg/U9PARbw2xS)
- **Contacto Directo**: [Discord - BlommamPro](https://discord.com/users/536717287567392768)

---

<div align="center">
  <img src="https://count.getloli.com/@blommampro-bot-d?name=blommampro-bot-d&theme=booru-yuyuyui&padding=7&offset=0&align=top&scale=1&pixelated=1&darkmode=auto" />
</div>
