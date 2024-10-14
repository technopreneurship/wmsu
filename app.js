

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Login functionality
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (username === "admin" && password === "admin") {
            // Admin login
            window.location.href = 'admin-dashboard.html';
        } else {
            // Regular user login
            db.collection('advisers')
                .where('username', '==', username)
                .get()
                .then((querySnapshot) => {
                    if (!querySnapshot.empty) {
                        const adviser = querySnapshot.docs[0].data();
                        if (adviser.password === password) {
                            console.log('Login successful');
                            window.location.href = 'adviser-dashboard.html';
                        } else {
                            alert('Invalid username or password');
                        }
                    } else {
                        alert('Invalid username or password');
                    }
                })
                .catch((error) => {
                    console.error('Error during login:', error);
                    alert('An error occurred. Please try again.');
                });
        }
    });
}

// Dashboard functionality
const mainContent = document.getElementById('mainContent');
if (mainContent) {
    // Load students page by default
    loadStudents();

    // Add event listeners for sidebar links
    document.getElementById('studentsLink').addEventListener('click', loadStudents);
    document.getElementById('advisersLink').addEventListener('click', loadAdvisers);
    document.getElementById('signOutLink').addEventListener('click', signOut);
}

function loadStudents() {
    db.collection('students').get()
        .then((querySnapshot) => {
            let studentsHtml = `
                <h1>Students</h1>
                <input type="text" class="search-bar" placeholder="Search">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Year Level</th>
                            <th>Student ID</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            querySnapshot.forEach((doc) => {
                const student = doc.data();
                studentsHtml += `
                    <tr>
                        <td>${student.name}</td>
                        <td>${student.yearLevel}</td>
                        <td>${student.studentId}</td>
                        <td>
                            <button onclick="editStudent('${doc.id}')">Edit</button>
                            <button onclick="deleteStudent('${doc.id}')">Delete</button>
                        </td>
                    </tr>
                `;
            });
            studentsHtml += `
                    </tbody>
                </table>
            `;
            mainContent.innerHTML = studentsHtml;
        })
        .catch((error) => {
            console.error("Error loading students: ", error);
        });
}

function loadAdvisers() {
    db.collection('advisers').get()
        .then((querySnapshot) => {
            let advisersHtml = `
                <h1>Advisers</h1>
                <input type="text" class="search-bar" placeholder="Search">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Username</th>
                            <th>Batch Year</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            querySnapshot.forEach((doc) => {
                const adviser = doc.data();
                advisersHtml += `
                    <tr>
                        <td>${adviser.name}</td>
                        <td>${adviser.username}</td>
                        <td>${adviser.batchYear}</td>
                        <td>
                            <button onclick="editAdviser('${doc.id}')">Edit</button>
                            <button onclick="deleteAdviser('${doc.id}')">Delete</button>
                        </td>
                    </tr>
                `;
            });
            advisersHtml += `
                    </tbody>
                </table>
                <button onclick="showAddAdviserForm()">Add Adviser</button>
            `;
            mainContent.innerHTML = advisersHtml;
        })
        .catch((error) => {
            console.error("Error loading advisers: ", error);
        });
}

function editStudent(id) {
    // Implement edit student functionality
    console.log("Edit student:", id);
    // You can implement a form or modal to edit student details
}

function deleteStudent(id) {
    if (confirm("Are you sure you want to delete this student?")) {
        db.collection('students').doc(id).delete()
            .then(() => {
                console.log("Student successfully deleted!");
                loadStudents(); // Reload the students list
            })
            .catch((error) => {
                console.error("Error removing student: ", error);
            });
    }
}

function editAdviser(id) {
    // Implement edit adviser functionality
    console.log("Edit adviser:", id);
    // You can implement a form or modal to edit adviser details
}

function deleteAdviser(id) {
    if (confirm("Are you sure you want to delete this adviser?")) {
        db.collection('advisers').doc(id).delete()
            .then(() => {
                console.log("Adviser successfully deleted!");
                loadAdvisers(); // Reload the advisers list
            })
            .catch((error) => {
                console.error("Error removing adviser: ", error);
            });
    }
}

function showAddAdviserForm() {
    const formHtml = `
        <h2>Add New Adviser</h2>
        <form id="addAdviserForm">
            <input type="text" id="adviserName" placeholder="Name" required>
            <input type="text" id="adviserUsername" placeholder="Username" required>
            <input type="password" id="adviserPassword" placeholder="Password" required>
            <input type="text" id="adviserBatchYear" placeholder="Batch Year" required>
            <button type="submit">Add Adviser</button>
        </form>
    `;
    mainContent.innerHTML = formHtml;

    document.getElementById('addAdviserForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('adviserName').value;
        const username = document.getElementById('adviserUsername').value;
        const password = document.getElementById('adviserPassword').value;
        const batchYear = document.getElementById('adviserBatchYear').value;

        db.collection('advisers').add({
            name: name,
            username: username,
            password: password,
            batchYear: batchYear
        })
        .then(() => {
            alert('Adviser added successfully');
            loadAdvisers(); // Reload the advisers list
        })
        .catch((error) => {
            console.error("Error adding adviser: ", error);
        });
    });
}

function signOut() {
    window.location.href = 'index.html';
}