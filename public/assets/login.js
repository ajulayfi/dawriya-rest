(function () {
  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginBtn = document.getElementById("loginBtn");
  const formMessage = document.getElementById("formMessage");
  const togglePassword = document.getElementById("togglePassword");

  function setMessage(message, type = "") {
    formMessage.textContent = message || "";
    formMessage.className = "formMessage";
    if (type) formMessage.classList.add(type);
  }

  function setLoading(isLoading) {
    loginBtn.disabled = isLoading;
    loginBtn.textContent = isLoading ? "جارٍ تسجيل الدخول..." : "دخول";
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function redirectIfAlreadyLoggedIn() {
    try {
      const { data, error } = await supabaseClient.auth.getSession();
      if (error) return;

      const session = data?.session;
      if (!session?.user?.email) return;

      const email = session.user.email.trim().toLowerCase();

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
      console.error("Session check error:", err);
    }
  }

  if (togglePassword) {
    togglePassword.addEventListener("click", function () {
      const isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";
      togglePassword.textContent = isPassword ? "إخفاء" : "إظهار";
    });
  }

  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      setMessage("");

      const email = emailInput.value.trim().toLowerCase();
      const password = passwordInput.value;

      if (!email || !password) {
        setMessage("يرجى تعبئة البريد الإلكتروني وكلمة المرور.", "error");
        return;
      }

      if (!isValidEmail(email)) {
        setMessage("صيغة البريد الإلكتروني غير صحيحة.", "error");
        return;
      }

      setLoading(true);

      try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setMessage("فشل تسجيل الدخول. تأكد من البريد وكلمة المرور.", "error");
          return;
        }

        const userEmail = data?.user?.email?.trim().toLowerCase();

        if (!userEmail) {
          await supabaseClient.auth.signOut();
          setMessage("تعذر التحقق من البريد الإلكتروني.", "error");
          return;
        }

        const { data: adminRow, error: adminError } = await supabaseClient
          .from("allowed_admin_emails")
          .select("email")
          .eq("email", userEmail)
          .maybeSingle();

        if (adminError) {
          await supabaseClient.auth.signOut();
          setMessage("حدث خطأ أثناء التحقق من صلاحية الدخول.", "error");
          return;
        }

        if (!adminRow) {
          await supabaseClient.auth.signOut();
          setMessage("هذا الحساب غير مصرح له بالدخول إلى لوحة الإدارة.", "error");
          return;
        }

        setMessage("تم تسجيل الدخول بنجاح، جارٍ التحويل...", "success");
        window.location.href = "./admin.html";
      } catch (err) {
        console.error("Login error:", err);
        setMessage("حدث خطأ غير متوقع. حاول مرة أخرى.", "error");
      } finally {
        setLoading(false);
      }
    });
  }

  redirectIfAlreadyLoggedIn();
})();
