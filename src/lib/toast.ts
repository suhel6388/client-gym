/**
 * Global toast store.
 *
 * The store lives outside React so any module (event handlers, API helpers,
 * non-component code) can raise a toast. Components subscribe through
 * `useToast()` / `useSyncExternalStore`.
 *
 * Design notes:
 * - IDs are stable strings, so a loading toast can be updated in place.
 * - A small visible window keeps the stack readable; the rest wait in a queue
 *   and are promoted as earlier toasts leave.
 * - Timers belong to the toast item, not the store. Unmounting a toast (route
 *   change, provider teardown) clears its timer automatically.
 * - Repeated errors/warnings/offline notices are de-duplicated by content
 *   unless an explicit `dedupeKey` is supplied.
 */

import type { LucideIcon } from "lucide-react";

export type ToastVariant =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "loading"
  | "offline"
  | "subscription";

export type ToastAction = {
  label: string;
  /** Runs before the toast is dismissed. May be async. */
  onClick: (id: string) => void | Promise<void>;
  /** Keep the toast visible after the action runs. Defaults to false. */
  keepOpen?: boolean;
  /** Optional accessible label when the visible label is terse. */
  ariaLabel?: string;
};

export type ToastOptions = {
  /** Explicit ID. Mostly useful for de-duplicating from outside the store. */
  id?: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Auto-dismiss delay in ms. `0` keeps the toast until dismissed. */
  duration?: number;
  /** Shorthand for `duration: 0`. */
  persistent?: boolean;
  action?: ToastAction;
  /** Set to false to remove the close button. Defaults to true. */
  dismissible?: boolean;
  /**
   * Repeated toasts with the same key refresh the existing toast instead of
   * stacking a duplicate. Pass `null` to opt out of automatic de-duplication.
   */
  dedupeKey?: string | null;
  /** Override the default status icon. */
  icon?: LucideIcon;
  /** Show the remaining-time progress bar. Defaults to true when timed. */
  showProgress?: boolean;
  /** Called when the toast is dismissed (manual or automatic). */
  onDismiss?: () => void;
  /** Called only when the auto-dismiss timer elapses. */
  onAutoClose?: () => void;
};

export type ToastUpdate = Partial<Omit<ToastOptions, "id">> & {
  id: string;
};

export type ToastRecord = {
  id: string;
  title: string;
  description: string;
  variant: ToastVariant;
  duration: number;
  createdAt: number;
  /** Bumped whenever the toast content changes; used to restart animations. */
  revision: number;
  action?: ToastAction;
  dismissible: boolean;
  dedupeKey: string | null;
  icon?: LucideIcon;
  showProgress: boolean;
  dismissing: boolean;
  onDismiss?: () => void;
  onAutoClose?: () => void;
};

export type ToastState = {
  visible: ToastRecord[];
  queue: ToastRecord[];
};

export type ToastContent =
  | string
  | {
      title: string;
      description?: string;
      action?: ToastAction;
      duration?: number;
      showProgress?: boolean;
      dismissible?: boolean;
    };

export type ToastPromiseMessages<T> = {
  loading: ToastContent;
  success: ToastContent | ((value: T) => ToastContent);
  error: ToastContent | ((error: unknown) => ToastContent);
};

export type ToastPromiseOptions = {
  /** Keep the error toast open until dismissed. Defaults to false. */
  errorPersistent?: boolean;
};

type ToastHelperOptions = Omit<
  ToastOptions,
  "title" | "description" | "variant"
>;

type ToastHelper = (
  title: string,
  descriptionOrOptions?: string | ToastHelperOptions,
  options?: ToastHelperOptions,
) => string;

export type ToastApi = {
  (options: ToastOptions): string;
  /** Self-reference so `const { toast } = useToast()` keeps working. */
  toast: ToastApi;
  success: ToastHelper;
  error: ToastHelper;
  warning: ToastHelper;
  info: ToastHelper;
  loading: ToastHelper;
  offline: ToastHelper;
  subscription: ToastHelper;
  update: (id: string | number, update: Omit<ToastUpdate, "id">) => string | null;
  dismiss: (id?: string | number) => void;
  clear: () => void;
  promise: <T>(
    promise: Promise<T> | (() => Promise<T>),
    messages: ToastPromiseMessages<T>,
    options?: ToastPromiseOptions,
  ) => Promise<T>;
};

