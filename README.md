# WhateverClicks KitaHack

A modern Next.js application built with the latest technologies for optimal performance and developer experience.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) with App Router and Server Components
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com) with new @theme inline syntax
- **UI Components**: [Shadcn UI](https://ui.shadcn.com) + [Radix UI](https://www.radix-ui.com)
- **Font**: [Geist](https://vercel.com/font) optimized with `next/font`

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, pnpm, or bun

### Installation

Install dependencies:

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

The page auto-updates as you edit [src/app/page.tsx](src/app/page.tsx).

### Build

Build for production:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Project Structure

```
whateverclicks-kitahack/
├── src/
│   ├── app/              # App router pages
│   ├── components/       # React components
│   │   └── ui/          # Shadcn UI components
│   └── lib/             # Utility functions
├── public/              # Static assets
└── ...config files
```

## Adding UI Components

This project uses Shadcn UI. To add new components:

```bash
npx shadcn@latest add [component-name]
```

For example:

```bash
npx shadcn@latest add dialog
npx shadcn@latest add input
npx shadcn@latest add form
```

Browse available components at [ui.shadcn.com](https://ui.shadcn.com)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn UI Documentation](https://ui.shadcn.com)
- [Radix UI Documentation](https://www.radix-ui.com/primitives/docs/overview/introduction)

## Deploy on Vercel

Deploy with one click on [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fwhateverclicks-kitahack)

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
