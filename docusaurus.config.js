// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const { themes } = require("prism-react-renderer");
const lightCodeTheme = themes.github;
const darkCodeTheme = themes.dracula;

// ---------------------------------------------------------------------------
// CUSTOMIZE ME: the values below are the main things to change when adopting
// this framework for your own project. Everything else is driven from here,
// from `static/data/registry.json`, and from the `brandingConfig` block.
// ---------------------------------------------------------------------------

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "PDS Agent Skills",
  tagline: "AI-powered skills and workflow automation for the NASA Planetary Data System.",
  favicon: "/img/favicon.svg",

  // Set the production url of your site here
  url: "https://riverma.github.io",
  // Set the /<baseUrl>/ pathname under which your site is served
  baseUrl: "/pds-agent-skills/",

  // GitHub pages deployment config.
  organizationName: "riverma",
  projectName: "pds-agent-skills",

  onBrokenLinks: "warn",
  onBrokenMarkdownLinks: "warn",

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          editUrl: "https://github.com/riverma/pds-agent-skills/tree/main/",
          sidebarCollapsed: true,
        },
        blog: {
          showReadingTime: true,
          editUrl: "https://github.com/riverma/pds-agent-skills/tree/main/",
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: "img/docusaurus-social-card.jpg",
      navbar: {
        title: "PDS Agent Skills",
        logo: {
          alt: "PDS Agent Skills",
          src: "img/pds-logo.png",
        },
        items: [
          {
            type: "docSidebar",
            sidebarId: "contributeSidebar",
            position: "left",
            label: "Contribute",
          },
          {
            type: "docSidebar",
            sidebarId: "faqSidebar",
            position: "left",
            label: "FAQ",
          },
          {
            type: "docSidebar",
            sidebarId: "aboutSidebar",
            position: "left",
            label: "About",
          },
          {
            href: "https://github.com/riverma/pds-agent-skills",
            label: "GitHub",
            position: "right",
          },
        ],
      },
      footer: {
        style: "dark",
        links: [
          {
            title: "Resources",
            items: [
              {
                label: "Contribute",
                to: "/docs/contribute/contributing/",
              },
              {
                label: "FAQ",
                to: "/docs/faq",
              },
              {
                label: "About",
                to: "/docs/about",
              },
            ],
          },
          {
            title: "Planetary Data System",
            items: [
              {
                label: "pds.nasa.gov",
                href: "https://pds.nasa.gov/",
              },
              {
                label: "PDS on GitHub",
                href: "https://github.com/NASA-PDS",
              },
            ],
          },
          {
            title: "More",
            items: [
              {
                label: "GitHub",
                href: "https://github.com/riverma/pds-agent-skills",
              },
            ],
          },
        ],
        copyright: `PDS Agent Marketplace — part of the <a href="https://pds.nasa.gov/" style="color: #9ac8f5;">NASA Planetary Data System</a>.<br/>Copyright © ${new Date().getFullYear()} California Institute of Technology. U.S. Government sponsorship acknowledged. Contents licensed under Apache License Version 2.0.<br/>`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
      colorMode: {
        disableSwitch: false,
        defaultMode: "light",
        respectPrefersColorScheme: false,
      },
    }),

  markdown: {
    mermaid: true,
  },

  themes: ["@docusaurus/theme-mermaid"],

  // Custom fields for marketplace framework configuration
  customFields: {
    // Enhanced branding configuration for easy customization
    brandingConfig: {
      // Visual Assets — hero uses the official NASA PDS logo
      logoPath: "/img/pds-logo.png",

      // Hero Section Control
      hero: {
        showCornerFeatures: true, // Toggle corner features display
        cornerFeatures: [
          {
            position: "top-left",
            icon: "ai-centric.png",
            text: "AI-powered automation for planetary data workflows",
            enabled: true,
          },
          {
            position: "bottom-left",
            icon: "community.svg",
            text: "Built by the PDS Engineering Node and community",
            enabled: true,
          },
          {
            position: "top-right",
            icon: "iterative.svg",
            text: "Open source and freely available",
            enabled: true,
          },
          {
            position: "bottom-right",
            icon: "scope.svg",
            text: "Skills for releases, security, issues, and pull requests",
            enabled: true,
          },
        ],
        customTagline: null, // Override global tagline specifically for hero
      },

      // Marketplace Control
      marketplace: {
        showEmptyState: true, // Show friendly message when marketplace is empty
        // Note: registries are configured under marketplaceConfig.registries
      },
    },

    marketplaceConfig: {
      // Registries the website loads and displays. The first entry is the
      // local, hand-authored source of truth (static/data/registry.json).
      // Add remote registry URLs to federate other marketplaces — the
      // browser shows a registry picker when more than one is listed.
      registries: [
        "./static/data/registry.json", // Local registry (hand-authored source of truth)
        // "https://nasa-ammos.github.io/slim/data/registry.json", // example remote
      ],
    },
  },
};

module.exports = config;
