import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  AlertCircle,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronLeft,
  Clock3,
  Edit3,
  History,
  Home,
  ListChecks,
  Plus,
  Repeat2,
  Search,
  Trash2,
} from "lucide-react";
import type {
  AppData,
  CompletionRecord,
  FrequencyUnit,
  Priority,
  Reminder,
  ReminderInput,
  ReminderStatus,
  View,
} from "./types";
import { formatDate, getReminderStatus, isWithinNextDays, todayISO } from "./lib/date";
import {
  completeReminder,
  createReminder,
  updateReminder,
} from "./lib/recurrence";
import { loadData, saveData } from "./lib/storage";

function getDefaultInput(): ReminderInput {
  return {
    title: "",
    description: "",
    category: "",
    startDate: todayISO(),
    frequency: {
      interval: 1,
      unit: "weeks",
    },
    priority: "medium",
    notes: "",
  };
}

const priorityLabels: Record<Priority, string> = {
  low: "Bassa",
  medium: "Media",
  high: "Alta",
};

const unitLabels: Record<FrequencyUnit, string> = {
  days: "giorni",
  weeks: "settimane",
  months: "mesi",
};

const statusLabels: Record<ReminderStatus, string> = {
  overdue: "Arretrato",
  today: "Oggi",
  upcoming: "In arrivo",
};

type ReminderFormState = {
  mode: "create" | "edit";
  reminder?: Reminder;
};

type StatusFilter = "all" | ReminderStatus;
type PriorityFilter = "all" | Priority;

