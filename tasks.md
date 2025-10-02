# Opa Harry's Herinneringen - Development Tasks

## 🏁 Phase 0: Project Setup & Cleanup ✅

### Task 0.1: Clean Up Vue Boilerplate ✅
- [x] Remove unnecessary demo components:
  - [x] Delete `HelloWorld.vue`
  - [x] Delete `TheWelcome.vue`
  - [x] Delete `WelcomeItem.vue`
  - [x] Delete all icon components in `components/icons/`
- [x] Remove demo views:
  - [x] Delete `AboutView.vue`
  - [x] Keep `HomeView.vue` but remove demo content
- [x] Clean up `App.vue`:
  - [x] Remove demo header, logo, and navigation
  - [x] Keep only essential RouterView
  - [x] Remove boilerplate styling
- [x] Clean up router:
  - [x] Remove `/about` route
  - [x] Keep only home route
- [x] Remove demo assets:
  - [x] Delete `logo.svg`
- [x] Review and clean up base CSS files
  - [x] Keep useful CSS variables and reset styles
  - [x] Remove demo-specific styles

### Task 0.2: Project Configuration ✅
- [x] Update `package.json` name and description
- [x] Create `.env` and `.env.example` files for Firebase configuration
- [x] Set up Firebase configuration in project (test mode - no auth needed)
- [x] Document required environment variables
- [x] Add `.env` to `.gitignore` if not already present

### Task 0.3: Project Documentation ✅
- [x] Create main `README.md` for the project root
- [x] Update frontend `README.md` with project-specific info
- [x] Document local development setup instructions

---

## 📐 Phase 1: MVP - Basic Mosaic Display

### Task 1.1: Design System & Base Styles (Partially Complete)
- [x] Define color palette (black & white memorial theme)
- [x] Implement black matte background or gradient design
- [x] Design mosaic to layer on top of background for depth
- [ ] Define typography (emotional, memorial-appropriate font for Dutch text)
- [x] Create CSS variables for theme
- [x] Set up responsive breakpoints
- [ ] Create base component styles

### Task 1.2: Firebase Integration ✅
- [x] Install Firebase SDK (`npm install firebase`)
- [x] Configure Firebase in Vue app (connect to existing test mode database)
- [x] Enable Firebase Storage for media files
- [x] Create Firestore collections structure:
  - [x] `memories` collection schema (simplified - no settings needed)
- [x] Test Firebase connection

### Task 1.3: Data Models & Types ✅
- [x] Create TypeScript interfaces for:
  - [x] Memory (photo + typeInput structure)
  - [x] Mosaic configuration
  - [x] User submission
- [x] Create Pinia store for memories
- [x] Create Pinia store for mosaic configuration
- [x] Create Pinia store for UI state (zoom level, selected card)

### Task 1.4: Basic Mosaic Component ✅
- [x] Create `MosaicGrid.vue` component
- [x] Calculate grid dimensions based on reference photo aspect ratio
- [x] Implement CSS Grid layout for cards
- [x] Create `MemoryCard.vue` component
- [x] Display empty cards with background colors from reference photo analysis
- [x] Add hover state for empty cards (foundation for "Add Memory" feature)
- [x] Make cards responsive (square, scales for mobile/desktop)
- [x] Ensure mosaic recreates reference photo when viewed from distance
- [x] Add basic styling for cards with subtle borders
- [x] Create separate test route for testing different images

### Task 1.5: Mosaic Image Integration (Photomosaic Algorithm - Option A) ✅
- [x] Add reference photo to project (hardcoded initially)
- [x] Create utility function to analyze reference photo using Canvas API
- [x] Extract average color (RGB) for each grid position
- [x] Calculate brightness values for contrast
- [x] Store card color data in memory (not Firestore - simplified)
- [x] Implement algorithm to divide image into grid sections
- [x] Implement automatic grid dimension calculation based on aspect ratio
- [x] Test color extraction accuracy
- [x] Ensure reference photo is not directly displayed (only recreated through cards)

### Task 1.6: Zoom Functionality - Basic ✅
- [x] Research and select zoom library (Panzoom - lightweight & performant)
- [x] Implement basic zoom in/out controls
- [x] Add pinch-to-zoom for mobile
- [x] Implement scroll-to-zoom for desktop
- [x] Add zoom control buttons (zoom in/out/reset)
- [x] Ensure card visibility at different zoom levels

### Task 1.7: Home View Setup ✅
- [x] Update `HomeView.vue` to display mosaic
- [x] Add basic layout structure
- [x] Integrate mosaic component
- [x] Add loading states for data fetching
- [x] Test responsive behavior
- [x] Create config generator for performance optimization

---

## 🎴 Phase 2: Interactive Cards & Memory Submissions

### Task 2.1: Card Flip Interaction ✅
- [x] Implement CSS 3D flip animation
- [x] Add click handler to flip cards
- [x] Design card back layout (for memory content)
- [x] Add close/flip-back functionality
- [x] Ensure smooth animation performance
- [x] Gallery-style modal with navigation arrows
- [x] Keyboard navigation (←/→/ESC/Space)

### Task 2.2: Memory Card Content Display ✅
- [x] Create components for different memory types:
  - [x] `QuoteDisplay.vue` - display text/quotes
  - [x] `AudioPlayer.vue` - audio player
  - [x] `VideoPlayer.vue` - video player
- [x] Implement media loading states
- [x] Add error handling for failed media loads
- [x] Optimize media display for mobile
- [x] Gallery modal with flip functionality
- [x] Empty card click opens submission form

