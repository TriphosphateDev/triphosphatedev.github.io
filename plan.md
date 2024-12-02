Here’s a restructured plan for your price calculator, organized to reflect your updated service offerings and provide clarity for potential clients:

Based on this price calculator model: ext\pricecalc

---

### **Core Axes for Calculation**
1. **Number of Songs** (Horizontal Axis)  
   - 1–10+ songs.  

2. **Number of Tracks per Song** (Vertical Axis)  
   - **2-Track Mixdown**: Vocals + 1 Instrumental Track.  
   - **Group Stem Mixdown**: Stems grouped by instrument categories (e.g., Drums, Vocals, Guitars).  
   - **Full Stem Mixdown**: Individual tracks for each instrument and element.

---

### **Primary Services** (Checkbox Options)
#### **Mixing Services**  
- **Instrumental Enhancement** *(Only for 2-Track Mixdowns)*:  
  - **Dynamic EQ for Problematic Frequencies**: Adjust low-end resonance or vocal harshness.  
  - **Stereo Imaging Adjustments**: Enhance width and depth for a more immersive mix.  

- **Beat/Instrument Timing Adjustments** *(Group or Full Stem Mixdowns)*: Fix timing inconsistencies in live or sequenced instrumentals.  

#### **Vocal Editing**  *(only if it has vocals)*
- **Pitch Correction (Melodyne)**: Manual, transparent tuning for natural-sounding vocals.  
- **Artificial Harmonies/Doubling**: Create harmonies and layered vocal textures using advanced techniques.  
- **Vocal Layer Timing Alignment**: Ensure multiple vocal layers (e.g., harmonies, adlibs) are perfectly synced.  

#### **Audio Restoration & Cleanup** *(All Mix Types)*  
- **Restoration/Noise Reduction**: Remove background noise and hum.  
- **Reverb Reduction**: Minimize room sound for poorly recorded tracks.  
- **Audio De-Breathing**: Reduce vocal breaths for cleaner recordings.  
- **Plosive and Sibilance Control**: Advanced de-essing and plosive removal.  
- **Spectral Repair**: Remove specific unwanted sounds like clicks, coughs, or hums using tools like iZotope RX.  

#### **Creative Services**  
- **Creative Arrangement Suggestions**: Restructure elements to improve song flow and impact.  
- **Real-Time Feedback Sessions**: Collaborate live via Discord or similar tools to finalize mix decisions.  

---

### **Mastering Services** *(Mastering will always be included with a mixdown for free if they want it)*
- **Standalone Mastering** *(Link to Mastering Policy)*:  
  - Achieve loudness and clarity tailored for streaming platforms.  
  - Special pricing for tracks I’ve mixed versus externally mixed tracks.  

---

### **Optional Add-Ons** (Checkbox or Dropdown Options)
1. **Stems Organization Service**: Organize and label chaotic stems before mixing begins.  
2. **Consultation & Feedback for DIYers**: Standalone feedback or guidance for improving your own mixes.  
3. **Rush Order**: Expedited delivery for an additional 25% of the total cost.  
4. **Bulk Discounts**: Automatically applied for albums or multiple songs.  

---

### **Pricing Logic**
1. **Base Price per Song**:
   - **2-Track Mixdown**: $X per song.  
   - **Group Stem Mixdown**: $X + $Y (group complexity fee).  
   - **Full Stem Mixdown**: $X + $Z (detailed complexity fee).  

2. **Feature Pricing** (Per Song/Track):  
   - Instrumental Enhancement: +$20 for 2-track mixdowns.  
   - Vocal Pitch Correction: +$25 per song.  
   - Audio Restoration (All Features): +$30 per song.  
   - Artificial Harmonies/Doubling: +$20 per song.  
   - Real-Time Feedback: +$15 per session.  

3. **Add-On Pricing**:  
   - Stems Organization Service: +$20 per song (waivable with proper preparation).  
   - Consultation & Feedback: +$50 flat fee per session.  

---

### **UI Adjustments**
- **Feature-Based Checkboxes**: Allow clients to select specific services per song.  
- **Dynamic Cost Updates**: The total cost should automatically update based on the number of songs, tracks, and selected features.  
- **Bulk Discount Logic**: Apply a percentage discount (e.g., 10% for 5+ songs, 20% for 10+ songs).  
- **Smart Stem Organization Handling**:
  - Interactive checklist for track preparation status
  - Auto-toggle stem organization fee based on checklist
  - Clear tooltips explaining requirements
  - Direct links to Track Preparation Guide
  - Visual feedback on preparation status

---

### **Implementation Plan**

1. **Directory Structure**  
   ```
   /resources/pricecalculator/
   ├── index.html         # Main calculator page
   ├── calculator.js      # Calculator logic
   ├── style.css         # Calculator-specific styles
   └── README.md         # Documentation   ```

