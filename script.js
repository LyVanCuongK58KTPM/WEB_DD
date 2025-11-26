const API_BASE = 'https://cnpm-ub8a.onrender.com';
let token = null;
let userType = null;
let currentSVSection = null;
let currentGVSection = null;
let allDiemDanhData = [];

// ============= QUẢN LÝ TRANG =============
function showPage(pageName) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageName).classList.add('active');
}

// ============= ĐĂNG NHẬP =============
document.addEventListener('DOMContentLoaded', () => {
    // Kiểm tra đã đăng nhập chưa
    token = localStorage.getItem('token');
    userType = localStorage.getItem('userType');
    
    if (token && userType) {
        if (userType === 'SinhVien') {
            showPage('sinhvienPage');
            loadSVProfile();
        } else if (userType === 'GiaoVien') {
            showPage('giaovienPage');
            loadGVProfile();
        }
    } else {
        showPage('loginPage');
    }
    
    // Form đăng nhập
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await login();
    });
});

async function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const messageDiv = document.getElementById('message');
    const tokenBox = document.getElementById('tokenBox');
    
    if (!username || !password) {
        showMessage('Vui lòng nhập đầy đủ thông tin', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                TenDangNhap: username,
                MatKhau: password
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Node-RED trả về: { success: true, token: "...", user: { MaID, LoaiTaiKhoan, ... } }
            localStorage.setItem('token', data.token);
            localStorage.setItem('userType', data.user.LoaiTaiKhoan);
            localStorage.setItem('userId', data.user.MaID);
            localStorage.setItem('userName', data.user.TenDangNhap);
            
            token = data.token;
            userType = data.user.LoaiTaiKhoan;
            
            // Hiển thị token
            document.getElementById('tokenValue').textContent = data.token;
            tokenBox.style.display = 'block';
            messageDiv.style.display = 'none';
            
            showMessage('Đăng nhập thành công!', 'success');
        } else {
            showMessage(data.message || 'Đăng nhập thất bại', 'error');
            tokenBox.style.display = 'none';
        }
    } catch (error) {
        console.error('Lỗi:', error);
        showMessage('Lỗi kết nối đến server', 'error');
        tokenBox.style.display = 'none';
    }
}

function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
}

function copyToken() {
    const token = document.getElementById('tokenValue').textContent;
    navigator.clipboard.writeText(token).then(() => {
        alert('Đã copy token vào clipboard!');
    }).catch(err => {
        console.error('Lỗi copy:', err);
        alert('Không thể copy token');
    });
}

function continueToSystem() {
    if (userType === 'SinhVien') {
        showPage('sinhvienPage');
        loadSVProfile();
    } else if (userType === 'GiaoVien') {
        showPage('giaovienPage');
        loadGVProfile();
    }
}

function logout() {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        localStorage.clear();
        token = null;
        userType = null;
        showPage('loginPage');
        
        // Reset form
        document.getElementById('loginForm').reset();
        document.getElementById('tokenBox').style.display = 'none';
        document.getElementById('message').style.display = 'none';
    }
}

