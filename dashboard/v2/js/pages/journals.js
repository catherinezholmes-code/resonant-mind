import { clear, el } from "../app/dom.js";
import { formatDate, formatRelativeTime, truncate } from "../app/format.js";
import {
  createBadge,
  createButton,
  createEmptyState,
  createSectionHeader,
  createStackCard,
  createSubnav
} from "../components/ui.js";

function buildCalendar(year, month, journals, onDayClick) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split("T")[0];
  const entriesByDate = new Map(journals.map((journal) => [journal.entry_date, journal]));
  const cells = [];

  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach((day) => {
    cells.push(
      el("div", {
        className: "meta-label",
        text: day
      })
    );
  });

  for (let index = 0; index < firstDay; index += 1) {
    cells.push(el("div"));
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const entry = entriesByDate.get(date);

    cells.push(
      el("button", {
        className: `calendar-cell${entry ? " is-entry" : ""}${date === today ? " is-today" : ""}`,
        attrs: { type: "button" },
        on: {
          click: () => onDayClick(date, entry)
        },
        children: [
          el("strong", {
            text: String(day)
          }),
          entry
            ? el("span", {
                className: "meta-copy",
                text: truncate(entry.content, 48)
              })
            : null
        ]
      })
    );
  }

  return el("div", {
    className: "calendar-grid",
    children: cells
  });
}

export async function renderJournalsPage({ api, modal, refresh }) {
  const journals = await api.listJournals();
  const state = {
    tab: "list",
    year: new Date().getFullYear(),
    month: new Date().getMonth()
  };

  const root = el("div", {
    className: "page-shell fade-in"
  });
  const tabsNode = el("div");
  const contentNode = el("div", {
    className: "stack-list"
  });

  async function openJournalEditor(journal) {
    const result = await modal.openForm({
      title: journal ? "Edit journal entry" : "Create journal entry",
      submitLabel: journal ? "Save journal" : "Create journal",
      values: {
        entry_date: journal?.entry_date || new Date().toISOString().split("T")[0],
        content: journal?.content || "",
        emotion: journal?.emotion || ""
      },
      fields: [
        {
          id: "entry_date",
          label: "Entry date",
          type: "date",
          required: true
        },
        {
          id: "content",
          label: "Content",
          type: "textarea",
          required: true
        },
        {
          id: "emotion",
          label: "Emotion"
        }
      ]
    });

    if (!result) return;

    if (journal) {
      await api.updateJournal(journal.id, {
        content: result.content,
        emotion: result.emotion || null,
        tags: journal.tags || null
      });
    } else {
      await api.createJournal({
        entry_date: result.entry_date,
        content: result.content,
        emotion: result.emotion || null
      });
    }

    await refresh();
  }

  function renderTabs() {
    clear(tabsNode);
    tabsNode.appendChild(
      createSubnav(
        [
          { id: "list", label: `List (${journals.length})` },
          { id: "calendar", label: "Calendar" }
        ],
        state.tab,
        (tab) => {
          state.tab = tab;
          renderTabs();
          renderContent();
        }
      )
    );
  }

  function renderContent() {
    clear(contentNode);

    if (state.tab === "list") {
      if (!journals.length) {
        contentNode.appendChild(
          createEmptyState(
            "No journal entries",
            "Create a journal entry to start building continuity in V2."
          )
        );
        return;
      }

      journals.forEach((journal) => {
        contentNode.appendChild(
          createStackCard({
            title: formatDate(journal.entry_date),
            body: truncate(journal.content, 180),
            meta: [
              journal.emotion ? { text: journal.emotion } : null,
              {
                text: formatRelativeTime(journal.created_at),
                className: "pill pill--soft"
              }
            ].filter(Boolean),
            actions: [
              createButton("Edit", {
                on: {
                  click: async () => {
                    const fullJournal = await api.getJournal(journal.id);
                    await openJournalEditor(fullJournal);
                  }
                }
              }),
              createButton("Delete", {
                className: "button",
                on: {
                  click: async () => {
                    const confirmed = await modal.confirm({
                      title: "Delete journal entry",
                      description: "This removes the journal entry permanently.",
                      confirmLabel: "Delete journal"
                    });

                    if (!confirmed) return;
                    await api.deleteJournal(journal.id);
                    await refresh();
                  }
                }
              })
            ]
          })
        );
      });

      return;
    }

    const monthHeader = el("div", {
      className: "page-toolbar",
      children: [
        createButton("Prev month", {
          on: {
            click: () => {
              state.month -= 1;
              if (state.month < 0) {
                state.month = 11;
                state.year -= 1;
              }
              renderContent();
            }
          }
        }),
        createBadge(
          new Date(state.year, state.month).toLocaleString("en-GB", {
            month: "long",
            year: "numeric"
          }),
          "pill pill--soft"
        ),
        createButton("Next month", {
          on: {
            click: () => {
              state.month += 1;
              if (state.month > 11) {
                state.month = 0;
                state.year += 1;
              }
              renderContent();
            }
          }
        })
      ]
    });

    const calendar = buildCalendar(state.year, state.month, journals, async (date, entry) => {
      if (entry) {
        const fullJournal = await api.getJournal(entry.id);
        await openJournalEditor(fullJournal);
      } else {
        await openJournalEditor({ entry_date: date });
      }
    });

    contentNode.append(monthHeader, calendar);
  }

  root.appendChild(
    el("section", {
      className: "panel",
      children: [
        createSectionHeader({
          eyebrow: "Continuity",
          title: "Journals",
          body: "List and calendar views over journal entries, with create, edit, and delete in place."
        }),
        el("div", {
          className: "page-toolbar",
          children: [
            tabsNode,
            createButton("New journal", {
              className: "button",
              on: {
                click: async () => {
                  await openJournalEditor(null);
                }
              }
            })
          ]
        }),
        contentNode
      ]
    })
  );

  renderTabs();
  renderContent();
  return root;
}
