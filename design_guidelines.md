# Design Guidelines: الزملاء Q&A App

## Design Approach
**Selected System:** Material Design 3 with educational adaptations
**Rationale:** Content-rich learning application requiring clear information hierarchy, familiar interaction patterns for young students, and robust RTL support.

## Core Design Elements

### Typography (RTL Arabic)
- **Primary Font:** Cairo (Google Fonts) - modern, highly readable Arabic typeface
- **Hierarchy:**
  - Headlines: Cairo Bold, 24-28px
  - Question titles: Cairo SemiBold, 18-20px
  - Body text: Cairo Regular, 16px
  - Metadata/timestamps: Cairo Regular, 14px, reduced opacity
- **Line height:** 1.6 for optimal Arabic readability

### Layout System
**Spacing Units:** Tailwind units 2, 4, 6, 8, 12, 16
- Component padding: p-4 to p-6
- Section spacing: space-y-4 to space-y-8
- Card gaps: gap-4
- Consistent 4-unit rhythm throughout

### RTL Considerations
- All layouts mirror: flex-row-reverse for horizontal layouts
- Text alignment: text-right as default
- Icons position: mr-* becomes ml-* throughout
- Navigation: positioned right-to-left

## Component Library

### Question List View
**Card Design:**
- Rounded corners (rounded-lg)
- Shadow: shadow-md with subtle elevation
- Structure (RTL):
  - Right side: Small thumbnail image (64x64px, rounded-md)
  - Center-left: Question title + metadata
  - Far left: Answer count badge
- Padding: p-4
- Gap between image and text: gap-4
- Hover state: subtle shadow increase

### Question Detail View
**Layout:**
- Large hero image at top (16:9 aspect ratio, rounded-lg, mb-6)
- Question title below image (text-2xl, mb-4)
- Metadata row: author info, timestamp, category tag
- Answer section: stacked cards with user avatars

### Navigation
**Top App Bar:**
- Fixed position with subtle shadow
- Height: h-16
- Contains: App title (الزملاء), search icon, user profile (RTL order)
- Search expands on tap

### Forms & Inputs
**Ask Question Form:**
- Large text area (min-h-32)
- Image upload zone with preview
- Category dropdown
- Submit button (prominent, right-aligned)

**Answer Input:**
- Medium text area (min-h-24)
- Inline submit button

### Data Display
**Answer Cards:**
- User avatar (right side, 40x40px)
- Username and timestamp
- Answer text with comfortable line-height
- Vote buttons (left side): thumbs up/down icons
- Border-r accent strip for accepted answers

### Navigation Patterns
**Bottom Tab Bar:**
- 4 tabs: الرئيسية (Home), أسئلتي (My Questions), إشعارات (Notifications), الملف الشخصي (Profile)
- Icons above labels
- Active state: filled icons + blue accent

## Student-Friendly Enhancements
- **Large Touch Targets:** Minimum 44x44px for all interactive elements
- **Playful Micro-interactions:** Gentle bounce on button press, smooth image transitions
- **Achievement Badges:** Small celebratory icons for helpful answers
- **Reading Support:** Generous spacing, clear hierarchy, digestible chunks

## Images Section

### Hero Image: No traditional hero section
This is a utility app - launches directly into question feed.

### Image Usage:
**Question List Thumbnails:**
- Size: 64x64px square
- Position: Right side of each card
- Style: Rounded corners (rounded-md)
- Content: User-uploaded images related to questions, fallback to category icons

**Question Detail Images:**
- Size: Full-width container, 16:9 aspect ratio (approx 800x450px on desktop)
- Position: Top of detail view, above question text
- Style: Rounded-lg corners, subtle shadow
- Content: Full resolution version of question image

**User Avatars:**
- Size: 40x40px in answer cards, 32x32px in metadata
- Style: Circular (rounded-full)
- Default: Colorful gradient circles with initials

## Animations
Minimal and purposeful:
- Page transitions: Gentle 200ms fade
- Image expansion: Smooth scale transition when opening questions
- Button feedback: Subtle scale (0.98) on press
- No autoplay or distracting motion

---

**Key Differentiator:** This design prioritizes clarity and accessibility for young Arabic-speaking students while maintaining visual appeal through thoughtful spacing, gentle rounded corners, and a friendly yet focused learning environment.