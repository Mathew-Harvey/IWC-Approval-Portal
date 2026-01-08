/**
 * Fouling Rating Slider Component
 * Visual slider for selecting fouling rating with preview images
 * 
 * Usage:
 *   FoulingSlider.init('foulingRating');
 */

const FoulingSlider = {
    selectId: null,
    
    // Fouling rating definitions with colors and descriptions
    ratings: [
        { value: 0,   label: 'FR 0',   desc: 'Clean - No microfouling', color: '#22c55e', intensity: 0 },
        { value: 10,  label: 'FR 10',  desc: 'Light microfouling (biofilm)', color: '#84cc16', intensity: 10 },
        { value: 20,  label: 'FR 20',  desc: 'Full microfouling (slime)', color: '#a3e635', intensity: 20 },
        { value: 30,  label: 'FR 30',  desc: 'Soft macrofouling (algae)', color: '#facc15', intensity: 30 },
        { value: 40,  label: 'FR 40',  desc: 'Light hard macrofouling', color: '#fbbf24', intensity: 40 },
        { value: 50,  label: 'FR 50',  desc: 'Moderate hard macrofouling', color: '#f59e0b', intensity: 50 },
        { value: 60,  label: 'FR 60',  desc: 'Tubeworms + barnacles', color: '#ea580c', intensity: 60 },
        { value: 70,  label: 'FR 70',  desc: 'Heavy macrofouling (>6.4mm)', color: '#dc2626', intensity: 70 },
        { value: 80,  label: 'FR 80',  desc: 'Heavy hard macrofouling', color: '#b91c1c', intensity: 80 },
        { value: 90,  label: 'FR 90',  desc: 'Dense heavy fouling', color: '#991b1b', intensity: 90 },
        { value: 100, label: 'FR 100', desc: 'Composite fouling (all forms)', color: '#7f1d1d', intensity: 100 }
    ],
    
    init(selectId) {
        this.selectId = selectId;
        const select = document.getElementById(selectId);
        if (!select) return;
        
        this.createSlider(select);
        console.log('📊 FoulingSlider initialized');
    },
    
    createSlider(select) {
        // Hide original select
        select.style.display = 'none';
        
        // Create slider container
        const container = document.createElement('div');
        container.className = 'fouling-slider-container';
        container.id = 'foulingSliderContainer';
        
        container.innerHTML = `
            <div class="fouling-display">
                <div class="fouling-hull" id="foulingHull">
                    <div class="fouling-overlay" id="foulingOverlay"></div>
                    <svg class="hull-shape" viewBox="0 0 200 60">
                        <path d="M 10 30 Q 10 10 50 10 L 150 10 Q 190 10 190 30 Q 190 50 150 50 L 50 50 Q 10 50 10 30" 
                              fill="currentColor" stroke="var(--gray-400)" stroke-width="1"/>
                    </svg>
                </div>
                <div class="fouling-info">
                    <span class="fouling-rating" id="foulingRatingDisplay">FR 0</span>
                    <span class="fouling-desc" id="foulingDescDisplay">Select a rating</span>
                </div>
            </div>
            <div class="fouling-slider-track">
                <input type="range" 
                       id="foulingSlider" 
                       min="0" max="100" step="10" 
                       value="${select.value || 0}"
                       class="fouling-slider-input" />
                <div class="fouling-ticks">
                    ${this.ratings.map(r => `
                        <div class="fouling-tick" style="left: ${r.intensity}%">
                            <span class="tick-mark" style="background: ${r.color}"></span>
                            <span class="tick-label">${r.value}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="fouling-legend">
                <span class="legend-item legend-clean">🟢 Clean/Grooming</span>
                <span class="legend-item legend-moderate">🟡 Moderate</span>
                <span class="legend-item legend-heavy">🔴 Heavy (High Risk)</span>
            </div>
        `;
        
        select.parentNode.insertBefore(container, select.nextSibling);
        
        // Bind slider events
        const slider = document.getElementById('foulingSlider');
        slider.addEventListener('input', (e) => this.updateDisplay(parseInt(e.target.value)));
        
        // Initialize display
        this.updateDisplay(parseInt(select.value) || 0);
    },
    
    updateDisplay(value) {
        const rating = this.ratings.find(r => r.value === value) || this.ratings[0];
        const select = document.getElementById(this.selectId);
        
        // Update hidden select
        if (select) select.value = value.toString();
        
        // Update visual display
        const hull = document.getElementById('foulingHull');
        const overlay = document.getElementById('foulingOverlay');
        const ratingDisplay = document.getElementById('foulingRatingDisplay');
        const descDisplay = document.getElementById('foulingDescDisplay');
        
        if (hull) {
            hull.style.setProperty('--fouling-color', rating.color);
        }
        
        if (overlay) {
            overlay.style.background = this.getFoulingPattern(value);
            overlay.style.opacity = value / 100;
        }
        
        if (ratingDisplay) {
            ratingDisplay.textContent = rating.label;
            ratingDisplay.style.color = rating.color;
        }
        
        if (descDisplay) {
            descDisplay.textContent = rating.desc;
        }
        
        // Trigger change event on original select
        if (select) {
            const event = new Event('change', { bubbles: true });
            select.dispatchEvent(event);
        }
    },
    
    getFoulingPattern(value) {
        // Create visual pattern based on fouling level
        if (value === 0) {
            return 'transparent';
        } else if (value <= 20) {
            // Microfouling - subtle green film
            return `linear-gradient(45deg, 
                rgba(34, 197, 94, ${value / 100}) 25%, 
                transparent 25%, transparent 75%, 
                rgba(34, 197, 94, ${value / 100}) 75%)`;
        } else if (value <= 50) {
            // Soft/light macrofouling - yellow/orange patches
            return `radial-gradient(circle at 20% 30%, rgba(250, 204, 21, 0.8) 0%, transparent 30%),
                    radial-gradient(circle at 70% 60%, rgba(245, 158, 11, 0.8) 0%, transparent 25%),
                    radial-gradient(circle at 50% 80%, rgba(234, 88, 12, 0.6) 0%, transparent 35%)`;
        } else if (value <= 80) {
            // Heavy macrofouling - dense red/brown
            return `radial-gradient(circle at 15% 25%, rgba(220, 38, 38, 0.9) 0%, transparent 20%),
                    radial-gradient(circle at 85% 35%, rgba(185, 28, 28, 0.9) 0%, transparent 25%),
                    radial-gradient(circle at 45% 75%, rgba(153, 27, 27, 0.9) 0%, transparent 30%),
                    radial-gradient(circle at 75% 80%, rgba(220, 38, 38, 0.8) 0%, transparent 20%),
                    radial-gradient(circle at 30% 50%, rgba(185, 28, 28, 0.85) 0%, transparent 22%)`;
        } else {
            // Extreme fouling - very dense coverage
            return `radial-gradient(circle at 10% 20%, rgba(127, 29, 29, 0.95) 0%, transparent 18%),
                    radial-gradient(circle at 30% 40%, rgba(153, 27, 27, 0.95) 0%, transparent 20%),
                    radial-gradient(circle at 50% 25%, rgba(185, 28, 28, 0.95) 0%, transparent 22%),
                    radial-gradient(circle at 70% 50%, rgba(127, 29, 29, 0.95) 0%, transparent 20%),
                    radial-gradient(circle at 90% 30%, rgba(153, 27, 27, 0.95) 0%, transparent 18%),
                    radial-gradient(circle at 20% 70%, rgba(185, 28, 28, 0.95) 0%, transparent 22%),
                    radial-gradient(circle at 60% 80%, rgba(127, 29, 29, 0.95) 0%, transparent 20%),
                    radial-gradient(circle at 80% 75%, rgba(153, 27, 27, 0.95) 0%, transparent 18%)`;
        }
    },
    
    // Method to set value programmatically
    setValue(value) {
        const slider = document.getElementById('foulingSlider');
        if (slider) {
            slider.value = value;
            this.updateDisplay(parseInt(value));
        }
    }
};

// Export for browser
if (typeof window !== 'undefined') {
    window.FoulingSlider = FoulingSlider;
}

