# @katren/vue-business-app

Shared Vue infrastructure for business applications that use the same backend conventions.

The package is intentionally separate from `@katren/vue-collection-lib`:

- `vue-collection-lib` stays generic CRUD/form/grid infrastructure.
- `vue-business-app` contains reusable application-level contracts and features shared by Katren projects.

## Included in 0.1.x

- Project branding configuration with a frontend-provided logo.
- `ProgAboutDialog` backed by `GET /prog-about/info`.
- Application-route registry (`ApplicationRoutesView`) backed by `/application-routes`.
- Menu API, menu schemas and `useMainMenu()`.
- Default vertical menu renderer (`VerticalMainMenu`).
- Menu constructor (`MainMenuConstructorView`).
- `UserBase<TRoleId>` and extensible user schema entries.
- Current-user self-service profile and password change UI/API, with extension slots for project-specific profile attributes.
- Common user reference and role-select controls used by the menu constructor.
- Russian and English component-local messages.
- Reusable object change-history dialog backed by the common audit log API.

The application layout and route manifest remain project-owned.

## Workspace layout

```text
dronm-workspace/
	apps/
		steklo/
		other-project/
	packages/
		vue-collection-lib/
		vue-business-app/
```

## Configuration

Install the plugin once in the consuming application. The plugin only provides configuration and API instances; it does **not** globally register all components.

```ts
import * as v from "valibot";

import api from "@/api/http";
import logoUrl from "@/assets/logo.svg?url";
import { applicationRouteManifest } from "@/router/routeManifest";

import { createBusinessApp } from "@katren/vue-business-app";

const RoleIdSchema = v.picklist(["admin", "manager"]);

app.use(
  createBusinessApp({
    api,
    branding: {
      logoUrl,
      title: "My application",
      subtitle: "Management system",
    },
    applicationRouteManifest,
    roles: {
      options: [
        {
          value: "admin",
          label: "Administrator",
        },
        {
          value: "manager",
          label: "Manager",
        },
      ],
      defaultRoleId: "admin",
      schema: RoleIdSchema,
    },
    userReferenceRoutes: {
      list: {
        name: "users",
      },
      edit: (id) => ({
        name: "userEdit",
        params: {
          id: String(id),
        },
      }),
    },
  }),
);
```

The logo is project configuration. Server-side logos can still be added later for tenant/runtime branding without changing the component contracts.

## Menu rendering

The package does not force one application layout.

`MainMenuConstructorView` (also exported as `MainMenuConstructor`) edits the
role or user menu. Folders use a single icon that changes between open and
closed states. Moving an item keeps its selection, keyboard focus, and folder
states, with a short swap animation that respects reduced motion preferences.
Deletion uses a modal dialog, warns when child items are included, and keeps
the dialog open with an error message if the request fails. These behaviors
require no additional setup in the consuming application.

Drag a menu item's label to reorder it or move the complete branch. The upper
and lower parts of a row insert before and after the item; the middle of a
folder moves the branch inside it, including empty or closed folders. A root
drop area appears while dragging to move a branch back to the top level. Drops
into the dragged branch or its descendants are rejected. Changes save
automatically and keep the selection and folder states; the arrow buttons and
parent field remain available for keyboard operation.

Use the supplied vertical renderer:

```vue
<script setup lang="ts">
import { VerticalMainMenu, useMainMenu } from "@katren/vue-business-app/menu";

const { menu, error } = useMainMenu();
</script>

<template>
  <VerticalMainMenu
    :menu="menu"
    :menu-error="error"
    :can-manage-menu="true"
    :can-view-application-routes="true"
  />
</template>
```

For an application with a horizontal shell, use the supplied responsive renderer:

```vue
<script setup lang="ts">
import { HorizontalMainMenu, useMainMenu } from "@katren/vue-business-app/menu";

const { menu, error } = useMainMenu();
</script>

<template>
  <HorizontalMainMenu
    :menu="menu"
    :menu-error="error"
    :brand-route="{ name: 'main' }"
    :can-view-profile="true"
    @profile="openUserProfile"
    @logout="logout"
  />
</template>
```

The horizontal renderer includes desktop dropdowns, searchable route discovery,
a user-action menu, active-route indication, and a compact mobile navigation
panel. It exposes the same action events as `VerticalMainMenu`.

Or build a completely different renderer while keeping the same API and menu model:

```vue
<script setup lang="ts">
import { useMainMenu } from "@katren/vue-business-app/menu";

const { menu } = useMainMenu();
</script>

<template>
  <nav class="flex gap-4">
    <!-- project-specific horizontal rendering -->
  </nav>
</template>
```

## Extending `UserBase`

The common user contract contains only fields required by shared functionality.

```ts
import type { UserBase } from "@katren/vue-business-app/user";

export type User = UserBase<RoleId>;
```

A project can extend it without changing the common package:

```ts
import type { UserBase } from "@katren/vue-business-app/user";

export interface User extends UserBase<RoleId> {
  email: string;
  department_id: number | null;
}
```

Schemas are composable in the same way:

