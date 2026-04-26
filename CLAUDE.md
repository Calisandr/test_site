# Project: Next-Gen Website

## Stack
- **Framework**: Next.js 15 (App Router) + TypeScript
- **3D/WebGL**: Three.js + React Three Fiber + Drei
- **Animations**: GSAP (ScrollTrigger, SplitText, MorphSVG) + Framer Motion
- **Styling**: Tailwind CSS v4 + CSS custom properties for theming
- **Shaders**: Custom GLSL shaders for unique visual effects
- **Audio**: Howler.js for interactive sound design
- **State**: Zustand for global state
- **Fonts**: Variable fonts with animation support

## Design Principles
- NO generic templates. Every section must feel hand-crafted
- Smooth 60fps animations everywhere - no jank
- Micro-interactions on every interactive element
- Custom cursor effects
- Parallax and scroll-driven animations
- 3D elements integrated naturally, not as gimmicks
- Dark/light mode with smooth transitions
- Mobile-first responsive design with touch gestures
- Performance budget: LCP < 2.5s, CLS < 0.1, FID < 100ms

## Code Standards
- All components in TypeScript with strict mode
- Custom hooks for reusable animation logic
- Lazy loading for heavy 3D scenes
- Image optimization with next/image and WebP/AVIF
- Semantic HTML with ARIA labels
- CSS containment for paint performance
- Use `will-change` sparingly and only when needed

## MCP Tools Available
- **Playwright**: Browser testing and visual regression
- **Context7**: Up-to-date docs for Three.js, GSAP, Next.js, Tailwind
- **Fetch**: Pull design inspiration, API data, assets
- **Sequential Thinking**: Complex architecture and design decisions
