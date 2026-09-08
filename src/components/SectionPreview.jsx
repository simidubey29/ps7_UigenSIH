import React from "react";

function SectionPreview({
  section,
  selectedFieldId,
  onSelectElement,
}) {
  if (!section) {
    return (
      <div className="empty-preview">
        <h2>No section selected</h2>
        <p>Select a section from the left sidebar.</p>
      </div>
    );
  }

  const elements = section.elements || [];

  function handleClick(element) {
    if (onSelectElement) {
      onSelectElement(element);
    }
  }

  function isSelected(element) {
    return (
      selectedFieldId &&
      selectedFieldId === element.fieldId
    );
  }

  function elementStyle(element) {
    const css = element.css || {};

    return {
      color: css.color || undefined,
      fontSize: css.fontSize || undefined,
      fontWeight: css.fontWeight || undefined,
    };
  }

  return (
    <div className="section-preview">

      {/* SECTION HEADER */}

      <div className="preview-section-info">
        <span className="preview-section-type">
          {section.sectionType || "Section"}
        </span>

        <h1>
          {section.sectionName || "Generated Section"}
        </h1>
      </div>


      {/* GENERATED CONTENT */}

      <section className="generated-section">

        {elements.map((element) => {

          const selected =
            isSelected(element);

          const style =
            elementStyle(element);

          const className =
            selected
              ? "preview-element selected"
              : "preview-element";


          /* =========================
             TEXT
          ========================= */

          if (
            element.contentType === "Text"
          ) {

            return (
              <div
                key={element.fieldId}
                className={className}
                style={style}
                onClick={() =>
                  handleClick(element)
                }
              >
                {element.content}
              </div>
            );
          }


          /* =========================
             TEXTFIELD
          ========================= */

          if (
            element.contentType === "Textfield"
          ) {

            return (
              <p
                key={element.fieldId}
                className={className}
                style={style}
                onClick={() =>
                  handleClick(element)
                }
              >
                {element.content}
              </p>
            );
          }


          /* =========================
             IMAGE
          ========================= */

          if (
            element.contentType === "Image"
          ) {

            const image =
              element.content;

            return (
              <div
                key={element.fieldId}
                className={className}
                onClick={() =>
                  handleClick(element)
                }
              >

                <img
                  src={image}
                  alt={
                    element.elementName
                  }
                  className="preview-image"
                  onError={(e) => {
                    e.currentTarget.style.display =
                      "none";
                  }}
                />

                {!image && (
                  <div className="image-placeholder">
                    Image
                  </div>
                )}

              </div>
            );
          }


          /* =========================
             BUTTON
          ========================= */

          if (
            element.contentType === "Button"
          ) {

            return (
              <button
                key={element.fieldId}
                className={
                  selected
                    ? "preview-button selected"
                    : "preview-button"
                }
                style={style}
                onClick={(e) => {
                  e.preventDefault();
                  handleClick(element);
                }}
              >
                {element.content}
              </button>
            );
          }


          /* =========================
             CARDS
          ========================= */

          if (
            element.contentType === "Cards"
          ) {

            const cards =
              element.loop || [];

            return (
              <div
                key={element.fieldId}
                className={
                  selected
                    ? "preview-cards selected"
                    : "preview-cards"
                }
                onClick={() =>
                  handleClick(element)
                }
              >

                {cards.map(
                  (card, index) => (

                    <div
                      className="preview-card"
                      key={index}
                    >

                      <h3>
                        {card.field1 || ""}
                      </h3>

                      <p>
                        {card.field2 || ""}
                      </p>

                    </div>

                  )
                )}

              </div>
            );
          }


          return null;
        })}

      </section>

    </div>
  );
}

export default SectionPreview;