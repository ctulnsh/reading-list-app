import { useState, useEffect } from "react";
import { BookOpen, Plus, X, Check, Trash2 } from "lucide-react";

type Status = "want" | "reading" | "finished";

interface Book {
  id: string;
  title: string;
  status: Status;
}

const STATUS_META: Record<Status, { label: string; dot: string; badge: string }> = {
  want: {
    label: "Want to Read",
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  reading: {
    label: "Reading",
    dot: "bg-sky-500",
    badge: "bg-sky-50 text-sky-700 ring-sky-200",
  },
  finished: {
    label: "Finished",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
};

const STATUS_ORDER: Status[] = ["want", "reading", "finished"];
const STORAGE_KEY = "reading-list-books";

type Filter = "all" | Status;

function loadBooks(): Book[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<Status>("want");
  const [filter, setFilter] = useState<Filter>("all");
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBooks(loadBooks());
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    const close = () => setMenuOpenFor(null);
    if (menuOpenFor) {
      window.addEventListener("click", close);
      return () => window.removeEventListener("click", close);
    }
  }, [menuOpenFor]);

  const addBook = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    if (trimmed.length > 60) {
      setError("Book title must be 60 characters or fewer.");
      return;
    }
    const normalized = trimmed.toLowerCase().replace(/\s+/g, " ");
    if (books.some((b) => b.title.toLowerCase().replace(/\s+/g, " ") === normalized)) {
      setError("This book is already in your reading list.");
      return;
    }
    setBooks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), title: trimmed, status },
    ]);
    setTitle("");
    setStatus("want");
    setError(null);
  };

  const changeStatus = (id: string, newStatus: Status) => {
    setBooks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
    );
    setMenuOpenFor(null);
  };

  const removeBook = (id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
  };

  const visible = filter === "all" ? books : books.filter((b) => b.status === filter);

  const counts = STATUS_ORDER.reduce(
    (acc, s) => {
      acc[s] = books.filter((b) => b.status === s).length;
      return acc;
    },
    {} as Record<Status, number>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <BookOpen size={22} strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Reading List
              </h1>
              <p className="text-sm text-slate-500">
                Keep track of the books you read, one page at a time.
              </p>
            </div>
          </div>
        </header>

        {/* Add book form */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="mb-3 text-sm font-medium text-slate-700">Add a book</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && addBook()}
              placeholder="Book title"
              maxLength={60}
              className={`flex-1 rounded-xl border bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:bg-white focus:ring-4 ${
                error
                  ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                  : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"
              }`}
            />
            <div className="flex gap-2">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
              >
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].label}
                  </option>
                ))}
              </select>
              <button
                onClick={addBook}
                disabled={!title.trim()}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={16} />
                Add
              </button>
            </div>
          </div>
          {error && (
            <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
          )}
        </section>

        {/* Summary */}
        <section className="mb-6 grid grid-cols-3 gap-3">
          <SummaryCard label="Total Books" value={books.length} />
          <SummaryCard label="Currently Reading" value={counts.reading} />
          <SummaryCard label="Finished" value={counts.finished} />
        </section>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <FilterChip
            active={filter === "all"}
            onClick={() => setFilter("all")}
            label="All"
            count={books.length}
          />
          {STATUS_ORDER.map((s) => (
            <FilterChip
              key={s}
              active={filter === s}
              onClick={() => setFilter(s)}
              label={STATUS_META[s].label}
              count={counts[s]}
            />
          ))}
        </div>

        {/* List */}
        {visible.length === 0 ? (
          <EmptyState hasBooks={books.length > 0} filter={filter} />
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {visible.map((book) => (
              <li
                key={book.id}
                className="group relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-medium text-slate-900">
                      {book.title}
                    </h3>
                    <span
                      className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_META[book.status].badge}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${STATUS_META[book.status].dot}`}
                      />
                      {STATUS_META[book.status].label}
                    </span>
                  </div>

                  <div className="relative flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenFor(menuOpenFor === book.id ? null : book.id);
                      }}
                      className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                      Change
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeBook(book.id);
                      }}
                      aria-label={`Delete ${book.title}`}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                    {menuOpenFor === book.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-full z-10 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                      >
                        {STATUS_ORDER.map((s) => (
                          <button
                            key={s}
                            onClick={() => changeStatus(book.id, s)}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${STATUS_META[s].dot}`}
                            />
                            {STATUS_META[s].label}
                            {book.status === s && (
                              <Check size={14} className="ml-auto text-slate-400" />
                            )}
                          </button>
                        ))}
                        <div className="my-1 border-t border-slate-100" />
                        <button
                          onClick={() => removeBook(book.id)}
                          className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
                        >
                          <X size={14} />
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-slate-900 text-white shadow-sm"
          : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
      }`}
    >
      {label}
      <span
        className={`rounded-full px-1.5 text-xs ${
          active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-2xl font-semibold tracking-tight text-slate-900">
        {value}
      </div>
      <div className="mt-0.5 text-xs font-medium text-slate-500">{label}</div>
    </div>
  );
}

function EmptyState({ hasBooks, filter }: { hasBooks: boolean; filter: Filter }) {
  const filtered = hasBooks && filter !== "all";
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <BookOpen size={26} />
      </div>
      <p className="text-base font-medium text-slate-700">
        {filtered
          ? "No books in this category."
          : "Your reading list is empty. Add your first book."}
      </p>
      {!filtered && (
        <p className="mt-1 text-sm text-slate-400">
          Use the form above to get started.
        </p>
      )}
    </div>
  );
}
