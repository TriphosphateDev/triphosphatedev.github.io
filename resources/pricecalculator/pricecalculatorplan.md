# Price Calculator Implementation Plan

## 1. Service Structure & Pricing

### Core Service Types
1. **2-Track Mixdown** ($50/song)
   - 1 Instrumental Track + Up to 4 Vocal Tracks
   - Professional EQ, Compression, & Spatial Effects
   - Reverb, Delay, & Stereo Enhancement
   - Basic Autotune Included
   - Optional Instrumental Enhancement (+$20/song)
     - Dynamic EQ & Problem Frequency Control
     - Advanced Stereo Imaging & Depth
     - Spatial Enhancement & Clarity

2. **Group Stem Mixdown** ($200/song)
   - Grouped instrument categories
   - Individual processing per group
   - Advanced routing and effects
   - Perfect for bands and multi-track productions

3. **Full Stem Mixdown** 
   - Redirects to dedicated service page
   - Custom pricing based on project scope
   - Complex project requirements
   - Detailed consultation needed

### Track Preparation Options
1. **Self-Preparation** (Save $20/song)
   - Follow track preparation guidelines
   - Proper labeling and organization
   - Basic cleanup completed
   - *Link to Track Preparation Guide*

2. **Professional Editing** (+$20/song)
   - Track organization & labeling
   - Proper stem grouping
   - Comping and take management
   - Basic cleanup & preparation

### Current Features
1. **Vocal Processing**
   - **Basic Autotune** (Included)
     - Standard pitch correction
     - Can combine with manual tuning
   
   - **Manual Pitch & Timing Correction**
     - $10/vocal track
     - Natural-sounding results
     - Precise timing adjustments
     - Per-track pricing

   - **Layer Alignment**
     - $10/aligned track
     - Perfect sync between vocals
     - Reference track + aligned tracks model

2. **Real-Time Studio Sessions** ($25/hour/song)
   - Live mix supervision via Discord
   - Creative direction during mixdown
   - Learn professional techniques
   - Direct feedback and adjustments
   - Available for both 2-Track and Group Stem
   - Selectable per song with counter interface
   - Screen sharing and voice chat enabled
   - Perfect for maintaining creative vision

### Planned Features
1. **Audio Restoration & Cleanup** (+$30/song package)
   - Noise Reduction
   - Reverb Reduction
   - De-Breathing
   - Plosive/Sibilance Control
   - Spectral Repair

2. **Creative Services**
   - **Artificial Harmonies/Doubles** (+$20/song)
     - Custom harmony creation
     - Natural-sounding doubles
     - Rap/vocal layering
   - Real-Time Feedback Sessions (+$15/session)

### Pricing Logic
1. **Base Rates**
   - 2-Track: $50/song
   - Group Stem: $200/song
   - Full Stem: Custom Quote (Separate Page)

2. **Per-Track Pricing**
   - Additional Vocal Tracks: +$5/track (beyond 4)
   - Manual Pitch Correction: +$10/track
   - Layer Alignment: +$10/aligned track
   - Real-Time Sessions: +$25/hour/song

3. **Bulk Discounts**
   - 5+ songs: 10% off total
   - 10+ songs: 20% off total

## 2. User Interface Flow

### Service Selection Flow
1. **Mix Type Selection**
   - Two main service panels (2-Track and Group Stem)
   - Full Stem redirects to dedicated page
   - Clear descriptions
   - Base price display
   - Real-time updates

2. **Track Preparation**
   - Self-prep vs Professional
   - Cost implications clear
   - Auto-advance to features

3. **Feature Selection**
   - Vocal track counter
   - Feature toggles with counters
   - Dynamic pricing updates
   - Error validation

4. **Finish & Summary**
   - Comprehensive service breakdown
   - Value-focused presentation
   - Detailed feature explanations
   - Next steps guidance

   #### Summary Components
   1. **Package Overview**
      - Selected service type with description
      - Number of songs
      - Base price breakdown
      - Included standard features

   2. **Selected Enhancements**
      - Vocal processing details
         - Number of tracks
         - Processing types
         - Expected outcomes
      - Real-time sessions schedule
      - Audio restoration scope
      - Track preparation method

   3. **Value Highlights**
      - Professional quality standards
      - Communication process
      - Revision policy
      - Learning opportunities
      - Technical specifications

   4. **Delivery & Timeline**
      - Expected turnaround
      - Session scheduling (if applicable)
      - File delivery format
      - Communication channels

   5. **Next Steps**
      - Clear call-to-action
      - Payment options
      - Project initiation process
      - Save/Print quote functionality

   #### Visual Design
   - Clean, organized layout
   - Prominent value propositions
   - Clear price breakdowns
   - Professional presentation
   - Print-friendly formatting

   #### Technical Requirements
   - Dynamic content population
   - State-based rendering
   - Print stylesheet
   - Quote saving functionality
   - Smooth navigation

### Navigation System
- Progress steps (Mix Type → Track Prep → Features → Finish)
- Back/Forward navigation
- Step validation
- Error handling

## 3. Technical Implementation

### Current Components
1. **Calculator Logic** (`calculator.js`)
   - Price calculations
   - Feature validation
   - State management
   - Discount logic

2. **UI Components**
   - Service panels
   - Track counters
   - Feature toggles
   - Price breakdown
   - Progress navigation

### Future Development
1. **Enhanced Features**
   - Audio restoration package
   - Instrumental enhancement options
   - Real-time consultation booking

2. **System Expansion**
   - Additional service types
   - More feature combinations
   - Enhanced pricing models

## 4. Maintenance & Updates

### Current Focus
1. **Bug Fixes**
   - Price calculation accuracy
   - Feature toggle behavior
   - Navigation reliability

2. **UI Improvements**
   - Price breakdown clarity
   - Feature selection flow
   - Mobile responsiveness

### Future Plans
1. **New Features**
   - Audio restoration package
   - Instrumental enhancement
   - Real-time consultation

2. **Integration Points**
   - Client dashboard connection
   - Project submission system
   - Payment processing


   General Disclaimer for the Calculator Page
"Every Mix, Every Artist, Every Song is Unique"
At TripMixes, we understand that no two tracks are the same. This quote calculator is designed to give you an interactive, rough estimate of what your mixing project might cost based on your selected features. It’s a tool to help you explore how the level of detail and enhancements in your mix can affect pricing.

During our free consultation, we’ll review your project’s specifics, discuss your goals, and identify areas where you might not need certain features, potentially saving you time and money. Think of this as a flexible starting point—not a rigid pricing sheet.

Pre-Quote Message
"Transparency Meets Flexibility"
Our quote calculator provides insight into how much work, time, and skill go into each element of your mix. However, it’s important to note:

These are rough estimates based on typical projects.
Some features may not apply to your specific track (e.g., manual pitch correction might not be needed for all vocal tracks).
Every quote is subject to adjustment after we review your project during the consultation.

Message Below the Generated Quote
"What This Quote Means"
This custom quote represents the estimated hours and work involved in enhancing your music based on your input. Here’s what to keep in mind:

Not Set in Stone: Some songs may require less work than estimated, and we’ll never overcharge for features or enhancements that aren’t needed.
Tailored to You: During the free consultation, we’ll assess your tracks and determine what’s necessary to achieve your vision. If something you selected isn’t needed, we’ll let you know—and adjust the price accordingly.
Flexible and Affordable: Our goal is to offer professional mixing services that meet your needs without exceeding your budget.
We’re committed to clarity, quality, and fairness in every project. Let’s work together to create something amazing!