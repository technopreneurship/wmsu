
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
            <input type="text" id="adviserBatchYear" placeholder="Batch Year" required>
            <input type="text" id="adviserBatchCurriculum" placeholder="Batch Curriculum" required>
            <button type="submit">Add Adviser</button>
        </form>
        <h2>Existing Advisers</h2>
        <table id="advisersTable">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Batch Year</th>
                    <th>Batch Curriculum</th>
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
    const batchYear = document.getElementById('adviserBatchYear').value;
    const batchCurriculum = document.getElementById('adviserBatchCurriculum').value;

    db.collection('advisers').add({
        name: name,
        username: username,
        password: password,
        batchYear: batchYear,
        batchCurriculum: batchCurriculum
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
                        <td>${adviser.batchYear}</td>
                        <td>${adviser.batchCurriculum}</td>
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
    let subjectsHtml = `
        <h1>Manage Subjects</h1>
        <form id="addSubjectForm">
            <h2>Add New Subject</h2>
            <input type="text" id="subjectCode" placeholder="Subject Code" required>
            <input type="text" id="subjectDescription" placeholder="Description" required>
            <input type="number" id="subjectLecHours" placeholder="Lecture Hours" required>
            <input type="number" id="subjectLabHours" placeholder="Lab Hours" required>
            <input type="number" id="subjectUnits" placeholder="Units" required>
            <input type="text" id="subjectPreReqs" placeholder="Prerequisites (comma-separated)">
            <select id="subjectSemester">
                <option value="1">First Semester</option>
                <option value="2">Second Semester</option>
            </select>
            <select id="subjectYearLevel">
                <option value="1">First Year</option>
                <option value="2">Second Year</option>
                <option value="3">Third Year</option>
                <option value="4">Fourth Year</option>
            </select>
            <button type="submit">Add Subject</button>
        </form>
        <h2>Existing Subjects</h2>
        <table id="subjectsTable">
            <thead>
                <tr>
                    <th>Code</th>
                    <th>Description</th>
                    <th>Lec</th>
                    <th>Lab</th>
                    <th>Units</th>
                    <th>Pre-Reqs</th>
                    <th>Semester</th>
                    <th>Year</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    `;
    mainContent.innerHTML = subjectsHtml;

    document.getElementById('addSubjectForm').addEventListener('submit', addSubject);
    loadSubjects();
}

function addSubject(e) {
    e.preventDefault();
    const code = document.getElementById('subjectCode').value;
    const description = document.getElementById('subjectDescription').value;
    const lecHours = parseInt(document.getElementById('subjectLecHours').value);
    const labHours = parseInt(document.getElementById('subjectLabHours').value);
    const units = parseInt(document.getElementById('subjectUnits').value);
    const preReqs = document.getElementById('subjectPreReqs').value.split(',').map(item => item.trim());
    const semester = parseInt(document.getElementById('subjectSemester').value);
    const yearLevel = parseInt(document.getElementById('subjectYearLevel').value);

    db.collection('subjects').add({
        code: code,
        description: description,
        lecHours: lecHours,
        labHours: labHours,
        units: units,
        preReqs: preReqs,
        semester: semester,
        yearLevel: yearLevel
    })
    .then(() => {
        alert('Subject added successfully');
        document.getElementById('addSubjectForm').reset();
        loadSubjects();
    })
    .catch((error) => {
        alert('Error adding subject: ' + error.message);
    });
}

function loadSubjects() {
    const tbody = document.querySelector('#subjectsTable tbody');
    tbody.innerHTML = '';

    db.collection('subjects').get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const subject = doc.data();
                const row = `
                    <tr>
                        <td>${subject.code}</td>
                        <td>${subject.description}</td>
                        <td>${subject.lecHours}</td>
                        <td>${subject.labHours}</td>
                        <td>${subject.units}</td>
                        <td>${subject.preReqs.join(', ')}</td>
                        <td>${subject.semester}</td>
                        <td>${subject.yearLevel}</td>
                        <td>
                            <button onclick="editSubject('${doc.id}')">Edit</button>
                            <button onclick="deleteSubject('${doc.id}')">Delete</button>
                        </td>
                    </tr>
                `;
                tbody.insertAdjacentHTML('beforeend', row);
            });
        })
        .catch((error) => {
            console.error("Error loading subjects:", error);
        });
}

function signOut() {
    window.location.href = 'index.html';
}