/**
 * @module Navbar
 * @description Shadcn/ui-based navbar components
 * Re-exports simplified navbar primitives from navbar-shadcn.jsx
 */

export {
  NavbarProvider,
  useNavbar,
  Navbar,
  NavbarContent,
  NavbarSection,
  NavbarSeparator,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuButton,
  NavbarIconButton,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "./navbar-shadcn";

// Legacy exports for backwards compatibility (if needed)
export const NavbarGroup = NavbarSeparator;
export const NavbarGroupLabel = () => null;
export const NavbarGroupContent = NavbarContent;
