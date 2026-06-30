const fs = require('fs');

// ── 1. store.ts: adauga homeText in ModuleSettings ──
let store = fs.readFileSync('src/lib/store.ts', 'utf8');
const oldInterface = `export interface ModuleSettings {
  general: {
    adminPhone: string;
    announcementText: string;
    adminPin?: string;
  };`;
const newInterface = `export interface ModuleSettings {
  general: {
    adminPhone: string;
    announcementText: string;
    adminPin?: string;
  };
  homeText?: {
    ro: Record<string, string>;
    ru: Record<string, string>;
  };`;
if (!store.includes(oldInterface)) { console.error('EROARE: interfata ModuleSettings nu gasita'); process.exit(1); }
store = store.replace(oldInterface, newInterface);
fs.writeFileSync('src/lib/store.ts', store);
console.log('OK: store.ts actualizat');

// ── 2. LangContext.tsx: suprascrie cu homeText din store ──
let ctx = fs.readFileSync('src/contexts/LangContext.tsx', 'utf8');
const oldImport = `import { createContext, useContext, useState, type ReactNode } from "react";
import t, { type Lang, type TranslationKey } from "@/lib/translations";`;
const newImport = `import { createContext, useContext, useState, type ReactNode } from "react";
import t, { type Lang, type TranslationKey } from "@/lib/translations";
import { useStore } from "@/lib/store";`;
const oldTranslate = `  const translate = (key: TranslationKey, vars?: Record<string, string | number>): string => {
    const str: string = (t[lang] as Record<string, string>)[key]
      ?? (t.ro as Record<string, string>)[key]
      ?? key;`;
const newTranslate = `  const homeText = useStore((s) => s.settings.homeText);
  const translate = (key: TranslationKey, vars?: Record<string, string | number>): string => {
    const override = (homeText?.[lang] as Record<string, string> | undefined)?.[key]
      ?? (homeText?.ro as Record<string, string> | undefined)?.[key];
    const str: string = override
      ?? (t[lang] as Record<string, string>)[key]
      ?? (t.ro as Record<string, string>)[key]
      ?? key;`;
if (!ctx.includes(oldImport)) { console.error('EROARE: import LangContext nu gasit'); process.exit(1); }
if (!ctx.includes(oldTranslate)) { console.error('EROARE: translate LangContext nu gasit'); process.exit(1); }
ctx = ctx.replace(oldImport, newImport).replace(oldTranslate, newTranslate);
fs.writeFileSync('src/contexts/LangContext.tsx', ctx);
console.log('OK: LangContext.tsx actualizat');