2. **Integration Points**
   - Add calculator link to bottom drawer navigation under "Quick Links"
   - Add calculator card to main resources page
   - Add CTAs on relevant pages:
     - /getstarted
     - /services/vocal-mixing
     - /services/mastering
     - /resources/faq

3. **Technical Implementation**
   - Use existing site's styling framework and components
   - Implement responsive design matching site's aesthetic
   - Use client-side JavaScript for real-time calculations
   - Store pricing constants in a separate config file for easy updates

4. **UI Components**
   - Horizontal slider for number of songs (1-10+)
   - Dropdown for mixdown type selection
   - Checkbox groups for services, organized by category
   - Dynamic total calculation with bulk discount display
   - Mobile-friendly input controls
   - Clear visual hierarchy matching site's design

### **Integration Notes**
- Match existing site's dark theme and purple accent colors
- Use consistent typography (Montserrat font)
- Implement keyboard navigation like other pages
- Add proper meta tags and Schema.org markup
- Include breadcrumb navigation
- Add bottom drawer consistent with other pages

### **Analytics Integration** BACKBURNER WILL PROBABLY IMPLEMENT CALCULATOR FIRST AND COME BACK TO THIS
- Track calculator usage with existing Google Analytics
- Track specific feature selection patterns
- Monitor conversion rates from calculator to consultation requests

---