const DEFAULT_DURATIONS: Record<ToastVariant, number> = {
  success: 3600,
  error: 6500,
  warning: 5500,
  info: 4000,
  loading: 0,
  offline: 0,
  subscription: 6000,
};

/** How many toasts fit on screen before the queue starts. */
export const MAX_VISIBLE_TOASTS = 4;

/** Keep in sync with the exit animation in globals.css. */
export const TOAST_EXIT_MS = 180;

const EMPTY_STATE: ToastState = Object.freeze({
  visible: Object.freeze([]) as unknown as ToastRecord[],
  queue: Object.freeze([]) as unknown as ToastRecord[],
});

let visible: ToastRecord[] = [];
let queue: ToastRecord[] = [];
let snapshot: ToastState = EMPTY_STATE;
let idCounter = 0;

const listeners = new Set<() => void>();
const removalTimers = new Map<string, ReturnType<typeof setTimeout>>();

function emit(): void {
  snapshot = { visible: [...visible], queue: [...queue] };
  listeners.forEach((listener) => listener());
}

function makeId(): string {
  idCounter += 1;
  return `toast-${Date.now().toString(36)}-${idCounter.toString(36)}`;
}

function normalizeDuration(
  variant: ToastVariant,
  options: Pick<ToastOptions, "duration" | "persistent">,
  fallback: number,
): number {
  if (options.persistent) return 0;
  if (options.duration === undefined) return fallback;
  if (!Number.isFinite(options.duration) || options.duration <= 0) return 0;
  return options.duration;
}

function automaticDedupeKey(
  variant: ToastVariant,
  title: string,
  description: string,
): string | null {
  // Operational errors repeat constantly (failed refresh, retry, etc.).
  // Warnings and offline notices benefit from the same treatment.
  if (variant !== "error" && variant !== "warning" && variant !== "offline") {
    return null;
  }
  return `${variant}|${title.trim().toLowerCase()}|${description
    .trim()
    .toLowerCase()}`;
}

function findToast(id: string): { record: ToastRecord; queued: boolean } | null {
  const inVisible = visible.find((item) => item.id === id);
  if (inVisible) return { record: inVisible, queued: false };
  const inQueue = queue.find((item) => item.id === id);
  if (inQueue) return { record: inQueue, queued: true };
  return null;
}

function resolveContent(content: ToastContent): {
  title: string;
  description?: string;
  action?: ToastAction;
  duration?: number;
  showProgress?: boolean;
  dismissible?: boolean;
} {
  // A plain string is a complete message, so it must not inherit the loading
  // toast's description (which describes work that has already finished).
  return typeof content === "string"
    ? { title: content, description: "" }
    : content;
}

function createToast(options: ToastOptions): string {
  const variant = options.variant ?? "info";
  const description = options.description ?? "";
  const dedupeKey =
    options.dedupeKey === null
      ? null
      : (options.dedupeKey ??
        automaticDedupeKey(variant, options.title, description));

  if (dedupeKey) {
    const existing = [...visible, ...queue].find(
      (item) => item.dedupeKey === dedupeKey && !item.dismissing,
    );
    if (existing) {
      const next: ToastRecord = {
        ...existing,
        title: options.title,
        description,
        variant,
        duration: normalizeDuration(
          variant,
          options,
          DEFAULT_DURATIONS[variant],
        ),
        createdAt: Date.now(),
        revision: existing.revision + 1,
        action: options.action ?? existing.action,
        dismissible: options.dismissible ?? true,
        icon: options.icon ?? existing.icon,
        showProgress:
          options.showProgress ??
          (normalizeDuration(variant, options, DEFAULT_DURATIONS[variant]) > 0),
        dismissing: false,
        onDismiss: options.onDismiss ?? existing.onDismiss,
        onAutoClose: options.onAutoClose ?? existing.onAutoClose,
      };
      if (visible.some((item) => item.id === existing.id)) {
        visible = visible.map((item) =>
          item.id === existing.id ? next : item,
        );
      } else {
        queue = queue.map((item) => (item.id === existing.id ? next : item));
      }
      emit();
      return existing.id;
    }
  }

  if (options.id) {
    const existing = findToast(options.id);
    if (existing) {
      updateToast(options.id, options);
      return options.id;
    }
  }

  const id = options.id ?? makeId();
  const duration = normalizeDuration(variant, options, DEFAULT_DURATIONS[variant]);
  const record: ToastRecord = {
    id,
    title: options.title,
    description,
    variant,
    duration,
    createdAt: Date.now(),
    revision: 0,
    action: options.action,
    dismissible: options.dismissible ?? true,
    dedupeKey,
    icon: options.icon,
    showProgress:
      options.showProgress ?? (duration > 0 || variant === "loading"),
    dismissing: false,
    onDismiss: options.onDismiss,
    onAutoClose: options.onAutoClose,
  };

  if (visible.length < MAX_VISIBLE_TOASTS) {
    // Newest first: the most recent notification is the easiest to notice.
    visible = [record, ...visible];
  } else {
    queue = [...queue, record];
  }
  emit();
  return id;
}

