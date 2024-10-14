// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// DOM elements
const contentArea = document.getElementById('contentArea');
const searchInput = document.getElementById('searchInput');

// Event listeners for sidebar links
document.getElementById('studentsLink').addEventListener('click', loadStudents);
document.getElementById('advisersLink').addEventListener('click', loadAdvisers);
document.getElementById('signOutLink').addEventListener('click', signOut);

// Load students by default
loadStudents();

function loadStudents() {
    db.collection('students').get()
        .then((querySnapshot) => {
            let studentsHtml = `
                <h1>Students</h1>
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Year Level</th>
                            <th>Student ID</th>
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
                    </tr>
                `;
            });
            studentsHtml += `
                    </tbody>
                </table>
            `;
            contentArea.innerHTML = studentsHtml;
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
                <table>
                    <thead>
                        <tr>
                            <th>Adviser</th>
                            <th>Batch Year</th>
                            <th>Batch Curriculum</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            querySnapshot.forEach((doc) => {
                const adviser = doc.data();
                advisersHtml += `
                    <tr>
                        <td>${adviser.name}</td>
                        <td>${adviser.batchYear}</td>
                        <td>${adviser.batchCurriculum}</td>
                    </tr>
                `;
            });
            advisersHtml += `
                    </tbody>
                </table>
            `;
            contentArea.innerHTML = advisersHtml;
        })
        .catch((error) => {
            console.error("Error loading advisers: ", error);
        });
}

function signOut() {
    // Implement sign out logic here
    window.location.href = 'index.html';
}

// Search functionality
searchInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    const rows = document.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
});