/**
 * @module AppNavbar/NavbarContext
 * @description Context provider to reduce prop drilling in navbar components
 */

import { createContext } from "react";
import type { NavbarContextValue } from "./types";

const NavbarContext = createContext<NavbarContextValue | null>(null);

export const NavbarProvider = NavbarContext.Provider;
