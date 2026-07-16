import { supabase } from "./supabaseClient";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export function isPushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function getPushPermissionState() {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission; // "default" | "granted" | "denied"
}

export async function getExistingSubscription() {
  if (!isPushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return null;
  return reg.pushManager.getSubscription();
}

export async function enableDailyReminders(ownerId) {
  if (!isPushSupported()) throw new Error("Push notifications are not supported on this browser.");
  if (!VAPID_PUBLIC_KEY) throw new Error("Missing VITE_VAPID_PUBLIC_KEY environment variable.");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Notification permission was not granted.");

  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      owner_id: ownerId,
      endpoint: subscription.endpoint,
      subscription: subscription.toJSON(),
    },
    { onConflict: "endpoint" }
  );

  if (error) throw error;
  return subscription;
}

export async function disableDailyReminders() {
  const sub = await getExistingSubscription();
  if (!sub) return;
  await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
  await sub.unsubscribe();
}
