(function () {
  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const togglePasswordBtn = document.getElementById("togglePassword");
  const loginBtn = document.getElementById("loginBtn");
  const msg = document.getElementById("msg");

  function showMessage(text, type = "") {
    msg.textContent = text || "";
    msg.className = "status-message";
    if (type) msg.classList.add(type);
  }

  function setLoading(isLoading) {
    loginBtn.disabled = isLoading;
    loginBtn.textContent = isLoading ? "جارٍ تسجيل الدخول..." : "دخول";
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function isAllowedAdmin(email) {
    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabaseClient
      .from("allowed_admin_emails")
      .select("email")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (error) {
      throw new Error("تعذر التحقق من صلاحية الدخول: " + error.message);
    }

    return !!data;
  }

  async function checkExistingSession() {
    try {
      const { data, error } = await supabaseClient.auth.getSession();

      if (error) {
        console.error("Session check error:", error);
        return;
      }

      const currentEmail = data?.session?.user?.email?.trim().toLowerCase();
      if (!currentEmail) return;

      const allowed = await isAllowedAdmin(currentEmail);

      if (allowed) {
        window.location.href = "./admin.html";
        return;
      }

      await supabaseClient.auth.signOut();
    } catch (err) {
      console.error("Unexpected session check error:", err);
    }
  }

  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener("click", function () {
      const isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";
      togglePasswordBtn.textContent = isPassword ? "إخفاء" : "إظهار";
    });
  }

  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      showMessage("");

      try {
        if (!window.supabase) {
          throw new Error("مكتبة Supabase لم يتم تحميلها.");
        }

        if (!window.supabaseClient) {
          throw new Error("supabaseClient غير معرّف. تحقق من assets/supabase.js");
        }

        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;

        if (!email || !password) {
          showMessage("يرجى تعبئة البريد الإلكتروني وكلمة المرور.", "error");
          return;
        }

        if (!isValidEmail(email)) {
          showMessage("صيغة البريد الإلكتروني غير صحيحة.", "error");
          return;
        }

        setLoading(true);

        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          showMessage(error.message || "فشل تسجيل الدخول.", "error");
          return;
        }

        const userEmail = data?.user?.email?.trim().toLowerCase();

        if (!userEmail) {
          await supabaseClient.auth.signOut();
          showMessage("تم تسجيل الدخول لكن تعذر التحقق من البريد الإلكتروني.", "error");
          return;
        }

        const allowed = await isAllowedAdmin(userEmail);

        if (!allowed) {
          await supabaseClient.auth.signOut();
          showMessage("هذا الحساب غير مصرح له بالدخول إلى لوحة الإدارة.", "error");
          return;
        }

        showMessage("تم تسجيل الدخول بنجاح، جارٍ التحويل...", "success");

        setTimeout(() => {
          window.location.href = "./admin.html";
        }, 500);
      } catch (err) {
        console.error("Login error:", err);
        showMessage(err.message || "حدث خطأ غير متوقع. حاول مرة أخرى.", "error");
      } finally {
        setLoading(false);
      }
    });
  }

  checkExistingSession();
})();