```ts
import * as v from "valibot";

import { createUserBaseSchemas } from "@katren/vue-business-app/user";

const { UserBaseEntries } = createUserBaseSchemas(RoleIdSchema, t);

export const UserSchema = v.object({
  ...UserBaseEntries,
  email: v.pipe(v.string(), v.email()),
  department_id: v.nullable(v.number()),
});
```

## Tree shaking

The package uses ESM exports, has no global component registration and declares `sideEffects: false`. Consumers should import only the features they use, preferably through the feature subpaths:

```ts
import { ProgAboutDialog } from "@katren/vue-business-app/prog-about";

import { useMainMenu } from "@katren/vue-business-app/menu";
```

Unused JavaScript modules can therefore be removed by the consuming Vite/Rollup build.

## Tailwind

The supplied components use Tailwind utility classes. Tailwind v4 does not scan dependencies or ignored external sources automatically, so every consuming application must explicitly register this package with `@source`.

For the standard workspace layout:

```text
dronm-workspace/
	apps/
		steklo/
			src/style.css
	packages/
		vue-business-app/
```

add this immediately after the Tailwind import in the application stylesheet:

```css
@import "tailwindcss";
@source "../../../packages/vue-business-app/src";
```

`@source` paths are relative to the stylesheet containing the directive. If the package is consumed from another layout, adjust the path accordingly.

PrimeVue and PrimeIcons are expected to be configured by the consuming application.

## Object history

`ObjectHistoryDialog` displays audit rows for any audited database object. Pass the
audit table name as `object-type` and the audit record key as `object-id`:

```vue
<script setup lang="ts">
import { ref } from "vue";

import { ObjectHistoryDialog } from "@katren/vue-business-app/object-history";

const historyVisible = ref(false);
</script>

<template>
  <ObjectHistoryDialog
    v-model:visible="historyVisible"
    object-type="construction_sites"
    :object-id="constructionSiteId"
  />
</template>
```

The dialog calls:

```text
GET /object-history?object_type=construction_sites&object_id=1&from=0&count=50
```

Audit operations and boolean values are localized by the component. Foreign-key
descriptions are preferred over raw IDs when the backend provides them.

## Build

```bash
npm install
npm run typecheck
npm test
npm run build
```

## Current-user profile

`CurrentUserProfileView` implements the common self-service profile flow against these backend endpoints:

```text
GET   /users/me
PATCH /users/me
PATCH /users/me/password
```

The default view edits the current user's `name` and provides a separate new-password form with confirmation. Password confirmation is a frontend-only value and is never sent to the backend.

The supplied `VerticalMainMenu` keeps the profile action opt-in for backwards compatibility. Enable it in applications that provide the profile route:

```vue
<VerticalMainMenu
  :menu="menu"
  :can-view-profile="true"
  @profile="openUserProfile"
/>
```

```vue
<script setup lang="ts">
import {
  CurrentUserProfileView,
  type UserProfile,
} from "@katren/vue-business-app/user";

const handleUpdated = (profile: UserProfile): void => {
  // Synchronize the consuming application's auth/session store if it caches
  // the current user's display name.
};
</script>

<template>
  <CurrentUserProfileView @updated="handleUpdated" />
</template>
```

The profile is intentionally extensible. A project backend may return additional properties from `GET /users/me` and accept them in `PATCH /users/me`. Register the writable field names with `extra-fields` and render the corresponding controls through the `fields` slot:

```vue
<script setup lang="ts">
import InputText from "primevue/inputtext";

import { CurrentUserProfileView } from "@katren/vue-business-app/user";

const extraFields = ["email", "job_title"] as const;
</script>

<template>
  <CurrentUserProfileView :extra-fields="extraFields">
    <template #fields="{ model, setField, disabled }">
      <div class="flex flex-col gap-1">
        <label for="profileEmail">Email</label>
        <InputText
          id="profileEmail"
          :model-value="String(model.email ?? '')"
          :disabled="disabled"
          @update:model-value="setField('email', $event)"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label for="profileJobTitle">Job title</label>
        <InputText
          id="profileJobTitle"
          :model-value="String(model.job_title ?? '')"
          :disabled="disabled"
          @update:model-value="setField('job_title', $event)"
        />
      </div>
    </template>
  </CurrentUserProfileView>
</template>
```

Only `name` plus fields explicitly listed in `extra-fields` are submitted by the shared view. Reserved/security-sensitive fields such as `id`, `role_id` and password fields are never included in the profile update payload. For substantially different profile UX, `useCurrentUserProfile()` exposes the same common load/save/password behavior without imposing the default view.

For a fully project-owned profile view with strongly typed extra attributes, parameterize the composable with the project's profile interface:

```ts
import {
  type UserProfileBase,
  useCurrentUserProfile,
} from "@katren/vue-business-app/user";

interface ProjectUserProfile extends UserProfileBase {
  email: string;
  department_id: number | null;
}

const { profile, load, save, changePassword } =
  useCurrentUserProfile<ProjectUserProfile>();
```
