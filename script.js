import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC3zvhM9m-cQa_UPS5UvASs11kWIpYSt0M",
    authDomain: "web-sina.firebaseapp.com",
    projectId: "web-sina",
    storageBucket: "web-sina.firebasestorage.app",
    messagingSenderId: "516905491105",
    appId: "1:516905491105:web:faf495b90f9fda8bc26ee0",
    measurementId: "G-NYDT23XS97"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Setup Bintang Background ---
const starsContainer = document.getElementById('stars-container');
for (let i = 0; i < 100; i++) {
    const star = document.createElement('div');
    star.classList.add('star');
    star.style.width = Math.random() * 3 + 'px';
    star.style.height = star.style.width;
    star.style.left = Math.random() * 100 + 'vw';
    star.style.top = Math.random() * 100 + 'vh';
    star.style.animationDelay = Math.random() * 2 + 's';
    starsContainer.appendChild(star);
}
function createMeteor() {
    const meteor = document.createElement('div');
    meteor.classList.add('meteor');
    meteor.style.left = Math.random() * 100 + 'vw';
    meteor.style.top = Math.random() * -20 + 'vh';
    meteor.style.animationDuration = Math.random() * 2.5 + 1.5 + 's';
    meteor.style.animationDelay = Math.random() * 5 + 's';
    starsContainer.appendChild(meteor);
    setTimeout(() => { meteor.remove(); }, 8000); 
}
setInterval(createMeteor, 800);

// --- Navigasi Halaman ---
const page1 = document.getElementById('page1'); 
const page2 = document.getElementById('page2'); 
const page3 = document.getElementById('page3'); 

const btnOpen = document.getElementById('btn-open');
const btnBackPassword = document.getElementById('btn-back-password');
const btnToGallery = document.getElementById('btn-to-gallery');
const btnBackOrbit = document.getElementById('btn-back-orbit');

const audio = document.getElementById('bg-music');
const pesanVideo = document.getElementById('pesan-video'); 
const passwordInput = document.getElementById('password-input');
const errorMsg = document.getElementById('error-msg');
const glassCard = document.querySelector('.glass-card');
const PASSWORD_BENAR = "25082026"; 

btnOpen.addEventListener('click', () => {
    if (passwordInput.value.trim() === PASSWORD_BENAR) {
        errorMsg.classList.remove('show');
        page1.classList.remove('active');
        page2.classList.add('active');
        audio.play().catch(e => console.log("Lagu diblokir"));
    } else {
        errorMsg.classList.add('show');
        glassCard.classList.add('shake');
        setTimeout(() => { glassCard.classList.remove('shake'); }, 500);
        passwordInput.value = '';
        passwordInput.focus();
    }
});
passwordInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') btnOpen.click(); });

btnBackPassword.addEventListener('click', () => {
    page2.classList.remove('active');
    page1.classList.add('active');
    audio.pause();
    passwordInput.value = '';
    errorMsg.classList.remove('show');
    if(pesanVideo) { pesanVideo.pause(); pesanVideo.currentTime = 0; }
});

btnToGallery.addEventListener('click', () => {
    page2.classList.remove('active');
    page3.classList.add('active');
});

btnBackOrbit.addEventListener('click', () => {
    page3.classList.remove('active');
    page2.classList.add('active');
});

// --- Logika Putaran Foto Orbit (Tetap pakai foto lokal statis) ---
const photosWrapper = document.getElementById('photos-wrapper');
const photoFiles = ["foto1.jpeg", "foto2.jpeg", "foto3.jpeg", "foto4.jpeg", "foto5.jpeg", "foto6.jpeg", "foto7.jpeg", "foto8.jpeg", "foto9.jpeg", "foto10.jpeg"];
const photoPreview = document.getElementById('photo-preview');
const previewImg = document.getElementById('preview-img');

for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * 360; 
    const radian = angle * (Math.PI / 180);
    const x = Math.cos(radian) * 210;
    const y = Math.sin(radian) * 210;

    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.left = '50%';
    div.style.top = '50%';
    div.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;

    const inner = document.createElement('div');
    inner.classList.add('photo-inner');
    inner.style.animationDelay = `-${Math.random() * 25}s`; 

    const img = document.createElement('img');
    img.src = photoFiles[i]; 
    img.classList.add('photo-item');

    img.addEventListener('click', (e) => {
        e.stopPropagation();
        previewImg.src = img.src;
        photoPreview.classList.add('show');
    });

    inner.appendChild(img);
    div.appendChild(inner);
    photosWrapper.appendChild(div);
}

photoPreview.addEventListener('click', () => { photoPreview.classList.remove('show'); });

// --- Efek Hati Diklik (Video) ---
const centerHeart = document.getElementById('center-heart');
centerHeart.addEventListener('click', () => {
    setTimeout(() => {
        document.getElementById('message-overlay').classList.add('show');
        if (pesanVideo) {
            pesanVideo.muted = false; 
            pesanVideo.volume = 1.0;  
            pesanVideo.play().catch(error => console.log("Autoplay diblokir"));
            audio.volume = 0.2; 
        }
    }, 500);
});

