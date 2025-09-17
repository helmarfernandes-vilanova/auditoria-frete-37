import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  BarChart3,
  FileText,
  Receipt,
  Inbox,
  Users,
  Truck,
  CreditCard,
  Calculator,
  BookOpen
} from "lucide-react";

const menuItems = [
  {
    title: "Auditoria",
    url: "/auditoria",
    icon: BarChart3,
  },
  {
    title: "Tabelas de Frete",
    url: "/tabelas-frete", 
    icon: FileText,
  },
  {
    title: "NF-e Embarcador",
    url: "/nfe-embarcador",
    icon: Receipt,
  },
  {
    title: "CTe Recebidos",
    url: "/cte-recebidos",
    icon: Inbox,
  },
  {
    title: "Fretistas",
    url: "/fretistas",
    icon: Users,
  },
  {
    title: "Pagamentos",
    url: "/pagamentos",
    icon: CreditCard,
  },
  {
    title: "Consultoria Delta",
    url: "/consultoria-delta",
    icon: Calculator,
  },
  {
    title: "Documentação API",
    url: "/documentacao-api",
    icon: BookOpen,
  },
];

export function AppSidebar() {
  const { state } = useSidebar();

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent>
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Truck className="h-5 w-5 text-primary" />
            </div>
            <div className="group-data-[collapsible=icon]:hidden">
              <p className="font-semibold text-sm">Vila Nova</p>
              <p className="text-xs text-muted-foreground">Auditoria</p>
            </div>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink 
                      to={item.url}
                      className={({ isActive }) => 
                        isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : ""
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="group-data-[collapsible=icon]:sr-only">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}