// ============= SINH VIÊN =============
async function loadSVProfile() {
    try {
        const response = await fetch(`${API_BASE}/xemthongtin?token=${token}`);
        const res = await response.json();
        
        if (res.success && res.data && res.data.length > 0) {
            const profile = res.data[0];
            // Lưu data hiện tại để điền vào form sửa
            localStorage.setItem('currentUserEmail', profile.Email || '');
            localStorage.setItem('currentUserSDT', profile.SoDienThoai || '');

            document.getElementById('svUserName').textContent = profile.HoTen || 'Sinh viên';
            
            const profileCard = document.getElementById('svProfileCard');
            profileCard.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h2>📋 Thông tin cá nhân</h2>
                    <button class="btn-edit" onclick="openEditModal()">✏️ Sửa thông tin</button>
                </div>
                <div class="profile-grid">
                    <div class="profile-item"><label>Mã SV</label><div class="value">${profile.MaSinhVien}</div></div>
                    <div class="profile-item"><label>Họ tên</label><div class="value">${profile.HoTen}</div></div>
                    <div class="profile-item"><label>Lớp</label><div class="value">${profile.MaLop}</div></div>
                    <div class="profile-item"><label>Email</label><div class="value">${profile.Email || 'Chưa cập nhật'}</div></div>
                    <div class="profile-item"><label>SĐT</label><div class="value">${profile.SoDienThoai || 'Chưa cập nhật'}</div></div>
                    <div class="profile-item"><label>Ngày sinh</label><div class="value">${formatDate(profile.NgaySinh)}</div></div>
                </div>
            `;
        }
    } catch (error) { console.error(error); }
}
function showSVSection(section) {
    document.getElementById('svLichhocSection').style.display = 'none';
    document.getElementById('svDiemdanhSection').style.display = 'none';
    
    if (section === 'lichhoc') {
        document.getElementById('svLichhocSection').style.display = 'block';
        if (currentSVSection !== 'lichhoc') {
            loadSVLichHoc();
            currentSVSection = 'lichhoc';
        }
        document.getElementById('svLichhocSection').scrollIntoView({ behavior: 'smooth' });
    } else if (section === 'diemdanh') {
        document.getElementById('svDiemdanhSection').style.display = 'block';
        if (currentSVSection !== 'diemdanh') {
            loadSVDiemDanh();
            currentSVSection = 'diemdanh';
        }
        document.getElementById('svDiemdanhSection').scrollIntoView({ behavior: 'smooth' });
    }
}

async function loadSVLichHoc() {
    const content = document.getElementById('svLichhocContent');
    content.innerHTML = '<div class="loading">Đang tải lịch học</div>';
    
    try {
        const response = await fetch(`${API_BASE}/lichhoc?token=${token}`);
        const data = await response.json();
        
        // Node-RED: { success: true, data: [ { tenMon, phong, ngay, ... } ] }
        if (data.success && data.data && data.data.length > 0) {
            let html = `
                <table>
                    <thead>
                        <tr>
                            <th>Môn học</th>
                            <th>Phòng</th>
                            <th>Ngày học</th>
                            <th>Giờ bắt đầu</th>
                            <th>Giờ kết thúc</th>
                            <th>Số tiết</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            data.data.forEach(item => {
                html += `
                    <tr>
                        <td><strong>${item.tenMon || 'N/A'}</strong></td>
                        <td>${item.phong || 'N/A'}</td>
                        <td>${formatDate(item.ngay)}</td>
                        <td>${item.gioBD || 'N/A'}</td>
                        <td>${item.gioKT || 'N/A'}</td>
                        <td>${item.tiet || 'N/A'}</td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
            content.innerHTML = html;
        } else {
            content.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📅</div>
                    <p>Không có lịch học</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Lỗi load lịch học:', error);
        content.innerHTML = '<p style="color: red;">Không thể tải lịch học. Vui lòng thử lại.</p>';
    }
}

async function loadSVDiemDanh() {
    const content = document.getElementById('svDiemdanhContent');
    content.innerHTML = '<div class="loading">Đang tải dữ liệu điểm danh</div>';
    
    try {
        const response = await fetch(`${API_BASE}/diemdanhsinhvien?token=${token}`);
        const data = await response.json();
        
        // Node-RED: { success: true, data: [ { monHoc, ngayHoc, trangThai, ... } ] }
        if (data.success && data.data && data.data.length > 0) {
            let html = `
                <table>
                    <thead>
                        <tr>
                            <th>Môn học</th>
                            <th>Ngày học</th>
                            <th>Thời gian điểm danh</th>
                            <th>Trạng thái</th>
                            <th>Ghi chú</th>
                            <th>Ảnh điểm danh</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            data.data.forEach(item => {
                const statusClass = getStatusClass(item.trangThai);
                html += `
                    <tr>
                        <td><strong>${item.monHoc || 'N/A'}</strong></td>
                        <td>${formatDate(item.ngayHoc)}</td>
                        <td>${formatDateTime(item.thoiGian)}</td>
                        <td><span class="status-badge ${statusClass}">${item.trangThai || 'N/A'}</span></td>
                        <td>${item.ghiChu || 'Không có'}</td>
                        <td>
                            ${item.anhDiemDanh ? 
                                `<img src="${item.anhDiemDanh}" class="image-preview" onclick="openModal('${item.anhDiemDanh}')" alt="Ảnh điểm danh">` 
                                : 'Không có ảnh'}
                        </td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
            content.innerHTML = html;
        } else {
            content.innerHTML = `
                <div class="empty-state">
                    <div class="icon">✅</div>
                    <p>Chưa có dữ liệu điểm danh</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Lỗi load điểm danh:', error);
        content.innerHTML = '<p style="color: red;">Không thể tải dữ liệu điểm danh. Vui lòng thử lại.</p>';
    }
}

// ============= GIÁO VIÊN =============
async function loadGVProfile() {
    try {
        const response = await fetch(`${API_BASE}/xemthongtin?token=${token}`);
        const res = await response.json();
        
        if (res.success && res.data && res.data.length > 0) {
            const profile = res.data[0];
            // Lưu data hiện tại
            localStorage.setItem('currentUserEmail', profile.Email || '');
            localStorage.setItem('currentUserSDT', profile.SoDienThoai || '');

            document.getElementById('gvUserName').textContent = profile.HoTen || 'Giáo viên';
            
            const profileCard = document.getElementById('gvProfileCard');
            profileCard.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h2>📋 Thông tin cá nhân</h2>
                    <button class="btn-edit" onclick="openEditModal()">✏️ Sửa thông tin</button>
                </div>
                <div class="profile-grid">
                    <div class="profile-item"><label>Mã GV</label><div class="value">${profile.MaGiaoVien}</div></div>
                    <div class="profile-item"><label>Họ tên</label><div class="value">${profile.HoTen}</div></div>
                    <div class="profile-item"><label>Chức vụ</label><div class="value">${profile.Chucvu || 'N/A'}</div></div>
                    <div class="profile-item"><label>Email</label><div class="value">${profile.Email || 'Chưa cập nhật'}</div></div>
                    <div class="profile-item"><label>SĐT</label><div class="value">${profile.SoDienThoai || 'Chưa cập nhật'}</div></div>
                </div>
            `;
        }
    } catch (error) { console.error(error); }
}
function showGVSection(section) {
    document.getElementById('gvLichdaySection').style.display = 'none';
    document.getElementById('gvDiemdanhSection').style.display = 'none';
    
    if (section === 'lichday') {
        document.getElementById('gvLichdaySection').style.display = 'block';
        if (currentGVSection !== 'lichday') {
            loadGVLichDay();
            currentGVSection = 'lichday';
        }
        document.getElementById('gvLichdaySection').scrollIntoView({ behavior: 'smooth' });
    } else if (section === 'diemdanh') {
        document.getElementById('gvDiemdanhSection').style.display = 'block';
        if (currentGVSection !== 'diemdanh') {
            loadGVDiemDanhInit();
            currentGVSection = 'diemdanh';
        }
        document.getElementById('gvDiemdanhSection').scrollIntoView({ behavior: 'smooth' });
    }
}

async function loadGVLichDay() {
    const content = document.getElementById('gvLichdayContent');
    content.innerHTML = '<div class="loading">Đang tải lịch dạy</div>';
    
    try {
        const response = await fetch(`${API_BASE}/lichday?token=${token}`);
        const data = await response.json();
        
        // Node-RED: { success: true, data: [ { tenMon, tenLop, phong, ... } ] }
        if (data.success && data.data && data.data.length > 0) {
            let html = `
                <table>
                    <thead>
                        <tr>
                            <th>Môn học</th>
                            <th>Lớp</th>
                            <th>Phòng</th>
                            <th>Ngày dạy</th>
                            <th>Giờ bắt đầu</th>
                            <th>Giờ kết thúc</th>
                            <th>Số tiết</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            data.data.forEach(item => {
                html += `
                    <tr>
                        <td><strong>${item.tenMon || 'N/A'}</strong></td>
                        <td>${item.tenLop || item.lop || 'N/A'}</td>
                        <td>${item.phong || 'N/A'}</td>
                        <td>${formatDate(item.ngay)}</td>
                        <td>${item.gioBatDau || 'N/A'}</td>
                        <td>${item.gioKetThuc || 'N/A'}</td>
                        <td>${item.tiet || 'N/A'}</td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
            content.innerHTML = html;
        } else {
            content.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📚</div>
                    <p>Không có lịch dạy</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Lỗi load lịch dạy:', error);
        content.innerHTML = '<p style="color: red;">Không thể tải lịch dạy. Vui lòng thử lại.</p>';
    }
}

async function loadGVDiemDanhInit() {
    const select = document.getElementById('monHocSelect');
    const content = document.getElementById('gvDiemdanhContent');

    if (!select) {
        console.error('Không tìm thấy #monHocSelect');
        return;
    }

    content.innerHTML = '<div class="loading">Đang tải danh sách môn học...</div>';

    try {
        const response = await fetch(`${API_BASE}/diemdanhgv?token=${token}`);
        const data = await response.json();

        if (data.success && data.data && data.data.length > 0) {
            allDiemDanhData = data.data;

            // Node-RED trả về: maLichDay, monHoc, lop
            const unique = {};
            data.data.forEach(item => {
                const key = item.maLichDay;
                if (key && !unique[key]) {
                    unique[key] = {
                        maLichDay: key,
                        monHoc: item.monHoc || 'Chưa có tên môn', // Sửa từ TenMonHoc -> monHoc
                        lop: item.lop || 'Chưa có lớp'             // Sửa từ TenLop -> lop
                    };
                }
            });

            // Xóa hết option cũ
            select.innerHTML = '';

            // Thêm option mặc định
            const optDefault = document.createElement('option');
            optDefault.value = '';
            optDefault.textContent = '-- Chọn môn học / lớp --';
            select.appendChild(optDefault);

            // Thêm các lớp
            Object.values(unique).forEach(cls => {
                const opt = document.createElement('option');
                opt.value = cls.maLichDay;
                opt.textContent = `${cls.monHoc} - ${cls.lop}`;
                select.appendChild(opt);
            });

            // Gắn sự kiện
            select.onchange = null;
            select.addEventListener('change', loadDiemDanhByMon);

            content.innerHTML = '<p style="color:#666;text-align:center;margin:20px 0;">Vui lòng chọn môn học để xem danh sách điểm danh</p>';

        } else {
            select.innerHTML = '<option value="">-- Không có dữ liệu --</option>';
            content.innerHTML = '<p style="color:#999;text-align:center;">Chưa có điểm danh nào</p>';
        }
    } catch (err) {
        console.error('Lỗi:', err);
        content.innerHTML = '<p style="color:red;">Lỗi kết nối server!</p>';
    }
}

function loadDiemDanhByMon() {
    const select = document.getElementById('monHocSelect');
    const selected = select.value;
    const content = document.getElementById('gvDiemdanhContent');

    if (!selected) {
        content.innerHTML = '<p style="color:#666;">Vui lòng chọn môn học</p>';
        return;
    }

    const filtered = allDiemDanhData.filter(item => item.maLichDay == selected);

    if (filtered.length > 0) {
        let html = `<table>
            <thead><tr>
                <th>Mã SV</th><th>Họ tên</th><th>Thời gian</th><th>Trạng thái</th><th>Ghi chú</th><th>Ảnh</th>
            </tr></thead><tbody>`;

        filtered.forEach(item => {
            const img = item.anhChamCong 
                ? `<img src="${item.anhChamCong}" width="60" style="cursor:pointer;border-radius:4px;" onclick="openModal('${item.anhChamCong}')">`
                : 'Không có';
                
            // Node-RED trả về: maSV, hoTen, thoiGianDiemDanh, trangThai, ghiChu
            html += `<tr>
                <td>${item.maSV}</td>
                <td>${item.hoTen}</td>
                <td>${formatDateTime(item.thoiGianDiemDanh)}</td>
                <td>${item.trangThai || '-'}</td>
                <td>${item.ghiChu || '-'}</td>
                <td>${img}</td>
            </tr>`;
        });
        html += '</tbody></table>';
        content.innerHTML = html;
    } else {
        content.innerHTML = '<p style="color:#d32f2f;">Chưa có sinh viên điểm danh cho lớp này</p>';
    }
}


// ============= HÀM TIỆN ÍCH =============
function getStatusClass(status) {
    if (!status) return '';
    const s = status.toLowerCase();
    if (s.includes('có mặt') || s.includes('comat')) return 'co-mat';
    if (s.includes('vắng') || s.includes('vang')) return 'vang';
    if (s.includes('trễ') || s.includes('tre')) return 'tre';
    return '';
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    } catch {
        return dateString;
    }
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN');
    } catch {
        return dateString;
    }
}

function openModal(imageSrc) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    modal.classList.add('active');
    modalImg.src = imageSrc;
}

function closeModal() {
    document.getElementById('imageModal').classList.remove('active');
}
// ============= EDIT PROFILE FUNCTIONS =============
function openEditModal() {
    document.getElementById('editProfileModal').classList.add('active');
    // Điền dữ liệu cũ vào input
    document.getElementById('edit_email').value = localStorage.getItem('currentUserEmail');
    document.getElementById('edit_sdt').value = localStorage.getItem('currentUserSDT');
}

function closeEditModal() {
    document.getElementById('editProfileModal').classList.remove('active');
}

async function saveProfile(e) {
    e.preventDefault();
    const newEmail = document.getElementById('edit_email').value;
    const newSDT = document.getElementById('edit_sdt').value;
    
    try {
        const res = await fetch(`${API_BASE}/update-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token: token,
                email: newEmail,
                sdt: newSDT
            })
        });
        
        const data = await res.json();
        if (data.success) {
            alert('✅ Cập nhật thành công!');
            closeEditModal();
            // Load lại profile để thấy thay đổi
            if (userType === 'SinhVien') loadSVProfile();
            else if (userType === 'GiaoVien') loadGVProfile();
        } else {
            alert('❌ Lỗi: ' + data.message);
        }
    } catch (err) {
        alert('Lỗi kết nối server!');
    }
}