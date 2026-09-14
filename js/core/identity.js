/* =========================================================
   IDENTITY FORM — Full Logic
   ========================================================= */

/* ============================================================
   FORM IDENTITAS — Render + Dynamic Row + Alumni + Same Address
   ============================================================ */
   function renderIdentityForm() {
    appState.identity = appState.identity || {};
    const today = new Date().toISOString().split("T")[0];
  
    document.getElementById("app").innerHTML = `
      <div class="identity-page">
        <form id="identityForm" class="identity-card">
          <div class="identity-accent"></div>
  
          <header class="identity-header">
            <div class="identity-header-left">
              <div class="identity-logo">
                <img src="https://raw.githubusercontent.com/Pragas123/assets/refs/heads/main/nmqo6a.png" alt="Sugar Group Schools">
              </div>
              <div class="identity-title-block">
                <div class="identity-kicker">SUGAR GROUP SCHOOLS</div>
                <h1>Data Identitas</h1>
                <p>
                  Lengkapi informasi berikut secara akurat untuk melanjutkan proses asesmen.
                  <span class="required-note">* wajib diisi</span>
                </p>
              </div>
            </div>
          </header>
  
          <main class="identity-body">
  
            <!-- SECTION 01 -->
            <section class="identity-section">
              <div class="identity-section-heading">
                <div class="section-index">01</div>
                <div class="section-heading-content">
                  <h2>Informasi Personal</h2>
                  <p>Identitas dasar peserta</p>
                </div>
              </div>
  
              <div class="identity-form-grid">
                <div class="identity-field">
                  <label for="name">Nama Lengkap <span class="required">*</span></label>
                  <div class="identity-control">
                    <span class="field-icon">👤</span>
                    <input type="text" id="name" required autocomplete="new-password" name="sgs_field_1" placeholder="Masukkan nama lengkap" value="${appState.identity.name || ""}">
                  </div>
                </div>
  
                <div class="identity-field">
                  <label for="nickname">Nama Panggilan <span class="required">*</span></label>
                  <div class="identity-control">
                    <span class="field-icon">✦</span>
                    <input type="text" id="nickname" required placeholder="Masukkan nama panggilan" value="${appState.identity.nickname || ""}">
                  </div>
                </div>
  
                <div class="identity-field">
                  <label for="email">Email <span class="required">*</span></label>
                  <div class="identity-control">
                    <span class="field-icon">✉</span>
                   <input type="email" id="email" required autocomplete="new-password" name="sgs_field_2" placeholder="nama@email.com" value="${appState.identity.email || ""}">
                  </div>
                </div>
  
                <div class="identity-field">
                  <label for="phone">Nomor HP <span class="required">*</span></label>
                  <div class="identity-control">
                    <span class="field-icon">☎</span>
                    <input type="tel" id="phone" required autocomplete="new-password" name="sgs_field_3" inputmode="tel" placeholder="08xxxxxxxxxx" value="${appState.identity.phone || ""}">
                  </div>
                </div>
  
                <div class="identity-field">
                  <label for="dob">Tanggal Lahir <span class="required">*</span></label>
                  <div class="identity-control">
                    <span class="field-icon">◷</span>
                    <input type="date" id="dob" max="${today}" required value="${appState.identity.dob || ""}">
                  </div>
                </div>
  
                <div class="identity-field">
                  <label for="status">Status Perkawinan <span class="required">*</span></label>
                  <div class="identity-control select-control">
                    <span class="field-icon">◉</span>
                    <select id="status" required>
                      <option value="" disabled ${!appState.identity.status ? "selected" : ""}>Pilih status</option>
                      <option value="Lajang" ${appState.identity.status === "Lajang" ? "selected" : ""}>Lajang</option>
                      <option value="Menikah" ${appState.identity.status === "Menikah" ? "selected" : ""}>Menikah</option>
                    </select>
                    <span class="select-arrow">⌄</span>
                  </div>
                </div>
              </div>
            </section>
  
            <!-- SECTION 02 -->
            <section class="identity-section">
              <div class="identity-section-heading">
                <div class="section-index">02</div>
                <div class="section-heading-content">
                  <h2>Informasi Alamat</h2>
                  <p>Informasi domisili peserta</p>
                </div>
              </div>
  
              <div class="identity-form-grid identity-form-grid-single">
                <div class="identity-field">
                  <label for="addressKTP">Alamat KTP <span class="required">*</span></label>
                  <div class="identity-control identity-control-tall">
                    <span class="field-icon field-icon-top">⌂</span>
                    <input type="text" id="addressKTP" required autocomplete="street-address" placeholder="Masukkan alamat sesuai KTP" value="${appState.identity.addressKTP || ""}">
                  </div>
                </div>
  
                <div class="identity-field">
                  <label for="addressCurrent">Alamat Saat Ini <span class="required">*</span></label>
                  <div class="identity-control identity-control-tall">
                    <span class="field-icon field-icon-top">⌖</span>
                    <input type="text" id="addressCurrent" required autocomplete="street-address" placeholder="Masukkan alamat tempat tinggal saat ini" value="${appState.identity.addressCurrent || ""}" ${appState.identity.sameAddress ? "disabled" : ""}>
                  </div>
                  <label class="same-address-option" for="sameAddress">
                    <input type="checkbox" id="sameAddress" ${appState.identity.sameAddress ? "checked" : ""}>
                    <span class="checkmark"></span>
                    <span>Sama dengan alamat KTP</span>
                  </label>
                </div>
              </div>
            </section>
  
            <!-- SECTION 03 -->
            <section class="identity-section identity-position-section">
              <div class="identity-section-heading">
                <div class="section-index">03</div>
                <div class="section-heading-content">
                  <h2>Posisi & Pendidikan</h2>
                  <p>Informasi posisi yang dilamar dan latar belakang pendidikan</p>
                </div>
              </div>
              <div id="dynamicRow"></div>
            </section>
  
            <!-- ALUMNI -->
            <div id="guruAlumniOptions" class="identity-alumni-wrapper" style="display:none;">
              <div class="identity-alumni-card">
                <div class="alumni-header">
                  <label class="alumni-main-option" for="alumniSGS">
                    <input type="checkbox" id="alumniSGS" ${appState.identity.alumniSGS ? "checked" : ""}>
                    <span class="checkmark"></span>
                    <span class="alumni-main-text">Alumni Sugar Group Schools</span>
                  </label>
                  <span class="alumni-badge">Alumni</span>
                </div>
  
                <div id="alumniLevels" class="alumni-levels" style="display:none;">
                  <div class="alumni-level-grid">
                    <label class="alumni-level-card" for="alumniSD">
                      <input type="checkbox" id="alumniSD" ${appState.identity.alumniSD ? "checked" : ""}>
                      <span class="checkmark"></span>
                      <span class="alumni-level-title">SD</span>
                      <input type="text" id="alumniSDText" class="alumni-text" placeholder="Tahun / Sekolah" value="${appState.identity.alumniSDText || ""}" style="display:none;">
                    </label>
  
                    <label class="alumni-level-card" for="alumniSMP">
                      <input type="checkbox" id="alumniSMP" ${appState.identity.alumniSMP ? "checked" : ""}>
                      <span class="checkmark"></span>
                      <span class="alumni-level-title">SMP</span>
                      <input type="text" id="alumniSMPText" class="alumni-text" placeholder="Tahun / Sekolah" value="${appState.identity.alumniSMPText || ""}" style="display:none;">
                    </label>
  
                    <label class="alumni-level-card" for="alumniSMA">
                      <input type="checkbox" id="alumniSMA" ${appState.identity.alumniSMA ? "checked" : ""}>
                      <span class="checkmark"></span>
                      <span class="alumni-level-title">SMA</span>
                      <input type="text" id="alumniSMAText" class="alumni-text" placeholder="Tahun / Sekolah" value="${appState.identity.alumniSMAText || ""}" style="display:none;">
                    </label>
                  </div>
                </div>
              </div>
            </div>
  
            <!-- BOTTOM CARD -->
            <section class="identity-bottom-card">
              <div class="identity-bottom-grid">
                <div class="identity-field">
                  <label for="explanation">Keterangan Tambahan</label>
                  <div class="identity-control identity-textarea-control">
                    <span class="field-icon field-icon-top">☷</span>
                    <textarea id="explanation" placeholder="Tuliskan keterangan tambahan apabila diperlukan...">${appState.identity.explanation || ""}</textarea>
                  </div>
                </div>
  
                <div class="identity-field">
                  <label for="date">Tanggal Pengisian</label>
                  <div class="identity-control">
                    <span class="field-icon">◷</span>
                    <input type="text" id="date" readonly value="${appState.identity.date || today}">
                  </div>
                  <div class="field-helper">Informasi akan direkam saat formulir dilanjutkan.</div>
                </div>
              </div>
            </section>
  
            <!-- FOOTER -->
            <footer class="identity-footer">
              <div class="identity-security">
                <span class="security-icon">✓</span>
                <div>
                  <strong>Data siap disimpan</strong>
                  <span>Pastikan seluruh field wajib telah lengkap.</span>
                </div>
              </div>
              <button type="submit" class="identity-submit">
                <span class="submit-label">Lanjutkan</span>
                <span class="submit-arrow">→</span>
              </button>
            </footer>
  
          </main>
        </form>
      </div>
    `;
  
    /* ============================================================
       HELPER: id()
       ============================================================ */
    const id = (elId) => document.getElementById(elId);
  
    /* ============================================================
       DYNAMIC ROW (Posisi & Pendidikan)
       ============================================================ */
    function renderDynamicRow() {
      const pos = appState.identity.position || "";
      let html = "";
  
      const edu = `
        <option value="" disabled ${!appState.identity.education ? "selected" : ""}>Pilih pendidikan</option>
        <option value="S3" ${appState.identity.education === "S3" ? "selected" : ""}>S3</option>
        <option value="S2" ${appState.identity.education === "S2" ? "selected" : ""}>S2</option>
        <option value="S1" ${appState.identity.education === "S1" ? "selected" : ""}>S1</option>
        <option value="SMA/Sederajat" ${appState.identity.education === "SMA/Sederajat" ? "selected" : ""}>SMA/Sederajat</option>
        <option value="SMP/Sederajat" ${appState.identity.education === "SMP/Sederajat" ? "selected" : ""}>SMP/Sederajat</option>
      `;
  
      const posOpt = `
        <option value="" disabled ${!pos ? "selected" : ""}>Pilih posisi</option>
        <option value="Administrator" ${pos === "Administrator" ? "selected" : ""}>Administrator</option>
        <option value="Dosen/Guru" ${pos === "Dosen/Guru" ? "selected" : ""}>Dosen/Guru</option>
        <option value="Technical Staff" ${pos === "Technical Staff" ? "selected" : ""}>Technical Staff</option>
        <option value="IT Staff" ${pos === "IT Staff" ? "selected" : ""}>IT Staff</option>
        <option value="Housekeeping" ${pos === "Housekeeping" ? "selected" : ""}>Housekeeping</option>
      `;
  
      if (pos === "Dosen/Guru") {
        html = `
          <div class="identity-grid-row">
            <div class="identity-grid-group">
              <label for="position">Posisi <span class="required">*</span></label>
              <select id="position" required>${posOpt}</select>
            </div>
  
            <div class="identity-grid-group">
              <label for="teacherLevel">Kategori <span class="required">*</span></label>
              <select id="teacherLevel" required>
                <option value="" disabled ${!appState.identity.teacherLevel ? "selected" : ""}>Pilih kategori</option>
                <option value="English Lecturer" ${appState.identity.teacherLevel === "English Lecturer" ? "selected" : ""}>English Lecturer</option>
                <option value="Math Lecturer" ${appState.identity.teacherLevel === "Math Lecturer" ? "selected" : ""}>Math Lecturer</option>
                <option value="Kindergartens" ${appState.identity.teacherLevel === "Kindergartens" ? "selected" : ""}>Kindergartens</option>
                <option value="Primary" ${appState.identity.teacherLevel === "Primary" ? "selected" : ""}>Primary</option>
                <option value="Math" ${appState.identity.teacherLevel === "Math" ? "selected" : ""}>Math</option>
                <option value="PE & Health" ${appState.identity.teacherLevel === "PE & Health" ? "selected" : ""}>PE & Health</option>
                <option value="Biology" ${appState.identity.teacherLevel === "Biology" ? "selected" : ""}>Biology</option>
                <option value="Counselor" ${appState.identity.teacherLevel === "Counselor" ? "selected" : ""}>Counselor</option>
                <option value="English" ${appState.identity.teacherLevel === "English" ? "selected" : ""}>English</option>
                <option value="Indonesian Language" ${appState.identity.teacherLevel === "Indonesian Language" ? "selected" : ""}>Indonesian Language</option>
                <option value="Visual Arts" ${appState.identity.teacherLevel === "Visual Arts" ? "selected" : ""}>Visual Arts</option>
                <option value="Social Studies" ${appState.identity.teacherLevel === "Social Studies" ? "selected" : ""}>Social Studies</option>
              </select>
            </div>
  
            <div class="identity-grid-group">
              <label for="education">Pendidikan <span class="required">*</span></label>
              <select id="education" required>${edu}</select>
            </div>
          </div>
        `;
      } else if (pos === "Technical Staff") {
        html = `
          <div class="identity-grid-row">
            <div class="identity-grid-group">
              <label for="position">Posisi <span class="required">*</span></label>
              <select id="position" required>${posOpt}</select>
            </div>
  
            <div class="identity-grid-group">
              <label for="techRole">Role Teknis <span class="required">*</span></label>
              <select id="techRole" required>
                <option value="" disabled ${!appState.identity.techRole ? "selected" : ""}>Pilih role teknis</option>
                <option value="Welder" ${appState.identity.techRole === "Welder" ? "selected" : ""}>Welder</option>
                <option value="Wood Maintenance Technician" ${appState.identity.techRole === "Wood Maintenance Technician" ? "selected" : ""}>Wood Maintenance Technician</option>
                <option value="Baker" ${appState.identity.techRole === "Baker" ? "selected" : ""}>Baker</option>
              </select>
            </div>
  
            <div class="identity-grid-group">
              <label for="education">Pendidikan <span class="required">*</span></label>
              <select id="education" required>${edu}</select>
            </div>
          </div>
        `;
      } else {
        html = `
          <div class="identity-grid-row">
            <div class="identity-grid-group">
              <label for="position">Posisi <span class="required">*</span></label>
              <select id="position" required>${posOpt}</select>
            </div>
  
            <div class="identity-grid-group">
              <label for="education">Pendidikan <span class="required">*</span></label>
              <select id="education" required>${edu}</select>
            </div>
          </div>
        `;
      }
  
      id("dynamicRow").innerHTML = html;
  
      const alumni = id("guruAlumniOptions");
      if (alumni) {
        alumni.style.display = (pos === "Dosen/Guru") ? "block" : "none";
      }
    }
  
    renderDynamicRow();
  
    /* ============================================================
       DYNAMIC CHANGE — Posisi / Teacher Level / Tech Role / Education
       ============================================================ */
    id("identityForm").addEventListener("change", function (e) {
      if (["position", "teacherLevel", "techRole", "education"].includes(e.target.id)) {
        appState.identity.position     = id("position")?.value     || "";
        appState.identity.teacherLevel = id("teacherLevel")?.value || "";
        appState.identity.techRole     = id("techRole")?.value     || "";
        appState.identity.education    = id("education")?.value    || "";
        renderDynamicRow();
      }
    });
  
    /* ============================================================
       ALUMNI LOGIC
       ============================================================ */
    if (id("alumniSGS")) {
      id("alumniSGS").addEventListener("change", function () {
        id("alumniLevels").style.display = this.checked ? "block" : "none";
        appState.identity.alumniSGS = this.checked;
      });
  
      if (id("alumniSGS").checked) {
        id("alumniLevels").style.display = "block";
      }
  
      function showAlumniInputs() {
        if (id("alumniSDText"))  id("alumniSDText").style.display  = id("alumniSD")?.checked  ? "inline-block" : "none";
        if (id("alumniSMPText")) id("alumniSMPText").style.display = id("alumniSMP")?.checked ? "inline-block" : "none";
        if (id("alumniSMAText")) id("alumniSMAText").style.display = id("alumniSMA")?.checked ? "inline-block" : "none";
      }
  
      if (id("alumniSD"))  id("alumniSD").addEventListener("change", showAlumniInputs);
      if (id("alumniSMP")) id("alumniSMP").addEventListener("change", showAlumniInputs);
      if (id("alumniSMA")) id("alumniSMA").addEventListener("change", showAlumniInputs);
      showAlumniInputs();
    }
  
    /* ============================================================
       SAME ADDRESS
       ============================================================ */
    id("sameAddress").addEventListener("change", function () {
      if (this.checked) {
        id("addressCurrent").value = id("addressKTP").value;
        id("addressCurrent").disabled = true;
        id("addressCurrent").required = false;
        appState.identity.sameAddress = true;
      } else {
        id("addressCurrent").value = "";
        id("addressCurrent").disabled = false;
        id("addressCurrent").required = true;
        appState.identity.sameAddress = false;
      }
    });
  
    id("addressKTP").addEventListener("input", function () {
      if (id("sameAddress").checked) {
        id("addressCurrent").value = this.value;
      }
    });
  
    if (!id("sameAddress").checked) {
      id("addressCurrent").required = true;
    }
  
    /* ============================================================
       SUBMIT / LANJUT
       ============================================================ */
    id("identityForm").onsubmit = submitIdentity;
  }
  
  /* ============================================================
     SUBMIT IDENTITY — Validasi + Simpan ke appState + localStorage
     ============================================================ */
  function submitIdentity(e) {
    e.preventDefault();
  
    const id = document.getElementById.bind(document);
  
    /* =========================================================
       NICKNAME OTOMATIS (jika kosong → ambil kata pertama nama)
       ========================================================= */
    let nickname = id("nickname").value.trim();
  
    if (!nickname && id("name").value) {
      nickname = id("name").value.trim().split(/\s+/)[0];
      id("nickname").value = nickname;
    }
  
    /* =========================================================
       AMBIL DATA DARI FORM
       ========================================================= */
    const position     = id("position")?.value     || "";
    const education    = id("education")?.value    || "";
    const teacherLevel = position === "Dosen/Guru"      ? (id("teacherLevel")?.value || "") : "";
    const techRole     = position === "Technical Staff" ? (id("techRole")?.value     || "") : "";
  
    /* =========================================================
       SIMPAN KE APP STATE
       ========================================================= */
    appState.identity = {
      name:        id("name").value.trim(),
      nickname:    nickname,
      email:       id("email").value.trim(),
      phone:       id("phone").value.trim(),
      dob:         id("dob").value,
      age:         calculateAge(id("dob").value),
      status:      id("status").value,
      addressKTP:  id("addressKTP").value.trim(),
      addressCurrent: id("sameAddress").checked
        ? id("addressKTP").value.trim()
        : id("addressCurrent").value.trim(),
      sameAddress: id("sameAddress").checked,
  
      position:     position,
      teacherLevel: teacherLevel,
      techRole:     techRole,
  
      alumniSGS:  id("alumniSGS")?.checked  || false,
      alumniSD:   id("alumniSD")?.checked   || false,
      alumniSMP:  id("alumniSMP")?.checked  || false,
      alumniSMA:  id("alumniSMA")?.checked  || false,
      alumniSDText:  id("alumniSDText")?.value  || "",
      alumniSMPText: id("alumniSMPText")?.value || "",
      alumniSMAText: id("alumniSMAText")?.value || "",
  
      education:   education,
      explanation: id("explanation").value.trim(),
      date:        id("date").value
    };
  
    /* =========================================================
       SIMPAN KE LOCAL STORAGE
       ========================================================= */
    localStorage.setItem("identity", JSON.stringify(appState.identity));
  
    /* =========================================================
       LANJUT KE HALAMAN PEMILIHAN TES
       ========================================================= */
    renderTestSelection();
  }
  
  console.log('[CORE-IDENTITY] ✓ Loaded');
