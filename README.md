# Content Orbit

Content Orbit is an internal web application for Kryptonum, designed to optimize and scale the SEO content creation process. The application aims to solve the challenge of rapidly generating a large number (up to 100 per week) of high-quality, SEO-optimized articles to significantly improve the company's website search engine rankings.

## ✨ Key Features

- **🤖 AI-Powered Content Generation:** Streamline content creation with a three-step workflow: Topic -> Subtopics -> Concepts.
- ** scalability Massive Scalability:** Generate up to 100 article concepts per week.
- **✍️ Advanced Editor:** Edit and refine articles with a Markdown editor and AI chat assistance.
- **🔄 Seamless Sanity CMS Integration:** Push finished articles to Sanity CMS with a single click.
- **👤 Personalized Experience:** Each user has their own isolated data, including topic clusters, articles, and AI preferences.
- **🔍 Custom Audits:** Create and save custom AI prompts to run repeatable content audits.

## 🛠️ Tech Stack

### Frontend

- **[Astro 5](https://astro.build/):** UI framework for building fast, content-driven websites.
- **[React 19](https://react.dev/):** Library for building interactive user interfaces.
- **[TypeScript 5](https://www.typescriptlang.org/):** Statically typed superset of JavaScript.
- **[Tailwind CSS 4](https://tailwindcss.com/):** A utility-first CSS framework for rapid UI development.
- **[Shadcn/ui](https://ui.shadcn.com/):** Re-usable components built using Radix UI and Tailwind CSS.

### Backend

- **[Supabase](https://supabase.com/):** The open-source Firebase alternative for building secure and scalable backends.
  - PostgreSQL Database
  - Authentication
  - Auto-generated APIs

### Artificial Intelligence

- **[OpenRouter.ai](https://openrouter.ai/):** Access a wide range of AI models (OpenAI, Anthropic, Google, etc.) to ensure high efficiency and cost-effectiveness.

### Integrations

- **[Sanity CMS](https://www.sanity.io/):** The target content management system for exporting articles.

### CI/CD & Hosting

- **[GitHub Actions](https://github.com/features/actions):** For creating CI/CD pipelines.
- **[Cloudflare Pages](https://pages.cloudflare.com/):** For hosting the application.

### Testing

- **[Vitest](https://vitest.dev/):** A blazing fast unit-test framework.
- **[React Testing Library](https://testing-library.com/docs/react-testing-library/intro/):** For testing React components.
- **[Playwright](https://playwright.dev/):** For end-to-end and visual regression testing.

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js v18 or later
- npm

### Installation

1.  **Clone the repository:**

    ```sh
    git clone https://github.com/your-username/content-orbit.git
    cd content-orbit
    ```

2.  **Install NPM packages:**

    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add the necessary environment variables for connecting to your Supabase development instance.

    ```env
    PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL"
    PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
    ```

4.  **Run the development server:**
    ```sh
    npm run dev
    ```

Open [http://localhost:4321](http://localhost:4321) with your browser to see the result.
