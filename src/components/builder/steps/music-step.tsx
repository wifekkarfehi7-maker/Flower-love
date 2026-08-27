"use client";

import * as React from "react";
import { Loader2, Music2, Pause, Play, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteMusic, setMusicAutoplay, uploadMusic } from "@/lib/invitations/client";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { MusicFileRow } from "@/types/database";

const STRINGS = {
  ar: {
    title: "الموسيقى",
    description: "أضيفوا مقطعاً موسيقياً يبدأ تلقائياً بعد الضغط على \"افتحوا الدعوة\".",
    upload: "رفع ملف MP3",
    uploading: "جاري الرفع...",
    error: "تعذر رفع الملف، تحقق من نوع وحجم الملف (MP3، حتى 15 م.ب).",
    autoplay: "تشغيل تلقائي بعد فتح الدعوة",
    remove: "حذف الموسيقى",
    none: "لم تتم إضافة موسيقى بعد.",
  },
  fr: {
    title: "Musique",
    description: "Ajoutez un morceau qui démarre automatiquement après avoir cliqué sur \"Ouvrir l'invitation\".",
    upload: "Téléverser un MP3",
    uploading: "Envoi...",
    error: "Échec de l'envoi — vérifiez le type et la taille (MP3, 15 Mo max).",
    autoplay: "Lecture automatique après ouverture",
    remove: "Supprimer la musique",
    none: "Aucune musique ajoutée pour le moment.",
  },
  en: {
    title: "Music",
    description: "Add a track that starts automatically after tapping \"Open Invitation\".",
    upload: "Upload MP3",
    uploading: "Uploading...",
    error: "Upload failed — check the file type and size (MP3, up to 15MB).",
    autoplay: "Autoplay after opening the invitation",
    remove: "Remove music",
    none: "No music added yet.",
  },
};

export function MusicStep({
  invitationId,
  userId,
  music,
  onMusicChange,
}: {
  invitationId: string;
  userId: string;
  music: MusicFileRow | null;
  onMusicChange: (music: MusicFileRow | null) => void;
}) {
  const { locale } = useTranslation();
  const t = STRINGS[locale];
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [playing, setPlaying] = React.useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(false);
    const result = await uploadMusic(invitationId, userId, file, music);
    if (result.data) onMusicChange(result.data);
    else setError(true);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDelete() {
    if (!music) return;
    setPlaying(false);
    audioRef.current?.pause();
    onMusicChange(null);
    await deleteMusic(music.id, music.storage_path);
  }

  function togglePlay() {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  }

  async function toggleAutoplay() {
    if (!music) return;
    const next = { ...music, autoplay_after_open: !music.autoplay_after_open };
    onMusicChange(next);
    await setMusicAutoplay(music.id, next.autoplay_after_open);
  }

  return (
    <div>
      <h2 className="font-heading text-xl font-bold text-ink-900">{t.title}</h2>
      <p className="mt-1 text-sm text-ink-500">{t.description}</p>
      {error && <p className="mt-2 text-sm text-destructive">{t.error}</p>}

      <div className="mt-6">
        {music ? (
          <div className="flex items-center gap-4 rounded-2xl border border-ink-100 p-5">
            <button
              type="button"
              onClick={togglePlay}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold-gradient text-ink-950"
            >
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink-900">{music.title ?? "audio.mp3"}</p>
              <label className="mt-2 flex items-center gap-2 text-xs text-ink-500">
                <input type="checkbox" checked={music.autoplay_after_open} onChange={toggleAutoplay} className="h-4 w-4 rounded" />
                {t.autoplay}
              </label>
            </div>
            <button
              type="button"
              onClick={handleDelete}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-400 hover:bg-destructive/10 hover:text-destructive"
              aria-label={t.remove}
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <audio ref={audioRef} src={music.url ?? undefined} onEnded={() => setPlaying(false)} className="hidden" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-ink-200 p-10 text-center">
            <Music2 className="h-8 w-8 text-ink-300" />
            <p className="text-sm text-ink-400">{t.none}</p>
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? t.uploading : t.upload}
            </Button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/mpeg,audio/mp3"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}
