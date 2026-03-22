import { el } from "./dom.js";
import { renderArchivePage } from "../pages/archive.js";
import { renderArrivePage } from "../pages/arrive.js";
import { renderEntitiesPage } from "../pages/entities.js";
import { renderIdentityPage } from "../pages/identity.js";
import { renderImagesPage } from "../pages/images.js";
import { renderJournalsPage } from "../pages/journals.js";
import { renderObservationsPage } from "../pages/observations.js";
import { renderOrphansPage } from "../pages/orphans.js";
import { renderPatternsPage } from "../pages/patterns.js";
import { renderProposalsPage } from "../pages/proposals.js";
import { renderRelationsPage } from "../pages/relations.js";
import { renderHealthPage } from "../pages/health.js";
import { renderSearchPage } from "../pages/search.js";
import { renderTensionsPage } from "../pages/tensions.js";
import { renderThreadsPage } from "../pages/threads.js";

export const NAVIGATION = [
  {
    id: "arrive",
    label: "Arrive",
    items: [
      {
        id: "arrive",
        href: "#/arrive",
        title: "Mindware",
        hint: "System map",
        eyebrow: "Inventory",
        description: "Cybernetic map of the living mind.",
        theme: "hud"
      }
    ]
  },
  {
    id: "memory",
    label: "Memory",
    items: [
      {
        id: "entities",
        href: "#/entities",
        title: "Entities",
        hint: "Nodes and salience",
        eyebrow: "Memory",
        description: "Core entity maintenance with direct access to observations and relations."
      },
      {
        id: "observations",
        href: "#/observations",
        title: "Observations",
        hint: "Bulk actions and editing",
        eyebrow: "Memory",
        description: "Observation maintenance, bulk actions, and emotional processing updates."
      },
      {
        id: "relations",
        href: "#/relations",
        title: "Relations",
        hint: "Graph edges",
        eyebrow: "Memory",
        description: "Relation edges between entities, with filtering and creation."
      },
      {
        id: "images",
        href: "#/images",
        title: "Images",
        hint: "Visual memory",
        eyebrow: "Memory",
        description: "Visual memories linked to entities and observations."
      },
      {
        id: "identity",
        href: "#/identity",
        title: "Identity",
        hint: "Weighted self-graph",
        eyebrow: "Memory",
        description: "Identity sections with weights, content, and links."
      }
    ]
  },
  {
    id: "processing",
    label: "Processing",
    items: [
      {
        id: "health",
        href: "#/health",
        title: "Health",
        hint: "System diagnostics",
        eyebrow: "Processing",
        description: "Cognitive health scores, charge distributions, and system diagnostics."
      },
      {
        id: "proposals",
        href: "#/proposals",
        title: "Proposals",
        hint: "Daemon suggestions",
        eyebrow: "Processing",
        description: "Review and act on daemon-detected proposals."
      },
      {
        id: "orphans",
        href: "#/orphans",
        title: "Orphans",
        hint: "Rescue or archive",
        eyebrow: "Processing",
        description: "Orphaned observations that need resurfacing or archiving."
      },
      {
        id: "patterns",
        href: "#/patterns",
        title: "Patterns",
        hint: "What's alive",
        eyebrow: "Processing",
        description: "Recent pattern analysis across alive entities, weight, charge, and salience."
      },
      {
        id: "tensions",
        href: "#/tensions",
        title: "Tensions",
        hint: "Contradictions to hold",
        eyebrow: "Processing",
        description: "Active and resolved tensions with sit and resolve flows."
      }
    ]
  },
  {
    id: "continuity",
    label: "Continuity",
    items: [
      {
        id: "threads",
        href: "#/threads",
        title: "Threads",
        hint: "Active and resolved",
        eyebrow: "Continuity",
        description: "Current continuity threads with create, edit, resolve, and delete flows."
      },
      {
        id: "journals",
        href: "#/journals",
        title: "Journals",
        hint: "List and calendar",
        eyebrow: "Continuity",
        description: "Journal entries across list and calendar views."
      },
      {
        id: "archive",
        href: "#/archive",
        title: "Archive",
        hint: "Deep memory",
        eyebrow: "Continuity",
        description: "Search and rescue archived observations."
      }
    ]
  },
  {
    id: "search",
    label: "Search",
    items: [
      {
        id: "search",
        href: "#/search",
        title: "Search",
        hint: "Global lookup and filters",
        eyebrow: "Search",
        description: "Semantic search across the vector memory layer."
      }
    ]
  }
];

const PAGE_RENDERERS = {
  arrive: renderArrivePage,
  health: renderHealthPage,
  entities: renderEntitiesPage,
  observations: renderObservationsPage,
  relations: renderRelationsPage,
  images: renderImagesPage,
  identity: renderIdentityPage,
  proposals: renderProposalsPage,
  orphans: renderOrphansPage,
  patterns: renderPatternsPage,
  tensions: renderTensionsPage,
  threads: renderThreadsPage,
  journals: renderJournalsPage,
  archive: renderArchivePage,
  search: renderSearchPage
};

function flattenNavigation() {
  return NAVIGATION.flatMap((section) =>
    section.items.map((item) => ({
      ...item,
      sectionId: section.id
    }))
  );
}

function resolveRoute() {
  const rawHash = window.location.hash || "#/arrive";
  const routeId = rawHash.replace(/^#\//, "") || "arrive";
  const routeMeta =
    flattenNavigation().find((item) => item.id === routeId) || NAVIGATION[0].items[0];

  return {
    id: routeMeta.id,
    meta: routeMeta,
    render: PAGE_RENDERERS[routeMeta.id] || PAGE_RENDERERS.arrive
  };
}

function renderError(message) {
  return el("div", {
    className: "page-shell fade-in",
    children: [
      el("section", {
        className: "placeholder-card",
        children: [
          el("div", {
            className: "section-header",
            children: [
              el("p", {
                className: "section-header__eyebrow",
                text: "Something broke"
              }),
              el("h2", {
                className: "section-header__title",
                text: "The page could not finish loading."
              }),
              el("p", {
                className: "panel-header__body",
                text: message
              })
            ]
          })
        ]
      })
    ]
  });
}

export function createRouter({ services, shell, store }) {
  async function renderCurrentRoute() {
    const route = resolveRoute();

    store.setState({
      ...store.getState(),
      navOpen: false,
      routeId: route.id
    });
    shell.setPageMeta(route.meta);
    shell.setActiveRoute(route.id);
    shell.setActiveSection(route.meta.sectionId);
    shell.setTheme(route.meta.theme || "hud");
    shell.setBusy(true);

    try {
      const page = await route.render({
        api: services.api,
        modal: services.modal,
        refresh: renderCurrentRoute
      });
      shell.mount(page);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      shell.mount(renderError(message));
    } finally {
      shell.setBusy(false);
    }
  }

  return {
    async refresh() {
      await renderCurrentRoute();
    },
    start() {
      window.addEventListener("hashchange", () => {
        renderCurrentRoute();
      });

      if (!window.location.hash) {
        window.location.hash = "#/arrive";
        return;
      }

      renderCurrentRoute();
    }
  };
}
