// Add this at the very top of drawtriangle.js
console.log('Triangle script loaded');

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('triangleCanvas');
    const ctx = canvas.getContext('2d');
    const showLengthsCheckbox = document.getElementById('showLengths');
    const showAreaCheckbox = document.getElementById('showArea');
    const useBigScaleCheckbox = document.getElementById('useBigScale');

    // Triangle vertices
    let vertices = [
        { x: 250, y: 100 },  // top
        { x: 150, y: 300 },  // bottom left
        { x: 350, y: 300 }   // bottom right
    ];

    let draggingVertex = null;
    let isShiftPressed = false;

    // Set canvas size
    function resizeCanvas() {
        canvas.width = 500;  // Fixed width
        canvas.height = 500; // Fixed height
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Math helper functions
    function calculateAngle(p1, p2, p3) {
        // Calculate vectors
        const v1 = {
            x: p1.x - p2.x,
            y: p1.y - p2.y
        };
        const v2 = {
            x: p3.x - p2.x,
            y: p3.y - p2.y
        };

        // Calculate angle using dot product
        const dot = v1.x * v2.x + v1.y * v2.y;
        const v1mag = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        const v2mag = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
        
        // Ensure we don't get NaN from rounding errors
        let cos = dot / (v1mag * v2mag);
        cos = Math.max(-1, Math.min(1, cos));
        
        // Get the angle in degrees
        let angle = Math.acos(cos) * 180 / Math.PI;
        
        // Always return the smaller angle
        return Math.round(angle > 180 ? 360 - angle : angle);
    }

    // Update the scale factor calculation
    function getScaleFactor() {
        // When Use Large Scale is checked: 500/20 = 25 pixels per unit (smaller triangles)
        // When Use Large Scale is unchecked: 500/10 = 50 pixels per unit (larger triangles)
        return useBigScaleCheckbox.checked ? 25 : 50;
    }

    // Modify the calculateLength function to account for scale
    function calculateLength(p1, p2) {
        const pixelLength = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        return pixelLength / getScaleFactor(); // Return unrounded measurement
    }

    function calculateArea() {
        // Get the rounded side lengths as displayed
        const sides = [];
        vertices.forEach((vertex, i) => {
            const next = vertices[(i + 1) % 3];
            const length = calculateLength(vertex, next);
            sides.push(Number(length.toFixed(1))); // Round to 1 decimal place
        });

        // Calculate area using rounded side lengths
        const [a, b, c] = sides;
        const s = (a + b + c) / 2;
        return Math.sqrt(s * (s - a) * (s - b) * (s - c));
    }

    function getTriangleType() {
        const angles = [
            calculateAngle(vertices[1], vertices[0], vertices[2]),
            calculateAngle(vertices[0], vertices[1], vertices[2]),
            calculateAngle(vertices[0], vertices[2], vertices[1])
        ];
        const maxAngle = Math.max(...angles);
        if (Math.abs(maxAngle - 90) < 0.5) return 'right';
        if (maxAngle > 90) return 'obtuse';
        return 'acute';
    }

    function getTriangleColor() {
        const angles = [
            calculateAngle(vertices[1], vertices[0], vertices[2]),
            calculateAngle(vertices[0], vertices[1], vertices[2]),
            calculateAngle(vertices[0], vertices[2], vertices[1])
        ];
        
        // Check if all angles are 60° (within rounding)
        const isEquilateral = angles.every(angle => Math.abs(angle - 60) < 0.5);
        if (isEquilateral) {
            return 'rgba(76, 187, 23, 0.5)'; // Kelly green with transparency
        }
        
        const maxAngle = Math.max(...angles);
        if (Math.abs(maxAngle - 90) < 0.5) return 'rgba(255, 0, 0, 0.5)';
        if (maxAngle > 90) return 'rgba(255, 165, 0, 0.5)';
        return 'rgba(0, 255, 255, 0.5)';
    }

    // Update the number formatting function to handle decimals
    function formatNumber(num) {
        // Show one decimal place
        const rounded = Number(num.toFixed(1));
        // Add commas for thousands and keep one decimal
        return rounded.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    }

    // Drawing function
    function drawTriangle() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw triangle
        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        ctx.lineTo(vertices[1].x, vertices[1].y);
        ctx.lineTo(vertices[2].x, vertices[2].y);
        ctx.closePath();
        
        ctx.fillStyle = getTriangleColor();
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.stroke();

        // Draw vertices
        vertices.forEach(vertex => {
            ctx.beginPath();
            ctx.arc(vertex.x, vertex.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = 'black';
            ctx.fill();
        });

        // Draw angles
        const angles = vertices.map((vertex, i) => {
            const prev = vertices[(i + 2) % 3];
            const next = vertices[(i + 1) % 3];
            return calculateAngle(prev, vertex, next);
        });

        vertices.forEach((vertex, i) => {
            const angle = angles[i];
            const prev = vertices[(i + 2) % 3];
            const next = vertices[(i + 1) % 3];
            
            // Draw angle arc or square
            ctx.beginPath();
            const radius = 30;
            
            if (Math.abs(angle - 90) < 0.5) {
                // Draw right angle square
                const v1 = {
                    x: (prev.x - vertex.x),
                    y: (prev.y - vertex.y)
                };
                const v2 = {
                    x: (next.x - vertex.x),
                    y: (next.y - vertex.y)
                };
                
                // Normalize vectors to radius length
                const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
                const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
                
                const p1 = {
                    x: vertex.x + (v1.x / len1) * radius,
                    y: vertex.y + (v1.y / len1) * radius
                };
                const p2 = {
                    x: vertex.x + (v2.x / len2) * radius,
                    y: vertex.y + (v2.y / len2) * radius
                };
                
                // Calculate corner point of square
                const cornerPoint = {
                    x: p1.x + (p2.x - vertex.x),
                    y: p1.y + (p2.y - vertex.y)
                };
                
                // Draw the square
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(cornerPoint.x, cornerPoint.y);
                ctx.lineTo(p2.x, p2.y);
            } else {
                // Draw regular angle arc
                let startAngle = Math.atan2(prev.y - vertex.y, prev.x - vertex.x);
                let endAngle = Math.atan2(next.y - vertex.y, next.x - vertex.x);
                
                // Always draw the smaller angle
                const diff = endAngle - startAngle;
                const normalizedDiff = ((diff % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
                
                if (normalizedDiff > Math.PI) {
                    [startAngle, endAngle] = [endAngle, startAngle];
                }
                
                ctx.arc(vertex.x, vertex.y, radius, startAngle, endAngle);
            }
            
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.stroke();

            // Draw angle label
            const labelRadius = radius + 10;
            let labelAngle;
            
            if (Math.abs(angle - 90) < 0.5) {
                // For right angles, position label at midpoint
                const startAngle = Math.atan2(prev.y - vertex.y, prev.x - vertex.x);
                const endAngle = Math.atan2(next.y - vertex.y, next.x - vertex.x);
                labelAngle = (startAngle + endAngle) / 2;
            } else {
                const startAngle = Math.atan2(prev.y - vertex.y, prev.x - vertex.x);
                const endAngle = Math.atan2(next.y - vertex.y, next.x - vertex.x);
                const diff = endAngle - startAngle;
                const normalizedDiff = ((diff % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
                labelAngle = normalizedDiff > Math.PI ? 
                    (startAngle + endAngle) / 2 + Math.PI : 
                    (startAngle + endAngle) / 2;
            }
            
            const labelX = vertex.x + labelRadius * Math.cos(labelAngle);
            const labelY = vertex.y + labelRadius * Math.sin(labelAngle);
            
            ctx.fillStyle = 'black';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(Math.round(angle) + '°', labelX, labelY);
        });

        // Draw side lengths if enabled
        if (showLengthsCheckbox.checked) {
            vertices.forEach((vertex, i) => {
                const next = vertices[(i + 1) % 3];
                const length = calculateLength(vertex, next); // Remove rounding
                const midX = (vertex.x + next.x) / 2;
                const midY = (vertex.y + next.y) / 2;
                
                ctx.fillStyle = 'black';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(formatNumber(length), midX, midY);
            });
        }

        // Draw area if enabled
        if (showAreaCheckbox.checked) {
            const area = calculateArea(); // Remove rounding
            const centerX = (vertices[0].x + vertices[1].x + vertices[2].x) / 3;
            const centerY = (vertices[0].y + vertices[1].y + vertices[2].y) / 3;
            
            ctx.fillStyle = 'black';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Area: ' + formatNumber(area), centerX, centerY);
        }
    }

    // Event handlers
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        vertices.forEach((vertex, index) => {
            if (Math.hypot(vertex.x - x, vertex.y - y) < 10) {
                draggingVertex = index;
            }
        });
    });

    // Modify the mousemove handler
    canvas.addEventListener('mousemove', (e) => {
        if (draggingVertex !== null) {
            const rect = canvas.getBoundingClientRect();
            let x = e.clientX - rect.left;
            let y = e.clientY - rect.top;

            if (isShiftPressed) {
                x = Math.round(x / 20) * 20;
                y = Math.round(y / 20) * 20;
            }

            // Store the proposed new position
            const newPos = { x, y };
            
            // Make sure the point stays within canvas bounds
            if (x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
                vertices[draggingVertex] = newPos;
                drawTriangle();
            }
        }
    });

    canvas.addEventListener('mouseup', () => {
        draggingVertex = null;
    });

    canvas.addEventListener('mouseleave', () => {
        draggingVertex = null;
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Shift') {
            isShiftPressed = true;
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'Shift') {
            isShiftPressed = false;
        }
    });

    showLengthsCheckbox.addEventListener('change', drawTriangle);
    showAreaCheckbox.addEventListener('change', drawTriangle);
    useBigScaleCheckbox.addEventListener('change', drawTriangle);

    // Preset triangle functions
    window.setEquilateral = function() {
        const scale = getScaleFactor();
        const sideLength = 5; // 5 units for each side
        const height = sideLength * Math.sqrt(3) / 2; // height of equilateral triangle
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        vertices = [
            { x: centerX, y: centerY - height * scale * 0.6 },  // top vertex
            { x: centerX - sideLength * scale / 2, y: centerY + height * scale * 0.4 }, // bottom left
            { x: centerX + sideLength * scale / 2, y: centerY + height * scale * 0.4 }  // bottom right
        ];
        
        drawTriangle();
    };

    window.setRight = function() {
        vertices = [
            { x: 150, y: 300 },
            { x: 150, y: 100 },
            { x: 350, y: 300 }
        ];
        drawTriangle();
    };

    window.setAcute = function() {
        vertices = [
            { x: 200, y: 300 },
            { x: 250, y: 150 },
            { x: 300, y: 300 }
        ];
        drawTriangle();
    };

    window.setObtuse = function() {
        vertices = [
            { x: 150, y: 300 },
            { x: 400, y: 250 },  // Moved further right
            { x: 175, y: 250 }   // Slightly adjusted for better shape
        ];
        drawTriangle();
    };

    // Update setTriangle function
    window.setTriangle = function(sides) {
        let [a, b, c] = sides.sort((x, y) => x - y);
        const isRight = Math.abs(a * a + b * b - c * c) < 0.01;
        
        const scale = getScaleFactor();
        const centerX = canvas.width/2;
        const centerY = canvas.height/2;
        
        if (isRight) {
            // Position right triangle relative to center
            vertices = [
                { x: centerX - (a + b) * scale/3, y: centerY + (a + b) * scale/3 }, // right angle
                { x: centerX - (a + b) * scale/3, y: centerY + (a + b) * scale/3 - a * scale }, // up
                { x: centerX - (a + b) * scale/3 + b * scale, y: centerY + (a + b) * scale/3 } // right
            ];
        } else {
            // Non-right triangle
            const s = (a + b + c) / 2;
            const area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
            const height = (2 * area) / c;
            
            vertices = [
                { x: centerX - (c * scale)/2, y: centerY + height * scale/2 },
                { x: centerX + (c * scale)/2, y: centerY + height * scale/2 },
                { x: centerX - (c * scale)/2 + (a * a - height * height) ** 0.5 * scale,
                  y: centerY + height * scale/2 - height * scale }
            ];
        }
        
        drawTriangle();
    };

    // Draw initial triangle
    drawTriangle();
});