### Task 2.3: Firestore Integration - Read ✅
- [x] Create service/composable for Firestore queries
- [x] Implement real-time listener for memories
- [x] Load memories into Pinia store
- [x] Map memories to mosaic cards
- [x] Handle empty states gracefully

### Task 2.4: Memory Submission Form - UI ✅
- [x] Create `SubmissionForm.vue` component
- [x] Design form layout:
  - [x] File upload (photo/video)
  - [x] Text input (quote/message)
  - [x] Audio file upload
  - [x] Submitter name (optional)
- [x] Add "Herinnering Delen" button to main view
- [x] Implement modal/drawer for submission form
- [x] Add form validation
- [x] Style form with theme
- [x] Make type selection optional (photo-only submissions)

### Task 2.5: Memory Submission Form - Functionality ✅
- [x] Implement file upload to Firebase Storage
- [x] Handle different media types (image, video, audio)
- [ ] Add audio recording functionality (future enhancement)
- [x] Implement form submission to Firestore
- [x] Add loading states during submission
- [x] Show success/error messages
- [x] Clear form after successful submission

### Task 2.6: Real-time Updates ✅
- [x] Implement real-time listener for new memories
- [x] Update mosaic when new memory is added
- [ ] Add subtle notification for new memories (future enhancement)
- [ ] Test concurrent submissions (ready for testing)

---

## ✨ Phase 3: Animations & Polish

### Task 3.1: Flying Photo Animation
- [ ] Install GSAP Business (license available)
- [ ] Design animation sequence (photos flying in)
- [ ] Implement GSAP-powered animation on app load
- [ ] Utilize GSAP premium features (MorphSVG, DrawSVG, etc. if needed)
- [ ] Add option to skip animation
- [ ] Optimize animation performance
- [ ] Test on mobile devices
- [ ] Add preload/loading screen

### Task 3.2: Transition Animations
- [ ] Add smooth zoom transitions (GSAP or CSS3)
- [ ] Enhance card flip animation with GSAP
- [ ] Add hover effects (desktop) with subtle depth/parallax
- [ ] Implement page transitions
- [ ] Add subtle micro-interactions
- [ ] Ensure animations work well against dark background

### Task 3.3: Background Soundtrack
- [ ] Select/create background music
- [ ] Implement HTML5 audio player
- [ ] Create mute/unmute button
- [ ] Add volume control
- [ ] Persist audio preference (localStorage)
- [ ] Ensure audio doesn't autoplay (UX best practice)

### Task 3.4: Advanced Zoom Features
- [ ] Implement smooth zoom to specific cards
- [ ] Add "zoom to fit" button
- [ ] Implement double-tap to zoom (mobile)
- [ ] Add zoom constraints (min/max)
- [ ] Improve zoom performance

### Task 3.5: Accessibility
- [ ] Add ARIA labels to interactive elements
- [ ] Ensure keyboard navigation works
- [ ] Test screen reader compatibility
- [ ] Add focus indicators
- [ ] Ensure color contrast meets WCAG standards
- [ ] Add alt text for images

### Task 3.6: Loading & Error States
- [ ] Create loading spinner/skeleton screens
- [ ] Design error state components
- [ ] Implement retry mechanisms
- [ ] Add offline detection
- [ ] Show graceful degradation messages

---

## 🚀 Phase 4: Deployment & Optimization

### Task 4.1: Performance Optimization
- [ ] Implement lazy loading for images
- [ ] Optimize media file sizes
- [x] Add image compression for uploads (max 1920px, 85% quality, 2MB target)
- [ ] Implement code splitting
- [ ] Optimize bundle size
- [ ] Add service worker for caching (PWA)

### Task 4.2: Testing
- [ ] Test on various devices (iOS, Android, desktop)
- [ ] Test on various browsers
- [ ] Test with slow network conditions
- [ ] Test with large number of memories
- [ ] User acceptance testing with family

### Task 4.3: Security & Privacy
- [ ] Review Firestore security rules (currently test mode - consider tightening later)
- [ ] Add file upload size limits
- [ ] Validate file types (images, video, audio only)
- [ ] Add rate limiting for submissions (prevent abuse)
- [ ] Document that site URL should remain private (no auth = URL is the security)

### Task 4.4: Deployment to Hosting
- [ ] Run production build (`npm run build`)
- [ ] Test production build locally (`npm run preview`)
- [ ] Update Firebase configuration for production domain
- [ ] Upload dist files to Hostinger
- [ ] Test deployed application
- [ ] Verify Firebase connection in production
- [ ] Ensure SSL is working

### Task 4.5: Documentation & Handoff
- [ ] Create user guide for family members
- [ ] Document how to add memories
- [ ] Create admin guide (if needed)
- [ ] Document deployment process
- [ ] Create troubleshooting guide

---

## 🎁 Future Enhancements (Optional)

- [ ] Add search functionality for memories
- [ ] Implement filtering (by person, date, type)
- [ ] Add comments on memories
- [ ] Create slideshow mode
- [ ] Add download/share individual memories
- [ ] Implement "memory of the day" feature
- [ ] Add statistics (total memories, contributors)
- [ ] Create timeline view
- [ ] Add multilingual support (Dutch/English)
- [ ] Implement family tree integration

---

## 📝 Notes

- **Priority**: Focus on mobile-first design throughout all phases
- **Testing**: Test each phase on mobile devices before moving to next phase
- **Feedback**: Get family feedback after each major phase
- **Emotional Touch**: Keep the emotional and memorial aspect in mind for all design decisions
- **GSAP License**: GSAP Business license available for premium animation features
- **Visual Hierarchy**: Dark matte background creates theatrical atmosphere, mosaic portrait layers on top as focal point

