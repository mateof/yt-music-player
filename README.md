# YouTube Music Player

Cliente web para reproducir musica de YouTube Music. Interfaz moderna con React y TypeScript.

## Demo

[https://mateof.github.io/yt-music-player/](https://mateof.github.io/yt-music-player/)

## Funcionalidades

### Reproductor de Audio
- Reproduccion en streaming de canciones de YouTube Music
- Modo pantalla completa con controles expandidos
- Cola de reproduccion con siguiente/anterior
- Modo aleatorio (shuffle) con algoritmo Fisher-Yates
- Modo repetir: Desactivado / Repetir todo / Repetir una
- Barra de progreso interactiva
- Control de volumen
- Descarga directa de la cancion actual

### Biblioteca de Usuario
- Ver playlists del usuario
- Ver canciones que me gustan (liked songs)
- Scroll infinito para playlists grandes
- Crear nuevas playlists
- Anadir canciones a playlists existentes

### Podcasts y Canales
- Ver podcasts suscritos
- Ver canales suscritos
- Reproducir episodios con scroll infinito paginado

### Archivos Locales
- Ver playlists descargadas en el servidor
- Reproductor dedicado para archivos locales
- Descargar archivos individuales o en ZIP

## Requisitos

- Node.js 18+
- Backend API corriendo (ver repositorio del backend)

## Instalacion

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

La aplicacion estara disponible en `http://localhost:5174`

## Build

```bash
npm run build
```

Los archivos de produccion se generan en la carpeta `dist/`.

## Configuracion

Al iniciar la aplicacion, configura la URL del servidor backend en los ajustes (icono de engranaje).

## Tecnologias

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios

## Backend

Este frontend requiere un servidor backend para funcionar. El backend proporciona:
- Streaming de audio desde YouTube Music
- Autenticacion con cookies de YouTube
- Gestion de biblioteca y playlists
- Descarga de canciones

## Licencia

MIT
