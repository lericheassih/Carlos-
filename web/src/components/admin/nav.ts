import {
  Home, Building2, CalendarCheck, CalendarDays, Tags, Users, Images, Star, BarChart3, Palette, Settings,
} from "lucide-react";

export const NAV = [
  { href: "/admin", label: "Vue d'ensemble", icon: Home, exact: true },
  { href: "/admin/appartements", label: "Mes appartements", icon: Building2 },
  { href: "/admin/reservations", label: "Réservations", icon: CalendarCheck, badge: "pending" as const },
  { href: "/admin/calendrier", label: "Calendrier", icon: CalendarDays },
  { href: "/admin/tarifs", label: "Tarifs et disponibilités", icon: Tags },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/medias", label: "Galerie média", icon: Images },
  { href: "/admin/avis", label: "Avis clients", icon: Star },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, live: true },
  { href: "/admin/site", label: "Personnalisation du site", icon: Palette },
  { href: "/admin/parametres", label: "Paramètres", icon: Settings },
];
