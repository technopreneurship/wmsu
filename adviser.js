
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
                            <p><strong>Status:</strong> ${student.status || 'Regular'}</p>
                            <p><strong>Expected Graduation:</strong> ${student.expectedGraduation || 'N/A'}</p>
                            <p><strong>Elective Track:</strong> ${student.elective || 'Not set'}</p>
                        </div>
                    </div>
                    <button onclick="chooseElective('${studentId}')">Choose Elective Track</button>
                    <button onclick="addUpcomingSubjects('${studentId}')">Add Upcoming Subjects</button>
                    <button onclick="viewLogicalProspectus('${studentId}')">View Logical Prospectus</button>
                    <button onclick="updateStudentStatus('${studentId}')">Update Student Status</button>
                    <h2>Subjects</h2>
                    <div class="year-tabs">
                        <button class="year-tab active" data-year="1">1st Year</button>
                        <button class="year-tab" data-year="2">2nd Year</button>
                        <button class="year-tab" data-year="3">3rd Year</button>
                        <button class="year-tab" data-year="4">4th Year</button>
                        <button class="year-tab" data-year="5">5th Year</button>
                        <button class="year-tab" data-year="6">6th Year</button>
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
                        <td>
                            <select class="grade-select" data-subject-id="${doc.id}">
                                ${getGradeOptions(subject.grade)}
                            </select>
                        </td>
                        <td>${remarks}</td>
                        <td>
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

            // Add event listeners for grade selects
            document.querySelectorAll('.grade-select').forEach(select => {
                select.addEventListener('change', function() {
                    updateGrade(studentId, this.dataset.subjectId, this.value);
                });
            });
        })
        .catch((error) => {
            console.error("Error loading student subjects:", error);
        });
}

