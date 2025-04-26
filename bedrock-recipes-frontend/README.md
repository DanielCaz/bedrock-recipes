# Bedrock Recipes Frontend

A modern frontend application built with React, Vite, and TypeScript. This project provides a solid foundation for building scalable web apps, featuring type-safe routing, data fetching, and a beautiful UI with Tailwind CSS and Shadcn UI components.

## Features

- ⚡ Vite for fast development and builds
- ⚛️ React with TypeScript
- 🧭 TanStack Router for type-safe routing
- 🔄 TanStack Query for data fetching and caching
- 🎨 Tailwind CSS for utility-first styling
- 🧩 Shadcn UI components (Radix UI + Tailwind)
- 🧹 Prettier for code formatting

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (latest version)
- [Node.js](https://nodejs.org/) (if not using Bun)

### Install dependencies

```bash
bun install
```

### Start the development server

```bash
bun run dev
```

### Build for production

```bash
bun run build
```

### Preview production build

```bash
bun run preview
```

## Project Structure

```
/bedrock-recipes-frontend
├── public/              # Static assets
├── src/                 # Source code
│   ├── assets/          # Images and static files
│   ├── components/      # Reusable UI components
│   ├── lib/             # Utility functions
│   ├── routes/          # App routes (TanStack Router)
│   ├── index.css        # Global styles
│   ├── main.tsx         # App entry point
│   └── routeTree.gen.ts # Generated routing
├── index.html           # HTML template
├── package.json         # Project metadata
├── vite.config.ts       # Vite configuration
└── ...                  # Other config files
```

## Tech Stack

- Vite
- React
- TypeScript
- TanStack Router
- TanStack Query
- Tailwind CSS
- Shadcn UI
