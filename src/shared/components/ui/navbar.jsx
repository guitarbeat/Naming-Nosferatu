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

export { NavbarSeparator as NavbarGroup } from "./navbar-shadcn";
export const NavbarGroupLabel = () => null;
export { NavbarContent as NavbarGroupContent } from "./navbar-shadcn";
