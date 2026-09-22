"use client";

import * as React from "react";

import { formatPrice, tableDisplayName } from "@/lib/i18n/format";
import { useTranslation } from "@/lib/i18n/provider";
import { useRestaurant } from "@/lib/restaurants/provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const SOUND_KEY = "menuqr-order-sound";

/** What the notification card and the system notification both need to say. */
export interface OrderArrival {
  id: string;
  orderNumber: number | null;
  tableName: string | null;
  total: number;
  currency: string;
  /** "2× Pizza, 1× Café" — the order itself, the way a chat shows the message. */
  preview: string;
  /** Local key, so re-announcing the same order twice cannot collide. */
  key: number;
}

type PushPermission = "unsupported" | "default" | "granted" | "denied";

interface OrderAlerts {
  /** Today's orders nobody has confirmed yet — the count on the bell. */
  pending: number;
  /** Re-read now, e.g. right after this screen changed an order's status. */
  refresh: () => void;
  /** Arrivals still on screen, newest first. */
  arrivals: OrderArrival[];
  dismiss: (key: number) => void;
  dismissAll: () => void;
  soundOn: boolean;
  setSoundOn: (value: boolean) => void;
  /** Whether this browser will show a notification outside the tab. */
  pushPermission: PushPermission;
  requestPush: () => void;
  /** Bumped whenever an order arrives or changes, so a list can refetch. */
  revision: number;
}

const Ctx = React.createContext<OrderAlerts | null>(null);

/**
 * One listener for the whole dashboard.
 *
 * A waiter is rarely sitting on the orders screen — they are editing a price,
 * printing a QR card, or have the tab in the background. An order that only
 * announces itself on one page is an order nobody sees, so this lives in the
 * layout: the card, the chime and the count follow you across every page.
 *
 * It also means one subscription rather than one per screen, and one place
 * that decides what counts as "new".
 */
