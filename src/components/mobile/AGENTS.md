# Mobile UI Rules

- The patient mobile shell owns global navigation, AI sheets, connectivity feedback, and the mobile services hub so shared web pages remain unchanged.
- Mobile service navigation uses `src/data/mobileServiceCatalog.ts` as the single route inventory shared by the catalogue, home shortcuts, and AI hub, preventing link drift.
- Mobile service cards use `mobileServiceImages.ts`, while each educational detail uses four service-specific generated frames and copy from `mobileServiceStories.ts`, preventing generic visual reuse.
- Mobile service education is presented through the shared catalogue detail overlay, so every service keeps one visual explanation and canonical destination.
- Fixed bottom-anchored overlays (cookie/geo banners, floating dock) must clear the mobile bottom navigation by using `bottom-16`/`bottom-20` with an `lg:` reset.
- The mobile "Foydali maslahatlar" hub reads its menus, frames and phrases only from `src/data/mobileTipsCatalog.ts`, keeping cards, stories and onboarding in sync.
- Mobile Profile uses `mobileProfileCatalog.ts` for menu identity and three generated photo frames; reuse existing account-backed patient components in profile sections rather than duplicating medical or payment logic.
- Mobile Profile security exposes real Auth password updates and other-session sign-out; never present mock devices or mock login history as account security records.
- Mobile role education reads one role catalogue and generated triptych per role, so registration choices, destinations, plans, and help stories cannot drift.
- The Med ALL Business edge tab (`BusinessEdgeTab`) is the single global entry to the 10 roles and the classifieds board on web and app, reusing `RoleGrid`/`RoleStoryDialog`.
- Native back and the restored last screen go through `goBackSafe` and a once-per-launch restore, so Home and back never bounce to a saved screen.
