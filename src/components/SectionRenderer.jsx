function SectionRenderer({ section }) {
  if (!section?.ir?.elements) {
    return null;
  }

  const elements = section.ir.elements;

  const getElement = (name) => {
    return elements.find(
      (element) => element.elementName === name
    );
  };

  const heading = getElement("HeroHeading");
  const description = getElement("HeroDescription");
  const button = getElement("JoinNowButton");
  const background = getElement("HeroBackgroundImage");

  // Clean Markdown from AI output
  const cleanText = (text) => {
    if (!text) return "";

    return text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\[(.*?)\]\(.*?\)/g, "$1")
      .trim();
  };

  // Clean image URL
  const getImageUrl = (value) => {
  if (!value) return "";

  // Extract URL from Markdown: [text](url)
  const markdownMatch = value.match(/\]\((https?:\/\/.*?)\)/);

  if (markdownMatch) {
    return markdownMatch[1];
  }

  // If it's already a normal URL
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return "";
};

  const imageUrl = getImageUrl(
    background?.defaultContent
  );

  return (
 <section
  className="dynamic-hero"
  style={{
    backgroundImage: imageUrl
      ? `url("${imageUrl}")`
      : "linear-gradient(135deg, #111827, #374151)",
  }}
>

      <div className="hero-overlay">

        <div className="hero-content">

          {heading && (
            <h1>
              {cleanText(heading.defaultContent)}
            </h1>
          )}

          {description && (
            <p>
              {cleanText(description.defaultContent)}
            </p>
          )}

          {button && (
            <button>
              {cleanText(button.defaultContent)}
            </button>
          )}

        </div>

      </div>

    </section>
  );
}

export default SectionRenderer;