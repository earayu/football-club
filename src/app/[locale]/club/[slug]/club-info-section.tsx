"use client";

import { useState } from "react";
import { ClubInfoForm } from "./manage/info/club-info-form";
import { PencilSimple, X } from "@phosphor-icons/react";

export function ClubInfoSection({ club, isAdmin }: { club: any; isAdmin: boolean }) {
  const [editing, setEditing] = useState(false);
  if (!club.description && !isAdmin) return null;

  return (
    <section>
      {editing ? (
        <div className="rounded-2xl border border-green-200 bg-green-50/40 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-bold text-zinc-800">Edit Club Info</h2>
            <button onClick={() => setEditing(false)}
              className="flex items-center gap-1 text-sm text-zinc-500 transition hover:text-zinc-700">
              <X size={14} /> Cancel
            </button>
          </div>
          <ClubInfoForm club={club} onSaved={() => setEditing(false)} />
        </div>
      ) : (
        <div>
          {club.description ? (
            <p className="text-[15px] leading-relaxed text-zinc-600">{club.description}</p>
          ) : (
            isAdmin && <p className="text-sm italic text-zinc-400">No description yet.</p>
          )}
          {isAdmin && (
            <button onClick={() => setEditing(true)}
              className="mt-2 flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition hover:text-green-700">
              <PencilSimple size={13} /> Edit club info
            </button>
          )}
        </div>
      )}
    </section>
  );
}