+ ### **Implementation Phases**
+ 
+ #### **Phase 1: Core Structure & Design**
+ 1. Create base directory structure
+ 2. Set up index.html with:
+    - Basic layout matching site theme
+    - Breadcrumb navigation
+    - Bottom drawer integration
+    - Meta tags and Schema.org markup
+ 3. Implement core CSS:
+    - Match existing site styles
+    - Responsive layout structure
+    - Component styling (sliders, checkboxes, etc.)
+ 
+ #### **Phase 2: Calculator Logic**
+ 1. Create calculator.js with:
+    - Base pricing constants
+    - Core calculation functions
+    - Event listeners for inputs
+    - Real-time update handlers
+ 2. Implement:
+    - Base price calculations
+    - Feature price additions
+    - Bulk discount logic
+    - Total price updates
+ 3. Add Error Handling:
+     - User-friendly error messages
+     - Validation feedback mechanism
+     - Error display in UI
+ 
+ #### **Phase 3: UI Components & Interaction**
+ 1. Build and style:
+    - Prominent total price display at top
+    - Three main service panels with animations
+    - Expandable panel system
+    - "Last Track" navigation
+    - Dynamic service flow UI
+ 2. Implement Stem Organization UI:
+     - Track preparation checklist component
+     - Auto-toggle fee mechanism
+     - Integration with Track Preparation Guide
+     - Tooltip and help text system
+ 3. Add Feature Explanations:
+     - Tooltips for each feature
+     - Help text for mixdown types
+     - Clear labeling for flat fees vs per-song fees
+ 4. Implement:
+     - Panel expansion and slide animations
+     - Flow-based navigation system
+     - Service selection wizard
+     - Real-time updates
+     - Mobile responsiveness
+     - Keyboard navigation
+     - Input validation
+ 5. Add Price Breakdown Display:
+     - Prominent total at top of page
+     - Show base price calculation
+     - List selected features and costs
+     - Display applied discounts
+     - Show flat fee additions
+ 
+ #### **Phase 4: Integration & Testing**
+ 1. Site Integration:
+    - Add navigation links
+    - Update bottom drawer
+    - Add CTAs on relevant pages
+ 2. Testing:
+    - Cross-browser testing
+    - Mobile device testing
+    - Calculation accuracy verification
+    - Navigation testing
+ 3. Accessibility Testing:
+     - ARIA attribute verification
+     - Screen reader compatibility
+     - Keyboard navigation testing
+ 
+ #### **Phase 5: Analytics & Launch** BACKBURNER WILL PROBABLY IMPLEMENT CALCULATOR FIRST AND COME BACK TO THIS
+ 1. Analytics Setup:
+    - Add event tracking
+    - Set up conversion tracking
+    - Implement usage analytics
+ 2. Final Steps:
+    - Documentation updates
+    - Performance optimization
+    - SEO verification
+    - Launch and monitoring
+ 
+ ---
+ 
+ ### **Timeline Estimate**
+ - Phase 1: 1-2 days
+ - Phase 2: 2-3 days
+ - Phase 3: 2-3 days
+ - Phase 4: 1-2 days
+ - Phase 5: 1 day
+ 
+ Total estimated time: 7-11 days
+ 
+ ---
+ 
+ ### **Service Selection Flows**
+ 
+ #### **1. Primary Service Selection & Display**
+ - Large, prominent total price display at top
+ - Three main service panels (horizontally arranged):
+   - **2-Track Mixdown** ($50/song)
+     - *"Perfect for finished instrumentals or beats with vocals"*
+     - One instrumental track + one vocal track
+     - Basic EQ, compression, and stereo enhancement included
+ 
+   - **Group Stem Mixdown** ($75/song)
+     - *"Ideal for bands and multi-track productions"*
+     - Grouped instrument categories (drums, vocals, etc.)
+     - Individual processing per group
+     - Advanced routing and effects control
+ 
+   - **Full Stem Mixdown** ($100/song)
+     - *"Maximum control and precision"*
+     - Individual tracks for every element
+     - Detailed processing per instrument
+     - Complex effect chains and automation
+ 
+ #### **2. Interactive Flow Logic**
+ 
+ **2-Track Mixdown Flow:**
+ 1. Initial Selection:
+    - Panel expands with detailed explanation
+    - Others slide away with "Last Track" button appearing
+    - Number of songs slider appears
+ 
+ 2. Instrumental Enhancement Option (+$20/song):
+    - **Dynamic EQ Processing**
+      - *Tooltip: "Surgical frequency adjustments to fix resonance issues"*
+      - *Tooltip: "Tame harsh frequencies while preserving clarity"*
+    - **Stereo Enhancement**
+      - *Tooltip: "Widen and deepen the stereo image"*
+      - *Tooltip: "Create a more immersive listening experience"*
+ 
+ 3. Vocal Processing Flow:
+    - **Pitch Correction (Melodyne)** (+$25/song)
+      - *Tooltip: "Manual, transparent tuning for natural-sounding results"*
+      - *Tooltip: "No robotic artifacts or artificial sound"*
+ 
+    - **Layer/Harmony Check:**
+      - Existing Layers?
+        - If yes: How many? (Warning if >5: "Consider Group Stem option")
+        - If no: Offer Artificial Harmonies (+$20/song)
+          - *Tooltip: "Professional harmony creation"*
+          - *Tooltip: "Custom-designed vocal layers"*
+ 
+    - **Layer Timing Alignment**
+      - *Tooltip: "Perfectly sync multiple vocal takes"*
+      - *Tooltip: "Ensure tight timing between harmonies and doubles"*
+ 
+ **Group/Full Stem Flow:**
+ 1. Initial Selection:
+    - Expanded panel with stem organization guide
+    - Number of songs slider
+ 
+ 2. Track Type Identification:
+    - Vocals Present? (Yes/No)
+      - If Yes: Access to all vocal processing options
+        - **Pitch Correction** (+$25/song)
+          - *[Same tooltips as 2-Track]*
+        - **Layer Processing**
+          - *[Same tooltips as 2-Track]*
+ 
+      - If No: Focus on instrumental options
+        - **Beat/Instrument Timing** (+$20/song)
+          - *Tooltip: "Fix timing inconsistencies in live recordings"*
+          - *Tooltip: "Tighten up sequenced instruments"*
+ 
+ **Common Features Available to All Types:**
+ - **Audio Restoration & Cleanup** (+$30/song package)
+   - **Noise Reduction**
+     - *Tooltip: "Remove background noise, hum, and interference"*
+   - **Reverb Reduction**
+     - *Tooltip: "Minimize unwanted room sound"*
+   - **De-Breathing** (Vocal tracks only)
+     - *Tooltip: "Reduce distracting breath sounds"*
+   - **De-Essing & Plosive Control** (Vocal tracks only)
+     - *Tooltip: "Smooth out harsh S sounds and pops"*
+   - **Spectral Repair**
+     - *Tooltip: "Remove coughs, clicks, and unwanted sounds"*
+ 
+ #### **3. Price Display & Breakdown**
+ - Prominent total at top
+ - Real-time updating breakdown:
+   - Base price per service type
+   - Selected features with individual costs
+   - Number of songs
+   - Bulk discounts (automatically applied)
+     - 5+ songs: 10% off
+     - 10+ songs: 20% off
+   - Per-song costs vs flat fees clearly labeled
+ 
+ ### **Animation & Transition Specs**
+ 
+ #### **Panel Transitions**
+ - **Initial Panel Selection:**
+   - Unselected panels slide left with ease-out timing
+   - Selected panel expands smoothly
+   - "Last Track" button fades in
+ 
+ #### **Flow Navigation**
+ - **Forward Progress:**
+   - Current options fade out to right
+   - New options fade in from left
+ - **Backward Navigation:**
+   - Reverse animation for "Last Track"
+   - Restore previous state with history
+ 
+ #### **Price Updates**
+ - Smooth number transitions
+ - Highlight changes briefly
+ - Fade in/out for feature prices
+ 
+ ### **Technical Implementation**
+ - **State Management:**
+   - Track user's position in flow
+   - Maintain selection history
+   - Enable back/forward navigation
+ 
+ - **Animation System:**
+   - CSS transitions for simple animations
+   - GSAP for complex panel movements
+   - Smooth state transitions
+ 
+ - Use existing site's styling framework and components
+ - Implement responsive design matching site's aesthetic
+ - Use client-side JavaScript for real-time calculations
+ - Store pricing constants in a separate config file for easy updates

