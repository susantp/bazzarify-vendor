import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import WorkspaceSwitcher from "@/modules/auth/components/server/WorkspaceSwitcher";
import { getSessionUser } from "@/modules/auth/data/auth-service";
import { getVendorStore } from "@/modules/auth/domain/workspace";
import SidebarAccountMenu from "@/modules/core/components/client/SidebarAccountMenu";
import SidebarMenuButtonComponent from "@/modules/core/components/client/SidebarMenuButton";
import SidebarMenuGroupComponent from "@/modules/core/components/client/SidebarMenuGroup";
import { TMenuEntry } from "@/modules/core/data";
import { isStoreProductAuthoringReady } from "@/modules/vendor/domain/schemas/store";
import { headers } from "next/headers";
import Image from "next/image";
import { FaClipboardCheck, FaHome, FaImage } from "react-icons/fa";
import {
  FaFileImport,
  FaFirstOrder,
  FaProductHunt,
  FaStore,
  FaUsers,
} from "react-icons/fa6";
import { TbCategory } from "react-icons/tb";

const productsGroup: TMenuEntry = {
  type: "group",
  title: "Products",
  defaultPath: "/products",
  pathMatch: "/products",
  icon: FaProductHunt,
  children: [
    {
      type: "link",
      title: "All products",
      path: "/products",
      icon: FaProductHunt,
    },
    {
      type: "link",
      title: "Imports",
      path: "/products/imports",
      icon: FaFileImport,
    },
  ],
};

const adminNavigations: TMenuEntry[] = [
  { type: "link", title: "Dashboard", path: "/", icon: FaHome },
  { type: "link", title: "Sliders", path: "/sliders", icon: FaImage },
  { type: "link", title: "Categories", path: "/categories", icon: TbCategory },
  productsGroup,
  {
    type: "link",
    title: "Product reviews",
    path: "/products/reviews",
    icon: FaClipboardCheck,
  },
  { type: "link", title: "Orders", path: "/orders", icon: FaFirstOrder },
  { type: "link", title: "Users", path: "/users", icon: FaUsers },
  { type: "link", title: "Vendors", path: "/vendors", icon: FaStore },
];

const vendorNavigations: TMenuEntry[] = [
  { type: "link", title: "Dashboard", path: "/", icon: FaHome },
  productsGroup,
  { type: "link", title: "Sliders", path: "/sliders", icon: FaImage },
  { type: "link", title: "Orders", path: "/orders", icon: FaFirstOrder },
];

function isEntryVisible(entry: TMenuEntry, isSuperAdmin: boolean): boolean {
  if (
    entry.type === "link" &&
    (entry.path === "/users" || entry.path === "/vendors")
  ) {
    return isSuperAdmin;
  }
  return true;
}

function getDisplayName(name: string | null, email: string | null): string {
  const trimmedName = name?.trim();
  if (trimmedName) {
    return trimmedName;
  }

  const emailLocalPart = email?.split("@")[0]?.trim();
  if (emailLocalPart) {
    return emailLocalPart;
  }

  return "Account";
}

function getInitials(label: string): string {
  const segments = label
    .split(/\s+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    return "AC";
  }

  if (segments.length === 1) {
    return segments[0].slice(0, 2).toUpperCase();
  }

  return `${segments[0][0] ?? ""}${segments[1][0] ?? ""}`.toUpperCase();
}

function formatRoleSummary(roleNames: string[]): string {
  if (roleNames.length === 0) {
    return "No assigned roles";
  }

  return roleNames
    .map((roleName) =>
      roleName
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
    )
    .join(", ");
}

