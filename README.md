# Opa Harrie's Herinneringen

> *Een liefdevolle digitale herinnering aan Opa Harrie*

A heartfelt, interactive web application to celebrate the life and memories of Opa Harrie. Family members can explore a beautiful mosaic of his face made from countless family photos, zoom in to see individual memories, and discover personal quotes, audio clips, or videos shared by loved ones.

## 🎯 Project Overview

This memorial application features:
- **Interactive Photo Mosaic**: Opa Harrie's portrait composed of family memories
- **Zoomable Interface**: Explore individual photos up close
- **Multimedia Memories**: Photos, quotes, audio recordings, and videos
- **Family Contributions**: Upload and share new memories
- **Beautiful Design**: Black matte background with elegant, memorial-appropriate styling
- **Mobile-First**: Fully responsive and touch-friendly

## 🛠 Tech Stack

- **Frontend**: Vue.js 3 with TypeScript
- **Database**: Firebase Firestore (test mode)
- **Storage**: Firebase Storage for media files
- **Animations**: GSAP Business (premium features available)
- **Build Tool**: Vite
- **Styling**: CSS3 with custom design system

## 📁 Project Structure

```
opa_harries_herinneringen/
├── frontend/              # Vue.js application
│   ├── src/
│   │   ├── assets/       # Styles and static assets
│   │   ├── components/   # Vue components
│   │   ├── views/        # Page views
│   │   ├── stores/       # Pinia state management
│   │   ├── router/       # Vue Router configuration
│   │   └── config/       # Firebase and app configuration
│   ├── public/           # Public static files
│   └── DESIGN_NOTES.md   # Visual design documentation
├── project-plan.md       # Overall project plan and vision
├── tasks.md              # Development task breakdown
└── README.md             # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v20.19.0 or v22.12.0+)
- Firebase project with Firestore and Storage enabled
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd opa_harries_herinneringen
   ```

2. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Configure Firebase**
   - Copy `.env.example` to `.env`
   - Fill in your Firebase credentials (see `frontend/README.md` for details)

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   - Navigate to `http://localhost:5173` (or the URL shown in terminal)

## 📋 Development Roadmap

See [`tasks.md`](./tasks.md) for detailed development tasks.

### Phase 0: Setup ✅ (In Progress)
- [x] Clean up Vue boilerplate
- [x] Set up Firebase configuration
- [ ] Project documentation

### Phase 1: MVP - Basic Mosaic Display
- [ ] Design system & base styles
- [ ] Firebase integration
- [ ] Basic mosaic component
- [ ] Zoom functionality

### Phase 2: Interactive Cards & Memory Submissions
- [ ] Card flip interactions
- [ ] Memory content display
- [ ] Submission form
- [ ] Real-time updates

### Phase 3: Animations & Polish
- [ ] Flying photo animation (GSAP)
- [ ] Smooth transitions
- [ ] Background soundtrack
- [ ] Accessibility improvements

### Phase 4: Deployment
- [ ] Performance optimization
- [ ] Testing across devices
- [ ] Production build
- [ ] Deploy to Hostinger

## 🎨 Design Philosophy

The application uses a **black matte background** with a subtle gradient to create a theatrical, gallery-like atmosphere. This design:
- Creates focus on the memories
- Evokes a sense of memorial and remembrance
- Makes photos stand out beautifully
- Provides depth through layering

See [`frontend/DESIGN_NOTES.md`](./frontend/DESIGN_NOTES.md) for detailed visual design documentation.

## 🔒 Privacy & Access

- **Family-Only**: No authentication required; URL privacy is the security model
- **Test Mode**: Firestore runs in test mode (consider tightening rules for production)
- **Private URL**: Keep the deployment URL private and share only with family

## 📝 License

See [LICENSE](./LICENSE) file for details.

## 💝 About

This project is a labor of love, created to honor and remember Opa Harrie. Every photo, quote, and memory shared here helps keep his spirit alive in the hearts of those who loved him.

---

*Met liefde gemaakt voor de familie* ❤️

