import { useState } from "react";
import { generateSection } from "../services/api";

function GeneratorForm({ onGenerated }) {
  const [mode, setMode] = useState("prompt");

  const [prompt, setPrompt] = useState("");
  const [code, setCode] = useState("");
  const [wireframe, setWireframe] = useState(null);

  const [pageName, setPageName] = useState("Home");
  const [sectionName, setSectionName] = useState("Custom");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    setError("");

    // -----------------------------
    // VALIDATION
    // -----------------------------

    if (mode === "prompt" && !prompt.trim()) {
      setError("Enter a prompt.");
      return;
    }

    if (mode === "code" && !code.trim()) {
      setError("Enter your code.");
      return;
    }

    if (mode === "wireframe" && !wireframe) {
      setError("Upload a wireframe.");
      return;
    }

    try {
      setLoading(true);

      console.log("Generating with mode:", mode);

      const data = await generateSection({
        mode,
        prompt: prompt.trim(),
        code: code.trim(),
        pageName,
        sectionName,
        wireframe,
      });

      console.log("Generated section:", data);

      if (!data || data.ok === false) {
        throw new Error(
          data?.message || "Generation failed."
        );
      }

      // Send result to App.jsx
      onGenerated(data);

      // Clear input after successful generation
      if (mode === "prompt") {
        setPrompt("");
      }

      if (mode === "code") {
        setCode("");
      }

      if (mode === "wireframe") {
        setWireframe(null);
      }

    } catch (error) {
      console.error(
        "Generation error:",
        error
      );

      setError(
        error.message ||
        "Something went wrong while generating."
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="generator">

      {/* =================================
          TITLE
      ================================== */}

      <div className="generator-title">

        <h2>
          Generate Section
        </h2>

        <p>
          Create a website section using AI.
        </p>

      </div>


      {/* =================================
          PAGE / SECTION NAME
      ================================== */}

      <div className="generator-row">

        <div className="form-group">

          <label>
            Page Name
          </label>

          <input
            type="text"
            value={pageName}
            onChange={(e) =>
              setPageName(e.target.value)
            }
            placeholder="Home"
          />

        </div>


        <div className="form-group">

          <label>
            Section Name
          </label>

          <input
            type="text"
            value={sectionName}
            onChange={(e) =>
              setSectionName(e.target.value)
            }
            placeholder="Hero"
          />

        </div>

      </div>


      {/* =================================
          MODE SELECTOR
      ================================== */}

      <div className="mode-selector">

        <button
          type="button"
          className={
            mode === "prompt"
              ? "mode active"
              : "mode"
          }
          onClick={() =>
            setMode("prompt")
          }
        >
          Prompt
        </button>


        <button
          type="button"
          className={
            mode === "code"
              ? "mode active"
              : "mode"
          }
          onClick={() =>
            setMode("code")
          }
        >
          Code
        </button>


        <button
          type="button"
          className={
            mode === "wireframe"
              ? "mode active"
              : "mode"
          }
          onClick={() =>
            setMode("wireframe")
          }
        >
          Wireframe
        </button>

      </div>


      {/* =================================
          PROMPT MODE
      ================================== */}

      {mode === "prompt" && (

        <div className="form-group">

          <label>
            Describe your section
          </label>

          <textarea
            value={prompt}
            onChange={(e) =>
              setPrompt(e.target.value)
            }
            placeholder="Create a modern fitness hero section with a heading, description, image, three statistics cards and a Join Now button."
          />

        </div>

      )}


      {/* =================================
          CODE MODE
      ================================== */}

      {mode === "code" && (

        <div className="form-group">

          <label>
            Website Code
          </label>

          <textarea
            className="code-input"
            value={code}
            onChange={(e) =>
              setCode(e.target.value)
            }
            placeholder="<section>...</section>"
          />

        </div>

      )}


      {/* =================================
          WIREFRAME MODE
      ================================== */}

      {mode === "wireframe" && (

        <div className="form-group">

          <label>
            Wireframe Image
          </label>

          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={(e) => {

              const file =
                e.target.files?.[0];

              setWireframe(
                file || null
              );

            }}
          />


          {wireframe && (

            <div className="file-selected">

              <span>
                Selected:
              </span>

              <strong>
                {wireframe.name}
              </strong>

            </div>

          )}

        </div>

      )}


      {/* =================================
          ERROR
      ================================== */}

      {error && (

        <div className="error">

          {error}

        </div>

      )}


      {/* =================================
          GENERATE BUTTON
      ================================== */}

      <button
        type="button"
        className="generate-main-btn"
        onClick={handleGenerate}
        disabled={loading}
      >

        {loading
          ? "Generating..."
          : "Generate Section"}

      </button>

    </div>
  );
}

export default GeneratorForm;