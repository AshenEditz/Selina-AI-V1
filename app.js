// ========================================
// SELINA AI - Created by Ashen Editz
// ========================================

// Supabase Configuration
const SUPABASE_URL = 'https://hiioghyspeuqldkpgymx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpaW9naHlzcGV1cWxka3BneW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MzkyMTgsImV4cCI6MjA4MjUxNTIxOH0.efdghd597C7NSaJjdYaKG-Gcf2-VX4j6EwZYkblltZ4';

// Initialize Supabase Client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// App State
const AppState = {
    user: null,
    sessionId: null,
    conversationHistory: [],
    currentOutfit: 'casual',
    currentTheme: 'nature',
    isListening: false,
    voiceSpeed: 1,
    friendshipPoints: 0
};

// Outfit Colors for 3D Model
const OutfitColors = {
    casual: { primary: 0x00d4ff, secondary: 0x7b2cbf },
    formal: { primary: 0x2c3e50, secondary: 0xecf0f1 },
    sporty: { primary: 0xff6b6b, secondary: 0x4ecdc4 },
    elegant: { primary: 0xe91e63, secondary: 0x9c27b0 }
};

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    // Create particles
    createParticles();
    
    // Initialize 3D Model
    init3DModel();
    
    // Check for existing user
    const savedUser = localStorage.getItem('selina_user');
    if (savedUser) {
        AppState.user = JSON.parse(savedUser);
        await loadUserData();
        hideLoginModal();
    }
    
    // Hide loading screen
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        
        if (!savedUser) {
            document.getElementById('login-modal').classList.remove('hidden');
        }
    }, 2000);
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize speech
    initSpeech();
});

// ========================================
// 3D MODEL (Three.js)
// ========================================

let scene, camera, renderer, avatar, mixer;

function init3DModel() {
    const canvas = document.getElementById('avatar-canvas');
    const container = document.getElementById('model-container');
    
    // Scene
    scene = new THREE.Scene();
    
    // Camera
    camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.z = 5;
    
    // Renderer
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0x00d4ff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    
    const pointLight = new THREE.PointLight(0x7b2cbf, 1, 100);
    pointLight.position.set(-5, 5, 5);
    scene.add(pointLight);
    
    // Create Avatar (Stylized Robot Woman)
    createAvatar();
    
    // Animation Loop
    animate();
    
    // Handle Resize
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

function createAvatar() {
    const group = new THREE.Group();
    
    // Head
    const headGeometry = new THREE.SphereGeometry(0.8, 32, 32);
    const headMaterial = new THREE.MeshPhongMaterial({
        color: 0xffd6c0,
        shininess: 60
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.5;
    group.add(head);
    
    // Hair
    const hairGeometry = new THREE.SphereGeometry(0.85, 32, 32);
    const hairMaterial = new THREE.MeshPhongMaterial({
        color: 0x1a1a2e,
        shininess: 100
    });
    const hair = new THREE.Mesh(hairGeometry, hairMaterial);
    hair.position.y = 1.7;
    hair.scale.set(1, 0.9, 1);
    group.add(hair);
    
    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.12, 16, 16);
    const eyeMaterial = new THREE.MeshPhongMaterial({
        color: 0x00d4ff,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.5
    });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.25, 1.55, 0.65);
    group.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.25, 1.55, 0.65);
    group.add(rightEye);
    
    // Body
    const bodyGeometry = new THREE.CylinderGeometry(0.4, 0.6, 1.5, 32);
    const bodyMaterial = new THREE.MeshPhongMaterial({
        color: OutfitColors.casual.primary,
        shininess: 80
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0;
    body.name = 'body';
    group.add(body);
    
    // Collar/Accent
    const collarGeometry = new THREE.TorusGeometry(0.45, 0.08, 16, 32);
    const collarMaterial = new THREE.MeshPhongMaterial({
        color: OutfitColors.casual.secondary,
        shininess: 100
    });
    const collar = new THREE.Mesh(collarGeometry, collarMaterial);
    collar.position.y = 0.7;
    collar.rotation.x = Math.PI / 2;
    collar.name = 'collar';
    group.add(collar);
    
    // Arms
    const armGeometry = new THREE.CylinderGeometry(0.12, 0.1, 1, 16);
    const armMaterial = new THREE.MeshPhongMaterial({ color: 0xffd6c0 });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.7, 0.2, 0);
    leftArm.rotation.z = Math.PI / 6;
    group.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.7, 0.2, 0);
    rightArm.rotation.z = -Math.PI / 6;
    group.add(rightArm);
    
    // Glow Ring (Tech element)
    const ringGeometry = new THREE.TorusGeometry(1.2, 0.03, 16, 100);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x00d4ff,
        transparent: true,
        opacity: 0.6
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.y = 0.5;
    ring.rotation.x = Math.PI / 2;
    ring.name = 'glowRing';
    group.add(ring);
    
    group.position.y = -0.5;
    scene.add(group);
    avatar = group;
}