function getGradeOptions(currentGrade) {
    const gradeOptions = [
        '1.00', '1.25', '1.50', '1.75', '2.00', '2.25', '2.50', '2.75', '3.00', 
        '3.25', '3.50', '3.75', '4.00', '4.25', '4.50', '4.75', '5.00',
        'INC', 'AW', 'UW'
    ];
    let options = '<option value="">Select Grade</option>';
    gradeOptions.forEach(grade => {
        options += `<option value="${grade}" ${currentGrade === grade ? 'selected' : ''}>${grade}</option>`;
    });
    return options;
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

                    <div>
            <label for="targetYearLevel">Add to Year Level:</label>
            <select id="targetYearLevel">
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
            </select>
            <label for="targetSemester">Add to Semester:</label>
            <select id="targetSemester">
                <option value="1">1st Semester</option>
                <option value="2">2nd Semester</option>
                <option value="3">Summer</option>
            </select>
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
    const targetYearLevel = document.getElementById('targetYearLevel').value;
    const targetSemester = document.getElementById('targetSemester').value;

    db.collection('subjects').doc(subjectId).get()
        .then((doc) => {
            if (doc.exists) {
                const subjectData = doc.data();
                return db.collection('students').doc(studentId).get()
                    .then((studentDoc) => {
                        const studentData = studentDoc.data();
                        if (subjectData.isElective && (!studentData.elective || subjectData.elective !== studentData.elective)) {
                            throw new Error("This elective doesn't match the student's chosen elective track.");
                        }
                        return db.collection('students').doc(studentId).collection('subjects').get();
                    })
                    .then((querySnapshot) => {
                        const passedSubjects = new Set();
                        querySnapshot.forEach((doc) => {
                            const subject = doc.data();
                            if (subject.grade && parseFloat(subject.grade) <= 3.00) {
                                passedSubjects.add(subject.code);
                            }
                        });

                        const missingPrereqs = subjectData.preReqs.filter(prereq => !passedSubjects.has(prereq));

                        if (missingPrereqs.length > 0) {
                            throw new Error(`Student is not eligible to take this subject. Missing prerequisites: ${missingPrereqs.join(', ')}`);
                        }

                        return db.collection('students').doc(studentId).collection('subjects').add({
                            ...subjectData,
                            yearLevel: parseInt(targetYearLevel),
                            semester: parseInt(targetSemester)
                        });
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

function addUpcomingSubjects(studentId) {
    db.collection('students').doc(studentId).get()
        .then((studentDoc) => {
            const studentData = studentDoc.data();
            return db.collection('students').doc(studentId).collection('subjects').get()
                .then((subjectsSnapshot) => {
                    const passedSubjects = new Set();
                    const failedSubjects = new Set();
                    let lastFilledSemester = { year: 1, semester: 0 };

                    subjectsSnapshot.forEach((doc) => {
                        const subject = doc.data();
                        if (subject.grade) {
                            if (parseFloat(subject.grade) <= 3.00) {
                                passedSubjects.add(subject.code);
                            } else {
                                failedSubjects.add(subject.code);
                            }
                        }
                        if (subject.yearLevel > lastFilledSemester.year || 
                            (subject.yearLevel === lastFilledSemester.year && subject.semester > lastFilledSemester.semester)) {
                            lastFilledSemester = { year: subject.yearLevel, semester: subject.semester };
                        }
                    });

                    // Determine the next semester
                    let nextSemester = lastFilledSemester.semester + 1;
                    let nextYear = lastFilledSemester.year;
                    if (nextSemester > 2) {
                        nextYear++;
                        nextSemester = 1;
                    }

                    // Get all subjects
                    return db.collection('subjects').get()
                        .then((allSubjectsSnapshot) => {
                            const batch = db.batch();
                            const subjectsToAdd = [];

                            allSubjectsSnapshot.forEach((doc) => {
                                const subject = doc.data();
                                const isEligible = subject.preReqs.every(prereq => passedSubjects.has(prereq));
                                const shouldAdd = (
                                    (subject.yearLevel < nextYear || 
                                    (subject.yearLevel === nextYear && subject.semester <= nextSemester) ||
                                    failedSubjects.has(subject.code)) &&
                                    isEligible &&
                                    (!subject.isElective || subject.elective === studentData.elective) &&
                                    !passedSubjects.has(subject.code)
                                );

                                if (shouldAdd) {
                                    subjectsToAdd.push(subject);
                                }
                            });

                            // Sort subjects by year and semester
                            subjectsToAdd.sort((a, b) => {
                                if (a.yearLevel !== b.yearLevel) {
                                    return a.yearLevel - b.yearLevel;
                                }
                                return a.semester - b.semester;
                            });

                            // Add subjects to the student's record
                            subjectsToAdd.forEach((subject) => {
                                const newSubjectRef = db.collection('students').doc(studentId).collection('subjects').doc();
                                batch.set(newSubjectRef, {
                                    ...subject,
                                    yearLevel: Math.max(subject.yearLevel, nextYear),
                                    semester: subject.yearLevel < nextYear ? subject.semester : nextSemester
                                });
                            });

                            return batch.commit();
                        });
                });
        })
        .then(() => {
            alert('Upcoming subjects added successfully');
            loadStudentSubjects(studentId);
        })
        .catch((error) => {
            console.error("Error adding upcoming subjects:", error);
            alert('Error adding upcoming subjects. Please try again.');
        });
}

function generateSemesterHtml(subjects) {
    if (subjects.length === 0) {
        return '<p>No subjects available</p>';
    }

    let html = '<table class="semester-table"><thead><tr><th>Code</th><th>Description</th><th>Units</th></tr></thead><tbody>';
    subjects.forEach(subject => {
        html += `<tr><td>${subject.code}</td><td>${subject.description}</td><td>${subject.units}</td></tr>`;
    });
    html += '</tbody></table>';
    return html;
}

function viewLogicalProspectus(studentId) {
    db.collection('students').doc(studentId).get()
        .then((studentDoc) => {
            const studentData = studentDoc.data();
            return db.collection('students').doc(studentId).collection('subjects').get()
                .then((subjectsSnapshot) => {
                    const passedSubjects = new Set();
                    const takenSubjects = new Set();

                    subjectsSnapshot.forEach((doc) => {
                        const subject = doc.data();
                        takenSubjects.add(subject.code);
                        if (subject.grade && parseFloat(subject.grade) <= 3.00) {
                            passedSubjects.add(subject.code);
                        }
                    });

                    return db.collection('subjects').get()
                        .then((allSubjectsSnapshot) => {
                            let prospectus = {};
                            allSubjectsSnapshot.forEach((doc) => {
                                const subject = doc.data();
                                const isEligible = subject.preReqs.every(prereq => passedSubjects.has(prereq) || !takenSubjects.has(prereq));
                                if (isEligible && !passedSubjects.has(subject.code) &&
                                    (!subject.isElective || subject.elective === studentData.elective)) {
                                    if (!prospectus[subject.yearLevel]) {
                                        prospectus[subject.yearLevel] = {};
                                    }
                                    if (!prospectus[subject.yearLevel][subject.semester]) {
                                        prospectus[subject.yearLevel][subject.semester] = [];
                                    }
                                    prospectus[subject.yearLevel][subject.semester].push(subject);
                                }
                            });
                            return prospectus;
                        });
                });
        })
        .then((prospectus) => {
            let prospectusHtml = '<h2>Logical Prospectus</h2>';
            const maxYear = Math.max(...Object.keys(prospectus).map(Number));
            
            for (let year = 1; year <= maxYear; year++) {
                prospectusHtml += `<h3>Year ${year}</h3>`;
                prospectusHtml += '<div class="semester-container">';
                
                for (let semester = 1; semester <= 2; semester++) {
                    prospectusHtml += `
                        <div class="semester">
                            <h4>${semester === 1 ? '1st' : '2nd'} Semester</h4>
                            <table class="prospectus-table">
                                <thead>
                                    <tr>
                                        <th>Code</th>
                                        <th>Description</th>
                                        <th>Units</th>
                                    </tr>
                                </thead>
                                <tbody>
                    `;

                    if (prospectus[year] && prospectus[year][semester]) {
                        prospectus[year][semester].forEach(subject => {
                            prospectusHtml += `
                                <tr>
                                    <td>${subject.code}</td>
                                    <td>${subject.description}</td>
                                    <td>${subject.units}</td>
                                </tr>
                            `;
                        });
                    } else {
                        prospectusHtml += `
                            <tr>
                                <td colspan="3">No subjects available</td>
                            </tr>
                        `;
                    }

                    prospectusHtml += `
                                </tbody>
                            </table>
                        </div>
                    `;
                }

                prospectusHtml += '</div>';

                // Add summer classes if they exist
                if (prospectus[year] && prospectus[year][3] && prospectus[year][3].length > 0) {
                    prospectusHtml += `
                        <div class="summer-semester">
                            <h4>Summer</h4>
                            <table class="prospectus-table">
                                <thead>
                                    <tr>
                                        <th>Code</th>
                                        <th>Description</th>
                                        <th>Units</th>
                                    </tr>
                                </thead>
                                <tbody>
                    `;

                    prospectus[year][3].forEach(subject => {
                        prospectusHtml += `
                            <tr>
                                <td>${subject.code}</td>
                                <td>${subject.description}</td>
                                <td>${subject.units}</td>
                            </tr>
                        `;
                    });

                    prospectusHtml += `
                                </tbody>
                            </table>
                        </div>
                    `;
                }
            }

            contentArea.innerHTML = prospectusHtml;

            // Add CSS for the prospectus layout
            const style = document.createElement('style');
            style.textContent = `
                .semester-container {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 2rem;
                }
                .semester {
                    width: 48%;
                }
                .summer-semester {
                    margin-top: 1rem;
                    margin-bottom: 2rem;
                }
                .prospectus-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .prospectus-table th, .prospectus-table td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                .prospectus-table th {
                    background-color: #f2f2f2;
                }
            `;
            document.head.appendChild(style);
        })
        .catch((error) => {
            console.error("Error generating logical prospectus:", error);
            alert('Error generating logical prospectus. Please try again.');
        });
}

function updateStudentStatus(studentId) {
    db.collection('students').doc(studentId).collection('subjects').get()
        .then((subjectsSnapshot) => {
            let isIrregular = false;
            let maxYear = 1;
            let failedPrerequisites = new Set();

            subjectsSnapshot.forEach((doc) => {
                const subject = doc.data();
                if (subject.yearLevel > maxYear) {
                    maxYear = subject.yearLevel;
                }
                if (subject.grade && parseFloat(subject.grade) > 3.00) {
                    failedPrerequisites.add(subject.code);
                }
            });

            isIrregular = failedPrerequisites.size > 0;

            const expectedGraduation = new Date().getFullYear() + (4 - maxYear + (isIrregular ? 1 : 0));

            return db.collection('students').doc(studentId).update({
                status: isIrregular ? 'Irregular' : 'Regular',
                expectedGraduation: expectedGraduation
            });
        })
        .then(() => {
            alert('Student status updated successfully');
            viewStudent(studentId);
        })
        .catch((error) => {
            console.error("Error updating student status:", error);
            alert('Error updating student status. Please try again.');
        });
}

function showAddSubjectsBySemesterForm(studentId) {
    let formHtml = `
        <h2>Add Subjects by Semester</h2>
        <form id="addSubjectsBySemesterForm">
            <select id="yearLevel" required>
                <option value="">Select Source Year Level</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
            </select>
            <select id="semester" required>
                <option value="">Select Source Semester</option>
                <option value="1">1st Semester</option>
                <option value="2">2nd Semester</option>
                <option value="3">Summer</option>
            </select>
            <select id="targetYearLevel" required>
                <option value="">Select Target Year Level</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
            </select>
            <select id="targetSemester" required>
                <option value="">Select Target Semester</option>
                <option value="1">1st Semester</option>
                <option value="2">2nd Semester</option>
                <option value="3">Summer</option>
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
    const targetYearLevel = document.getElementById('targetYearLevel').value;
    const targetSemester = document.getElementById('targetSemester').value;

    db.collection('subjects')
        .where('yearLevel', '==', parseInt(yearLevel))
        .where('semester', '==', parseInt(semester))
        .get()
        .then((querySnapshot) => {
            const batch = db.batch();
            const existingSubjects = new Set();
            const passedSubjects = new Set();

            return db.collection('students').doc(studentId).collection('subjects').get()
                .then((existingSnapshot) => {
                    existingSnapshot.forEach(doc => {
                        const subject = doc.data();
                        existingSubjects.add(subject.code);
                        if (subject.grade && parseFloat(subject.grade) <= 3.00) {
                            passedSubjects.add(subject.code);
                        }
                    });

                    const eligibleSubjects = [];
                    querySnapshot.forEach((doc) => {
                        const subjectData = doc.data();
                        if (!existingSubjects.has(subjectData.code) && 
                            subjectData.preReqs.every(prereq => passedSubjects.has(prereq))) {
                            eligibleSubjects.push(subjectData);
                        }
                    });

                    eligibleSubjects.sort((a, b) => a.code.localeCompare(b.code));

                    eligibleSubjects.forEach((subjectData) => {
                        const newSubjectRef = db.collection('students').doc(studentId).collection('subjects').doc();
                        batch.set(newSubjectRef, {
                            ...subjectData,
                            yearLevel: parseInt(targetYearLevel),
                            semester: parseInt(targetSemester)
                        });
                    });

                    return batch.commit();
                });
        })
        .then(() => {
            alert('Eligible subjects added successfully');
            viewStudent(studentId);
        })
        .catch((error) => {
            console.error("Error adding subjects by semester:", error);
            alert('Error adding subjects. Please try again.');
        });
}

function updateGrade(studentId, subjectId, newGrade) {
    db.collection('students').doc(studentId).collection('subjects').doc(subjectId).update({
        grade: newGrade
    })
    .then(() => {
        console.log("Grade updated successfully");
        // Update the remarks cell
        const selectElement = document.querySelector(`select[data-subject-id="${subjectId}"]`);
        const remarksCell = selectElement.parentElement.nextElementSibling;
        remarksCell.textContent = newGrade ? (parseFloat(newGrade) <= 3.00 ? 'PASSED' : 'FAILED') : 'N/A';
    })
    .catch((error) => {
        console.error("Error updating grade:", error);
        alert('Error updating grade. Please try again.');
    });
}

function chooseElective(studentId) {
    const electives = [
        'Robotics Process Automation',
        'Software Development Track',
        'System and Network Administration',
        'Technopreneurship'
    ];

    let electiveHtml = `
        <h2>Choose Elective Track</h2>
        <form id="electiveForm">
            <select id="electiveSelect">
                <option value="">Select an Elective</option>
                ${electives.map(elective => `<option value="${elective}">${elective}</option>`).join('')}
            </select>
            <button type="submit">Save Elective</button>
        </form>
    `;

    const electiveContainer = document.createElement('div');
    electiveContainer.innerHTML = electiveHtml;
    document.body.appendChild(electiveContainer);

    document.getElementById('electiveForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const selectedElective = document.getElementById('electiveSelect').value;
        if (selectedElective) {
            db.collection('students').doc(studentId).update({
                elective: selectedElective
            })
            .then(() => {
                alert(`Elective ${selectedElective} has been set for the student.`);
                document.body.removeChild(electiveContainer);
                viewStudent(studentId);
            })
            .catch((error) => {
                console.error("Error setting elective:", error);
                alert('Error setting elective. Please try again.');
            });
        } else {
            alert('Please select an elective.');
        }
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