export function OrderAlertsProvider({ children }: { children: React.ReactNode }) {
  const { restaurant } = useRestaurant();
  const { t, locale } = useTranslation();

  const [pending, setPending] = React.useState(0);
  const [revision, setRevision] = React.useState(0);
  const [soundOn, setSoundOnState] = React.useState(false);
  const [arrivals, setArrivals] = React.useState<OrderArrival[]>([]);
  const [pushPermission, setPushPermission] = React.useState<PushPermission>("unsupported");

  const audioRef = React.useRef<AudioContext | null>(null);
  const knownIds = React.useRef<Set<string> | null>(null);
  const lastSignature = React.useRef<string | null>(null);
  const sweepNow = React.useRef<(() => void) | null>(null);
  const keyRef = React.useRef(0);
  const workerRef = React.useRef<ServiceWorkerRegistration | null>(null);

  // Chrome on Android only shows a notification through a service worker, so
  // one is registered for the dashboard alone. It has no fetch handler: it
  // never caches, so it can never serve a stale page after a deploy.
  React.useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/dashboard" })
      .then((registration) => {
        workerRef.current = registration;
      })
      .catch(() => {
        // Without it the page-level Notification still works on desktop.
      });
  }, []);

  // The waiter's choice should survive a reload; a screen propped on a counter
  // gets refreshed all day.
  React.useEffect(() => {
    try {
      setSoundOnState(window.localStorage.getItem(SOUND_KEY) === "on");
    } catch {
      // A browser refusing storage is not a reason to lose the feature.
    }
    if (typeof Notification !== "undefined") {
      setPushPermission(Notification.permission as PushPermission);
    }
  }, []);

  const setSoundOn = React.useCallback((value: boolean) => {
    setSoundOnState(value);
    try {
      window.localStorage.setItem(SOUND_KEY, value ? "on" : "off");
    } catch {
      // as above
    }
  }, []);

  // Asking has to be tied to a click: every browser refuses the prompt
  // otherwise, and a silent refusal is worse than no button.
  const requestPush = React.useCallback(() => {
    if (typeof Notification === "undefined") return;
    void Notification.requestPermission().then((result) => {
      setPushPermission(result as PushPermission);
    });
  }, []);

  const soundRef = React.useRef(soundOn);
  soundRef.current = soundOn;

  // Synthesised rather than fetched: no asset to ship and nothing to 404 on a
  // weak connection in a basement café.
  const chime = React.useCallback(() => {
    if (!soundRef.current) return;
    try {
      const context = audioRef.current ?? new AudioContext();
      audioRef.current = context;
      // A tab left alone long enough has its audio context suspended; without
      // this the chime is silent exactly when it matters most.
      if (context.state === "suspended") void context.resume();
      const now = context.currentTime;
      [880, 1320].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.frequency.value = frequency;
        oscillator.connect(gain);
        gain.connect(context.destination);
        gain.gain.setValueAtTime(0.0001, now + index * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.25, now + index * 0.18 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.18 + 0.16);
        oscillator.start(now + index * 0.18);
        oscillator.stop(now + index * 0.18 + 0.18);
      });
    } catch {
      // A browser that refuses an audio context still gets the card.
    }
  }, []);

  const restaurantName = restaurant.name;

  // The system notification is the half that works when the tab is behind a
  // browser window or the phone is on another app — the in-app card cannot be
  // seen then, which is exactly when an order gets missed. While the page has
  // focus the card is already in front of the waiter, so it is not doubled.
  const systemNotify = React.useCallback(
    (arrival: OrderArrival, more: number) => {
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
      if (document.visibilityState === "visible" && document.hasFocus()) return;

      const table = arrival.tableName ? tableDisplayName(arrival.tableName, t.menu.tableLabel) : t.orders.noTable;
      const title = [
        arrival.orderNumber != null ? `${t.orders.newOrder} #${arrival.orderNumber}` : t.orders.newOrder,
        table,
      ].join(" · ");
      const summary = [formatPrice(arrival.total, arrival.currency, locale), restaurantName];
      if (more > 0) summary.push(`+${more}`);
      const options = {
        body: [arrival.preview, summary.join(" · ")].filter(Boolean).join("\n"),
        // One tag, so ten orders in a rush replace each other in the tray
        // instead of burying the screen — and renotify so each one still buzzes.
        tag: "menuqr-order",
        renotify: true,
        icon: "/icon",
        data: { url: "/dashboard/orders" },
      } as NotificationOptions;

      const viaPage = () => {
        try {
          const notification = new Notification(title, options);
          notification.onclick = () => {
            window.focus();
            window.location.href = "/dashboard/orders";
            notification.close();
          };
        } catch {
          // Safari on iOS has no Notification outside an installed web app.
          // The card and the chime still do their job.
        }
      };

      const worker = workerRef.current;
      if (worker) void worker.showNotification(title, options).catch(viaPage);
      else viaPage();
    },
    [t.orders.newOrder, t.orders.noTable, t.menu.tableLabel, locale, restaurantName]
  );

  const announce = React.useCallback(
    (incoming: Omit<OrderArrival, "key">[]) => {
      if (incoming.length === 0) return;
      setRevision((value) => value + 1);
      chime();

      const stamped = incoming.map((arrival) => {
        keyRef.current += 1;
        return { ...arrival, key: keyRef.current };
      });

      // `incoming` arrives newest first and stays that way, so the card at the
      // top of the stack is the order that just landed. Only a few are kept: a
      // stack taller than the screen is a stack nobody reads.
      setArrivals((current) => [...stamped, ...current].slice(0, 4));

      const newest = stamped[0];
      if (newest) systemNotify(newest, incoming.length - 1);
    },
    [chime, systemNotify]
  );

  const dismiss = React.useCallback((key: number) => {
    setArrivals((current) => current.filter((arrival) => arrival.key !== key));
  }, []);
  const dismissAll = React.useCallback(() => setArrivals([]), []);

  // Re-reading on a timer is the part that has to be right. Realtime makes an
  // order immediate; a café's wifi drops and a socket dies without saying so,
  // and a screen that trusted the socket alone would go quiet with no sign
  // anything was wrong.
  React.useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !restaurant.id) return;

    let cancelled = false;
    const tableNames = new Map<string, string>();

    const since = () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      return start.toISOString();
    };

    const loadTables = async () => {
      const { data } = await supabase
        .from("restaurant_tables")
        .select("id, name")
        .eq("restaurant_id", restaurant.id);
      for (const table of data ?? []) tableNames.set(table.id, table.name);
    };

    const sweep = async (announceArrivals: boolean) => {
      const { data } = await supabase
        .from("orders")
        .select("id, order_number, table_id, total, currency, status")
        .eq("restaurant_id", restaurant.id)
        .gte("created_at", since())
        .order("created_at", { ascending: false })
        .limit(200);

      if (cancelled || !data) return;

      // The count is read from the orders themselves rather than kept in
      // memory, so it survives a reload, agrees across every device the staff
      // use, and clears when an order is actually confirmed — not when
      // somebody merely glanced at the list.
      setPending(data.filter((order) => order.status === "pending").length);

      // An order moved along on another device: lists re-read to show it.
      const signature = data.map((order) => `${order.id}:${order.status}`).join(",");
      const changed = lastSignature.current !== null && lastSignature.current !== signature;
      lastSignature.current = signature;

      // The first sweep only learns what is already there: today's orders are
      // not news to someone opening the dashboard.
      if (knownIds.current === null) {
        knownIds.current = new Set(data.map((order) => order.id));
        return;
      }

      const fresh = data.filter((order) => !knownIds.current!.has(order.id));
      data.forEach((order) => knownIds.current!.add(order.id));
      if (fresh.length === 0) {
        if (changed) setRevision((value) => value + 1);
        return;
      }

      if (!announceArrivals) {
        setRevision((value) => value + 1);
        return;
      }

      // A table added since the dashboard opened would otherwise show as "no
      // table" on the one card where the name matters most.
      if (fresh.some((order) => order.table_id && !tableNames.has(order.table_id))) {
        await loadTables();
        if (cancelled) return;
      }

      const lines = new Map<string, string[]>();
      const { data: items } = await supabase
        .from("order_items")
        .select("order_id, quantity, name_snapshot")
        .in("order_id", fresh.map((order) => order.id));
      for (const item of items ?? []) {
        const list = lines.get(item.order_id) ?? [];
        list.push(`${item.quantity}× ${item.name_snapshot}`);
        lines.set(item.order_id, list);
      }
      if (cancelled) return;

      announce(
        fresh.map((order) => ({
          id: order.id,
          orderNumber: order.order_number,
          tableName: order.table_id ? (tableNames.get(order.table_id) ?? null) : null,
          total: order.total,
          currency: order.currency,
          preview: (lines.get(order.id) ?? []).join(", "),
        }))
      );
    };

    sweepNow.current = () => void sweep(true);
    void loadTables();
    void sweep(false);

    const channel = supabase
      .channel(`order-alerts:${restaurant.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurant.id}` },
        () => void sweep(true)
      )
      .subscribe();

    const timer = window.setInterval(() => void sweep(true), 20000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void sweep(true);
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      sweepNow.current = null;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      void supabase.removeChannel(channel);
    };
  }, [restaurant.id, announce]);

  // "(2) MenuQR" in the tab strip, the way a chat app does it: the one cue
  // that still works when the dashboard is one tab among twenty.
  React.useEffect(() => {
    const badge = /^\(\d+\+?\) /;
    const apply = () => {
      const base = document.title.replace(badge, "");
      const next = pending > 0 ? `(${pending > 99 ? "99+" : pending}) ${base}` : base;
      if (document.title !== next) document.title = next;
    };
    apply();
    if (pending === 0) return;
    // Navigating sets a fresh title; put the count back on it. Writing only
    // when it differs is what stops this from observing its own change.
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
  }, [pending]);

  const refresh = React.useCallback(() => sweepNow.current?.(), []);

  const value = React.useMemo(
    () => ({
      pending,
      refresh,
      arrivals,
      dismiss,
      dismissAll,
      soundOn,
      setSoundOn,
      pushPermission,
      requestPush,
      revision,
    }),
    [
      pending,
      refresh,
      arrivals,
      dismiss,
      dismissAll,
      soundOn,
      setSoundOn,
      pushPermission,
      requestPush,
      revision,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOrderAlerts() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useOrderAlerts must be used inside an OrderAlertsProvider");
  return ctx;
}