function animate() {
    requestAnimationFrame(animate);
    
    if (avatar) {
        // Gentle floating animation
        avatar.position.y = -0.5 + Math.sin(Date.now() * 0.001) * 0.1;
        avatar.rotation.y = Math.sin(Date.now() * 0.0005) * 0.2;
        
        // Glow ring rotation
        const ring = avatar.getObjectByName('glowRing');
        if (ring) {
            ring.rotation.z += 0.01;
        }
    }
    
    renderer.render(scene, camera);
}

function changeOutfit(outfit) {
    AppState.currentOutfit = outfit;
    const colors = OutfitColors[outfit];
    
    if (avatar) {
        const body = avatar.getObjectByName('body');
        const collar = avatar.getObjectByName('collar');
        
        if (body) {
            body.material.color.setHex(colors.primary);
        }
        if (collar) {
            collar.material.color.setHex(colors.secondary);
        }
    }
    
    document.getElementById('current-outfit').textContent = 
        outfit.charAt(0).toUpperCase() + outfit.slice(1);
    
    saveUserPreferences();
}

// ========================================
// PARTICLES
// ========================================

function createParticles() {
    const container = document.getElementById('particles');
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (15 + Math.random() * 10) + 's';
        container.appendChild(particle);
    }
}

// ========================================
// SPEECH RECOGNITION & SYNTHESIS
// ========================================

let recognition;
let synthesis;

function initSpeech() {
    // Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onstart = () => {
            AppState.isListening = true;
            document.getElementById('mic-btn').classList.add('listening');
            document.getElementById('voice-status').textContent = 'Listening...';
        };
        
        recognition.onend = () => {
            AppState.isListening = false;
            document.getElementById('mic-btn').classList.remove('listening');
            document.getElementById('voice-status').textContent = 'Tap to speak';
        };
        
        recognition.onresult = async (event) => {
            const transcript = event.results[0][0].transcript;
            await processUserInput(transcript);
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            document.getElementById('voice-status').textContent = 'Error. Tap to try again';
            AppState.isListening = false;
            document.getElementById('mic-btn').classList.remove('listening');
        };
    }
    
    // Speech Synthesis
    synthesis = window.speechSynthesis;
}

function startListening() {
    if (recognition && !AppState.isListening) {
        recognition.start();
    }
}

function speak(text) {
    if (synthesis) {
        synthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = AppState.voiceSpeed;
        utterance.pitch = 1.1;
        
        // Try to get a female voice
        const voices = synthesis.getVoices();
        const femaleVoice = voices.find(v => 
            v.name.includes('Female') || 
            v.name.includes('Samantha') ||
            v.name.includes('Google UK English Female')
        );
        if (femaleVoice) {
            utterance.voice = femaleVoice;
        }
        
        synthesis.speak(utterance);
    }
}

