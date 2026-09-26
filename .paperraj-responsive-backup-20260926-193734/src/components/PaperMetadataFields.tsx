"use client";

import { useEffect, useState } from "react";
import { PAPER_TYPES } from "@/lib/site";

export type MetadataState = {
  uploaderName: string;
  classLevel: string;
  board: string;
  subject: string;
  exam: string;
  year: string;
  school: string;
  paperType: string;
  description: string;
};

export const EMPTY_METADATA: MetadataState = {
  uploaderName: "",
  classLevel: "",
  board: "",
  subject: "",
  exam: "",
  year: "",
  school: "",
  paperType: PAPER_TYPES[0],
  description: "",
};

export function PaperMetadataFields({
  value,
  onChange,
  suggestions,
  lockedUploader = false,
  requireUploader = false,
}: {
  value: MetadataState;
  onChange: (next: MetadataState) => void;
  suggestions?: {
    classLevel?: string[];
    board?: string[];
    subject?: string[];
    exam?: string[];
    school?: string[];
  };
  lockedUploader?: boolean;
  requireUploader?: boolean;
}) {
  const set = (key: keyof MetadataState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    onChange({ ...value, [key]: event.target.value });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor="md-uploader" className="label">
          {requireUploader ? "Uploader name * " : "Uploader name"}
          {lockedUploader && <span className="ml-1 normal-case text-ink-3">(from your profile)</span>}
        </label>
        <input
          id="md-uploader"
          className="field"
          value={value.uploaderName}
          onChange={set("uploaderName")}
          placeholder="e.g. Rahul M."
          readOnly={lockedUploader}
          required={requireUploader}
          maxLength={120}
        />
        <p className="mt-1 text-[0.75rem] text-ink-3">
          This name is shown on every listing, exactly like a library donation label.
        </p>
      </div>

      <div>
        <label htmlFor="md-class" className="label">
          Class
        </label>
        <input
          id="md-class"
          className="field"
          list="suggest-class"
          value={value.classLevel}
          onChange={set("classLevel")}
          placeholder="e.g. Class 9"
          maxLength={60}
        />
      </div>

      <div>
        <label htmlFor="md-board" className="label">
          Board
        </label>
        <input
          id="md-board"
          className="field"
          list="suggest-board"
          value={value.board}
          onChange={set("board")}
          placeholder="e.g. ICSE"
          maxLength={80}
        />
      </div>

      <div>
        <label htmlFor="md-subject" className="label">
          Subject
        </label>
        <input
          id="md-subject"
          className="field"
          list="suggest-subject"
          value={value.subject}
          onChange={set("subject")}
          placeholder="e.g. Chemistry"
          maxLength={100}
        />
      </div>

      <div>
        <label htmlFor="md-exam" className="label">
          Exam
        </label>
        <input
          id="md-exam"
          className="field"
          list="suggest-exam"
          value={value.exam}
          onChange={set("exam")}
          placeholder="e.g. Half Yearly"
          maxLength={100}
        />
      </div>

      <div>
        <label htmlFor="md-year" className="label">
          Year
        </label>
        <input
          id="md-year"
          className="field"
          inputMode="numeric"
          pattern="[0-9]{4}"
          value={value.year}
          onChange={set("year")}
          placeholder="e.g. 2026"
          maxLength={4}
        />
      </div>

      <div>
        <label htmlFor="md-type" className="label">
          Paper type
        </label>
        <select id="md-type" className="field" value={value.paperType} onChange={set("paperType")}>
          {PAPER_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
          <option value="">Not specified</option>
        </select>
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="md-school" className="label">
          School / institution
        </label>
        <input
          id="md-school"
          className="field"
          list="suggest-school"
          value={value.school}
          onChange={set("school")}
          placeholder="e.g. ABC School"
          maxLength={160}
        />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="md-description" className="label">
          Description
        </label>
        <textarea
          id="md-description"
          className="field"
          value={value.description}
          onChange={set("description")}
          placeholder="Anything useful for the next reader — number of pages, sections covered, whether an answer key is included…"
          maxLength={2000}
        />
      </div>

      <datalist id="suggest-class">
        {(suggestions?.classLevel ?? []).map((v) => (
          <option key={v} value={v} />
        ))}
      </datalist>
      <datalist id="suggest-board">
        {(suggestions?.board ?? []).map((v) => (
          <option key={v} value={v} />
        ))}
      </datalist>
      <datalist id="suggest-subject">
        {(suggestions?.subject ?? []).map((v) => (
          <option key={v} value={v} />
        ))}
      </datalist>
      <datalist id="suggest-exam">
        {(suggestions?.exam ?? []).map((v) => (
          <option key={v} value={v} />
        ))}
      </datalist>
      <datalist id="suggest-school">
        {(suggestions?.school ?? []).map((v) => (
          <option key={v} value={v} />
        ))}
      </datalist>
    </div>
  );
}

/** Remembers guest uploader details in their own browser only. */
export function useRememberedGuest() {
  const [remembered, setRemembered] = useState<MetadataState | null>(null);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("paperraj.guest");
      if (raw) setRemembered(JSON.parse(raw) as MetadataState);
    } catch {
      setRemembered(null);
    }
  }, []);
  const remember = (state: MetadataState) => {
    try {
      window.localStorage.setItem(
        "paperraj.guest",
        JSON.stringify({
          uploaderName: state.uploaderName,
          classLevel: state.classLevel,
          board: state.board,
          school: state.school,
        }),
      );
    } catch {
      /* ignore */
    }
  };
  return { remembered, remember };
}