function App() {
  const [data, setData] = useState<AppData>(() => loadData());
  const [view, setView] = useState<View>("dashboard");
  const [selectedReminderId, setSelectedReminderId] = useState<string | null>(null);
  const [formState, setFormState] = useState<ReminderFormState | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    saveData(data);
  }, [data]);

  const today = todayISO();

  const sortedReminders = useMemo(
    () =>
      [...data.reminders].sort((a, b) => {
        if (a.nextDueDate === b.nextDueDate) {
          return priorityWeight(b.priority) - priorityWeight(a.priority);
        }
        return a.nextDueDate.localeCompare(b.nextDueDate);
      }),
    [data.reminders],
  );

  const categories = useMemo(
    () =>
      Array.from(
        new Set(data.reminders.map((reminder) => reminder.category).filter(Boolean)),
      ).sort() as string[],
    [data.reminders],
  );

  const overdue = sortedReminders.filter(
    (reminder) => getReminderStatus(reminder.nextDueDate, today) === "overdue",
  );
  const dueToday = sortedReminders.filter(
    (reminder) => getReminderStatus(reminder.nextDueDate, today) === "today",
  );
  const upcoming = sortedReminders.filter(
    (reminder) => getReminderStatus(reminder.nextDueDate, today) === "upcoming",
  );
  const nextSevenDays = sortedReminders.filter((reminder) =>
    isWithinNextDays(reminder.nextDueDate, 7, today),
  );
  const recentCompletions = [...data.completions]
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, 5);

  const filteredReminders = sortedReminders.filter((reminder) => {
    const status = getReminderStatus(reminder.nextDueDate, today);
    const searchable = [
      reminder.title,
      reminder.description,
      reminder.category,
      reminder.notes,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchable.includes(search.trim().toLowerCase());
    const matchesStatus = statusFilter === "all" || status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || reminder.priority === priorityFilter;
    const matchesCategory =
      categoryFilter === "all" || reminder.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const selectedReminder =
    data.reminders.find((reminder) => reminder.id === selectedReminderId) ?? null;
  const selectedCompletions = selectedReminder
    ? data.completions
        .filter((completion) => completion.reminderId === selectedReminder.id)
        .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    : [];

  function openDetail(reminderId: string) {
    setSelectedReminderId(reminderId);
    setView("detail");
  }

  function handleSave(input: ReminderInput) {
    const editingReminder =
      formState?.mode === "edit" ? formState.reminder : undefined;

    if (editingReminder) {
      setData((current) => ({
        ...current,
        reminders: current.reminders.map((reminder) =>
          reminder.id === editingReminder.id ? updateReminder(reminder, input) : reminder,
        ),
      }));
    } else {
      setData((current) => ({
        ...current,
        reminders: [...current.reminders, createReminder(input)],
      }));
    }

    setFormState(null);
  }

  function handleComplete(reminder: Reminder) {
    const result = completeReminder(reminder, today);

    setData((current) => ({
      ...current,
      reminders: current.reminders.map((item) =>
        item.id === reminder.id ? result.reminder : item,
      ),
      completions: [result.completion, ...current.completions],
    }));
  }

  function handleDelete(reminder: Reminder) {
    const confirmed = window.confirm(
      `Eliminare "${reminder.title}" e la sua cronologia?`,
    );
    if (!confirmed) return;

    setData((current) => ({
      ...current,
      reminders: current.reminders.filter((item) => item.id !== reminder.id),
      completions: current.completions.filter(
        (completion) => completion.reminderId !== reminder.id,
      ),
    }));
    setSelectedReminderId(null);
    setView("list");
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-row">
          <div className="brand-mark">
            <CalendarClock size={26} />
          </div>
          <div>
            <p className="eyebrow">Planner ricorrente</p>
            <h1>Pro Memoria</h1>
          </div>
        </div>
        <button className="primary-action" onClick={() => setFormState({ mode: "create" })}>
          <Plus size={18} />
          Nuovo
        </button>
      </header>

      <nav className="tab-bar" aria-label="Navigazione principale">
        <button
          className={view === "dashboard" ? "active" : ""}
          onClick={() => setView("dashboard")}
        >
          <Home size={17} />
          Dashboard
        </button>
        <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>
          <ListChecks size={17} />
          Tutti i promemoria
        </button>
      </nav>

      <main>
        {view === "dashboard" && (
          <Dashboard
            overdue={overdue}
            dueToday={dueToday}
            upcoming={upcoming}
            nextSevenDaysCount={nextSevenDays.length}
            recentCompletions={recentCompletions}
            onComplete={handleComplete}
            onOpenDetail={openDetail}
            onCreate={() => setFormState({ mode: "create" })}
          />
        )}

        {view === "list" && (
          <ReminderList
            reminders={filteredReminders}
            categories={categories}
            search={search}
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
            categoryFilter={categoryFilter}
            onSearchChange={setSearch}
            onStatusFilterChange={setStatusFilter}
            onPriorityFilterChange={setPriorityFilter}
            onCategoryFilterChange={setCategoryFilter}
            onComplete={handleComplete}
            onOpenDetail={openDetail}
          />
        )}

        {view === "detail" && selectedReminder && (
          <ReminderDetail
            reminder={selectedReminder}
            completions={selectedCompletions}
            onBack={() => setView("list")}
            onComplete={() => handleComplete(selectedReminder)}
            onEdit={() =>
              setFormState({ mode: "edit", reminder: selectedReminder })
            }
            onDelete={() => handleDelete(selectedReminder)}
          />
        )}
      </main>

      {formState && (
        <ReminderForm
          mode={formState.mode}
          reminder={formState.reminder}
          onClose={() => setFormState(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function Dashboard({
  overdue,
  dueToday,
  upcoming,
  nextSevenDaysCount,
  recentCompletions,
  onComplete,
  onOpenDetail,
  onCreate,
}: {
  overdue: Reminder[];
  dueToday: Reminder[];
  upcoming: Reminder[];
  nextSevenDaysCount: number;
  recentCompletions: CompletionRecord[];
  onComplete: (reminder: Reminder) => void;
  onOpenDetail: (id: string) => void;
  onCreate: () => void;
}) {
  const nextItems = upcoming.slice(0, 6);

  return (
    <section className="dashboard-grid">
      <div className="stats-grid">
        <StatCard label="Arretrati" value={overdue.length} tone="danger" icon={<Clock3 />} />
        <StatCard label="Oggi" value={dueToday.length} tone="warning" icon={<CalendarClock />} />
        <StatCard
          label="Prossimi 7 giorni"
          value={nextSevenDaysCount}
          tone="calm"
          icon={<ListChecks />}
        />
      </div>

      <section className="panel urgent-panel">
        <SectionTitle
          icon={<AlertCircle size={22} />}
          title="Ora"
          subtitle="Arretrati e scadenze di oggi"
        />
        {overdue.length === 0 && dueToday.length === 0 ? (
          <EmptyState
            title="Nessuna urgenza"
            text="Niente in coda."
            actionLabel="Aggiungi il primo"
            onAction={onCreate}
          />
        ) : (
          <div className="card-stack">
            {[...overdue, ...dueToday].map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                compact={false}
                onComplete={() => onComplete(reminder)}
                onOpen={() => onOpenDetail(reminder.id)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <SectionTitle
          icon={<CalendarDays size={22} />}
          title="Prossimi"
          subtitle="Ordinati per data"
        />
        {nextItems.length === 0 ? (
          <EmptyState
            title="Nessun promemoria futuro"
            text="Aggiungi una ricorrenza per iniziare a pianificare."
            actionLabel="Nuovo promemoria"
            onAction={onCreate}
          />
        ) : (
          <div className="card-stack">
            {nextItems.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                compact
                onComplete={() => onComplete(reminder)}
                onOpen={() => onOpenDetail(reminder.id)}
              />
            ))}
          </div>
        )}
      </section>

      {recentCompletions.length > 0 && (
        <section className="panel recent-panel">
          <SectionTitle
            icon={<History size={22} />}
            title="Recenti"
            subtitle="Ultime chiusure"
          />
          <div className="history-list">
            {recentCompletions.map((completion) => (
              <HistoryItem key={completion.id} completion={completion} />
            ))}
          </div>
        </section>
      )}
    </section>
  );
}

function ReminderList({
  reminders,
  categories,
  search,
  statusFilter,
  priorityFilter,
  categoryFilter,
  onSearchChange,
  onStatusFilterChange,
  onPriorityFilterChange,
  onCategoryFilterChange,
  onComplete,
  onOpenDetail,
}: {
  reminders: Reminder[];
  categories: string[];
  search: string;
  statusFilter: StatusFilter;
  priorityFilter: PriorityFilter;
  categoryFilter: string;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  onPriorityFilterChange: (value: PriorityFilter) => void;
  onCategoryFilterChange: (value: string) => void;
  onComplete: (reminder: Reminder) => void;
  onOpenDetail: (id: string) => void;
}) {
  return (
    <section className="panel list-panel">
      <SectionTitle
        icon={<ListChecks size={22} />}
        title="Tutti i promemoria"
        subtitle="Cerca, filtra, apri"
      />

      <div className="filters">
        <label className="search-field">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Cerca per titolo, categoria o note"
          />
        </label>
        <select
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value as StatusFilter)}
          aria-label="Filtro stato"
        >
          <option value="all">Tutti gli stati</option>
          <option value="overdue">Arretrati</option>
          <option value="today">Oggi</option>
          <option value="upcoming">In arrivo</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(event) =>
            onPriorityFilterChange(event.target.value as PriorityFilter)
          }
          aria-label="Filtro priorità"
        >
          <option value="all">Tutte le priorità</option>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Bassa</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(event) => onCategoryFilterChange(event.target.value)}
          aria-label="Filtro categoria"
        >
          <option value="all">Tutte le categorie</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {reminders.length === 0 ? (
        <p className="muted-copy">Nessun promemoria corrisponde ai filtri attuali.</p>
      ) : (
        <div className="card-stack">
          {reminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              compact={false}
              onComplete={() => onComplete(reminder)}
              onOpen={() => onOpenDetail(reminder.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ReminderDetail({
  reminder,
  completions,
  onBack,
  onComplete,
  onEdit,
  onDelete,
}: {
  reminder: Reminder;
  completions: CompletionRecord[];
  onBack: () => void;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const status = getReminderStatus(reminder.nextDueDate);

  return (
    <section className="detail-layout">
      <button className="ghost-action back-action" onClick={onBack}>
        <ChevronLeft size={18} />
        Torna all'elenco
      </button>

      <div className={`panel detail-hero ${status}`}>
        <div>
          <StatusBadge status={status} />
          <h2>{reminder.title}</h2>
          {reminder.description && <p>{reminder.description}</p>}
        </div>
        <div className="detail-actions">
          <button className="success-action" onClick={onComplete}>
            <Check size={18} />
            Completa
          </button>
          <button className="secondary-action" onClick={onEdit}>
            <Edit3 size={18} />
            Modifica
          </button>
          <button className="danger-action" onClick={onDelete}>
            <Trash2 size={18} />
            Elimina
          </button>
        </div>
      </div>

      <div className="detail-grid">
        <section className="panel">
          <SectionTitle
            icon={<Repeat2 size={22} />}
            title="Dettagli"
            subtitle="Ricorrenza attiva"
          />
          <dl className="meta-list">
            <div>
              <dt>Prossima scadenza</dt>
              <dd>{formatDate(reminder.nextDueDate)}</dd>
            </div>
            <div>
              <dt>Frequenza</dt>
              <dd>
                Ogni {reminder.frequency.interval}{" "}
                {unitLabels[reminder.frequency.unit]}
              </dd>
            </div>
            <div>
              <dt>Priorità</dt>
              <dd>{priorityLabels[reminder.priority]}</dd>
            </div>
            <div>
              <dt>Categoria</dt>
              <dd>{reminder.category || "Nessuna"}</dd>
            </div>
            <div>
              <dt>Ultimo completamento</dt>
              <dd>
                {reminder.lastCompletedAt
                  ? new Intl.DateTimeFormat("it-IT", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(reminder.lastCompletedAt))
                  : "Non ancora completato"}
              </dd>
            </div>
          </dl>
          {reminder.notes && (
            <div className="notes-box">
              <h3>Note</h3>
              <p>{reminder.notes}</p>
            </div>
          )}
        </section>

        <section className="panel">
          <SectionTitle
            icon={<History size={22} />}
            title="Cronologia"
            subtitle="Occorrenze completate"
          />
          {completions.length === 0 ? (
            <p className="muted-copy">Nessun completamento registrato.</p>
          ) : (
            <div className="history-list">
              {completions.map((completion) => (
                <HistoryItem key={completion.id} completion={completion} />
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

function ReminderCard({
  reminder,
  compact,
  onComplete,
  onOpen,
}: {
  reminder: Reminder;
  compact: boolean;
  onComplete: () => void;
  onOpen: () => void;
}) {
  const status = getReminderStatus(reminder.nextDueDate);

  return (
    <article className={`reminder-card ${status}`}>
      <div className="card-status-icon" aria-hidden="true">
        <StatusIcon status={status} />
      </div>
      <button className="card-main" onClick={onOpen}>
        <div className="card-topline">
          <StatusBadge status={status} />
          <span className={`priority-dot ${reminder.priority}`}>
            {priorityLabels[reminder.priority]}
          </span>
        </div>
        <h3>{reminder.title}</h3>
        {!compact && reminder.description && <p>{reminder.description}</p>}
        <div className="card-meta">
          <span>Scade {formatDate(reminder.nextDueDate)}</span>
          <span>
            Ogni {reminder.frequency.interval} {unitLabels[reminder.frequency.unit]}
          </span>
          {reminder.category && <span>{reminder.category}</span>}
        </div>
      </button>
      <button className="complete-action" onClick={onComplete}>
        <Check size={18} />
        Fatto
      </button>
    </article>
  );
}

function ReminderForm({
  mode,
  reminder,
  onClose,
  onSave,
}: {
  mode: "create" | "edit";
  reminder?: Reminder;
  onClose: () => void;
  onSave: (input: ReminderInput) => void;
}) {
  const [input, setInput] = useState<ReminderInput>(() =>
    reminder
      ? {
          title: reminder.title,
          description: reminder.description ?? "",
          category: reminder.category ?? "",
          startDate: reminder.nextDueDate,
          frequency: reminder.frequency,
          priority: reminder.priority,
          notes: reminder.notes ?? "",
        }
      : getDefaultInput(),
  );

  const canSave = input.title.trim().length > 0 && input.startDate.length > 0;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) return;
    onSave(input);
  }

  return (
    <div className="modal-backdrop">
      <form
        className="modal-panel"
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reminder-form-title"
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">{mode === "create" ? "Nuova ricorrenza" : "Modifica"}</p>
            <h2 id="reminder-form-title">
              {mode === "create" ? "Aggiungi promemoria" : "Aggiorna promemoria"}
            </h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Chiudi">
            x
          </button>
        </div>

        <div className="form-grid">
          <label>
            Titolo
            <input
              value={input.title}
              onChange={(event) => setInput({ ...input, title: event.target.value })}
              placeholder="Es. Cambiare filtro acqua"
              autoFocus
              required
            />
          </label>

          <label>
            Categoria
            <input
              value={input.category}
              onChange={(event) =>
                setInput({ ...input, category: event.target.value })
              }
              placeholder="Casa, salute, auto..."
            />
          </label>

          <label className="full-width">
            Descrizione
            <textarea
              value={input.description}
              onChange={(event) =>
                setInput({ ...input, description: event.target.value })
              }
              placeholder="Dettagli rapidi da vedere nella dashboard"
              rows={3}
            />
          </label>

          <label>
            {mode === "create" ? "Data iniziale" : "Prossima scadenza"}
            <input
              type="date"
              value={input.startDate}
              onChange={(event) =>
                setInput({ ...input, startDate: event.target.value })
              }
              required
            />
          </label>

          <label>
            Priorità
            <select
              value={input.priority}
              onChange={(event) =>
                setInput({ ...input, priority: event.target.value as Priority })
              }
            >
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Bassa</option>
            </select>
          </label>

          <div className="recurrence-row full-width">
            <label>
              Ogni
              <input
                type="number"
                min={1}
                step={1}
                value={input.frequency.interval}
                onChange={(event) =>
                  setInput({
                    ...input,
                    frequency: {
                      ...input.frequency,
                      interval: Number(event.target.value),
                    },
                  })
                }
              />
            </label>
            <label>
              Unità
              <select
                value={input.frequency.unit}
                onChange={(event) =>
                  setInput({
                    ...input,
                    frequency: {
                      ...input.frequency,
                      unit: event.target.value as FrequencyUnit,
                    },
                  })
                }
              >
                <option value="days">Giorni</option>
                <option value="weeks">Settimane</option>
                <option value="months">Mesi</option>
              </select>
            </label>
          </div>

          <label className="full-width">
            Note
            <textarea
              value={input.notes}
              onChange={(event) => setInput({ ...input, notes: event.target.value })}
              placeholder="Informazioni utili per il dettaglio"
              rows={4}
            />
          </label>
        </div>

        <div className="modal-actions">
          <button type="button" className="secondary-action" onClick={onClose}>
            Annulla
          </button>
          <button type="submit" className="primary-action" disabled={!canSave}>
            Salva promemoria
          </button>
        </div>
      </form>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: "danger" | "warning" | "calm";
  icon: ReactNode;
}) {
  return (
    <article className={`stat-card ${tone}`}>
      <div className="stat-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: ReminderStatus }) {
  return <span className={`status-badge ${status}`}>{statusLabels[status]}</span>;
}

function StatusIcon({ status }: { status: ReminderStatus }) {
  if (status === "overdue") return <AlertCircle size={24} />;
  if (status === "today") return <CalendarDays size={24} />;
  return <Clock3 size={24} />;
}

function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="section-title">
      <div className="section-heading">
        <span>{icon}</span>
        <h2>{title}</h2>
      </div>
      <p>{subtitle}</p>
    </div>
  );
}

function EmptyState({
  title,
  text,
  actionLabel,
  onAction,
}: {
  title: string;
  text: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{text}</p>
      <button className="secondary-action" onClick={onAction}>
        <Plus size={17} />
        {actionLabel}
      </button>
    </div>
  );
}

function HistoryItem({ completion }: { completion: CompletionRecord }) {
  return (
    <article className="history-item">
      <span className="history-icon">
        <Check size={16} />
      </span>
      <div>
        <h3>{completion.reminderTitle}</h3>
        <p>
          Scadenza {formatDate(completion.dueDate)}
          {completion.wasOverdue ? " completata in arretrato" : " completata"}
        </p>
      </div>
      <time>
        {new Intl.DateTimeFormat("it-IT", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(completion.completedAt))}
      </time>
    </article>
  );
}

function priorityWeight(priority: Priority): number {
  return {
    high: 3,
    medium: 2,
    low: 1,
  }[priority];
}

export default App;
