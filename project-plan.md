# Opa Harry’s Herinneringen

A heartfelt, interactive web application to celebrate the life and memories of Opa Harry. This project lets family members explore a mosaic of his face made from countless family photos, zoom in to see individual memories, and discover personal quotes, audio clips, or videos shared by loved ones. The app grows over time as more memories are contributed.

## 🎯 Project Overview

**Purpose:**  
To create a digital memory archive for family members that is visually beautiful, interactive, and emotionally meaningful. The application allows users to:

- See a large mosaic portrait of Opa Harry composed of family photos.  
- Zoom in on the mosaic to discover individual photos.  
- Click on photos to reveal personal quotes, audio files, or videos.  
- Contribute additional memories via a submissions form, gradually filling the mosaic.  
- Experience a mobile-friendly interface from the start.  

**Audience:** Family members only.  
**Platform:** Web app hosted on a subdomain, accessible via modern browsers and mobile devices.  

## 🛠 Tech Stack

- **Frontend:** Vue.js — lightweight, mobile-friendly, and easy to deploy on shared hosting (Hostinger).  
- **Database:** Firestore — stores uploaded memories (photos, quotes, audio, video) and real-time updates.  
- **Zoomable Mosaic Library:** Flexible; suggestions include OpenSeadragon or custom Canvas/WebGL implementations.  
- **Animations & Interactivity:** GSAP (GreenSock Animation Platform) Business license available for advanced card flip and flying photo effects. CSS3 for simpler transitions.  
- **Media Playback:** HTML5 audio and video elements for interactive memory cards.  
- **Visual Design:** Black matte background (or gradient) with mosaic portrait layered on top, creating depth and focus on the memories.  

## 🚀 Phased Roadmap

**Phase 1: Minimum Viable Product (MVP)**

- Display Opa Harry’s face as a mosaic of cards.  
- Zoom functionality to reveal individual photos.  
- Empty cards for future memories, visually showing that the mosaic can grow.  
- Mobile-friendly design implemented from the start.  

*Emotional Touch:* Even in its MVP state, the mosaic symbolizes family connections and memories, starting with empty placeholders that hint at future contributions.  

**Phase 2: Interactive Cards & Memory Submissions**

- Clickable cards that flip to reveal quotes, audio recordings, or videos.  
- “Herinnering Delen” (Share a Memory) button opens a submission form.  
- Submitted content automatically populates the mosaic in real-time.  

*Technical Notes:* Firestore handles storing and retrieving memories; Vue.js manages interactive card components and real-time updates.  

*Emotional Touch:* Family members actively contribute memories, making the mosaic a living tribute that evolves over time.  

**Phase 3: Animation & Soundtrack**

- Flying photo animation on application start, forming the mosaic dynamically.  
- Smooth transitions when zooming or flipping cards.  
- Optional background soundtrack with mute/unmute button.  

*Technical Notes:* Animations will be implemented with GSAP Business license (premium features available). CSS3 for basic transitions. Audio integration via HTML5 `<audio>` element with controls. Black matte or gradient background creates theatrical, memorial atmosphere with mosaic layered on top.

*Emotional Touch:* Engaging animation and music evoke nostalgia and warmth, giving family members a more immersive experience of Opa Harry's memories.  

## 🎨 Visual Mockup / Layout Description

- **Background:** Deep black matte base (or subtle radial gradient) creates a theatrical, memorial atmosphere - like a gallery or exhibition space.
- **Mosaic View:** Large central image of Opa Harry's face composed of small square cards, layered on top of the dark background. The mosaic appears to float, creating depth and drawing focus to the memories.
- **Empty Cards:** Initially appear as subtle gray or faded placeholders against the dark background, gradually filled as memories are added.  
- **Zoom Interaction:** Scroll or pinch to zoom in, revealing individual photos clearly. Mobile pinch-to-zoom supported. Dark background remains stable while mosaic zooms.
- **Card Flip:** Clicking a card rotates it, revealing a quote, audio file, or video on the reverse side.
- **Submission Button:** Clearly labeled "Herinnering Delen" near the mosaic for easy access, designed to be visible against dark background.
- **Optional Animation:** On load, small cards fly from all directions against the dark backdrop, forming the face dynamically.  
- **Soundtrack Control:** Mute/unmute button located near the top corner of the page.  

## 📁 Features (Final Vision)

- Interactive, zoomable mosaic of Opa Harry’s face.  
- Clickable cards with multimedia memories: photos, quotes, audio, videos.  
- Real-time photo and memory submissions.  
- Mobile-first design.  
- Animated card fly-in on load (optional).  
- Background soundtrack with mute/unmute (optional).  
- Collaborative and evolving memory archive for family members.  

## ⚙️ Getting Started

**Prerequisites:**

- Web server or shared hosting (Hostinger).  
- Firebase project for Firestore database.  
- Vue.js development environment for building the frontend.  