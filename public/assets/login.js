(function () {
  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const msg = document.getElementById("msg");
  const btn = document.getElementById("loginBtn");
  const togglePassword = document.getElementById("togglePassword");

  function showMessage(text, type = "") {
    msg.textContent = text || "";
    msg.className = "status-message";
    if (type) msg.classList.add(type);
  }

  function setLoading(loading) {
    btn.disabled = loading;
    btn.textContent = loading ? "جارٍ تسجيل الدخول..." : "دخول";
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function checkExistingSession() {
    try {
      const { data, error } = await supabaseClient.auth.getSession();
      if (error) return;

      const session = data?.session;
      const email = session?.user?.email?.trim().toLowerCase();

      if (!email) return;

      const { data: adminRow, error: adminError } = await supabaseClient
        .from("allowed_admin_emails")
        .select("email")
        .eq("email", email)
        .maybeSingle();

      if (!adminError && adminRow) {
        window.location.href = "./admin.html";
        return;
      }

      await supabaseClient.auth.signOut();
    } catch (err) {
      console.error("Session check failed:", err);
    }
  }

  if (togglePassword) {
    togglePassword.addEventListener("click", function () {
      const hidden = passwordInput.type === "password";
      passwordInput.type = hidden ? "text" : "password";
      togglePassword.textContent = hidden ? "إخفاء" : "إظهار";
    });
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    showMessage("");

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

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        showMessage("فشل تسجيل الدخول. تأكد من البريد وكلمة المرور.", "error");
        return;
      }

      const userEmail = data?.user?.email?.trim().toLowerCase();

      if (!userEmail) {
        await supabaseClient.auth.signOut();
        showMessage("تعذر التحقق من الحساب.", "error");
        return;
      }

      const { data: adminRow, error: adminError } = await supabaseClient
        .from("allowed_admin_emails")
        .select("email")
        .eq("email", userEmail)
        .maybeSingle();

      if (adminError) {
        await supabaseClient.auth.signOut();
        showMessage("حدث خطأ أثناء التحقق من الصلاحية.", "error");
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
      showMessage("حدث خطأ غير متوقع. حاول مرة أخرى.", "error");
    } finally {
      setLoading(false);
    }
  });

  checkExistingSession();
})();
