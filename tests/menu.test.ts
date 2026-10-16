import { describe, expect, it } from "vitest";

import {
  buildMainMenuTree,
  flattenMainMenuRoutes,
  filterMainMenu,
  mainMenuItemMatchesRoute,
  type MainMenuForUser,
  type MainMenuList,
} from "../src/menu";

const menu: MainMenuForUser[] = [
  {
    id: 1,
    caption: "Products",
    route: "",
    icon: null,
    children: [
      {
        id: 2,
        caption: "Brands",
        route: "brands",
        icon: null,
        children: null,
      },
    ],
  },
  {
    id: 3,
    caption: "Users",
    route: "users",
    icon: null,
    children: null,
  },
];

const row = (
  id: number,
  parentId: number | null,
  sortOrder: number,
): MainMenuList<string> => ({
  id,
  role_id: "admin",
  users_ref: null,
  main_menus_ref:
    parentId === null
      ? null
      : {
          keys: {
            id: parentId,
          },
          descr: String(parentId),
        },
  application_routes_ref: null,
  route_name: null,
  caption: `Item ${id}`,
  icon: null,
  sort_order: sortOrder,
  is_active: true,
  created_at: "2026-08-14T00:00:00Z",
  updated_at: "2026-08-14T00:00:00Z",
});

describe("filterMainMenu", () => {
  it("preserves a parent when a child matches", () => {
    const result = filterMainMenu(menu, "brand");

    expect(result).toHaveLength(1);
    expect(result[0].caption).toBe("Products");
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children?.[0].caption).toBe("Brands");
  });

  it("returns all items for an empty search", () => {
    expect(filterMainMenu(menu, "")).toBe(menu);
  });
});

describe("buildMainMenuTree", () => {
  it("builds and sorts the role-scoped tree", () => {
    const rows = [row(3, null, 20), row(2, 1, 10), row(1, null, 10)];

    const tree = buildMainMenuTree(rows, {
      type: "role",
      roleId: "admin",
    });

    expect(tree.map((item) => item.id)).toEqual([1, 3]);
    expect(tree[0].children.map((item) => item.id)).toEqual([2]);
  });
});

describe("horizontal menu presentation", () => {
  it("flattens nested routes with breadcrumbs", () => {
    const entries = flattenMainMenuRoutes(menu);

    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      caption: "Brands",
      route: "brands",
      breadcrumb: "Products",
    });
  });

  it("marks a parent branch active for a child route", () => {
    expect(mainMenuItemMatchesRoute(menu[0], "brands")).toBe(true);
    expect(mainMenuItemMatchesRoute(menu[0], "users")).toBe(false);
  });
});
