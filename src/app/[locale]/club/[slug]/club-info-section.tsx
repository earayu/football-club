"use client";

import { useState } from "react";
import { ClubInfoForm } from "./manage/info/club-info-form";

export function ClubInfoSection({
  club,
  isAdmin,
}: {
  club: any;
  isAdmin: boolean;
}) {
  const [editing, setEditing] = useState(false);

  if (!club.description && !isAdmin) return null;

  return (
    <section>
      {editing ? (
        <div className="rounded-xl border border-green-200 bg-green-50/40 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Edit Club Info</h2>
            <button
              onClick={() => setEditing(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ✕ Cancel
            </button>
          </div>
          <ClubInfoForm club={club} onSaved={() => setEditing(false)} />
        </div>
      ) : (
        <div className="group relative">
          {club.description ? (
            <p className="text-gray-600">{club.description}</p>
          ) : (
            isAdmin && (
              <p className="text-sm italic text-gray-400">No description yet.</p>
            )
          )}
          {isAdmin && (
            <button
              onClick={() => setEditing(true)}
              className="mt-2 flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-green-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit club info
            </button>
          )}
        </div>
      )}
    </section>
  );
}
