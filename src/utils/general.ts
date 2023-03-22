import type { DragEvent } from "react";

export function cx(...things: (string | undefined | null | false)[]) {
  return things.join(" ");
}

export function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function timeAgo(date: Date) {
  const now = new Date().getTime();
  const millisDiff = now - date.getTime();

  const seconds = millisDiff / 1000;
  if (seconds < 60) return `${Math.floor(seconds)}sec`;

  const minutes = seconds / 60;
  if (minutes < 60) return `${Math.floor(minutes)}min`;

  const hours = minutes / 60;
  if (hours < 24) return `${Math.floor(hours)}hr`;

  const days = hours / 24;
  if (days < 30) return `${Math.floor(days)}d`;

  const months = days / 30.5;
  if (months < 12) return `${Math.floor(months)}mo`;

  const years = months / 12;
  return `${Math.floor(years)}y`;
}

export function getTodaysImageDate() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}
export function getTodaysImageURL() {
  return `/api/images/get_image/${formatDate(getTodaysImageDate())}`;
}

export function handleFileDrop(
  e: DragEvent<HTMLDivElement>,
  callback: (s: string) => void
) {
  const file = e.dataTransfer.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => {
    if (typeof reader.result === "string") callback(reader.result);
  };
}
