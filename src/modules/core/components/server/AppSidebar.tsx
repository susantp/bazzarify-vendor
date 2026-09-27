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
import {
  getWorkspaceCapabilities,
  type WorkspaceCapabilities,
} from "@/modules/auth/domain/workspace-capabilities";
import SidebarAccountMenu from "@/modules/core/components/client/SidebarAccountMenu";
import SidebarMenuButtonComponent from "@/modules/core/components/client/SidebarMenuButton";
import SidebarMenuGroupComponent from "@/modules/core/components/client/SidebarMenuGroup";
import { TMenuEntry } from "@/modules/core/data";
import { isStoreProductAuthoringReady } from "@/modules/vendor/domain/schemas/store";
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

const tenantMembershipNavigation: TMenuEntry = {
  type: "link",
  title: "Members",
  path: "/workspace/members",
  icon: FaUsers,
};

const onboardingNavigation: TMenuEntry = {
  type: "link",
  title: "Onboarding",
  path: "/onboarding",
  icon: FaStore,
};

function canViewNavigation(
  entry: TMenuEntry,
  capabilities: WorkspaceCapabilities,
): boolean {
  if (entry.type === "group") {
    return entry.pathMatch === "/products" && capabilities.canViewProducts;
  }

  if (entry.path === "/") return capabilities.canViewDashboard;
  if (entry.path === "/onboarding") return capabilities.isVendorIdentity;
  if (entry.path === "/products/reviews") {
    return capabilities.canReviewProducts;
  }
  if (entry.path === "/products") return capabilities.canViewProducts;
  if (entry.path === "/orders") return capabilities.canViewOrders;
  if (entry.path === "/workspace/members") {
    return capabilities.canManageTenantMembers;
  }
  if (entry.path === "/sliders" || entry.path === "/categories") {
    return capabilities.canManagePlatformCatalog;
  }
  if (entry.path === "/users") return capabilities.canManagePlatformUsers;
  if (entry.path === "/vendors") return capabilities.canManagePlatformVendors;
  return false;
}

function filterNavigation(
  entry: TMenuEntry,
  capabilities: WorkspaceCapabilities,
): TMenuEntry | null {
  if (!canViewNavigation(entry, capabilities)) return null;
  if (entry.type !== "group") return entry;

  const children = entry.children.filter(
    (child) =>
      child.path !== "/products/imports" || capabilities.canImportProducts,
  );
  return children.length > 0 ? { ...entry, children } : null;
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
  const sessionUser = await getSessionUser();
  const capabilities = sessionUser
    ? getWorkspaceCapabilities(sessionUser)
    : null;
  const currentStore = sessionUser ? getVendorStore(sessionUser) : null;
  const roleNames = sessionUser?.roles.map((role) => role.name) ?? [];
  const displayName = getDisplayName(
    sessionUser?.name ?? null,
    sessionUser?.email ?? null,
  );
  const initials = getInitials(displayName);
  const roleSummary = formatRoleSummary(roleNames);
  const hasSettingsAccess = capabilities?.canManagePlatformCatalog ?? false;
  const storeName = currentStore?.name?.trim() || null;
  const hasStore = Boolean(currentStore);
  const hasBlockedStoreSetup = Boolean(
    currentStore && !isStoreProductAuthoringReady(currentStore),
  );
  const isVendor = capabilities?.workspace === "tenant";
  const navigations =
    capabilities?.workspace === "platform"
      ? adminNavigations
      : capabilities?.workspace === "tenant"
        ? capabilities.isVendorIdentity && (!hasStore || hasBlockedStoreSetup)
          ? [onboardingNavigation]
          : [
              ...vendorNavigations,
              ...(capabilities.canManageTenantMembers
                ? [tenantMembershipNavigation]
                : []),
            ]
        : capabilities?.isVendorIdentity
          ? [onboardingNavigation]
          : [];
  const entries = navigations
    .map((entry) =>
      capabilities ? filterNavigation(entry, capabilities) : null,
    )
    .filter((entry): entry is TMenuEntry => entry !== null);

  const workspaceName = sessionUser?.tenants.find(
    (tenant) => tenant.uuid === sessionUser.current_tenant_uuid,
  )?.name;
  const secondaryText =
    workspaceName || storeName || sessionUser?.email || "Signed in";
  const identitySummary = hasBlockedStoreSetup
    ? "Store setup incomplete"
    : workspaceName || storeName || "Signed in account";
  const storeAction =
    !capabilities?.isVendorIdentity || hasBlockedStoreSetup
      ? !capabilities?.isVendorIdentity
        ? null
        : !hasStore
          ? {
              href: "/store-required",
              label: "Complete store setup",
              tone: "default" as const,
            }
          : {
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
              profileHref={
                capabilities?.isVendorIdentity ? "/vendor-capabilities" : null
              }
              storeAction={storeAction}
            />
          </SidebarFooter>
        ) : null}
      </Sidebar>
    </div>
  );
}
