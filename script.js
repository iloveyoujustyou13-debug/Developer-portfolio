// ============================================================
// FIREBASE CONFIGURATION
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyAPTwWHQ2CKyU9nY5VjcG-sMNzmdlUguog",
    authDomain: "dev-portfolio-platform-14126.firebaseapp.com",
    projectId: "dev-portfolio-platform-14126",
    storageBucket: "dev-portfolio-platform-14126.firebasestorage.app",
    messagingSenderId: "321935368169",
    appId: "1:321935368169:web:9094e9bc935c2f47b4f578",
    measurementId: "G-G3WCZY1309"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ============================================================
// AUTHENTICATION FUNCTIONS
// ============================================================

function loginWithGitHub() {
    const provider = new firebase.auth.GithubAuthProvider();
    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            console.log('✅ User logged in:', result.user.displayName);
            alert('✅ Login successful! Welcome ' + result.user.displayName);
            window.location.href = 'dashboard.html';
        })
        .catch((error) => {
            console.error('❌ Login error:', error.message);
            alert('❌ Login failed: ' + error.message);
        });
}

function logout() {
    firebase.auth().signOut()
        .then(() => {
            console.log('✅ User logged out');
            window.location.href = 'index.html';
        })
        .catch((error) => {
            console.error('❌ Logout error:', error.message);
        });
}

function checkAuth() {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            console.log('✅ Logged in:', user.displayName);
            if (document.getElementById('postsContainer')) {
                loadUserPosts();
            }
        } else {
            console.log('❌ Not logged in');
            if (window.location.pathname.includes('dashboard.html')) {
                window.location.href = 'index.html';
            }
        }
    });
}

// ============================================================
// POST FUNCTIONS
// ============================================================

function createNewPost() {
    document.getElementById('postForm').style.display = 'block';
}

function cancelPost() {
    document.getElementById('postForm').style.display = 'none';
    document.getElementById('postTitle').value = '';
    document.getElementById('postTags').value = '';
    document.getElementById('postContent').value = '';
}

function savePost() {
    const title = document.getElementById('postTitle').value.trim();
    const tags = document.getElementById('postTags').value.split(',').map(t => t.trim());
    const content = document.getElementById('postContent').value.trim();

    if (!title || !content) {
        alert('❌ Please fill in title and content.');
        return;
    }

    const user = firebase.auth().currentUser;
    if (!user) {
        alert('❌ Please login first.');
        return;
    }

    db.collection('posts').add({
        title: title,
        tags: tags,
        content: content,
        author: user.displayName || user.email,
        authorId: user.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    })
    .then(() => {
        alert('✅ Post published successfully!');
        cancelPost();
        loadUserPosts();
    })
    .catch(error => {
        alert('❌ Error saving post: ' + error.message);
    });
}

function loadUserPosts() {
    const container = document.getElementById('postsContainer');
    if (!container) return;

    const user = firebase.auth().currentUser;
    if (!user) {
        container.innerHTML = '<p class="loading-text">Please login to see your posts.</p>';
        return;
    }

    db.collection('posts')
        .where('authorId', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                container.innerHTML = '<p class="loading-text">No posts found. Create your first post!</p>';
                return;
            }

            let html = '';
            snapshot.forEach(doc => {
                const post = doc.data();
                html += `
                    <div class="post-item">
                        <span class="post-title">${post.title}</span>
                        <span style="color:#94a3b8;font-size:0.9rem;">${post.tags ? post.tags.join(', ') : ''}</span>
                        <div class="post-actions">
                            <button onclick="viewPost('${doc.id}')">👁️</button>
                            <button onclick="deletePost('${doc.id}')">🗑️</button>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        })
        .catch(error => {
            container.innerHTML = '<p class="loading-text">Error loading posts: ' + error.message + '</p>';
        });
}

function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) return;

    db.collection('posts').doc(postId).delete()
        .then(() => {
            alert('✅ Post deleted successfully.');
            loadUserPosts();
        })
        .catch(error => {
            alert('❌ Error deleting post: ' + error.message);
        });
}

function viewPost(postId) {
    window.location.href = `post.html?id=${postId}`;
}

// ============================================================
// BLOG FUNCTIONS
// ============================================================

function loadBlogPosts() {
    const grid = document.getElementById('blogGrid');
    if (!grid) return;

    db.collection('posts')
        .orderBy('createdAt', 'desc')
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                grid.innerHTML = '<p class="loading-text">No posts published yet.</p>';
                return;
            }

            let html = '';
            snapshot.forEach(doc => {
                const post = doc.data();
                const excerpt = post.content.substring(0, 150) + '...';
                html += `
                    <div class="blog-card" onclick="viewPost('${doc.id}')">
                        <div class="blog-card-title">${post.title}</div>
                        <div class="blog-card-tags">${post.tags ? post.tags.join(' • ') : ''}</div>
                        <div class="blog-card-excerpt">${excerpt}</div>
                    </div>
                `;
            });
            grid.innerHTML = html;
        })
        .catch(error => {
            grid.innerHTML = '<p class="loading-text">Error loading posts: ' + error.message + '</p>';
        });
}

// ============================================================
// POST DETAIL FUNCTIONS
// ============================================================

function loadPostDetail() {
    const container = document.getElementById('postContent');
    if (!container) return;

    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    if (!postId) {
        container.innerHTML = '<p class="loading-text">No post specified.</p>';
        return;
    }

    db.collection('posts').doc(postId).get()
        .then(doc => {
            if (!doc.exists) {
                container.innerHTML = '<p class="loading-text">Post not found.</p>';
                return;
            }

            const post = doc.data();
            let html = `
                <h1>${post.title}</h1>
                <p style="color:#94a3b8;font-size:0.9rem;">By ${post.author} • ${post.createdAt ? post.createdAt.toDate().toDateString() : 'Unknown date'}</p>
                <hr style="border-color:#2a3a4a;margin:1rem 0;">
                <div>${markdownToHtml(post.content)}</div>
            `;
            container.innerHTML = html;
        })
        .catch(error => {
            container.innerHTML = '<p class="loading-text">Error loading post: ' + error.message + '</p>';
        });
}

// ============================================================
// MARKDOWN TO HTML
// ============================================================

function markdownToHtml(markdown) {
    let html = markdown;

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold & Italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');

    // Lists
    html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');

    // Links
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color:#4facfe;">$1</a>');

    // Line breaks
    html = html.replace(/\n/g, '<br>');

    return html;
}

// ============================================================
// PAGE INITIALIZATION
// ============================================================

if (document.getElementById('dashboard-container')) {
    checkAuth();
}

if (document.getElementById('blogGrid')) {
    loadBlogPosts();
}

if (document.getElementById('postContent')) {
    loadPostDetail();
}

console.log('🚀 DevPortfolio loaded successfully!');