const messageOverlay = document.getElementById('message-overlay');
document.getElementById('btn-x-close').addEventListener('click', () => {
    messageOverlay.classList.remove('show');
    if (pesanVideo) { pesanVideo.pause(); pesanVideo.currentTime = 0; }
    audio.volume = 1.0;
});
messageOverlay.addEventListener('click', (e) => {
    if(e.target === messageOverlay) {
        messageOverlay.classList.remove('show');
        if (pesanVideo) { pesanVideo.pause(); }
        audio.volume = 1.0;
    }
});


// ==========================================
// 2. LOGIKA DATABASE FIREBASE (GALERI & SIDEBAR)
// ==========================================
const dynamicGrid = document.getElementById('dynamic-photo-grid');
const uploadInput = document.getElementById('upload-input');
const uploadDateInput = document.getElementById('upload-date');
const loadingGallery = document.getElementById('loading-gallery');
const editableElements = document.querySelectorAll('.editable');

let galleryData = {};

// --- A. Load & Sinkronisasi Galeri (Realtime) ---
onSnapshot(collection(db, "gallery"), (snapshot) => {
    loadingGallery.style.display = 'none'; 
    galleryData = {}; 
    
    snapshot.forEach((doc) => {
        galleryData[doc.id] = doc.data();
    });

    renderGallery();
});

// Render Galeri
function renderGallery() {
    dynamicGrid.innerHTML = ''; 
    const sortedDates = Object.keys(galleryData).sort();

    sortedDates.forEach((date) => {
        const photos = galleryData[date].photos;
        if (!photos || photos.length === 0) return;

        const dateTitle = document.createElement('div');
        dateTitle.classList.add('gallery-date');
        dateTitle.style.width = '100%';
        dateTitle.style.gridColumn = '1 / -1';
        dateTitle.innerText = `Tanggal: ${date}`;
        dynamicGrid.appendChild(dateTitle);

        photos.forEach((photoObj) => {
            const wrapper = document.createElement('div');
            wrapper.classList.add('photo-wrapper');

            const img = document.createElement('img');
            img.src = photoObj.data; 
            img.classList.add('gallery-img');
            
            img.addEventListener('click', () => {
                previewImg.src = photoObj.data;
                photoPreview.classList.add('show');
            });

            const btnDel = document.createElement('button');
            btnDel.classList.add('btn-delete');
            btnDel.innerHTML = '<i class="fas fa-times"></i>';
            
            // HAPUS FOTO DARI DATABASE
            btnDel.addEventListener('click', async (e) => {
                e.stopPropagation(); 
                if(confirm("Hapus foto ini permanen? (Akan terhapus di semua HP)")) {
                    try {
                        const newPhotos = photos.filter(p => p.id !== photoObj.id);
                        const docRef = doc(db, "gallery", date);
                        await updateDoc(docRef, { photos: newPhotos });
                    } catch (error) {
                        alert("Gagal menghapus foto.");
                    }
                }
            });

            wrapper.appendChild(img);
            wrapper.appendChild(btnDel);
            dynamicGrid.appendChild(wrapper);
        });
    });
}

// --- B. Fungsi Kompresi Gambar (Penting agar tidak error 1MB) ---
function compressImage(file, maxWidth = 600, quality = 0.6) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedBase64);
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
}

// --- C. Upload Foto (Base64 ke Firestore) ---
uploadInput.addEventListener('change', async (e) => {
    const files = e.target.files;
    if(!files.length) return;

    let targetDate = uploadDateInput.value.trim();
    if(targetDate === "") {
        alert("Harap isi tanggal upload!");
        uploadInput.value = "";
        return;
    }

    loadingGallery.style.display = 'block';
    loadingGallery.innerText = "Mengompres & mengupload foto...";

    let photoArray = galleryData[targetDate] ? galleryData[targetDate].photos : [];

    for (const file of Array.from(files)) {
        if(!file.type.startsWith('image/')) continue;
        
        try {
            const base64Data = await compressImage(file);
            photoArray.push({
                id: Date.now() + "_" + Math.random(),
                data: base64Data
            });
        } catch (error) {
            console.error("Gagal kompres:", error);
        }
    }

    try {
        const docRef = doc(db, "gallery", targetDate);
        await setDoc(docRef, { photos: photoArray }, { merge: true });
        
        uploadInput.value = '';
        uploadDateInput.value = '';
        loadingGallery.innerText = "Upload berhasil!";
        setTimeout(() => { loadingGallery.style.display = 'none'; }, 2000);
    } catch (error) {
        console.error("Gagal simpan ke DB:", error);
        loadingGallery.innerText = "Gagal menyimpan data (mungkin memori penuh).";
    }
});


// --- D. Sinkronisasi & Edit Sidebar ---
onSnapshot(doc(db, "content", "sidebar"), (docSnap) => {
    if (docSnap.exists()) {
        const sidebarData = docSnap.data();
        editableElements.forEach(el => {
            const key = el.getAttribute('data-key');
            if(sidebarData[key]) {
                if(el.tagName === 'UL') {
                    el.innerHTML = sidebarData[key];
                } else {
                    el.innerText = sidebarData[key];
                }
            }
        });
    }
});

editableElements.forEach(el => {
    el.addEventListener('blur', async () => { 
        let currentData = {};
        editableElements.forEach(item => {
            const key = item.getAttribute('data-key');
            currentData[key] = item.tagName === 'UL' ? item.innerHTML : item.innerText;
        });

        try {
            await setDoc(doc(db, "content", "sidebar"), currentData, { merge: true });
        } catch(e) { console.log("Gagal simpan sidebar", e); }
    });
});
