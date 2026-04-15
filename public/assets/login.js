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

  async function checkExistingSession() {
    try {
      if (!window.supabase) {
        console.error("Supabase library not loaded");
        return;
      }

      if (typeof supabaseClient === "undefined") {
        console.error("supabaseClient is not defined");
        return;
      }

      const { data, error } = await supabaseClient.auth.getSession();

      if (error) {
        console.error("Session check error:", error);
        return;
      }

      const session = data?.session;
      const currentEmail = session?.user?.email?.trim().toLowerCase();

      if (!currentEmail) return;

      const { data: adminRow, error: adminError } = await supabaseClient
        .from("allowed_admin_emails")
        .select("email")
        .eq("email", currentEmail)
        .maybeSingle();

      if (adminError) {
        console.error("Admin check error:", adminError);
        return;
      }

      if (adminRow) {
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

        if (typeof supabaseClient === "undefined") {
          throw new Error("supabaseClient غير معرّف. تحقق من ملف assets/supabase.js");
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

        const { data: adminRow, error: adminError } = await supabaseClient
          .from("allowed_admin_emails")
          .select("email")
          .eq("email", userEmail)
          .maybeSingle();

        if (adminError) {
          showMessage("تعذر التحقق من صلاحية الدخول: " + adminError.message, "error");
          return;
        }

        if (!adminRow) {
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