function removeToast(id: string): void {
  const timer = removalTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    removalTimers.delete(id);
  }

  const record = visible.find((item) => item.id === id);
  if (!record) {
    // Queued toasts can be dismissed before they are ever shown.
    if (queue.some((item) => item.id === id)) {
      queue = queue.filter((item) => item.id !== id);
      emit();
    }
    return;
  }

  visible = visible.filter((item) => item.id !== id);

  if (record.onDismiss) {
    try {
      record.onDismiss();
    } catch {
      // Consumer callbacks must never break the notification pipeline.
    }
  }

  // Fill the freed slot from the queue. Promoted toasts start their timer
  // when their item mounts, so they are not silently consumed while waiting.
  if (queue.length > 0) {
    const [next, ...rest] = queue;
    queue = rest;
    visible = [...visible, next];
  }

  emit();
}

function dismissToast(id: string): void {
  const found = findToast(id);
  if (!found) return;

  if (found.queued) {
    queue = queue.filter((item) => item.id !== id);
    if (found.record.onDismiss) {
      try {
        found.record.onDismiss();
      } catch {
        // Ignore consumer callback failures.
      }
    }
    emit();
    return;
  }

  if (found.record.dismissing) return;

  visible = visible.map((item) =>
    item.id === id ? { ...item, dismissing: true } : item,
  );
  emit();

  // Safety net: if the item never mounts (or an animation is interrupted),
  // remove it anyway so the store cannot leak.
  const timer = setTimeout(() => {
    removalTimers.delete(id);
    removeToast(id);
  }, TOAST_EXIT_MS + 400);
  removalTimers.set(id, timer);
}

function expireToast(id: string): void {
  const record = visible.find((item) => item.id === id);
  if (!record || record.dismissing) return;
  if (record.onAutoClose) {
    try {
      record.onAutoClose();
    } catch {
      // Ignore consumer callback failures.
    }
  }
  dismissToast(id);
}

function updateToast(
  id: string,
  update: Omit<ToastUpdate, "id">,
): string | null {
  const found = findToast(id);
  if (!found || found.record.dismissing) return null;

  const existing = found.record;
  const variant = update.variant ?? existing.variant;
  const variantChanged = variant !== existing.variant;

  let duration = existing.duration;
  if (update.persistent) {
    duration = 0;
  } else if (update.duration !== undefined) {
    duration = normalizeDuration(variant, update, existing.duration);
  } else if (variantChanged) {
    // loading -> success/error must adopt the new variant's lifetime.
    duration = DEFAULT_DURATIONS[variant];
  }

  const next: ToastRecord = {
    ...existing,
    title: update.title ?? existing.title,
    description:
      update.description !== undefined
        ? update.description
        : existing.description,
    variant,
    duration,
    createdAt: Date.now(),
    revision: existing.revision + 1,
    // `"action" in update` lets promise transitions explicitly clear a
    // loading toast's action (for example, its "Cancel" button).
    action: "action" in update ? update.action : existing.action,
    dismissible: update.dismissible ?? existing.dismissible,
    icon: update.icon ?? existing.icon,
    showProgress:
      update.showProgress ??
      (duration > 0 || variant === "loading"),
    onDismiss: update.onDismiss ?? existing.onDismiss,
    onAutoClose: update.onAutoClose ?? existing.onAutoClose,
  };

  if (found.queued) {
    queue = queue.map((item) => (item.id === id ? next : item));
  } else {
    visible = visible.map((item) => (item.id === id ? next : item));
  }
  emit();
  return id;
}

