import { useEffect, useState } from "react";

import {
  updateElement
} from "../services/api";


function ElementEditor({
  element,
  onUpdated
}) {

  const [content, setContent] =
    useState("");

  const [color, setColor] =
    useState("#111827");

  const [fontSize, setFontSize] =
    useState("16px");

  const [fontWeight, setFontWeight] =
    useState("400");

  const [cards, setCards] =
    useState([]);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");


  // =================================================
  // LOAD ELEMENT
  // =================================================

  useEffect(() => {

    if (!element) {

      setContent("");
      setCards([]);
      setMessage("");
      setError("");

      return;
    }


    setContent(
      element.content || ""
    );


    const css =
      element.css || {};


    setColor(
      css.color || "#111827"
    );


    setFontSize(
      css.fontSize || "16px"
    );


    setFontWeight(
      css.fontWeight || "400"
    );


    setCards(
      element.loop
        ? JSON.parse(
            JSON.stringify(
              element.loop
            )
          )
        : []
    );


    setMessage("");
    setError("");

  }, [element]);


  // =================================================
  // UPDATE CARD
  // =================================================

  function updateCard(
    index,
    field,
    value
  ) {

    const newCards =
      [...cards];


    newCards[index] = {
      ...newCards[index],
      [field]: value,
    };


    setCards(newCards);
  }


  // =================================================
  // ADD CARD
  // =================================================

  function addCard() {

    setCards([
      ...cards,

      {
        field1: "",
        fieldType1: "Text",
        field2: "",
        fieldType2: "Text",
      }
    ]);
  }


  // =================================================
  // REMOVE CARD
  // =================================================

  function removeCard(index) {

    setCards(
      cards.filter(
        (_, i) => i !== index
      )
    );
  }


  // =================================================
  // SAVE
  // =================================================

  async function handleSave() {

    if (!element?.fieldId) {

      setError(
        "Element fieldId is missing."
      );

      return;
    }


    try {

      setSaving(true);

      setMessage("");
      setError("");


      const css = {
        color,
        fontSize,
        fontWeight,
      };


      const isCards =
        element.contentType ===
        "Cards";


      const result =
        await updateElement(

          element.fieldId,

          content,

          css,

          isCards
            ? cards
            : undefined

        );


      if (onUpdated) {

        onUpdated(
          result.element
        );
      }


      setMessage(
        "Changes saved successfully."
      );


    } catch (err) {

      console.error(err);

      setError(
        err.message
      );

    } finally {

      setSaving(false);
    }
  }


  // =================================================
  // NOTHING SELECTED
  // =================================================

  if (!element) {

    return (
      <div className="editor-empty">

        <div>
          ✏️
        </div>

        <h3>
          Select an element
        </h3>

        <p>
          Click any element in the preview
          to edit it.
        </p>

      </div>
    );
  }


  const isCards =
    element.contentType ===
    "Cards";


  return (

    <div className="element-editor">

      <div className="editor-element-info">

        <span>
          ELEMENT
        </span>

        <strong>
          {element.elementName}
        </strong>

        <small>
          {element.contentType}
        </small>

        <small>
          ID: {element.fieldId}
        </small>

      </div>


      {/* ======================================
          CONTENT
      ======================================= */}

      {!isCards && (

        <div className="editor-field">

          <label>
            Content
          </label>


          {element.contentType ===
            "Textfield" ? (

            <textarea
              value={content}
              onChange={(e) =>
                setContent(
                  e.target.value
                )
              }
            />

          ) : (

            <input
              type="text"
              value={content}
              onChange={(e) =>
                setContent(
                  e.target.value
                )
              }
            />

          )}

        </div>
      )}


      {/* ======================================
          CARDS
      ======================================= */}

      {isCards && (

        <div className="cards-editor">

          <div className="cards-editor-header">

            <h3>
              Cards
            </h3>

            <button
              type="button"
              onClick={addCard}
            >
              + Add
            </button>

          </div>


          {cards.map(
            (card, index) => (

              <div
                className="card-editor"
                key={index}
              >

                <div className="card-editor-top">

                  <strong>
                    Card {index + 1}
                  </strong>

                  <button
                    type="button"
                    onClick={() =>
                      removeCard(index)
                    }
                  >
                    Delete
                  </button>

                </div>


                <label>
                  Title
                </label>

                <input
                  value={
                    card.field1 || ""
                  }
                  onChange={(e) =>
                    updateCard(
                      index,
                      "field1",
                      e.target.value
                    )
                  }
                />


                <label>
                  Description
                </label>

                <textarea
                  value={
                    card.field2 || ""
                  }
                  onChange={(e) =>
                    updateCard(
                      index,
                      "field2",
                      e.target.value
                    )
                  }
                />

              </div>

            )
          )}

        </div>
      )}


      {/* ======================================
          CSS
      ======================================= */}

      <div className="editor-css">

        <h3>
          CSS
        </h3>


        <label>
          Color
        </label>

        <input
          value={color}
          onChange={(e) =>
            setColor(
              e.target.value
            )
          }
        />


        <label>
          Font Size
        </label>

        <input
          value={fontSize}
          onChange={(e) =>
            setFontSize(
              e.target.value
            )
          }
        />


        <label>
          Font Weight
        </label>

        <input
          value={fontWeight}
          onChange={(e) =>
            setFontWeight(
              e.target.value
            )
          }
        />

      </div>


      {error && (

        <div className="editor-error">
          {error}
        </div>

      )}


      {message && (

        <div className="editor-success">
          {message}
        </div>

      )}


      <button
        className="save-button"
        onClick={handleSave}
        disabled={saving}
      >

        {saving
          ? "Saving..."
          : "Save Changes"}

      </button>

    </div>
  );
}


export default ElementEditor;