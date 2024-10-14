

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const mainContent = document.getElementById('mainContent');

document.getElementById('manageAdvisersLink').addEventListener('click', loadManageAdvisers);
document.getElementById('manageSubjectsLink').addEventListener('click', loadManageSubjects);
document.getElementById('signOutLink').addEventListener('click', signOut);

function loadManageAdvisers() {
    let advisersHtml = `
        <h1>Manage Advisers</h1>
        <form id="addAdviserForm">
            <h2>Add New Adviser</h2>
            <input type="text" id="adviserName" placeholder="Name" required>
            <input type="text" id="adviserUsername" placeholder="Username" required>
            <input type="password" id="adviserPassword" placeholder="Password" required>
            <input type="text" id="adviserClassYear" placeholder="Class Year" required>
            <button type="submit">Add Adviser</button>
        </form>
        <h2>Existing Advisers</h2>
        <table id="advisersTable">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Class Year</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    `;
    mainContent.innerHTML = advisersHtml;

    document.getElementById('addAdviserForm').addEventListener('submit', addAdviser);
    loadAdvisers();
}

function addAdviser(e) {
    e.preventDefault();
    const name = document.getElementById('adviserName').value;
    const username = document.getElementById('adviserUsername').value;
    const password = document.getElementById('adviserPassword').value;
    const classYear = document.getElementById('adviserClassYear').value;

    db.collection('advisers').add({
        name: name,
        username: username,
        password: password,
        classYear: classYear
    })
    .then(() => {
        alert('Adviser added successfully');
        document.getElementById('addAdviserForm').reset();
        loadAdvisers();
    })
    .catch((error) => {
        alert('Error adding adviser: ' + error.message);
    });
}

function loadAdvisers() {
    const tbody = document.querySelector('#advisersTable tbody');
    tbody.innerHTML = '';

    db.collection('advisers').get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const adviser = doc.data();
                const row = `
                    <tr>
                        <td>${adviser.name}</td>
                        <td>${adviser.username}</td>
                        <td>${adviser.classYear}</td>
                        <td>
                            <button onclick="editAdviser('${doc.id}')">Edit</button>
                            <button onclick="deleteAdviser('${doc.id}')">Delete</button>
                        </td>
                    </tr>
                `;
                tbody.insertAdjacentHTML('beforeend', row);
            });
        })
        .catch((error) => {
            console.error("Error loading advisers:", error);
        });
}

function editAdviser(id) {
    db.collection('advisers').doc(id).get()
        .then((doc) => {
            if (doc.exists) {
                const adviser = doc.data();
                const editForm = `
                    <h2>Edit Adviser</h2>
                    <form id="editAdviserForm">
                        <input type="text" id="editAdviserName" value="${adviser.name}" required>
                        <input type="text" id="editAdviserUsername" value="${adviser.username}" required>
                        <input type="password" id="editAdviserPassword" placeholder="New Password">
                        <input type="text" id="editAdviserClassYear" value="${adviser.classYear}" required>
                        <button type="submit">Update Adviser</button>
                    </form>
                `;
                mainContent.innerHTML = editForm;

                document.getElementById('editAdviserForm').addEventListener('submit', (e) => {
                    e.preventDefault();
                    const updatedAdviser = {
                        name: document.getElementById('editAdviserName').value,
                        username: document.getElementById('editAdviserUsername').value,
                        classYear: document.getElementById('editAdviserClassYear').value
                    };
                    const newPassword = document.getElementById('editAdviserPassword').value;
                    if (newPassword) {
                        updatedAdviser.password = newPassword;
                    }

                    db.collection('advisers').doc(id).update(updatedAdviser)
                        .then(() => {
                            alert('Adviser updated successfully');
                            loadManageAdvisers();
                        })
                        .catch((error) => {
                            alert('Error updating adviser: ' + error.message);
                        });
                });
            } else {
                console.log("No such document!");
            }
        }).catch((error) => {
            console.log("Error getting document:", error);
        });
}

function deleteAdviser(id) {
    if (confirm('Are you sure you want to delete this adviser?')) {
        db.collection('advisers').doc(id).delete()
            .then(() => {
                alert('Adviser deleted successfully');
                loadAdvisers();
            })
            .catch((error) => {
                alert('Error deleting adviser: ' + error.message);
            });
    }
}

function loadManageSubjects() {
    // Implement subject management functionality here
    mainContent.innerHTML = '<h1>Manage Subjects</h1><p>Subject management functionality to be implemented.</p>';
}

function signOut() {
    window.location.href = 'index.html';
}