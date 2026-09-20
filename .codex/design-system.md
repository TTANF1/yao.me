# Game Edition design system

## Creative direction

- Treat every page as a game screen, not a document with decorative cards.
- Inspiration: energetic JRPG menu composition — diagonal cuts, oversized type,
  ink-like black shapes, off-white paper, signal red, halftone texture.
- Do not copy Persona 5 logos, characters, exact menus, or proprietary artwork.
- Keep Yao's pixel character and original site content as the identity anchor.

## Global shell

- Header is a compact HUD. The homepage owns the primary navigation.
- Route navigation uses the whistling walk transition asset at
  `public/game/whistle-walk-source.png`.
- Reduced-motion users get immediate navigation without the crossing animation.
- Dark/light themes remain supported; red is the common signal color.

## Homepage

- Existing eight-frame desk animation is the main visual subject.
- Brief identity copy sits with the sprite, not in a conventional centered hero.
- Large, skewed, high-contrast menu occupies the other side of the composition.
- Mobile collapses into a vertical poster while retaining menu hierarchy.

## Notes

- Notes are mission-complete reports pinned to an irregular board.
- First click opens a large preview; a second explicit action opens the full report.
- Card rotations are deterministic to avoid hydration drift.