export async function AppSidebar({ className }: { className?: string }) {
  const requestHeaders = await headers();
  const isVendor = requestHeaders.get("host")?.startsWith("vendor.");
  const sessionUser = await getSessionUser();
  const currentStore = sessionUser ? getVendorStore(sessionUser) : null;
  const isSuperAdmin = Boolean(
    sessionUser?.platform_roles.includes("super-admin"),
  );
  const roleNames = sessionUser?.roles.map((role) => role.name) ?? [];
  const displayName = getDisplayName(
    sessionUser?.name ?? null,
    sessionUser?.email ?? null,
  );
  const initials = getInitials(displayName);
  const roleSummary = formatRoleSummary(roleNames);
  const hasSettingsAccess =
    !isVendor &&
    roleNames.some(
      (roleName) => roleName === "admin" || roleName === "super-admin",
    );
  const storeName = currentStore?.name?.trim() || null;
  const hasStore = Boolean(currentStore);
  const hasBlockedStoreSetup = Boolean(
    currentStore && !isStoreProductAuthoringReady(currentStore),
  );
  const vendorIsNotReady = isVendor && (!hasStore || hasBlockedStoreSetup);
  const vendorLandingNavigation: TMenuEntry = vendorIsNotReady
    ? { type: "link", title: "Onboarding", path: "/onboarding", icon: FaStore }
    : { type: "link", title: "Dashboard", path: "/", icon: FaHome };
  const navigations: TMenuEntry[] = isVendor
    ? [vendorLandingNavigation, ...vendorNavigations.slice(1)]
    : adminNavigations;
  const entries = navigations.filter((entry) =>
    isEntryVisible(entry, isSuperAdmin),
  );

  const workspaceName = sessionUser?.tenants.find(
    (tenant) => tenant.uuid === sessionUser.current_tenant_uuid,
  )?.name;
  const secondaryText =
    workspaceName || storeName || sessionUser?.email || "Signed in";
  const identitySummary = hasBlockedStoreSetup
    ? "Store setup incomplete"
    : workspaceName || storeName || "Signed in account";
  const storeAction = !isVendor
    ? null
    : !hasStore
      ? {
          href: "/store-required",
          label: "Complete store setup",
          tone: "default" as const,
        }
      : hasBlockedStoreSetup
        ? {
            href: "/store-remediation",
            label: "Finish store setup",
            tone: "warning" as const,
          }
        : null;

  return (
    <div className={isVendor ? "sidebar-theme-vendor" : "sidebar-theme-admin"}>
      <Sidebar className={cn(className)}>
        <SidebarHeader className="p-4 pb-2">
          <div className="rounded-2xl px-4 py-3">
            <Image
              src="/logo.png"
              alt="logo"
              width={342}
              height={88}
              priority={true}
            />
          </div>
          {sessionUser ? <WorkspaceSwitcher user={sessionUser} /> : null}
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {entries.map((entry) => {
                  if (entry.type === "group") {
                    const GroupIcon = entry.icon;
                    return (
                      <SidebarMenuGroupComponent
                        key={entry.title}
                        title={entry.title}
                        pathMatch={entry.pathMatch}
                        icon={<GroupIcon />}
                        items={entry.children.map((child) => {
                          const ChildIcon = child.icon;
                          return {
                            title: child.title,
                            path: child.path,
                            icon: <ChildIcon />,
                          };
                        })}
                      />
                    );
                  }
                  return (
                    <SidebarMenuItem key={entry.title}>
                      <SidebarMenuButtonComponent
                        routePath={entry.path}
                        title={entry.title}
                      >
                        <entry.icon />
                      </SidebarMenuButtonComponent>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        {sessionUser ? (
          <SidebarFooter className="border-t border-sidebar-border bg-transparent p-4">
            <SidebarAccountMenu
              initials={initials}
              displayName={displayName}
              secondaryText={secondaryText}
              email={sessionUser.email}
              roleSummary={roleSummary}
              identitySummary={identitySummary}
              settingsHref={
                hasSettingsAccess ? "/settings/store-onboarding" : null
              }
              profileHref={isVendor ? "/vendor-capabilities" : null}
              storeAction={storeAction}
            />
          </SidebarFooter>
        ) : null}
      </Sidebar>
    </div>
  );
}
