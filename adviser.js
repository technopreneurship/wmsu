
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();


const contentArea = document.getElementById('contentArea');
const searchInput = document.getElementById('searchInput');


document.getElementById('studentsLink').addEventListener('click', loadStudents);
document.getElementById('advisersLink').addEventListener('click', loadAdvisers);
document.getElementById('signOutLink').addEventListener('click', signOut);


loadStudents();

function loadStudents() {
    db.collection('students').get()
        .then((querySnapshot) => {
            let studentsHtml = `
                <h1>Students</h1>
                <button onclick="showAddStudentForm()">Add New Student</button>
                <table>
                    <thead>
                        <tr>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>Year Level</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            querySnapshot.forEach((doc) => {
                const student = doc.data();
                studentsHtml += `
                    <tr>
                        <td>${student.studentId}</td>
                        <td>${student.name}</td>
                        <td>${student.yearLevel}</td>
                        <td>
                            <button onclick="viewStudent('${doc.id}')">View</button>
                        </td>
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

function showAddStudentForm() {
    let formHtml = `
        <h2>Add New Student</h2>
        <form id="addStudentForm">
            <input type="text" id="studentId" placeholder="Student ID" required>
            <input type="text" id="studentName" placeholder="Student Name" required>
            <select id="yearLevel" required>
                <option value="">Select Year Level</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
            </select>
            <button type="submit">Add Student</button>
        </form>
    `;
    contentArea.innerHTML = formHtml;
    document.getElementById('addStudentForm').addEventListener('submit', addStudent);
}

function addStudent(e) {
    e.preventDefault();
    const studentId = document.getElementById('studentId').value;
    const studentName = document.getElementById('studentName').value;
    const yearLevel = document.getElementById('yearLevel').value;

    const studentData = {
        studentId: studentId,
        name: studentName,
        yearLevel: parseInt(yearLevel)
    };

    addStudentToFirestore(studentData);
}

function addStudentToFirestore(studentData) {
    db.collection('students').add(studentData)
    .then((docRef) => {
        alert('Student added successfully');
        if (studentData.yearLevel === 1) {
            addFirstYearSubjects(docRef.id);
        } else {
            loadStudents();
        }
    })
    .catch((error) => {
        console.error("Error adding student: ", error);
        alert('Error adding student. Please try again.');
    });
}

function viewStudent(studentId) {
    db.collection('students').doc(studentId).get()
        .then((doc) => {
            if (doc.exists) {
                const student = doc.data();
                let studentHtml = `
                    <h1>Student Profile</h1>
                    <div class="student-profile">
                        <div class="profile-photo">
                            ${student.photoURL ? `<img src="${student.photoURL}" alt="Student Photo" class="student-photo">` : '<div class="no-photo">No Photo</div>'}
                            <form id="photoUploadForm">
                                <input type="file" id="studentPhoto" accept="image/*">
                                <button type="submit">Upload Photo</button>
                            </form>
                        </div>
                        <div class="profile-info">
                            <p><strong>Student ID:</strong> ${student.studentId}</p>
                            <p><strong>Name:</strong> ${student.name}</p>
                            <p><strong>Year Level:</strong> ${student.yearLevel}</p>
                        </div>
                    </div>
                    <h2>Subjects</h2>
                    <div class="year-tabs">
                        <button class="year-tab active" data-year="1">1st Year</button>
                        <button class="year-tab" data-year="2">2nd Year</button>
                        <button class="year-tab" data-year="3">3rd Year</button>
                        <button class="year-tab" data-year="4">4th Year</button>
                    </div>
                    <div id="studentSubjects"></div>
                    <button onclick="showAddSubjectForm('${studentId}')">Add Single Subject</button>
                    <button onclick="showAddSubjectsBySemesterForm('${studentId}')">Add Subjects by Semester</button>
                    <button onclick="loadStudents()">Back to Students List</button>
                `;
                contentArea.innerHTML = studentHtml;
                loadStudentSubjects(studentId);

                document.getElementById('photoUploadForm').addEventListener('submit', function(e) {
                    e.preventDefault();
                    uploadStudentPhoto(studentId);
                });

                const yearTabs = document.querySelectorAll('.year-tab');
                yearTabs.forEach(tab => {
                    tab.addEventListener('click', function() {
                        yearTabs.forEach(t => t.classList.remove('active'));
                        this.classList.add('active');
                        loadStudentSubjects(studentId);
                    });
                });
            } else {
                console.log("No such student!");
            }
        })
        .catch((error) => {
            console.error("Error getting student:", error);
        });
}

function uploadStudentPhoto(studentId) {
    const photoFile = document.getElementById('studentPhoto').files[0];
    if (photoFile) {
       
        const storageRef = firebase.storage().ref();

        
        const fileExtension = photoFile.name.split('.').pop();
        const photoRef = storageRef.child(`student_photos/${studentId}.${fileExtension}`);

       
        photoRef.put(photoFile).then((snapshot) => {
            console.log('Uploaded a file!');
            return snapshot.ref.getDownloadURL();
        }).then((downloadURL) => {
            console.log('File available at', downloadURL);
            return db.collection('students').doc(studentId).update({
                photoURL: downloadURL
            });
        }).then(() => {
            alert('Photo uploaded successfully');
            viewStudent(studentId);
        }).catch((error) => {
            console.error("Error uploading photo: ", error);
            alert('Error uploading photo. Please try again.');
        });
    } else {
        alert('Please select a photo to upload.');
    }
}

function loadStudentSubjects(studentId) {
    const selectedYear = document.querySelector('.year-tab.active').dataset.year;
    db.collection('students').doc(studentId).collection('subjects')
        .where('yearLevel', '==', parseInt(selectedYear))
        .get()
        .then((querySnapshot) => {
            let subjectsHtml = `
                <h3>${selectedYear}st Year</h3>
                <h4>1st Semester</h4>
                <table>
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Description</th>
                            <th>Lec</th>
                            <th>Lab</th>
                            <th>Units</th>
                            <th>Pre-Reqs</th>
                            <th>Grade</th>
                            <th>Remarks</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody id="firstSemesterSubjects"></tbody>
                </table>
                <h4>2nd Semester</h4>
                <table>
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Description</th>
                            <th>Lec</th>
                            <th>Lab</th>
                            <th>Units</th>
                            <th>Pre-Reqs</th>
                            <th>Grade</th>
                            <th>Remarks</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody id="secondSemesterSubjects"></tbody>
                </table>
                <h4>Summer</h4>
                <table>
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Description</th>
                            <th>Lec</th>
                            <th>Lab</th>
                            <th>Units</th>
                            <th>Pre-Reqs</th>
                            <th>Grade</th>
                            <th>Remarks</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody id="summerSubjects"></tbody>
                </table>
            `;
            document.getElementById('studentSubjects').innerHTML = subjectsHtml;

            const firstSemesterSubjects = document.getElementById('firstSemesterSubjects');
            const secondSemesterSubjects = document.getElementById('secondSemesterSubjects');
            const summerSubjects = document.getElementById('summerSubjects');

            querySnapshot.forEach((doc) => {
                const subject = doc.data();
                const remarks = subject.grade ? (parseFloat(subject.grade) <= 3.00 ? 'PASSED' : 'FAILED') : 'N/A';
                const subjectHtml = `
                    <tr>
                        <td>${subject.code}</td>
                        <td>${subject.description}</td>
                        <td>${subject.lecHours}</td>
                        <td>${subject.labHours}</td>
                        <td>${subject.units}</td>
                        <td>${subject.preReqs.join(', ')}</td>
                        <td>${subject.grade || 'N/A'}</td>
                        <td>${remarks}</td>
                        <td>
                            <button onclick="updateGrade('${studentId}', '${doc.id}')">Update Grade</button>
                            <button onclick="deleteSubject('${studentId}', '${doc.id}')">Delete</button>
                        </td>
                    </tr>
                `;
                if (subject.semester === 1) {
                    firstSemesterSubjects.insertAdjacentHTML('beforeend', subjectHtml);
                } else if (subject.semester === 2) {
                    secondSemesterSubjects.insertAdjacentHTML('beforeend', subjectHtml);
                } else if (subject.semester === 3) {
                    summerSubjects.insertAdjacentHTML('beforeend', subjectHtml);
                }
            });
        })
        .catch((error) => {
            console.error("Error loading student subjects:", error);
        });
}

function deleteSubject(studentId, subjectId) {
    if (confirm("Are you sure you want to delete this subject?")) {
        db.collection('students').doc(studentId).collection('subjects').doc(subjectId).delete()
            .then(() => {
                alert("Subject deleted successfully");
                loadStudentSubjects(studentId);
            })
            .catch((error) => {
                console.error("Error deleting subject:", error);
                alert('Error deleting subject. Please try again.');
            });
    }
}

function showAddSubjectForm(studentId) {
    db.collection('subjects').orderBy('yearLevel').orderBy('semester').get()
        .then((querySnapshot) => {
            let formHtml = `
                <h2>Add Subject to Student</h2>
                <div class="subject-selector">
                    <div class="year-tabs">
                        <button class="year-tab active" data-year="1">1st Year</button>
                        <button class="year-tab" data-year="2">2nd Year</button>
                        <button class="year-tab" data-year="3">3rd Year</button>
                        <button class="year-tab" data-year="4">4th Year</button>
                    </div>
                    <div class="semester-tabs">
                        <button class="semester-tab active" data-semester="1">1st Semester</button>
                        <button class="semester-tab" data-semester="2">2nd Semester</button>
                        <button class="semester-tab" data-semester="3">Summer</button>
                    </div>
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
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
                <button onclick="viewStudent('${studentId}')">Back to Student Profile</button>
            `;
            contentArea.innerHTML = formHtml;

            const yearTabs = document.querySelectorAll('.year-tab');
            const semesterTabs = document.querySelectorAll('.semester-tab');
            const subjectsTable = document.getElementById('subjectsTable').querySelector('tbody');

            function updateSubjectsTable() {
                const selectedYear = document.querySelector('.year-tab.active').dataset.year;
                const selectedSemester = document.querySelector('.semester-tab.active').dataset.semester;

                subjectsTable.innerHTML = '';
                querySnapshot.forEach((doc) => {
                    const subject = doc.data();
                    if (subject.yearLevel == selectedYear && subject.semester == selectedSemester) {
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
                                <td><button onclick="addSubjectToStudent('${studentId}', '${doc.id}')">Add</button></td>
                            </tr>
                        `;
                        subjectsTable.insertAdjacentHTML('beforeend', row);
                    }
                });
            }

            yearTabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    yearTabs.forEach(t => t.classList.remove('active'));
                    this.classList.add('active');
                    updateSubjectsTable();
                });
            });

            semesterTabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    semesterTabs.forEach(t => t.classList.remove('active'));
                    this.classList.add('active');
                    updateSubjectsTable();
                });
            });

            updateSubjectsTable();
        })
        .catch((error) => {
            console.error("Error loading subjects:", error);
        });
}

function addSubjectToStudent(studentId, subjectId) {
    db.collection('subjects').doc(subjectId).get()
        .then((doc) => {
            if (doc.exists) {
                const subjectData = doc.data();
                return db.collection('students').doc(studentId).collection('subjects')
                    .where('code', '==', subjectData.code)
                    .get()
                    .then((querySnapshot) => {
                        if (querySnapshot.empty) {
                            return db.collection('students').doc(studentId).collection('subjects').add(subjectData);
                        } else {
                            throw new Error("Subject already exists for this student");
                        }
                    });
            } else {
                throw new Error("Subject not found");
            }
        })
        .then(() => {
            alert('Subject added successfully');
            loadStudentSubjects(studentId);
        })
        .catch((error) => {
            console.error("Error adding subject to student:", error);
            alert('Error adding subject: ' + error.message);
        });
}

function showAddSubjectsBySemesterForm(studentId) {
    let formHtml = `
        <h2>Add Subjects by Semester</h2>
        <form id="addSubjectsBySemesterForm">
            <select id="yearLevel" required>
                <option value="">Select Year Level</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
            </select>
            <select id="semester" required>
                <option value="">Select Semester</option>
                <option value="1">1st Semester</option>
                <option value="2">2nd Semester</option>
            </select>
            <button type="submit">Add Subjects</button>
        </form>
        <button onclick="viewStudent('${studentId}')">Back to Student Profile</button>
    `;
    contentArea.innerHTML = formHtml;
    document.getElementById('addSubjectsBySemesterForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addSubjectsBySemester(studentId);
    });
}

function addSubjectsBySemester(studentId) {
    const yearLevel = document.getElementById('yearLevel').value;
    const semester = document.getElementById('semester').value;

    db.collection('subjects')
        .where('yearLevel', '==', parseInt(yearLevel))
        .where('semester', '==', parseInt(semester))
        .get()
        .then((querySnapshot) => {
            const batch = db.batch();
            const existingSubjects = new Set();

            return db.collection('students').doc(studentId).collection('subjects').get()
                .then((existingSnapshot) => {
                    existingSnapshot.forEach(doc => {
                        existingSubjects.add(doc.data().code);
                    });

                    querySnapshot.forEach((doc) => {
                        const subjectData = doc.data();
                        if (!existingSubjects.has(subjectData.code)) {
                            const newSubjectRef = db.collection('students').doc(studentId).collection('subjects').doc();
                            batch.set(newSubjectRef, subjectData);
                        }
                    });

                    return batch.commit();
                });
        })
        .then(() => {
            alert('Subjects added successfully');
            viewStudent(studentId);
        })
        .catch((error) => {
            console.error("Error adding subjects by semester:", error);
            alert('Error adding subjects. Please try again.');
        });
}

function updateGrade(studentId, subjectId) {
    const newGrade = prompt("Enter the new grade:");
    if (newGrade !== null) {
        const grade = parseFloat(newGrade);
        if (!isNaN(grade) && grade >= 1.00 && grade <= 5.00) {
            db.collection('students').doc(studentId).collection('subjects').doc(subjectId).update({
                grade: grade.toFixed(2)
            })
            .then(() => {
                alert("Grade updated successfully");
                loadStudentSubjects(studentId);
            })
            .catch((error) => {
                console.error("Error updating grade:", error);
                alert('Error updating grade. Please try again.');
            });
        } else {
            alert('Please enter a valid grade between 1.00 and 5.00');
        }
    }
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
    
    window.location.href = 'index.html';
}


searchInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    const rows = document.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
});

function addFirstYearSubjects(studentId) {
    db.collection('subjects').where('yearLevel', '==', 1).get()
        .then((querySnapshot) => {
            const batch = db.batch();
            querySnapshot.forEach((doc) => {
                const subject = doc.data();
                const subjectRef = db.collection('students').doc(studentId).collection('subjects').doc();
                batch.set(subjectRef, subject);
            });
            return batch.commit();
        })
        .then(() => {
            console.log('First year subjects added successfully');
            loadStudents();
        })
        .catch((error) => {
            console.error("Error adding first year subjects: ", error);
            alert('Error adding first year subjects. Please try again.');
        });
}