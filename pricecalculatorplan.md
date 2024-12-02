# Price Calculator Implementation Plan

## 1. Service Structure & Pricing

### Core Service Types
1. **2-Track Mixdown** ($50/song)
   - 1 Instrumental Track + Up to 4 Vocal Tracks
     - *Example: Main vocal, L/R doubles, adlibs*
     - Additional vocal tracks: +$5/track
   - *"Perfect for finished instrumentals or beats with vocals"*
   - Basic EQ, compression, and stereo enhancement included
   - Basic autotune included if requested
   - **Optional Enhancement** (+$20/song):
     - Dynamic EQ for Problematic Frequencies
       - *Tooltip: "Adjust low-end resonance or vocal harshness"*
     - Stereo Imaging Adjustments
       - *Tooltip: "Enhance width and depth for a more immersive mix"*

2. **Group Stem Mixdown** ($75/song)
   - *"Ideal for bands and multi-track productions"*
   - Stems grouped by instrument categories (e.g., Drums, Vocals, Guitars)
   - Individual processing per group
   - Advanced routing and effects control
   - Beat/Instrument Timing Adjustments available

3. **Full Stem Mixdown** ($100/song)
   - *"Maximum control and precision"*
   - Individual tracks for each instrument and element
   - Detailed processing per instrument
   - Complex effect chains and automation
   - Full timing and processing control

4. **Consultation & Feedback** ($50/session)
   - *"For DIY mixers seeking professional guidance"*
   - Detailed feedback on your mix
   - Improvement suggestions
   - Reference comparisons

   ### Consultation & Feedback Service
- **Session Format**:
  - One-hour detailed review
  - Live Discord session
  - Written summary provided
- **Focus Areas**:
  - Mix balance analysis
  - Processing recommendations
  - Technical improvements
  - Creative suggestions
- **Follow-up**:
  - Implementation guidance
  - Progress tracking
  - Additional sessions as needed 

5. **Mastering Only** (Custom pricing)
   - *"For externally mixed tracks"*
   - Streaming platform optimization
   - Separate pricing structure

