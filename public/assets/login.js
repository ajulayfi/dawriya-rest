const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const msg = document.getElementById("msg");
const btn = document.getElementById("loginBtn");

function showMessage(text, type = "") {
  msg.textContent = text;
  msg.style.color = type === "error" ? "red" : "green";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;

  if (!email || !password) {
    showMessage("عبّ البيانات", "error");
    return;
  }

  btn.disabled = true;
  btn.textContent = "جارٍ الدخول...";

  // تسجيل الدخول
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    showMessage("خطأ في تسجيل الدخول", "error");
    btn.disabled = false;
    btn.textContent = "دخول";
    return;
  }

  const userEmail = data.user.email;

  // تحقق من أنه أدمن
  const { data: admin } = await supabaseClient
    .from("allowed_admin_emails")
    .select("email")
    .eq("email", userEmail)
    .maybeSingle();

  if (!admin) {
    await supabaseClient.auth.signOut();
    showMessage("غير مصرح لك", "error");
    btn.disabled = false;
    btn.textContent = "دخول";
    return;
  }

  showMessage("تم الدخول بنجاح");

  // تحويل
  window.location.href = "./admin.html";
});
