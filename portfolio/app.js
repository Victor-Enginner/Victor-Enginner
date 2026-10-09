// Portfolio App - Neural Network Canvas Animation
// Visual only - does not represent real data or live AI activity

class NeuralNetwork {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.nodes = [];
        this.connections = [];
        this.pulses = [];
        this.animationId = null;
        this.isPlaying = true;
        this.lastFrameTime = 0;
        this.targetFPS = 30;
        this.frameInterval = 1000 / this.targetFPS;
        
        this.resize();
        this.init();
        this.bindEvents();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    init() {
        // Create nodes
        const nodeCount = Math.floor((this.canvas.width * this.canvas.height) / 25000);
        this.nodes = [];
        
        for (let i = 0; i < nodeCount; i++) {
            this.nodes.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: Math.random() * 2 + 1,
                pulse: Math.random() * Math.PI * 2
            });
        }

        // Create connections
        this.connections = [];
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const distance = this.getDistance(this.nodes[i], this.nodes[j]);
                if (distance < 150) {
                    this.connections.push({
                        from: this.nodes[i],
                        to: this.nodes[j],
                        distance: distance,
                        opacity: 1 - (distance / 150)
                    });
                }
            }
        }

        // Create initial pulses
        this.pulses = [];
        for (let i = 0; i < 5; i++) {
            this.createPulse();
        }
    }

    getDistance(node1, node2) {
        return Math.sqrt(
            Math.pow(node2.x - node1.x, 2) + 
            Math.pow(node2.y - node1.y, 2)
        );
    }

    createPulse() {
        if (this.connections.length > 0) {
            const connection = this.connections[Math.floor(Math.random() * this.connections.length)];
            this.pulses.push({
                connection: connection,
                progress: 0,
                speed: 0.01 + Math.random() * 0.02
            });
        }
    }

    update(deltaTime) {
        // Update node pulses
        this.nodes.forEach(node => {
            node.pulse += deltaTime * 0.002;
        });

        // Update pulses
        this.pulses = this.pulses.filter(pulse => {
            pulse.progress += pulse.speed * deltaTime * 0.06;
            return pulse.progress < 1;
        });

        // Randomly create new pulses
        if (Math.random() < 0.02 && this.pulses.length < 10) {
            this.createPulse();
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw connections
        this.connections.forEach(conn => {
            this.ctx.beginPath();
            this.ctx.moveTo(conn.from.x, conn.from.y);
            this.ctx.lineTo(conn.to.x, conn.to.y);
            this.ctx.strokeStyle = `rgba(255, 128, 61, ${conn.opacity * 0.3})`;
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        });

        // Draw nodes
        this.nodes.forEach(node => {
            const pulseSize = Math.sin(node.pulse) * 0.5 + 1;
            
            // Outer glow
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, node.radius * pulseSize * 2, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 128, 61, 0.2)';
            this.ctx.fill();

            // Inner core
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, node.radius * pulseSize, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 200, 100, 0.6)';
            this.ctx.fill();
        });

        // Draw pulses
        this.pulses.forEach(pulse => {
            const x = pulse.connection.from.x + 
                     (pulse.connection.to.x - pulse.connection.from.x) * pulse.progress;
            const y = pulse.connection.from.y + 
                     (pulse.connection.to.y - pulse.connection.from.y) * pulse.progress;

            this.ctx.beginPath();
            this.ctx.arc(x, y, 3, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 200, 100, 0.8)';
            this.ctx.fill();
        });
    }

    animate(currentTime) {
        if (!this.isPlaying) return;

        const deltaTime = currentTime - this.lastFrameTime;

        if (deltaTime >= this.frameInterval) {
            this.lastFrameTime = currentTime - (deltaTime % this.frameInterval);
            this.update(deltaTime);
            this.draw();
        }

        this.animationId = requestAnimationFrame((time) => this.animate(time));
    }

    start() {
        if (!this.isPlaying) {
            this.isPlaying = true;
            this.lastFrameTime = performance.now();
            this.animate(performance.now());
        }
    }

    stop() {
        this.isPlaying = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    toggle() {
        if (this.isPlaying) {
            this.stop();
            return false;
        } else {
            this.start();
            return true;
        }
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            this.resize();
            this.init();
        });

        // Pause when tab is hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stop();
            } else {
                this.start();
            }
        });
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('neural-canvas');
    const toggleButton = document.getElementById('animation-toggle');

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
        // Don't initialize animation for users who prefer reduced motion
        if (toggleButton) {
            toggleButton.style.display = 'none';
        }
        return;
    }

    if (canvas) {
        const neuralNetwork = new NeuralNetwork(canvas);
        neuralNetwork.start();

        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                const isPlaying = neuralNetwork.toggle();
                toggleButton.textContent = isPlaying ? 'Pausar animação' : 'Ativar animação';
                toggleButton.setAttribute('aria-label', isPlaying ? 'Pausar animação' : 'Ativar animação');
            });
        }
    }
});