/**
 * @module AppNavbar/NavbarContext
 * @description Context provider to reduce prop drilling in navbar components
 */

import { createContext, useContext } from "react";
import type { NavbarContextValue } from "./types";

const NavbarContext = createContext<NavbarContextValue | null>(null);

export function useNavbarContext() {
  const context = useContext(NavbarContext);
  if (!context) {
    throw new Error("useNavbarContext must be used within NavbarProvider");
  }
  return context;
}

export const NavbarProvider = NavbarContext.Provider;