### Track Preparation Options
1. **Self-Preparation** (Save $20/song)
   - Follow track preparation guidelines:
     - Clearly labeled tracks
     - Proper grouping
     - Correct export settings (16-bit wav is ok, as long as it's not clipping)
     - Basic cleanup completed
   - *Link to Track Preparation Guide*

2. **Professional Organization** (+$20/song)
   - We handle everything:
     - Track organization & labeling
     - Proper stem grouping
     - Comping and take management
     - Basic cleanup & preparation
   - Recommended for:
     - First-time clients
     - Complex projects
     - Unsure about requirements

### Feature Sets
1. **Vocal Processing** *(if vocals present)*
   - **Basic Autotune**
     - Included free with any package
     - *Tooltip: "Standard pitch correction for modern sound"*
     - Can be combined with manual tuning
   
   - **Manual Pitch Correction** (Melodyne)
     - $10/vocal track
     - Natural-sounding results
     - Can be combined with autotune for style
     - *Tooltip: "Perfect pitch while maintaining natural sound"*

   - **Layer/Harmony Options**
     - **Layer Timing Alignment**
       - $10/vocal track
       - *Tooltip: "Perfect sync between all vocals"*
     - **Artificial Harmonies/Doubles** (+$20/song)
       - Includes creation of harmony/double tracks
       - *Tooltip: "Professional harmony creation"*

2. **Audio Restoration & Cleanup** (+$30/song package)
   - **Restoration/Noise Reduction**
     - *Tooltip: "Remove background noise, hum, and interference"*
   - **Reverb Reduction**
     - *Tooltip: "Minimize room sound for poorly recorded tracks"*
   - **Audio De-Breathing** (Vocal tracks only)
     - *Tooltip: "Reduce vocal breaths for cleaner recordings"*
   - **Plosive and Sibilance Control** (Vocal tracks only)
     - *Tooltip: "Advanced de-essing and plosive removal"*
   - **Spectral Repair**
     - *Tooltip: "Remove specific unwanted sounds like clicks, coughs, or hums"*

3. **Creative Services**
   - **Creative Arrangement Suggestions**
     - *Tooltip: "Restructure elements to improve song flow and impact"*
   - **Real-Time Feedback Sessions** (+$15/session)
     - *Tooltip: "Collaborate live via Discord to finalize mix decisions"*

### Additional Services
1. **Mastering**
   - Free with any mixdown service
   - Optimized for streaming platforms (following AES guidelines)
   - Different pricing for:
     - Tracks mixed by us (included free)
     - Externally mixed tracks (separate service)
   - *Link to Mastering Policy page*

2. **Stem Organization** (+$20/song)
   - Waivable with proper preparation
   - *Link to Track Preparation Guide*
   - Checklist for waiver requirements

3. **Rush Orders**
   - +25% of total cost
   - 48-hour turnaround time

### Pricing Logic
1. **Base Rates**
   - 2-Track: $50/song
   - Group Stem: $75/song
   - Full Stem: $100/song

2. **Feature Pricing** (Per Song)
   - Instrumental Enhancement: +$20 (2-track only)
   - Pitch Correction: +$25
   - Artificial Harmonies: +$20
   - Audio Restoration Package: +$30

3. **Bulk Discounts**
   - 5+ songs: 10% off total
   - 10+ songs: 20% off total

## 2. User Interface Flow

### Service Selection Process
1. **Initial View**
   - Prominent total price display at top
   - Three main service panels horizontally arranged
   - Real-time price breakdown visible

2. **Selection Flow**
   - Click expands chosen service panel
   - Others slide away with animation
   - "Last Track" button appears
   - Number of songs slider shows

3. **Feature Selection**
   - Dynamic questions based on service type
   - Conditional options (e.g., vocal features)
   - Real-time price updates
   - Back/Forward navigation

### Animation Specifications
1. **Panel Transitions**
   - Unselected panels slide left with ease-out
   - Selected panel expands smoothly
   - "Last Track" button fades in

2. **Navigation Effects**
   - Forward: Options fade right-to-left
   - Backward: Reverse animation
   - Price updates with smooth transitions

## 3. Technical Implementation

### Directory Structure
```
/resources/pricecalculator/
├── index.html         # Main calculator page
├── calculator.js      # Calculator logic
├── style.css         # Calculator-specific styles
└── README.md         # Documentation
```

### State Management
- Track user's position in flow
- Maintain selection history
- Enable back/forward navigation

### Animation System
- CSS transitions for simple animations
- GSAP for complex panel movements
- Smooth state transitions

### Integration Points
- Bottom drawer navigation link
- Resource page card
- CTAs on relevant pages:
  - /getstarted
  - /services/vocal-mixing
  - /services/mastering
  - /resources/faq

## 4. Development Phases

### Phase 1: Core Structure & Design
1. Base directory setup
2. HTML Structure:
   - Basic layout
   - Breadcrumb navigation
   - Bottom drawer integration
   - Meta tags and Schema.org markup
3. Core CSS:
   - Site style matching
   - Responsive layout
   - Component styling

### Phase 2: Calculator Logic
1. Calculator.js Setup:
   - Pricing constants
   - Calculation functions
   - Event listeners
   - Real-time updates
2. Error Handling:
   - User-friendly messages
   - Validation feedback
   - Error display

### Phase 3: UI Components & Interaction
1. Build Core Components:
   - Service panels
   - Expandable sections
   - Navigation system
   - Price display
2. Implement Features:
   - Panel animations
   - Flow navigation
   - Service selection
   - Real-time updates
3. Add Explanations:
   - Feature tooltips
   - Help text
   - Price breakdowns

### Phase 4: Integration & Testing
1. Site Integration:
   - Navigation links
   - Bottom drawer
   - CTA placement
2. Testing:
   - Cross-browser compatibility
   - Mobile responsiveness
   - Calculation accuracy
   - Navigation flow
3. Accessibility:
   - ARIA attributes
   - Screen reader support
   - Keyboard navigation 

