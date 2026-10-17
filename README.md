# 🤖 Discord Bot Base - EstrellaStudios

Un bot de Discord modular y completo construido con **Discord.js v14** y **MongoDB**. Incluye un avanzado sistema de economía por servidor con mejoras (RPG), sistema de niveles dual, moderación, sorteos y configuración independiente por servidor.

---

## 📋 Tabla de Contenidos

- [Características Principales](#-características-principales)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Scripts de Arranque y Comandos](#-scripts-de-arranque-y-comandos)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Módulos y Sistemas](#-módulos-y-sistemas)
- [Estructura de un Comando](#-estructura-de-un-comando)
- [Estructura de un Componente](#-estructura-de-un-componente)
- [Modelos de Base de Datos](#%EF%B8%8F-modelos-de-base-de-datos)
- [Variables de Entorno](#-variables-de-entorno)
- [Manejo de Errores](#-manejo-de-errores)
- [Contribuciones](#-contribuciones)
- [Apóyanos](#-apóyanos)
- [Licencia](#-licencia)
- [Soporte y Contacto](#-soporte-y-contacto)

---

## ✨ Características Principales

- **💰 Sistema de Economía Avanzado**: Economía independiente por servidor. Incluye balance, banco con capacidad, sistema de mejoras (upgrades) para aumentar ganancias, y juegos como blackjack, slots, coinflip, robos y crímenes.
- **⭐ Sistema de Niveles Dual**: Niveles globales (compartidos entre servidores) y niveles por servidor, con asignación automática de roles y anuncios personalizables.
- **🛡️ Moderación Avanzada**: Warns con acciones automáticas configurables, timeouts, bans, kicks, bloqueo de canales y registro completo de acciones (ModLog).
- **🎁 Sorteos (Giveaways)**: Creación, finalización y reroll de sorteos con requisitos de roles y niveles.
- **🏆 Logros y Ranking**: Sistema de insignias desbloqueables por hitos de economía y ranking semanal de coins ganados.
- **⚙️ Configuración Total por Servidor**: Cada servidor puede ajustar cooldowns, recompensas, límites de apuestas y módulos de economía mediante `/economyconfig`.
- **🔄 Menús Contextuales**: Comandos de contexto para usuarios y mensajes.
- **🛡️ Anticrash**: Sistema robusto de manejo de errores con reporte automático a un canal de soporte.
- **👑 Comandos de Owner**: Gestión de servidores y ajustes globales.

---

## 🛠️ Tecnologías Utilizadas

- **[Node.js](https://nodejs.org/)** (v20+)
- **[Discord.js](https://discord.js.org/)** (v14)
- **[MongoDB](https://www.mongodb.com/)** + **[Mongoose](https://mongoosejs.com/)**
- **[pnpm](https://pnpm.io/)** (Gestor de paquetes recomendado)

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

Edita el archivo `.env` con tus credenciales. Aquí tienes el ejemplo de cómo debe quedar tu **`.env` para producción**:

```env
# ===== ENTORNO =====
ENV=production

# ===== BOT =====
BOT_TOKEN=TU_TOKEN_AQUI
CLIENT_ID=ID_DE_TU_BOT

# ===== BASE DE DATOS =====
MONGO_URL=mongodb+srv://user:pass@cluster0.jlbcfcy.mongodb.net/bot

# ===== CONFIGURACIÓN =====
OWNER_IDS=TU_ID_AQUI
SUPPORT_CHANNEL_ID=ID_CANAL_SOPORTE

# ===== ESTADO =====
STATUS=online
ACTIVITY_TYPE=Playing
ACTIVITY_NAME="EstrellaStudios ⭐"
```

Y aquí tienes el ejemplo de tu **`.env.dev` para desarrollo**:

```env
# ===== ENTORNO =====
ENV=development

# ===== BOT =====
BOT_TOKEN=TU_TOKEN_AQUI
CLIENT_ID=ID_DE_TU_BOT
GUILD_ID=ID_SERVIDOR_TESTING

# ===== BASE DE DATOS =====
MONGO_URL=mongodb+srv://user:pass@cluster0.jlbcfcy.mongodb.net/bot-dev

# ===== CONFIGURACIÓN =====
OWNER_IDS=TU_ID_AQUI
SUPPORT_CHANNEL_ID=ID_CANAL_SOPORTE

# ===== ESTADO =====
STATUS=idle
ACTIVITY_TYPE=Watching
ACTIVITY_NAME="🔧 Modo Desarrollo"
```

> **⚠️ NOTA IMPORTANTE SOBRE LOS INTENTS EN EL PORTAL DE DISCORD:**
> Para que el bot funcione correctamente y cumpla con las políticas, en el **Portal de Desarrolladores (Pestaña Bot)** debes tener configurado lo siguiente:
> - ✅ **Presence Intent:** Activado (Necesario para el comando `/userinfo`).
> - ✅ **Server Members Intent:** Activado (Necesario para el sistema de niveles y roles automáticos).
> - ❌ **Message Content Intent:** Desactivado (No es necesario, el bot usa comandos de barra).

---

## 🚀 Scripts de Arranque y Comandos

El proyecto incluye scripts configurados en el `package.json` para facilitar el desarrollo y el despliegue. 

### ¿Cómo funcionan los entornos?
- **Producción (`.env`)**: Se usa para el bot en vivo. Los comandos se despliegan de forma **global** (pueden tardar hasta 1 hora en aparecer en todos los servidores).
- **Desarrollo (`.env.dev`)**: Se usa para hacer pruebas. Requiere un `GUILD_ID` en el `.env.dev` para que los comandos se desplieguen **instantáneamente** solo en tu servidor de pruebas.

### Lista de Scripts

| Comando | ¿Qué hace? | ¿Cuándo usarlo? |
|---------|------------|-----------------|
| `pnpm start` | Inicia el bot en producción | Cuando el bot ya está listo para estar online 24/7. |
| `pnpm dev` | Inicia el bot en modo desarrollo con auto-reinicio (`--watch`) | Mientras programas. Si cambias el código, el bot se reinicia solo. |
| `pnpm cmd:deploy` | Despliega comandos globalmente (o al `GUILD_ID` si está configurado) | La primera vez que subes el bot a producción o añades comandos nuevos. |
| `pnpm cmd:deploy:dev` | Despliega comandos solo en tu servidor de pruebas de forma instantánea | Cada vez que creas o modificas un comando nuevo mientras desarrollas. |
| `pnpm cmd:delete` | Borra todos los comandos globales | Si necesitas hacer una limpieza total porque algo se rompió. |
| `pnpm cmd:delete:dev` | Borra los comandos de tu servidor de pruebas | Para limpiar tu servidor de desarrollo. |
| `pnpm cmd:list` | Muestra en consola la lista de comandos registrados en Discord | Para verificar si tus comandos se subieron correctamente. |
| `pnpm cmd:reset` | Elimina y vuelve a desplegar los comandos (Producción) | Atajo para hacer un `delete` + `deploy` de una sola vez. |
| `pnpm cmd:reset:dev` | Elimina y vuelve a desplegar los comandos (Desarrollo) | Atajo para el entorno de desarrollo. |

> **💡 Tip de Desarrollo:** Si estás creando un comando nuevo, usa `pnpm cmd:deploy:dev` para probarlo al instante en tu servidor. Una vez que funcione perfectamente, usa `pnpm cmd:deploy` para subirlo a producción.

---

## 📁 Estructura del Proyecto

```text
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
    ├── .env.example
    ├── .env.dev.example
    ├── .gitignore
    ├── LICENSE
    ├── package.json
    ├── pnpm-lock.yaml
    └── README.md
```

---

## 🧩 Módulos y Sistemas

### 💰 Economía (Server-Side)
- **Economía Independiente**: Los balances, bancos y mejoras son únicos para cada servidor.
- **Mejoras (Upgrades)**: Los usuarios pueden comprar mejoras (mejor trabajo, suerte en apuestas, ingresos pasivos, etc.) para potenciar sus ganancias.
- **Juegos de Azar**: Blackjack, Slots y Coinflip con apuestas configurables.
- **Logros y Ranking**: Sistema de insignias automáticas y ranking semanal.

### ⭐ Niveles (Dual)
- **Niveles Globales**: XP acumulada en todos los servidores.
- **Niveles por Servidor**: XP específica, configurable, con canales ignorados y anuncios.

### 🛡️ Moderación
- **Warns Automáticos**: Configuración de castigos progresivos (timeout, kick, ban) al acumular advertencias.
- **Historial (ModLog)**: Registro detallado de cada acción de moderación con estado de los warns.

### 🎁 Sorteos (Giveaways)
- Creación con duración personalizada, requisitos de rol y/o nivel, y participación mediante reacción (🎉).

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
  OWNER: false, // Solo para owners del bot
  GUILD_ONLY: true, // Solo en servidores
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
| `User` | Datos globales del usuario (XP global, nivel, insignias, cooldowns) |
| `GuildEconomy` | Economía por servidor (balance, banco, mejoras, estadísticas) |
| `EconomyConfig` | Configuración de economía por servidor (cooldowns, recompensas, límites) |
| `Guild` | Configuración general del servidor (idioma, canales, etc.) |
| `GuildLevel` | Niveles por servidor de cada usuario |
| `LevelConfig` | Configuración del sistema de niveles por servidor |
| `ModLog` | Registro de acciones de moderación |
| `Warn` | Advertencias de usuarios |
| `WarnConfig` | Configuración del sistema de warns por servidor |
| `Achievement` | Logros desbloqueados por usuario |
| `WeeklyRanking` | Registro de coins ganados para el ranking semanal |
| `Giveaway` | Sorteos activos y finalizados |

---

## 🔧 Variables de Entorno

| Variable | Descripción | Obligatorio |
|----------|-------------|-------------|
| `BOT_TOKEN` | Token de tu bot de Discord | ✅ Sí |
| `CLIENT_ID` | ID de tu bot de Discord | ✅ Sí |
| `MONGO_URL` | URL de conexión a MongoDB | ✅ Sí |
| `GUILD_ID` | ID del servidor para despliegue rápido (opcional) | ❌ No |
| `OWNER_IDS` | IDs de los owners (separados por coma o espacio) | ❌ No |
| `SUPPORT_CHANNEL_ID` | ID del canal para reportes de errores | ❌ No |
| `STATUS` | Estado del bot (online/idle/dnd/invisible) | ❌ No (por defecto: online) |
| `ACTIVITY_TYPE` | Tipo de actividad (Playing/Listening/Watching) | ❌ No |
| `ACTIVITY_NAME` | Nombre de la actividad | ❌ No |

---

## 🛡️ Manejo de Errores

El bot incluye un sistema robusto de manejo de errores:

- **Anticrash**: Captura errores no manejados y eventos de advertencia.
- **Reporte a Soporte**: Los errores críticos se envían automáticamente al canal configurado en `SUPPORT_CHANNEL_ID`.
- **Logs Detallados**: Todos los eventos se registran con colores para mejor legibilidad en la consola.
- **Protección contra Bucles**: Los sistemas de XP y ranking tienen protecciones para evitar bucles infinitos si los datos se corrompen.

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