// ========================================
// AI PROCESSING
// ========================================

async function processUserInput(input) {
    showTyping(true);
    
    try {
        // Add to conversation history
        AppState.conversationHistory.push({
            role: 'user',
            content: input,
            timestamp: new Date().toISOString()
        });
        
        // Check for search intent
        if (input.toLowerCase().includes('search') || 
            input.toLowerCase().includes('find') ||
            input.toLowerCase().includes('google')) {
            await performSearch(input);
            return;
        }
        
        // Get AI response
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: input,
                history: AppState.conversationHistory.slice(-10),
                userName: AppState.user?.name || 'Friend',
                friendshipLevel: Math.floor(AppState.friendshipPoints / 100) + 1
            })
        });
        
        const data = await response.json();
        
        if (data.response) {
            showResponse(data.response);
            speak(data.response);
            
            // Update friendship
            AppState.friendshipPoints += 5;
            updateFriendshipDisplay();
            
            // Save to database
            await saveConversation(input, data.response);
            
            // Self-learning: Save new knowledge
            if (data.learnedInfo) {
                await saveKnowledge(data.learnedInfo);
            }
        }
        
    } catch (error) {
        console.error('Error processing input:', error);
        showResponse("I'm sorry, I had trouble understanding. Can you try again?");
    }
    
    showTyping(false);
}

async function performSearch(query) {
    try {
        const response = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        
        const data = await response.json();
        
        if (data.results) {
            displaySearchResults(data.results);
            changeBackgroundForSearch();
            
            const summary = `I found ${data.results.length} results for you. Here's what I discovered: ${data.results[0]?.snippet || 'Various interesting information'}`;
            showResponse(summary);
            speak(summary);
        }
        
    } catch (error) {
        console.error('Search error:', error);
        showResponse("I couldn't complete the search. Please try again.");
    }
    
    showTyping(false);
}

function displaySearchResults(results) {
    const container = document.getElementById('results-content');
    const searchPanel = document.getElementById('search-results');
    
    container.innerHTML = '';
    results.forEach(result => {
        container.innerHTML += `
            <div class="result-item">
                <h4>${result.title}</h4>
                <p>${result.snippet}</p>
            </div>
        `;
    });
    
    searchPanel.classList.remove('hidden');
}

function changeBackgroundForSearch() {
    // Dynamically change background based on search context
    document.body.classList.remove('theme-galaxy', 'theme-nature', 'theme-city', 'theme-ocean');
    document.body.classList.add('theme-galaxy');
    setTimeout(() => {
        document.body.classList.remove('theme-galaxy');
        document.body.classList.add(`theme-${AppState.currentTheme}`);
    }, 3000);
}

// ========================================
// DATABASE OPERATIONS
// ========================================

