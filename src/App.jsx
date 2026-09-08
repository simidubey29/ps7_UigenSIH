import { useEffect, useState } from "react";
import JSZip from "jszip";
import "./App.css";

import {
  getSections,
  getSection,
  deleteSection,
  updateElement,
  generateSection,
} from "./services/api";


function App() {
  const [sections, setSections] = useState([]);
  const [currentSection, setCurrentSection] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);

  const [showGenerator, setShowGenerator] = useState(true);

  const [loadingSections, setLoadingSections] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [error, setError] = useState("");

  const [previewMode, setPreviewMode] = useState("desktop");

  const [menuSection, setMenuSection] = useState(null);

  const [showCode, setShowCode] = useState(false);

  const [codeTab, setCodeTab] = useState("jsx");

  const [copied, setCopied] = useState(false);

  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);


  // =====================================================
  // LOAD SECTIONS
  // =====================================================

  async function loadSections() {
    try {
      setLoadingSections(true);

      const data = await getSections();

      setSections(data || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoadingSections(false);
    }
  }


  useEffect(() => {
    loadSections();
  }, []);


  // =====================================================
  // OPEN SECTION
  // =====================================================

  async function openSection(sectionId) {
    try {
      setError("");

      const data = await getSection(sectionId);

      const section = {
        ...data.section,

        elements: data.elements || [],

        ir: {
          sectionType: data.section.sectionType,

          elements: (data.elements || []).map((element) => ({
            elementName: element.elementName,
            contentType: element.contentType,
            defaultContent: element.content,
            fieldId: element.fieldId,
            css: element.css,
            loop: element.loop || null,
          })),
        },
      };

      setCurrentSection(section);
      setSelectedElement(null);
      setShowGenerator(false);

      setHistory([]);
      setFuture([]);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }


  // =====================================================
  // GENERATION
  // =====================================================

  async function handleGenerate(formData) {
    try {
      setGenerating(true);
      setError("");

      const data = await generateSection(formData);

      const section = {
        ...data,
        elements: data.elements || [],
      };

      setCurrentSection(section);

      setSelectedElement(null);
      setShowGenerator(false);

      setHistory([]);
      setFuture([]);

      await loadSections();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
        "Unable to generate the UI."
      );
    } finally {
      setGenerating(false);
    }
  }


  // =====================================================
  // SNAPSHOT FOR UNDO
  // =====================================================

  function saveHistory(section) {
    if (!section) return;

    setHistory((previous) => [
      ...previous.slice(-19),
      JSON.parse(JSON.stringify(section)),
    ]);

    setFuture([]);
  }


  // =====================================================
  // SELECT ELEMENT
  // =====================================================

  function handleSelectElement(element) {
    setSelectedElement(element);
  }


  // =====================================================
  // UPDATE ELEMENT
  // =====================================================

  async function handleElementUpdated(updated) {
    if (!currentSection) return;

    saveHistory(currentSection);

    setCurrentSection((previous) => {
      if (!previous) return previous;

      const newElements = previous.elements.map(
        (element) => {
          if (
            String(element.fieldId) ===
            String(updated.fieldId)
          ) {
            return updated;
          }

          return element;
        }
      );

      const newIRElements =
        (previous.ir?.elements || []).map(
          (element) => {
            if (
              String(element.fieldId) ===
              String(updated.fieldId)
            ) {
              return {
                ...element,

                defaultContent:
                  updated.content,

                content:
                  updated.content,

                css:
                  updated.css,

                loop:
                  updated.loop,
              };
            }

            return element;
          }
        );

      return {
        ...previous,

        elements: newElements,

        ir: {
          ...previous.ir,

          elements: newIRElements,
        },
      };
    });

    setSelectedElement(updated);
  }


  // =====================================================
  // UNDO
  // =====================================================

  function undo() {
    if (
      history.length === 0 ||
      !currentSection
    ) {
      return;
    }

    const previous =
      history[history.length - 1];

    setFuture((items) => [
      currentSection,
      ...items,
    ]);

    setCurrentSection(
      JSON.parse(
        JSON.stringify(previous)
      )
    );

    setSelectedElement(null);

    setHistory(
      history.slice(0, -1)
    );
  }


  // =====================================================
  // REDO
  // =====================================================

  function redo() {
    if (
      future.length === 0 ||
      !currentSection
    ) {
      return;
    }

    const next = future[0];

    setHistory((items) => [
      ...items,
      currentSection,
    ]);

    setCurrentSection(
      JSON.parse(
        JSON.stringify(next)
      )
    );

    setSelectedElement(null);

    setFuture(
      future.slice(1)
    );
  }


  // =====================================================
  // DELETE SECTION
  // =====================================================

  async function handleDeleteSection(
    sectionId
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this section?"
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteSection(sectionId);

      setSections((previous) =>
        previous.filter(
          (section) =>
            String(section.sectionId) !==
            String(sectionId)
        )
      );

      if (
        String(currentSection?.sectionId) ===
        String(sectionId)
      ) {
        setCurrentSection(null);
        setSelectedElement(null);
        setShowGenerator(true);
      }

      setMenuSection(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }


  // =====================================================
  // RENAME
  // =====================================================

  function renameSection(section) {
    const newName =
      window.prompt(
        "Enter new section name:",
        section.sectionName || "Section"
      );

    if (!newName) return;

    saveHistory(currentSection);

    const updatedSection = {
      ...section,
      sectionName: newName,
    };

    setSections((previous) =>
      previous.map((item) =>
        String(item.sectionId) ===
        String(section.sectionId)
          ? {
              ...item,
              sectionName: newName,
            }
          : item
      )
    );

    if (
      String(currentSection?.sectionId) ===
      String(section.sectionId)
    ) {
      setCurrentSection(updatedSection);
    }

    setMenuSection(null);
  }


  // =====================================================
  // DUPLICATE
  // =====================================================

  async function duplicateSection(section) {
    try {
      setError("");

      const data = await getSection(
        section.sectionId
      );

      const elements =
        data.elements || [];

      const prompt =
        `Create a ${section.sectionType || "modern"} section named "${section.sectionName || "Generated Section"}". Use the following existing content as inspiration: ${elements
          .map(
            (e) =>
              `${e.elementName}: ${e.content}`
          )
          .join(", ")}`;

      await handleGenerate({
        mode: "prompt",
        prompt,
        pageName:
          section.pageName || "Home",
        sectionName:
          `${section.sectionName || "Section"} Copy`,
      });

      setMenuSection(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }


  // =====================================================
  // MOVE SECTION
  // =====================================================

  function moveSection(sectionId, direction) {
    const index = sections.findIndex(
      (section) =>
        String(section.sectionId) ===
        String(sectionId)
    );

    if (index === -1) return;

    const newIndex =
      direction === "up"
        ? index - 1
        : index + 1;

    if (
      newIndex < 0 ||
      newIndex >= sections.length
    ) {
      return;
    }

    const updated = [...sections];

    const temp = updated[index];

    updated[index] = updated[newIndex];

    updated[newIndex] = temp;

    setSections(updated);

    setMenuSection(null);
  }


  // =====================================================
  // NEW SECTION
  // =====================================================

  function newSection() {
    setCurrentSection(null);
    setSelectedElement(null);
    setShowGenerator(true);
    setShowCode(false);

    setError("");

    setHistory([]);
    setFuture([]);
  }


  // =====================================================
  // CODE GENERATION
  // =====================================================

  function safeName(name) {
    const clean =
      String(name || "GeneratedSection")
        .replace(
          /[^a-zA-Z0-9]/g,
          ""
        );

    return clean || "GeneratedSection";
  }


  function escapeJSX(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }


  function generateJSX() {
    if (!currentSection) {
      return "";
    }

    const componentName =
      safeName(
        currentSection.sectionName
      );

    let jsx = "";

    jsx += `import React from "react";\n\n`;

    jsx += `import "./${componentName}.css";\n\n`;

    jsx += `export default function ${componentName}() {\n`;

    jsx += `  return (\n`;

    jsx += `    <section className="generated-section">\n`;

    (
      currentSection.elements || []
    ).forEach((element) => {
      const content =
        escapeJSX(
          element.content
        );

      const fieldId =
        element.fieldId;

      const css =
        element.css || "";

      const style =
        css
          ? ` style={{${css}}}`
          : "";

      switch (
        element.contentType
      ) {
        case "Text":
          jsx +=
            `      <h2 data-field-id="${fieldId}"${style}>${content}</h2>\n`;
          break;

        case "Textfield":
          jsx +=
            `      <p data-field-id="${fieldId}"${style}>${content}</p>\n`;
          break;

        case "Image":
          jsx +=
            `      <img data-field-id="${fieldId}" className="generated-image" src="${content}" alt="${escapeJSX(element.elementName)}"${style} />\n`;
          break;

        case "Button":
          jsx +=
            `      <button data-field-id="${fieldId}" className="generated-button"${style}>${content}</button>\n`;
          break;

        case "Cards":
          jsx +=
            `      <div data-field-id="${fieldId}" className="generated-cards"${style}>\n`;

          (
            element.loop || []
          ).forEach(
            (card) => {
              jsx +=
                `        <div className="generated-card">\n`;

              jsx +=
                `          <strong>${escapeJSX(card.field1)}</strong>\n`;

              jsx +=
                `          <p>${escapeJSX(card.field2)}</p>\n`;

              jsx +=
                `        </div>\n`;
            }
          );

          jsx +=
            `      </div>\n`;

          break;

        default:
          jsx +=
            `      <div data-field-id="${fieldId}">${content}</div>\n`;
      }
    });

    jsx += `    </section>\n`;

    jsx += `  );\n`;

    jsx += `}\n`;

    return jsx;
  }


  function generateCSS() {
    if (!currentSection) return "";

    let css = `
.generated-section {
  width: 100%;
  min-height: 450px;
  padding: 50px;
  box-sizing: border-box;
  border-radius: 16px;
  background: #ffffff;
  color: #111827;
}

.generated-section h2 {
  font-size: 42px;
  margin-bottom: 20px;
}

.generated-section p {
  font-size: 17px;
  line-height: 1.7;
}

.generated-image {
  max-width: 100%;
  width: 100%;
  max-height: 400px;
  object-fit: cover;
  border-radius: 12px;
  display: block;
  margin: 20px 0;
}

.generated-button {
  padding: 13px 25px;
  border: none;
  border-radius: 8px;
  background: #111827;
  color: white;
  font-weight: 600;
  cursor: pointer;
}

.generated-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 18px;
  margin-top: 25px;
}

.generated-card {
  padding: 20px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}
`;

    (
      currentSection.elements || []
    ).forEach((element) => {
      if (element.css) {
        css += `\n/* ${element.elementName} */\n`;
        css += `/* ${element.css} */\n`;
      }
    });

    return css;
  }


  function generateHTML() {
    if (!currentSection) return "";

    const elements =
      currentSection.elements || [];

    let body = "";

    elements.forEach(
      (element) => {
        const content =
          escapeJSX(element.content);

        switch (
          element.contentType
        ) {
          case "Text":
            body += `<h2>${content}</h2>\n`;
            break;

          case "Textfield":
            body += `<p>${content}</p>\n`;
            break;

          case "Image":
            body += `<img class="generated-image" src="${content}" alt="${element.elementName}" />\n`;
            break;

          case "Button":
            body += `<button class="generated-button">${content}</button>\n`;
            break;

          case "Cards":
            body += `<div class="generated-cards">\n`;

            (
              element.loop || []
            ).forEach(
              (card) => {
                body += `
<div class="generated-card">
  <strong>${escapeJSX(card.field1)}</strong>
  <p>${escapeJSX(card.field2)}</p>
</div>
`;
              }
            );

            body += `</div>\n`;

            break;

          default:
            body += `<div>${content}</div>\n`;
        }
      }
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${currentSection.sectionName || "Generated UI"}</title>
<link rel="stylesheet" href="${safeName(currentSection.sectionName)}.css">
</head>
<body>

<section class="generated-section">
${body}
</section>

</body>
</html>`;
  }


  function generateJSON() {
    return JSON.stringify(
      currentSection,
      null,
      2
    );
  }


  // =====================================================
  // DOWNLOAD FILE
  // =====================================================

  function downloadFile(
    content,
    filename,
    type
  ) {
    const blob =
      new Blob(
        [content],
        { type }
      );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download = filename;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }


  // =====================================================
  // COPY
  // =====================================================

  async function copyCode() {
    let content = "";

    if (codeTab === "jsx") {
      content = generateJSX();
    }

    if (codeTab === "css") {
      content = generateCSS();
    }

    if (codeTab === "html") {
      content = generateHTML();
    }

    if (codeTab === "json") {
      content = generateJSON();
    }

    try {
      await navigator.clipboard.writeText(
        content
      );

      setCopied(true);

      setTimeout(
        () => setCopied(false),
        1500
      );
    } catch (err) {
      console.error(err);
    }
  }


  // =====================================================
  // DOWNLOAD ZIP
  // =====================================================

  async function downloadProject() {
    if (!currentSection) return;

    const zip = new JSZip();

    const componentName =
      safeName(
        currentSection.sectionName
      );

    zip.file(
      `${componentName}.jsx`,
      generateJSX()
    );

    zip.file(
      `${componentName}.css`,
      generateCSS()
    );

    zip.file(
      `${componentName}.html`,
      generateHTML()
    );

    zip.file(
      `${componentName}.json`,
      generateJSON()
    );

    zip.file(
      "README.md",
      `# ${currentSection.sectionName || "Generated UI"}

Generated using TechZen AI UI Generator.

Section Type:
${currentSection.sectionType || "Custom"}

Page:
${currentSection.pageName || "Home"}

Generated files:
- React JSX
- CSS
- HTML
- JSON
`
    );

    const blob =
      await zip.generateAsync({
        type: "blob",
      });

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `${componentName}-project.zip`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }


  // =====================================================
  // EXPORT MENU
  // =====================================================

  function exportFile(type) {
    if (!currentSection) return;

    const name =
      safeName(
        currentSection.sectionName
      );

    if (type === "jsx") {
      downloadFile(
        generateJSX(),
        `${name}.jsx`,
        "text/javascript"
      );
    }

    if (type === "css") {
      downloadFile(
        generateCSS(),
        `${name}.css`,
        "text/css"
      );
    }

    if (type === "html") {
      downloadFile(
        generateHTML(),
        `${name}.html`,
        "text/html"
      );
    }

    if (type === "json") {
      downloadFile(
        generateJSON(),
        `${name}.json`,
        "application/json"
      );
    }

    if (type === "zip") {
      downloadProject();
    }
  }


  // =====================================================
  // GENERATOR UI
  // =====================================================

  function Generator() {
    const [mode, setMode] =
      useState("prompt");

    const [prompt, setPrompt] =
      useState("");

    const [code, setCode] =
      useState("");

    const [pageName, setPageName] =
      useState("Home");

    const [sectionName, setSectionName] =
      useState("Hero");

    const [wireframe, setWireframe] =
      useState(null);

    function submit(e) {
      e.preventDefault();

      if (
        mode === "prompt" &&
        !prompt.trim()
      ) {
        setError(
          "Please describe the UI you want to generate."
        );
        return;
      }

      if (
        mode === "code" &&
        !code.trim()
      ) {
        setError(
          "Please enter React/HTML code."
        );
        return;
      }

      if (
        mode === "wireframe" &&
        !wireframe
      ) {
        setError(
          "Please upload a wireframe image."
        );
        return;
      }

      handleGenerate({
        mode,
        prompt,
        code,
        pageName,
        sectionName,
        wireframe,
      });
    }

    return (
      <div className="generator-card">

        <div className="generator-title">

          <div className="sparkle-icon">
            ✦
          </div>

          <div>
            <h2>
              AI UI Generator
            </h2>

            <p>
              Generate editable UI from
              prompts, wireframes or code.
            </p>
          </div>

        </div>


        <div className="mode-tabs">

          <button
            className={
              mode === "prompt"
                ? "mode-tab active"
                : "mode-tab"
            }
            onClick={() =>
              setMode("prompt")
            }
          >
            ✨ Prompt
          </button>

          <button
            className={
              mode === "wireframe"
                ? "mode-tab active"
                : "mode-tab"
            }
            onClick={() =>
              setMode("wireframe")
            }
          >
            🖼 Wireframe
          </button>

          <button
            className={
              mode === "code"
                ? "mode-tab active"
                : "mode-tab"
            }
            onClick={() =>
              setMode("code")
            }
          >
            &lt;/&gt; Code
          </button>

        </div>


        <form onSubmit={submit}>

          <div className="two-column">

            <div>
              <label>
                Page Name
              </label>

              <input
                value={pageName}
                onChange={(e) =>
                  setPageName(
                    e.target.value
                  )
                }
              />
            </div>

            <div>
              <label>
                Section Name
              </label>

              <input
                value={sectionName}
                onChange={(e) =>
                  setSectionName(
                    e.target.value
                  )
                }
              />
            </div>

          </div>


          {mode === "prompt" && (
            <div className="form-field">

              <label>
                Describe your interface
              </label>

              <textarea
                value={prompt}
                onChange={(e) =>
                  setPrompt(
                    e.target.value
                  )
                }
                placeholder="Example: Create a modern fitness landing page with a large hero heading, description, image, Start Workout button and three feature cards."
              />

              <div className="prompt-suggestions">

                <button
                  type="button"
                  onClick={() =>
                    setPrompt(
                      "Create a modern fitness landing page with a hero heading, description, image, Start Workout button and three feature cards."
                    )
                  }
                >
                  Fitness
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPrompt(
                      "Create a modern restaurant landing page with food image, heading, description, menu button and three popular dishes."
                    )
                  }
                >
                  Restaurant
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPrompt(
                      "Create a SaaS landing page with headline, description, Get Started button and three feature cards."
                    )
                  }
                >
                  SaaS
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPrompt(
                      "Create a professional portfolio hero section with profile image, introduction, skills and View Projects button."
                    )
                  }
                >
                  Portfolio
                </button>

              </div>

            </div>
          )}


          {mode === "code" && (
            <div className="form-field">

              <label>
                React / HTML Code
              </label>

              <textarea
                className="large-code-input"
                value={code}
                onChange={(e) =>
                  setCode(
                    e.target.value
                  )
                }
                placeholder="<section><h1>My Website</h1>...</section>"
              />

            </div>
          )}


          {mode === "wireframe" && (
            <div className="form-field">

              <label>
                Upload Wireframe
              </label>

              <label className="upload-box">

                <div className="upload-icon">
                  🖼
                </div>

                <strong>
                  Click to upload wireframe
                </strong>

                <span>
                  PNG, JPG or JPEG
                </span>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={(e) =>
                    setWireframe(
                      e.target.files?.[0] ||
                      null
                    )
                  }
                />

              </label>

              {wireframe && (
                <div className="selected-file">
                  ✓ {wireframe.name}
                </div>
              )}

            </div>
          )}


          <button
            className="generate-button"
            disabled={generating}
          >
            {generating
              ? "Generating UI..."
              : "✦ Generate UI"}
          </button>

        </form>

      </div>
    );
  }


  // =====================================================
  // EDITOR
  // =====================================================

  function Editor() {
    if (!selectedElement) {
      return (
        <div className="editor-empty">

          <div className="editor-empty-icon">
            ✦
          </div>

          <h3>
            Select an element
          </h3>

          <p>
            Click any heading, text,
            image, button or card in
            the preview to edit it.
          </p>

        </div>
      );
    }

    const element =
      selectedElement;

    let cssObject = {};

    try {
      if (element.css) {
        cssObject = {};
      }
    } catch {
      cssObject = {};
    }

    function updateLocal(
      changes
    ) {
      setSelectedElement(
        (previous) => ({
          ...previous,
          ...changes,
        })
      );
    }

    async function save() {
      try {
        setError("");

        await updateElement(
          element.fieldId,
          element.content,
          element.css || null,
          element.loop
        );

        await handleElementUpdated(
          element
        );
      } catch (err) {
        console.error(err);

        setError(
          err.message
        );
      }
    }

    function addCSS(
      property,
      value
    ) {
      const current =
        element.css || "";

      const regex =
        new RegExp(
          `${property}\\s*:\\s*[^;]+;?`,
          "i"
        );

      const newRule =
        `${property}: ${value};`;

      let newCSS;

      if (regex.test(current)) {
        newCSS =
          current.replace(
            regex,
            newRule
          );
      } else {
        newCSS =
          `${current} ${newRule}`;
      }

      updateLocal({
        css: newCSS.trim(),
      });
    }

    return (
      <div className="editor-panel">

        <div className="selected-info">

          <span>
            ELEMENT
          </span>

          <strong>
            {element.elementName}
          </strong>

          <small>
            Field ID: {element.fieldId}
          </small>

        </div>


        <div className="editor-scroll">

          <div className="editor-section">

            <label>
              Content
            </label>

            {element.contentType ===
            "Text" ? (

              <textarea
                value={
                  element.content || ""
                }
                onChange={(e) =>
                  updateLocal({
                    content:
                      e.target.value,
                  })
                }
              />

            ) : (

              <input
                value={
                  element.content || ""
                }
                onChange={(e) =>
                  updateLocal({
                    content:
                      e.target.value,
                  })
                }
              />

            )}

          </div>


          {element.contentType ===
            "Image" && (

            <div className="editor-section">

              <label>
                Image URL
              </label>

              <input
                value={
                  element.content || ""
                }
                onChange={(e) =>
                  updateLocal({
                    content:
                      e.target.value,
                  })
                }
              />

            </div>
          )}


          <div className="editor-section">

            <h3>
              Appearance
            </h3>


            <label>
              Text Color
            </label>

            <div className="color-row">

              <input
                type="color"
                onChange={(e) =>
                  addCSS(
                    "color",
                    e.target.value
                  )
                }
              />

              <span>
                Choose color
              </span>

            </div>


            <label>
              Background Color
            </label>

            <div className="color-row">

              <input
                type="color"
                onChange={(e) =>
                  addCSS(
                    "background-color",
                    e.target.value
                  )
                }
              />

              <span>
                Choose background
              </span>

            </div>


            <label>
              Font Size
            </label>

            <div className="range-row">

              <input
                type="range"
                min="10"
                max="80"
                defaultValue="18"
                onChange={(e) =>
                  addCSS(
                    "font-size",
                    `${e.target.value}px`
                  )
                }
              />

              <span>
                px
              </span>

            </div>


            <label>
              Font Family
            </label>

            <select
              onChange={(e) =>
                addCSS(
                  "font-family",
                  e.target.value
                )
              }
            >
              <option value="Arial">
                Arial
              </option>

              <option value="Georgia">
                Georgia
              </option>

              <option value="Verdana">
                Verdana
              </option>

              <option value="Trebuchet MS">
                Trebuchet MS
              </option>

              <option value="monospace">
                Monospace
              </option>
            </select>


            <label>
              Text Alignment
            </label>

            <select
              onChange={(e) =>
                addCSS(
                  "text-align",
                  e.target.value
                )
              }
            >
              <option value="left">
                Left
              </option>

              <option value="center">
                Center
              </option>

              <option value="right">
                Right
              </option>
            </select>


            <label>
              Border Radius
            </label>

            <input
              type="number"
              min="0"
              max="100"
              placeholder="8"
              onChange={(e) =>
                addCSS(
                  "border-radius",
                  `${e.target.value}px`
                )
              }
            />


            <label>
              Padding
            </label>

            <input
              type="text"
              placeholder="10px 20px"
              onChange={(e) =>
                addCSS(
                  "padding",
                  e.target.value
                )
              }
            />


            <label>
              Margin
            </label>

            <input
              type="text"
              placeholder="10px"
              onChange={(e) =>
                addCSS(
                  "margin",
                  e.target.value
                )
              }
            />

          </div>


          <div className="editor-section">

            <h3>
              Advanced CSS
            </h3>

            <textarea
              className="css-editor"
              value={
                element.css || ""
              }
              onChange={(e) =>
                updateLocal({
                  css:
                    e.target.value,
                })
              }
              placeholder="color: #111827;
font-size: 30px;
font-weight: 700;"
            />

          </div>


          <button
            className="save-editor-button"
            onClick={save}
          >
            ✓ Save Changes
          </button>

        </div>

      </div>
    );
  }


  // =====================================================
  // PREVIEW ELEMENT
  // =====================================================

  function PreviewElement({
    element,
  }) {
    const selected =
      String(
        selectedElement?.fieldId
      ) ===
      String(element.fieldId);

    const style = {};

    /*
      Simple CSS parser for editor preview.
    */

    if (element.css) {
      element.css
        .split(";")
        .forEach((rule) => {
          const [property, value] =
            rule.split(":");

          if (
            property &&
            value
          ) {
            const camelProperty =
              property
                .trim()
                .replace(
                  /-([a-z])/g,
                  (_, letter) =>
                    letter.toUpperCase()
                );

            style[
              camelProperty
            ] = value.trim();
          }
        });
    }

    function click(e) {
      e.stopPropagation();

      setSelectedElement(
        element
      );
    }

    if (
      element.contentType ===
      "Image"
    ) {
      return (
        <img
          className={
            selected
              ? "preview-element selected preview-image"
              : "preview-element preview-image"
          }
          src={element.content}
          alt={element.elementName}
          style={style}
          onClick={click}
        />
      );
    }


    if (
      element.contentType ===
      "Button"
    ) {
      return (
        <button
          className={
            selected
              ? "preview-element selected preview-button"
              : "preview-element preview-button"
          }
          style={style}
          onClick={click}
        >
          {element.content}
        </button>
      );
    }


    if (
      element.contentType ===
      "Cards"
    ) {
      return (
        <div
          className={
            selected
              ? "preview-element selected preview-cards"
              : "preview-element preview-cards"
          }
          style={style}
          onClick={click}
        >
          {(
            element.loop || []
          ).map(
            (card, index) => (
              <div
                className="preview-card"
                key={index}
              >
                <strong>
                  {card.field1}
                </strong>

                <p>
                  {card.field2}
                </p>
              </div>
            )
          )}
        </div>
      );
    }


    return (
      <div
        className={
          selected
            ? "preview-element selected"
            : "preview-element"
        }
        style={style}
        onClick={click}
      >
        {element.content}
      </div>
    );
  }


  // =====================================================
  // SECTION PREVIEW
  // =====================================================

  function SectionPreview() {
    if (!currentSection) {
      return (
        <div className="empty-preview">
          <div className="empty-preview-icon">
            ✦
          </div>

          <h2>
            No UI generated yet
          </h2>

          <p>
            Use AI to create your first
            editable interface.
          </p>

          <button
            onClick={newSection}
            className="primary-button"
          >
            Generate UI
          </button>
        </div>
      );
    }

    return (
      <div className="preview-wrapper">

        <div className="preview-toolbar">

          <div className="toolbar-left">

            <button
              disabled={
                history.length === 0
              }
              onClick={undo}
              title="Undo"
            >
              ↶
            </button>

            <button
              disabled={
                future.length === 0
              }
              onClick={redo}
              title="Redo"
            >
              ↷
            </button>

          </div>


          <div className="device-switcher">

            <button
              className={
                previewMode ===
                "desktop"
                  ? "device active"
                  : "device"
              }
              onClick={() =>
                setPreviewMode(
                  "desktop"
                )
              }
            >
              🖥 Desktop
            </button>

            <button
              className={
                previewMode ===
                "tablet"
                  ? "device active"
                  : "device"
              }
              onClick={() =>
                setPreviewMode(
                  "tablet"
                )
              }
            >
              ▣ Tablet
            </button>

            <button
              className={
                previewMode ===
                "mobile"
                  ? "device active"
                  : "device"
              }
              onClick={() =>
                setPreviewMode(
                  "mobile"
                )
              }
            >
              📱 Mobile
            </button>

          </div>

        </div>


        <div
          className={`device-frame ${previewMode}`}
        >

          <div className="generated-preview">

            <div className="generated-preview-header">

              <span>
                {currentSection.sectionType ||
                  "Custom"}
              </span>

              <span>
                {(
                  currentSection
                    .elements || []
                ).length} elements
              </span>

            </div>


            <div className="generated-content">

              {(
                currentSection.elements ||
                []
              ).map(
                (element) => (
                  <PreviewElement
                    key={
                      element.fieldId
                    }
                    element={
                      element
                    }
                  />
                )
              )}

            </div>

          </div>

        </div>

      </div>
    );
  }


  // =====================================================
  // CODE PANEL
  // =====================================================

  function CodePanel() {
    if (!showCode) {
      return null;
    }

    let code = "";

    if (codeTab === "jsx") {
      code = generateJSX();
    }

    if (codeTab === "css") {
      code = generateCSS();
    }

    if (codeTab === "html") {
      code = generateHTML();
    }

    if (codeTab === "json") {
      code = generateJSON();
    }

    return (
      <div className="code-panel">

        <div className="code-panel-header">

          <div className="code-tabs">

            {[
              ["jsx", "React JSX"],
              ["css", "CSS"],
              ["html", "HTML"],
              ["json", "JSON"],
            ].map(
              ([key, label]) => (
                <button
                  key={key}
                  className={
                    codeTab === key
                      ? "code-tab active"
                      : "code-tab"
                  }
                  onClick={() =>
                    setCodeTab(key)
                  }
                >
                  {label}
                </button>
              )
            )}

          </div>


          <div className="code-actions">

            <button
              onClick={copyCode}
            >
              {copied
                ? "✓ Copied"
                : "Copy"}
            </button>

            <button
              onClick={() =>
                exportFile(
                  codeTab
                )
              }
            >
              Download
            </button>

          </div>

        </div>


        <pre className="code-display">
          {code}
        </pre>

      </div>
    );
  }


  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <div
      className="app"
      onClick={() =>
        setMenuSection(null)
      }
    >

      {/* HEADER */}

      <header className="top-header">

        <div className="brand">

          <div className="brand-logo">
            ✦
          </div>

          <div>
            <h1>
              TechZen
            </h1>

            <span>
              AI UI Generator
            </span>
          </div>

        </div>


        <div className="header-actions">

          {currentSection && (
            <>

              <button
                className="header-button"
                onClick={() =>
                  setShowCode(
                    !showCode
                  )
                }
              >
                &lt;/&gt; Code
              </button>


              <div className="export-wrapper">

                <button
                  className="header-button primary-header-button"
                  onClick={() =>
                    exportFile("zip")
                  }
                >
                  ↓ Download Project
                </button>

              </div>

            </>
          )}

          <button
            className="header-button"
            onClick={newSection}
          >
            + New UI
          </button>

        </div>

      </header>


      <div className="main-layout">

        {/* SIDEBAR */}

        <aside className="left-sidebar">

          <div className="sidebar-title">
            <span>
              PROJECT
            </span>
          </div>


          <div className="page-item active">
            <span>
              🏠
            </span>

            <div>
              <strong>
                Home
              </strong>

              <small>
                Main Page
              </small>
            </div>
          </div>


          <div className="sections-title">

            <span>
              SECTIONS
            </span>

            <span>
              {sections.length}
            </span>

          </div>


          {loadingSections && (
            <div className="loading">
              Loading sections...
            </div>
          )}


          <div className="section-list">

            {sections.map(
              (section, index) => {

                const selected =
                  String(
                    currentSection?.sectionId
                  ) ===
                  String(
                    section.sectionId
                  );

                return (
                  <div
                    key={
                      section.sectionId
                    }
                    className={
                      selected
                        ? "sidebar-section selected"
                        : "sidebar-section"
                    }
                  >

                    <button
                      className="sidebar-section-main"
                      onClick={() =>
                        openSection(
                          section.sectionId
                        )
                      }
                    >

                      <div className="section-icon">
                        ✦
                      </div>

                      <div className="section-name">

                        <strong>
                          {section.sectionName}
                        </strong>

                        <small>
                          {section.sectionType ||
                            "Custom"}
                        </small>

                      </div>

                    </button>


                    <button
                      className="section-menu-button"
                      onClick={(e) => {
                        e.stopPropagation();

                        setMenuSection(
                          menuSection ===
                          section.sectionId
                            ? null
                            : section.sectionId
                        );
                      }}
                    >
                      ⋮
                    </button>


                    {menuSection ===
                      section.sectionId && (

                      <div
                        className="section-menu"
                        onClick={(e) =>
                          e.stopPropagation()
                        }
                      >

                        <button
                          onClick={() =>
                            renameSection(
                              section
                            )
                          }
                        >
                          ✎ Rename
                        </button>

                        <button
                          onClick={() =>
                            duplicateSection(
                              section
                            )
                          }
                        >
                          ⧉ Duplicate
                        </button>

                        <button
                          disabled={
                            index === 0
                          }
                          onClick={() =>
                            moveSection(
                              section.sectionId,
                              "up"
                            )
                          }
                        >
                          ↑ Move up
                        </button>

                        <button
                          disabled={
                            index ===
                            sections.length - 1
                          }
                          onClick={() =>
                            moveSection(
                              section.sectionId,
                              "down"
                            )
                          }
                        >
                          ↓ Move down
                        </button>

                        <div className="menu-divider" />

                        <button
                          className="danger-menu"
                          onClick={() =>
                            handleDeleteSection(
                              section.sectionId
                            )
                          }
                        >
                          🗑 Delete
                        </button>

                      </div>
                    )}

                  </div>
                );
              }
            )}

          </div>


          <button
            className="sidebar-generate"
            onClick={newSection}
          >
            <span>
              ✦
            </span>

            Generate Section
          </button>

        </aside>


        {/* CENTER */}

        <main className="workspace">

          <div className="workspace-header">

            <div>

              <div className="breadcrumb">
                Home
                <span>
                  /
                </span>

                {currentSection
                  ? currentSection.sectionName
                  : "New Section"}
              </div>

              <h2>
                {currentSection
                  ? currentSection.sectionName
                  : "Create your UI"}
              </h2>

            </div>


            {currentSection && (
              <div className="status-badge">
                <span />
                Saved
              </div>
            )}

          </div>


          {error && (
            <div className="error-banner">
              <span>
                ⚠
              </span>

              {error}

              <button
                onClick={() =>
                  setError("")
                }
              >
                ×
              </button>
            </div>
          )}


          {showGenerator ? (
            <div className="workspace-content">
              <Generator />
            </div>
          ) : (
            <div className="workspace-content">
              <SectionPreview />
              <CodePanel />
            </div>
          )}

        </main>


        {/* RIGHT EDITOR */}

        <aside className="right-editor">

          <div className="editor-header">

            <div>
              <h2>
                Editor
              </h2>

              <span>
                Customize your UI
              </span>
            </div>

            <div className="editor-status">
              ●
            </div>

          </div>

          <Editor />

        </aside>

      </div>

    </div>
  );
}


export default App;