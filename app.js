// ==========================
// Utility Functions
// ==========================
function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || [
    { id: "admin", name: "Administrator", role: "admin", password: "admin123", class: "" }
  ];
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function getAttendance() {
  return JSON.parse(localStorage.getItem("attendance")) || [];
}

function saveAttendance(records) {
  localStorage.setItem("attendance", JSON.stringify(records));
}

// ==========================
// Login
// ==========================
function login() {
  const role = document.getElementById("role").value;
  const userId = document.getElementById("userid").value;
  const name = document.getElementById("name").value;
  const className = document.getElementById("class").value;
  const password = document.getElementById("password") ? document.getElementById("password").value : "";

  const users = getUsers();
  const user = users.find(u => u.id === userId && u.role === role);

  if (role === "admin") {
    if (user && user.password === password) {
      sessionStorage.setItem("currentUser", JSON.stringify(user));
      window.location.href = "admin.html";
    } else {
      alert("Invalid admin credentials");
    }
  } else {
    if (user) {
      sessionStorage.setItem("currentUser", JSON.stringify(user));
      if (role === "student") window.location.href = "student.html";
      else if (role === "teacher") window.location.href = "teacher.html";
    } else {
      alert("User not found. Please contact admin.");
    }
  }
}

// ==========================
// Student Panel
// ==========================
let scannedSession = null;
let capturedPhoto = null;
let currentLocation = null;

function scanQR() {
  const qrDiv = document.createElement("div");
  qrDiv.id = "qr-reader";
  document.body.appendChild(qrDiv);

  const qrScanner = new Html5Qrcode("qr-reader");
  qrScanner.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    (decodedText) => {
      scannedSession = decodedText;
      alert("QR Scanned: " + scannedSession);
      qrScanner.stop();
      qrDiv.remove();
    },
    (error) => {}
  );
}

function takePhoto() {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      const video = document.createElement("video");
      video.srcObject = stream;
      video.play();

      const canvas = document.createElement("canvas");
      setTimeout(() => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        capturedPhoto = canvas.toDataURL("image/png");
        alert("Photo captured!");
        stream.getTracks().forEach(track => track.stop());
      }, 2000);
    });
}

function trackLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      currentLocation = {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude
      };
      alert(`Location captured: ${currentLocation.lat}, ${currentLocation.lon}`);
    });
  } else {
    alert("Geolocation not supported.");
  }
}

function markAttendance() {
  if (!scannedSession || !capturedPhoto || !currentLocation) {
    alert("Please scan QR, take photo and allow GPS before marking attendance.");
    return;
  }

  const user = JSON.parse(sessionStorage.getItem("currentUser"));
  const records = getAttendance();

  records.push({
    studentId: user.id,
    name: user.name,
    class: user.class,
    photo: capturedPhoto,
    gps: `${currentLocation.lat}, ${currentLocation.lon}`,
    session: scannedSession,
    time: new Date().toLocaleString()
  });

  saveAttendance(records);
  document.getElementById("attendance-status").innerText = "✅ Attendance marked!";
  renderAttendanceChart(user.id);
}

function renderAttendanceChart(studentId) {
  const records = getAttendance().filter(r => r.studentId === studentId);
  const ctx = document.getElementById("attendanceChart").getContext("2d");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: records.map(r => r.session),
      datasets: [{
        label: "Attendance Count",
        data: records.map(() => 1),
        backgroundColor: "orange"
      }]
    }
  });
}

// ==========================
// Teacher Panel
// ==========================
function generateQR() {
  const sessionName = document.getElementById("sessionName").value;
  if (!sessionName) return alert("Enter session name!");

  const qrDiv = document.getElementById("qrcode");
  qrDiv.innerHTML = "";
  new QRCode(qrDiv, sessionName);

  alert("QR Generated for session: " + sessionName);
  renderAttendanceRecords();
}

function renderAttendanceRecords() {
  const tbody = document.getElementById("attendanceRecords");
  if (!tbody) return;
  tbody.innerHTML = "";
  const records = getAttendance();

  records.forEach(r => {
    const row = `<tr>
      <td>${r.studentId}</td>
      <td>${r.name}</td>
      <td>${r.class}</td>
      <td><img src="${r.photo}" width="50"></td>
      <td>${r.gps}</td>
      <td>${r.session}</td>
      <td>${r.time}</td>
    </tr>`;
    tbody.innerHTML += row;
  });
}

// ==========================
// Admin Panel
// ==========================
function addUser() {
  const id = document.getElementById("newUserId").value;
  const name = document.getElementById("newName").value;
  const password = document.getElementById("newPassword").value;
  const role = document.getElementById("newRole").value;
  const className = document.getElementById("newClass").value;

  let users = getUsers();
  if (users.find(u => u.id === id)) {
    alert("User already exists!");
    return;
  }

  users.push({ id, name, role, password, class: className });
  saveUsers(users);
  alert("User added!");
  renderUserTable();
}

function deleteUser(id) {
  let users = getUsers().filter(u => u.id !== id);
  saveUsers(users);
  renderUserTable();
}

function renderUserTable() {
  const tbody = document.getElementById("userTable");
  if (!tbody) return;
  tbody.innerHTML = "";
  const users = getUsers();

  users.forEach(u => {
    tbody.innerHTML += `<tr>
      <td>${u.id}</td>
      <td>${u.name}</td>
      <td>${u.role}</td>
      <td>${u.class}</td>
      <td><button onclick="deleteUser('${u.id}')">❌</button></td>
    </tr>`;
  });
}

// ==========================
// Page Init
// ==========================
window.onload = () => {
  if (document.getElementById("userTable")) renderUserTable();
  if (document.getElementById("attendanceRecords")) renderAttendanceRecords();
};