function helper(
  variant: ToastVariant,
  title: string,
  descriptionOrOptions?: string | ToastHelperOptions,
  options?: ToastHelperOptions,
): string {
  const merged: ToastOptions =
    typeof descriptionOrOptions === "string"
      ? { ...options, title, description: descriptionOrOptions, variant }
      : { ...descriptionOrOptions, ...options, title, variant };
  return createToast(merged);
}

const api = ((options: ToastOptions) => createToast(options)) as ToastApi;

api.toast = api;
api.success = (title, descriptionOrOptions, options) =>
  helper("success", title, descriptionOrOptions, options);
api.error = (title, descriptionOrOptions, options) =>
  helper("error", title, descriptionOrOptions, options);
api.warning = (title, descriptionOrOptions, options) =>
  helper("warning", title, descriptionOrOptions, options);
api.info = (title, descriptionOrOptions, options) =>
  helper("info", title, descriptionOrOptions, options);
api.loading = (title, descriptionOrOptions, options) =>
  helper("loading", title, descriptionOrOptions, options);
api.offline = (title, descriptionOrOptions, options) =>
  helper("offline", title, descriptionOrOptions, options);
api.subscription = (title, descriptionOrOptions, options) =>
  helper("subscription", title, descriptionOrOptions, options);

api.update = (id, update) => updateToast(String(id), update);

api.dismiss = (id) => {
  if (id === undefined) {
    // Dismiss the whole stack, including anything waiting in the queue.
    queue = [];
    visible.forEach((item) => dismissToast(item.id));
    emit();
    return;
  }
  dismissToast(String(id));
};

api.clear = () => {
  removalTimers.forEach((timer) => clearTimeout(timer));
  removalTimers.clear();
  visible = [];
  queue = [];
  emit();
};

api.promise = async <T,>(
  input: Promise<T> | (() => Promise<T>),
  messages: ToastPromiseMessages<T>,
  options?: ToastPromiseOptions,
): Promise<T> => {
  const pending = typeof input === "function" ? input() : input;
  const loadingContent = resolveContent(messages.loading);
  const id = createToast({
    ...loadingContent,
    variant: "loading",
    persistent: true,
    dismissible: true,
  });

  try {
    const value = await pending;
    const successContent = resolveContent(
      typeof messages.success === "function"
        ? messages.success(value)
        : messages.success,
    );
    updateToast(id, {
      ...successContent,
      variant: "success",
      persistent: false,
      action: successContent.action,
      dismissible: successContent.dismissible ?? true,
    });
    return value;
  } catch (error) {
    const errorContent = resolveContent(
      typeof messages.error === "function"
        ? messages.error(error)
        : messages.error,
    );
    updateToast(id, {
      ...errorContent,
      variant: "error",
      persistent: options?.errorPersistent ?? false,
      action: errorContent.action,
      dismissible: errorContent.dismissible ?? true,
    });
    throw error;
  }
};

/** Subscribe to store changes (for `useSyncExternalStore`). */
export function subscribeToToasts(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Current store snapshot. Stable between mutations. */
export function getToastSnapshot(): ToastState {
  return snapshot;
}

/** Server/hydration snapshot — always empty, and always the same object. */
export function getServerToastSnapshot(): ToastState {
  return EMPTY_STATE;
}

/** Called by toast items once their exit animation finishes. */
export function finalizeToastDismiss(id: string): void {
  removeToast(id);
}

/** Called by toast items when their auto-dismiss timer elapses. */
export function autoDismissToast(id: string): void {
  expireToast(id);
}

/** The single global toast API. Prefer `useToast()` inside components. */
export const toast: ToastApi = api;
