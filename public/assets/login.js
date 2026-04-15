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

    try {
      if (!window.supabase) {
        throw new Error("مكتبة Supabase لم يتم تحميلها.");
      }

      if (typeof supabaseClient === "undefined") {
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
        password
      });

      if (error) {
        showMessage("خطأ تسجيل الدخول: " + error.message, "error");
        return;
      }

      const userEmail = data?.user?.email?.trim().toLowerCase();

      if (!userEmail) {
        await supabaseClient.auth.signOut();
        showMessage("تم الدخول لكن تعذر قراءة البريد الإلكتروني.", "error");
        return;
      }

      const { data: adminRow, error: adminError } = await supabaseClient
        .from("allowed_admin_emails")
        .select("email")
        .eq("email", userEmail)
        .maybeSingle();

      if (adminError) {
        showMessage("خطأ التحقق من الصلاحية: " + adminError.message, "error");
        return;
      }

      if (!adminRow) {
        await supabaseClient.auth.signOut();
        showMessage("هذا البريد غير موجود في allowed_admin_emails", "error");
        return;
      }

      showMessage("تم تسجيل الدخول بنجاح، جارٍ التحويل...", "success");
      setTimeout(() => {
        window.location.href = "./admin.html";
      }, 500);

    } catch (err) {
      console.error(err);
      showMessage("الخطأ الحقيقي: " + (err.message || "Unknown error"), "error");
    } finally {
      setLoading(false);
    }
  });
})();