async function saveUser(name, email) {
    try {
        const { data, error } = await supabase
            .from('users')
            .insert([{
                name: name,
                email: email || null,
                friendship_points: 0,
                preferences: {
                    outfit: 'casual',
                    theme: 'nature',
                    voiceSpeed: 1
                },
                created_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        AppState.user = data;
        localStorage.setItem('selina_user', JSON.stringify(data));
        
        return data;
    } catch (error) {
        console.error('Error saving user:', error);
        // Fallback to local storage only
        const localUser = {
            id: 'local_' + Date.now(),
            name: name,
            email: email,
            friendship_points: 0,
            created_at: new Date().toISOString()
        };
        localStorage.setItem('selina_user', JSON.stringify(localUser));
        AppState.user = localUser;
        return localUser;
    }
}

async function loadUserData() {
    if (!AppState.user?.id) return;
    
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', AppState.user.id)
            .single();
        
        if (data) {
            AppState.user = data;
            AppState.friendshipPoints = data.friendship_points || 0;
            
            if (data.preferences) {
                AppState.currentOutfit = data.preferences.outfit || 'casual';
                AppState.currentTheme = data.preferences.theme || 'nature';
                AppState.voiceSpeed = data.preferences.voiceSpeed || 1;
            }
            
            updateUserDisplay();
            applyUserPreferences();
        }
    } catch (error) {
        console.error('Error loading user:', error);
    }
}

async function saveConversation(userMessage, aiResponse) {
    if (!AppState.user?.id) return;
    
    try {
        await supabase.from('conversations').insert([{
            user_id: AppState.user.id,
            user_message: userMessage,
            ai_response: aiResponse,
            timestamp: new Date().toISOString()
        }]);
    } catch (error) {
        console.error('Error saving conversation:', error);
    }
}

async function saveKnowledge(knowledge) {
    try {
        await supabase.from('knowledge_base').insert([{
            topic: knowledge.topic,
            content: knowledge.content,
            source: 'conversation',
            learned_at: new Date().toISOString()
        }]);
    } catch (error) {
        console.error('Error saving knowledge:', error);
    }
}

async function saveUserPreferences() {
    if (!AppState.user?.id) return;
    
    try {
        await supabase.from('users').update({
            preferences: {
                outfit: AppState.currentOutfit,
                theme: AppState.currentTheme,
                voiceSpeed: AppState.voiceSpeed
            },
            friendship_points: AppState.friendshipPoints
        }).eq('id', AppState.user.id);
    } catch (error) {
        console.error('Error saving preferences:', error);
    }
}

// ========================================
// UI FUNCTIONS
// ========================================

function showTyping(show) {
    const typing = document.querySelector('.typing-indicator');
    const responseText = document.getElementById('response-text');
    
    if (show) {
        typing.classList.remove('hidden');
        responseText.classList.add('hidden');
    } else {
        typing.classList.add('hidden');
        responseText.classList.remove('hidden');
    }
}

function showResponse(text) {
    document.getElementById('response-text').textContent = text;
}

function updateUserDisplay() {
    document.getElementById('display-name').textContent = AppState.user?.name || 'Guest';
    document.getElementById('friendship-level').textContent = 
        Math.floor(AppState.friendshipPoints / 100) + 1;
    document.getElementById('member-since').textContent = 
        new Date(AppState.user?.created_at).toLocaleDateString();
    updateFriendshipDisplay();
}

function updateFriendshipDisplay() {
    const level = Math.floor(AppState.friendshipPoints / 100) + 1;
    const progress = (AppState.friendshipPoints % 100);
    document.getElementById('friendship-level').textContent = level;
    document.getElementById('friendship-bar-fill').style.width = progress + '%';
}

function applyUserPreferences() {
    // Apply theme
    document.body.classList.remove('theme-galaxy', 'theme-nature', 'theme-city', 'theme-ocean');
    document.body.classList.add(`theme-${AppState.currentTheme}`);
    
    // Apply outfit
    changeOutfit(AppState.currentOutfit);
    
    // Apply voice speed
    document.getElementById('voice-speed').value = AppState.voiceSpeed;
    
    // Update buttons
    document.querySelectorAll('.outfit-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.outfit === AppState.currentOutfit);
    });
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === AppState.currentTheme);
    });
}

