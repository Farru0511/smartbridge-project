
        // DOM Elements
        const dropzone = document.getElementById('dropzone');
        const fileInput = document.getElementById('fileInput');
        const previewImage = document.getElementById('previewImage');
        const classifyBtn = document.getElementById('classifyBtn');
        const resultsContainer = document.getElementById('resultsContainer');
        const classificationResults = document.getElementById('classificationResults');
        const loadingSpinner = document.getElementById('loadingSpinner');
        const tryDemoBtn = document.getElementById('tryDemoBtn');
        const disposalInfo = document.getElementById('disposalInfo');
        const disposalMethod = document.getElementById('disposalMethod');
        const impactBar = document.getElementById('impactBar');
        const impactDescription = document.getElementById('impactDescription');
        
        // Model variables
        let model = null;
        let isModelReady = false;
        
        // Sample disposal recommendations (would normally come from API)
        const disposalMethods = {
            'plastic': 'Place in designated recycling bin. Rinse containers first.',
            'metal': 'Clean and place in metal recycling. Aluminum foil should be clean and balled up.',
            'paper': 'Separate by grade. Remove any plastic windows from envelopes.',
            'organic': 'Compost in designated bin. No meat or dairy in home compost.',
            'glass': 'Sort by color and recycle separately. Do not include broken glass.',
            'electronic': 'Take to e-waste recycling center. Never dispose in regular trash.',
            'hazardous': 'Special handling required. Contact local hazardous waste facility.'
        };
        
        // Initialize the app
        async function initApp() {
            try {
                // Load the MobileNet model
                console.log('Loading model...');
                model = await mobilenet.load();
                isModelReady = true;
                console.log('Model loaded successfully');
                
                // Set up event listeners
                setupEventListeners();
            } catch (error) {
                console.error('Model loading error:', error);
            }
        }
        
        // Set up event listeners
        function setupEventListeners() {
            // Dropzone click event
            dropzone.addEventListener('click', () => fileInput.click());
            
            // File input change event
            fileInput.addEventListener('change', handleFileSelect);
            
            // Drag and drop events
            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('active');
            });
            
            dropzone.addEventListener('dragleave', () => {
                dropzone.classList.remove('active');
            });
            
            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('active');
                
                if (e.dataTransfer.files.length) {
                    const file = e.dataTransfer.files[0];
                    handleFileSelect({ target: { files: [file] } });
                }
            });
            
            // Classify button
            classifyBtn.addEventListener('click', classifyImage);
            
            // Try demo button
            tryDemoBtn.addEventListener('click', () => {
                document.getElementById('demoSection').scrollIntoView({ behavior: 'smooth' });
            });
        }
        
        // Handle file selection
        function handleFileSelect(event) {
            const file = event.target.files[0];
            
            if (file && file.type.match('image.*')) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    previewImage.src = e.target.result;
                    previewImage.classList.remove('hidden');
                    
                    // Enable classify button if model is ready
                    if (isModelReady) {
                        classifyBtn.disabled = false;
                    }
                    
                    // Clear previous results
                    classificationResults.innerHTML = '';
                    disposalInfo.classList.add('hidden');
                    resultsContainer.classList.add('hidden');
                };
                
                reader.readAsDataURL(file);
            }
        }
        
        // Classify image using MobileNet
        async function classifyImage() {
            if (!previewImage.src || !isModelReady) return;
            
            try {
                // Show loading spinner
                loadingSpinner.classList.remove('hidden');
                resultsContainer.classList.add('hidden');
                
                // Classify the image
                const predictions = await model.classify(previewImage);
                
                // Map to waste-specific categories (simplified for demo)
                const wasteCategories = mapToWasteCategories(predictions);
                
                // Display results
                displayResults(wasteCategories);
                
                // Show appropriate disposal method (simulated)
                showDisposalInfo(wasteCategories[0].category);
                
            } catch (error) {
                console.error('Classification error:', error);
                classificationResults.innerHTML = `
                    <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
                        <p>Error classifying image: ${error.message}</p>
                    </div>
                `;
            } finally {
                loadingSpinner.classList.add('hidden');
                resultsContainer.classList.remove('hidden');
            }
        }
        
        // Map general ImageNet predictions to waste-specific categories
        function mapToWasteCategories(predictions) {
            // This is a simplified mapping for demo purposes
            // In a real app, you would have a more sophisticated mapping or custom model
            
            const wasteMapping = {
                'bottle': { category: 'plastic', confidence: 0.9 },
                'can': { category: 'metal', confidence: 0.85 },
                'newspaper': { category: 'paper', confidence: 0.8 },
                'banana': { category: 'organic', confidence: 0.95 },
                'jar': { category: 'glass', confidence: 0.88 },
                'computer': { category: 'electronic', confidence: 0.92 },
                'battery': { category: 'hazardous', confidence: 0.97 }
            };
            
            // Find the best matching waste category for each prediction
            return predictions.map(pred => {
                const className = pred.className.toLowerCase();
                let bestMatch = null;
                
                // Check for direct matches first
                for (const [key, value] of Object.entries(wasteMapping)) {
                    if (className.includes(key)) {
                        bestMatch = { ...value };
                        break;
                    }
                }
                
                // If no direct match, use generic waste classification
                if (!bestMatch) {
                    bestMatch = {
                        category: classifyGeneralWaste(className),
                        confidence: pred.probability
                    };
                }
                
                return {
                    className: pred.className,
                    probability: pred.probability,
                    category: bestMatch.category,
                    confidence: bestMatch.confidence
                };
            });
        }
        
        // Classify general waste types based on keywords
        function classifyGeneralWaste(className) {
            const plasticKeywords = ['plastic', 'bottle', 'bag', 'container'];
            const metalKeywords = ['can', 'metal', 'aluminum', 'steel'];
            const paperKeywords = ['paper', 'cardboard', 'newspaper', 'envelope'];
            const organicKeywords = ['food', 'fruit', 'vegetable', 'banana', 'apple'];
            const glassKeywords = ['glass', 'jar', 'bottle'];
            const electronicKeywords = ['electronic', 'computer', 'phone', 'device'];
            const hazardousKeywords = ['battery', 'chemical', 'hazardous', 'toxic'];
            
            if (plasticKeywords.some(kw => className.includes(kw))) return 'plastic';
            if (metalKeywords.some(kw => className.includes(kw))) return 'metal';
            if (paperKeywords.some(kw => className.includes(kw))) return 'paper';
            if (organicKeywords.some(kw => className.includes(kw))) return 'organic';
            if (glassKeywords.some(kw => className.includes(kw))) return 'glass';
            if (electronicKeywords.some(kw => className.includes(kw))) return 'electronic';
            if (hazardousKeywords.some(kw => className.includes(kw))) return 'hazardous';
            
            // Default to general waste if no specific category matched
            return 'general';
        }
        
        // Display classification results
        function displayResults(predictions) {
            classificationResults.innerHTML = '';
            
            // Display top 3 predictions
            predictions.slice(0, 3).forEach((pred, index) => {
                const confidencePercent = Math.round(pred.probability * 100);
                
                const resultElement = document.createElement('div');
                resultElement.className = 'classification-card bg-gray-50 p-4 rounded';
                resultElement.innerHTML = `
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-semibold">${pred.className}</span>
                        <span class="text-gray-600">${confidencePercent}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2.5">
                        <div class="bg-green-600 h-2.5 rounded-full" style="width: ${confidencePercent}%"></div>
                    </div>
                    <div class="mt-2 flex items-center">
                        <span class="inline-block px-2 py-1 text-xs rounded-full bg-${getCategoryColor(
                            pred.category
                        )}-100 text-${getCategoryColor(pred.category)}-800">
                            ${pred.category.toUpperCase()}
                        </span>
                    </div>
                `;
                
                classificationResults.appendChild(resultElement);
            });
        }
        
        // Get color based on waste category
        function getCategoryColor(category) {
            const colorMap = {
                'plastic': 'blue',
                'metal': 'indigo',
                'paper': 'yellow',
                'organic': 'green',
                'glass': 'orange',
                'electronic': 'purple',
                'hazardous': 'red',
                'general': 'gray'
            };
            
            return colorMap[category] || 'gray';
        }
        
        // Show disposal information based on waste category
        function showDisposalInfo(category) {
            disposalMethod.textContent = disposalMethods[category] || 'Place in general waste bin. Check local guidelines for specific disposal requirements.';
            
            // Set environmental impact (simplified for demo)
            let impactPercent = 70;
            let impactText = '';
            
            switch(category) {
                case 'plastic':
                case 'metal':
                case 'paper':
                case 'glass':
                    impactPercent = 90;
                    impactText = 'Highly recyclable - Proper disposal reduces landfill waste significantly.';
                    break;
                case 'organic':
                    impactPercent = 80;
                    impactText = 'Compostable - Reduces methane emissions from landfills.';
                    break;
                case 'electronic':
                    impactPercent = 85;
                    impactText = 'Valuable materials recoverable - Prevents hazardous substance leakage.';
                    break;
                case 'hazardous':
                    impactPercent = 95;
                    impactText = 'Critical to dispose properly - Prevents environmental contamination.';
                    break;
                default:
                    impactPercent = 30;
                    impactText = 'Minimal recovery potential - Consider reducing consumption.';
            }
            
            // Animate impact bar
            setTimeout(() => {
                impactBar.style.width = impactPercent + '%';
                impactBar.className = `h-4 rounded-full ${getImpactBarColor(impactPercent)}`;
                impactDescription.textContent = impactText;
                disposalInfo.classList.remove('hidden');
            }, 300);
        }
        
        // Get color for impact bar
        function getImpactBarColor(percent) {
            if (percent > 80) return 'bg-green-600';
            if (percent > 60) return 'bg-green-500';
            if (percent > 40) return 'bg-yellow-500';
            return 'bg-red-500';
        }
        
        // Initialize the app when DOM is loaded
        document.addEventListener('DOMContentLoaded', initApp);
    


        // DOM Elements
        const dropzone = document.getElementById('dropzone');
        const fileInput = document.getElementById('fileInput');
        const previewImage = document.getElementById('previewImage');
        const classifyBtn = document.getElementById('classifyBtn');
        const resultsContainer = document.getElementById('resultsContainer');
        const classificationResults = document.getElementById('classificationResults');
        const loadingSpinner = document.getElementById('loadingSpinner');
        const tryDemoBtn = document.getElementById('tryDemoBtn');
        const disposalInfo = document.getElementById('disposalInfo');
        const disposalMethod = document.getElementById('disposalMethod');
        const impactBar = document.getElementById('impactBar');
        const impactDescription = document.getElementById('impactDescription');
        
        // Model variables
        let model = null;
        let isModelReady = false;
        
        // Sample disposal recommendations (would normally come from API)
        const disposalMethods = {
            'plastic': 'Place in designated recycling bin. Rinse containers first.',
            'metal': 'Clean and place in metal recycling. Aluminum foil should be clean and balled up.',
            'paper': 'Separate by grade. Remove any plastic windows from envelopes.',
            'organic': 'Compost in designated bin. No meat or dairy in home compost.',
            'glass': 'Sort by color and recycle separately. Do not include broken glass.',
            'electronic': 'Take to e-waste recycling center. Never dispose in regular trash.',
            'hazardous': 'Special handling required. Contact local hazardous waste facility.'
        };
        
        // Initialize the app
        async function initApp() {
            try {
                // Load the MobileNet model
                console.log('Loading model...');
                model = await mobilenet.load();
                isModelReady = true;
                console.log('Model loaded successfully');
                
                // Set up event listeners
                setupEventListeners();
            } catch (error) {
                console.error('Model loading error:', error);
            }
        }
        
        // Set up event listeners
        function setupEventListeners() {
            // Dropzone click event
            dropzone.addEventListener('click', () => fileInput.click());
            
            // File input change event
            fileInput.addEventListener('change', handleFileSelect);
            
            // Drag and drop events
            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('active');
            });
            
            dropzone.addEventListener('dragleave', () => {
                dropzone.classList.remove('active');
            });
            
            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('active');
                
                if (e.dataTransfer.files.length) {
                    const file = e.dataTransfer.files[0];
                    handleFileSelect({ target: { files: [file] } });
                }
            });
            
            // Classify button
            classifyBtn.addEventListener('click', classifyImage);
            
            // Try demo button
            tryDemoBtn.addEventListener('click', () => {
                document.getElementById('demoSection').scrollIntoView({ behavior: 'smooth' });
            });
        }
        
        // Handle file selection
        function handleFileSelect(event) {
            const file = event.target.files[0];
            
            if (file && file.type.match('image.*')) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    previewImage.src = e.target.result;
                    previewImage.classList.remove('hidden');
                    
                    // Enable classify button if model is ready
                    if (isModelReady) {
                        classifyBtn.disabled = false;
                    }
                    
                    // Clear previous results
                    classificationResults.innerHTML = '';
                    disposalInfo.classList.add('hidden');
                    resultsContainer.classList.add('hidden');
                };
                
                reader.readAsDataURL(file);
            }
        }
        
        // Classify image using MobileNet
        async function classifyImage() {
            if (!previewImage.src || !isModelReady) return;
            
            try {
                // Show loading spinner
                loadingSpinner.classList.remove('hidden');
                resultsContainer.classList.add('hidden');
                
                // Classify the image
                const predictions = await model.classify(previewImage);
                
                // Map to waste-specific categories (simplified for demo)
                const wasteCategories = mapToWasteCategories(predictions);
                
                // Display results
                displayResults(wasteCategories);
                
                // Show appropriate disposal method (simulated)
                showDisposalInfo(wasteCategories[0].category);
                
            } catch (error) {
                console.error('Classification error:', error);
                classificationResults.innerHTML = `
                    <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
                        <p>Error classifying image: ${error.message}</p>
                    </div>
                `;
            } finally {
                loadingSpinner.classList.add('hidden');
                resultsContainer.classList.remove('hidden');
            }
        }
        
        // Map general ImageNet predictions to waste-specific categories
        function mapToWasteCategories(predictions) {
            // This is a simplified mapping for demo purposes
            // In a real app, you would have a more sophisticated mapping or custom model
            
            const wasteMapping = {
                'bottle': { category: 'plastic', confidence: 0.9 },
                'can': { category: 'metal', confidence: 0.85 },
                'newspaper': { category: 'paper', confidence: 0.8 },
                'banana': { category: 'organic', confidence: 0.95 },
                'jar': { category: 'glass', confidence: 0.88 },
                'computer': { category: 'electronic', confidence: 0.92 },
                'battery': { category: 'hazardous', confidence: 0.97 }
            };
            
            // Find the best matching waste category for each prediction
            return predictions.map(pred => {
                const className = pred.className.toLowerCase();
                let bestMatch = null;
                
                // Check for direct matches first
                for (const [key, value] of Object.entries(wasteMapping)) {
                    if (className.includes(key)) {
                        bestMatch = { ...value };
                        break;
                    }
                }
                
                // If no direct match, use generic waste classification
                if (!bestMatch) {
                    bestMatch = {
                        category: classifyGeneralWaste(className),
                        confidence: pred.probability
                    };
                }
                
                return {
                    className: pred.className,
                    probability: pred.probability,
                    category: bestMatch.category,
                    confidence: bestMatch.confidence
                };
            });
        }
        
        // Classify general waste types based on keywords
        function classifyGeneralWaste(className) {
            const plasticKeywords = ['plastic', 'bottle', 'bag', 'container'];
            const metalKeywords = ['can', 'metal', 'aluminum', 'steel'];
            const paperKeywords = ['paper', 'cardboard', 'newspaper', 'envelope'];
            const organicKeywords = ['food', 'fruit', 'vegetable', 'banana', 'apple'];
            const glassKeywords = ['glass', 'jar', 'bottle'];
            const electronicKeywords = ['electronic', 'computer', 'phone', 'device'];
            const hazardousKeywords = ['battery', 'chemical', 'hazardous', 'toxic'];
            
            if (plasticKeywords.some(kw => className.includes(kw))) return 'plastic';
            if (metalKeywords.some(kw => className.includes(kw))) return 'metal';
            if (paperKeywords.some(kw => className.includes(kw))) return 'paper';
            if (organicKeywords.some(kw => className.includes(kw))) return 'organic';
            if (glassKeywords.some(kw => className.includes(kw))) return 'glass';
            if (electronicKeywords.some(kw => className.includes(kw))) return 'electronic';
            if (hazardousKeywords.some(kw => className.includes(kw))) return 'hazardous';
            
            // Default to general waste if no specific category matched
            return 'general';
        }
        
        // Display classification results
        function displayResults(predictions) {
            classificationResults.innerHTML = '';
            
            // Display top 3 predictions
            predictions.slice(0, 3).forEach((pred, index) => {
                const confidencePercent = Math.round(pred.probability * 100);
                
                const resultElement = document.createElement('div');
                resultElement.className = 'classification-card bg-gray-50 p-4 rounded';
                resultElement.innerHTML = `
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-semibold">${pred.className}</span>
                        <span class="text-gray-600">${confidencePercent}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2.5">
                        <div class="bg-green-600 h-2.5 rounded-full" style="width: ${confidencePercent}%"></div>
                    </div>
                    <div class="mt-2 flex items-center">
                        <span class="inline-block px-2 py-1 text-xs rounded-full bg-${getCategoryColor(
                            pred.category
                        )}-100 text-${getCategoryColor(pred.category)}-800">
                            ${pred.category.toUpperCase()}
                        </span>
                    </div>
                `;
                
                classificationResults.appendChild(resultElement);
            });
        }
        
        // Get color based on waste category
        function getCategoryColor(category) {
            const colorMap = {
                'plastic': 'blue',
                'metal': 'indigo',
                'paper': 'yellow',
                'organic': 'green',
                'glass': 'orange',
                'electronic': 'purple',
                'hazardous': 'red',
                'general': 'gray'
            };
            
            return colorMap[category] || 'gray';
        }
        
        // Show disposal information based on waste category
        function showDisposalInfo(category) {
            disposalMethod.textContent = disposalMethods[category] || 'Place in general waste bin. Check local guidelines for specific disposal requirements.';
            
            // Set environmental impact (simplified for demo)
            let impactPercent = 70;
            let impactText = '';
            
            switch(category) {
                case 'plastic':
                case 'metal':
                case 'paper':
                case 'glass':
                    impactPercent = 90;
                    impactText = 'Highly recyclable - Proper disposal reduces landfill waste significantly.';
                    break;
                case 'organic':
                    impactPercent = 80;
                    impactText = 'Compostable - Reduces methane emissions from landfills.';
                    break;
                case 'electronic':
                    impactPercent = 85;
                    impactText = 'Valuable materials recoverable - Prevents hazardous substance leakage.';
                    break;
                case 'hazardous':
                    impactPercent = 95;
                    impactText = 'Critical to dispose properly - Prevents environmental contamination.';
                    break;
                default:
                    impactPercent = 30;
                    impactText = 'Minimal recovery potential - Consider reducing consumption.';
            }
            
            // Animate impact bar
            setTimeout(() => {
                impactBar.style.width = impactPercent + '%';
                impactBar.className = `h-4 rounded-full ${getImpactBarColor(impactPercent)}`;
                impactDescription.textContent = impactText;
                disposalInfo.classList.remove('hidden');
            }, 300);
        }
        
        // Get color for impact bar
        function getImpactBarColor(percent) {
            if (percent > 80) return 'bg-green-600';
            if (percent > 60) return 'bg-green-500';
            if (percent > 40) return 'bg-yellow-500';
            return 'bg-red-500';
        }
        
        // Initialize the app when DOM is loaded
        document.addEventListener('DOMContentLoaded', initApp);
    
