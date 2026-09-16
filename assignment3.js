const STORAGE_KEY = "cop4813Assignment3Form";
const SECURITY_KEY = "cop4813Assignment3Security";
const RECIPIENT_EMAIL = "alexander_albarran@daytonastate.edu";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("contactForm");
    if (form) {
        initializeForm();
        form.addEventListener("submit", handleFormSubmit);
        form.addEventListener("reset", () => {
            setTimeout(() => {
                setSecurityQuestion();
                updateMessageCount();
                clearError();
            }, 0);
        });

        document.getElementById("phone").addEventListener("input", formatPhone);
        document.getElementById("message").addEventListener("input", updateMessageCount);
        document.getElementById("birthdate").addEventListener("change", validateBirthdate);
    }

    const confirmation = document.getElementById("confirmationContent");
    if (confirmation) {
        showConfirmation();
        document.getElementById("emailForm").addEventListener("submit", sendEmail);
    }
});

function initializeForm() {
    const birthdate = document.getElementById("birthdate");
    const today = new Date();
    birthdate.max = formatDateForInput(today);

    setSecurityQuestion();
    updateMessageCount();
}

function setSecurityQuestion() {
    const first = Math.floor(Math.random() * 8) + 2;
    const second = Math.floor(Math.random() * 8) + 2;
    document.getElementById("question").textContent = `${first} + ${second}`;
    sessionStorage.setItem(SECURITY_KEY, String(first + second));
}

function formatPhone(event) {
    let digits = event.target.value.replace(/\D/g, "").slice(0, 10);

    if (digits.length > 6) {
        event.target.value = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length > 3) {
        event.target.value = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else if (digits.length > 0) {
        event.target.value = `(${digits}`;
    } else {
        event.target.value = "";
    }
}

function validateBirthdate() {
    const input = document.getElementById("birthdate");
    const message = document.getElementById("birthdateMessage");

    if (!input.value) {
        message.textContent = "Your birth date cannot be in the future.";
        message.classList.remove("warning");
        return false;
    }

    const birth = new Date(`${input.value}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (birth > today) {
        message.textContent = "Warning: birth date cannot be in the future.";
        message.classList.add("warning");
        return false;
    }

    let age = today.getFullYear() - birth.getFullYear();
    const monthDifference = today.getMonth() - birth.getMonth();
    if (monthDifference < 0 ||
        (monthDifference === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    if (age > 120) {
        message.textContent = "Warning: please enter a reasonable birth date (age cannot exceed 120).";
        message.classList.add("warning");
        return false;
    }

    message.textContent = `Birth date accepted. Approximate age: ${age}.`;
    message.classList.remove("warning");
    return true;
}

function updateMessageCount() {
    const message = document.getElementById("message");
    const count = document.getElementById("messageCount");
    if (message && count) {
        count.textContent = message.value.length;
    }
}

function handleFormSubmit(event) {
    event.preventDefault();
    clearError();

    const form = event.currentTarget;

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    if (!validateBirthdate()) {
        showError("Please correct your birth date before continuing.");
        document.getElementById("birthdate").focus();
        return;
    }

    const expectedAnswer = sessionStorage.getItem(SECURITY_KEY);
    const enteredAnswer = document.getElementById("securityAnswer").value.trim();

    if (!expectedAnswer || enteredAnswer !== expectedAnswer) {
        showError("The security answer is incorrect. Please answer the question correctly.");
        document.getElementById("securityAnswer").focus();
        return;
    }

    const data = {
        firstName: document.getElementById("firstName").value.trim(),
        lastName: document.getElementById("lastName").value.trim(),
        address: document.getElementById("address").value.trim(),
        city: document.getElementById("city").value.trim(),
        state: document.getElementById("state").value,
        zip: document.getElementById("zip").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        email: document.getElementById("email").value.trim(),
        birthdate: document.getElementById("birthdate").value,
        message: document.getElementById("message").value.trim()
    };

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.location.href = "confirmation.html";
}

function showConfirmation() {
    const content = document.getElementById("confirmationContent");
    const stored = sessionStorage.getItem(STORAGE_KEY);

    if (!stored) {
        content.innerHTML = `
            <div class="empty-state">
                <h3>No form information found</h3>
                <p>Please return to the form and enter your information first.</p>
                <a class="button" href="assignment3.html">Return to Form</a>
            </div>`;
        document.getElementById("confirmButton").disabled = true;
        return;
    }

    const data = JSON.parse(stored);

    content.innerHTML = `
        <div class="review-row"><span>Name</span><strong>${escapeHTML(data.firstName)} ${escapeHTML(data.lastName)}</strong></div>
        <div class="review-row"><span>Address</span><strong>${escapeHTML(data.address)}, ${escapeHTML(data.city)}, ${escapeHTML(data.state)} ${escapeHTML(data.zip)}</strong></div>
        <div class="review-row"><span>Phone</span><strong>${escapeHTML(data.phone)}</strong></div>
        <div class="review-row"><span>Email</span><strong>${escapeHTML(data.email)}</strong></div>
        <div class="review-row"><span>Birth Date</span><strong>${escapeHTML(formatDate(data.birthdate))}</strong></div>
        <div class="review-message"><span>Message</span><p>${escapeHTML(data.message).replace(/\n/g, "<br>")}</p></div>
    `;
}

function sendEmail(event) {
    event.preventDefault();

    const stored = sessionStorage.getItem(STORAGE_KEY);
    const error = document.getElementById("confirmationError");

    if (!stored) {
        error.textContent = "No form data is available to send.";
        return;
    }

    if (!RECIPIENT_EMAIL || RECIPIENT_EMAIL === "YOUR_EMAIL@example.com") {
        error.textContent = "The form email address has not been configured yet.";
        return;
    }

    const data = JSON.parse(stored);
    const emailForm = document.getElementById("emailForm");

    emailForm.action = `mailto:${RECIPIENT_EMAIL}`;
    document.getElementById("mailName").value =
        `${data.firstName} ${data.lastName}`;
    document.getElementById("mailAddress").value =
        `${data.address}, ${data.city}, ${data.state} ${data.zip}`;
    document.getElementById("mailPhone").value = data.phone;
    document.getElementById("mailEmail").value = data.email;
    document.getElementById("mailBirthdate").value = formatDate(data.birthdate);
    document.getElementById("mailMessage").value = data.message;

    emailForm.submit();
}

function formatDate(value) {
    const date = new Date(`${value}T00:00:00`);
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[character]));
}

function showError(message) {
    const error = document.getElementById("formError");
    error.textContent = message;
    error.classList.add("visible");
}

function clearError() {
    const error = document.getElementById("formError");
    if (error) {
        error.textContent = "";
        error.classList.remove("visible");
    }

    const confirmationError = document.getElementById("confirmationError");
    if (confirmationError) {
        confirmationError.textContent = "";
    }
}
