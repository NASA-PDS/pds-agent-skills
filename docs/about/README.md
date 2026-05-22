---
sidebar_position: 1
---

# About

> _AI-powered skills and workflow automation for the NASA Planetary Data System._

## About the Planetary Data System

The [NASA Planetary Data System (PDS)](https://pds.nasa.gov/) is a long-term
archive of digital data products returned from NASA's planetary missions, and
from other flight and ground-based data acquisitions, including laboratory
experiments. More than a storage facility, the PDS is an **actively managed
archive**, curated by planetary scientists so that the data remains usable and
accessible to the worldwide scientific community.

Every product in the archive is **peer-reviewed and well-documented**, organized
by scientific discipline, and made available **free of charge** with no export
restrictions.

### Discipline Nodes

The PDS is a federation of specialized **Discipline Nodes**, each responsible for
a scientific domain:

| Node | Focus |
| --- | --- |
| **Atmospheres (ATM)** | Planetary atmospheric data |
| **Cartography and Imaging Sciences (IMG)** | Mapping and imaging products |
| **Geosciences (GEO)** | Geological and surface data |
| **Navigational & Ancillary Information Facility (NAIF)** | Spacecraft navigation and geometry |
| **Planetary Plasma Interactions (PPI)** | Plasma and magnetosphere data |
| **Ring-Moon Systems (RMS)** | Planetary rings and satellites |
| **Small Bodies (SBN)** | Asteroids and comets |

An **Engineering Node** supports the federation with the PDS4 data standard,
common software, and infrastructure.

## About this marketplace

The **PDS Agent Marketplace** packages common PDS software-engineering workflows
as AI **skills** — instruction sets that an AI coding agent (such as Claude Code)
can discover, install, and run.

Instead of following a wiki page by hand, an engineer can ask their AI agent to
"generate release notes for this repository" or "triage our open Dependabot
alerts," and the agent applies the PDS-standard workflow automatically.

**What it provides today:**

- 🔧 **Development workflow** — create issues and pull requests in NASA-PDS
  repositories using organizational templates, and generate release notes from
  merged work.
- 🔒 **Security** — export, triage, and update dependency (Dependabot) and
  SonarCloud security findings across PDS repositories.

Browse the [PDS Agent Marketplace catalog](/) to see every available skill, or
read the [PDS Agent Marketplace FAQ](/docs/faq) to get started.

## How it works

The catalog is driven by a single hand-authored file, `static/data/registry.json`.
The Claude Code plugin manifest is generated from it automatically by the build.
To contribute a skill, see [Contribute a Skill to the PDS Agent Marketplace](/docs/contribute/submit-best-practice).