function hideLoginModal() {
    document.getElementById('login-modal').classList.add('hidden');
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
    // Login
    document.getElementById('start-btn').addEventListener('click', async () => {
        const name = document.getElementById('login-name').value.trim();
        const email = document.getElementById('login-email').value.trim();
        
        if (!name) {
            alert('Please enter your name');
            return;
        }
        
        await saveUser(name, email);
        hideLoginModal();
        updateUserDisplay();
        
        const greeting = `Hello ${name}! I'm Selina, your AI assistant created by Ashen Editz. It's wonderful to meet you! How can I help you today?`;
        showResponse(greeting);
        speak(greeting);
    });
    
    // Microphone
    document.getElementById('mic-btn').addEventListener('click', startListening);
    
    // Quick Actions
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            handleQuickAction(action);
        });
    });
    
    // Settings
    document.getElementById('settings-btn').addEventListener('click', () => {
        document.getElementById('settings-panel').classList.add('show');
    });
    
    document.getElementById('close-settings').addEventListener('click', () => {
        document.getElementById('settings-panel').classList.remove('show');
    });
    
    // Theme toggle in header
    document.getElementById('theme-toggle').addEventListener('click', () => {
        const themes = ['galaxy', 'nature', 'city', 'ocean'];
        const currentIndex = themes.indexOf(AppState.currentTheme);
        const nextTheme = themes[(currentIndex + 1) % themes.length];
        changeTheme(nextTheme);
    });
    
    // Outfit buttons
    document.querySelectorAll('.outfit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.outfit-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            changeOutfit(btn.dataset.outfit);
        });
    });
    
    // Theme buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            changeTheme(btn.dataset.theme);
        });
    });
    
    // Voice speed
    document.getElementById('voice-speed').addEventListener('input', (e) => {
        AppState.voiceSpeed = parseFloat(e.target.value);
        saveUserPreferences();
    });
    
    // Save name
    document.getElementById('save-name').addEventListener('click', async () => {
        const newName = document.getElementById('user-name-input').value.trim();
        if (newName && AppState.user) {
            AppState.user.name = newName;
            localStorage.setItem('selina_user', JSON.stringify(AppState.user));
            
            if (AppState.user.id && !AppState.user.id.startsWith('local_')) {
                await supabase.from('users').update({ name: newName })
                    .eq('id', AppState.user.id);
            }
            
            updateUserDisplay();
            speak(`Nice! I'll call you ${newName} from now on.`);
        }
    });
    
    // Close search results
    document.getElementById('close-results').addEventListener('click', () => {
        document.getElementById('search-results').classList.add('hidden');
    });
}

function changeTheme(theme) {
    AppState.currentTheme = theme;
    document.body.classList.remove('theme-galaxy', 'theme-nature', 'theme-city', 'theme-ocean');
    document.body.classList.add(`theme-${theme}`);
    saveUserPreferences();
}

function handleQuickAction(action) {
    switch(action) {
        case 'search':
            speak("What would you like me to search for?");
            showResponse("What would you like me to search for? Tap the microphone and tell me!");
            setTimeout(startListening, 1500);
            break;
        case 'learn':
            speak("I'm ready to help you learn! What topic interests you today?");
            showResponse("I'm your educational helper! Ask me about any topic - science, history, math, languages, or anything else you want to learn.");
            setTimeout(startListening, 2000);
            break;
        case 'friend':
            const friendMsg = `We're at friendship level ${Math.floor(AppState.friendshipPoints / 100) + 1}! Keep talking with me to increase our friendship. I love our conversations!`;
            speak(friendMsg);
            showResponse(friendMsg);
            document.getElementById('user-panel').classList.add('show');
            break;
        case 'help':
            speak("I can help you search the web, learn new things, answer questions, and be your friend! Just tap the microphone and talk to me.");
            showResponse("🎤 Tap microphone to talk\n🔍 Search: Ask me to find anything\n📚 Learn: I can teach many topics\n❤️ Friend: Build friendship by chatting\n\nI'm Selina, created by Ashen Editz!");
            break;
    }
}

// Close panels on outside click
document.addEventListener('click', (e) => {
    const settingsPanel = document.getElementById('settings-panel');
    const userPanel = document.getElementById('user-panel');
    
    if (!settingsPanel.contains(e.target) && 
        !document.getElementById('settings-btn').contains(e.target)) {
        settingsPanel.classList.remove('show');
    }
});

// Load voices when available
if (speechSynthesis) {
    speechSynthesis.addEventListener('voiceschanged', () => {
        // Voices loaded
    });
}

console.log('🤖 Selina AI Initialized - Created by Ashen Editz');
