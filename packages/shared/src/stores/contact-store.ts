"use client";

import { create } from "zustand";

import {
  DEFAULT_ADMIN_CONTACT,
  readAdminContact,
  writeAdminContact,
  type AdminContact,
} from "../lib/contact-settings-cookie";

interface ContactState {
  contact: AdminContact;
  hydrated: boolean;
  hydrate: () => void;
  save: (contact: AdminContact) => void;
}

export const useContactStore = create<ContactState>()((set) => ({
  contact: DEFAULT_ADMIN_CONTACT,
  hydrated: false,
  hydrate: () => set({ contact: readAdminContact(), hydrated: true }),
  save: (contact) => {
    writeAdminContact(contact);
    set({ contact });
  },
}));
