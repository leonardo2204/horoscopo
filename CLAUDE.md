# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TanStack Start application - a full-stack React framework built on TanStack Router. The project structure follows the standard TanStack Start conventions with file-based routing and type-safe development.

## Development Commands

- `npm run dev` - Start development server (runs on port 3000)
- `npm run build` - Build application for production (includes TypeScript type checking)
- `npm start` - Start production server
- `pnpm install` - Install dependencies (project uses pnpm as mentioned in README)

## Project Architecture

### Core Stack
- **Framework**: TanStack Start with TanStack Router
- **Styling**: Tailwind CSS
- **Database**: Drizzle ORM with LibSQL client
- **Auth**: Better Auth
- **Analytics**: PostHog, Sentry
- **Language**: TypeScript with strict configuration

### Directory Structure
- `src/routes/` - File-based routing with TanStack Router conventions
  - API routes in `src/routes/api/`
  - Layout routes with underscore prefix (e.g., `_pathlessLayout`)
  - Dynamic routes with `$` syntax (e.g., `posts.$postId.tsx`)
- `src/components/` - Reusable React components including error boundaries
- `src/utils/` - Utility functions and server functions
- `src/styles/` - CSS files (Tailwind main stylesheet)

### Key Files
- `src/routeTree.gen.ts` - Auto-generated route tree (read-only, excluded from file watching)
- `src/router.tsx` - Router configuration with error boundaries and preloading
- `src/routes/__root.tsx` - Root layout component with navigation and meta tags

### Important Patterns
- Server functions using `createServerFn()` for API endpoints
- Type-safe routing with TanStack Router
- File-based routing with automatic route tree generation
- Path alias `~/*` maps to `./src/*`
- Error handling with DefaultCatchBoundary and NotFound components
- External API integration (JSONPlaceholder for demo posts/users)

### VSCode Configuration
- `routeTree.gen.ts` is excluded from file watching and search as it's auto-generated
- File marked as read-only in editor