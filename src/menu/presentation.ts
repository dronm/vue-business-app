import type { RouteRecordName } from "vue-router";

import type { MainMenuForUser } from "./types";

export interface MainMenuRouteEntry {
  key: string;
  caption: string;
  route: string;
  icon: string;
  breadcrumb: string;
}

export const mainMenuItemIcon = (item: MainMenuForUser): string => {
  const configuredIcon = item.icon
    ?.split(/\s+/)
    .find((className) => className.startsWith("pi-"));
  if (configuredIcon) {
    return configuredIcon;
  }

  if (item.children?.length) {
    return "pi-folder";
  }

  const routeName = (item.route ?? "").toLocaleLowerCase();
  if (routeName.includes("report")) {
    return "pi-chart-bar";
  }
  if (routeName.includes("user")) {
    return "pi-users";
  }
  if (routeName.includes("material")) {
    return "pi-box";
  }
  if (routeName.includes("document")) {
    return "pi-file";
  }

  return "pi-circle";
};

export const mainMenuItemMatchesRoute = (
  item: MainMenuForUser,
  routeName: RouteRecordName | null | undefined,
): boolean => {
  if (item.route && item.route === routeName) {
    return true;
  }

  return (
    item.children?.some((child) => {
      return mainMenuItemMatchesRoute(child, routeName);
    }) ?? false
  );
};

export const flattenMainMenuRoutes = (
  items: readonly MainMenuForUser[],
  parents: readonly string[] = [],
): MainMenuRouteEntry[] => {
  return items.flatMap((item) => {
    const path = [...parents, item.caption];
    const current: MainMenuRouteEntry[] = item.route
      ? [
          {
            key: `${path.join("/")}:${item.route}`,
            caption: item.caption,
            route: item.route,
            icon: mainMenuItemIcon(item),
            breadcrumb: parents.join(" / "),
          },
        ]
      : [];

    return [...current, ...flattenMainMenuRoutes(item.children ?? [], path)];
  });
};
