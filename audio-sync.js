document.addEventListener('DOMContentLoaded', () => {
    const musicBtn = document.getElementById('musicToggleBtn');
    const musicStatusText = document.getElementById('musicStatusText');
    const musicPanel = document.getElementById('musicPanel');
    const volumeSlider = document.getElementById('volumeSlider');
    const songButtons = document.querySelectorAll('.btn-pixel-song');

    if (!musicBtn || !volumeSlider || songButtons.length === 0) return;

    // Load saved music state from localStorage
    const savedState = JSON.parse(localStorage.getItem('fluffodoro_audio_state')) || {
        isPlaying: false,
        songSrc: songButtons[0].getAttribute('data-src'),
        volume: 0.5,
        currentTime: 0,
        lastUpdated: Date.now()
    };

    // Calculate elapsed time if music was playing
    let initialTime = savedState.currentTime || 0;
    if (savedState.isPlaying && savedState.lastUpdated) {
        const elapsed = (Date.now() - savedState.lastUpdated) / 1000;
        initialTime += elapsed;
    }

    // Initialize Audio
    const bgMusic = new Audio(savedState.songSrc);
    bgMusic.loop = true;
    bgMusic.volume = savedState.volume;

    let isPlaying = savedState.isPlaying;

    // Restore volume slider value
    volumeSlider.value = savedState.volume;

    // Set active song button state in UI
    songButtons.forEach(btn => {
        if (btn.getAttribute('data-src') === savedState.songSrc) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Save audio state helper function
    const saveState = () => {
        const state = {
            isPlaying: isPlaying,
            songSrc: bgMusic.src.replace(window.location.origin + '/', ''),
            volume: bgMusic.volume,
            currentTime: bgMusic.currentTime,
            lastUpdated: Date.now()
        };
        localStorage.setItem('fluffodoro_audio_state', JSON.stringify(state));
    };

    // Resume play state if enabled
    if (isPlaying) {
        bgMusic.currentTime = initialTime;
        bgMusic.play().then(() => {
            musicStatusText.textContent = 'MUSIC: ON';
        }).catch(() => {
            // Autoplay blocked by browser policy
            isPlaying = false;
            musicStatusText.textContent = 'MUSIC: OFF';
            saveState();
        });
    } else {
        musicStatusText.textContent = 'MUSIC: OFF';
    }

    // Save audio position frequently
    setInterval(() => {
        if (isPlaying) {
            saveState();
        }
    }, 1000);

    // Toggle Music Menu / Play & Pause
    musicBtn.addEventListener('click', () => {
        musicPanel.classList.toggle('d-none');

        if (isPlaying) {
            bgMusic.pause();
            isPlaying = false;
            musicStatusText.textContent = 'MUSIC: OFF';
        } else {
            bgMusic.play();
            isPlaying = true;
            musicStatusText.textContent = 'MUSIC: ON';
        }
        saveState();
    });

    // Track Switcher
    songButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            songButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const newSrc = btn.getAttribute('data-src');
            bgMusic.src = newSrc;
            bgMusic.currentTime = 0;

            if (isPlaying) {
                bgMusic.play();
            }
            saveState();
        });
    });

    // Volume Control
    volumeSlider.addEventListener('input', (e) => {
        bgMusic.volume = e.target.value;
        saveState();
    });

    // Save state on page unload
    window.addEventListener('beforeunload', saveState);
});