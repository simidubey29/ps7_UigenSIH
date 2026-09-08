const API_BASE_URL =
  "http://127.0.0.1:8000/api";


// =====================================================
// GENERATE
// =====================================================

export async function generateSection({
  mode,
  prompt,
  code,
  pageName = "Home",
  sectionName = "Custom",
  wireframe,
}) {
  const formData =
    new FormData();

  formData.append(
    "mode",
    mode
  );

  formData.append(
    "pageName",
    pageName
  );

  formData.append(
    "sectionName",
    sectionName
  );


  if (prompt) {
    formData.append(
      "prompt",
      prompt
    );
  }


  if (code) {
    formData.append(
      "code",
      code
    );
  }


  if (wireframe) {
    formData.append(
      "wireframe",
      wireframe
    );
  }


  const response =
    await fetch(
      `${API_BASE_URL}/generate`,
      {
        method: "POST",
        body: formData,
      }
    );


  let data;

  try {
    data =
      await response.json();
  } catch {
    throw new Error(
      `Server returned invalid response (${response.status})`
    );
  }


  if (!response.ok) {
    throw new Error(
      data.detail ||
      data.message ||
      `Generation failed (${response.status})`
    );
  }


  if (data.ok === false) {
    throw new Error(
      data.message ||
      "Generation failed"
    );
  }


  return data;
}


// =====================================================
// GET ALL SECTIONS
// =====================================================

export async function getSections() {
  const response =
    await fetch(
      `${API_BASE_URL}/sections`
    );


  const data =
    await response.json();


  if (!response.ok) {
    throw new Error(
      data.detail ||
      "Failed to load sections"
    );
  }


  return data;
}


// =====================================================
// GET SECTION
// =====================================================

export async function getSection(
  sectionId
) {
  const response =
    await fetch(
      `${API_BASE_URL}/sections/${sectionId}`
    );


  const data =
    await response.json();


  if (!response.ok) {
    throw new Error(
      data.detail ||
      "Failed to load section"
    );
  }


  return data;
}


// =====================================================
// UPDATE ELEMENT
// =====================================================

export async function updateElement(
  fieldId,
  content,
  css,
  loop = undefined
) {
  if (!fieldId) {
    throw new Error(
      "fieldId is missing"
    );
  }


  const body = {
    content,
    css,
  };


  if (
    loop !== undefined
  ) {
    body.loop = loop;
  }


  const response =
    await fetch(
      `${API_BASE_URL}/elements/${fieldId}`,
      {
        method: "PUT",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(body),
      }
    );


  const data =
    await response.json();


  if (!response.ok) {
    throw new Error(
      data.detail ||
      data.message ||
      "Element update failed"
    );
  }


  return data;
}


// =====================================================
// DELETE SECTION
// =====================================================

export async function deleteSection(
  sectionId
) {
  const response =
    await fetch(
      `${API_BASE_URL}/sections/${sectionId}`,
      {
        method: "DELETE",
      }
    );


  const data =
    await response.json();


  if (!response.ok) {
    throw new Error(
      data.detail ||
      "Failed to delete section"
    );
  }


  return data;
}