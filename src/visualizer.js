class AudioVisualizer {
    constructor() {
        if (!window.AudioContext && !window.webkitAudioContext) {
            console.error('Web Audio API not supported');
            document.body.classList.add('visualizer-failed');
            return;
        }
        
        this.canvas = document.getElementById('visualizer');
        this.ctx = this.canvas.getContext('2d');
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.85;
        
        this.minFreq = 40;
        this.maxFreq = 15000;
        this.freqBinRange = this.calculateFrequencyBinRange();
        this.pinkScale = new Float32Array(this.freqBinRange.length);
        
        this.colorOffset = 0;
        this.lastAudioData = new Float32Array(this.freqBinRange.length);
        
        this.autoZoom = {
            speed: 0.0005,          // Zoom speed
            direction: 1,          
            minZoom: 3,         
            maxZoom: 4.0,         
            offsetX: 1,         // Increased offset for more interesting movement
            offsetY: -0.8,        // Adjusted for better composition
            baseScale: 2,
            time: 0,
            audioPower: 0.9,
            spiralFactor: 4,    // Added spiral factor for more dynamic movement
            rotationSpeed: 0.00001  // Add rotation speed control
        };
        
        this.hexagonSpacing = .38;      // Space between hexagons at same level
        this.levelSpacing = 2;         // Space between fractal levels
        this.sizeReduction = 0.34;      // Changed from 0.25 to 0.45 - each level will be 45% of previous
        this.baseHexSize = 200;         // Starting size of hexagons
        
        this.rotation = {
            base: Math.PI / 12,    // Starting rotation (15 degrees in radians)
            speed: 0.005,          // Base rotation speed
            audioMultiplier: 0.05, // How much audio affects rotation
            direction: 1,          // 1 or -1 for rotation direction
            momentum: 0,           // Current rotational momentum
            friction: 0.50,       // How quickly rotation slows down
            current: 0            // Add current rotation tracking
        };
        
        this.patterns = [0, 2*Math.PI/3, 4*Math.PI/3]; // Three 120° rotations
        
        this.minSize = 0.5;
        this.maxDepth = 2;  // Start with fewer layers
        this.trailsAlpha = 0.3;  // Start with shorter trails
        
        // Performance monitoring
        this.frameTime = 0;
        this.frameCount = 0;
        this.targetFPS = 30;
        
        // Performance ramping
        this.performanceRamp = {
            active: true,
            startTime: performance.now(),
            duration: 5000, // 5 seconds to reach full complexity
            initialDepth: 2,
            targetDepth: window.innerWidth < 768 ? 3 : 
                        window.innerWidth < 1024 ? 4 : 4
        };
        
        // Check if mobile device
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (this.isMobile) {
            this.trailsAlpha = 0.3;  // Shorter trails
            this.hexagonSpacing = 0.8;  // More space between hexagons
            this.sizeReduction = 0.65;  // Less size reduction between levels
            this.autoZoom.speed *= 0.75;  // Slower zoom
        }
        
        // Add state tracking
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        // Bind methods to preserve context
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        this.handlePageShow = this.handlePageShow.bind(this);
        
        this.initPinkNoiseFactors();
        this.init();
        
        document.querySelector('#visualizer').__visualizer = this;
    }

    calculateFrequencyBinRange() {
        const binRange = [];
        const nyquist = this.audioContext.sampleRate / 2;
        const frequencyBinCount = this.analyser.frequencyBinCount;
        
        // Calculate Hz per bin
        const hzPerBin = nyquist / frequencyBinCount;
        
        // Find bins that correspond to our desired frequency range
        for (let i = 0; i < frequencyBinCount; i++) {
            const freq = i * hzPerBin;
            if (freq >= this.minFreq && freq <= this.maxFreq) {
                binRange.push(i);
            }
        }
        
        return binRange;
    }

    initPinkNoiseFactors() {
        const nyquist = this.audioContext.sampleRate / 2;
        const hzPerBin = nyquist / this.analyser.frequencyBinCount;

        // Calculate pink noise scaling factors for our frequency range
        this.freqBinRange.forEach((bin, i) => {
            const freq = bin * hzPerBin;
            
            // Bass boost factor reduced by ~30%
            let bassBoost = 1;
            if (freq < 250) {
                // Reduced from 2.5 to 1.75
                bassBoost = 1.75 * (1 - (freq / 250));
            }
            
            // Modified pink noise curve with bass emphasis
            this.pinkScale[i] = Math.pow(freq, 0.32) * (1 + bassBoost);
        });

        // Normalize the scaling factors
        const maxScale = Math.max(...this.pinkScale);
        for (let i = 0; i < this.pinkScale.length; i++) {
            this.pinkScale[i] = this.pinkScale[i] / maxScale;
        }
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Add more event listeners for page state
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        window.addEventListener('pageshow', this.handlePageShow);
        window.addEventListener('focus', this.handlePageShow);

        const initAudio = async () => {
            try {
                await this.audioContext.resume();
                
                const vueApp = document.querySelector('#app').__vue__;
                if (vueApp && vueApp.audio) {
                    if (!this.isConnected) {
                        await this.connectAudio(vueApp.audio);
                    }
                    return true;
                }
                return false;
            } catch (e) {
                console.error('Error initializing audio:', e);
                return false;
            }
        };

        // Set up polling for audio initialization
        const pollForAudio = setInterval(async () => {
            const success = await initAudio();
            if (success) {
                clearInterval(pollForAudio);
                console.log('Audio initialization successful');
            }
        }, 100);

        // Clear polling after 10 seconds to prevent infinite checking
        setTimeout(() => clearInterval(pollForAudio), 10000);

        this.animate();
    }

    async setupAudioConnection(initAudio) {
        const success = await initAudio();
        if (!success && this.reconnectAttempts < this.maxReconnectAttempts) {
            const checkAudio = setInterval(async () => {
                const success = await initAudio();
                if (success) {
                    clearInterval(checkAudio);
                    this.reconnectAttempts = 0;
                    this.isConnected = true;
                } else {
                    this.reconnectAttempts++;
                    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                        clearInterval(checkAudio);
                        console.error('Max reconnection attempts reached');
                    }
                }
            }, 1000);
        }
    }

    async handleVisibilityChange() {
        if (document.visibilityState === 'visible') {
            await this.audioContext.resume();
            if (!this.isConnected) {
                this.reconnectAttempts = 0;
                await this.reconnectAudio();
            }
        }
    }

    async handlePageShow() {
        await this.audioContext.resume();
        if (!this.isConnected) {
            this.reconnectAttempts = 0;
            await this.reconnectAudio();
        }
    }

    async reconnectAudio() {
        const vueApp = document.querySelector('#app').__vue__;
        if (vueApp && vueApp.audio) {
            try {
                await this.connectAudio(vueApp.audio);
                this.isConnected = true;
                console.log('Audio reconnected successfully');
            } catch (e) {
                console.error('Error reconnecting audio:', e);
                this.isConnected = false;
            }
        }
    }

    async connectAudio(audioElement) {
        try {
            // Prevent multiple connections to the same audio element
            if (audioElement.connectedToVisualizer) {
                console.log('Audio already connected to visualizer');
                return;
            }

            // Clean up any existing connections
            if (this.source) {
                try {
                    this.source.disconnect();
                } catch (e) {
                    console.log('Error disconnecting old source:', e);
                }
            }

            // Create new connection
            this.source = this.audioContext.createMediaElementSource(audioElement);
            this.source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            // Mark the audio element as connected
            audioElement.connectedToVisualizer = true;
            this.isConnected = true;
            
            console.log('Audio successfully connected to visualizer');
        } catch (e) {
            console.error('Error connecting audio to visualizer:', e);
            this.isConnected = false;
            this.handleAudioError();
            throw e;
        }
    }

    handleAudioError() {
        document.body.classList.add('visualizer-failed');
        this.isConnected = false;
        this.audioContext.resume().catch(e => {
            console.error('Failed to resume audio context:', e);
        });
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Update maxDepth when screen size changes
        this.maxDepth = window.innerWidth < 768 ? 3 : 
                        window.innerWidth < 1024 ? 4 : 5;
                    
        // Adjust base hexagon size for smaller screens
        this.baseHexSize = window.innerWidth < 768 ? 60 : 
                           window.innerWidth < 1024 ? 80 : 100;
    }

    animate() {
        // Define dataArray at the start of animate
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const draw = () => {
            const startTime = performance.now();
            
            // Update rotation
            this.rotation.current += this.rotation.speed * this.rotation.direction;
            this.rotation.base = this.rotation.current;
            
            // Apply rotation momentum
            this.rotation.momentum *= this.rotation.friction;
            this.rotation.base += this.rotation.momentum;
            
            // Get the frequency data
            this.analyser.getByteFrequencyData(dataArray);
            
            // Get frequency data
            const bassIntensity = this.getAverageFrequency(dataArray, 0, 100) * 1.5;
            const midIntensity = this.getAverageFrequency(dataArray, 100, 2000);
            const highIntensity = this.getAverageFrequency(dataArray, 2000, 8000);
            
            // Calculate audio intensity
            const audioIntensity = (bassIntensity * 0.5 + midIntensity * 0.3 + highIntensity * 0.2);
            
            // Calculate zoom
            const baseSpeed = this.autoZoom.speed;
            const audioMultiplier = 1 + (audioIntensity * this.autoZoom.audioPower);
            
            // Update time based on direction and speed
            this.autoZoom.time += (baseSpeed * audioMultiplier * this.autoZoom.direction);
            
            // Calculate current zoom level
            const targetZoom = this.autoZoom.baseScale + this.autoZoom.time;
            
            // Check bounds and reverse direction
            if (targetZoom >= this.autoZoom.maxZoom) {
                this.autoZoom.direction = -1;
                this.autoZoom.time = this.autoZoom.maxZoom - this.autoZoom.baseScale;
            } else if (targetZoom <= this.autoZoom.minZoom) {
                this.autoZoom.direction = 1;
                this.autoZoom.time = this.autoZoom.minZoom - this.autoZoom.baseScale;
            }
            
            // Apply bounded zoom
            this.zoom = Math.max(
                this.autoZoom.minZoom,
                Math.min(this.autoZoom.maxZoom, targetZoom)
            );
            
            // Clear canvas
            this.ctx.fillStyle = `rgba(5, 10, 25, ${this.trailsAlpha})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Apply transforms with more interesting movement
            this.ctx.save();
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            
            // Calculate spiral motion
            const angle = this.autoZoom.time * this.autoZoom.spiralFactor;
            const spiralX = Math.cos(angle) * (this.zoom * this.autoZoom.offsetX) * 100;
            const spiralY = Math.sin(angle) * (this.zoom * this.autoZoom.offsetY) * 100;
            
            this.ctx.translate(centerX + spiralX, centerY + spiralY);
            this.ctx.scale(this.zoom, this.zoom);
            
            // Draw fractal with base size scaled by zoom
            this.drawFractalSet(0, 0, 
                this.baseHexSize * this.zoom, // Scale base size with zoom
                [bassIntensity, midIntensity, highIntensity], 
                0
            );
            
            this.ctx.restore();
            
            // Gradually increase complexity
            if (this.performanceRamp.active) {
                const elapsed = performance.now() - this.performanceRamp.startTime;
                const progress = Math.min(elapsed / this.performanceRamp.duration, 1);
                
                if (progress < 1) {
                    // Smoothly increase maxDepth
                    this.maxDepth = Math.floor(
                        this.performanceRamp.initialDepth + 
                        (this.performanceRamp.targetDepth - this.performanceRamp.initialDepth) * progress
                    );
                    // Gradually decrease trail alpha
                    this.trailsAlpha = 0.3 - (0.1 * progress);
                } else {
                    this.performanceRamp.active = false;
                }
            }
            
            // Monitor performance
            const endTime = performance.now();
            this.frameTime = endTime - startTime;
            this.frameCount++;
            
            // Every 60 frames, check performance and adjust if needed
            if (this.frameCount % 60 === 0) {
                if (this.frameTime > (1000 / this.targetFPS)) {
                    // Reduce complexity if performance is poor
                    this.maxDepth = Math.max(2, this.maxDepth - 1);
                    this.trailsAlpha = Math.min(0.3, this.trailsAlpha + 0.05);
                }
            }
            
            requestAnimationFrame(draw);
        };
        
        draw();
    }

    drawFractalSet(x, y, size, intensities, depth) {
        if (!this.patterns || !intensities) {
            console.error('Missing required properties');
            return;
        }
        
        if (size * this.zoom < this.minSize || depth > this.maxDepth) return;
        
        // Draw deeper layers first
        for (let i = 0; i < 3; i++) {
            try {
                const angle = this.patterns[i] + this.rotation.base;
                const distance = size * this.hexagonSpacing;
                const px = x + Math.cos(angle) * distance;
                const py = y + Math.sin(angle) * distance;
                
                // Draw next level first (recursive call)
                const nextSize = size * this.sizeReduction;
                const nextAngle = angle + this.rotation.base * (depth + 1);
                const nextDistance = nextSize * this.levelSpacing;
                const nextX = px + Math.cos(nextAngle) * nextDistance;
                const nextY = py + Math.sin(nextAngle) * nextDistance;
                
                if (depth < this.maxDepth) {
                    this.drawFractalSet(
                        nextX, nextY, 
                        nextSize * this.sizeReduction,
                        intensities.map(i => i * 0.9),
                        depth + 1
                    );
                }
                
                // Draw hexagons at all depths, with decreasing opacity for deeper levels
                const depthOpacity = 1 - (depth / (this.maxDepth + 1));
                this.drawHexagon(
                    px, py, 
                    size * this.sizeReduction, 
                    intensities[i] || 0, 
                    i,
                    depthOpacity
                );
                
            } catch (error) {
                console.error('Error in drawFractalSet:', error);
                document.body.classList.add('visualizer-failed');
            }
        }
    }

    drawHexagon(x, y, size, intensity, index, depthOpacity = 1) {
        const vertices = 6;
        const angleOffset = Math.PI / 6;
        
        // Use the base rotation plus any accumulated momentum
        const currentRotation = this.rotation.base + (intensity * Math.PI / 8);
        
        // Draw the yellow interior first
        this.ctx.beginPath();
        for (let i = 0; i <= vertices; i++) {
            const angle = (i * Math.PI * 2 / vertices) + angleOffset + currentRotation;
            // Slightly smaller size for interior to prevent line overlap
            const innerSize = size * 0.95;
            const px = x + Math.cos(angle) * innerSize;
            const py = y + Math.sin(angle) * innerSize;
            
            if (i === 0) {
                this.ctx.moveTo(px, py);
            } else {
                this.ctx.lineTo(px, py);
            }
        }
        this.ctx.closePath();
        
        // Warm interior colors (yellows, oranges, whites)
        const interiorHue = 45 + (index * 15) + (intensity * 10);
        const interiorSat = 90 + (intensity * 10);
        const interiorLight = 65 + (intensity * 25);
        
        // Create gradient for interior
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, size);
        gradient.addColorStop(0, `hsla(${interiorHue}, ${interiorSat}%, ${interiorLight}%, ${(0.8 + intensity * 0.2) * depthOpacity})`);
        gradient.addColorStop(0.6, `hsla(${interiorHue + 10}, ${interiorSat - 20}%, ${interiorLight - 10}%, ${(0.6 + intensity * 0.2) * depthOpacity})`);
        gradient.addColorStop(1, `hsla(${interiorHue - 10}, ${interiorSat - 30}%, ${interiorLight - 20}%, ${(0.4 + intensity * 0.2) * depthOpacity})`);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // Draw the outline separately
        this.ctx.beginPath();
        for (let i = 0; i <= vertices; i++) {
            const angle = (i * Math.PI * 2 / vertices) + angleOffset + currentRotation;
            const px = x + Math.cos(angle) * size;
            const py = y + Math.sin(angle) * size;
            
            if (i === 0) {
                this.ctx.moveTo(px, py);
            } else {
                this.ctx.lineTo(px, py);
            }
        }
        this.ctx.closePath();
        
        // Cool outline colors (purples, blues)
        const outlineHue = 250 + (index * 20);
        const outlineSat = 70 + (intensity * 30);
        const outlineLight = 40 + (intensity * 20);
        
        // Make line width scale less aggressively with zoom
        const baseLineWidth = 2 * (1 + intensity * 0.5);
        const zoomFactor = Math.log10(this.zoom + 1) * 0.5; // Logarithmic scaling
        this.ctx.lineWidth = baseLineWidth * zoomFactor;
        
        // Adjust outline opacity
        const outlineAlpha = Math.max(0.3, 1 / (zoomFactor * 2)) * depthOpacity;
        this.ctx.strokeStyle = `hsla(${outlineHue}, ${outlineSat}%, ${outlineLight}%, ${outlineAlpha})`;
        this.ctx.stroke();
        
        // Add subtle glow that doesn't scale with zoom
        const glowSize = 15 * intensity / Math.log10(this.zoom + 2);
        this.ctx.shadowBlur = glowSize;
        this.ctx.shadowColor = `hsla(${outlineHue}, ${outlineSat}%, ${outlineLight}%, 0.3)`;
    }

    getAverageFrequency(dataArray, minFreq, maxFreq) {
        const nyquist = this.audioContext.sampleRate / 2;
        const minIndex = Math.floor((minFreq / nyquist) * dataArray.length);
        const maxIndex = Math.floor((maxFreq / nyquist) * dataArray.length);
        
        let sum = 0;
        for (let i = minIndex; i < maxIndex; i++) {
            sum += dataArray[i];
        }
        return sum / (maxIndex - minIndex) / 255;
    }
}

// Initialize visualizer with error handling
document.addEventListener('DOMContentLoaded', () => {
    try {
        new AudioVisualizer();
    } catch (e) {
        console.error('Visualizer failed to initialize:', e);
        document.body.classList.add('visualizer-failed');
    }
}); 